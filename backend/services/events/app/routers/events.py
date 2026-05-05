import secrets
import uuid as _uuid
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.utils.upload_to_s3 import upload_file_to_s3
from app.db.models.event import Event
from app.db.models.event_member import EventMember
from app.schemas.event import EventCreate, EventOut, EventUpdate, MemberOut, MemberRoleUpdate, JoinResult

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_event_by_uuid_or_404(event_uuid: str, db: Session) -> Event:
    event = db.query(Event).filter(Event.uuid == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _get_event_or_404(event_id: int, db: Session) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


def _get_member(event_id: int, user_id: str, db: Session) -> Optional[EventMember]:
    return db.query(EventMember).filter(
        EventMember.event_id == event_id,
        EventMember.user_id == user_id,
    ).first()


def _require_host_or_cohost(event_id: int, user_id: str, db: Session) -> EventMember:
    member = _get_member(event_id, user_id, db)
    if not member or member.role not in ("host", "co_host"):
        raise HTTPException(status_code=403, detail="Host or co-host access required")
    return member


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = _get_member(event_id, user_id, db)
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this event")
    return member


# ── Event CRUD ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[EventOut])
def get_my_events(
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Returns all events the current user is a member of."""
    memberships = db.query(EventMember).filter(EventMember.user_id == user_id).all()
    event_ids = [m.event_id for m in memberships]
    return db.query(Event).filter(Event.id.in_(event_ids)).all()


@router.get("/{event_uuid}", response_model=EventOut)
def get_event(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = _get_event_by_uuid_or_404(event_uuid, db)
    member = _get_member(event.id, user_id, db)
    if not member and not event.viewable_by_link:
        raise HTTPException(status_code=403, detail="Access denied")
    return event


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
    title: str = Form(...),
    description: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    start_dt: Optional[str] = Form(None),
    end_dt: Optional[str] = Form(None),
    recurrence_rule: Optional[str] = Form(None),
    recurrence_end_dt: Optional[str] = Form(None),
    viewable_by_link: bool = Form(False),
    display_name: Optional[str] = Form(None),
    flyer: Optional[UploadFile] = File(None),
):
    from datetime import datetime

    def parse_dt(val):
        return datetime.fromisoformat(val) if val else None

    flyer_url = None
    if flyer:
        try:
            flyer_url = upload_file_to_s3(flyer)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to upload flyer")

    event = Event(
        uuid=str(_uuid.uuid4()),
        title=title,
        description=description,
        location=location,
        host_id=user_id,
        start_dt=parse_dt(start_dt),
        end_dt=parse_dt(end_dt),
        recurrence_rule=recurrence_rule,
        recurrence_end_dt=parse_dt(recurrence_end_dt),
        viewable_by_link=viewable_by_link,
        flyer_url=flyer_url,
        invite_token=secrets.token_urlsafe(16),
        invite_active=True,
    )
    db.add(event)
    db.flush()  # get event.id before adding member

    # Add creator as host member
    db.add(EventMember(event_id=event.id, user_id=user_id, role="host", display_name=display_name))
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_uuid}", response_model=EventOut)
def update_event(
    event_uuid: str,
    body: EventUpdate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = _get_event_by_uuid_or_404(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = _get_event_by_uuid_or_404(event_uuid, db)
    member = _get_member(event.id, user_id, db)
    if not member or member.role != "host":
        raise HTTPException(status_code=403, detail="Only the host can delete an event")
    db.delete(event)
    db.commit()


# ── Invite link ───────────────────────────────────────────────────────────────

@router.post("/{event_uuid}/invite/regenerate", response_model=EventOut)
def regenerate_invite(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Revoke the current invite link and generate a new token."""
    event = _get_event_by_uuid_or_404(event_uuid, db)
    member = _get_member(event.id, user_id, db)
    if not member or member.role != "host":
        raise HTTPException(status_code=403, detail="Only the host can regenerate the invite link")
    event.invite_token = secrets.token_urlsafe(16)
    event.invite_active = True
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_uuid}/invite/revoke", response_model=EventOut)
def revoke_invite(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Disable the invite link without generating a new one."""
    event = _get_event_by_uuid_or_404(event_uuid, db)
    member = _get_member(event.id, user_id, db)
    if not member or member.role != "host":
        raise HTTPException(status_code=403, detail="Only the host can revoke the invite link")
    event.invite_active = False
    db.commit()
    db.refresh(event)
    return event


@router.post("/join/{invite_token}", response_model=JoinResult, status_code=status.HTTP_201_CREATED)
def join_via_invite(
    invite_token: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
    display_name: Optional[str] = None,
):
    """
    Called after login when the user has an invite token.
    Adds them as an attendee if not already a member.
    Also resolves any pending invite records for this token.
    """
    from app.db.models.pending_invite import PendingInvite

    event = db.query(Event).filter(
        Event.invite_token == invite_token,
        Event.invite_active == True,  # noqa: E712
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid or revoked invite link")

    existing = _get_member(event.id, user_id, db)
    if existing:
        # Update display_name if it was missing before
        if display_name and not existing.display_name:
            existing.display_name = display_name
            db.commit()
            db.refresh(existing)
        return JoinResult(
            id=existing.id,
            event_id=existing.event_id,
            event_uuid=event.uuid,
            user_id=existing.user_id,
            role=existing.role,
            joined_at=existing.joined_at,
        )

    member = EventMember(event_id=event.id, user_id=user_id, role="attendee", display_name=display_name)
    db.add(member)

    # Clean up any pending invite records for this token
    db.query(PendingInvite).filter(PendingInvite.invite_token == invite_token).delete()

    db.commit()
    db.refresh(member)
    return JoinResult(
        id=member.id,
        event_id=member.event_id,
        event_uuid=event.uuid,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
    )


@router.post("/pending-invite", status_code=status.HTTP_201_CREATED)
def register_pending_invite(
    invite_token: str,
    session_token: str,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Called by the frontend when a logged-out user clicks an invite link.
    Stores a pending invite so after login the user can be auto-added.
    No auth required — uses a frontend-generated session_token.
    """
    from app.db.models.pending_invite import PendingInvite

    event = db.query(Event).filter(
        Event.invite_token == invite_token,
        Event.invite_active == True,  # noqa: E712
    ).first()
    if not event:
        raise HTTPException(status_code=404, detail="Invalid or revoked invite link")

    # Upsert — if session_token already exists, ignore
    existing = db.query(PendingInvite).filter(PendingInvite.session_token == session_token).first()
    if existing:
        return {"status": "already_registered"}

    db.add(PendingInvite(
        event_id=event.id,
        invite_token=invite_token,
        session_token=session_token,
    ))
    db.commit()
    return {"status": "registered"}


# ── Members & roles ───────────────────────────────────────────────────────────

@router.get("/{event_uuid}/members", response_model=list[MemberOut])
def get_members(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = _get_event_by_uuid_or_404(event_uuid, db)
    _require_member(event.id, user_id, db)
    return db.query(EventMember).filter(EventMember.event_id == event.id).all()


@router.put("/{event_uuid}/members/{target_user_id}/role", response_model=MemberOut)
def update_member_role(
    event_uuid: str,
    target_user_id: str,
    body: MemberRoleUpdate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Only the original host can change roles."""
    event = _get_event_by_uuid_or_404(event_uuid, db)
    if event.host_id != user_id:
        raise HTTPException(status_code=403, detail="Only the original host can change roles")
    if body.role not in ("co_host", "attendee"):
        raise HTTPException(status_code=400, detail="Role must be co_host or attendee")

    target = _get_member(event.id, target_user_id, db)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.role == "host":
        raise HTTPException(status_code=400, detail="Cannot change the host's role")

    target.role = body.role
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{event_uuid}/members/{target_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    event_uuid: str,
    target_user_id: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """Host/co-host can remove members. Members can remove themselves."""
    event = _get_event_by_uuid_or_404(event_uuid, db)
    requester = _get_member(event.id, user_id, db)
    if not requester:
        raise HTTPException(status_code=403, detail="Not a member")

    is_self = user_id == target_user_id
    is_privileged = requester.role in ("host", "co_host")

    if not is_self and not is_privileged:
        raise HTTPException(status_code=403, detail="Cannot remove other members")

    target = _get_member(event.id, target_user_id, db)
    if not target:
        raise HTTPException(status_code=404, detail="Member not found")
    if target.role == "host":
        raise HTTPException(status_code=400, detail="Cannot remove the host")

    db.delete(target)
    db.commit()
