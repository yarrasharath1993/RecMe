-- ============================================================
-- MIGRATION 008: Extended Cast & Crew Fields
-- ============================================================
-- Adds support for:
-- - Producer (individual or production company)
-- - Supporting cast (5 actors with roles)
-- - Extended crew (cinematographer, editor, writer, etc.)
-- - Editorial score for unrated movies
-- ============================================================

-- Add producer column
ALTER TABLE movies ADD COLUMN IF NOT EXISTS producer TEXT;
COMMENT ON COLUMN movies.producer IS 'Primary producer or production company';

-- Add supporting cast as JSONB array
-- Format: [{"name": "Actor Name", "role": "Character/Role", "order": 1, "type": "supporting|cameo|special"}]
ALTER TABLE movies ADD COLUMN IF NOT EXISTS supporting_cast JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN movies.supporting_cast IS 'Array of supporting cast members with roles';

-- Add crew as JSONB object
-- Format: {"cinematographer": "...", "editor": "...", "writer": "...", "choreographer": "...", "art_director": "..."}
ALTER TABLE movies ADD COLUMN IF NOT EXISTS crew JSONB DEFAULT '{}'::jsonb;
COMMENT ON COLUMN movies.crew IS 'Extended crew information (cinematographer, editor, writer, etc.)';

-- Add editorial score fields for movies without external ratings
ALTER TABLE movies ADD COLUMN IF NOT EXISTS editorial_score DECIMAL(3,1);
ALTER TABLE movies ADD COLUMN IF NOT EXISTS editorial_score_breakdown JSONB;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS editorial_score_confidence DECIMAL(3,2);
COMMENT ON COLUMN movies.editorial_score IS 'Derived editorial score (1-10) for movies without external ratings';
COMMENT ON COLUMN movies.editorial_score_breakdown IS 'Breakdown of editorial score factors';
COMMENT ON COLUMN movies.editorial_score_confidence IS 'Confidence level of editorial score (0-1)';

-- Add rating source tracking
ALTER TABLE movies ADD COLUMN IF NOT EXISTS rating_source TEXT DEFAULT 'external';
COMMENT ON COLUMN movies.rating_source IS 'Source of rating: external (IMDB/TMDB), editorial_derived, or combined';

-- ============================================================
-- INDEXES
-- ============================================================

-- Index for finding movies by producer
CREATE INDEX IF NOT EXISTS idx_movies_producer ON movies(producer) WHERE producer IS NOT NULL;

-- GIN index for searching supporting cast names
CREATE INDEX IF NOT EXISTS idx_movies_supporting_cast ON movies USING GIN (supporting_cast jsonb_path_ops);

-- Index for finding movies with editorial scores
CREATE INDEX IF NOT EXISTS idx_movies_editorial_score ON movies(editorial_score) WHERE editorial_score IS NOT NULL;

-- Index for rating source
CREATE INDEX IF NOT EXISTS idx_movies_rating_source ON movies(rating_source);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to extract supporting cast names as array
CREATE OR REPLACE FUNCTION get_supporting_cast_names(cast_json JSONB)
RETURNS TEXT[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT jsonb_array_elements_text(
      jsonb_path_query_array(cast_json, '$[*].name')
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a person is in supporting cast
CREATE OR REPLACE FUNCTION is_in_supporting_cast(cast_json JSONB, person_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM jsonb_array_elements(cast_json) elem
    WHERE lower(elem->>'name') = lower(person_name)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================
-- VALIDATION CHECK CONSTRAINT
-- ============================================================

-- Ensure supporting_cast is an array
ALTER TABLE movies DROP CONSTRAINT IF EXISTS chk_supporting_cast_array;
ALTER TABLE movies ADD CONSTRAINT chk_supporting_cast_array 
  CHECK (jsonb_typeof(supporting_cast) = 'array');

-- Ensure crew is an object
ALTER TABLE movies DROP CONSTRAINT IF EXISTS chk_crew_object;
ALTER TABLE movies ADD CONSTRAINT chk_crew_object 
  CHECK (jsonb_typeof(crew) = 'object');

-- Ensure editorial_score is in valid range
ALTER TABLE movies DROP CONSTRAINT IF EXISTS chk_editorial_score_range;
ALTER TABLE movies ADD CONSTRAINT chk_editorial_score_range 
  CHECK (editorial_score IS NULL OR (editorial_score >= 1 AND editorial_score <= 10));

-- ============================================================
-- SAMPLE DATA STRUCTURE (for reference)
-- ============================================================
-- 
-- supporting_cast example:
-- [
--   {"name": "Brahmanandam", "role": "Comedy", "order": 1, "type": "supporting"},
--   {"name": "Prakash Raj", "role": "Villain", "order": 2, "type": "supporting"},
--   {"name": "Sunil", "role": "Friend", "order": 3, "type": "supporting"},
--   {"name": "Ali", "role": "Sidekick", "order": 4, "type": "supporting"},
--   {"name": "Venu Madhav", "role": "Comedy", "order": 5, "type": "supporting"}
-- ]
--
-- crew example:
-- {
--   "cinematographer": "P.S. Vinod",
--   "editor": "Marthand K. Venkatesh",
--   "writer": "Trivikram Srinivas",
--   "choreographer": "Prem Rakshith",
--   "art_director": "A.S. Prakash",
--   "lyricist": "Sirivennela Sitarama Sastry"
-- }
--
-- editorial_score_breakdown example:
-- {
--   "genre_baseline": 6.8,
--   "era_adjustment": 0.3,
--   "director_average": 7.2,
--   "hero_average": 7.5,
--   "metadata_bonus": 0.8,
--   "final_weights": {"genre": 0.3, "comparable": 0.4, "metadata": 0.3}
-- }

