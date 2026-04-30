from decimal import Decimal
from rails.base import PaymentRail, RailQuote, PaymentResult


class MockRail(PaymentRail):
    """Zero-dependency stub rail for local development and hackathon demos."""

    rail_id = "mock"

    async def get_quote(self, amount: Decimal, currency: str,
                        destination_country: str) -> RailQuote:
        return RailQuote(
            rail_id="mock",
            fee=Decimal("0"),
            fee_currency=currency,
            estimated_hours=0,
            supported=True,
            notes="Mock rail — instant, zero fee, for development only",
        )

    async def execute(self, amount: Decimal, currency: str,
                      recipient: dict, idempotency_key: str) -> PaymentResult:
        return PaymentResult(
            provider_payment_id=f"mock_{idempotency_key}",
            status="completed",
            rail_id="mock",
        )

    async def get_status(self, provider_payment_id: str) -> str:
        return "completed"
