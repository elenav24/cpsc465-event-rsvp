import logging
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.deps.db import get_db
from app.deps.auth import get_current_user_sub
from app.db.models.event import Event
from app.db.models.event_member import EventMember
from app.db.models.announcement import Announcement
from app.db.models.rsvp import RSVP
from app.schemas.announcement import AnnouncementCreate, AnnouncementOut
from app.utils.sms import send_sms
from app.routers._resolve import resolve_event

logger = logging.getLogger(__name__)
router = APIRouter()


def _require_member(event_id: int, user_id: str, db: Session) -> EventMember:
    member = (
        db.query(EventMember)
        .filter(
            EventMember.event_id == event_id,
            EventMember.user_id == user_id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this event")
    return member


def _require_host_or_cohost(event_id: int, user_id: str, db: Session) -> EventMember:
    member = _require_member(event_id, user_id, db)
    if member.role not in ("host", "co_host"):
        raise HTTPException(status_code=403, detail="Host or co-host access required")
    return member


@router.get("/{event_uuid}/announcements", response_model=list[AnnouncementOut])
def get_announcements(
    event_uuid: str,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_member(event.id, user_id, db)
    return (
        db.query(Announcement)
        .filter(Announcement.event_id == event.id)
        .order_by(Announcement.created_at.desc())
        .all()
    )


@router.post(
    "/{event_uuid}/announcements",
    response_model=AnnouncementOut,
    status_code=status.HTTP_201_CREATED,
)
def create_announcement(
    event_uuid: str,
    body: AnnouncementCreate,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    Creates an announcement and sends SMS to all opted-in members.
    SMS is best-effort — failures are logged but don't fail the request.
    """
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)

    announcement = Announcement(
        event_id=event.id,
        author_id=user_id,
        body=body.body,
    )
    db.add(announcement)
    db.flush()

    _send_announcement_sms(event, announcement, db)

    announcement.sms_sent = True
    db.commit()
    db.refresh(announcement)
    try:
        from app.utils.broadcast import broadcast_event_update
        from app.utils._broadcast_helpers import announcement_dict

        broadcast_event_update(
            event.id, "announcement", "create", announcement_dict(announcement)
        )
    except Exception:
        pass
    return announcement


def _send_announcement_sms(event, announcement: Announcement, db: Session):
    """
    Publishes announcement SMS to all opted-in members.
    Phone numbers are stored on EventMember (denormalized from users service
    at join time). See EventMember.phone_number.
    """
    import boto3
    import json
    import os

    # Use SNS topic for fan-out — the notifications Lambda subscribes to it
    topic_arn = os.getenv("ANNOUNCEMENTS_SNS_TOPIC_ARN", "")
    if not topic_arn:
        logger.warning("ANNOUNCEMENTS_SNS_TOPIC_ARN not set — skipping SMS")
        return

    sns = boto3.client("sns")
    try:
        sns.publish(
            TopicArn=topic_arn,
            Message=json.dumps(
                {
                    "event_id": event.id,
                    "announcement_id": announcement.id,
                    "message": announcement.body,
                    "author_id": announcement.author_id,
                }
            ),
            Subject="cohosted announcement",
        )
    except Exception as e:
        logger.warning("Failed to publish announcement to SNS: %s", e)


@router.delete(
    "/{event_uuid}/announcements/{announcement_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_announcement(
    event_uuid: str,
    announcement_id: int,
    user_id: Annotated[str, Depends(get_current_user_sub)],
    db: Annotated[Session, Depends(get_db)],
):
    event = resolve_event(event_uuid, db)
    _require_host_or_cohost(event.id, user_id, db)
    ann = (
        db.query(Announcement)
        .filter(
            Announcement.id == announcement_id,
            Announcement.event_id == event.id,
        )
        .first()
    )
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    try:
        from app.utils.broadcast import broadcast_event_update

        broadcast_event_update(
            event.id, "announcement", "delete", {"id": announcement_id}
        )
    except Exception:
        pass
