from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps.auth import require_clerk_auth
from app.deps.db import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserOut

router = APIRouter()


@router.get("/users/{user_id}", response_model=UserOut | None)
def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    auth_id: Annotated[str, Depends(require_clerk_auth)],
):
    if auth_id != user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return db.query(User).filter(User.id == user_id).first()


@router.post("/users", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    auth_id: Annotated[str, Depends(require_clerk_auth)],
):
    if auth_id != user_in.id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    existing_user = db.query(User).filter((User.id == user_in.id)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(**user_in.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
