# Lambda runs outside the VPC — no NAT gateway needed ($0 saved vs $32/month).
# RDS is made publicly accessible so Lambda can reach it directly over the
# internet. Access is restricted to port 5432 with SSL enforced at the DB level.
#
# The VPC data source and lambda SG are kept so existing references don't break,
# but the Lambda functions no longer attach to the VPC (vpc_config removed).

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["event-rsvp-vpc"]
  }
}

# Kept for the rds_from_lambda security group rule reference in rds.tf,
# but no longer attached to any Lambda function.
resource "aws_security_group" "lambda" {
  name        = "${var.app_name}-lambda-sg"
  description = "Security group for Lambda function (unused — Lambda runs outside VPC)"
  vpc_id      = data.aws_vpc.main.id
}
