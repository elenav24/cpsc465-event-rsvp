"""
sendMessage handler

Expected JSON body from the client:
{
  "action": "sendMessage",
  "event_id": "42",
  "sender_id": "cognito-sub-uuid",
  "sender_name": "Elena Marquez",
  "content": "Hey, should we book the venue for Saturday?"
}

Flow:
  1. Persist message to DynamoDB messages table
  2. Query all active connections for the event
  3. Fan out the message to every connected client via API GW Management API
     (stale/closed connections are silently cleaned up)
"""

import json
import time
import logging
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from ulid import ULID
from app.config import MESSAGES_TABLE, CONNECTIONS_TABLE, WS_ENDPOINT

logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")
messages_table = dynamodb.Table(MESSAGES_TABLE)
connections_table = dynamodb.Table(CONNECTIONS_TABLE)

# Messages expire after 90 days
MSG_TTL_SECONDS = 60 * 60 * 24 * 90


def _get_apigw_client():
    """Build the API Gateway Management API client pointing at our WS stage."""
    return boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=f"https://{WS_ENDPOINT}",
    )


def handle(event: dict, context) -> dict:
    body = json.loads(event.get("body") or "{}")

    event_id: str = str(body.get("event_id", ""))
    sender_id: str = body.get("sender_id", "")
    sender_name: str = body.get("sender_name", "")
    content: str = body.get("content", "").strip()

    if not event_id or not sender_id or not content:
        return {"statusCode": 400, "body": "Missing event_id, sender_id, or content"}

    # Generate a time-sortable unique ID for the message
    message_id = str(ULID())
    timestamp = int(time.time() * 1000)  # ms epoch

    message_item = {
        "event_id": event_id,
        "message_id": message_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "content": content,
        "timestamp": timestamp,
        "expires_at": int(time.time()) + MSG_TTL_SECONDS,
    }

    messages_table.put_item(Item=message_item)

    # Build the payload to broadcast (exclude TTL field)
    broadcast_payload = json.dumps({
        "type": "message",
        "message_id": message_id,
        "event_id": event_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "content": content,
        "timestamp": timestamp,
    }).encode("utf-8")

    # Fan out to all connections for this event
    apigw = _get_apigw_client()
    connections_response = connections_table.query(
        KeyConditionExpression=Key("event_id").eq(event_id)
    )

    stale_connections = []
    for conn in connections_response.get("Items", []):
        cid = conn["connection_id"]
        try:
            apigw.post_to_connection(ConnectionId=cid, Data=broadcast_payload)
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code in ("GoneException", "410"):
                # Connection is no longer active — clean it up
                stale_connections.append(conn)
            else:
                logger.warning("Failed to send to %s: %s", cid, e)

    # Clean up stale connections
    for conn in stale_connections:
        connections_table.delete_item(
            Key={"event_id": conn["event_id"], "connection_id": conn["connection_id"]}
        )

    return {"statusCode": 200, "body": "Message sent"}
