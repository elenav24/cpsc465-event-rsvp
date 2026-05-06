# ── ACM Certificate ───────────────────────────────────────────────────────────
# CloudFront requires certificates in us-east-1 regardless of the app region.
# If your provider is already us-east-1 this is fine; otherwise add an alias provider.

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
  # validation_record_fqdns must be set after you add the DNS records.
  # Leave empty for now — Terraform will wait until the cert is validated.
  timeouts {
    create = "30m"
  }
}

# ── CloudFront for frontend (cohosted.cloud) ──────────────────────────────────

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.app_name}-frontend-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ── Response Headers Policy (security headers, no HSTS — eduroam/Infoblox incompatible) ──
resource "aws_cloudfront_response_headers_policy" "frontend" {
  name = "${var.app_name}-security-headers"

  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["cohosted.cloud", "www.cohosted.cloud"]
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "s3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id           = "s3-frontend"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.frontend.id

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    # index.html: no cache so deploys are instant
    # assets: long cache (Vite hashes filenames)
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 31536000
  }

  # SPA fallback — return index.html for any 403/404 from S3
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.main.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  depends_on = [aws_acm_certificate_validation.main]
}

# Lock down the S3 frontend bucket so only CloudFront can read it
resource "aws_s3_bucket_policy" "frontend_cf_only" {
  bucket     = aws_s3_bucket.frontend.id
  depends_on = [aws_cloudfront_distribution.frontend]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid    = "AllowCloudFrontServicePrincipal"
      Effect = "Allow"
      Principal = {
        Service = "cloudfront.amazonaws.com"
      }
      Action   = "s3:GetObject"
      Resource = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
        }
      }
    }]
  })
}

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

# ── Outputs: DNS records you need to add at your registrar ────────────────────

output "cloudfront_domain" {
  description = "Point cohosted.cloud and www.cohosted.cloud here (CNAME or ALIAS)"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_hosted_zone_id" {
  description = "Use this for ALIAS records at your registrar (Route 53 or similar)"
  value       = aws_cloudfront_distribution.frontend.hosted_zone_id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (used by CI to invalidate cache on deploy)"
  value       = aws_cloudfront_distribution.frontend.id
}

output "api_gateway_domain" {
  description = "Point api.cohosted.cloud CNAME here"
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].target_domain_name
}

output "api_gateway_hosted_zone_id" {
  description = "Use this for ALIAS records for api.cohosted.cloud"
  value       = aws_apigatewayv2_domain_name.api.domain_name_configuration[0].hosted_zone_id
}
