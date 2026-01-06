-- =====================================================
-- Migration: 006-add-smart-review-fields.sql
-- Purpose: Add smart review enrichment fields
-- Date: January 2026
-- Strategy: ADDITIVE ONLY - no modifications to existing columns
-- =====================================================

-- Smart review structured data
-- Structure: {
--   why_to_watch: string[],
--   why_to_skip: string[],
--   critics_pov: string | null,
--   audience_pov: string | null,
--   legacy_status: 'cult_classic' | 'forgotten_gem' | 'landmark' | 'mainstream' | null,
--   mood_suitability: string[],
--   content_warnings: string[],
--   best_of_tags: { actor_best: boolean, director_best: boolean, music_best: boolean },
--   era_significance: string | null,
--   derivation_confidence: number
-- }
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS smart_review JSONB DEFAULT NULL;

-- Timestamp for when smart review was derived
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS smart_review_derived_at TIMESTAMPTZ DEFAULT NULL;

-- Flag for reviews that need human verification
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS needs_human_review BOOLEAN DEFAULT false;

-- Create index for efficient queries on human review queue
CREATE INDEX IF NOT EXISTS idx_movie_reviews_needs_human_review 
ON movie_reviews(needs_human_review) WHERE needs_human_review = true;

-- Create index for smart review existence checks
CREATE INDEX IF NOT EXISTS idx_movie_reviews_smart_review 
ON movie_reviews((smart_review IS NOT NULL));

-- Add comments for documentation
COMMENT ON COLUMN movie_reviews.smart_review IS 'Structured smart review data derived from metadata and existing review content';
COMMENT ON COLUMN movie_reviews.smart_review_derived_at IS 'Timestamp when smart review fields were automatically derived';
COMMENT ON COLUMN movie_reviews.needs_human_review IS 'Flag indicating review needs human verification for derived fields';

