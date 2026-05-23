# Run `terraform apply` with these import blocks to pull existing AWS resources
# into Terraform state without recreating them.
# After a successful import + plan showing no changes, delete this file.

import {
  to = aws_security_group.rds
  id = "sg-0f5d5017f081f0f71"
}

import {
  to = aws_security_group_rule.rds_from_internet
  id = "sg-0f5d5017f081f0f71_ingress_tcp_5432_5432_0.0.0.0/0"
}
