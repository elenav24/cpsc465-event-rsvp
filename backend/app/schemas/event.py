from pydantic import BaseModel
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
    created_at: datetime

    class Config:
        form_attributes = True

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None