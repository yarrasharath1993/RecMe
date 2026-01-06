-- =====================================================
-- CONSOLIDATED MIGRATION: Visual Intelligence + Smart Reviews
-- Run this in Supabase SQL Editor
-- Date: January 2026
-- Strategy: ADDITIVE ONLY - no modifications to existing data
-- =====================================================

-- =====================================================
-- PART 1: VISUAL INTELLIGENCE (Movies Table)
-- =====================================================

-- 1.1 Visual confidence score for poster quality (0.0 to 1.0)
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_confidence DECIMAL(3,2) DEFAULT NULL;

-- 1.2 Visual type classification for archival tier system
ALTER TABLE movies ADD COLUMN IF NOT EXISTS poster_visual_type TEXT DEFAULT NULL;

-- 1.3 Add constraint for valid visual types (if not exists)
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

-- 1.4 Archive card data for Tier 3 movies without valid posters
ALTER TABLE movies ADD COLUMN IF NOT EXISTS archive_card_data JSONB DEFAULT NULL;

-- 1.5 Verification tracking
ALTER TABLE movies ADD COLUMN IF NOT EXISTS visual_verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS visual_verified_by TEXT DEFAULT NULL;

-- 1.6 Create indexes for efficient visual type queries
CREATE INDEX IF NOT EXISTS idx_movies_poster_visual_type ON movies(poster_visual_type);
CREATE INDEX IF NOT EXISTS idx_movies_poster_confidence ON movies(poster_confidence);

-- 1.7 Add comments for documentation
COMMENT ON COLUMN movies.poster_confidence IS 'Visual confidence score (0.0-1.0). Tier 1: 0.9-1.0, Tier 2: 0.6-0.8, Tier 3: 0.3-0.5';
COMMENT ON COLUMN movies.poster_visual_type IS 'Classification of visual source for archival tier system';
COMMENT ON COLUMN movies.archive_card_data IS 'JSON data for rendering archive reference cards (Tier 3 visuals)';
COMMENT ON COLUMN movies.visual_verified_at IS 'Timestamp when visual was verified';
COMMENT ON COLUMN movies.visual_verified_by IS 'Who or what verified the visual (e.g., backfill_script_v1)';

-- =====================================================
-- PART 2: SMART REVIEW FIELDS (Movie Reviews Table)
-- =====================================================

-- 2.1 Smart review structured data
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS smart_review JSONB DEFAULT NULL;

-- 2.2 Timestamp for when smart review was derived
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS smart_review_derived_at TIMESTAMPTZ DEFAULT NULL;

-- 2.3 Flag for reviews that need human verification
ALTER TABLE movie_reviews ADD COLUMN IF NOT EXISTS needs_human_review BOOLEAN DEFAULT false;

-- 2.4 Create index for efficient queries on human review queue
CREATE INDEX IF NOT EXISTS idx_movie_reviews_needs_human_review 
ON movie_reviews(needs_human_review) WHERE needs_human_review = true;

-- 2.5 Create index for smart review existence checks
CREATE INDEX IF NOT EXISTS idx_movie_reviews_smart_review 
ON movie_reviews((smart_review IS NOT NULL));

-- 2.6 Add comments for documentation
COMMENT ON COLUMN movie_reviews.smart_review IS 'Structured smart review data derived from metadata and existing review content';
COMMENT ON COLUMN movie_reviews.smart_review_derived_at IS 'Timestamp when smart review fields were automatically derived';
COMMENT ON COLUMN movie_reviews.needs_human_review IS 'Flag indicating review needs human verification for derived fields';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify movies table columns
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_name = 'movies' 
  AND column_name IN ('poster_confidence', 'poster_visual_type', 'archive_card_data', 'visual_verified_at', 'visual_verified_by');
  
  IF col_count = 5 THEN
    RAISE NOTICE '✅ Movies table: All 5 visual intelligence columns added successfully';
  ELSE
    RAISE NOTICE '⚠️ Movies table: Only % of 5 columns found', col_count;
  END IF;
END $$;

-- Verify movie_reviews table columns
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns 
  WHERE table_name = 'movie_reviews' 
  AND column_name IN ('smart_review', 'smart_review_derived_at', 'needs_human_review');
  
  IF col_count = 3 THEN
    RAISE NOTICE '✅ Movie Reviews table: All 3 smart review columns added successfully';
  ELSE
    RAISE NOTICE '⚠️ Movie Reviews table: Only % of 3 columns found', col_count;
  END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
-- 
-- Movies Table - New Columns:
--   1. poster_confidence     DECIMAL(3,2)  - Visual confidence score
--   2. poster_visual_type    TEXT          - Visual type classification
--   3. archive_card_data     JSONB         - Archive card data
--   4. visual_verified_at    TIMESTAMPTZ   - Verification timestamp
--   5. visual_verified_by    TEXT          - Who verified
--
-- Movie Reviews Table - New Columns:
--   1. smart_review               JSONB        - Structured review data
--   2. smart_review_derived_at    TIMESTAMPTZ  - Derivation timestamp
--   3. needs_human_review         BOOLEAN      - Human review flag
--
-- Indexes Created:
--   - idx_movies_poster_visual_type
--   - idx_movies_poster_confidence
--   - idx_movie_reviews_needs_human_review (partial)
--   - idx_movie_reviews_smart_review
--
-- =====================================================

