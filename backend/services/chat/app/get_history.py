"""
getHistory handler

Expected JSON body from the client:
{
  "action": "getHistory",
  "event_id": "42",
  "limit": 50,           // optional, default 50, max 100
  "last_key": "01ARZ..." // optional ULID — for pagination (exclusive start)
}

Returns messages in ascending time order (oldest first).
The client receives a WebSocket message back on their own connection:
{
  "type": "history",
  "messages": [...],
  "last_key": "01ARZ..." | null   // null means no more pages
}
"""

import json
import logging
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key
from app.config import MESSAGES_TABLE, WS_ENDPOINT


class DecimalEncoder(json.JSONEncoder):
    """Convert DynamoDB Decimal values to int or float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super().default(obj)

logger = logging.getLogger(__name__)

dynamodb = boto3.resource("dynamodb")
messages_table = dynamodb.Table(MESSAGES_TABLE)


def _get_apigw_client():
    return boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=f"https://{WS_ENDPOINT}",
    )


def handle(event: dict, context) -> dict:
    connection_id: str = event["requestContext"]["connectionId"]
    body = json.loads(event.get("body") or "{}")

    event_id: str = str(body.get("event_id", ""))
    limit: int = min(int(body.get("limit", 50)), 100)
    last_key: str | None = body.get("last_key")

    if not event_id:
        return {"statusCode": 400, "body": "Missing event_id"}

    query_kwargs = {
        "KeyConditionExpression": Key("event_id").eq(event_id),
        "Limit": limit,
        "ScanIndexForward": True,  # ascending (oldest → newest)
    }

    if last_key:
        query_kwargs["ExclusiveStartKey"] = {
            "event_id": event_id,
            "message_id": last_key,
        }

    response = messages_table.query(**query_kwargs)
    items = response.get("Items", [])

    # Determine pagination cursor for the next page
    next_last_key = None
    if "LastEvaluatedKey" in response:
        next_last_key = response["LastEvaluatedKey"]["message_id"]

    # Strip DynamoDB TTL field before sending to client
    messages = [
        {k: v for k, v in item.items() if k != "expires_at"}
        for item in items
    ]

    payload = json.dumps({
        "type": "history",
        "messages": messages,
        "last_key": next_last_key,
    }, cls=DecimalEncoder).encode("utf-8")

    apigw = _get_apigw_client()
    try:
        apigw.post_to_connection(ConnectionId=connection_id, Data=payload)
    except ClientError as e:
        logger.warning("Could not send history to %s: %s", connection_id, e)

    return {"statusCode": 200, "body": "History sent"}
