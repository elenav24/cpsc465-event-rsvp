from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional

VALID_OFFSETS = {60, 360, 1440, 10080, 43200, 525600}  # 1h, 6h, 24h, 1wk, 30d, 1yr (in minutes)


class ReminderCreate(BaseModel):
    offset_minutes: int

    @field_validator("offset_minutes")
    @classmethod
    def validate_offset(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("offset_minutes must be positive")
        return v


class ReminderOut(BaseModel):
    id: int
    event_id: int
    user_id: str
    offset_minutes: int
    created_at: datetime

    model_config = {"from_attributes": True}
