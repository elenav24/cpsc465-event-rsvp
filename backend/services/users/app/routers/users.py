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

    # If display_name changed, propagate to all event_members records and broadcast
    if body.display_name is not None:
        _sync_display_name(current_user.cognito_sub, body.display_name, db)

    return current_user


def _sync_display_name(cognito_sub: str, display_name: str, db: Session) -> None:
    """
    Update display_name on every EventMember row for this user and broadcast
    a member upsert to each affected event so all open clients update in real time.
    """
    try:
        # Import here to avoid circular deps — events DB models live in a sibling service
        # In production both services share the same RDS instance so we can query directly.
        from sqlalchemy import text

        rows = db.execute(
            text(
                "UPDATE event_members SET display_name = :name WHERE user_id = :uid RETURNING id, event_id, user_id, role, display_name, joined_at"
            ),
            {"name": display_name, "uid": cognito_sub},
        ).fetchall()
        db.commit()

        # Broadcast member upsert for each affected event
        try:
            from app.utils.broadcast import broadcast_event_update  # type: ignore

            for row in rows:
                broadcast_event_update(
                    row.event_id,
                    "member",
                    "upsert",
                    {
                        "id": row.id,
                        "event_id": row.event_id,
                        "user_id": row.user_id,
                        "role": row.role,
                        "display_name": row.display_name,
                        "joined_at": (
                            row.joined_at.isoformat() if row.joined_at else None
                        ),
                    },
                )
        except Exception:
            pass
    except Exception:
        pass


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
