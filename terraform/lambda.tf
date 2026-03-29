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
  # S3 flyer uploads
  statement {
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.flyers.arn}/*"]
  }

  # Read app secrets
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.app_secrets.arn]
  }
}

resource "aws_iam_role_policy" "lambda_permissions" {
  name   = "${var.app_name}-lambda-policy"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.lambda_permissions.json
}

resource "aws_lambda_function" "app" {
  function_name = "event-rsvp-lambda"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.app.repository_url}:latest"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 512

  environment {
    variables = {
      # Pull secrets at runtime via the app's dotenv/os.getenv
      # These are injected directly for Lambda cold-start speed
      DATABASE_URL     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}"
      S3_BUCKET        = aws_s3_bucket.flyers.bucket
      S3_REGION            = var.aws_region
      ENV                  = var.environment
      COGNITO_REGION       = var.aws_region
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
    }
  }

  lifecycle {
    ignore_changes = [image_uri] # updated by CI/CD, not Terraform
  }

  vpc_config {
    subnet_ids         = [
      "subnet-069240ff7fc06095a",
      "subnet-0bab5aba308c9c0a6",
      "subnet-0d8d668d6ab9bc7f0",
      "subnet-0f21e879f77fff5ba",
    ]
    security_group_ids = [aws_security_group.lambda.id]
  }
}
