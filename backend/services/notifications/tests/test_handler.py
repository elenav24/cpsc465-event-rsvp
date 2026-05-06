"""Unit tests for the notifications Lambda handler."""

import json
from unittest.mock import MagicMock, patch


def test_reminder_invocation():
    """EventBridge Scheduler sends a direct payload with email."""
    from app.main import handler

    mock_ses = MagicMock()
    mock_ses.send_email.return_value = {"MessageId": "test-123"}
    with patch("app.main._get_ses", return_value=mock_ses):
        event = {
            "email": "user@example.com",
            "message": "Reminder: your event starts in 1 hour!",
        }
        res = handler(event, None)
        assert res["statusCode"] == 200
        mock_ses.send_email.assert_called_once()
        call_kwargs = mock_ses.send_email.call_args[1]
        assert call_kwargs["Destination"]["ToAddresses"] == ["user@example.com"]


def test_reminder_missing_email_is_noop():
    """Malformed reminder payload should not crash."""
    from app.main import handler

    mock_ses = MagicMock()
    with patch("app.main._get_ses", return_value=mock_ses):
        res = handler({"message": "no email"}, None)
        assert res["statusCode"] == 200
        mock_ses.send_email.assert_not_called()


def test_sns_announcement_record():
    """SNS-triggered invocation routes to announcement handler."""
    from app.main import handler

    with patch("app.main._handle_announcement") as mock_ann:
        event = {
            "Records": [
                {
                    "EventSource": "aws:sns",
                    "Sns": {
                        "Message": json.dumps(
                            {
                                "event_id": 1,
                                "announcement_id": 1,
                                "message": "Venue changed!",
                            }
                        )
                    },
                }
            ]
        }
        handler(event, None)
        mock_ann.assert_called_once()
