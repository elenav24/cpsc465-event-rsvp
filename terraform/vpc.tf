# Lambda runs outside the VPC — no NAT gateway needed ($0 saved vs $32/month).
# RDS is made publicly accessible so Lambda can reach it directly over the
# internet. Access is restricted to port 5432 with SSL enforced at the DB level.

data "aws_vpc" "main" {
  filter {
    name   = "tag:Name"
    values = ["event-rsvp-vpc"]
  }
}

# Route table for the RDS subnet — needs an IGW route so the DB is reachable
# from the internet (Lambda runs outside the VPC).
resource "aws_route" "rds_subnet_igw" {
  route_table_id         = "rtb-05607e6e1de265fbd"
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = "igw-0642db481432634f4"
}
