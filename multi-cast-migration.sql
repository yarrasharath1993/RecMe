-- Multi-Cast Schema Migration SQL Script
-- Generated: 2026-01-14T19:42:22.617Z
-- Total Updates: 0

BEGIN;

-- Add columns if not exists
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroes TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroines TEXT[];

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_movies_heroes ON movies USING GIN (heroes);
CREATE INDEX IF NOT EXISTS idx_movies_heroines ON movies USING GIN (heroines);

-- Update movies

-- Commit changes
COMMIT;

-- Or rollback to review:
-- ROLLBACK;
