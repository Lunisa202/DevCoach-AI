-- DevCoach AI — Migración 003: Evaluación detallada con 5 dimensiones
-- Pegar este SQL en Supabase → SQL Editor → Run
-- PREREQUISITO: 001 y 002 deben estar aplicados

-- Agregar timestamp a reviews (para saber cuándo se hizo cada intento)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Agregar calificación numérica (0-100)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS calificacion INTEGER CHECK (calificacion >= 0 AND calificacion <= 100);

-- Agregar aspectos evaluados como JSON (array de {dimension, puntaje, comentario})
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS aspectos_evaluados JSONB;

-- Agregar conceptos a mejorar (array de strings)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS conceptos_a_mejorar TEXT[];
