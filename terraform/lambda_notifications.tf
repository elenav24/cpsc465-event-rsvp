# ── Notifications Lambda ──────────────────────────────────────────────────────
# Handles two triggers:
#   1. SNS subscription — announcement fan-out SMS
#   2. EventBridge Scheduler — per-user reminder SMS

resource "aws_ecr_repository" "notifications" {
  name                 = "${var.app_name}-notifications"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "notifications" {
  repository = aws_ecr_repository.notifications.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}

resource "aws_lambda_function" "notifications" {
  function_name = "${var.app_name}-notifications"
  role          = aws_iam_role.lambda.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.notifications.repository_url}:latest"
  architectures = ["arm64"]
  timeout       = 30
  memory_size   = 256

  environment {
    variables = {
      ENV        = var.environment
      AWS_REGION = var.aws_region
    }
  }

  lifecycle {
    ignore_changes = [image_uri, environment]
  }
}

# Allow SNS to invoke the notifications Lambda
resource "aws_lambda_permission" "notifications_sns" {
  statement_id  = "AllowSNSInvokeNotifications"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.notifications.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.announcements.arn
}

# Subscribe the notifications Lambda to the announcements SNS topic
resource "aws_sns_topic_subscription" "notifications_lambda" {
  topic_arn = aws_sns_topic.announcements.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.notifications.arn
}

# ── Update events Lambda env to include SNS + scheduler vars ─────────────────
# These are injected via aws lambda update-function-configuration in CI/CD
# since lifecycle.ignore_changes = [environment] is set on the events Lambda.
# We output them here so CI/CD can pick them up.

output "announcements_sns_topic_arn" {
  description = "SNS topic ARN for announcement fan-out"
  value       = aws_sns_topic.announcements.arn
}

output "scheduler_role_arn" {
  description = "IAM role ARN for EventBridge Scheduler"
  value       = aws_iam_role.scheduler.arn
}

output "notifications_lambda_arn" {
  description = "Notifications Lambda ARN"
  value       = aws_lambda_function.notifications.arn
}

output "ecr_notifications_url" {
  description = "ECR repository URL for the notifications service"
  value       = aws_ecr_repository.notifications.repository_url
}
