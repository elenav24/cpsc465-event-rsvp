from pydantic import BaseModel, field_validator
from datetime import datetime


class RSVPUpsert(BaseModel):
    status: str  # yes | no | maybe
    guest_count: int = 0

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("yes", "no", "maybe"):
            raise ValueError("status must be yes, no, or maybe")
        return v

    @field_validator("guest_count")
    @classmethod
    def validate_guest_count(cls, v: int) -> int:
        if v < 0:
            raise ValueError("guest_count cannot be negative")
        return v


class RSVPOut(BaseModel):
    id: int
    event_id: int
    user_id: str
    status: str
    guest_count: int
    updated_at: datetime

    model_config = {"from_attributes": True}
