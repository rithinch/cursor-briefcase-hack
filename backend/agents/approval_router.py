import json
from langsmith import traceable
from langchain_anthropic import ChatAnthropic
from core.config import settings
from core.logging import log

_llm = ChatAnthropic(model=settings.LLM_MODEL, temperature=0)


@traceable(name="ApprovalRouterAgent", run_type="llm")
async def run_approval_router_agent(intent: dict, validation: dict) -> dict:
    """
    Decides whether to auto-pay or route to a human approver.
    Respects the account approval_policy as a hard constraint.
    Returns: { decision, reasoning, approver_email }
    """
    policy = intent.get("approval_policy", {})

    prompt = f"""You are an approval routing agent for Pulp.

Given the intent, validation result, and approval policy, decide whether to auto-pay
or require human approval. The policy is a HARD CONSTRAINT — never override it.

INTENT:
{json.dumps(intent, indent=2)}

VALIDATION RESULT:
{json.dumps(validation, indent=2)}

APPROVAL POLICY:
{json.dumps(policy, indent=2)}

Policy rules (all must pass for auto_pay):
- Invoice amount <= auto_pay_threshold
- Validation confidence >= auto_pay_min_confidence  (default 0.90 if not set)
- Vendor trust_level >= 1 if auto_pay_known_vendors_only is true
- No fraud signals present if fraud_signal_override is true
- Amount never exceeds always_approve_above (always requires human)

Return ONLY valid JSON:
{{
  "decision": "auto_pay" | "require_human",
  "reasoning": "<one sentence>",
  "approver_email": "<from policy.approver_email or null if auto_pay>"
}}"""

    response = await _llm.ainvoke(prompt)
    result = _parse_json(response.content)

    log.info("approval_router.decided",
             intent_id=intent.get("id"),
             decision=result.get("decision"))

    return result


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
