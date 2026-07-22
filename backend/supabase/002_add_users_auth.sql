-- DevCoach AI — Migración 002: Sistema de autenticación
-- Pegar este SQL en Supabase → SQL Editor → Run
-- PREREQUISITO: 001_initial_schema.sql debe estar aplicado antes

-- ============================================
-- Tabla: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   TEXT NOT NULL CHECK (char_length(full_name) >= 2 AND char_length(full_name) <= 100),
    email       TEXT UNIQUE NOT NULL CHECK (char_length(email) <= 255),
    password    TEXT NOT NULL,   -- bcrypt hash, nunca en texto claro
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Asociar projects con users
-- ============================================

-- NOTA: Si ya hay filas en projects (datos de prueba), borrarlas antes:
-- DELETE FROM projects;

ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE;

-- Índice para acelerar "dame los proyectos de este usuario"
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- ============================================
-- Verificación rápida
-- ============================================
-- Insertar usuario de prueba (descomentar para probar):
-- INSERT INTO users (full_name, email, password)
-- VALUES ('Test User', 'test@example.com', '$2b$12$placeholder_hash_here');
--
-- Verificar que email duplicado falla:
-- INSERT INTO users (full_name, email, password)
-- VALUES ('Test User 2', 'test@example.com', '$2b$12$placeholder');
-- → debe lanzar error de UNIQUE constraint
