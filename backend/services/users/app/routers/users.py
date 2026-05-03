from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps.auth import get_current_user
from app.deps.db import get_db
from app.db.models.user import User
from app.schemas.user import UserOut, UserUpdate

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Returns the currently authenticated user (lazy-created on first call)."""
    return current_user


@router.put("/me", response_model=UserOut)
def update_me(
    body: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Update the current user's profile (display name, phone, SMS opt-in)."""
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    """Get a user's public profile by internal ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
