from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import asyncio
import random
import httpx

from core.config import settings
from core.logging import log


SPECTER_BASE_URL = "https://app.tryspecter.com/api/v1"


@dataclass(frozen=True)
class SpecterCompany:
    id: str | None
    name: str | None
    domain: str | None
    raw: dict[str, Any]


def _normalise_domain(domain: str) -> str:
    d = (domain or "").strip().lower()
    if d.startswith("http://"):
        d = d[len("http://") :]
    if d.startswith("https://"):
        d = d[len("https://") :]
    d = d.split("/")[0]
    if d.startswith("www."):
        d = d[len("www.") :]
    return d


def _extract_domain_from_email(email: str | None) -> str | None:
    if not email:
        return None
    parts = email.strip().lower().split("@")
    if len(parts) != 2 or not parts[1]:
        return None
    return _normalise_domain(parts[1])


async def search_companies(query: str) -> list[SpecterCompany]:
    api_key = (settings.SPECTER_API_KEY or "").strip()
    if not api_key:
        # Treat missing key as "not configured" rather than an error.
        # Downstream logic can decide whether to gate the pipeline on this.
        return []

    q = (query or "").strip()
    if not q:
        return []

    # Specter rate limits (429) are common. Retry with exponential backoff.
    max_attempts = 5
    base_delay_s = 0.6

    last_exc: Exception | None = None
    async with httpx.AsyncClient(timeout=15.0) as client:
        for attempt in range(1, max_attempts + 1):
            try:
                resp = await client.get(
                    f"{SPECTER_BASE_URL}/companies/search",
                    params={"query": q},
                    headers={"X-API-Key": api_key},
                )

                if resp.status_code == 429 or resp.status_code >= 500:
                    raise httpx.HTTPStatusError(
                        f"Specter retryable status {resp.status_code}",
                        request=resp.request,
                        response=resp,
                    )

                resp.raise_for_status()
                data = resp.json()
                break
            except (httpx.TimeoutException, httpx.NetworkError, httpx.HTTPStatusError) as exc:
                last_exc = exc
                if attempt >= max_attempts:
                    raise
                # expo backoff + jitter
                delay = base_delay_s * (2 ** (attempt - 1)) + random.random() * 0.25
                log.warning(
                    "specter.retry",
                    attempt=attempt,
                    max_attempts=max_attempts,
                    delay_s=round(delay, 2),
                    error=str(exc),
                )
                await asyncio.sleep(delay)
        else:
            # should be unreachable, but keep mypy happy
            if last_exc:
                raise last_exc
            return []

    if not isinstance(data, list):
        return []

    companies: list[SpecterCompany] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        companies.append(
            SpecterCompany(
                id=item.get("id"),
                name=item.get("name"),
                domain=_normalise_domain(item.get("domain") or "") or None,
                raw=item,
            )
        )
    return companies


def build_company_verification_payload(
    *,
    intent_vendor_email: str | None,
    parsed_vendor_name: str | None,
    parsed_vendor_email: str | None,
    specter_results: list[SpecterCompany],
) -> dict[str, Any]:
    expected_domain = _extract_domain_from_email(intent_vendor_email)
    invoice_domain = _extract_domain_from_email(parsed_vendor_email)

    candidate_domains = {d for d in [expected_domain, invoice_domain] if d}
    specter_domains = {c.domain for c in specter_results if c.domain}

    matched_domain = None
    if candidate_domains and specter_domains:
        for d in candidate_domains:
            if d in specter_domains:
                matched_domain = d
                break

    status = "verified" if matched_domain else "pending"
    reason = None
    if not matched_domain:
        if not expected_domain and not invoice_domain:
            reason = "missing_domain"
        elif not specter_results:
            reason = "no_specter_matches"
        else:
            reason = "domain_mismatch"

    return {
        "status": status,
        "reason": reason,
        "expected_domain": expected_domain,
        "invoice_domain": invoice_domain,
        "parsed_vendor_name": parsed_vendor_name,
        "specter_top_matches": [
            {"id": c.id, "name": c.name, "domain": c.domain} for c in specter_results[:5]
        ],
        "matched_domain": matched_domain,
    }

