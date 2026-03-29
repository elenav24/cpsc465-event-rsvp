data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["event-rsvp-vpc"]
  }
}

# Security group for Lambda — allows outbound to RDS only
resource "aws_security_group" "lambda" {
  name        = "${var.app_name}-lambda-sg"
  description = "Security group for Lambda function"
  vpc_id      = data.aws_vpc.main.id

  egress {
    description = "PostgreSQL to RDS"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "HTTPS for Secrets Manager / Cognito JWKS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
