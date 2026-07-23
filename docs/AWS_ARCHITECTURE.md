# DevCoach AI — Propuesta de Arquitectura AWS

> **Autor:** Abner (Cloud Engineer)
> **Fecha:** Julio 2026
> **Estado:** Propuesta — pendiente de revisión del equipo

---

## Contexto

Actualmente el proyecto corre en entornos mixtos:

| Componente | Plataforma actual |
|------------|------------------|
| Frontend React | Vercel |
| Backend FastAPI | Render |
| Base de datos | Supabase |
| Auth (JWT) | Implementación propia |

Esta propuesta plantea migrar todo a AWS para centralizar el despliegue, mejorar el control operativo y aprovechar la capa gratuita disponible.

---

## Arquitectura propuesta

```
Usuario
  │
  ▼
CloudFront (CDN global + HTTPS)
  │
  ▼
S3 (Frontend React — archivos estáticos)
  │
  │  peticiones HTTP al backend
  ▼
Elastic Beanstalk (Backend FastAPI)
  │              │              │
  ▼              ▼              ▼
RDS          Secrets        Bedrock
PostgreSQL   Manager        (opcional)
(base datos) (API keys)     (agentes IA)
```

---

## Descripción de cada servicio

### 1. Amazon S3 + CloudFront — Frontend

**Reemplaza:** Vercel

**Cómo funciona:**
- Se ejecuta `pnpm build` en el frontend, generando la carpeta `dist/` con HTML, CSS y JavaScript.
- Esos archivos se suben a un bucket de S3 configurado como sitio web estático.
- CloudFront se pone delante de S3 como CDN: sirve los archivos desde el servidor más cercano al usuario, con HTTPS automático y caché global.

**Cambios en el código:** ninguno. Solo configuración en AWS.

---

### 2. AWS Elastic Beanstalk — Backend

**Reemplaza:** Render

**Cómo funciona:**
- Se sube el código del backend (zip o conexión al repositorio GitHub).
- Elastic Beanstalk detecta que es Python, instala `requirements.txt` y ejecuta `uvicorn app.main:app` automáticamente.
- Maneja reinicios automáticos si el proceso cae y escala si hay mucho tráfico.
- Las variables de entorno (`AI_PROVIDER`, `GITHUB_TOKEN`, etc.) se configuran desde el panel de AWS, sin necesidad de un archivo `.env`.

**Cambios en el código:** ninguno. El backend FastAPI corre igual.

**Instancia recomendada:** `t2.micro` o `t3.micro` (cubiertas por el free tier).

---

### 3. Amazon RDS PostgreSQL — Base de datos

**Reemplaza:** Supabase (base de datos)

**Cómo funciona:**
- Se crea una instancia RDS con PostgreSQL.
- El esquema SQL existente (`backend/supabase/001_initial_schema.sql`) se aplica sin modificaciones.
- El backend se conecta usando `asyncpg` o `SQLAlchemy` en vez del cliente de Supabase.

**Cambios en el código:** mínimos — solo en `backend/app/services/db_service.py`, reemplazando el cliente de Supabase por una conexión directa a PostgreSQL.

**Instancia recomendada:** `db.t3.micro` con 20 GB (cubierta por el free tier 12 meses).

---

### 4. AWS Secrets Manager — Variables de entorno

**Reemplaza:** archivo `.env` local

**Cómo funciona:**
- Cada secreto (API key de Gemini, API key de Groq, token de GitHub, credenciales de RDS) se almacena de forma segura en Secrets Manager.
- El backend los lee en tiempo de ejecución con `boto3`, sin necesidad de archivos `.env` ni compartir credenciales por el chat del equipo.

**Cambios en el código:** pequeño — agregar una función en `config.py` que lea secretos de AWS en vez de variables de entorno locales.

---

### 5. Amazon Cognito — Autenticación

**Reemplaza:** sistema JWT manual de Camilo (`auth_service.py`)

**Cómo funciona:**
- Cognito maneja registro, login, expiración de tokens y recuperación de contraseña.
- El frontend usa el SDK de Cognito en vez de llamar a `/api/auth/login` y `/api/auth/register`.
- El backend valida los tokens de Cognito en cada petición protegida.

**Cambios en el código:** moderados — afecta `auth_service.py` en el backend y `authService.ts` + `authSlice` en el frontend.

**Costo:** gratuito hasta 50,000 usuarios activos por mes.

---

## Plan de implementación por fases

Se propone implementar en fases independientes. Cada fase deja el sistema funcionando.

### Fase 1 — Despliegue base (recomendada para el hackathon)

**Servicios:** Elastic Beanstalk + S3 + CloudFront

**Resultado:** la app corre completamente en AWS. Supabase se mantiene igual.

**Esfuerzo estimado:** 1 día

**Pasos:**
1. Crear bucket S3 y habilitar hosting estático
2. Crear distribución CloudFront apuntando al bucket
3. Crear aplicación en Elastic Beanstalk (Python 3.11)
4. Configurar variables de entorno en Elastic Beanstalk
5. Hacer `pnpm build` y subir `dist/` a S3
6. Subir backend como zip a Elastic Beanstalk
7. Actualizar `VITE_API_URL` en el frontend con la URL de Elastic Beanstalk

---

### Fase 2 — Gestión segura de secretos

**Servicios:** AWS Secrets Manager

**Resultado:** ninguna credencial vive en archivos de texto ni variables de entorno del panel.

**Esfuerzo estimado:** medio día

**Pasos:**
1. Crear secretos en Secrets Manager (uno por API key)
2. Asignar permisos IAM a la instancia de Elastic Beanstalk para leer secretos
3. Actualizar `config.py` para leer desde Secrets Manager con `boto3`

---

### Fase 3 — Migración de base de datos (fase futura)

**Servicios:** Amazon RDS PostgreSQL

**Resultado:** base de datos completamente en AWS, sin dependencia de Supabase.

**Esfuerzo estimado:** 1-2 días

**Pasos:**
1. Crear instancia RDS PostgreSQL `db.t3.micro`
2. Ejecutar migraciones SQL existentes en RDS
3. Actualizar `db_service.py` para usar `asyncpg`
4. Migrar datos existentes de Supabase a RDS
5. Actualizar secretos de conexión en Secrets Manager

---

### Fase 4 — Migración de autenticación (fase futura)

**Servicios:** Amazon Cognito

**Resultado:** sistema de auth gestionado por AWS, sin código de auth propio.

**Esfuerzo estimado:** 2-3 días

**Pasos:**
1. Crear User Pool en Cognito con los atributos necesarios (email, nombre)
2. Actualizar `auth_service.py` para validar tokens de Cognito
3. Actualizar `authService.ts` y `authSlice` en el frontend
4. Migrar usuarios existentes

---

## Costos estimados (con free tier AWS)

| Servicio | Free tier | Costo estimado hackathon |
|----------|-----------|--------------------------|
| S3 | 5 GB + 20K peticiones/mes | $0 |
| CloudFront | 1 TB transferencia/mes | $0 |
| Elastic Beanstalk (t2.micro) | 750 horas/mes — 12 meses | $0 |
| RDS (db.t3.micro) | 750 horas/mes — 12 meses | $0 |
| Secrets Manager | — | ~$0.40/mes (4 secretos) |
| Cognito | 50,000 usuarios/mes | $0 |
| **Total Fase 1+2** | | **$0** |
| **Total completo** | | **~$0.40/mes** |

> **Nota:** Estos costos aplican para cuentas AWS con menos de 12 meses. Configurar una alerta de billing en $10 como medida preventiva.

---

## Servicios adicionales recomendados

### Amazon CloudWatch — Monitoreo
Elastic Beanstalk ya envía métricas básicas a CloudWatch automáticamente. Se recomienda agregar:
- Alerta si el backend tarda más de 30 segundos (límite del spec para los agentes IA)
- Dashboard con peticiones por minuto y tasa de errores
- Notificación por email si la app cae

**Costo:** $0 con free tier.

### AWS WAF — Seguridad (opcional Demo Day)
Protege contra bots y abuso del endpoint de análisis de código. Se conecta a CloudFront sin cambios en el código.

**Costo:** ~$5/mes. Recomendado activar solo para el Demo Day.

---

## Comparación final

| | Actual (Vercel + Render) | Propuesta AWS |
|--|--------------------------|---------------|
| Frontend | Vercel | S3 + CloudFront |
| Backend | Render | Elastic Beanstalk |
| Base de datos | Supabase | RDS PostgreSQL |
| Auth | JWT manual | Cognito |
| Secretos | `.env` compartido | Secrets Manager |
| Monitoreo | Básico | CloudWatch |
| Costo | Gratis (free tier externo) | ~$0/mes (free tier AWS) |
| Control operativo | Limitado | Total |
| Vendor lock-in | Múltiples proveedores | Un solo proveedor |

---

## Recomendación para el hackathon

Implementar **Fase 1** antes del Demo Day. Con eso:
- La app corre completamente en AWS
- No hay dependencia de máquinas locales
- Se puede mostrar una URL pública estable durante la presentación

Las Fases 2, 3 y 4 se proponen como **roadmap post-hackathon**, demostrando visión de escalabilidad sin comprometer el tiempo disponible.

---

*Documento preparado por Abner — cualquier duda o ajuste, coordinamos en el canal del equipo.*
