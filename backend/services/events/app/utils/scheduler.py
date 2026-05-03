"""
EventBridge Scheduler utility — creates one-time schedules for SMS reminders.

Each reminder preference gets its own EventBridge Scheduler rule that fires
once at (event.start_dt - offset_minutes). The target is the notifications
Lambda which sends the SMS.

Rule naming: cohosted-reminder-{event_id}-{user_id_hash}-{offset_minutes}
"""
import hashlib
import logging
import json
from datetime import datetime, timezone, timedelta
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from app.core.config import AWS_REGION

logger = logging.getLogger(__name__)

_scheduler = None


def _get_scheduler():
    global _scheduler
    if _scheduler is None:
        _scheduler = boto3.client("scheduler", region_name=AWS_REGION)
    return _scheduler

# ARN of the notifications Lambda — set as env var
import os
NOTIFICATIONS_LAMBDA_ARN = os.getenv("NOTIFICATIONS_LAMBDA_ARN", "")
SCHEDULER_ROLE_ARN = os.getenv("SCHEDULER_ROLE_ARN", "")


def _rule_name(event_id: int, user_id: str, offset_minutes: int) -> str:
    uid_hash = hashlib.md5(user_id.encode()).hexdigest()[:8]
    return f"cohosted-reminder-{event_id}-{uid_hash}-{offset_minutes}"


def create_reminder_schedule(
    event_id: int,
    user_id: str,
    phone_number: str,
    event_title: str,
    event_start: datetime,
    offset_minutes: int,
) -> Optional[str]:
    """
    Creates an EventBridge Scheduler one-time schedule.
    Returns the rule name on success, None on failure.
    """
    if not NOTIFICATIONS_LAMBDA_ARN or not SCHEDULER_ROLE_ARN:
        logger.warning("NOTIFICATIONS_LAMBDA_ARN or SCHEDULER_ROLE_ARN not set — skipping scheduler")
        return None

    fire_at = event_start - timedelta(minutes=offset_minutes)
    if fire_at <= datetime.now(timezone.utc):
        logger.info("Reminder fire time is in the past — skipping")
        return None

    rule_name = _rule_name(event_id, user_id, offset_minutes)
    schedule_expression = fire_at.strftime("at(%Y-%m-%dT%H:%M:%S)")

    hours = offset_minutes // 60
    label = f"{hours} hour{'s' if hours != 1 else ''}" if hours < 24 else f"{offset_minutes // 1440} day{'s' if offset_minutes // 1440 != 1 else ''}"
    message = f"Reminder: '{event_title}' starts in {label}!"

    payload = {
        "event_id": event_id,
        "user_id": user_id,
        "phone_number": phone_number,
        "message": message,
    }

    try:
        _get_scheduler().create_schedule(
            Name=rule_name,
            ScheduleExpression=schedule_expression,
            ScheduleExpressionTimezone="UTC",
            FlexibleTimeWindow={"Mode": "OFF"},
            Target={
                "Arn": NOTIFICATIONS_LAMBDA_ARN,
                "RoleArn": SCHEDULER_ROLE_ARN,
                "Input": json.dumps(payload),
            },
            ActionAfterCompletion="DELETE",  # auto-cleanup after firing
        )
        return rule_name
    except ClientError as e:
        logger.warning("Failed to create schedule %s: %s", rule_name, e)
        return None


def delete_reminder_schedule(rule_name: str) -> None:
    """Deletes an EventBridge Scheduler schedule by name."""
    try:
        _get_scheduler().delete_schedule(Name=rule_name)
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            logger.warning("Failed to delete schedule %s: %s", rule_name, e)
