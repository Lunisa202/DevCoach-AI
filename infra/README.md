# DevCoach AI — Infraestructura AWS con Terraform

Gestiona toda la infraestructura de AWS para DevCoach AI.

## Arquitectura

```
Usuario
  ↓
CloudFront (HTTPS + CDN global)
  ↓
S3 (Frontend React — archivos estáticos)
  ↓  peticiones al backend
Elastic Beanstalk (FastAPI Python 3.11)
  ↓              ↓
Supabase       Gemini / Groq
(DB externa)   (IA externa)
```

## Recursos creados

| Recurso | Descripción |
|---------|-------------|
| `aws_s3_bucket.frontend` | Almacena el build del frontend |
| `aws_cloudfront_distribution.frontend` | CDN con HTTPS |
| `aws_elastic_beanstalk_application.backend` | App FastAPI |
| `aws_elastic_beanstalk_environment.backend` | Entorno Python 3.11 |
| `aws_iam_role.beanstalk_ec2` | Rol para instancias EC2 |
| `aws_iam_role.beanstalk_service` | Rol de servicio EB |

## Prerequisitos

```bash
# Instalar Terraform
sudo apt install unzip
wget https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip
unzip terraform_1.9.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/
terraform --version

# Instalar AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version

# Configurar credenciales AWS
aws configure
```

## Primer deploy

```bash
# 1. Copiar y llenar variables
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars

# 2. Inicializar Terraform
terraform init

# 3. Ver qué se va a crear (sin hacer nada)
terraform plan

# 4. Crear la infraestructura
terraform apply

# 5. Ver las URLs generadas
terraform output
```

## Deploy de actualizaciones

### Frontend (cuando hay cambios en React)

```bash
cd ../frontend
pnpm build
aws s3 sync dist/ s3://$(terraform -chdir=../infra output -raw s3_frontend_bucket) --delete
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=../infra output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### Backend (cuando hay cambios en FastAPI)

```bash
cd ../backend
zip -r ../deploy.zip . -x "venv/*" -x ".env" -x "__pycache__/*"
aws elasticbeanstalk create-application-version \
  --application-name devcoach-ai-backend \
  --version-label v$(date +%Y%m%d%H%M%S) \
  --source-bundle S3Bucket=$(terraform -chdir=../infra output -raw s3_frontend_bucket),S3Key=deploy.zip
```

## Destruir infraestructura

```bash
# ⚠️ Esto elimina todos los recursos de AWS
terraform destroy
```

## Costos estimados (free tier)

| Servicio | Free tier | Costo |
|----------|-----------|-------|
| S3 | 5 GB + 20K req/mes | $0 |
| CloudFront | 1 TB transferencia/mes | $0 |
| Elastic Beanstalk (t2.micro) | 750 horas/mes — 12 meses | $0 |
| **Total** | | **$0** |
