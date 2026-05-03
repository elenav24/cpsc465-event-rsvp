# ── WebSocket API (Chat) ──────────────────────────────────────────────────────

resource "aws_apigatewayv2_api" "chat_ws" {
  name                       = "${var.app_name}-chat-ws"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
}

# ── Integration (single Lambda handles all routes) ────────────────────────────

resource "aws_apigatewayv2_integration" "chat_ws" {
  api_id                    = aws_apigatewayv2_api.chat_ws.id
  integration_type          = "AWS_PROXY"
  integration_uri           = aws_lambda_function.chat.invoke_arn
  content_handling_strategy = "CONVERT_TO_TEXT"
}

# ── Routes ────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_route" "chat_connect" {
  api_id    = aws_apigatewayv2_api.chat_ws.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.chat_ws.id}"
}

resource "aws_apigatewayv2_route" "chat_disconnect" {
  api_id    = aws_apigatewayv2_api.chat_ws.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.chat_ws.id}"
}

resource "aws_apigatewayv2_route" "chat_send_message" {
  api_id    = aws_apigatewayv2_api.chat_ws.id
  route_key = "sendMessage"
  target    = "integrations/${aws_apigatewayv2_integration.chat_ws.id}"
}

resource "aws_apigatewayv2_route" "chat_get_history" {
  api_id    = aws_apigatewayv2_api.chat_ws.id
  route_key = "getHistory"
  target    = "integrations/${aws_apigatewayv2_integration.chat_ws.id}"
}

# ── Stage ─────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "chat_ws" {
  api_id      = aws_apigatewayv2_api.chat_ws.id
  name        = "production"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit   = 100
    throttling_rate_limit    = 50
    data_trace_enabled       = false
    logging_level            = "OFF"
  }
}
