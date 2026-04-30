import httpx
from decimal import Decimal
from rails.base import PaymentRail, RailQuote, PaymentResult


class WiseRail(PaymentRail):
    """
    Wise Business API rail — Faster Payments and international transfers.
    Docs: https://docs.wise.com/api-docs
    """

    rail_id = "wise"
    _BASE = "https://api.wise.com"

    def __init__(self, api_key: str) -> None:
        self._api_key = api_key
        self._client = httpx.AsyncClient(
            base_url=self._BASE,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30,
        )

    async def get_quote(self, amount: Decimal, currency: str,
                        destination_country: str) -> RailQuote:
        try:
            resp = await self._client.post("/v3/quotes", json={
                "sourceCurrency":      currency,
                "targetCurrency":      currency,
                "sourceAmount":        float(amount),
                "targetAmount":        None,
                "payOut":              "BANK_TRANSFER",
                "preferredPayIn":      "BANK_TRANSFER",
            })
            resp.raise_for_status()
            data = resp.json()
            best = min(data.get("paymentOptions", []),
                       key=lambda o: o.get("fee", {}).get("total", 999),
                       default={})
            fee = Decimal(str(best.get("fee", {}).get("total", 0)))
            eta_hours = best.get("formattedEstimatedDelivery", "24h")
            return RailQuote(
                rail_id="wise",
                fee=fee,
                fee_currency=currency,
                estimated_hours=_parse_hours(eta_hours),
                supported=True,
            )
        except Exception as exc:
            return RailQuote(rail_id="wise", fee=Decimal("0"), fee_currency=currency,
                             estimated_hours=999, supported=False, notes=str(exc))

    async def execute(self, amount: Decimal, currency: str,
                      recipient: dict, idempotency_key: str) -> PaymentResult:
        # Full implementation: create recipient account → create transfer → fund transfer
        # Stubbed until Wise sandbox credentials are configured
        raise NotImplementedError("Wise execute — configure WISE_API_KEY and implement")

    async def get_status(self, provider_payment_id: str) -> str:
        resp = await self._client.get(f"/v1/transfers/{provider_payment_id}")
        resp.raise_for_status()
        return resp.json().get("status", "unknown")


def _parse_hours(eta: str) -> int:
    """Best-effort parse of Wise ETA strings like '2-3 hours' or '1 day'."""
    if "hour" in eta:
        return 4
    if "day" in eta:
        return 24
    return 48
