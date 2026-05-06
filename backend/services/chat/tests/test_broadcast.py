"""
Unit tests for the broadcast_event_update utility.
DynamoDB and API Gateway calls are mocked.
"""

import json
from unittest.mock import MagicMock, patch, call
from botocore.exceptions import ClientError


def _make_client_error(code: str):
    return ClientError({"Error": {"Code": code, "Message": ""}}, "post_to_connection")


def test_broadcast_sends_to_all_connections():
    from app.broadcast import broadcast_event_update

    mock_table = MagicMock()
    mock_table.query.return_value = {
        "Items": [
            {"event_id": "1", "connection_id": "conn-a"},
            {"event_id": "1", "connection_id": "conn-b"},
        ]
    }
    mock_apigw = MagicMock()

    with patch("app.broadcast._get_connections_table", return_value=mock_table), patch(
        "app.broadcast._get_apigw_client", return_value=mock_apigw
    ), patch("app.broadcast.CONNECTIONS_TABLE", "test-table"), patch(
        "app.broadcast.WS_ENDPOINT",
        "abc.execute-api.us-east-1.amazonaws.com/production",
    ):

        broadcast_event_update(1, "rsvp", "upsert", {"user_id": "u1", "status": "yes"})

        assert mock_apigw.post_to_connection.call_count == 2
        # Verify payload shape
        payload = json.loads(mock_apigw.post_to_connection.call_args_list[0][1]["Data"])
        assert payload["type"] == "event_update"
        assert payload["kind"] == "rsvp"
        assert payload["action"] == "upsert"
        assert payload["data"]["status"] == "yes"


def test_broadcast_cleans_up_stale_connections():
    from app.broadcast import broadcast_event_update

    mock_table = MagicMock()
    mock_table.query.return_value = {
        "Items": [
            {"event_id": "1", "connection_id": "conn-gone"},
            {"event_id": "1", "connection_id": "conn-ok"},
        ]
    }
    mock_apigw = MagicMock()
    # First connection is stale (GoneException), second is fine
    mock_apigw.post_to_connection.side_effect = [
        _make_client_error("GoneException"),
        None,
    ]

    with patch("app.broadcast._get_connections_table", return_value=mock_table), patch(
        "app.broadcast._get_apigw_client", return_value=mock_apigw
    ), patch("app.broadcast.CONNECTIONS_TABLE", "test-table"), patch(
        "app.broadcast.WS_ENDPOINT",
        "abc.execute-api.us-east-1.amazonaws.com/production",
    ):

        broadcast_event_update(1, "task", "delete", {"id": 5})

        # Stale connection should be deleted from the table
        mock_table.delete_item.assert_called_once_with(
            Key={"event_id": "1", "connection_id": "conn-gone"}
        )


def test_broadcast_skips_when_env_not_configured():
    """If CONNECTIONS_TABLE or WS_ENDPOINT are empty, broadcast is a no-op."""
    from app.broadcast import broadcast_event_update

    with patch("app.broadcast.CONNECTIONS_TABLE", ""), patch(
        "app.broadcast.WS_ENDPOINT", ""
    ):

        # Should not raise and should not try to connect to anything
        broadcast_event_update(1, "event", "upsert", {"title": "Test"})


def test_broadcast_survives_unexpected_errors():
    """Errors inside broadcast must never propagate to the caller."""
    from app.broadcast import broadcast_event_update

    with patch(
        "app.broadcast._get_connections_table", side_effect=RuntimeError("boom")
    ), patch("app.broadcast.CONNECTIONS_TABLE", "test-table"), patch(
        "app.broadcast.WS_ENDPOINT",
        "abc.execute-api.us-east-1.amazonaws.com/production",
    ):

        # Should not raise
        broadcast_event_update(1, "poll", "create", {"question": "Q?"})
