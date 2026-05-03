data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["event-rsvp-vpc"]
  }
}

# ── NAT Gateway ───────────────────────────────────────────────────────────────
# Lambda runs in a VPC and never gets a public IP, so it needs a NAT GW to
# reach the internet (Cognito JWKS endpoint, Secrets Manager, etc.).
# Place the NAT GW in a public subnet (one that routes 0.0.0.0/0 → IGW).

resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "${var.app_name}-nat-eip" }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = "subnet-069240ff7fc06095a" # public subnet (routes to IGW)
  tags          = { Name = "${var.app_name}-nat" }
  depends_on    = [aws_eip.nat]
}

# Route private subnets through the NAT GW so Lambda can reach the internet
resource "aws_route" "private_subnet_0d_nat" {
  route_table_id         = "rtb-03f5eefc828175709" # subnet-0d8d668d6ab9bc7f0
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
}

resource "aws_route" "private_subnet_0b_nat" {
  route_table_id         = "rtb-05607e6e1de265fbd" # subnet-0bab5aba308c9c0a6
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main.id
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
