# Lambda runs outside the VPC — no NAT gateway needed.
# RDS has been removed (migrated to Neon), so the RDS subnet route is no
# longer needed. The VPC and subnets remain as they were created outside
# of Terraform and are not managed here.

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["event-rsvp-vpc"]
  }
}
