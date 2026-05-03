"""
Unit tests for chat Lambda handlers.
DynamoDB calls are mocked so no AWS credentials are needed.
"""
import json
from unittest.mock import MagicMock, patch


def _ws_event(route, connection_id="conn-123", body=None, query_params=None):
    return {
        "requestContext": {
            "routeKey": route,
            "connectionId": connection_id,
        },
        "queryStringParameters": query_params or {},
        "body": json.dumps(body) if body else None,
    }


# ── $connect ──────────────────────────────────────────────────────────────────

def test_connect_missing_event_id():
    from app.connect import handle
    event = _ws_event("$connect", query_params={})
    res = handle(event, None)
    assert res["statusCode"] == 400


def test_connect_success():
    from app.connect import handle
    mock_table = MagicMock()
    with patch("app.connect._get_table", return_value=mock_table):
        event = _ws_event("$connect", query_params={"event_id": "42"})
        res = handle(event, None)
        assert res["statusCode"] == 200
        mock_table.put_item.assert_called_once()


# ── $disconnect ───────────────────────────────────────────────────────────────

def test_disconnect_cleans_up():
    from app.disconnect import handle
    mock_table = MagicMock()
    mock_table.query.return_value = {
        "Items": [{"event_id": "42", "connection_id": "conn-123"}]
    }
    with patch("app.disconnect._get_table", return_value=mock_table):
        event = _ws_event("$disconnect")
        res = handle(event, None)
        assert res["statusCode"] == 200
        mock_table.delete_item.assert_called_once()


# ── sendMessage ───────────────────────────────────────────────────────────────

def test_send_message_missing_fields():
    from app.send_message import handle
    event = _ws_event("sendMessage", body={"action": "sendMessage"})
    res = handle(event, None)
    assert res["statusCode"] == 400


def test_send_message_success():
    from app.send_message import handle
    mock_messages = MagicMock()
    mock_connections = MagicMock()
    mock_connections.query.return_value = {
        "Items": [{"event_id": "1", "connection_id": "conn-abc"}]
    }
    mock_apigw = MagicMock()

    with patch("app.send_message._get_tables", return_value=(mock_messages, mock_connections)), \
         patch("app.send_message._get_apigw_client", return_value=mock_apigw):

        event = _ws_event("sendMessage", body={
            "action": "sendMessage",
            "event_id": "1",
            "sender_id": "user-sub",
            "sender_name": "Mark",
            "content": "Hello!",
        })
        res = handle(event, None)
        assert res["statusCode"] == 200
        mock_messages.put_item.assert_called_once()
        mock_apigw.post_to_connection.assert_called_once()
