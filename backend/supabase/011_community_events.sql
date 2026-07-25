-- DevCoach AI — Migración 011: Eventos de comunidad (feed de actividad)
-- Pegar en Supabase → SQL Editor → Run

CREATE TABLE IF NOT EXISTS community_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('level_up', 'achievement', 'rank_first', 'joined')),
    payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_events_created ON community_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_events_user ON community_events(user_id);
