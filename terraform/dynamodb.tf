# ── Chat Messages ─────────────────────────────────────────────────────────────
# Partition key: event_id  |  Sort key: message_id (ULID — time-sortable)
resource "aws_dynamodb_table" "chat_messages" {
  name         = "${var.app_name}-chat-messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "message_id"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "message_id"
    type = "S"
  }

  # Retain messages for 90 days via TTL
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = {
    Name = "${var.app_name}-chat-messages"
  }
}

# ── WebSocket Connections ─────────────────────────────────────────────────────
# Tracks which connection IDs are subscribed to which event chat room.
# Partition key: event_id  |  Sort key: connection_id
resource "aws_dynamodb_table" "chat_connections" {
  name         = "${var.app_name}-chat-connections"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "event_id"
  range_key    = "connection_id"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "connection_id"
    type = "S"
  }

  # GSI so we can look up which event a connection belongs to on disconnect
  # (disconnect only gives us connection_id, not event_id)
  global_secondary_index {
    name            = "connection_id-index"
    hash_key        = "connection_id"
    projection_type = "ALL"
  }

  # Auto-expire stale connections after 24 h
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = {
    Name = "${var.app_name}-chat-connections"
  }
}
