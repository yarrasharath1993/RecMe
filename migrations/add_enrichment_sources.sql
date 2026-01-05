-- Migration: Add enrichment_sources column to movie_reviews
-- Purpose: Track which review sections came from which data source
-- Example: {"synopsis": "wikipedia", "awards": "wikidata", "ratings": "omdb"}

-- Check if column exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'movie_reviews' AND column_name = 'enrichment_sources'
  ) THEN
    ALTER TABLE movie_reviews 
    ADD COLUMN enrichment_sources JSONB DEFAULT '{}';
    
    COMMENT ON COLUMN movie_reviews.enrichment_sources IS 
      'Tracks which review sections came from which data source (e.g., wikipedia, omdb, wikidata, google_kg, ai)';
  END IF;
END $$;

-- Add index for efficient querying of enrichment sources
CREATE INDEX IF NOT EXISTS idx_movie_reviews_enrichment_sources 
ON movie_reviews USING GIN (enrichment_sources);

-- Update existing reviews to have empty enrichment_sources if null
UPDATE movie_reviews 
SET enrichment_sources = '{}' 
WHERE enrichment_sources IS NULL;

