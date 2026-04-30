import httpx
from decimal import Decimal
from rails.base import PaymentRail, RailQuote, PaymentResult


class RevolutRail(PaymentRail):
    """
    Revolut Business API rail — Faster Payments, SEPA, internal transfers.
    Uses mTLS (cert + key) for production; sandbox uses API key only.
    Docs: https://developer.revolut.com/docs/business
    """

    rail_id = "revolut"
    _SANDBOX = "https://sandbox-b2b.revolut.com/api/1.0"
    _LIVE    = "https://b2b.revolut.com/api/1.0"

    def __init__(self, api_key: str, cert_path: str = "", key_path: str = "",
                 sandbox: bool = True) -> None:
        base = self._SANDBOX if sandbox else self._LIVE
        cert = (cert_path, key_path) if cert_path and key_path else None
        self._client = httpx.AsyncClient(
            base_url=base,
            headers={"Authorization": f"Bearer {api_key}"},
            cert=cert,
            timeout=30,
        )

    async def get_quote(self, amount: Decimal, currency: str,
                        destination_country: str) -> RailQuote:
        # Revolut does not expose a public quote endpoint for B2B;
        # fees are flat-rate per plan. Estimate based on plan.
        return RailQuote(
            rail_id="revolut",
            fee=Decimal("0.20"),
            fee_currency="GBP",
            estimated_hours=2,
            supported=currency in ("GBP", "EUR", "USD"),
            notes="Revolut Business flat-rate estimate",
        )

    async def execute(self, amount: Decimal, currency: str,
                      recipient: dict, idempotency_key: str) -> PaymentResult:
        # Full implementation: create counterparty → create payment
        # Stubbed until Revolut sandbox credentials are configured
        raise NotImplementedError("Revolut execute — configure REVOLUT_API_KEY and implement")

    async def get_status(self, provider_payment_id: str) -> str:
        resp = await self._client.get(f"/pay-out/{provider_payment_id}")
        resp.raise_for_status()
        return resp.json().get("state", "unknown")
