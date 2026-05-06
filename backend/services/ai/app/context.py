"""
Gathers all event context needed for the AI prompt:
  - Event details (from Postgres via SQLAlchemy)
  - Members + RSVPs
  - Polls + votes
  - Potluck items + claims
  - Tasks
  - Announcements
  - Recent chat messages (from DynamoDB)
"""
from __future__ import annotations

import json
import logging
from decimal import Decimal
from typing import Any

import boto3
from boto3.dynamodb.conditions import Key
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import DATABASE_URL, MESSAGES_TABLE, AWS_REGION

logger = logging.getLogger(__name__)

# ── DB engine (reused across warm Lambda invocations) ────────────────────────
_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=2, max_overflow=0)
    return _engine


# ── DynamoDB ─────────────────────────────────────────────────────────────────
_ddb = None
_msg_table = None


def _get_msg_table():
    global _ddb, _msg_table
    if _msg_table is None:
        _ddb = boto3.resource("dynamodb", region_name=AWS_REGION)
        _msg_table = _ddb.Table(MESSAGES_TABLE)
    return _msg_table


class _DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)


def _row(mapping) -> dict:
    """Convert a SQLAlchemy Row mapping to a plain dict, serialising datetimes."""
    out = {}
    for k, v in mapping.items():
        if hasattr(v, "isoformat"):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


# ── Public API ────────────────────────────────────────────────────────────────

def gather_event_context(event_uuid: str, chat_limit: int = 100) -> dict[str, Any]:
    """Return a dict with all event context. Raises ValueError if event not found."""
    engine = _get_engine()
    with Session(engine) as db:
        # Event
        event_row = db.execute(
            text("SELECT * FROM events WHERE uuid = :uuid"), {"uuid": event_uuid}
        ).mappings().first()
        if not event_row:
            raise ValueError(f"Event {event_uuid} not found")
        event = _row(event_row)
        event_id = event["id"]

        # Members
        members = [_row(r) for r in db.execute(
            text("SELECT user_id, role, display_name, joined_at FROM event_members WHERE event_id = :eid"),
            {"eid": event_id},
        ).mappings()]

        # RSVPs
        rsvps = [_row(r) for r in db.execute(
            text("SELECT user_id, status, guest_count FROM rsvps WHERE event_id = :eid"),
            {"eid": event_id},
        ).mappings()]

        # Polls + options + votes
        polls_raw = [_row(r) for r in db.execute(
            text("SELECT id, question, allow_multi_select, is_anonymous, is_closed, closes_at FROM polls WHERE event_id = :eid"),
            {"eid": event_id},
        ).mappings()]
        polls = []
        for p in polls_raw:
            options = [_row(r) for r in db.execute(
                text("SELECT id, text, display_order FROM poll_options WHERE poll_id = :pid ORDER BY display_order"),
                {"pid": p["id"]},
            ).mappings()]
            vote_counts = {r["option_id"]: r["cnt"] for r in db.execute(
                text("SELECT option_id, COUNT(*) as cnt FROM poll_votes WHERE poll_id = :pid GROUP BY option_id"),
                {"pid": p["id"]},
            ).mappings()}
            for opt in options:
                opt["vote_count"] = vote_counts.get(opt["id"], 0)
            polls.append({**p, "options": options})

        # Potluck
        potluck_raw = [_row(r) for r in db.execute(
            text("SELECT id, name, description, quantity_needed FROM potluck_items WHERE event_id = :eid"),
            {"eid": event_id},
        ).mappings()]
        potluck = []
        for item in potluck_raw:
            claims = [_row(r) for r in db.execute(
                text("SELECT user_id FROM potluck_claims WHERE item_id = :iid"),
                {"iid": item["id"]},
            ).mappings()]
            potluck.append({**item, "claims": [c["user_id"] for c in claims]})

        # Tasks
        tasks = [_row(r) for r in db.execute(
            text("SELECT title, description, assigned_to, due_date, is_completed FROM tasks WHERE event_id = :eid ORDER BY created_at"),
            {"eid": event_id},
        ).mappings()]

        # Announcements
        announcements = [_row(r) for r in db.execute(
            text("SELECT body, created_at FROM announcements WHERE event_id = :eid ORDER BY created_at DESC LIMIT 20"),
            {"eid": event_id},
        ).mappings()]

    # Chat history from DynamoDB
    # The chat service stores messages keyed by the event UUID (not the integer ID)
    chat_messages: list[dict] = []
    if MESSAGES_TABLE:
        try:
            resp = _get_msg_table().query(
                KeyConditionExpression=Key("event_id").eq(event_uuid),
                Limit=chat_limit,
                ScanIndexForward=False,  # newest first
            )
            raw = resp.get("Items", [])
            # Reverse so oldest-first for the prompt
            chat_messages = [
                {
                    "sender": item.get("sender_name", "Unknown"),
                    "message": item.get("content", ""),
                    "time": item.get("timestamp", ""),
                }
                for item in reversed(raw)
            ]
        except Exception as e:
            logger.warning("Could not fetch chat history: %s", e)

    # Build member display name lookup
    name_map = {m["user_id"]: (m["display_name"] or m["user_id"][:8]) for m in members}

    # Enrich RSVPs with display names
    for r in rsvps:
        r["name"] = name_map.get(r["user_id"], r["user_id"][:8])

    # Enrich tasks with display names
    for t in tasks:
        if t.get("assigned_to"):
            t["assigned_to_name"] = name_map.get(t["assigned_to"], t["assigned_to"][:8])

    return {
        "event": event,
        "members": members,
        "rsvps": rsvps,
        "polls": polls,
        "potluck": potluck,
        "tasks": tasks,
        "announcements": announcements,
        "chat_messages": chat_messages,
        "name_map": name_map,
    }


def build_system_prompt(ctx: dict[str, Any]) -> str:
    """Render the context dict into a system prompt string for Claude."""
    ev = ctx["event"]
    rsvps = ctx["rsvps"]
    going = [r for r in rsvps if r["status"] == "yes"]
    maybe = [r for r in rsvps if r["status"] == "maybe"]
    no = [r for r in rsvps if r["status"] == "no"]

    lines = [
        "You are a helpful AI assistant for the event planning app Cohosted.",
        "You have full context about the event below. Answer questions helpfully and concisely.",
        "If asked about specific guests, polls, tasks, or chat messages, use the data provided.",
        "Do not make up information not present in the context.",
        "",
        "## Event Details",
        f"Title: {ev['title']}",
        f"Description: {ev.get('description') or 'None'}",
        f"Location: {ev.get('location') or 'Not set'}",
        f"Start: {ev.get('start_dt') or 'TBD'}",
        f"End: {ev.get('end_dt') or 'TBD'}",
        f"Recurrence: {ev.get('recurrence_rule') or 'None'}",
        "",
        "## Attendance",
        f"Going ({len(going)}): {', '.join(r['name'] for r in going) or 'None'}",
        f"Maybe ({len(maybe)}): {', '.join(r['name'] for r in maybe) or 'None'}",
        f"Not going ({len(no)}): {', '.join(r['name'] for r in no) or 'None'}",
    ]

    if ctx["polls"]:
        lines += ["", "## Polls"]
        for p in ctx["polls"]:
            status = "Closed" if p["is_closed"] else "Open"
            lines.append(f"- \"{p['question']}\" [{status}]")
            for opt in p["options"]:
                lines.append(f"    • {opt['text']}: {opt['vote_count']} vote(s)")

    if ctx["potluck"]:
        lines += ["", "## Potluck"]
        for item in ctx["potluck"]:
            claimed = len(item["claims"])
            needed = item["quantity_needed"]
            claimers = ", ".join(ctx["name_map"].get(uid, uid[:8]) for uid in item["claims"]) or "nobody yet"
            lines.append(f"- {item['name']} ({claimed}/{needed} claimed by {claimers})")

    if ctx["tasks"]:
        lines += ["", "## Tasks"]
        for t in ctx["tasks"]:
            done = "✓" if t["is_completed"] else "○"
            assignee = t.get("assigned_to_name") or "Unassigned"
            due = f" (due {t['due_date']})" if t.get("due_date") else ""
            lines.append(f"- [{done}] {t['title']} — {assignee}{due}")

    if ctx["announcements"]:
        lines += ["", "## Recent Announcements"]
        for a in ctx["announcements"]:
            lines.append(f"- [{a['created_at']}] {a['body']}")

    if ctx["chat_messages"]:
        lines += ["", "## Recent Chat Messages (oldest to newest)"]
        for msg in ctx["chat_messages"]:
            lines.append(f"- {msg['sender']}: {msg['message']}")

    return "\n".join(lines)
