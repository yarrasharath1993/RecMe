-- ============================================================
-- MIGRATION 031: Wikipedia Enrichment Staging Tables
-- ============================================================
-- Creates staging tables for Wikipedia-sourced enrichments
-- to allow manual review before applying to production tables.
-- 
-- Run this migration before running enrichment scripts:
-- - enrich-movie-metadata-from-wiki.ts
-- - enrich-celebrity-metadata-from-wiki.ts
-- ============================================================

-- ============================================================
-- MOVIE WIKI ENRICHMENTS STAGING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS movie_wiki_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID REFERENCES movies(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  
  -- Extracted movie metadata
  synopsis TEXT,
  overview TEXT,
  genres TEXT[],
  release_date TEXT, -- Store as text for manual review before parsing
  runtime_minutes INTEGER,
  certification TEXT,
  tagline TEXT,
  
  -- Box office data (JSONB)
  box_office JSONB DEFAULT '{}',
  -- Structure: {
  --   budget: string,
  --   opening: string,
  --   lifetimeGross: string,
  --   worldwideGross: string,
  --   verdict: string
  -- }
  
  -- Trivia data (JSONB)
  trivia JSONB DEFAULT '{}',
  -- Structure: {
  --   productionNotes: string[],
  --   shootingLocations: string[],
  --   culturalImpact: string,
  --   controversies: string[]
  -- }
  
  -- External IDs
  wikidata_id TEXT,
  
  -- Metadata for review
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  
  -- Unique constraint: one enrichment per movie
  CONSTRAINT unique_movie_enrichment UNIQUE (movie_id)
);

-- Add comments for documentation
COMMENT ON TABLE movie_wiki_enrichments IS 
  'Staging table for Wikipedia-sourced movie enrichments. Allows manual review before applying to production.';

COMMENT ON COLUMN movie_wiki_enrichments.source_url IS 
  'Wikipedia URL where data was extracted from';

COMMENT ON COLUMN movie_wiki_enrichments.confidence_score IS 
  'Confidence score 0.0-1.0 based on field coverage and data quality';

COMMENT ON COLUMN movie_wiki_enrichments.status IS 
  'Review status: pending (not reviewed), approved (ready to apply), rejected (ignore), applied (already applied)';

COMMENT ON COLUMN movie_wiki_enrichments.box_office IS 
  'Box office collection data in JSONB format';

COMMENT ON COLUMN movie_wiki_enrichments.trivia IS 
  'Production trivia and cultural impact notes in JSONB format';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_movie_wiki_enrichments_movie_id 
  ON movie_wiki_enrichments(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_wiki_enrichments_status 
  ON movie_wiki_enrichments(status);

CREATE INDEX IF NOT EXISTS idx_movie_wiki_enrichments_confidence 
  ON movie_wiki_enrichments(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_movie_wiki_enrichments_created 
  ON movie_wiki_enrichments(created_at DESC);

-- GIN index for JSONB fields
CREATE INDEX IF NOT EXISTS idx_movie_wiki_enrichments_box_office 
  ON movie_wiki_enrichments USING GIN (box_office);

CREATE INDEX IF NOT EXISTS idx_movie_wiki_enrichments_trivia 
  ON movie_wiki_enrichments USING GIN (trivia);

-- ============================================================
-- CELEBRITY WIKI ENRICHMENTS STAGING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS celebrity_wiki_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID REFERENCES celebrities(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  
  -- Biography
  full_bio TEXT,
  full_bio_te TEXT,
  
  -- Personal details
  date_of_birth TEXT, -- Store as text for manual review before parsing
  place_of_birth TEXT,
  occupation TEXT[],
  years_active TEXT,
  height TEXT,
  education TEXT,
  nicknames TEXT[],
  
  -- Family relationships (JSONB)
  family_relationships JSONB DEFAULT '{}',
  -- Structure: {
  --   father: {name: string, slug?: string},
  --   mother: {name: string, slug?: string},
  --   spouse: {name: string, slug?: string},
  --   children: [{name: string, slug?: string}],
  --   siblings: [{name: string, slug?: string, relation: string}]
  -- }
  
  -- Career information
  known_for TEXT[],
  industry_title TEXT,
  signature_style TEXT,
  brand_pillars TEXT[],
  
  -- Actor eras (JSONB)
  actor_eras JSONB DEFAULT '[]',
  -- Structure: [{
  --   name: string,
  --   years: string,
  --   themes: string[],
  --   keyFilms: string[]
  -- }]
  
  -- Awards (JSONB)
  awards JSONB DEFAULT '[]',
  -- Structure: [{
  --   year: number,
  --   award: string,
  --   film?: string,
  --   category?: string
  -- }]
  awards_count INTEGER DEFAULT 0,
  
  -- Social media links (JSONB)
  social_links JSONB DEFAULT '{}',
  -- Structure: {
  --   twitter?: string,
  --   instagram?: string,
  --   facebook?: string,
  --   website?: string
  -- }
  
  -- Metadata for review
  confidence_score FLOAT DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
  review_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  
  -- Unique constraint: one enrichment per celebrity
  CONSTRAINT unique_celebrity_enrichment UNIQUE (celebrity_id)
);

-- Add comments for documentation
COMMENT ON TABLE celebrity_wiki_enrichments IS 
  'Staging table for Wikipedia-sourced celebrity enrichments. Allows manual review before applying to production.';

COMMENT ON COLUMN celebrity_wiki_enrichments.source_url IS 
  'Wikipedia URL where data was extracted from';

COMMENT ON COLUMN celebrity_wiki_enrichments.confidence_score IS 
  'Confidence score 0.0-1.0 based on field coverage and data quality';

COMMENT ON COLUMN celebrity_wiki_enrichments.status IS 
  'Review status: pending (not reviewed), approved (ready to apply), rejected (ignore), applied (already applied)';

COMMENT ON COLUMN celebrity_wiki_enrichments.family_relationships IS 
  'Family dynasty graph in JSONB format';

COMMENT ON COLUMN celebrity_wiki_enrichments.social_links IS 
  'Social media profile URLs in JSONB format';

COMMENT ON COLUMN celebrity_wiki_enrichments.awards IS 
  'Awards history in JSONB array format';

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_celebrity_id 
  ON celebrity_wiki_enrichments(celebrity_id);

CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_status 
  ON celebrity_wiki_enrichments(status);

CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_confidence 
  ON celebrity_wiki_enrichments(confidence_score DESC);

CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_created 
  ON celebrity_wiki_enrichments(created_at DESC);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_family 
  ON celebrity_wiki_enrichments USING GIN (family_relationships);

CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_social 
  ON celebrity_wiki_enrichments USING GIN (social_links);

CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_awards 
  ON celebrity_wiki_enrichments USING GIN (awards);

CREATE INDEX IF NOT EXISTS idx_celebrity_wiki_enrichments_actor_eras 
  ON celebrity_wiki_enrichments USING GIN (actor_eras);

-- ============================================================
-- HELPER VIEWS FOR REVIEW
-- ============================================================

-- View for high-confidence pending movie enrichments
CREATE OR REPLACE VIEW movie_enrichments_high_confidence AS
SELECT 
  e.*,
  m.title_en,
  m.title_te,
  m.release_year,
  m.slug
FROM movie_wiki_enrichments e
JOIN movies m ON e.movie_id = m.id
WHERE e.status = 'pending' AND e.confidence_score >= 0.7
ORDER BY e.confidence_score DESC, e.created_at DESC;

COMMENT ON VIEW movie_enrichments_high_confidence IS 
  'High-confidence (>=70%) pending movie enrichments ready for quick approval';

-- View for high-confidence pending celebrity enrichments
CREATE OR REPLACE VIEW celebrity_enrichments_high_confidence AS
SELECT 
  e.*,
  c.name_en,
  c.name_te,
  c.slug
FROM celebrity_wiki_enrichments e
JOIN celebrities c ON e.celebrity_id = c.id
WHERE e.status = 'pending' AND e.confidence_score >= 0.7
ORDER BY e.confidence_score DESC, e.created_at DESC;

COMMENT ON VIEW celebrity_enrichments_high_confidence IS 
  'High-confidence (>=70%) pending celebrity enrichments ready for quick approval';

-- View for enrichments needing review
CREATE OR REPLACE VIEW enrichments_review_queue AS
SELECT 
  'movie' as type,
  e.id,
  e.movie_id as entity_id,
  m.title_en as entity_name,
  e.confidence_score,
  e.created_at,
  e.source_url
FROM movie_wiki_enrichments e
JOIN movies m ON e.movie_id = m.id
WHERE e.status = 'pending'
UNION ALL
SELECT 
  'celebrity' as type,
  e.id,
  e.celebrity_id as entity_id,
  c.name_en as entity_name,
  e.confidence_score,
  e.created_at,
  e.source_url
FROM celebrity_wiki_enrichments e
JOIN celebrities c ON e.celebrity_id = c.id
WHERE e.status = 'pending'
ORDER BY confidence_score DESC, created_at DESC;

COMMENT ON VIEW enrichments_review_queue IS 
  'Combined view of all pending enrichments sorted by confidence and recency';

-- ============================================================
-- VALIDATION & SUMMARY FUNCTIONS
-- ============================================================

-- Function to get enrichment stats
CREATE OR REPLACE FUNCTION get_enrichment_stats()
RETURNS TABLE (
  entity_type TEXT,
  pending_count BIGINT,
  approved_count BIGINT,
  applied_count BIGINT,
  rejected_count BIGINT,
  avg_confidence FLOAT,
  high_confidence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'movies'::TEXT,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'applied'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    AVG(confidence_score),
    COUNT(*) FILTER (WHERE status = 'pending' AND confidence_score >= 0.7)
  FROM movie_wiki_enrichments
  UNION ALL
  SELECT 
    'celebrities'::TEXT,
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'applied'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    AVG(confidence_score),
    COUNT(*) FILTER (WHERE status = 'pending' AND confidence_score >= 0.7)
  FROM celebrity_wiki_enrichments;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_enrichment_stats() IS 
  'Get summary statistics for enrichment staging tables';

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Migration 031 completed successfully!';
  RAISE NOTICE '  - Created movie_wiki_enrichments staging table';
  RAISE NOTICE '  - Created celebrity_wiki_enrichments staging table';
  RAISE NOTICE '  - Created helper views for review';
  RAISE NOTICE '  - Created enrichment stats function';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Run: npx tsx scripts/enrich-movie-metadata-from-wiki.ts';
  RAISE NOTICE '  2. Run: npx tsx scripts/enrich-celebrity-metadata-from-wiki.ts';
  RAISE NOTICE '  3. Review enrichments: SELECT * FROM enrichments_review_queue;';
  RAISE NOTICE '  4. Get stats: SELECT * FROM get_enrichment_stats();';
END $$;
