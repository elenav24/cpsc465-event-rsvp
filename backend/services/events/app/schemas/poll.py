from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PollOptionCreate(BaseModel):
    text: str
    display_order: int = 0


class PollCreate(BaseModel):
    question: str
    options: list[PollOptionCreate]
    allow_multi_select: bool = False
    is_anonymous: bool = False
    closes_at: Optional[datetime] = None  # null = manual close only


class PollVoteCreate(BaseModel):
    option_ids: list[int]  # one item for single-select, multiple for multi-select


class PollOptionOut(BaseModel):
    id: int
    text: str
    display_order: int
    vote_count: int  # computed

    model_config = {"from_attributes": True}


class PollVoteOut(BaseModel):
    option_id: int
    voter_id: Optional[str] = None  # null if anonymous

    model_config = {"from_attributes": True}


class PollOut(BaseModel):
    id: int
    event_id: int
    created_by: str
    question: str
    allow_multi_select: bool
    is_anonymous: bool
    is_closed: bool
    closes_at: Optional[datetime]
    created_at: datetime
    options: list[PollOptionOut]
    # voter breakdown — empty list if anonymous and requester is not host/co-host
    votes: list[PollVoteOut] = []

    model_config = {"from_attributes": True}
