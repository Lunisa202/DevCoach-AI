# ─────────────────────────────────────────────────────────────────────────────
# Elastic Beanstalk — FastAPI backend
# Runs the Python application with uvicorn
# ─────────────────────────────────────────────────────────────────────────────

# S3 bucket for Elastic Beanstalk application versions
resource "aws_s3_bucket" "eb_versions" {
  bucket = "${var.app_name}-eb-versions-${random_id.suffix.hex}"

  tags = {
    Name        = "${var.app_name}-eb-versions"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "eb_versions" {
  bucket = aws_s3_bucket.eb_versions.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Elastic Beanstalk application
resource "aws_elastic_beanstalk_application" "backend" {
  name        = "${var.app_name}-backend"
  description = "DevCoach AI FastAPI backend"

  tags = {
    Name        = "${var.app_name}-backend"
    Environment = var.environment
  }
}

# Elastic Beanstalk environment — Python 3.11 on Amazon Linux 2023
resource "aws_elastic_beanstalk_environment" "backend" {
  name                = "${var.app_name}-env"
  application         = aws_elastic_beanstalk_application.backend.name
  solution_stack_name = "64bit Amazon Linux 2023 v4.13.4 running Python 3.11"

  # ── Instance settings ──────────────────────────────────────────────────────
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.ec2_instance_type
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.beanstalk_ec2.name
  }

  # ── Service role ───────────────────────────────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.beanstalk_service.arn
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "SingleInstance"
  }

  # ── Application server — uvicorn command ──────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:container:python"
    name      = "WSGIPath"
    value     = "app.main:app"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PYTHONPATH"
    value     = "/var/app/current"
  }

  # ── Health check ───────────────────────────────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:application"
    name      = "Application Healthcheck URL"
    value     = "/health"
  }

  # ── Environment variables — backend config ─────────────────────────────────
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "AI_PROVIDER"
    value     = var.ai_provider
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "GEMINI_API_KEY"
    value     = var.gemini_api_key
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "GROQ_API_KEY"
    value     = var.groq_api_key
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "GITHUB_TOKEN"
    value     = var.github_token
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SUPABASE_URL"
    value     = var.supabase_url
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "SUPABASE_KEY"
    value     = var.supabase_key
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "JWT_SECRET_KEY"
    value     = var.jwt_secret_key
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "JWT_ALGORITHM"
    value     = "HS256"
  }

  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "JWT_EXPIRE_MINUTES"
    value     = "60"
  }

  # FRONTEND_URL will be set after CloudFront is created
  # Update this value once you have the CloudFront domain
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "FRONTEND_URL"
    value     = "https://${aws_cloudfront_distribution.frontend.domain_name}"
  }

  tags = {
    Name        = "${var.app_name}-environment"
    Environment = var.environment
  }
}
