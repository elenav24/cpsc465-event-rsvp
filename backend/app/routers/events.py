from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps.db import get_db
from app.db.models import Event
from app.schemas.event import EventCreate, EventOut, EventUpdate

router = APIRouter()


@router.get("", response_model=list[EventOut])
def get_events(
    db: Annotated[Session, Depends(get_db)],
):
    return db.query(Event).all()


@router.get("/{user_id}", response_model=EventOut | None)
def get_user_events(
    user_id: str,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Get all events hosted by a user.
    """
    return db.query(Event).filter(Event.host_id == user_id).all()


@router.post("", response_model=EventOut)
def event(
    event_in: EventCreate,
    db: Annotated[Session, Depends(get_db)],
):
    event = Event(**event_in.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Update an event by its ID.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    for key, value in event_in.dict(exclude_unset=True).items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", response_model=dict)
def delete_event(
    event_id: int,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Delete an event by its ID.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}