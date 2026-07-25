-- DevCoach AI — Script 008: Calcular XP retroactivo para usuarios existentes
-- Ejecutar UNA SOLA VEZ después de aplicar la migración 007.
-- Este script calcula el XP total basado en reviews aprobadas existentes
-- y asigna el nivel correspondiente.
--
-- Curva de niveles:
--   Nivel 1: 0 XP | Nivel 2: 100 | Nivel 3: 250 | Nivel 4: 500
--   Nivel 5: 850 | Nivel 6: 1300 | Nivel 7: 1900 | Nivel 8: 2600
--   Nivel 9: 3500 | Nivel 10: 4500 | Nivel 11: 5700

-- Paso 1: Calcular XP por usuario (suma de calificaciones de reviews aprobadas)
WITH user_xp AS (
    SELECT
        p.user_id,
        COALESCE(SUM(COALESCE(r.calificacion, 0)), 0) AS total_xp
    FROM reviews r
    JOIN tickets t ON r.ticket_id = t.id
    JOIN projects p ON t.project_id = p.id
    WHERE r.aprobado = true
    GROUP BY p.user_id
)
UPDATE users
SET
    xp = user_xp.total_xp,
    level = CASE
        WHEN user_xp.total_xp >= 5700 THEN 11
        WHEN user_xp.total_xp >= 4500 THEN 10
        WHEN user_xp.total_xp >= 3500 THEN 9
        WHEN user_xp.total_xp >= 2600 THEN 8
        WHEN user_xp.total_xp >= 1900 THEN 7
        WHEN user_xp.total_xp >= 1300 THEN 6
        WHEN user_xp.total_xp >= 850 THEN 5
        WHEN user_xp.total_xp >= 500 THEN 4
        WHEN user_xp.total_xp >= 250 THEN 3
        WHEN user_xp.total_xp >= 100 THEN 2
        ELSE 1
    END,
    last_active_date = CURRENT_DATE,
    current_streak = 1
FROM user_xp
WHERE users.id = user_xp.user_id;

-- Verificación:
-- SELECT id, full_name, xp, level, current_streak FROM users ORDER BY xp DESC;
