from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event import Event
from app.db.models.event_member import EventMember
from app.db.models.rsvp import RSVP
from app.db.models.potluck import PotluckClaim
from app.schemas.rsvp import RSVPUpsert, RSVPOut
from app.routers._resolve import resolve_event

router = APIRouter()


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=403, detail="You are not a member of this event"
        )
    return member


@router.get("/{event_uuid}/rsvps", response_model=list[RSVPOut])
def get_rsvps(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Returns all RSVPs for an event. Members only."""
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    return db.query(RSVP).filter(RSVP.event_id == event.id).all()


@router.get("/{event_uuid}/rsvps/me", response_model=RSVPOut)
def get_my_rsvp(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    rsvp = (
        db.query(RSVP)
        .filter(RSVP.event_id == event.id, RSVP.user_id == user_id)
        .first()
    )
    if not rsvp:
        raise HTTPException(status_code=404, detail="No RSVP found")
    return rsvp


@router.put("/{event_uuid}/rsvps", response_model=RSVPOut)
def upsert_rsvp(
    event_uuid: str,
    body: RSVPUpsert,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create or update the current user's RSVP. Changing to 'no' releases potluck claims."""
    event = resolve_event(event_uuid, db)
    event_id = event.id
    _require_member(event_id, user_id, db)

    rsvp = (
        db.query(RSVP)
        .filter(RSVP.event_id == event_id, RSVP.user_id == user_id)
        .first()
    )

    if rsvp:
        old_status = rsvp.status
        rsvp.status = body.status
        rsvp.guest_count = body.guest_count
    else:
        old_status = None
        rsvp = RSVP(
            event_id=event_id,
            user_id=user_id,
            status=body.status,
            guest_count=body.guest_count,
        )
        db.add(rsvp)

    # Release potluck claims when switching to 'no'
    if body.status == "no" and old_status != "no":
        from app.db.models.potluck import PotluckItem

        event_item_ids = [
            row.id
            for row in db.query(PotluckItem.id).filter(PotluckItem.event_id == event_id)
        ]
        claims = (
            db.query(PotluckClaim)
            .filter(
                PotluckClaim.user_id == user_id,
                PotluckClaim.item_id.in_(event_item_ids),
            )
            .all()
        )
        for claim in claims:
            db.delete(claim)

    db.commit()
    db.refresh(rsvp)

    try:
        from app.utils.broadcast import broadcast_event_update

        broadcast_event_update(
            event_id,
            "rsvp",
            "upsert",
            {
                "id": rsvp.id,
                "event_id": rsvp.event_id,
                "user_id": rsvp.user_id,
                "status": rsvp.status,
                "guest_count": rsvp.guest_count,
                "updated_at": rsvp.updated_at.isoformat() if rsvp.updated_at else None,
            },
        )
    except Exception:
        pass

    return rsvp
