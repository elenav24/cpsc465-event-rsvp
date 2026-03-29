# Run `terraform apply` with these import blocks to pull existing AWS resources
# into Terraform state without recreating them.
# After a successful import + plan showing no changes, delete this file.

import {
  to = aws_ecr_repository.app
  id = "event-rsvp"
}

import {
  to = aws_s3_bucket.flyers
  id = "event-rsvp-flyers"
}

import {
  to = aws_lambda_function.app
  id = "event-rsvp-lambda"
}

# IAM role is being recreated clean — do not import the old auto-generated role.
# After `terraform apply`, manually update the Lambda's execution role in the console
# to point to the new "event-rsvp-lambda-role", then delete the old one.
