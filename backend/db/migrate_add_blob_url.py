"""One-off migration: add blob_url column to invoices table."""
import asyncio
import asyncpg
from core.config import settings


async def main():
    url = settings.DATABASE_URL.replace("+asyncpg", "")
    conn = await asyncpg.connect(url)
    await conn.execute(
        "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS blob_url VARCHAR;"
    )
    await conn.close()
    print("Migration complete: blob_url column added to invoices.")


if __name__ == "__main__":
    asyncio.run(main())
