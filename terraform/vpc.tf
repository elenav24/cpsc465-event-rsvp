# Lambda runs outside the VPC — no NAT gateway needed ($0 saved vs $32/month).
# RDS is made publicly accessible so Lambda can reach it directly over the
# internet. Access is restricted to port 5432 with SSL enforced at the DB level.

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["event-rsvp-vpc"]
  }
}
