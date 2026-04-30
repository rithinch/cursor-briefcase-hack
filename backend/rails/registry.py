from rails.base import PaymentRail
from rails.mock import MockRail
from rails.wise import WiseRail
from rails.revolut import RevolutRail
from rails.yapily import YapilyRail
from core.config import settings


def build_rails() -> list[PaymentRail]:
    """Instantiate rails from RAILS_ENABLED env var. Swap at deploy time."""
    enabled = [r.strip() for r in settings.RAILS_ENABLED.split(",")]
    rails: list[PaymentRail] = []

    for rail_id in enabled:
        if rail_id == "mock":
            rails.append(MockRail())
        elif rail_id == "wise" and settings.WISE_API_KEY:
            rails.append(WiseRail(api_key=settings.WISE_API_KEY))
        elif rail_id == "revolut" and settings.REVOLUT_API_KEY:
            rails.append(RevolutRail(
                api_key=settings.REVOLUT_API_KEY,
                cert_path=settings.REVOLUT_CERT_PATH,
                key_path=settings.REVOLUT_KEY_PATH,
            ))
        elif rail_id == "yapily" and settings.YAPILY_API_KEY:
            rails.append(YapilyRail(
                api_key=settings.YAPILY_API_KEY,
                api_secret=settings.YAPILY_API_SECRET,
            ))

    if not rails:
        rails.append(MockRail())

    return rails
