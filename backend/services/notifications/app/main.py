"""
Notifications Lambda — handles two event sources:

1. SNS (announcement fan-out):
   Triggered when the events service publishes to the announcements SNS topic.
   Payload (SNS Message field, JSON):
     { "event_id": int, "announcement_id": int, "message": str }
   Action: query opted-in members from the events DB and send SMS to each.

2. EventBridge Scheduler (reminder):
   Triggered by a one-time schedule created by the events service.
   Payload (direct Lambda invocation):
     { "event_id": int, "user_id": str, "phone_number": str, "message": str }
   Action: send a single SMS to the user.
"""

import json
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

_sns = boto3.client("sns")


def _send_sms(phone_number: str, message: str) -> None:
    _sns.publish(
        PhoneNumber=phone_number,
        Message=message,
        MessageAttributes={
            "AWS.SNS.SMS.SMSType": {
                "DataType": "String",
                "StringValue": "Transactional",
            }
        },
    )


def _handle_reminder(payload: dict) -> None:
    """Direct invocation from EventBridge Scheduler — single SMS."""
    phone = payload.get("phone_number")
    message = payload.get("message")
    if not phone or not message:
        logger.warning("Reminder payload missing phone_number or message: %s", payload)
        return
    logger.info("Sending reminder SMS to %s", phone)
    _send_sms(phone, message)


def _handle_announcement(sns_message: str) -> None:
    """
    SNS fan-out — the message contains event_id and the text to send.
    We send to all opted-in members. Phone numbers are stored on event_members
    (denormalized). We query the RDS events DB directly.
    """
    import os
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
                "SELECT phone_number FROM event_members "
                "WHERE event_id = :eid AND sms_opted_in = true AND phone_number IS NOT NULL"
            ),
            {"eid": event_id},
        ).fetchall()

    for row in rows:
        phone = row[0]
        try:
            _send_sms(phone, message)
            logger.info("Sent announcement SMS to %s", phone)
        except Exception as e:
            logger.warning("Failed to send SMS to %s: %s", phone, e)


def handler(event: dict, context) -> dict:
    # EventBridge Scheduler invokes with a plain dict (reminder payload)
    if "phone_number" in event:
        _handle_reminder(event)
        return {"statusCode": 200}

    # SNS invocation wraps records in event["Records"]
    records = event.get("Records", [])
    for record in records:
        if record.get("EventSource") == "aws:sns":
            _handle_announcement(record["Sns"]["Message"])

    return {"statusCode": 200}
