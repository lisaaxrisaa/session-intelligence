-- Session Intelligence - Supabase Schema
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- Table: sessions
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  transcription TEXT NOT NULL,
  meeting_notes TEXT NOT NULL,
  todos JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning JSONB NOT NULL DEFAULT '[]'::jsonb,
  context_used TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_sessions_created_at ON sessions (created_at DESC);

-- Table: context_summaries
CREATE TABLE context_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  key_people JSONB NOT NULL DEFAULT '[]'::jsonb,
  open_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  project_context JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_context_summaries_version ON context_summaries (version DESC);

-- RLS: permissive policies for single-user tool
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE context_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on context_summaries" ON context_summaries FOR ALL USING (true) WITH CHECK (true);
