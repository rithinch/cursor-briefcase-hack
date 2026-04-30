"""
Post-payment reconciliation.
Checks the application's connections for an accounting integration and creates
the corresponding bill/expense entry. Skips gracefully if no integration is found.
"""

from db.repos import SessionLocal, list_connections, update_reconciliation, create_reconciliation
from core.logging import log


CONNECTION_TYPES_ACCOUNTING = {"xero", "quickbooks"}


async def run_reconciliation(payment_id: str | None, application_id: str | None,
                              payment_data: dict) -> None:
    if not payment_id:
        log.info("reconciliation.skipped", reason="no_payment_id")
        return

    async with SessionLocal() as db:
        rec = await create_reconciliation(db, payment_id=payment_id,
                                          application_id=application_id)
        rec_id = rec.id

        if not application_id:
            await update_reconciliation(db, rec_id, status="skipped",
                                        provider="none",
                                        data={"reason": "no_application"})
            log.info("reconciliation.skipped", payment_id=payment_id, reason="no_application")
            return

        connections = await list_connections(db, application_id)
        accounting_conn = next(
            (c for c in connections if c.type in CONNECTION_TYPES_ACCOUNTING
             and c.status == "active"),
            None,
        )

        if accounting_conn is None:
            await update_reconciliation(db, rec_id, status="skipped",
                                        provider="none",
                                        data={"reason": "no_accounting_integration"})
            log.info("reconciliation.skipped", payment_id=payment_id,
                     reason="no_accounting_integration")
            return

        provider = accounting_conn.type
        try:
            external_ref = await _push_to_provider(provider, accounting_conn.credentials,
                                                    payment_data)
            await update_reconciliation(db, rec_id, status="completed",
                                        provider=provider, external_ref=external_ref,
                                        data={"payment": payment_data})
            log.info("reconciliation.completed", payment_id=payment_id,
                     provider=provider, external_ref=external_ref)
        except Exception as exc:
            await update_reconciliation(db, rec_id, status="failed",
                                        provider=provider, data={"error": str(exc)})
            log.error("reconciliation.failed", payment_id=payment_id,
                      provider=provider, error=str(exc))


async def _push_to_provider(provider: str, credentials: dict, payment: dict) -> str:
    """Push payment to accounting provider. Returns external reference ID."""
    if provider == "xero":
        return await _xero_create_bill(credentials, payment)
    if provider == "quickbooks":
        return await _quickbooks_create_bill(credentials, payment)
    raise ValueError(f"unknown provider: {provider}")


async def _xero_create_bill(credentials: dict, payment: dict) -> str:
    # TODO: implement Xero API call using credentials["access_token"]
    # POST /api.xro/2.0/Invoices with Type=ACCPAY
    raise NotImplementedError("Xero integration not yet implemented")


async def _quickbooks_create_bill(credentials: dict, payment: dict) -> str:
    # TODO: implement QuickBooks API call using credentials["access_token"]
    # POST /v3/company/{realmId}/bill
    raise NotImplementedError("QuickBooks integration not yet implemented")
