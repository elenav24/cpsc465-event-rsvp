"""Shared helper to resolve event UUID path param → Event model instance."""

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models.event import Event


def resolve_event(event_uuid: str, db: Session) -> Event:
    """Look up an event by its public UUID. Raises 404 if not found."""
    event = db.query(Event).filter(Event.uuid == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event
