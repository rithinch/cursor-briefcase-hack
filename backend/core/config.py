from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    VERSION: str = "0.1.0"

    # database
    DATABASE_URL: str = "postgresql+asyncpg://pulp:pulp@localhost:5432/pulp"

    # llm
    ANTHROPIC_API_KEY: str = ""
    LLM_MODEL: str = "claude-sonnet-4-6"

    # rails — comma-separated list of enabled rail ids
    # e.g. "mock" | "wise" | "revolut,yapily" | "mock,wise"
    RAILS_ENABLED: str = "mock"
    WISE_API_KEY: str = ""
    REVOLUT_API_KEY: str = ""
    REVOLUT_CERT_PATH: str = ""      # path to revolut.csr / private.key
    REVOLUT_KEY_PATH: str = ""
    YAPILY_API_KEY: str = ""
    YAPILY_API_SECRET: str = ""

    # security
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    APPROVAL_TOKEN_EXPIRY_HOURS: int = 48

    # tracing — langsmith
    LANGCHAIN_TRACING_V2: str = "false"
    LANGCHAIN_API_KEY: str = ""
    LANGCHAIN_PROJECT: str = "pulp"

    # api
    API_BASE_URL: str = "http://localhost:8000"
    DEPLOYED_BASE_URL: str = ""  # public-facing base URL used in outbound links (e.g. WhatsApp messages)

    # azure blob storage
    AZURE_BLOB_CONNECTION_STRING: str = ""
    AZURE_BLOB_CONTAINER: str = "invoices"

    # twilio whatsapp
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"  # Twilio sandbox default


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
