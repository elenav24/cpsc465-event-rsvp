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
  # S3 flyer uploads (events service only, but shared role keeps things simple)
  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.flyers.arn}/*"]
  }

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

  # Allow AI Lambda to call Bedrock (Claude 3.5 Haiku)
  statement {
    actions   = ["bedrock:InvokeModel"]
    resources = ["arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-haiku-20241022-v1:0"]
  }
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
      S3_BUCKET  = aws_s3_bucket.flyers.bucket
      S3_REGION  = var.aws_region
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
    variables = local.lambda_common_env
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
      MESSAGES_TABLE = aws_dynamodb_table.chat_messages.name
    })
  }

  lifecycle {
    ignore_changes = [image_uri, environment]
  }
}
