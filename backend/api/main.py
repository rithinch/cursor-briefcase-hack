import os
import hashlib
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from scalar_fastapi import get_scalar_api_reference
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from core.config import settings
from core.logging import setup_logging, log
from db.repos import create_tables, SessionLocal, create_account
from graph.pipeline import build_graph, configure_rails
from rails.registry import build_rails
from api.middleware import auth_middleware
from api.routers import intents, invoices, payments, users, applications, connections


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()

    log.info("pulp.starting", version=settings.VERSION, rails=settings.RAILS_ENABLED)

    await create_tables()

    rails = build_rails()
    configure_rails(rails)
    log.info("rails.loaded", ids=[r.rail_id for r in rails])

    db_url = settings.DATABASE_URL.replace("+asyncpg", "")
    async with AsyncPostgresSaver.from_conn_string(db_url) as checkpointer:
        await checkpointer.setup()

        graph = build_graph(checkpointer)
        invoices.set_graph(graph)
        payments.set_graph(graph)

        if os.getenv("PULP_SEED_DEV_ACCOUNT") == "true":
            await _seed_dev_account()

        log.info("pulp.ready")
        yield
        log.info("pulp.shutdown")


app = FastAPI(
    title="Pulp API",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

app.middleware("http")(auth_middleware)

app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(intents.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(users.router)
app.include_router(applications.router)
app.include_router(connections.router)


@app.get("/", include_in_schema=False)
async def root():
    return {"status": "ok", "version": settings.VERSION}


@app.get("/docs", include_in_schema=False, response_class=HTMLResponse)
async def scalar_docs():
    return get_scalar_api_reference(openapi_url="/openapi.json", title="Pulp API")


@app.get("/health", include_in_schema=False)
async def health():
    return {"status": "ok", "version": settings.VERSION}


async def _seed_dev_account() -> None:
    dev_key = os.getenv("PULP_DEV_API_KEY", "pk_test_dev")
    key_hash = hashlib.sha256(dev_key.encode()).hexdigest()
    async with SessionLocal() as db:
        from sqlalchemy import select
        from db.models import Account
        existing = await db.execute(select(Account).where(Account.api_key_hash == key_hash))
        if existing.scalar_one_or_none() is None:
            await create_account(db, name="Dev Account", api_key_hash=key_hash,
                                 approval_policy={
                                     "auto_pay_threshold":        500,
                                     "auto_pay_min_confidence":   0.90,
                                     "auto_pay_known_vendors_only": True,
                                     "always_approve_above":      5000,
                                     "approver_email":            "approver@example.com",
                                     "approval_timeout_hours":    48,
                                     "fraud_signal_override":     True,
                                 })
            log.info("dev_account.seeded", api_key=dev_key)
