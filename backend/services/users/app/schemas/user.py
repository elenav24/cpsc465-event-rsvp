from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserOut(BaseModel):
    id: int
    cognito_sub: str
    email: Optional[EmailStr] = None
    created_at: datetime

    model_config = {"from_attributes": True}
