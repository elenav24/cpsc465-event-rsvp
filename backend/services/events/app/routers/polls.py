from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event_member import EventMember
from app.db.models.poll import Poll, PollOption, PollVote
from app.schemas.poll import PollCreate, PollVoteCreate, PollOut, PollOptionOut, PollVoteOut
from app.routers._resolve import resolve_event

router = APIRouter()


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    return member


def _require_host_or_cohost(event_id: int, user_id: str, db: Session) -> EventMember:
    member = _require_member(event_id, user_id, db)
    if member.role not in ("host", "co_host"):
        raise HTTPException(status_code=403, detail="Host or co-host access required")
    return member


def _build_poll_out(poll: Poll, requester_id: str, is_privileged: bool) -> PollOut:
    """Build PollOut, hiding voter identities for anonymous polls from non-privileged users."""
    options_out = []
    for opt in poll.options:
        options_out.append(PollOptionOut(
            id=opt.id,
            text=opt.text,
            display_order=opt.display_order,
            vote_count=len(opt.votes),
        ))

    votes_out = []
    if not poll.is_anonymous or is_privileged:
        for vote in poll.votes:
            votes_out.append(PollVoteOut(
                option_id=vote.option_id,
                voter_id=vote.voter_id if (not poll.is_anonymous or is_privileged) else None,
            ))

    return PollOut(
        id=poll.id,
        event_id=poll.event_id,
        created_by=poll.created_by,
        question=poll.question,
        allow_multi_select=poll.allow_multi_select,
        is_anonymous=poll.is_anonymous,
        is_closed=poll.is_closed,
        closes_at=poll.closes_at,
        created_at=poll.created_at,
        options=options_out,
        votes=votes_out,
    )


@router.get("/{event_uuid}/polls", response_model=list[PollOut])
def get_polls(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    member = _require_member(event.id, user_id, db)
    is_privileged = member.role in ("host", "co_host")
    polls = db.query(Poll).filter(Poll.event_id == event.id).all()
    return [_build_poll_out(p, user_id, is_privileged) for p in polls]


@router.post("/{event_uuid}/polls", response_model=PollOut, status_code=status.HTTP_201_CREATED)
def create_poll(
    event_uuid: str,
    body: PollCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    if len(body.options) < 2:
        raise HTTPException(status_code=400, detail="A poll must have at least 2 options")

    poll = Poll(
        event_id=event.id,
        created_by=user_id,
        question=body.question,
        allow_multi_select=body.allow_multi_select,
        is_anonymous=body.is_anonymous,
        closes_at=body.closes_at,
    )
    db.add(poll)
    db.flush()

    for opt in body.options:
        db.add(PollOption(poll_id=poll.id, text=opt.text, display_order=opt.display_order))

    db.commit()
    db.refresh(poll)
    return _build_poll_out(poll, user_id, True)


@router.post("/{event_uuid}/polls/{poll_id}/vote", response_model=PollOut)
def vote(
    event_uuid: str,
    poll_id: int,
    body: PollVoteCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    member = _require_member(event.id, user_id, db)
    is_privileged = member.role in ("host", "co_host")

    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.event_id == event.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")

    # Auto-close if past closes_at
    if poll.closes_at and datetime.now(timezone.utc) > poll.closes_at.replace(tzinfo=timezone.utc):
        poll.is_closed = True
        db.commit()

    if poll.is_closed:
        raise HTTPException(status_code=400, detail="This poll is closed")

    if not body.option_ids:
        raise HTTPException(status_code=400, detail="Must select at least one option")
    if not poll.allow_multi_select and len(body.option_ids) > 1:
        raise HTTPException(status_code=400, detail="This poll only allows one selection")

    # Validate all option_ids belong to this poll
    valid_ids = {opt.id for opt in poll.options}
    for oid in body.option_ids:
        if oid not in valid_ids:
            raise HTTPException(status_code=400, detail=f"Option {oid} does not belong to this poll")

    # Remove existing votes from this user on this poll
    db.query(PollVote).filter(PollVote.poll_id == poll_id, PollVote.voter_id == user_id).delete()

    for oid in body.option_ids:
        db.add(PollVote(poll_id=poll_id, option_id=oid, voter_id=user_id))

    db.commit()
    db.refresh(poll)
    return _build_poll_out(poll, user_id, is_privileged)


@router.post("/{event_uuid}/polls/{poll_id}/close", response_model=PollOut)
def close_poll(
    event_uuid: str,
    poll_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.event_id == event.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    poll.is_closed = True
    db.commit()
    db.refresh(poll)
    return _build_poll_out(poll, user_id, True)


@router.delete("/{event_uuid}/polls/{poll_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_poll(
    event_uuid: str,
    poll_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    poll = db.query(Poll).filter(Poll.id == poll_id, Poll.event_id == event.id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    db.delete(poll)
    db.commit()
