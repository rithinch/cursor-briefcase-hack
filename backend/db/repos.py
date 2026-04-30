from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from db.models import Base, Account, Intent, Invoice, Payment, Event, User, Application, Connection, Reconciliation
from core.config import settings

def _async_url(url: str) -> str:
    """Ensure the URL uses the asyncpg driver regardless of what's in the env."""
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        return url.replace("://", "+asyncpg://", 1)
    return url

engine = create_async_engine(_async_url(settings.DATABASE_URL), echo=False)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def _id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex[:16]}"


# ---------- Account ----------

async def get_account_by_api_key(db: AsyncSession, api_key_hash: str) -> Account | None:
    result = await db.execute(
        select(Account).where(Account.api_key_hash == api_key_hash, Account.status == "active")
    )
    return result.scalar_one_or_none()


async def create_account(db: AsyncSession, name: str, api_key_hash: str,
                         approval_policy: dict) -> Account:
    account = Account(
        id=_id("acct"),
        name=name,
        api_key_hash=api_key_hash,
        approval_policy=approval_policy,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account


# ---------- Intent ----------

async def create_intent(db: AsyncSession, account_id: str, vendor: dict,
                        amount: dict, context: dict,
                        policy_override: dict | None = None,
                        expires_at: datetime | None = None) -> Intent:
    intent = Intent(
        id=_id("loop"),
        account_id=account_id,
        vendor=vendor,
        amount=amount,
        context=context,
        policy_override=policy_override,
        expires_at=expires_at,
    )
    db.add(intent)
    await db.commit()
    await db.refresh(intent)
    return intent


async def get_intent(db: AsyncSession, intent_id: str,
                     account_id: str) -> Intent | None:
    result = await db.execute(
        select(Intent)
        .where(Intent.id == intent_id, Intent.account_id == account_id)
        .options(selectinload(Intent.events),
                 selectinload(Intent.invoice),
                 selectinload(Intent.payment))
    )
    return result.scalar_one_or_none()


async def list_intents(db: AsyncSession, account_id: str,
                       limit: int = 100, offset: int = 0) -> list[Intent]:
    result = await db.execute(
        select(Intent)
        .where(Intent.account_id == account_id)
        .order_by(Intent.created_at.desc())
        .limit(limit)
        .offset(offset)
        .options(selectinload(Intent.invoice), selectinload(Intent.payment))
    )
    return list(result.scalars().all())


async def update_intent_status(db: AsyncSession, intent_id: str, status: str) -> None:
    await db.execute(
        update(Intent).where(Intent.id == intent_id).values(status=status)
    )
    await db.commit()


# ---------- Invoice ----------

async def create_invoice(db: AsyncSession, account_id: str, intent_id: str | None,
                         source: dict, raw_text: str | None = None) -> Invoice:
    invoice = Invoice(
        id=_id("inv"),
        account_id=account_id,
        intent_id=intent_id,
        source=source,
        raw_text=raw_text,
    )
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return invoice


async def update_invoice(db: AsyncSession, invoice_id: str,
                         **kwargs) -> None:
    await db.execute(
        update(Invoice).where(Invoice.id == invoice_id).values(**kwargs)
    )
    await db.commit()


async def get_invoice(db: AsyncSession, invoice_id: str,
                      account_id: str) -> Invoice | None:
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.account_id == account_id)
    )
    return result.scalar_one_or_none()


# ---------- Payment ----------

async def create_payment(db: AsyncSession, account_id: str, intent_id: str,
                         invoice_id: str) -> Payment:
    payment = Payment(
        id=_id("pay"),
        account_id=account_id,
        intent_id=intent_id,
        invoice_id=invoice_id,
        idempotency_key=f"{intent_id}:pay:v1",
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


async def get_payment(db: AsyncSession, payment_id: str,
                      account_id: str) -> Payment | None:
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.account_id == account_id)
    )
    return result.scalar_one_or_none()


async def get_payment_by_intent(db: AsyncSession, intent_id: str) -> Payment | None:
    result = await db.execute(
        select(Payment).where(Payment.intent_id == intent_id)
    )
    return result.scalar_one_or_none()


async def update_payment(db: AsyncSession, payment_id: str, **kwargs) -> None:
    await db.execute(
        update(Payment).where(Payment.id == payment_id).values(**kwargs)
    )
    await db.commit()


async def consume_approval_token(db: AsyncSession, payment_id: str,
                                 jti: str) -> bool:
    """Atomically consume a token — returns False if already consumed."""
    result = await db.execute(
        update(Payment)
        .where(Payment.id == payment_id, Payment.token_jti == jti,
               Payment.token_consumed.is_(False))
        .values(token_consumed=True)
        .returning(Payment.id)
    )
    await db.commit()
    return result.scalar_one_or_none() is not None


# ---------- User ----------

async def create_user(db: AsyncSession, email: str, name: str) -> User:
    user = User(id=_id("usr"), email=email, name=name)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_user(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def update_user(db: AsyncSession, user_id: str, **kwargs) -> None:
    await db.execute(update(User).where(User.id == user_id).values(**kwargs))
    await db.commit()


async def delete_user(db: AsyncSession, user_id: str) -> None:
    await db.execute(update(User).where(User.id == user_id).values(status="deleted"))
    await db.commit()


# ---------- Application ----------

async def create_application(db: AsyncSession, user_id: str, name: str,
                              api_key_hash: str, policies: dict, controls: dict) -> Application:
    app = Application(
        id=_id("app"), user_id=user_id, name=name,
        api_key_hash=api_key_hash, policies=policies, controls=controls,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


async def get_application(db: AsyncSession, app_id: str) -> Application | None:
    result = await db.execute(select(Application).where(Application.id == app_id))
    return result.scalar_one_or_none()


async def get_application_by_api_key(db: AsyncSession, api_key_hash: str) -> Application | None:
    result = await db.execute(
        select(Application).where(Application.api_key_hash == api_key_hash,
                                   Application.status == "active")
    )
    return result.scalar_one_or_none()


async def list_applications(db: AsyncSession, user_id: str) -> list[Application]:
    result = await db.execute(
        select(Application).where(Application.user_id == user_id,
                                   Application.status != "deleted")
    )
    return list(result.scalars().all())


async def update_application(db: AsyncSession, app_id: str, **kwargs) -> None:
    await db.execute(update(Application).where(Application.id == app_id).values(**kwargs))
    await db.commit()


# ---------- Connection ----------

async def create_connection(db: AsyncSession, application_id: str, type_: str,
                             credentials: dict, metadata: dict | None = None) -> Connection:
    conn = Connection(
        id=_id("conn"), application_id=application_id,
        type=type_, credentials=credentials, metadata_=metadata or {},
    )
    db.add(conn)
    await db.commit()
    await db.refresh(conn)
    return conn


async def get_connection(db: AsyncSession, conn_id: str,
                         application_id: str) -> Connection | None:
    result = await db.execute(
        select(Connection).where(Connection.id == conn_id,
                                  Connection.application_id == application_id)
    )
    return result.scalar_one_or_none()


async def list_connections(db: AsyncSession, application_id: str) -> list[Connection]:
    result = await db.execute(
        select(Connection).where(Connection.application_id == application_id,
                                  Connection.status != "revoked")
    )
    return list(result.scalars().all())


async def update_connection(db: AsyncSession, conn_id: str, **kwargs) -> None:
    await db.execute(update(Connection).where(Connection.id == conn_id).values(**kwargs))
    await db.commit()


# ---------- Reconciliation ----------

async def create_reconciliation(db: AsyncSession, payment_id: str,
                                 application_id: str | None) -> Reconciliation:
    rec = Reconciliation(id=_id("rec"), payment_id=payment_id, application_id=application_id)
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return rec


async def update_reconciliation(db: AsyncSession, rec_id: str, **kwargs) -> None:
    await db.execute(update(Reconciliation).where(Reconciliation.id == rec_id).values(**kwargs))
    await db.commit()


async def get_reconciliation_by_payment(db: AsyncSession, payment_id: str) -> Reconciliation | None:
    result = await db.execute(
        select(Reconciliation).where(Reconciliation.payment_id == payment_id)
    )
    return result.scalar_one_or_none()


# ---------- Event ----------

async def append_event(db: AsyncSession, account_id: str, type_: str,
                       intent_id: str | None = None, object_type: str | None = None,
                       object_id: str | None = None, data: dict | None = None) -> Event:
    event = Event(
        id=_id("evt"),
        account_id=account_id,
        intent_id=intent_id,
        type=type_,
        object_type=object_type,
        object_id=object_id,
        data=data or {},
    )
    db.add(event)
    await db.commit()
    return event
