variable "aws_region" {
  description = "AWS region where all resources will be created"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name used as prefix for all resources"
  type        = string
  default     = "devcoach-ai"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

# ── Backend environment variables ────────────────────────────────────────────
variable "ai_provider" {
  description = "AI provider to use: 'gemini' or 'groq'"
  type        = string
  default     = "gemini"
}

variable "gemini_api_key" {
  description = "Google Gemini API key"
  type        = string
  sensitive   = true
}

variable "groq_api_key" {
  description = "Groq API key (leave empty if using Gemini)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "github_token" {
  description = "GitHub Personal Access Token for GitHub API"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_key" {
  description = "Supabase anon/service key"
  type        = string
  sensitive   = true
}

variable "jwt_secret_key" {
  description = "Secret key for signing JWT tokens (min 32 chars)"
  type        = string
  sensitive   = true
}

# ── Elastic Beanstalk ─────────────────────────────────────────────────────────
variable "ec2_instance_type" {
  description = "EC2 instance type for Elastic Beanstalk (t2.micro = free tier)"
  type        = string
  default     = "t2.micro"
}
