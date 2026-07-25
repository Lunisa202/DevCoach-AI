-- DevCoach AI — Migración 005: Alias público para el leaderboard
-- Pegar este SQL en Supabase → SQL Editor → Run
-- PREREQUISITO: 002_add_users_auth.sql debe estar aplicado antes.
--
-- CONTEXTO:
--   El leaderboard (GET /api/ranking) muestra usuarios comparados por puntaje.
--   Para no exponer el nombre real (privacidad), cada usuario puede definir un
--   alias opcional que sustituye al full_name en el ranking.
--
-- CONTRATO DE VALIDACIÓN (coherente con la validación del backend):
--   - NULL         → sin alias configurado; se usa full_name como Display_Name.
--   - '  '         → prohibido (todo espacios). El backend rechaza con 422 antes de escribir.
--   - 'ab'..'x*30' → válido: entre 1 y 30 caracteres tras recortar espacios (trim).
--
--   El CHECK aquí es la última línea de defensa: si algo se filtra sin trimear,
--   la DB frena el INSERT/UPDATE.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS alias TEXT DEFAULT NULL
        CHECK (
            alias IS NULL
            OR (
                char_length(trim(alias)) BETWEEN 1 AND 30
            )
        );

-- Índice parcial para acelerar futuras búsquedas por alias (opcional).
-- Solo indexa filas donde alias no es NULL: mantiene el índice pequeño.
CREATE INDEX IF NOT EXISTS idx_users_alias
    ON users(alias)
    WHERE alias IS NOT NULL;
