# ── Announcements SNS Topic ───────────────────────────────────────────────────
# The events Lambda publishes here when a host posts an announcement.
# The notifications Lambda subscribes and fans out SMS to opted-in members.
resource "aws_sns_topic" "announcements" {
  name = "${var.app_name}-announcements"
}

# ── EventBridge Scheduler IAM role ───────────────────────────────────────────
# Allows EventBridge Scheduler to invoke the notifications Lambda for reminders.
data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${var.app_name}-scheduler-role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json
}

resource "aws_iam_role_policy" "scheduler_invoke" {
  name = "${var.app_name}-scheduler-invoke-policy"
  role = aws_iam_role.scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "lambda:InvokeFunction"
      Resource = aws_lambda_function.notifications.arn
    }]
  })
}

# ── SNS permissions for Lambda ────────────────────────────────────────────────
resource "aws_iam_role_policy" "lambda_sns" {
  name = "${var.app_name}-lambda-sns-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["sns:Publish"]
        Resource = [
          aws_sns_topic.announcements.arn,
          "arn:aws:sns:${var.aws_region}:*:*",  # direct SMS publish
        ]
      },
      {
        Effect   = "Allow"
        Action   = [
          "scheduler:CreateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:UpdateSchedule",
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.scheduler.arn
      }
    ]
  })
}
