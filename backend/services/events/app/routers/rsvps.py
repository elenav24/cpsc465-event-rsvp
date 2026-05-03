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

router = APIRouter()


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this event")
    return member


@router.get("/{event_id}/rsvps", response_model=list[RSVPOut])
def get_rsvps(
    event_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Returns all RSVPs for an event. Members only."""
    _require_member(event_id, user_id, db)
    return db.query(RSVP).filter(RSVP.event_id == event_id).all()


@router.get("/{event_id}/rsvps/me", response_model=RSVPOut)
def get_my_rsvp(
    event_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    _require_member(event_id, user_id, db)
    rsvp = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == user_id).first()
    if not rsvp:
        raise HTTPException(status_code=404, detail="No RSVP found")
    return rsvp


@router.put("/{event_id}/rsvps", response_model=RSVPOut)
def upsert_rsvp(
    event_id: int,
    body: RSVPUpsert,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Create or update the current user's RSVP. Changing to 'no' releases potluck claims."""
    _require_member(event_id, user_id, db)

    rsvp = db.query(RSVP).filter(RSVP.event_id == event_id, RSVP.user_id == user_id).first()

    if rsvp:
        old_status = rsvp.status
        rsvp.status = body.status
        rsvp.guest_count = body.guest_count
    else:
        old_status = None
        rsvp = RSVP(event_id=event_id, user_id=user_id, status=body.status, guest_count=body.guest_count)
        db.add(rsvp)

    # Release potluck claims when switching to 'no'
    if body.status == "no" and old_status != "no":
        claims = db.query(PotluckClaim).join(
            PotluckClaim.item
        ).filter(
            PotluckClaim.user_id == user_id,
        ).all()
        # Filter to claims for this event
        from app.db.models.potluck import PotluckItem
        event_item_ids = [
            row.id for row in db.query(PotluckItem.id).filter(PotluckItem.event_id == event_id)
        ]
        for claim in claims:
            if claim.item_id in event_item_ids:
                db.delete(claim)

    db.commit()
    db.refresh(rsvp)
    return rsvp
