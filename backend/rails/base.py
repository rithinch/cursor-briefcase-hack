from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass
class RailQuote:
    rail_id: str
    fee: Decimal
    fee_currency: str
    estimated_hours: int     # settlement time
    supported: bool          # False if rail cannot handle this payment
    notes: str = ""


@dataclass
class PaymentResult:
    provider_payment_id: str
    status: str              # executing | completed | failed
    rail_id: str


class PaymentRail(ABC):
    rail_id: str

    @abstractmethod
    async def get_quote(
        self,
        amount: Decimal,
        currency: str,
        destination_country: str,
    ) -> RailQuote: ...

    @abstractmethod
    async def execute(
        self,
        amount: Decimal,
        currency: str,
        recipient: dict,
        idempotency_key: str,
    ) -> PaymentResult: ...

    @abstractmethod
    async def get_status(self, provider_payment_id: str) -> str: ...
