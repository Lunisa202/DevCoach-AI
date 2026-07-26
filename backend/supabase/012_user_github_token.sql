-- DevCoach AI — Migración 012: GitHub Token personal por usuario
-- Pegar en Supabase → SQL Editor → Run
-- PREREQUISITO: 002_add_users_auth.sql

-- Permite que cada usuario guarde su propio GitHub Personal Access Token.
-- Si no tiene uno, el backend usa el token del servidor (con rate limit compartido).
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token TEXT;
