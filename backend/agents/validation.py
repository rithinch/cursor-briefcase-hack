import json
from langsmith import traceable
from langchain_anthropic import ChatAnthropic
from core.config import settings
from core.logging import log

_llm = ChatAnthropic(model=settings.LLM_MODEL, temperature=0)


@traceable(name="ValidationAgent", run_type="llm")
async def run_validation_agent(intent: dict, invoice: dict) -> dict:
    """
    Reasons over whether an invoice matches the registered intent.
    Returns: { result, confidence, reasoning_trace, vendor_match, amount_match, fraud_signals }
    """
    prompt = f"""You are a financial validation agent for Pulp, an accounts payable system.

Validate the invoice against the registered intent and return a JSON object.

INTENT:
{json.dumps(intent, indent=2)}

INVOICE (parsed fields):
{json.dumps(invoice, indent=2)}

Checks to perform:
1. vendor_match  — does the invoice vendor name/email match the intent vendor?
2. amount_match  — is the invoice amount within the intent tolerance? (tolerance_pct is a percentage)
3. duplicate     — flag if invoice_number looks like a re-submission (you cannot query DB, note as unknown)
4. fraud_signals — any suspicious patterns (round amounts, mismatched domains, unusual line items)

Return ONLY valid JSON — no markdown, no explanation outside the JSON:
{{
  "result": "pass" | "review" | "reject",
  "confidence": <float 0.0-1.0>,
  "reasoning_trace": "<one paragraph explaining the decision>",
  "vendor_match": {{ "status": "matched|partial|no_match", "confidence": <float>, "notes": "" }},
  "amount_match": {{ "status": "exact|within_tolerance|exceeds_tolerance", "delta_pct": <float> }},
  "fraud_signals": ["<signal>" | []]
}}"""

    response = await _llm.ainvoke(prompt)
    result = _parse_json(response.content)

    log.info("validation.completed",
             intent_id=intent.get("id"),
             result=result.get("result"),
             confidence=result.get("confidence"))

    return result


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
