import json
import base64
from langsmith import traceable
from langchain_anthropic import ChatAnthropic
from core.config import settings
from core.logging import log

_llm = ChatAnthropic(model=settings.LLM_MODEL, temperature=0)


@traceable(name="InvoiceParserAgent", run_type="llm")
async def parse_invoice(raw_text: str | None = None,
                        pdf_bytes: bytes | None = None) -> dict:
    """
    Extracts structured fields from a raw invoice (text or PDF bytes).
    Returns parsed invoice fields.
    """
    if pdf_bytes and pdf_bytes[:4] == b"%PDF":
        b64 = base64.standard_b64encode(pdf_bytes).decode()
        messages = [
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {"type": "base64", "media_type": "application/pdf", "data": b64},
                    },
                    {"type": "text", "text": _PARSE_PROMPT},
                ],
            }
        ]
        response = await _llm.ainvoke(messages)
    else:
        text = pdf_bytes.decode("utf-8", errors="ignore") if pdf_bytes else raw_text
        prompt = f"{_PARSE_PROMPT}\n\nINVOICE TEXT:\n{text}"
        response = await _llm.ainvoke(prompt)

    result = _parse_json(response.content)
    log.info("invoice.parsed",
             vendor=result.get("vendor_name"),
             amount=result.get("amount"))
    return result


_PARSE_PROMPT = """Extract structured fields from this invoice.
Return ONLY valid JSON — no markdown, no extra text:
{
  "vendor_name": "<company name on invoice>",
  "vendor_email": "<email if present, else null>",
  "invoice_number": "<invoice number>",
  "amount": <total amount as number>,
  "currency": "<3-letter ISO currency code>",
  "tax_amount": <tax as number or 0>,
  "issue_date": "<YYYY-MM-DD or null>",
  "due_date": "<YYYY-MM-DD or null>",
  "line_items": [
    { "description": "", "qty": 1, "unit_price": 0.0, "total": 0.0 }
  ],
  "parsing_confidence": <float 0.0-1.0>
}"""


def _parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())
