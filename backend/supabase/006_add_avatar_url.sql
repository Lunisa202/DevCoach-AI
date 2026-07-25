-- DevCoach AI — Migración 006: Avatar URL para perfil de usuario
-- Pegar este SQL en Supabase → SQL Editor → Run
-- PREREQUISITO: 002_add_users_auth.sql debe estar aplicado antes.

-- Agrega una columna para almacenar la URL del avatar del usuario.
-- Si es NULL, el frontend muestra las iniciales con color como fallback.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL
        CHECK (
            avatar_url IS NULL
            OR char_length(avatar_url) <= 2048
        );
