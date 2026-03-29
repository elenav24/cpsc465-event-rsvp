# Reference the existing RDS security group
resource "aws_security_group" "rds" {
  name        = "event-rsvp-rds-sg"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = data.aws_vpc.main.id

  ingress {
    description              = "PostgreSQL from Lambda"
    from_port                = 5432
    to_port                  = 5432
    protocol                 = "tcp"
    security_groups          = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Allow Lambda to connect to RDS on port 5432 — defined inline on aws_security_group.rds

resource "aws_db_subnet_group" "main" {
  name = "event-rsvp-db-subnet-group"
  subnet_ids = [
    "subnet-069240ff7fc06095a", # us-east-1a
    "subnet-0bab5aba308c9c0a6", # us-east-1a
    "subnet-0d8d668d6ab9bc7f0", # us-east-1b
    "subnet-0f21e879f77fff5ba", # us-east-1b
  ]
}

resource "aws_db_instance" "postgres" {
  identifier        = "db-event-rsvp"
  engine            = "postgres"
  engine_version    = "16"
  instance_class    = "db.t4g.micro"
  allocated_storage = 20

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  availability_zone      = "us-east-1a"
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  skip_final_snapshot       = false
  final_snapshot_identifier = "db-event-rsvp-final-snapshot"
  deletion_protection       = true
  backup_retention_period   = 0
  storage_encrypted         = true

  lifecycle {
    ignore_changes = [password, username]
  }
}
