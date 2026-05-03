# Reference the existing RDS security group
resource "aws_security_group" "rds" {
  name        = "rds-sg"
  description = "rds security group for event-rsvp"
  vpc_id      = data.aws_vpc.main.id

  lifecycle {
    ignore_changes = [ingress, egress, tags]
  }
}

# Lambda runs outside the VPC, so we open 5432 to the internet.
# The DB password and SSL provide the security layer.
resource "aws_security_group_rule" "rds_from_internet" {
  type              = "ingress"
  from_port         = 5432
  to_port           = 5432
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.rds.id
  description       = "PostgreSQL from Lambda (no VPC — internet access)"
}

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
  publicly_accessible    = true

  skip_final_snapshot       = false
  final_snapshot_identifier = "db-event-rsvp-final-snapshot"
  deletion_protection       = true
  backup_retention_period   = 0
  storage_encrypted         = true

  lifecycle {
    ignore_changes = [password, username]
  }
}
