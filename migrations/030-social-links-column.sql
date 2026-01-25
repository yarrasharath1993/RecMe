-- Add social_links column to celebrities table for external profile links
-- Migration: 030-social-links-column.sql
-- Date: 2026-01-13

-- Add social_links JSONB column to store external profile URLs
-- Format: [{ platform: 'instagram', url: '...', handle: '...' }, ...]
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '[]';

-- Add signature_dialogues to fan_culture (stored in JSONB, but documenting structure)
-- fan_culture.signature_dialogues: [{ dialogue: '...', movie_slug: '...', movie_title: '...', year: ... }]
COMMENT ON COLUMN celebrities.social_links IS 'External profile links: Instagram, Twitter, Wikipedia, IMDB, etc.';
