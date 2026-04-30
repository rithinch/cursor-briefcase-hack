import httpx
from decimal import Decimal
from base64 import b64encode
from rails.base import PaymentRail, RailQuote, PaymentResult


class YapilyRail(PaymentRail):
    """
    Yapily Open Banking rail — Faster Payments via UK Open Banking.
    Best for low-fee GBP domestic payments.
    Docs: https://docs.yapily.com
    """

    rail_id = "yapily"
    _BASE = "https://api.yapily.com"

    def __init__(self, api_key: str, api_secret: str) -> None:
        creds = b64encode(f"{api_key}:{api_secret}".encode()).decode()
        self._client = httpx.AsyncClient(
            base_url=self._BASE,
            headers={"Authorization": f"Basic {creds}"},
            timeout=30,
        )

    async def get_quote(self, amount: Decimal, currency: str,
                        destination_country: str) -> RailQuote:
        # Yapily charges per-payment API call fee; Faster Payments itself is free
        gbp_only = currency == "GBP" and destination_country in ("GB", "")
        return RailQuote(
            rail_id="yapily",
            fee=Decimal("0.10"),
            fee_currency="GBP",
            estimated_hours=1,          # Faster Payments: typically seconds to 2h
            supported=gbp_only,
            notes="Yapily Open Banking — GBP UK Faster Payments only",
        )

    async def execute(self, amount: Decimal, currency: str,
                      recipient: dict, idempotency_key: str) -> PaymentResult:
        # Full implementation requires a consent/authorisation flow per payment
        # Stubbed until Yapily institution consent is configured
        raise NotImplementedError("Yapily execute — configure YAPILY_API_KEY and implement")

    async def get_status(self, provider_payment_id: str) -> str:
        resp = await self._client.get(f"/payments/{provider_payment_id}/details")
        resp.raise_for_status()
        return resp.json().get("data", {}).get("status", "unknown")
