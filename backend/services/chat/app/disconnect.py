"""
$disconnect handler

API Gateway only provides connection_id on disconnect, not event_id.
We use the GSI on the connections table to look up the event_id first,
then delete the record.
"""

import boto3
from boto3.dynamodb.conditions import Key
from app.config import CONNECTIONS_TABLE

_dynamodb = None
_table = None


def _get_table():
    global _dynamodb, _table
    if _table is None:
        _dynamodb = boto3.resource("dynamodb")
        _table = _dynamodb.Table(CONNECTIONS_TABLE)
    return _table


def handle(event: dict, context) -> dict:
    connection_id: str = event["requestContext"]["connectionId"]

    response = _get_table().query(
        IndexName="connection_id-index",
        KeyConditionExpression=Key("connection_id").eq(connection_id),
    )

    items = response.get("Items", [])
    for item in items:
        _get_table().delete_item(
            Key={
                "event_id": item["event_id"],
                "connection_id": connection_id,
            }
        )

    return {"statusCode": 200, "body": "Disconnected"}
