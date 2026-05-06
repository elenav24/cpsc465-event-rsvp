"""
broadcast_event_update — sends a typed event_update frame to all WebSocket
connections currently open for a given event_id.

Used by the events service to push real-time state changes to every client
that has the event page open.

Payload shape sent to clients:
{
  "type": "event_update",
  "kind": "<resource>",   # "rsvp" | "poll" | "potluck" | "task" | "announcement" | "event" | "member"
  "action": "<verb>",     # "upsert" | "delete" | "create"
  "data": { ... }         # the serialised resource, or {"id": n} for deletes
}
"""

import json
import logging
import os
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

logger = logging.getLogger(__name__)

CONNECTIONS_TABLE = os.environ.get("CONNECTIONS_TABLE", "")
WS_ENDPOINT = os.environ.get("WS_ENDPOINT", "")

_dynamodb = None
_connections_table = None


def _get_connections_table():
    global _dynamodb, _connections_table
    if _connections_table is None:
        _dynamodb = boto3.resource("dynamodb")
        _connections_table = _dynamodb.Table(CONNECTIONS_TABLE)
    return _connections_table


def _get_apigw_client():
    return boto3.client(
        "apigatewaymanagementapi",
        endpoint_url=f"https://{WS_ENDPOINT}",
    )


def broadcast_event_update(
    event_id: int | str, kind: str, action: str, data: dict
) -> None:
    """
    Fan-out an event_update frame to all WebSocket connections for event_id.
    Silently skips if env vars are not configured (local dev).
    """
    if not CONNECTIONS_TABLE or not WS_ENDPOINT:
        return

    payload = json.dumps(
        {
            "type": "event_update",
            "kind": kind,
            "action": action,
            "data": data,
        }
    ).encode("utf-8")

    try:
        table = _get_connections_table()
        apigw = _get_apigw_client()

        response = table.query(KeyConditionExpression=Key("event_id").eq(str(event_id)))

        stale = []
        for conn in response.get("Items", []):
            cid = conn["connection_id"]
            try:
                apigw.post_to_connection(ConnectionId=cid, Data=payload)
            except ClientError as e:
                code = e.response["Error"]["Code"]
                if code in ("GoneException", "410"):
                    stale.append(conn)
                else:
                    logger.warning("broadcast failed for %s: %s", cid, e)

        for conn in stale:
            table.delete_item(
                Key={
                    "event_id": conn["event_id"],
                    "connection_id": conn["connection_id"],
                }
            )

    except Exception as e:
        # Never let broadcast errors break the primary request
        logger.warning("broadcast_event_update error: %s", e)
