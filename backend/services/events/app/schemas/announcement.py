from pydantic import BaseModel
from datetime import datetime


class AnnouncementCreate(BaseModel):
    body: str


class AnnouncementOut(BaseModel):
    id: int
    event_id: int
    author_id: str
    body: str
    sms_sent: bool
    created_at: datetime

    model_config = {"from_attributes": True}
