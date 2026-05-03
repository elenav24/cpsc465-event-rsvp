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

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(CONNECTIONS_TABLE)

# Connections expire after 24 hours (handles ungraceful disconnects)
TTL_SECONDS = 60 * 60 * 24


def handle(event: dict, context) -> dict:
    connection_id: str = event["requestContext"]["connectionId"]
    query_params: dict = event.get("queryStringParameters") or {}
    event_id: str = query_params.get("event_id", "")

    if not event_id:
        # Reject the connection — clients must supply event_id
        return {"statusCode": 400, "body": "Missing event_id query parameter"}

    table.put_item(
        Item={
            "event_id": str(event_id),
            "connection_id": connection_id,
            "expires_at": int(time.time()) + TTL_SECONDS,
        }
    )

    return {"statusCode": 200, "body": "Connected"}
