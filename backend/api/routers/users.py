import hashlib
import secrets
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from db.repos import SessionLocal, create_user, get_user, get_user_by_email, update_user, delete_user

router = APIRouter(prefix="/v1/users", tags=["users"])


class CreateUserRequest(BaseModel):
    email: EmailStr
    name: str


class UpdateUserRequest(BaseModel):
    name: str | None = None


@router.post("", status_code=201)
async def create(req: CreateUserRequest):
    async with SessionLocal() as db:
        existing = await get_user_by_email(db, req.email)
        if existing:
            raise HTTPException(status.HTTP_409_CONFLICT,
                                detail={"error": {"code": "email_taken",
                                                  "message": "A user with this email already exists"}})
        user = await create_user(db, email=req.email, name=req.name)

    return _fmt(user)


@router.get("/lookup")
async def lookup(email: str):
    async with SessionLocal() as db:
        user = await get_user_by_email(db, email)
    if user is None or user.status == "deleted":
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            detail={"error": {"code": "user_not_found"}})
    return _fmt(user)


@router.get("/{user_id}")
async def get(user_id: str):
    async with SessionLocal() as db:
        user = await get_user(db, user_id)
    if user is None or user.status == "deleted":
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            detail={"error": {"code": "user_not_found"}})
    return _fmt(user)


@router.patch("/{user_id}")
async def patch(user_id: str, req: UpdateUserRequest):
    async with SessionLocal() as db:
        user = await get_user(db, user_id)
        if user is None or user.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "user_not_found"}})
        updates = req.model_dump(exclude_none=True)
        if updates:
            await update_user(db, user_id, **updates)
        user = await get_user(db, user_id)
    return _fmt(user)


@router.delete("/{user_id}", status_code=204)
async def delete(user_id: str):
    async with SessionLocal() as db:
        user = await get_user(db, user_id)
        if user is None or user.status == "deleted":
            raise HTTPException(status.HTTP_404_NOT_FOUND,
                                detail={"error": {"code": "user_not_found"}})
        await delete_user(db, user_id)


def _fmt(user) -> dict:
    return {
        "id":         user.id,
        "email":      user.email,
        "name":       user.name,
        "status":     user.status,
        "created_at": user.created_at.isoformat(),
    }
