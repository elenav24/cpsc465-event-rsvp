# ── ACM Certificate ───────────────────────────────────────────────────────────
# Still needed for the API Gateway custom domain (api.cohosted.cloud).
# Frontend (cohosted.cloud) is now served by Vercel — no ACM cert needed there.

resource "aws_acm_certificate" "main" {
  domain_name               = "cohosted.cloud"
  subject_alternative_names = ["*.cohosted.cloud"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# Output the DNS validation records so you can add them in your registrar
output "acm_validation_records" {
  description = "Add these CNAME records in your domain registrar to validate the ACM certificate"
  value = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
  timeouts {
    create = "30m"
  }
}

# NOTE: CloudFront distribution and S3 frontend bucket have been removed.
# Frontend is now hosted on Vercel (free tier).
# Point cohosted.cloud and www.cohosted.cloud to Vercel's DNS in your registrar.

# ── Custom domain for API Gateway (api.cohosted.cloud) ────────────────────────

resource "aws_apigatewayv2_domain_name" "api" {
  domain_name = "api.cohosted.cloud"

  domain_name_configuration {
    certificate_arn = aws_acm_certificate.main.arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }

  depends_on = [aws_acm_certificate_validation.main]
}

resource "aws_apigatewayv2_api_mapping" "api" {
  api_id      = aws_apigatewayv2_api.main.id
  domain_name = aws_apigatewayv2_domain_name.api.id
  stage       = aws_apigatewayv2_stage.default.id
}

# ── Outputs ───────────────────────────────────────────────────────────────────

output "api_gateway_domain" {
  description = "Point api.cohosted.cloud CNAME here"
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
}

output "api_gateway_hosted_zone_id" {
  description = "Use this for ALIAS records for api.cohosted.cloud"
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
}
