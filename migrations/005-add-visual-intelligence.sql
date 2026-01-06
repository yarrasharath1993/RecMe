-- =====================================================
-- Migration: 005-add-visual-intelligence.sql
-- Purpose: Add visual confidence and archival tier support
-- Date: January 2026
-- Strategy: ADDITIVE ONLY - no modifications to existing columns
-- =====================================================

-- Visual confidence score for poster quality (0.0 to 1.0)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_confidence DECIMAL(3,2) DEFAULT NULL;

-- Visual type classification for archival tier system
-- Tier 1: original_poster (TMDB, verified sources)
-- Tier 2: archival_still, magazine_ad, song_book_cover, newspaper_clipping, cassette_cover
-- Tier 3: archive_card, placeholder
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_visual_type TEXT DEFAULT NULL;

-- Add constraint for valid visual types
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'movies_poster_visual_type_check'
  ) THEN
    ALTER TABLE movies ADD CONSTRAINT movies_poster_visual_type_check 
    CHECK (poster_visual_type IS NULL OR poster_visual_type IN (
      'original_poster', 
      'archival_still', 
      'magazine_ad', 
      'song_book_cover', 
      'newspaper_clipping', 
      'cassette_cover', 
      'archive_card', 
      'placeholder'
    ));
  END IF;
END $$;

-- Archive card data for Tier 3 movies without valid posters
-- Structure: { title, year, lead_actor, studio, archive_reason, verified_limitation, metadata_source }
ALTER TABLE movies ADD COLUMN IF NOT EXISTS archive_card_data JSONB DEFAULT NULL;

-- Verification tracking
ALTER TABLE movies ADD COLUMN IF NOT EXISTS visual_verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS visual_verified_by TEXT DEFAULT NULL;

-- Create index for efficient visual type queries
CREATE INDEX IF NOT EXISTS idx_movies_poster_visual_type ON movies(poster_visual_type);
CREATE INDEX IF NOT EXISTS idx_movies_poster_confidence ON movies(poster_confidence);

-- Add comment for documentation
COMMENT ON COLUMN movies.poster_confidence IS 'Visual confidence score (0.0-1.0). Tier 1: 0.9-1.0, Tier 2: 0.6-0.8, Tier 3: 0.3-0.5';
COMMENT ON COLUMN movies.poster_visual_type IS 'Classification of visual source for archival tier system';
COMMENT ON COLUMN movies.archive_card_data IS 'JSON data for rendering archive reference cards (Tier 3 visuals)';

