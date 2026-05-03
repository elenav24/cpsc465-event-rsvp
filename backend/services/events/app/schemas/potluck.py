from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PotluckItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    quantity_needed: int = 1


class PotluckItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity_needed: Optional[int] = None


class PotluckClaimOut(BaseModel):
    id: int
    item_id: int
    user_id: str
    claimed_at: datetime

    model_config = {"from_attributes": True}


class PotluckItemOut(BaseModel):
    id: int
    event_id: int
    created_by: str
    name: str
    description: Optional[str]
    quantity_needed: int
    claims_count: int  # computed
    claims: list[PotluckClaimOut]
    created_at: datetime

    model_config = {"from_attributes": True}
