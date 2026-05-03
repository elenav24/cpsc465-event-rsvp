"""
$connect handler

Query params expected on the WebSocket URL:
  ?event_id=<event_id>

Example connect URL:
  wss://abc123.execute-api.us-east-1.amazonaws.com/production?event_id=42
"""

import time
import boto3
from app.config import CONNECTIONS_TABLE

# Lazy-initialized so tests can patch before boto3 connects
_dynamodb = None
_table = None


def _get_table():
    global _dynamodb, _table
    if _table is None:
        _dynamodb = boto3.resource("dynamodb")
        _table = _dynamodb.Table(CONNECTIONS_TABLE)
    return _table


TTL_SECONDS = 60 * 60 * 24


def handle(event: dict, context) -> dict:
    connection_id: str = event["requestContext"]["connectionId"]
    query_params: dict = event.get("queryStringParameters") or {}
    event_id: str = query_params.get("event_id", "")

    if not event_id:
        return {"statusCode": 400, "body": "Missing event_id query parameter"}

    _get_table().put_item(
        Item={
            "event_id": str(event_id),
            "connection_id": connection_id,
            "expires_at": int(time.time()) + TTL_SECONDS,
        }
    )

    return {"statusCode": 200, "body": "Connected"}
