from typing import Annotated
from fastapi import APIRouter, Depends
from app.deps.auth import get_current_user
from app.db.models.user import User
from app.schemas.user import UserOut

router = APIRouter()


@router.get("/me", response_model=UserOut)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Returns the currently authenticated user (lazy-created on first call)."""
    return current_user
