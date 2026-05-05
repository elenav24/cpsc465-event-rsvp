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


def _send_email(to_email: str, subject: str, body: str, event_title: str = "", author_name: str = "") -> bool:
    """Send an email via SES. Returns True on success, False on failure."""
    html_body = _build_html_email(body, event_title, author_name)
    try:
        _get_ses().send_email(
            Source=FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Text": {"Data": body, "Charset": "UTF-8"},
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                },
            },
        )
        return True
    except ClientError as e:
        logger.warning("Failed to send email to %s: %s", to_email, e)
        return False


def _build_html_email(body: str, event_title: str = "", author_name: str = "") -> str:
    """Build a styled HTML email for announcements with sender quote."""
    import html
    escaped_body = html.escape(body).replace("\n", "<br>")
    escaped_title = html.escape(event_title) if event_title else ""
    escaped_author = html.escape(author_name) if author_name else ""

    # Generate initials for avatar
    initials = "".join(w[0] for w in author_name.split()[:2]).upper() if author_name else "?"

    author_section = ""
    if escaped_author:
        author_section = f"""
          <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr>
              <td style="vertical-align:middle;padding-right:12px;">
                <div style="width:40px;height:40px;border-radius:50%;background:#c8567e;color:#fff;font-size:16px;font-weight:600;line-height:40px;text-align:center;">{initials}</div>
              </td>
              <td style="vertical-align:middle;">
                <span style="font-size:15px;font-weight:600;color:#1a1a1a;">{escaped_author}</span>
                <br><span style="font-size:12px;color:#888;">posted an announcement</span>
              </td>
            </tr>
          </table>"""

    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#c8567e,#e88da5);padding:24px 32px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">cohosted</h1>
          <p style="margin:6px 0 0 0;font-size:14px;color:rgba(255,255,255,0.85);">{escaped_title}</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px;">
          {author_section}
          <div style="background:#faf7f5;border-left:3px solid #c8567e;padding:16px 20px;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:16px;line-height:1.6;color:#333333;">{escaped_body}</p>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;border-top:1px solid #f0e8e3;">
          <p style="margin:0;font-size:12px;color:#999;">You're receiving this because you're a member of this event on <a href="https://cohosted.cloud" style="color:#c8567e;text-decoration:none;">cohosted.cloud</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


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
        # Get event title for the email header
        event_row = conn.execute(
            text("SELECT title FROM events WHERE id = :eid"),
            {"eid": event_id},
        ).fetchone()
        event_title = event_row[0] if event_row else ""

        # Get sender info
        author_id = payload.get("author_id", "")
        author_name = ""
        author_picture = ""
        if author_id:
            author_row = conn.execute(
                text("SELECT display_name, email FROM users WHERE cognito_sub = :sub"),
                {"sub": author_id},
            ).fetchone()
            if author_row:
                author_name = author_row[0] or author_row[1] or "Someone"

        rows = conn.execute(
            text(
                "SELECT u.email FROM event_members em "
                "JOIN users u ON u.cognito_sub = em.user_id "
                "WHERE em.event_id = :eid AND u.email IS NOT NULL"
            ),
            {"eid": event_id},
        ).fetchall()

    subject = f"{event_title}: {message.split(chr(10))[0][:40]}"
    for row in rows:
        email = row[0]
        try:
            if _send_email(email, subject, message, event_title, author_name):
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
