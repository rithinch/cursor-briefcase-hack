from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from db.repos import (SessionLocal, get_application, create_connection, get_connection,
                      list_connections, update_connection)

router = APIRouter(prefix="/v1/applications", tags=["connections"])

VALID_TYPES = {"email", "xero", "quickbooks", "yapily", "wise", "revolut"}


class CreateConnectionRequest(BaseModel):
    type: str
    credentials: dict = {}
    metadata: dict = {}


class UpdateConnectionRequest(BaseModel):
    credentials: dict | None = None
    status: str | None = None
    metadata: dict | None = None


@router.post("/{app_id}/connections", status_code=201)
async def create(app_id: str, req: CreateConnectionRequest):
    if req.type not in VALID_TYPES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail={"error": {"code": "invalid_connection_type",
                                              "message": f"type must be one of {sorted(VALID_TYPES)}"}})
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
        if app is None or app.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "application_not_found"}})
        conn = await create_connection(db, application_id=app_id, type_=req.type,
                                       credentials=req.credentials, metadata=req.metadata)
    return _fmt(conn)


@router.get("/{app_id}/connections")
async def list_(app_id: str):
    async with SessionLocal() as db:
        app = await get_application(db, app_id)
        if app is None or app.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "application_not_found"}})
        connections = await list_connections(db, app_id)
    return {"data": [_fmt(c) for c in connections]}


@router.get("/{app_id}/connections/{conn_id}")
async def get(app_id: str, conn_id: str):
    async with SessionLocal() as db:
        conn = await get_connection(db, conn_id, app_id)
    if conn is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            detail={"error": {"code": "connection_not_found"}})
    return _fmt(conn)


@router.patch("/{app_id}/connections/{conn_id}")
async def patch(app_id: str, conn_id: str, req: UpdateConnectionRequest):
    async with SessionLocal() as db:
        conn = await get_connection(db, conn_id, app_id)
        if conn is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "connection_not_found"}})
        updates = {k: v for k, v in {
            "credentials": req.credentials,
            "status":      req.status,
            "metadata_":   req.metadata,
        }.items() if v is not None}
        if updates:
            await update_connection(db, conn_id, **updates)
        conn = await get_connection(db, conn_id, app_id)
    return _fmt(conn)


@router.delete("/{app_id}/connections/{conn_id}", status_code=204)
async def delete(app_id: str, conn_id: str):
    async with SessionLocal() as db:
        conn = await get_connection(db, conn_id, app_id)
        if conn is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "connection_not_found"}})
        await update_connection(db, conn_id, status="revoked")


def _fmt(conn) -> dict:
    return {
        "id":             conn.id,
        "application_id": conn.application_id,
        "type":           conn.type,
        "status":         conn.status,
        "metadata":       conn.metadata_,
        "created_at":     conn.created_at.isoformat(),
    }
