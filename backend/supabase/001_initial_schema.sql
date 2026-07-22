-- DevCoach AI — Schema Inicial
-- Pegar este SQL en Supabase → SQL Editor → Run
-- 
-- IMPORTANTE: Los valores de dificultad usan acentos ('fácil', 'difícil')
-- Asegurarse de que el encoding sea UTF-8

-- ============================================
-- Tabla: projects
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_url TEXT NOT NULL CHECK (char_length(repo_url) <= 2048),
    archivos_seleccionados TEXT[] NOT NULL,
    fecha_analisis TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: tickets
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL CHECK (char_length(titulo) <= 200),
    descripcion TEXT NOT NULL CHECK (char_length(descripcion) <= 2000),
    prioridad TEXT NOT NULL CHECK (prioridad IN ('alta', 'media', 'baja')),
    dificultad TEXT NOT NULL CHECK (dificultad IN ('fácil', 'media', 'difícil')),
    tiempo_estimado TEXT NOT NULL CHECK (char_length(tiempo_estimado) <= 50),
    estado TEXT NOT NULL DEFAULT 'to_do' CHECK (estado IN ('to_do', 'in_review', 'done'))
);

-- ============================================
-- Tabla: reviews
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    preguntas_generadas TEXT[] NOT NULL CHECK (
        array_length(preguntas_generadas, 1) BETWEEN 2 AND 3
    ),
    respuesta_usuario TEXT NOT NULL CHECK (char_length(respuesta_usuario) <= 5000),
    feedback_evaluator TEXT NOT NULL CHECK (char_length(feedback_evaluator) <= 3000),
    aprobado BOOLEAN NOT NULL
);

-- ============================================
-- Índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tickets_project_id ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_ticket_id ON reviews(ticket_id);

-- ============================================
-- Verificación: insertar y borrar un dato de prueba
-- (descomentar para probar que las restricciones funcionan)
-- ============================================
-- INSERT INTO projects (repo_url, archivos_seleccionados)
-- VALUES ('https://github.com/test/repo', ARRAY['src/main.py']);
--
-- -- Esto DEBE fallar (prioridad inválida):
-- INSERT INTO tickets (project_id, titulo, descripcion, prioridad, dificultad, tiempo_estimado)
-- VALUES (gen_random_uuid(), 'Test', 'desc', 'urgente', 'fácil', '2h');
