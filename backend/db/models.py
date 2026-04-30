from sqlalchemy import (
    Column, String, Numeric, Integer, Boolean,
    DateTime, JSON, ForeignKey, Text, func,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id         = Column(String, primary_key=True)               # usr_
    email      = Column(String, unique=True, nullable=False)
    name       = Column(String, nullable=False)
    status     = Column(String, default="active")               # active | suspended
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    applications = relationship("Application", back_populates="user")


class Application(Base):
    __tablename__ = "applications"

    id           = Column(String, primary_key=True)             # app_
    user_id      = Column(String, ForeignKey("users.id"), nullable=False)
    name         = Column(String, nullable=False)
    api_key_hash = Column(String, nullable=False, unique=True)
    # fixed at creation — never overridden by payment/invoice endpoints
    policies     = Column(JSON, nullable=False)                 # approval thresholds, auto_pay rules
    controls     = Column(JSON, nullable=False)                 # max_amount, allowed_rails, currencies
    status       = Column(String, default="active")             # active | suspended
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    user        = relationship("User", back_populates="applications")
    connections = relationship("Connection", back_populates="application")


class Connection(Base):
    __tablename__ = "connections"

    id             = Column(String, primary_key=True)           # conn_
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    type           = Column(String, nullable=False)             # email|xero|quickbooks|yapily|wise|revolut
    credentials    = Column(JSON, default=dict)                 # tokens, keys (store encrypted in prod)
    status         = Column(String, default="active")           # active | expired | revoked
    metadata_      = Column("metadata", JSON, default=dict)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())

    application = relationship("Application", back_populates="connections")


class Reconciliation(Base):
    __tablename__ = "reconciliations"

    id             = Column(String, primary_key=True)           # rec_
    payment_id     = Column(String, ForeignKey("payments.id"), nullable=False)
    application_id = Column(String, nullable=True)
    provider       = Column(String, nullable=True)              # xero | quickbooks | none
    status         = Column(String, default="pending")          # pending | completed | skipped | failed
    external_ref   = Column(String, nullable=True)              # Xero/QB invoice/bill ID
    data           = Column(JSON, default=dict)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())


class Account(Base):
    __tablename__ = "accounts"

    id              = Column(String, primary_key=True)          # acct_
    name            = Column(String, nullable=False)
    status          = Column(String, default="active")          # active | suspended
    api_key_hash    = Column(String, nullable=False)
    approval_policy = Column(JSON, nullable=False)
    config          = Column(JSON, default=dict)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())



class Intent(Base):
    __tablename__ = "intents"

    id               = Column(String, primary_key=True)         # loop_
    account_id       = Column(String, nullable=False)           # acct_ or app_ tenant id
    status           = Column(String, default="pending_invoice")
    vendor           = Column(JSON, nullable=False)             # name, email, trust_level
    amount           = Column(JSON, nullable=False)             # expected, currency, tolerance_pct
    context          = Column(JSON, default=dict)               # description, job_id, reference
    policy_override  = Column(JSON, nullable=True)
    metadata_        = Column("metadata", JSON, default=dict)
    expires_at       = Column(DateTime(timezone=True), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())

    invoice  = relationship("Invoice", back_populates="intent", uselist=False)
    payment  = relationship("Payment", back_populates="intent", uselist=False)
    events   = relationship("Event",   back_populates="intent")


class Invoice(Base):
    __tablename__ = "invoices"

    id           = Column(String, primary_key=True)             # inv_
    account_id   = Column(String, nullable=False)               # acct_ or app_ tenant id
    intent_id    = Column(String, ForeignKey("intents.id"),  nullable=True)
    status       = Column(String, default="received")           # received | verified | failed
    source       = Column(JSON, default=dict)                   # type, from_address, subject
    parsed       = Column(JSON, nullable=True)                  # vendor_name, amount, line_items…
    validation   = Column(JSON, nullable=True)                  # result, confidence, reasoning_trace
    raw_text     = Column(Text, nullable=True)
    blob_url     = Column(String, nullable=True)                 # Azure Blob URL for the PDF
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    intent = relationship("Intent",  back_populates="invoice")


class Payment(Base):
    __tablename__ = "payments"

    id                 = Column(String, primary_key=True)       # pay_
    account_id         = Column(String, nullable=False)         # acct_ or app_ tenant id
    intent_id          = Column(String, ForeignKey("intents.id"), nullable=False)
    invoice_id         = Column(String, ForeignKey("invoices.id"), nullable=True)
    status             = Column(String, default="pending")
    idempotency_key    = Column(String, unique=True, nullable=False)
    amount             = Column(Numeric(18, 2), nullable=True)
    currency           = Column(String(3), nullable=True)
    rail_id            = Column(String, nullable=True)
    rail_reasoning     = Column(Text, nullable=True)
    approval           = Column(JSON, default=dict)             # decision, token_jti, sent_to…
    execution          = Column(JSON, default=dict)             # provider_payment_id, executed_at…
    reconciliation     = Column(JSON, default=dict)
    token_consumed     = Column(Boolean, default=False)
    token_jti          = Column(String, nullable=True)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())
    updated_at         = Column(DateTime(timezone=True), onupdate=func.now())

    intent          = relationship("Intent",  back_populates="payment")
    reconciliation  = relationship("Reconciliation", backref="payment", uselist=False,
                                   primaryjoin="Payment.id == foreign(Reconciliation.payment_id)")


class Event(Base):
    __tablename__ = "events"

    id          = Column(String, primary_key=True)              # evt_
    account_id  = Column(String, nullable=False)                # acct_ or app_ tenant id
    intent_id   = Column(String, ForeignKey("intents.id"),  nullable=True)
    type        = Column(String, nullable=False)                # intent.created, payment.approved…
    object_type = Column(String, nullable=True)
    object_id   = Column(String, nullable=True)
    data        = Column(JSON, default=dict)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    intent = relationship("Intent", back_populates="events")


class Webhook(Base):
    __tablename__ = "webhooks"

    id                  = Column(String, primary_key=True)      # wh_
    account_id          = Column(String, nullable=False)        # acct_ or app_ tenant id
    url                 = Column(String, nullable=False)
    status              = Column(String, default="active")
    subscribed_events   = Column(JSON, default=list)
    signing_secret      = Column(String, nullable=False)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())

