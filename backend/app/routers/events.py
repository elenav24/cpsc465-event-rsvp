from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from app.utils.upload_to_s3 import upload_file_to_s3
from sqlalchemy.orm import Session
from app.deps.db import get_db
from app.db.models import Event
from app.schemas.event import EventCreate, EventOut, EventUpdate

router = APIRouter()

def event_form_data(
    title: str = Form(...),
    host_id: int = Form(...),
    description: Optional[str] = Form(None),
) -> EventCreate:
    return EventCreate(title=title, host_id=host_id, description=description)

def update_form_data(
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
) -> EventUpdate:
    return EventUpdate(title=title, description=description)


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
def create_event(
    db: Annotated[Session, Depends(get_db)],
    event_in: Annotated[EventCreate, Depends(event_form_data)],
    flyer: UploadFile = File(...)
):

    try:
        flyer_url = upload_file_to_s3(flyer)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to upload flyer")

    new_event = Event(
        **event_in.model_dump(), 
        flyer_url=flyer_url
    )
    
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    db: Annotated[Session, Depends(get_db)],
    event_in: Annotated[EventUpdate, Depends(update_form_data)],
    flyer: Optional[UploadFile] = File(None)
):
    """
    Update an event by its ID, including an optional new flyer.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = event_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    if flyer:
        try:
            flyer_url = upload_file_to_s3(flyer)
            event.flyer_url = flyer_url
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload new flyer")

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