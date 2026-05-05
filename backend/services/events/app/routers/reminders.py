from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event import Event
from app.db.models.event_member import EventMember
from app.db.models.reminder import ReminderPreference
from app.schemas.reminder import ReminderCreate, ReminderOut
from app.utils.scheduler import create_reminder_schedule, delete_reminder_schedule
from app.routers._resolve import resolve_event

router = APIRouter()


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    return member


@router.get("/{event_uuid}/reminders", response_model=list[ReminderOut])
def get_my_reminders(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Returns the current user's reminder preferences for this event."""
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    return db.query(ReminderPreference).filter(
        ReminderPreference.event_id == event.id,
        ReminderPreference.user_id == user_id,
    ).all()


@router.post("/{event_uuid}/reminders", response_model=ReminderOut, status_code=status.HTTP_201_CREATED)
def create_reminder(
    event_uuid: str,
    body: ReminderCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Set a reminder for this event. Requires the user to have SMS opted in
    and a phone number on their profile (checked via the users service).
    Creates an EventBridge Scheduler rule to fire at the right time.
    """
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)

    if not event.start_dt:
        raise HTTPException(status_code=400, detail="Event has no start time set — cannot schedule reminder")

    # Check for duplicate offset
    existing = db.query(ReminderPreference).filter(
        ReminderPreference.event_id == event.id,
        ReminderPreference.user_id == user_id,
        ReminderPreference.offset_minutes == body.offset_minutes,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Reminder with this offset already exists")

    # Get user's phone number from EventMember denormalized field
    member = db.query(EventMember).filter(
        EventMember.event_id == event.id,
        EventMember.user_id == user_id,
    ).first()

    phone = getattr(member, "phone_number", None)
    if not phone:
        raise HTTPException(
            status_code=400,
            detail="No phone number on file. Update your profile to enable SMS reminders.",
        )

    rule_name = create_reminder_schedule(
        event_id=event.id,
        user_id=user_id,
        phone_number=phone,
        event_title=event.title,
        event_start=event.start_dt,
        offset_minutes=body.offset_minutes,
    )

    pref = ReminderPreference(
        event_id=event.id,
        user_id=user_id,
        offset_minutes=body.offset_minutes,
        scheduler_rule_name=rule_name,
    )
    db.add(pref)
    db.commit()
    db.refresh(pref)
    return pref


@router.delete("/{event_uuid}/reminders/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    event_uuid: str,
    reminder_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    pref = db.query(ReminderPreference).filter(
        ReminderPreference.id == reminder_id,
        ReminderPreference.event_id == event.id,
        ReminderPreference.user_id == user_id,
    ).first()
    if not pref:
        raise HTTPException(status_code=404, detail="Reminder not found")

    if pref.scheduler_rule_name:
        delete_reminder_schedule(pref.scheduler_rule_name)

    db.delete(pref)
    db.commit()
