from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps.db import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserOut

router = APIRouter()


@router.get("", response_model=list[UserOut])
def get_users(
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(User).all()


@router.get("/{user_id}", response_model=UserOut | None)
def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
):

    return db.query(User).filter(User.id == user_id).first()


@router.post("", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    existing_user = db.query(User).filter((User.id == user_in.id)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    user = User(**user_in.model_dump())
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
