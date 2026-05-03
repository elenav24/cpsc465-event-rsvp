from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: Optional[str] = None  # cognito_sub
    due_date: Optional[datetime] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None


class TaskOut(BaseModel):
    id: int
    event_id: int
    created_by: str
    title: str
    description: Optional[str]
    assigned_to: Optional[str]
    due_date: Optional[datetime]
    is_completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
