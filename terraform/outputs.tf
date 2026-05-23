output "api_url" {
  description = "HTTP API Gateway invoke URL"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "ecr_events_url" {
  description = "ECR repository URL for the events service"
  value       = aws_ecr_repository.services["events"].repository_url
}

output "ecr_users_url" {
  description = "ECR repository URL for the users service"
  value       = aws_ecr_repository.services["users"].repository_url
}

output "lambda_events_name" {
  description = "Events Lambda function name"
  value       = aws_lambda_function.events.function_name
}

output "lambda_users_name" {
  description = "Users Lambda function name"
  value       = aws_lambda_function.users.function_name
}

output "s3_bucket_name" {
  description = "Cloudflare R2 bucket for flyer uploads"
  value       = var.r2_bucket
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint (being migrated to Neon)"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "frontend_url" {
  description = "Frontend URL (hosted on Vercel)"
  value       = "https://cohosted.cloud"
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_domain" {
  description = "Cognito hosted UI domain"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "chat_ws_url" {
  description = "WebSocket URL for the chat service"
  value       = "${aws_apigatewayv2_stage.chat_ws.invoke_url}"
}

output "chat_messages_table" {
  description = "DynamoDB table name for chat messages"
  value       = aws_dynamodb_table.chat_messages.name
}

output "chat_connections_table" {
  description = "DynamoDB table name for WebSocket connections"
  value       = aws_dynamodb_table.chat_connections.name
}

output "ecr_chat_url" {
  description = "ECR repository URL for the chat service"
  value       = aws_ecr_repository.services["chat"].repository_url
}

output "ecr_ai_url" {
  description = "ECR repository URL for the AI service"
  value       = aws_ecr_repository.services["ai"].repository_url
}
