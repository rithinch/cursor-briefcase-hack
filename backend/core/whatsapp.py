"""Send Twilio WhatsApp messages for payment approvals."""
from __future__ import annotations

from core.config import settings
from core.logging import log


def send_approval_whatsapp(
    phone: str,
    intent_id: str,
    approval_url: str,
    amount: dict,
    vendor: dict,
) -> bool:
    """Send a WhatsApp approval request; returns True on success."""
    if not (settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN):
        log.debug("whatsapp.skip: Twilio credentials not set")
        return False

    try:
        from twilio.rest import Client

        currency = amount.get("currency", "")
        expected = amount.get("expected", 0)
        vendor_name = vendor.get("name", "Unknown")

        body = (
            f"🧾 *Pulp* — Payment approval needed\n\n"
            f"Vendor: {vendor_name}\n"
            f"Amount: {currency} {expected:,.2f}\n"
            f"Ref: {intent_id}\n\n"
            f"Approve here:\n{approval_url}"
        )

        to = phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}"
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=body,
            from_=settings.TWILIO_WHATSAPP_FROM,
            to=to,
        )
        log.info("whatsapp.sent", sid=message.sid, to=to, intent_id=intent_id)
        return True

    except Exception as exc:
        log.warning("whatsapp.failed", intent_id=intent_id, error=str(exc))
        return False
