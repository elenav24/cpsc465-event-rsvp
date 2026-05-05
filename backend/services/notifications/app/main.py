"""
Notifications Lambda — handles two event sources:

1. SNS (announcement fan-out):
   Triggered when the events service publishes to the announcements SNS topic.
   Payload (SNS Message field, JSON):
     { "event_id": int, "announcement_id": int, "message": str }
   Action: query event members from the DB and send email to each.

2. EventBridge Scheduler (reminder):
   Triggered by a one-time schedule created by the events service.
   Payload (direct Lambda invocation):
     { "event_id": int, "user_id": str, "email": str, "message": str }
   Action: send a single reminder email to the user.
"""

import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

FROM_EMAIL = os.environ.get("FROM_EMAIL", "no-reply@cohosted.cloud")

_ses = None


def _get_ses():
    global _ses
    if _ses is None:
        _ses = boto3.client("ses")
    return _ses


def _send_email(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SES. Returns True on success, False on failure."""
    try:
        _get_ses().send_email(
            Source=FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": body, "Charset": "UTF-8"},
                },
            },
        )
        return True
    except ClientError as e:
        logger.warning("Failed to send email to %s: %s", to_email, e)
        return False


def _handle_reminder(payload: dict) -> None:
    """Direct invocation from EventBridge Scheduler — single reminder email."""
    email = payload.get("email")
    message = payload.get("message")
    if not email or not message:
        logger.warning("Reminder payload missing email or message: %s", payload)
        return
    logger.info("Sending reminder email to %s", email)
    _send_email(email, "Reminder from Cohosted", message)


def _handle_announcement(sns_message: str) -> None:
    """
    SNS fan-out — the message contains event_id and the text to send.
    We email all members of the event by joining event_members with users.
    """
    from sqlalchemy import create_engine, text

    payload = json.loads(sns_message)
    message = payload.get("message", "")
    event_id = payload.get("event_id")

    if not message or not event_id:
        logger.warning("Announcement payload incomplete: %s", payload)
        return

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        logger.error("DATABASE_URL not set")
        return

    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT u.email FROM event_members em "
                "JOIN users u ON u.cognito_sub = em.user_id "
                "WHERE em.event_id = :eid AND u.email IS NOT NULL"
            ),
            {"eid": event_id},
        ).fetchall()

    subject = f"Cohosted: {message[:50]}"
    for row in rows:
        email = row[0]
        try:
            _send_email(email, subject, message)
            logger.info("Sent announcement email to %s", email)
        except Exception as e:
            logger.warning("Failed to send email to %s: %s", email, e)


def handler(event: dict, context) -> dict:
    # EventBridge Scheduler invokes with a plain dict (reminder payload)
    if "email" in event:
        _handle_reminder(event)
        return {"statusCode": 200}

    # Legacy: support old reminder format with phone_number (send email instead)
    if "phone_number" in event and "user_id" in event:
        # Look up email from DB for this user
        _handle_legacy_reminder(event)
        return {"statusCode": 200}

    # SNS invocation wraps records in event["Records"]
    records = event.get("Records", [])
    for record in records:
        if record.get("EventSource") == "aws:sns":
            _handle_announcement(record["Sns"]["Message"])

    return {"statusCode": 200}


def _handle_legacy_reminder(payload: dict) -> None:
    """Handle old-format reminder payloads that have phone_number instead of email."""
    from sqlalchemy import create_engine, text

    user_id = payload.get("user_id")
    message = payload.get("message", "")
    if not user_id or not message:
        return

    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        return

    engine = create_engine(db_url, pool_pre_ping=True)
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT email FROM users WHERE cognito_sub = :sub"),
            {"sub": user_id},
        ).fetchone()

    if row and row[0]:
        _send_email(row[0], "Reminder from Cohosted", message)
        logger.info("Sent legacy reminder email to %s", row[0])
