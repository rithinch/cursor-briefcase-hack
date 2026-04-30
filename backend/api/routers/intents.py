from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from db.repos import SessionLocal, create_intent, get_intent, update_intent_status, append_event
from core.logging import log

router = APIRouter(prefix="/v1/intents", tags=["intents"])


class VendorIn(BaseModel):
    name: str
    email: str


class AmountIn(BaseModel):
    expected: float
    currency: str = "GBP"
    tolerance_pct: float = 10.0


class ContextIn(BaseModel):
    description: str
    job_id: str | None = None
    reference: str | None = None
    category: str = "maintenance"


class PolicyOverrideIn(BaseModel):
    auto_pay_threshold: float | None = None
    auto_pay_min_confidence: float | None = None
    approver_email: str | None = None


class CreateIntentRequest(BaseModel):
    vendor: VendorIn
    amount: AmountIn
    context: ContextIn
    policy_override: PolicyOverrideIn | None = None
    expires_in_days: int = 30
    metadata: dict = Field(default_factory=dict)


@router.post("", status_code=201)
async def create(req: CreateIntentRequest, request: Request):
    account = request.state.account
    expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)

    async with SessionLocal() as db:
        intent = await create_intent(
            db,
            account_id=account.id,
            vendor=req.vendor.model_dump(),
            amount=req.amount.model_dump(),
            context=req.context.model_dump(),
            policy_override=req.policy_override.model_dump(exclude_none=True) if req.policy_override else None,
            expires_at=expires_at,
        )
        await append_event(db, account_id=account.id, type_="intent.created",
                           intent_id=intent.id, object_type="intent", object_id=intent.id)

    inbound_email = f"invoices-{account.id}@inbound.pulp.io"
    log.info("intent.created", intent_id=intent.id, vendor=req.vendor.email)

    return {
        "id":                   intent.id,
        "status":               intent.status,
        "vendor":               intent.vendor,
        "amount":               intent.amount,
        "invoice_inbound_email": inbound_email,
        "expires_at":           intent.expires_at.isoformat() if intent.expires_at else None,
        "created_at":           intent.created_at.isoformat(),
    }


@router.get("/{intent_id}")
async def get(intent_id: str, request: Request):
    async with SessionLocal() as db:
        intent = await get_intent(db, intent_id, request.state.account_id)

    if intent is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            detail={"error": {"code": "intent_not_found",
                                              "message": f"No intent {intent_id}"}})

    timeline = []
    if intent.events:
        for ev in sorted(intent.events, key=lambda e: e.created_at):
            if "intent" in ev.type or "invoice" in ev.type or "payment" in ev.type:
                timeline.append({"status": ev.type, "at": ev.created_at.isoformat()})

    return {
        "id":         intent.id,
        "status":     intent.status,
        "vendor":     intent.vendor,
        "amount":     intent.amount,
        "context":    intent.context,
        "invoice":    _summarise_invoice(intent.invoice),
        "payment":    _summarise_payment(intent.payment),
        "timeline":   timeline,
        "created_at": intent.created_at.isoformat(),
    }


def _summarise_invoice(inv) -> dict | None:
    if inv is None:
        return None
    return {
        "id": inv.id,
        "status": inv.status,
        "amount": inv.parsed.get("amount") if inv.parsed else None,
        "blob_url": inv.blob_url,
        "company_verification": getattr(inv, "company_verification", None),
    }


def _summarise_payment(pay) -> dict | None:
    if pay is None:
        return None
    result = {"id": pay.id, "status": pay.status, "rail": pay.rail_id}
    if pay.status == "pending_approval" and pay.approval:
        token = pay.approval.get("token")
        if token:
            result["approval_url"] = f"/v1/payments/{pay.id}/approve?token={token}"
    return result
