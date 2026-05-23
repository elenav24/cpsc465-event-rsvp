variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "event-rsvp"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth client ID"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth client secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "database_url" {
  description = "PostgreSQL connection string (Neon)"
  type        = string
  sensitive   = true
  default     = ""
}

# ── Cloudflare R2 ─────────────────────────────────────────────────────────────

variable "r2_bucket" {
  description = "Cloudflare R2 bucket name for flyer uploads"
  type        = string
  default     = ""
}

variable "r2_endpoint_url" {
  description = "Cloudflare R2 S3-compatible endpoint (https://<account_id>.r2.cloudflarestorage.com)"
  type        = string
  default     = ""
}

variable "r2_public_url" {
  description = "Public base URL for R2 objects (https://pub-<hash>.r2.dev or custom domain)"
  type        = string
  default     = ""
}

variable "r2_access_key_id" {
  description = "Cloudflare R2 Access Key ID"
  type        = string
  sensitive   = true
  default     = ""
}

variable "r2_secret_access_key" {
  description = "Cloudflare R2 Secret Access Key"
  type        = string
  sensitive   = true
  default     = ""
}

# ── OpenRouter ────────────────────────────────────────────────────────────────

variable "openrouter_api_key" {
  description = "OpenRouter API key (https://openrouter.ai)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openrouter_model" {
  description = "OpenRouter model ID to use for the AI assistant"
  type        = string
  default     = "anthropic/claude-haiku-4-5"
}
