resource "aws_apigatewayv2_api" "main" {
  name          = "${var.app_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "https://cohosted.cloud",
      "https://www.cohosted.cloud",
      "http://localhost:5173",
    ]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 300
  }
}

# ── Integrations ──────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_integration" "events" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.events.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "users" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.users.invoke_arn
  payload_format_version = "2.0"
}

# ── Routes ────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_route" "events" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /events/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.events.id}"
}

resource "aws_apigatewayv2_route" "events_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /events"
  target    = "integrations/${aws_apigatewayv2_integration.events.id}"
}

resource "aws_apigatewayv2_route" "users" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /users/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.users.id}"
}

resource "aws_apigatewayv2_route" "users_root" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /users"
  target    = "integrations/${aws_apigatewayv2_integration.users.id}"
}

# ── Stage ─────────────────────────────────────────────────────────────────────

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

# ── Lambda permissions ────────────────────────────────────────────────────────

resource "aws_lambda_permission" "events_api_gateway" {
  statement_id  = "AllowAPIGatewayInvokeEvents"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.events.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "users_api_gateway" {
  statement_id  = "AllowAPIGatewayInvokeUsers"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.users.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
