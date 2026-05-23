data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.app_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_permissions" {
  # DynamoDB access for chat service
  statement {
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
    ]
    resources = [
      aws_dynamodb_table.chat_messages.arn,
      aws_dynamodb_table.chat_connections.arn,
      "${aws_dynamodb_table.chat_connections.arn}/index/*",
    ]
  }

  # Allow chat Lambda to push messages back to connected WebSocket clients
  statement {
    actions   = ["execute-api:ManageConnections"]
    resources = ["${aws_apigatewayv2_api.chat_ws.execution_arn}/*"]
  }

  # Allow notifications Lambda to send SMS via SNS direct publish
  statement {
    actions   = ["sns:Publish"]
    resources = ["*"]
  }

  # Allow notifications Lambda to send email via SES
  statement {
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }

  # NOTE: Bedrock permissions removed — AI service now uses OpenRouter (HTTP).
  # NOTE: S3 flyer permissions removed — events service now uses Cloudflare R2.
  #       R2 credentials are passed as env vars (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "${var.app_name}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}

locals {
  lambda_common_env = {
    DATABASE_URL         = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}"
    ENV                  = var.environment
    COGNITO_REGION       = var.aws_region
    COGNITO_USER_POOL_ID = var.cognito_user_pool_id
  }
}

# ── Events Lambda ─────────────────────────────────────────────────────────────
resource "aws_lambda_function" "events" {
  function_name = "${var.app_name}-events"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.services["events"].repository_url}:latest"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 512

  environment {
    variables = merge(local.lambda_common_env, {
      R2_BUCKET                = var.r2_bucket
      R2_ENDPOINT_URL          = var.r2_endpoint_url
      R2_PUBLIC_URL            = var.r2_public_url
      # Real-time broadcast — fan out event updates to open WebSocket clients
      CONNECTIONS_TABLE        = aws_dynamodb_table.chat_connections.name
      WS_ENDPOINT              = "${aws_apigatewayv2_api.chat_ws.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_apigatewayv2_stage.chat_ws.name}"
      # Reminders — EventBridge Scheduler targets the notifications Lambda
      NOTIFICATIONS_LAMBDA_ARN = aws_lambda_function.notifications.arn
      SCHEDULER_ROLE_ARN       = aws_iam_role.scheduler.arn
      SNS_TOPIC_ARN            = aws_sns_topic.announcements.arn
    })
  }

  lifecycle {
    ignore_changes = [image_uri, environment]
  }
}

# ── Users Lambda ──────────────────────────────────────────────────────────────
resource "aws_lambda_function" "users" {
  function_name = "${var.app_name}-users"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.services["users"].repository_url}:latest"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 512

  environment {
    variables = merge(local.lambda_common_env, {
      # Real-time broadcast — propagate display_name changes to open event pages
      CONNECTIONS_TABLE = aws_dynamodb_table.chat_connections.name
      WS_ENDPOINT       = "${aws_apigatewayv2_api.chat_ws.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_apigatewayv2_stage.chat_ws.name}"
    })
  }

  lifecycle {
    ignore_changes = [image_uri, environment]
  }
}

# ── Chat Lambda ───────────────────────────────────────────────────────────────
# CI/CD (deploy.yml) pushes the real image and calls `update-function-code`.
# `lifecycle.ignore_changes` ensures Terraform never reverts that update.
resource "aws_lambda_function" "chat" {
  function_name = "${var.app_name}-chat"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.services["chat"].repository_url}:latest"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      MESSAGES_TABLE    = aws_dynamodb_table.chat_messages.name
      CONNECTIONS_TABLE = aws_dynamodb_table.chat_connections.name
      WS_ENDPOINT       = "${aws_apigatewayv2_api.chat_ws.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_apigatewayv2_stage.chat_ws.name}"
      ENV               = var.environment
    }
  }

  lifecycle {
    ignore_changes = [image_uri]
  }
}

resource "aws_lambda_permission" "chat_ws_gateway" {
  statement_id  = "AllowWebSocketAPIGatewayInvokeChat"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.chat_ws.execution_arn}/*/*"
}

# ── AI Lambda ─────────────────────────────────────────────────────────────────
resource "aws_lambda_function" "ai" {
  function_name = "${var.app_name}-ai"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.services["ai"].repository_url}:latest"
  architectures = ["arm64"]
  timeout       = 60   # Bedrock calls can take a few seconds
  memory_size   = 512

  environment {
    variables = merge(local.lambda_common_env, {
      MESSAGES_TABLE     = aws_dynamodb_table.chat_messages.name
      OPENROUTER_API_KEY = var.openrouter_api_key
      OPENROUTER_MODEL   = var.openrouter_model
    })
  }

  lifecycle {
    ignore_changes = [image_uri, environment]
  }
}
