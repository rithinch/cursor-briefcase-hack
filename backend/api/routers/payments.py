from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, status, Query
from db.repos import (SessionLocal, get_payment, update_payment,
                      consume_approval_token, append_event, update_intent_status)
from core.security import decode_approval_token
from core.logging import log
from langgraph.types import Command
import jwt

router = APIRouter(prefix="/v1/payments", tags=["payments"])

_graph = None

def set_graph(graph) -> None:
    global _graph
    _graph = graph


@router.post("/{payment_id}/approve")
async def approve(
    payment_id: str,
    request: Request,
    background_tasks: BackgroundTasks,
    token: str = Query(...),
):
    try:
        claims = decode_approval_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status.HTTP_410_GONE,
                            detail={"error": {"code": "token_expired"}})
    except jwt.InvalidTokenError:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail={"error": {"code": "token_invalid"}})

    account_id = request.state.account_id

    async with SessionLocal() as db:
        consumed = await consume_approval_token(db, payment_id, claims.jti)
        if not consumed:
            raise HTTPException(status.HTTP_409_CONFLICT,
                                detail={"error": {"code": "token_already_used"}})

        await update_payment(db, payment_id, status="payment_authorised",
                             approval={"approved_at": "now", "approved_by": "approver"})
        await update_intent_status(db, claims.intent_id, "payment_authorised")
        await append_event(db, account_id=account_id, type_="payment.approved",
                           intent_id=claims.intent_id,
                           object_type="payment", object_id=payment_id)

    log.info("payment.approved", payment_id=payment_id, intent_id=claims.intent_id)

    thread = {"configurable": {"thread_id": claims.intent_id}}
    background_tasks.add_task(_resume_pipeline, claims.intent_id, thread)

    return {"status": "approved", "payment_id": payment_id}


async def _resume_pipeline(intent_id: str, thread: dict) -> None:
    try:
        log.info("pipeline.resuming", intent_id=intent_id)
        # LangGraph interrupts require Python 3.11+ in async contexts.
        # Our graph ends after awaiting approval, so we resume by continuing
        # from the persisted state snapshot.
        snapshot = await _graph.aget_state(config=thread)
        state = snapshot.values or {}
        from graph.pipeline import rail_selector_node, execute_payment_node, reconcile_node

        state = await rail_selector_node(state)
        state = await execute_payment_node(state)
        state = await reconcile_node(state)
        log.info("pipeline.resume_complete", intent_id=intent_id)
    except Exception as exc:
        log.error("pipeline.resume_error", intent_id=intent_id, error=str(exc), exc_info=True)


@router.post("/{payment_id}/reject")
async def reject(
    payment_id: str,
    request: Request,
    token: str = Query(...),
    reason: str = Query(default=""),
):
    try:
        claims = decode_approval_token(token)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            detail={"error": {"code": "token_invalid", "message": str(exc)}})

    account_id = request.state.account_id

    async with SessionLocal() as db:
        consumed = await consume_approval_token(db, payment_id, claims.jti)
        if not consumed:
            raise HTTPException(status.HTTP_409_CONFLICT,
                                detail={"error": {"code": "token_already_used"}})

        await update_payment(db, payment_id, status="rejected")
        await update_intent_status(db, claims.intent_id, "failed")
        await append_event(db, account_id=account_id, type_="payment.rejected",
                           intent_id=claims.intent_id, data={"reason": reason})

    log.info("payment.rejected", payment_id=payment_id, reason=reason)
    return {"status": "rejected", "payment_id": payment_id}


@router.get("/{payment_id}")
async def get(payment_id: str, request: Request):
    async with SessionLocal() as db:
        payment = await get_payment(db, payment_id, request.state.account_id)

    if payment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            detail={"error": {"code": "payment_not_found"}})

    return {
        "id":           payment.id,
        "status":       payment.status,
        "intent_id":    payment.intent_id,
        "amount":       str(payment.amount) if payment.amount else None,
        "currency":     payment.currency,
        "rail":         payment.rail_id,
        "rail_reasoning": payment.rail_reasoning,
        "approval":     payment.approval,
        "execution":    payment.execution,
        "created_at":   payment.created_at.isoformat(),
    }
