"""One-off migration: add company_verification column to invoices table."""
import asyncio
import asyncpg
from core.config import settings


async def main():
    url = settings.DATABASE_URL.replace("+asyncpg", "")
    conn = await asyncpg.connect(url)
    await conn.execute(
        "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS company_verification JSONB;"
    )
    await conn.close()
    print("Migration complete: company_verification column added to invoices.")


if __name__ == "__main__":
    asyncio.run(main())

