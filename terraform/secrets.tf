resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "${var.app_name}/app"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    DATABASE_URL     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}"
    S3_BUCKET        = aws_s3_bucket.flyers.bucket
    S3_REGION            = var.aws_region
    ENV                  = var.environment
    COGNITO_REGION       = var.aws_region
    COGNITO_USER_POOL_ID = var.cognito_user_pool_id
  })

  lifecycle {
    ignore_changes = [secret_string]
  }
}
