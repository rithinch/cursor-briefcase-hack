import hashlib
import secrets
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from db.repos import (SessionLocal, get_user, create_application, get_application,
                      list_applications, update_application, list_intents)

router = APIRouter(tags=["applications"])

_DEFAULT_POLICIES = {
    "auto_pay_threshold":        500,
    "auto_pay_min_confidence":   0.90,
    "auto_pay_known_vendors_only": True,
    "always_approve_below":      5000,
    "approver_email":            None,
    "approver_phone":            None,
    "approval_timeout_hours":    48,
    "fraud_signal_override":     True,
}

_DEFAULT_CONTROLS = {
    "allowed_rails":      ["mock"],
    "max_payment_amount": 50000,
    "allowed_currencies": ["GBP"],
    "blocked_countries":  [],
}


class CreateApplicationRequest(BaseModel):
    name: str
    policies: dict = _DEFAULT_POLICIES
    controls: dict = _DEFAULT_CONTROLS


class UpdateApplicationRequest(BaseModel):
    name: str | None = None
    status: str | None = None
    policies: dict | None = None
    controls: dict | None = None


@router.post("/v1/users/{user_id}/applications", status_code=201, tags=["applications"])
async def create(user_id: str, req: CreateApplicationRequest):
    async with SessionLocal() as db:
        user = await get_user(db, user_id)
        if user is None or user.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "user_not_found"}})

        raw_key = f"pk_live_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        app = await create_application(
            db, user_id=user_id, name=req.name,
            api_key_hash=key_hash,
            policies=req.policies, controls=req.controls,
        )

    return {**_fmt(app), "api_key": raw_key}  # only returned once at creation


@router.get("/v1/users/{user_id}/applications", tags=["applications"])
async def list_for_user(user_id: str):
    async with SessionLocal() as db:
        user = await get_user(db, user_id)
        if user is None or user.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "user_not_found"}})
        apps = await list_applications(db, user_id)
    return {"data": [_fmt(a) for a in apps]}


@router.get("/v1/applications/{app_id}", tags=["applications"])
async def get(app_id: str):
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
    if app is None or app.status == "deleted":
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            detail={"error": {"code": "application_not_found"}})
    return _fmt(app)


@router.patch("/v1/applications/{app_id}", tags=["applications"])
async def patch(app_id: str, req: UpdateApplicationRequest):
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
        if app is None or app.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "application_not_found"}})
        updates = req.model_dump(exclude_none=True)
        if updates:
            await update_application(db, app_id, **updates)
        app = await get_application(db, app_id)
    return _fmt(app)


@router.delete("/v1/applications/{app_id}", status_code=204, tags=["applications"])
async def delete(app_id: str):
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
        if app is None or app.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "application_not_found"}})
        await update_application(db, app_id, status="deleted")


@router.post("/v1/applications/{app_id}/rotate-key", tags=["applications"])
async def rotate_key(app_id: str):
    """Issue a new API key. The old key stops working immediately."""
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
        if app is None or app.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "application_not_found"}})
        raw_key = f"pk_live_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        await update_application(db, app_id, api_key_hash=key_hash)
    return {"api_key": raw_key}


@router.get("/v1/applications/{app_id}/intents", tags=["applications"])
async def list_app_intents(app_id: str, limit: int = 100, offset: int = 0):
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
        if app is None or app.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "application_not_found"}})
        intents = await list_intents(db, account_id=app_id, limit=limit, offset=offset)
    return {"data": [_fmt_intent(i) for i in intents]}


def _fmt_intent(intent) -> dict:
    approval_url = None
    if intent.payment and intent.payment.status == "pending_approval" and intent.payment.approval:
        token = intent.payment.approval.get("token")
        if token:
            approval_url = f"/v1/payments/{intent.payment.id}/approve?token={token}"

    return {
        "id":         intent.id,
        "status":     intent.status,
        "vendor":     intent.vendor,
        "amount":     intent.amount,
        "context":    intent.context,
        "invoice":    {
            "id": intent.invoice.id,
            "status": intent.invoice.status,
            "blob_url": intent.invoice.blob_url,
            "company_verification": getattr(intent.invoice, "company_verification", None),
        } if intent.invoice else None,
        "payment":    {
            "id": intent.payment.id,
            "status": intent.payment.status,
            "rail": intent.payment.rail_id,
            "approval_url": approval_url,
        } if intent.payment else None,
        "created_at": intent.created_at.isoformat(),
    }


def _fmt(app) -> dict:
    return {
        "id":         app.id,
        "user_id":    app.user_id,
        "name":       app.name,
        "policies":   app.policies,
        "controls":   app.controls,
        "status":     app.status,
        "created_at": app.created_at.isoformat(),
    }
