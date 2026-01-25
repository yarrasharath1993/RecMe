-- ============================================================
-- MIGRATION 034: Entity Relations Table
-- ============================================================
-- Creates normalized many-to-many relationship table between
-- movies and celebrities/entities with confidence tracking.
--
-- PURPOSE: Index all movie-entity relationships from existing
-- text-based fields (hero, director, etc.) into a queryable,
-- confidence-scored table for:
-- - Foreign key relationships (supplemental to existing text fields)
-- - Pattern detection and inference
-- - Collaboration analysis
-- - Career trajectory queries
-- - Auto-fill gap detection
--
-- ADDITIVE ONLY - Original movie fields remain unchanged
-- ============================================================

-- ============================================================
-- MAIN TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS entity_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Movie relationship
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  movie_title TEXT NOT NULL, -- Denormalized for performance
  movie_year INTEGER, -- Denormalized for performance
  movie_slug TEXT NOT NULL,
  
  -- Entity identity
  entity_type TEXT NOT NULL, -- 'actor', 'actress', 'director', 'music_director', 'producer', 'writer', 'cinematographer', 'editor', 'choreographer', 'lyricist'
  entity_name TEXT NOT NULL, -- As appears in movie data
  entity_slug TEXT, -- Link to celebrities table (nullable - may not exist yet)
  
  -- Role specifics
  role_type TEXT NOT NULL, -- 'hero', 'heroine', 'director', 'supporting', 'crew', 'music', 'producer', 'writer', 'cinematographer', 'editor', 'choreographer', 'lyricist'
  character_name TEXT, -- For actors: character they played
  billing_order INTEGER, -- For supporting cast: order in credits (1-5)
  
  -- Confidence tracking
  is_verified BOOLEAN DEFAULT false, -- Manually verified or from high-confidence source
  is_inferred BOOLEAN DEFAULT false, -- Auto-inferred from patterns
  confidence DECIMAL(3,2) DEFAULT 0.95, -- Confidence score (0.00-1.00)
  inference_source TEXT DEFAULT 'manual', -- 'manual', 'tmdb', 'wikipedia', 'similarity', 'pattern', 'collaboration'
  
  -- Source tracking
  data_source TEXT, -- Which enrichment phase created this: 'existing_field', 'supporting_cast_json', 'crew_json', 'inference'
  source_metadata JSONB DEFAULT '{}', -- Additional source details
  
  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',
  
  -- Constraints
  CONSTRAINT unique_movie_entity_role UNIQUE(movie_id, entity_name, role_type),
  CONSTRAINT chk_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT chk_entity_type CHECK (entity_type IN ('actor', 'actress', 'director', 'music_director', 'producer', 'writer', 'cinematographer', 'editor', 'choreographer', 'lyricist', 'other')),
  CONSTRAINT chk_role_type CHECK (role_type IN ('hero', 'heroine', 'director', 'supporting', 'crew', 'music', 'producer', 'writer', 'cinematographer', 'editor', 'choreographer', 'lyricist', 'cameo', 'other'))
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_entity_relations_movie 
  ON entity_relations(movie_id);

CREATE INDEX IF NOT EXISTS idx_entity_relations_entity 
  ON entity_relations(entity_name);

CREATE INDEX IF NOT EXISTS idx_entity_relations_entity_slug 
  ON entity_relations(entity_slug) 
  WHERE entity_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_entity_relations_entity_type 
  ON entity_relations(entity_type, entity_name);

CREATE INDEX IF NOT EXISTS idx_entity_relations_role_type 
  ON entity_relations(role_type);

-- Confidence and quality queries
CREATE INDEX IF NOT EXISTS idx_entity_relations_confidence 
  ON entity_relations(confidence DESC);

CREATE INDEX IF NOT EXISTS idx_entity_relations_inferred 
  ON entity_relations(is_inferred) 
  WHERE is_inferred = true;

CREATE INDEX IF NOT EXISTS idx_entity_relations_low_confidence 
  ON entity_relations(confidence) 
  WHERE confidence < 0.70;

-- Source tracking
CREATE INDEX IF NOT EXISTS idx_entity_relations_inference_source 
  ON entity_relations(inference_source);

-- Temporal queries (for career trajectory)
CREATE INDEX IF NOT EXISTS idx_entity_relations_year 
  ON entity_relations(movie_year DESC);

-- Combined indexes for common queries
CREATE INDEX IF NOT EXISTS idx_entity_relations_entity_year 
  ON entity_relations(entity_name, movie_year DESC);

CREATE INDEX IF NOT EXISTS idx_entity_relations_entity_role 
  ON entity_relations(entity_name, role_type);

-- Full-text search on entity names
CREATE INDEX IF NOT EXISTS idx_entity_relations_entity_name_trgm 
  ON entity_relations USING gin (entity_name gin_trgm_ops);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_entity_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_entity_relations_updated_at
  BEFORE UPDATE ON entity_relations
  FOR EACH ROW
  EXECUTE FUNCTION update_entity_relations_updated_at();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function: Get all relations for a movie
CREATE OR REPLACE FUNCTION get_movie_relations(
  p_movie_id UUID
)
RETURNS TABLE (
  entity_name TEXT,
  entity_type TEXT,
  role_type TEXT,
  character_name TEXT,
  confidence DECIMAL,
  is_inferred BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.entity_name,
    er.entity_type,
    er.role_type,
    er.character_name,
    er.confidence,
    er.is_inferred
  FROM entity_relations er
  WHERE er.movie_id = p_movie_id
  ORDER BY 
    CASE er.role_type
      WHEN 'director' THEN 1
      WHEN 'hero' THEN 2
      WHEN 'heroine' THEN 3
      WHEN 'music' THEN 4
      WHEN 'producer' THEN 5
      WHEN 'supporting' THEN 6
      ELSE 7
    END,
    er.billing_order NULLS LAST,
    er.entity_name;
END;
$$ LANGUAGE plpgsql;

-- Function: Get filmography for an entity
CREATE OR REPLACE FUNCTION get_entity_filmography(
  p_entity_name TEXT,
  p_role_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  movie_id UUID,
  movie_title TEXT,
  movie_year INTEGER,
  movie_slug TEXT,
  role_type TEXT,
  character_name TEXT,
  confidence DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.movie_id,
    er.movie_title,
    er.movie_year,
    er.movie_slug,
    er.role_type,
    er.character_name,
    er.confidence
  FROM entity_relations er
  WHERE er.entity_name = p_entity_name
    AND (p_role_type IS NULL OR er.role_type = p_role_type)
  ORDER BY er.movie_year DESC NULLS LAST, er.movie_title;
END;
$$ LANGUAGE plpgsql;

-- Function: Find collaborations between two entities
CREATE OR REPLACE FUNCTION find_collaborations(
  p_entity1 TEXT,
  p_entity2 TEXT
)
RETURNS TABLE (
  movie_id UUID,
  movie_title TEXT,
  movie_year INTEGER,
  entity1_role TEXT,
  entity2_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er1.movie_id,
    er1.movie_title,
    er1.movie_year,
    er1.role_type as entity1_role,
    er2.role_type as entity2_role
  FROM entity_relations er1
  INNER JOIN entity_relations er2 
    ON er1.movie_id = er2.movie_id
  WHERE er1.entity_name = p_entity1
    AND er2.entity_name = p_entity2
    AND er1.entity_name != er2.entity_name
  ORDER BY er1.movie_year DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function: Count movies by entity and role
CREATE OR REPLACE FUNCTION count_entity_movies(
  p_entity_name TEXT,
  p_role_type TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT movie_id)
  INTO v_count
  FROM entity_relations
  WHERE entity_name = p_entity_name
    AND (p_role_type IS NULL OR role_type = p_role_type);
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Find inferred relations needing review
CREATE OR REPLACE FUNCTION get_inferred_relations_for_review(
  p_min_confidence DECIMAL DEFAULT 0.50,
  p_max_confidence DECIMAL DEFAULT 0.70,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  movie_title TEXT,
  movie_year INTEGER,
  entity_name TEXT,
  role_type TEXT,
  confidence DECIMAL,
  inference_source TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.movie_title,
    er.movie_year,
    er.entity_name,
    er.role_type,
    er.confidence,
    er.inference_source,
    er.created_at
  FROM entity_relations er
  WHERE er.is_inferred = true
    AND er.is_verified = false
    AND er.confidence >= p_min_confidence
    AND er.confidence <= p_max_confidence
  ORDER BY er.confidence DESC, er.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- VIEWS FOR ANALYSIS
-- ============================================================

-- View: Entity filmography with movie details
CREATE OR REPLACE VIEW entity_filmography_detailed AS
SELECT 
  er.entity_name,
  er.entity_type,
  er.entity_slug,
  er.role_type,
  COUNT(DISTINCT er.movie_id) as movie_count,
  MIN(er.movie_year) as debut_year,
  MAX(er.movie_year) as latest_year,
  ROUND(AVG(er.confidence), 2) as avg_confidence,
  COUNT(*) FILTER (WHERE er.is_inferred = true) as inferred_count,
  COUNT(*) FILTER (WHERE er.is_verified = true) as verified_count
FROM entity_relations er
GROUP BY er.entity_name, er.entity_type, er.entity_slug, er.role_type;

-- View: Collaboration frequency matrix
CREATE OR REPLACE VIEW collaboration_frequency AS
SELECT 
  er1.entity_name as entity1,
  er1.role_type as entity1_role,
  er2.entity_name as entity2,
  er2.role_type as entity2_role,
  COUNT(DISTINCT er1.movie_id) as collaboration_count,
  MIN(er1.movie_year) as first_collab_year,
  MAX(er1.movie_year) as last_collab_year,
  ROUND(AVG((er1.confidence + er2.confidence) / 2), 2) as avg_confidence
FROM entity_relations er1
INNER JOIN entity_relations er2 
  ON er1.movie_id = er2.movie_id
WHERE er1.entity_name < er2.entity_name  -- Avoid duplicates
  AND er1.entity_name != er2.entity_name
GROUP BY er1.entity_name, er1.role_type, er2.entity_name, er2.role_type
HAVING COUNT(DISTINCT er1.movie_id) >= 2  -- At least 2 collaborations
ORDER BY collaboration_count DESC;

-- View: Inferred relations pending review
CREATE OR REPLACE VIEW inferred_relations_review_queue AS
SELECT 
  er.id,
  er.movie_title,
  er.movie_year,
  er.movie_slug,
  er.entity_name,
  er.role_type,
  er.confidence,
  er.inference_source,
  er.source_metadata,
  er.created_at,
  CASE 
    WHEN er.confidence >= 0.65 THEN 'high'
    WHEN er.confidence >= 0.55 THEN 'medium'
    ELSE 'low'
  END as priority
FROM entity_relations er
WHERE er.is_inferred = true
  AND er.is_verified = false
ORDER BY 
  CASE 
    WHEN er.confidence >= 0.65 THEN 1
    WHEN er.confidence >= 0.55 THEN 2
    ELSE 3
  END,
  er.created_at DESC;

-- View: Entity relations quality metrics
CREATE OR REPLACE VIEW entity_relations_quality_metrics AS
SELECT 
  COUNT(*) as total_relations,
  COUNT(*) FILTER (WHERE is_verified = true) as verified_count,
  COUNT(*) FILTER (WHERE is_inferred = true) as inferred_count,
  COUNT(*) FILTER (WHERE confidence >= 0.90) as high_confidence_count,
  COUNT(*) FILTER (WHERE confidence >= 0.70 AND confidence < 0.90) as medium_confidence_count,
  COUNT(*) FILTER (WHERE confidence < 0.70) as low_confidence_count,
  ROUND(AVG(confidence), 3) as avg_confidence,
  COUNT(DISTINCT movie_id) as movies_with_relations,
  COUNT(DISTINCT entity_name) as unique_entities,
  COUNT(*) FILTER (WHERE entity_slug IS NOT NULL) as linked_to_celebrity_count,
  ROUND(COUNT(*) FILTER (WHERE entity_slug IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0), 2) as celebrity_link_percentage
FROM entity_relations;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE entity_relations IS 
  'Normalized many-to-many relationship table between movies and entities (actors, directors, crew). Supplements existing text-based fields in movies table with confidence tracking and inference support.';

COMMENT ON COLUMN entity_relations.is_verified IS 
  'True if relationship is manually verified or from high-confidence source (TMDB, Wikipedia). False if inferred or needs review.';

COMMENT ON COLUMN entity_relations.is_inferred IS 
  'True if relationship was auto-inferred from patterns, similarity, or collaboration history. All inferred relations should be reviewed.';

COMMENT ON COLUMN entity_relations.confidence IS 
  'Confidence score (0.00-1.00). Manual/TMDB: 0.95, Wikipedia: 0.85, Inferred: 0.50-0.70 depending on pattern strength.';

COMMENT ON COLUMN entity_relations.inference_source IS 
  'How this relation was created: manual, tmdb, wikipedia, similarity, pattern, collaboration';

COMMENT ON COLUMN entity_relations.entity_slug IS 
  'Foreign key link to celebrities.slug. Nullable - entity may not have celebrity profile yet. Populated via fuzzy matching.';

-- ============================================================
-- STATISTICS
-- ============================================================

-- Analyze table for query planning
ANALYZE entity_relations;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE 'Migration 034 (Entity Relations) completed successfully';
  RAISE NOTICE 'Created table: entity_relations with full relationship tracking';
  RAISE NOTICE 'Created indexes: 12 indexes for query optimization';
  RAISE NOTICE 'Created functions: get_movie_relations(), get_entity_filmography(), find_collaborations(), count_entity_movies(), get_inferred_relations_for_review()';
  RAISE NOTICE 'Created views: entity_filmography_detailed, collaboration_frequency, inferred_relations_review_queue, entity_relations_quality_metrics';
  RAISE NOTICE 'Next step: Run populate-entity-relations.ts to backfill from existing movie data';
END $$;
