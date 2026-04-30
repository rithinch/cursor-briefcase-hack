"""
Pulp intent processing pipeline — LangGraph stateful workflow.

Graph shape:
  validate → route_approval ─┬─ auto_pay    → select_rail → execute_payment → reconcile → END
                              └─ require_human → await_approval ────────────────────────────┘
               validate → reject → END
"""

from __future__ import annotations

from decimal import Decimal
from typing import TypedDict, Literal

from langgraph.graph import StateGraph, END
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from langgraph.types import interrupt

from agents.validation import run_validation_agent
from agents.approval_router import run_approval_router_agent
from agents.rail_selector import select_rail
from agents.reconciliation import run_reconciliation
from rails.base import PaymentRail
from db.repos import (SessionLocal, update_intent_status,
                       create_payment, update_payment, get_payment_by_intent,
                       get_application)
from core.security import create_approval_token
from core.logging import log
import structlog


# ---------- State ----------

class IntentState(TypedDict):
    intent_id:       str
    intent:          dict
    invoice:         dict
    application_id:  str | None
    validation:      dict | None
    approval:        dict | None
    selected_rail:   str | None
    rail_reasoning:  str | None
    payment:         dict | None
    reconciliation:  dict | None
    error:           str | None


# ---------- Rail registry (set at startup) ----------

_rails: list[PaymentRail] = []


def configure_rails(rails: list[PaymentRail]) -> None:
    global _rails
    _rails = rails


# ---------- Nodes ----------

async def validate_node(state: IntentState) -> IntentState:
    structlog.contextvars.bind_contextvars(intent_id=state["intent_id"])
    try:
        result = await run_validation_agent(state["intent"], state["invoice"])
    except Exception as exc:
        log.error("validation.error", error=str(exc))
        return {**state, "error": str(exc), "validation": {"result": "reject"}}
    return {**state, "validation": result}


async def approval_router_node(state: IntentState) -> IntentState:
    try:
        result = await run_approval_router_agent(state["intent"], state["validation"])
    except Exception as exc:
        log.error("approval_router.error", error=str(exc))
        result = {"decision": "require_human",
                  "reasoning": f"error in router: {exc}",
                  "approver_email": state["intent"].get("approval_policy", {}).get("approver_email")}
    return {**state, "approval": result}


async def await_approval_node(state: IntentState) -> IntentState:
    """Graph pauses here. Resumes when POST /approve is called."""
    intent_id  = state["intent_id"]
    account_id = state["intent"]["account_id"]

    async with SessionLocal() as db:
        payment = await get_payment_by_intent(db, intent_id)
        if payment is None:
            payment = await create_payment(db, account_id=account_id,
                                           intent_id=intent_id, invoice_id=None)

    # Reuse existing token if already generated, otherwise mint a fresh one
    existing_token = (payment.approval or {}).get("token") if payment.approval else None
    if existing_token and payment.token_jti:
        token, jti = existing_token, payment.token_jti
    else:
        token, jti = create_approval_token(intent_id, payment.id)
        async with SessionLocal() as db:
            await update_payment(db, payment.id, token_jti=jti, status="pending_approval",
                                 approval={"approver_email": state["approval"].get("approver_email"),
                                           "token": token})

    from core.config import settings
    approval_url = f"{settings.API_BASE_URL}/v1/payments/{payment.id}/approve?token={token}"
    log.info("approval.waiting",
             intent_id=intent_id,
             payment_id=payment.id,
             approver=state["approval"].get("approver_email"),
             approval_url=approval_url)
    print(f"\n{'='*60}\nAPPROVAL REQUIRED\n  payment_id : {payment.id}\n  token      : {token}\n  URL        : POST {approval_url}\n{'='*60}\n")

    # Send WhatsApp notification if approver_phone is configured
    application_id = state.get("application_id")
    if application_id:
        async with SessionLocal() as db:
            app = await get_application(db, application_id)
        approver_phone = (app.policies or {}).get("approver_phone") if app else None
        if approver_phone:
            from core.whatsapp import send_approval_whatsapp
            _base = (settings.DEPLOYED_BASE_URL or settings.API_BASE_URL).rstrip("/")
            whatsapp_url = f"{_base}/v1/payments/{payment.id}/approve?token={token}"
            send_approval_whatsapp(
                phone=approver_phone,
                intent_id=intent_id,
                approval_url=whatsapp_url,
                amount=state["intent"].get("amount", {}),
                vendor=state["intent"].get("vendor", {}),
            )

    interrupt("pending_human_approval")
    return {**state, "payment": {"id": payment.id, "status": "pending_approval"}}


async def rail_selector_node(state: IntentState) -> IntentState:
    amount   = Decimal(str(state["invoice"].get("amount", 0)))
    currency = state["intent"].get("amount", {}).get("currency", "GBP")
    country  = state["intent"].get("recipient_country", "GB")
    rail, reasoning = await select_rail(amount, currency, country, _rails)
    return {**state, "selected_rail": rail.rail_id, "rail_reasoning": reasoning}


async def execute_payment_node(state: IntentState) -> IntentState:
    intent_id  = state["intent_id"]
    account_id = state["intent"]["account_id"]
    rail = next((r for r in _rails if r.rail_id == state["selected_rail"]), _rails[0])
    idempotency_key = f"{intent_id}:pay:v1"
    amount    = Decimal(str(state["invoice"].get("amount", 0)))
    currency  = state["intent"].get("amount", {}).get("currency", "GBP")
    recipient = state["intent"].get("vendor", {})

    try:
        result  = await rail.execute(amount, currency, recipient, idempotency_key)
        execution = result.__dict__
    except NotImplementedError:
        execution = {"provider_payment_id": f"stub_{idempotency_key}",
                     "status": "completed", "rail_id": rail.rail_id}

    # Ensure a Payment DB row exists (auto_pay path has none yet; require_human created one earlier)
    async with SessionLocal() as db:
        db_payment = await get_payment_by_intent(db, intent_id)
        if db_payment is None:
            db_payment = await create_payment(db, account_id=account_id,
                                              intent_id=intent_id, invoice_id=None)
        await update_payment(db, db_payment.id, status="completed",
                             amount=amount, currency=currency,
                             rail_id=rail.rail_id,
                             execution=execution)

    payment = {"id": db_payment.id, **execution}
    log.info("payment.executed", intent_id=intent_id, payment_id=db_payment.id, **execution)
    return {**state, "payment": payment}


async def reconcile_node(state: IntentState) -> IntentState:
    intent_id      = state["intent_id"]
    application_id = state.get("application_id")
    payment        = state.get("payment", {})
    payment_db_id  = payment.get("id")  # set by execute_payment_node

    try:
        await run_reconciliation(
            payment_id=payment_db_id,
            application_id=application_id,
            payment_data={**payment, "intent_id": intent_id},
        )
        rec_summary = {"status": "completed", "application_id": application_id}
    except Exception as exc:
        log.error("reconciliation.node.error", intent_id=intent_id, error=str(exc))
        rec_summary = {"status": "failed", "error": str(exc)}

    # update intent to final status
    final_status = "reconciled" if rec_summary["status"] == "completed" else "completed"
    async with SessionLocal() as db:
        await update_intent_status(db, intent_id, final_status)

    log.info("intent.finalised", intent_id=intent_id, status=final_status)
    return {**state, "reconciliation": rec_summary}


# ---------- Routing ----------

def route_validation(state: IntentState) -> Literal["route_approval", "__end__"]:
    if state.get("validation", {}).get("result") in ("pass", "review"):
        return "route_approval"
    log.info("validation.rejected", intent_id=state["intent_id"])
    return END


def route_approval(state: IntentState) -> Literal["await_approval", "select_rail"]:
    return (
        "await_approval"
        if state.get("approval", {}).get("decision") == "require_human"
        else "select_rail"
    )


# ---------- Graph builder ----------

def build_graph(checkpointer: AsyncPostgresSaver):
    builder = StateGraph(IntentState)

    builder.add_node("validate",         validate_node)
    builder.add_node("route_approval",   approval_router_node)
    builder.add_node("await_approval",   await_approval_node)
    builder.add_node("select_rail",      rail_selector_node)
    builder.add_node("execute_payment",  execute_payment_node)
    builder.add_node("reconcile",        reconcile_node)

    builder.set_entry_point("validate")
    builder.add_conditional_edges("validate",       route_validation, {
        "route_approval": "route_approval",
        END:              END,
    })
    builder.add_conditional_edges("route_approval", route_approval, {
        "await_approval": "await_approval",
        "select_rail":    "select_rail",
    })
    builder.add_edge("await_approval",  "select_rail")
    builder.add_edge("select_rail",     "execute_payment")
    builder.add_edge("execute_payment", "reconcile")
    builder.add_edge("reconcile",       END)

    return builder.compile(checkpointer=checkpointer)
