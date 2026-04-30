"""Upload invoice PDFs to Azure Blob Storage."""
from __future__ import annotations

from core.config import settings
from core.logging import log


async def upload_invoice_to_blob(pdf_bytes: bytes, invoice_id: str) -> str | None:
    """Upload PDF bytes to the invoices container; returns the blob URL or None on failure."""
    if not settings.AZURE_BLOB_CONNECTION_STRING:
        log.debug("blob_storage.skip: AZURE_BLOB_CONNECTION_STRING not set")
        return None

    try:
        from azure.storage.blob.aio import BlobServiceClient

        blob_name = f"{invoice_id}/{invoice_id}.pdf"
        async with BlobServiceClient.from_connection_string(
            settings.AZURE_BLOB_CONNECTION_STRING
        ) as client:
            container = client.get_container_client(settings.AZURE_BLOB_CONTAINER)
            # Create container if it doesn't exist
            try:
                await container.create_container(public_access="blob")
            except Exception:
                pass  # Already exists

            blob = container.get_blob_client(blob_name)
            await blob.upload_blob(pdf_bytes, overwrite=True, content_settings=_pdf_content_settings())
            url = blob.url
            log.info("blob_storage.uploaded", invoice_id=invoice_id, url=url)
            return url

    except Exception as exc:
        log.warning("blob_storage.failed", invoice_id=invoice_id, error=str(exc))
        return None


def _pdf_content_settings():
    from azure.storage.blob import ContentSettings
    return ContentSettings(content_type="application/pdf")
