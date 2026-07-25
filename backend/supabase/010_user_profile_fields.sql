-- DevCoach AI — Migración 010: Campos de perfil público
-- Pegar en Supabase → SQL Editor → Run

-- Bio / descripción corta
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL
        CHECK (bio IS NULL OR char_length(bio) <= 300);

-- LinkedIn URL
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT NULL
        CHECK (linkedin_url IS NULL OR char_length(linkedin_url) <= 500);

-- GitHub username
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS github_username TEXT DEFAULT NULL
        CHECK (github_username IS NULL OR char_length(github_username) <= 100);
