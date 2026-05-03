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

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "lambda_permissions" {
  # S3 flyer uploads (events service only, but shared role keeps things simple)
  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.flyers.arn}/*"]
  }

  # Read app secrets
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app_secrets.arn]
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
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "${var.app_name}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}

locals {
  subnet_ids = [
    "subnet-069240ff7fc06095a",
    "subnet-0bab5aba308c9c0a6",
    "subnet-0d8d668d6ab9bc7f0",
    "subnet-0f21e879f77fff5ba",
  ]

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

  vpc_config {
    subnet_ids         = local.subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
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

  vpc_config {
    subnet_ids         = local.subnet_ids
    security_group_ids = [aws_security_group.lambda.id]
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
