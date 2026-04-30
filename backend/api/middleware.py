import hashlib
from uuid import uuid4
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from structlog.contextvars import clear_contextvars, bind_contextvars
from db.repos import SessionLocal, get_account_by_api_key, get_application_by_api_key
from core.logging import log


def _hash_key(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()


async def auth_middleware(request: Request, call_next):
    """Resolve tenant from Bearer API key. Attach account to request.state."""
    request_id = request.headers.get("x-request-id", str(uuid4()))
    clear_contextvars()
    bind_contextvars(request_id=request_id, path=request.url.path)

    # skip auth for public endpoints
    public_prefixes = ("/v1/users", "/v1/applications")
    if (request.url.path in ("/", "/health", "/docs", "/openapi.json")
            or request.url.path.startswith(public_prefixes)):
        return await call_next(request)

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": {"code": "missing_api_key",
                               "message": "Authorization: Bearer <key> required"}},
        )

    api_key = auth.removeprefix("Bearer ").strip()
    key_hash = _hash_key(api_key)

    async with SessionLocal() as db:
        account = await get_account_by_api_key(db, key_hash)
        application = await get_application_by_api_key(db, key_hash) if account is None else None

    if account is None and application is None:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"error": {"code": "invalid_api_key", "message": "API key not recognised"}},
        )

    if account:
        request.state.account = account
        request.state.account_id = account.id
        request.state.application = None
        request.state.application_id = None
        bind_contextvars(tenant_id=account.id)
    else:
        request.state.account = application       # backwards compat — approval_policy lives here too
        request.state.account_id = application.id
        request.state.application = application
        request.state.application_id = application.id
        bind_contextvars(tenant_id=application.id)

    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    return response
