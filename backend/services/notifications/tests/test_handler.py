"""Unit tests for the notifications Lambda handler."""
import json
from unittest.mock import MagicMock, patch


def test_reminder_invocation():
    """EventBridge Scheduler sends a direct payload with phone_number."""
    from app.main import handler
    mock_sns = MagicMock()
    with patch("app.main._get_sns", return_value=mock_sns):
        event = {
            "phone_number": "+15551234567",
            "message": "Reminder: your event starts in 1 hour!",
        }
        res = handler(event, None)
        assert res["statusCode"] == 200
        mock_sns.publish.assert_called_once()
        call_kwargs = mock_sns.publish.call_args[1]
        assert call_kwargs["PhoneNumber"] == "+15551234567"


def test_reminder_missing_phone_is_noop():
    """Malformed reminder payload should not crash."""
    from app.main import handler
    mock_sns = MagicMock()
    with patch("app.main._get_sns", return_value=mock_sns):
        res = handler({"message": "no phone"}, None)
        assert res["statusCode"] == 200
        mock_sns.publish.assert_not_called()


def test_sns_announcement_record():
    """SNS-triggered invocation routes to announcement handler."""
    from app.main import handler
    with patch("app.main._handle_announcement") as mock_ann:
        event = {
            "Records": [{
                "EventSource": "aws:sns",
                "Sns": {
                    "Message": json.dumps({
                        "event_id": 1,
                        "announcement_id": 1,
                        "message": "Venue changed!",
                    })
                }
            }]
        }
        handler(event, None)
        mock_ann.assert_called_once()
