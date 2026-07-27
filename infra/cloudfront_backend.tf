# ─────────────────────────────────────────────────────────────────────────────
# CloudFront distribution for the backend (HTTPS proxy)
# Solves "Mixed Content" issue: frontend (HTTPS) → CloudFront → backend (HTTP)
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "backend" {
  enabled         = true
  is_ipv6_enabled = true
  comment         = "${var.app_name} backend HTTPS proxy"

  origin {
    domain_name = aws_elastic_beanstalk_environment.backend.cname
    origin_id   = "EB-backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "EB-backend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    # Don't cache API responses
    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0

    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers", "Authorization", "Content-Type"]
      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${var.app_name}-backend-proxy"
    Environment = var.environment
  }
}
