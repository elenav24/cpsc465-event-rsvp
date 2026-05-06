from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class EventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    recurrence_rule: Optional[str] = None  # DAILY | WEEKLY | MONTHLY
    recurrence_end_dt: Optional[datetime] = None
    viewable_by_link: bool = False


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    recurrence_end_dt: Optional[datetime] = None
    viewable_by_link: Optional[bool] = None


class EventOut(BaseModel):
    id: int
    uuid: str
    title: str
    host_id: str
    description: Optional[str] = None
    location: Optional[str] = None
    flyer_url: Optional[str] = None
    start_dt: Optional[datetime] = None
    end_dt: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    recurrence_end_dt: Optional[datetime] = None
    parent_event_id: Optional[int] = None
    invite_token: Optional[str] = None
    invite_active: bool
    viewable_by_link: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class MemberOut(BaseModel):
    id: int
    event_id: int
    user_id: str
    role: str
    display_name: Optional[str] = None
    joined_at: datetime

    model_config = {"from_attributes": True}


class JoinResult(BaseModel):
    """Returned by the join-via-invite endpoint so the frontend can redirect."""

    id: int
    event_id: int
    event_uuid: str
    user_id: str
    role: str
    joined_at: datetime


class MemberRoleUpdate(BaseModel):
    role: str  # co_host | attendee
