-- DevCoach AI — Migración 004: API Key personal por usuario
-- Pegar este SQL en Supabase → SQL Editor → Run
-- PREREQUISITO: 002_add_users_auth.sql debe estar aplicado antes

-- Agregar columna para almacenar la API key personal de Gemini
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS gemini_api_key TEXT DEFAULT NULL;

-- Comentario: esta columna permite que cada usuario configure su propia
-- API key de Gemini. Si es NULL, el sistema usa la key del .env (global).
-- La key se almacena en texto (en producción se debería cifrar con KMS).
