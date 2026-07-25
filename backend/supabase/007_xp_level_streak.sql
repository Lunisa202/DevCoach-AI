-- DevCoach AI — Migración 007: XP, Nivel y Racha de actividad
-- Pegar este SQL en Supabase → SQL Editor → Run
-- PREREQUISITO: 002_add_users_auth.sql debe estar aplicado antes.

-- ============================================
-- XP y Nivel
-- ============================================
-- XP se acumula al aprobar reviews (xp += calificacion de la review).
-- El nivel se calcula en el backend según una curva:
--   Nivel 1: 0 XP
--   Nivel 2: 100 XP
--   Nivel 3: 250 XP
--   Nivel 4: 500 XP
--   Nivel 5: 850 XP
--   ... (incremento progresivo)

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
    ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1);

-- ============================================
-- Racha de actividad (streak)
-- ============================================
-- Se actualiza cada vez que el usuario aprueba una review.
-- Si la última actividad fue ayer → incrementa streak.
-- Si fue hoy → no cambia.
-- Si fue antes de ayer → resetea a 1.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    ADD COLUMN IF NOT EXISTS last_active_date DATE DEFAULT NULL;
