from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, status, Query
from db.repos import (SessionLocal, create_invoice, update_invoice, get_intent,
                      update_intent_status, append_event)
from agents.invoice_parser import parse_invoice
from core.specter import search_companies, build_company_verification_payload
from core.logging import log
from core.config import settings

router = APIRouter(prefix="/v1/invoices", tags=["invoices"])

# graph instance — injected at startup
_graph = None

def set_graph(graph) -> None:
    global _graph
    _graph = graph


@router.post("", status_code=202)
async def receive_invoice(
    background_tasks: BackgroundTasks,
    request: Request,
    intent_id: str = Query(...),
):
    account_id = request.state.account_id

    async with SessionLocal() as db:
        intent = await get_intent(db, intent_id, account_id)
        if intent is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "intent_not_found"}})

    body = await request.body()
    
    # Check if content is a PDF (binary) or text
    is_pdf = body.startswith(b'%PDF')
    raw_text = None if is_pdf else body.decode("utf-8", errors="ignore")

    async with SessionLocal() as db:
        invoice = await create_invoice(
            db,
            account_id=account_id,
            intent_id=intent_id,
            source={"type": "upload", "format": "pdf" if is_pdf else "text"},
            raw_text=raw_text,
        )
        await update_intent_status(db, intent_id, "invoice_received")
        await append_event(db, account_id=account_id, type_="invoice.received",
                           intent_id=intent_id, object_type="invoice", object_id=invoice.id)

    log.info("invoice.received", invoice_id=invoice.id, intent_id=intent_id)

    application_id = getattr(request.state, "application_id", None)
    background_tasks.add_task(
        _run_pipeline, account_id, intent_id, invoice.id, body, application_id
    )

    return {"invoice_id": invoice.id, "status": "processing"}


async def _run_pipeline(account_id: str, intent_id: str,
                        invoice_id: str, pdf_bytes: bytes,
                        application_id: str | None = None) -> None:
    async with SessionLocal() as db:
        intent  = await get_intent(db, intent_id, account_id)
        intent_dict = _intent_to_dict(intent, account_id)

    # upload PDF to Azure Blob Storage (best-effort, non-blocking)
    from core.blob_storage import upload_invoice_to_blob
    blob_url = await upload_invoice_to_blob(pdf_bytes, invoice_id)
    if blob_url:
        async with SessionLocal() as db:
            await update_invoice(db, invoice_id, blob_url=blob_url)

    # parse invoice with Claude
    parsed = await parse_invoice(pdf_bytes=pdf_bytes)

    # company verification (Specter) — pauses pipeline if mismatch/unknown
    company_verification = None
    try:
        if not (settings.SPECTER_API_KEY or "").strip():
            company_verification = {
                "status": "pending",
                "reason": "specter_not_configured",
            }
        else:
            query = None
            if parsed.get("vendor_email"):
                # search expects a company name or domain; prefer domain from email if present
                query = parsed.get("vendor_email").split("@")[-1]
            elif parsed.get("vendor_name"):
                query = parsed.get("vendor_name")

            specter_results = await search_companies(query or "")
            company_verification = build_company_verification_payload(
                intent_vendor_email=(intent_dict.get("vendor") or {}).get("email"),
                parsed_vendor_name=parsed.get("vendor_name"),
                parsed_vendor_email=parsed.get("vendor_email"),
                specter_results=specter_results,
            )
    except Exception as exc:
        company_verification = {
            "status": "pending",
            "reason": "specter_error",
            "error": str(exc),
        }

    async with SessionLocal() as db:
        await update_invoice(db, invoice_id, parsed=parsed, company_verification=company_verification)

        if company_verification and company_verification.get("status") != "verified":
            await update_invoice(db, invoice_id, status="company_verification_pending")
            await update_intent_status(db, intent_id, "company_verification_pending")
            await append_event(
                db,
                account_id=account_id,
                type_="invoice.company_verification_pending",
                intent_id=intent_id,
                object_type="invoice",
                object_id=invoice_id,
                data=company_verification,
            )
            log.info(
                "invoice.company_verification_pending",
                invoice_id=invoice_id,
                intent_id=intent_id,
                reason=company_verification.get("reason"),
            )
            return

        await update_invoice(db, invoice_id, status="verified")
        await update_intent_status(db, intent_id, "invoice_verified")
        await append_event(
            db,
            account_id=account_id,
            type_="invoice.company_verified",
            intent_id=intent_id,
            object_type="invoice",
            object_id=invoice_id,
            data=company_verification or {},
        )

    thread = {"configurable": {"thread_id": intent_id}}
    initial_state = {
        "intent_id":      intent_id,
        "intent":         intent_dict,
        "invoice":        parsed,
        "application_id": application_id,
        "validation":     None, "approval": None,
        "selected_rail":  None, "rail_reasoning": None,
        "payment":        None, "reconciliation": None, "error": None,
    }

    await _graph.ainvoke(initial_state, config=thread, version="v2")

    # persist final state back to DB
    snapshot = await _graph.aget_state(config=thread)
    state = snapshot.values
    await _persist_final_state(account_id, intent_id, invoice_id, state)


async def _persist_final_state(account_id: str, intent_id: str,
                                invoice_id: str, state: dict) -> None:
    async with SessionLocal() as db:
        if state.get("validation"):
            await update_invoice(db, invoice_id,
                                 validation=state["validation"],
                                 status="validated")
            await append_event(db, account_id=account_id, type_="invoice.validated",
                               intent_id=intent_id)

        if state.get("approval", {}).get("decision") == "require_human":
            await update_intent_status(db, intent_id, "pending_approval")
            await append_event(db, account_id=account_id, type_="payment.approval_sent",
                               intent_id=intent_id)

        if state.get("payment"):
            # reconcile_node sets final status (reconciled or completed) — just append the event
            await append_event(db, account_id=account_id, type_="payment.completed",
                               intent_id=intent_id, data=state["payment"])


def _intent_to_dict(intent, account_id: str) -> dict:
    return {
        "id":                intent.id,
        "account_id":        account_id,
        "vendor":            intent.vendor,
        "amount":            intent.amount,
        "context":           intent.context,
        "approval_policy":   getattr(intent, "approval_policy", None) or getattr(intent, "policies", None) or {},
        "recipient_country": "GB",
    }
