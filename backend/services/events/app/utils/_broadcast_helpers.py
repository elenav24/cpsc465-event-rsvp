"""
Serialisation helpers for broadcasting domain objects as plain dicts.
Keeps the router files clean.
"""

from __future__ import annotations
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.db.models.poll import Poll
    from app.db.models.potluck import PotluckItem
    from app.db.models.task import Task
    from app.db.models.announcement import Announcement
    from app.db.models.event import Event
    from app.db.models.event_member import EventMember
    from app.db.models.rsvp import RSVP


def _dt(v):
    return v.isoformat() if v else None


def poll_dict(poll) -> dict:
    return {
        "id": poll.id,
        "event_id": poll.event_id,
        "created_by": poll.created_by,
        "question": poll.question,
        "allow_multi_select": poll.allow_multi_select,
        "is_anonymous": poll.is_anonymous,
        "is_closed": poll.is_closed,
        "closes_at": _dt(poll.closes_at),
        "created_at": _dt(poll.created_at),
        "options": [
            {
                "id": o.id,
                "text": o.text,
                "display_order": o.display_order,
                "vote_count": len(o.votes),
            }
            for o in poll.options
        ],
        "votes": [
            {"option_id": v.option_id, "voter_id": v.voter_id} for v in poll.votes
        ],
    }


def potluck_dict(item) -> dict:
    return {
        "id": item.id,
        "event_id": item.event_id,
        "created_by": item.created_by,
        "name": item.name,
        "description": item.description,
        "quantity_needed": item.quantity_needed,
        "claims_count": len(item.claims),
        "claims": [
            {
                "id": c.id,
                "item_id": c.item_id,
                "user_id": c.user_id,
                "claimed_at": _dt(c.claimed_at),
            }
            for c in item.claims
        ],
        "created_at": _dt(item.created_at),
    }


def task_dict(task) -> dict:
    return {
        "id": task.id,
        "event_id": task.event_id,
        "created_by": task.created_by,
        "title": task.title,
        "description": task.description,
        "assigned_to": task.assigned_to,
        "due_date": _dt(task.due_date) if task.due_date else None,
        "is_completed": task.is_completed,
        "created_at": _dt(task.created_at),
    }


def announcement_dict(ann) -> dict:
    return {
        "id": ann.id,
        "event_id": ann.event_id,
        "author_id": ann.author_id,
        "body": ann.body,
        "sms_sent": ann.sms_sent,
        "created_at": _dt(ann.created_at),
    }


def event_dict(event) -> dict:
    return {
        "id": event.id,
        "uuid": event.uuid,
        "title": event.title,
        "description": event.description,
        "location": event.location,
        "host_id": event.host_id,
        "flyer_url": event.flyer_url,
        "start_dt": _dt(event.start_dt),
        "end_dt": _dt(event.end_dt),
        "recurrence_rule": event.recurrence_rule,
        "recurrence_end_dt": _dt(event.recurrence_end_dt),
        "invite_token": event.invite_token,
        "invite_active": event.invite_active,
        "viewable_by_link": event.viewable_by_link,
        "created_at": _dt(event.created_at),
    }


def member_dict(member) -> dict:
    return {
        "id": member.id,
        "event_id": member.event_id,
        "user_id": member.user_id,
        "role": member.role,
        "display_name": member.display_name,
        "joined_at": _dt(member.joined_at),
    }
