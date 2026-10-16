-- DolanArchives Database Schema
-- Dedicated table for academic documents, research notes, proofs, and papers
-- Runs on the existing Supabase PostgreSQL instance

CREATE TABLE IF NOT EXISTS dolan_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    subject TEXT NOT NULL DEFAULT 'Computer Science',
    doc_type TEXT NOT NULL DEFAULT 'Research Notes',
    status TEXT NOT NULL DEFAULT 'published',
    content TEXT NOT NULL,
    abstract TEXT,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    word_count INT NOT NULL DEFAULT 0,
    reading_time_min INT NOT NULL DEFAULT 1,
    citations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast query indexes
CREATE INDEX IF NOT EXISTS idx_archives_updated 
    ON dolan_archives (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_archives_subject 
    ON dolan_archives (subject);

CREATE INDEX IF NOT EXISTS idx_archives_pinned_updated 
    ON dolan_archives (is_pinned DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_archives_status 
    ON dolan_archives (status);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION set_dolan_archives_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dolan_archives_updated_at ON dolan_archives;
CREATE TRIGGER trigger_dolan_archives_updated_at
BEFORE UPDATE ON dolan_archives
FOR EACH ROW
EXECUTE FUNCTION set_dolan_archives_updated_at();
