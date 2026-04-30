import json
from decimal import Decimal
from langsmith import traceable
from langchain_anthropic import ChatAnthropic
from rails.base import PaymentRail, RailQuote
from core.config import settings
from core.logging import log

_llm = ChatAnthropic(model=settings.LLM_MODEL, temperature=0)


@traceable(name="RailSelectorAgent", run_type="llm")
async def select_rail(
    amount: Decimal,
    currency: str,
    destination_country: str,
    available_rails: list[PaymentRail],
) -> tuple[PaymentRail, str]:
    """
    Fetches quotes from all available rails, then uses an LLM subagent to
    select the most efficient one. Returns (rail, reasoning).
    """
    quotes: list[RailQuote] = []
    for rail in available_rails:
        quote = await rail.get_quote(amount, currency, destination_country)
        quotes.append(quote)

    supported = [q for q in quotes if q.supported]
    if not supported:
        # fallback — pick first available regardless
        supported = quotes

    quotes_data = [
        {
            "rail_id":         q.rail_id,
            "fee":             str(q.fee),
            "fee_currency":    q.fee_currency,
            "estimated_hours": q.estimated_hours,
            "notes":           q.notes,
        }
        for q in supported
    ]

    prompt = f"""You are a payment rail selection agent for Pulp.

Select the most efficient payment rail for this transaction.

PAYMENT:
- Amount: {amount} {currency}
- Destination country: {destination_country or "GB"}

AVAILABLE RAILS:
{json.dumps(quotes_data, indent=2)}

Selection criteria (in priority order):
1. Lowest fee (most important for routine contractor payments)
2. Fastest settlement (important if vendor has payment terms)
3. Reliability / notes

Return ONLY valid JSON:
{{
  "rail_id": "<selected rail_id>",
  "reasoning": "<one sentence explaining the choice>"
}}"""

    response = await _llm.ainvoke(prompt)
    result = _parse_json(response.content)

    selected_id = result["rail_id"]
    selected_rail = next(
        (r for r in available_rails if r.rail_id == selected_id),
        available_rails[0],   # fallback to first if LLM returns unknown id
    )

    log.info("rail_selector.selected",
             rail=selected_id,
             reasoning=result.get("reasoning"),
             quotes=[q.rail_id for q in supported])

    return selected_rail, result["reasoning"]


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
