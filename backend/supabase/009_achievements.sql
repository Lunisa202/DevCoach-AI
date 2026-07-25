-- DevCoach AI — Migración 009: Sistema de logros/badges
-- Pegar en Supabase → SQL Editor → Run
-- PREREQUISITO: 002_add_users_auth.sql

-- ============================================
-- Tabla: achievements (catálogo de logros)
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,                          -- código único: 'first_blood', 'streak_3', etc.
    title TEXT NOT NULL,                          -- nombre visible: "Primera sangre"
    description TEXT NOT NULL,                    -- cómo se desbloquea
    icon TEXT NOT NULL DEFAULT '🏆',              -- emoji del logro
    category TEXT NOT NULL DEFAULT 'general',     -- para agrupar: 'entrevistas', 'streaks', 'xp', 'proyectos'
    sort_order INTEGER NOT NULL DEFAULT 0         -- orden de visualización
);

-- ============================================
-- Tabla: user_achievements (logros desbloqueados)
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)              -- cada logro se desbloquea una sola vez
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

-- ============================================
-- Seed: catálogo de logros
-- ============================================
INSERT INTO achievements (id, title, description, icon, category, sort_order) VALUES
    ('first_blood',   'Primera sangre',  'Aprueba tu primera entrevista técnica',          '🎯', 'entrevistas', 1),
    ('streak_3',      'En racha',        'Mantén una racha de actividad de 3 días',        '🔥', 'streaks',     2),
    ('streak_7',      'Imparable',       'Mantén una racha de actividad de 7 días',        '⚡', 'streaks',     3),
    ('perfect_score', 'Perfeccionista',  'Obtén una calificación perfecta de 100/100',     '💯', 'entrevistas', 4),
    ('veteran',       'Veterano',        'Completa 10 tickets con entrevista aprobada',    '🏆', 'entrevistas', 5),
    ('explorer',      'Explorador',      'Analiza 5 repositorios diferentes',              '📚', 'proyectos',   6),
    ('master',        'Maestro',         'Alcanza el nivel 5 de experiencia',              '🧠', 'xp',          7),
    ('legend',        'Leyenda',         'Acumula 1000 puntos de experiencia',             '👑', 'xp',          8)
ON CONFLICT (id) DO NOTHING;
