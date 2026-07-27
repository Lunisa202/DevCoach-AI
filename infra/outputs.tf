# ─────────────────────────────────────────────────────────────────────────────
# Outputs — URLs and resource identifiers after deploy
# Run: terraform output
# ─────────────────────────────────────────────────────────────────────────────

output "frontend_url" {
  description = "Public URL of the React frontend via CloudFront (HTTPS)"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "backend_url" {
  description = "Public URL of the FastAPI backend via CloudFront HTTPS proxy"
  value       = "https://${aws_cloudfront_distribution.backend.domain_name}"
}

output "backend_url_direct" {
  description = "Direct HTTP URL of the backend (Elastic Beanstalk, no HTTPS)"
  value       = "http://${aws_elastic_beanstalk_environment.backend.cname}"
}

output "s3_frontend_bucket" {
  description = "S3 bucket name for the frontend — use this in deploy commands"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID — use this to invalidate cache after deploys"
  value       = aws_cloudfront_distribution.frontend.id
}

output "eb_environment_name" {
  description = "Elastic Beanstalk environment name — use with 'eb deploy'"
  value       = aws_elastic_beanstalk_environment.backend.name
}

output "deploy_commands" {
  description = "Commands to deploy frontend and backend updates"
  value       = <<-EOT
    ── FRONTEND UPDATE ──────────────────────────────────────
    cd frontend
    pnpm build
    aws s3 sync dist/ s3://${aws_s3_bucket.frontend.id} --delete
    aws cloudfront create-invalidation \
      --distribution-id ${aws_cloudfront_distribution.frontend.id} \
      --paths "/*"

    ── BACKEND UPDATE ───────────────────────────────────────
    cd backend
    zip -r ../deploy.zip . -x "venv/*" -x ".env" -x "__pycache__/*"
    eb deploy ${aws_elastic_beanstalk_environment.backend.name}
  EOT
}
