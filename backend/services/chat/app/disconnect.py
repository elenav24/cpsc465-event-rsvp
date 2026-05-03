"""
$disconnect handler

API Gateway only provides connection_id on disconnect, not event_id.
We use the GSI on the connections table to look up the event_id first,
then delete the record.
"""

import boto3
from boto3.dynamodb.conditions import Key
from app.config import CONNECTIONS_TABLE

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(CONNECTIONS_TABLE)


def handle(event: dict, context) -> dict:
    connection_id: str = event["requestContext"]["connectionId"]

    # Query the GSI to find which event this connection belongs to
    response = table.query(
        IndexName="connection_id-index",
        KeyConditionExpression=Key("connection_id").eq(connection_id),
    )

    items = response.get("Items", [])
    for item in items:
        table.delete_item(
            Key={
                "event_id": item["event_id"],
                "connection_id": connection_id,
            }
        )

    return {"statusCode": 200, "body": "Disconnected"}
