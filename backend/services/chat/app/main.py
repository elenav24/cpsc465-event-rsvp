"""
Chat Lambda — handles all WebSocket routes for event group chats.

Route selection expression: $request.body.action

Routes:
  $connect      — client connects, registers connection_id + event_id in DynamoDB
  $disconnect   — client disconnects, removes connection record
  sendMessage   — saves message to DynamoDB, fans out to all connections for the event
  getHistory    — returns paginated message history for an event
"""

import json
import time
import logging
from app import connect, disconnect, send_message, get_history

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ROUTE_HANDLERS = {
    "$connect": connect.handle,
    "$disconnect": disconnect.handle,
    "sendMessage": send_message.handle,
    "getHistory": get_history.handle,
}


def _response(status_code: int, body: dict | str = "") -> dict:
    return {
        "statusCode": status_code,
        "body": json.dumps(body) if isinstance(body, dict) else body,
    }


def handler(event: dict, context) -> dict:
    route = event.get("requestContext", {}).get("routeKey", "")
    connection_id = event.get("requestContext", {}).get("connectionId", "")

    logger.info("route=%s connection_id=%s", route, connection_id)

    route_handler = ROUTE_HANDLERS.get(route)
    if not route_handler:
        return _response(400, {"error": f"Unknown route: {route}"})

    try:
        return route_handler(event, context)
    except Exception as exc:
        logger.exception("Unhandled error on route %s: %s", route, exc)
        return _response(500, {"error": "Internal server error"})
