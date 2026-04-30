import jwt
import time
from uuid import uuid4
from dataclasses import dataclass
from core.config import settings


@dataclass
class ApprovalClaims:
    intent_id: str
    payment_id: str
    action: str        # "approve" | "reject"
    jti: str
    exp: int


def create_approval_token(intent_id: str, payment_id: str, action: str = "approve") -> tuple[str, str]:
    """Returns (token, jti). Store jti on the Payment record."""
    jti = str(uuid4())
    exp = int(time.time()) + settings.APPROVAL_TOKEN_EXPIRY_HOURS * 3600
    payload = {
        "intent_id":  intent_id,
        "payment_id": payment_id,
        "action":     action,
        "jti":        jti,
        "exp":        exp,
    }
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return token, jti


def decode_approval_token(token: str) -> ApprovalClaims:
    payload = jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
        options={"verify_exp": True},
    )
    return ApprovalClaims(
        intent_id=payload["intent_id"],
        payment_id=payload["payment_id"],
        action=payload["action"],
        jti=payload["jti"],
        exp=payload["exp"],
    )
