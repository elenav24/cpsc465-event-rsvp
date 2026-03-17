from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime

class EventCreate(BaseModel):
    title: str
    host_id: int
    description: Optional[str] = None

class EventOut(BaseModel):
    id: int
    title: str
    host_id: int
    description: Optional[str] = None
    flyer_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
