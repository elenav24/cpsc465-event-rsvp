from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    id: int
    cognito_sub: str
    email: Optional[EmailStr] = None
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    sms_opted_in: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    phone_number: Optional[str] = None  # E.164 format
    sms_opted_in: Optional[bool] = None
