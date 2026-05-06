from datetime import datetime
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from app.utils.upload_to_s3 import upload_file_to_s3
from app.deps.auth import get_current_user
from app.db.models.user import User
from sqlalchemy.orm import Session
from app.deps.db import get_db
from app.db.models import Event
from app.schemas.event import EventOut, EventUpdate

router = APIRouter()


def _parse_dt(val: Optional[str]) -> Optional[datetime]:
    return datetime.fromisoformat(val) if val else None


# ── Event CRUD ────────────────────────────────────────────────────────────────


@router.get("", response_model=list[EventOut])
def get_events(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Return all events hosted by the current user."""
    return db.query(Event).filter(Event.host_id == current_user.id).all()


@router.get("/{event_id}", response_model=EventOut)
def get_event(
    event_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("", response_model=EventOut)
def create_event(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    title: str = Form(...),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    start_dt: Optional[str] = Form(None),
    end_dt: Optional[str] = Form(None),
    flyer: Optional[UploadFile] = File(None),
):
    """
    Create a new event. host_id is taken from the JWT — do not pass it in the form.
    flyer is optional.
    """
    flyer_url = None
    if flyer and flyer.filename:
        try:
            flyer_url = upload_file_to_s3(flyer)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload flyer")

    new_event = Event(
        title=title,
        host_id=current_user.id,
        description=description,
        location=location,
        start_dt=_parse_dt(start_dt),
        end_dt=_parse_dt(end_dt),
        flyer_url=flyer_url,
    )

    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    start_dt: Optional[str] = Form(None),
    end_dt: Optional[str] = Form(None),
    flyer: Optional[UploadFile] = File(None),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the host can update this event"
        )

    if title is not None:
        event.title = title
    if description is not None:
        event.description = description
    if location is not None:
        event.location = location
    if start_dt is not None:
        event.start_dt = _parse_dt(start_dt)
    if end_dt is not None:
        event.end_dt = _parse_dt(end_dt)

    if flyer and flyer.filename:
        try:
            event.flyer_url = upload_file_to_s3(flyer)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload new flyer")

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", response_model=dict)
def delete_event(
    event_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Only the host can delete this event"
        )
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}
