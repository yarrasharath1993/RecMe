-- Migration: Add Actor Profile, Awards, and Enrichment Changes Tables
-- Purpose: Support actor profile enrichment, awards tracking, and changes audit
-- Created: January 2026
-- Dependencies: Requires existing governance fields (trust_score, confidence_tier, etc.)

-- =============================================================================
-- TABLE 1: actor_profiles
-- Purpose: Store actor biographical data, career stats, and profile information
-- =============================================================================

CREATE TABLE IF NOT EXISTS actor_profiles (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  
  -- Biographical information
  biography_en TEXT,
  biography_te TEXT,
  birth_date DATE,
  birth_place TEXT,
  
  -- Career information
  debut_year INTEGER,
  debut_film TEXT,
  total_films INTEGER,
  years_active INTEGER,
  genres_worked TEXT[],
  
  -- Profile media
  profile_image_url TEXT,
  
  -- Awards summary
  awards_count INTEGER DEFAULT 0,
  
  -- Career highlights (JSONB for flexibility)
  career_highlights JSONB DEFAULT '[]'::jsonb,
  -- Example structure:
  -- [
  --   {"year": 2015, "event": "Baahubali breakthrough", "significance": "Pan-India star"},
  --   {"year": 2020, "event": "National Award", "category": "Best Actor"}
  -- ]
  
  -- Governance integration
  trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100),
  confidence_tier TEXT CHECK (confidence_tier IN ('verified', 'high', 'medium', 'low', 'unverified')),
  content_type TEXT CHECK (content_type IN ('verified_fact', 'editorial', 'user_submitted', 'archive', 'disputed')),
  governance_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  last_verified_at TIMESTAMP,
  data_confidence DECIMAL(3,2) CHECK (data_confidence BETWEEN 0 AND 1),
  
  -- Source tracking
  biography_sources TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Example: ['tmdb', 'wikipedia', 'wikidata']
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_years CHECK (
    debut_year IS NULL OR 
    (debut_year >= 1920 AND debut_year <= EXTRACT(YEAR FROM CURRENT_DATE) + 2)
  ),
  CONSTRAINT valid_active_years CHECK (
    years_active IS NULL OR 
    (years_active >= 0 AND years_active <= 100)
  )
);

-- Indexes for actor_profiles
CREATE INDEX IF NOT EXISTS idx_actor_profiles_name ON actor_profiles(name);
CREATE INDEX IF NOT EXISTS idx_actor_profiles_slug ON actor_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_actor_profiles_debut_year ON actor_profiles(debut_year);
CREATE INDEX IF NOT EXISTS idx_actor_profiles_trust_score ON actor_profiles(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_actor_profiles_confidence_tier ON actor_profiles(confidence_tier);
CREATE INDEX IF NOT EXISTS idx_actor_profiles_last_verified ON actor_profiles(last_verified_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_actor_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actor_profiles_updated_at
  BEFORE UPDATE ON actor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_actor_profiles_updated_at();

-- =============================================================================
-- TABLE 2: actor_awards
-- Purpose: Store structured awards data for actors with confidence tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS actor_awards (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Actor reference (denormalized for performance)
  actor_name TEXT NOT NULL,
  actor_profile_id UUID REFERENCES actor_profiles(id) ON DELETE CASCADE,
  
  -- Award details
  award_name TEXT NOT NULL,
  category TEXT,
  year INTEGER CHECK (year >= 1930 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 1),
  film_title TEXT,
  
  -- Result
  result TEXT NOT NULL CHECK (result IN ('won', 'nominated')),
  
  -- Source and confidence
  source TEXT NOT NULL,
  -- Example: 'wikipedia', 'wikidata', 'imdb'
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),
  
  -- Governance integration
  trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100),
  is_disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  
  -- Additional metadata
  ceremony_date DATE,
  award_tier TEXT CHECK (award_tier IN ('national', 'international', 'regional', 'industry', 'critics', 'other')),
  notes TEXT,
  
  -- Source URLs for verification
  source_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(actor_name, award_name, category, year, film_title)
);

-- Indexes for actor_awards
CREATE INDEX IF NOT EXISTS idx_actor_awards_actor_name ON actor_awards(actor_name);
CREATE INDEX IF NOT EXISTS idx_actor_awards_actor_profile_id ON actor_awards(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_actor_awards_year ON actor_awards(year DESC);
CREATE INDEX IF NOT EXISTS idx_actor_awards_result ON actor_awards(result);
CREATE INDEX IF NOT EXISTS idx_actor_awards_award_tier ON actor_awards(award_tier);
CREATE INDEX IF NOT EXISTS idx_actor_awards_confidence ON actor_awards(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_actor_awards_is_disputed ON actor_awards(is_disputed);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_actor_awards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER actor_awards_updated_at
  BEFORE UPDATE ON actor_awards
  FOR EACH ROW
  EXECUTE FUNCTION update_actor_awards_updated_at();

-- Trigger to sync awards_count in actor_profiles
CREATE OR REPLACE FUNCTION sync_actor_awards_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE actor_profiles 
    SET awards_count = awards_count + 1
    WHERE name = NEW.actor_name;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE actor_profiles 
    SET awards_count = GREATEST(0, awards_count - 1)
    WHERE name = OLD.actor_name;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_awards_count_insert
  AFTER INSERT ON actor_awards
  FOR EACH ROW
  EXECUTE FUNCTION sync_actor_awards_count();

CREATE TRIGGER sync_awards_count_delete
  AFTER DELETE ON actor_awards
  FOR EACH ROW
  EXECUTE FUNCTION sync_actor_awards_count();

-- =============================================================================
-- TABLE 3: enrichment_changes
-- Purpose: Audit trail for all enrichment operations with validation tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS enrichment_changes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Timestamp (indexed for time-series queries)
  timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Actor context
  actor_name TEXT,
  
  -- Operation details
  action TEXT NOT NULL CHECK (action IN ('added', 'updated', 'deleted', 'merged')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('film', 'award', 'profile', 'statistic')),
  
  -- Entity identification
  entity_id TEXT,
  entity_title TEXT NOT NULL,
  
  -- Change details
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  
  -- Source and validation
  source TEXT,
  -- Example: 'tmdb', 'multi-source-consensus', 'manual'
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),
  trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100),
  validation_score DECIMAL(3,2) CHECK (validation_score BETWEEN 0 AND 1),
  
  -- Governance flags
  governance_flags TEXT[] DEFAULT ARRAY[]::TEXT[],
  requires_manual_review BOOLEAN DEFAULT FALSE,
  
  -- Consensus details (for multi-source changes)
  consensus_sources JSONB,
  -- Example: {"sources": ["tmdb", "wikipedia", "imdb"], "agreement": 0.95}
  
  -- Change reason/context
  change_reason TEXT,
  -- Example: "Auto-fix: High confidence consensus", "Manual correction", "Duplicate merge"
  
  -- Session tracking
  session_id TEXT,
  script_name TEXT,
  -- Example: "validate-actor-complete", "batch-discover-all-smart"
  
  -- Metadata
  created_by TEXT DEFAULT 'system',
  
  -- Partition key for efficient time-series queries
  change_date DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED
);

-- Indexes for enrichment_changes
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_timestamp ON enrichment_changes(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_actor_name ON enrichment_changes(actor_name);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_action ON enrichment_changes(action);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_entity_type ON enrichment_changes(entity_type);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_entity_id ON enrichment_changes(entity_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_session_id ON enrichment_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_change_date ON enrichment_changes(change_date DESC);
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_requires_review ON enrichment_changes(requires_manual_review) 
  WHERE requires_manual_review = TRUE;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_enrichment_changes_actor_date ON enrichment_changes(actor_name, change_date DESC);

-- Partitioning setup (optional, for very large datasets)
-- Note: Uncomment below to enable monthly partitioning for enrichment_changes
-- This is recommended if you expect > 1M change records

-- CREATE TABLE enrichment_changes_template (LIKE enrichment_changes INCLUDING ALL);
-- ALTER TABLE enrichment_changes RENAME TO enrichment_changes_old;
-- ALTER TABLE enrichment_changes_template RENAME TO enrichment_changes;
-- 
-- CREATE TABLE enrichment_changes_2026_01 PARTITION OF enrichment_changes
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
-- CREATE TABLE enrichment_changes_2026_02 PARTITION OF enrichment_changes
--   FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- -- Add more partitions as needed

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- View: Recent changes summary
CREATE OR REPLACE VIEW recent_enrichment_changes AS
SELECT 
  actor_name,
  action,
  entity_type,
  COUNT(*) as change_count,
  AVG(confidence) as avg_confidence,
  AVG(trust_score) as avg_trust_score,
  MAX(timestamp) as last_change,
  COUNT(*) FILTER (WHERE requires_manual_review) as manual_review_count
FROM enrichment_changes
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY actor_name, action, entity_type
ORDER BY last_change DESC;

-- View: Actor profile completeness
CREATE OR REPLACE VIEW actor_profile_completeness AS
SELECT 
  name,
  slug,
  CASE 
    WHEN biography_en IS NOT NULL THEN 1 ELSE 0 
  END +
  CASE 
    WHEN biography_te IS NOT NULL THEN 1 ELSE 0 
  END +
  CASE 
    WHEN birth_date IS NOT NULL THEN 1 ELSE 0 
  END +
  CASE 
    WHEN debut_year IS NOT NULL THEN 1 ELSE 0 
  END +
  CASE 
    WHEN profile_image_url IS NOT NULL THEN 1 ELSE 0 
  END +
  CASE 
    WHEN total_films IS NOT NULL AND total_films > 0 THEN 1 ELSE 0 
  END +
  CASE 
    WHEN awards_count > 0 THEN 1 ELSE 0 
  END AS fields_filled,
  ROUND(
    (CASE WHEN biography_en IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN biography_te IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN birth_date IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN debut_year IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN profile_image_url IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN total_films IS NOT NULL AND total_films > 0 THEN 1 ELSE 0 END +
     CASE WHEN awards_count > 0 THEN 1 ELSE 0 END) * 100.0 / 7, 
    2
  ) AS completeness_percentage,
  trust_score,
  confidence_tier,
  last_verified_at
FROM actor_profiles
ORDER BY completeness_percentage DESC, trust_score DESC;

-- View: Awards statistics by actor
CREATE OR REPLACE VIEW actor_awards_statistics AS
SELECT 
  actor_name,
  COUNT(*) as total_awards,
  COUNT(*) FILTER (WHERE result = 'won') as awards_won,
  COUNT(*) FILTER (WHERE result = 'nominated') as nominations,
  COUNT(DISTINCT award_name) as unique_awards,
  COUNT(DISTINCT year) as years_awarded,
  MIN(year) as first_award_year,
  MAX(year) as latest_award_year,
  AVG(confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE is_disputed) as disputed_count,
  COUNT(*) FILTER (WHERE award_tier = 'national') as national_awards,
  COUNT(*) FILTER (WHERE award_tier = 'international') as international_awards
FROM actor_awards
GROUP BY actor_name
ORDER BY total_awards DESC;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function: Get actor profile with statistics
CREATE OR REPLACE FUNCTION get_actor_profile_with_stats(actor_name_param TEXT)
RETURNS TABLE (
  profile JSONB,
  awards JSONB,
  recent_changes JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    row_to_json(ap.*)::jsonb as profile,
    COALESCE(
      (SELECT jsonb_agg(row_to_json(aa.*))
       FROM actor_awards aa
       WHERE aa.actor_name = actor_name_param),
      '[]'::jsonb
    ) as awards,
    COALESCE(
      (SELECT jsonb_agg(row_to_json(ec.*))
       FROM enrichment_changes ec
       WHERE ec.actor_name = actor_name_param
       AND ec.timestamp >= NOW() - INTERVAL '30 days'
       ORDER BY ec.timestamp DESC
       LIMIT 100),
      '[]'::jsonb
    ) as recent_changes
  FROM actor_profiles ap
  WHERE ap.name = actor_name_param;
END;
$$ LANGUAGE plpgsql;

-- Function: Log enrichment change
CREATE OR REPLACE FUNCTION log_enrichment_change(
  p_actor_name TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_entity_title TEXT,
  p_field_changed TEXT DEFAULT NULL,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_confidence DECIMAL DEFAULT NULL,
  p_trust_score INTEGER DEFAULT NULL,
  p_change_reason TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_change_id UUID;
BEGIN
  INSERT INTO enrichment_changes (
    actor_name,
    action,
    entity_type,
    entity_id,
    entity_title,
    field_changed,
    old_value,
    new_value,
    source,
    confidence,
    trust_score,
    change_reason,
    session_id
  ) VALUES (
    p_actor_name,
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_title,
    p_field_changed,
    p_old_value,
    p_new_value,
    p_source,
    p_confidence,
    p_trust_score,
    p_change_reason,
    p_session_id
  ) RETURNING id INTO v_change_id;
  
  RETURN v_change_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE DATA (FOR TESTING - REMOVE IN PRODUCTION)
-- =============================================================================

-- Uncomment below to insert sample data for testing

/*
-- Sample actor profile
INSERT INTO actor_profiles (
  name, slug, biography_en, birth_date, debut_year, debut_film,
  profile_image_url, trust_score, confidence_tier, data_confidence
) VALUES (
  'Sample Actor',
  'sample-actor',
  'A sample actor biography for testing purposes.',
  '1980-01-01',
  2000,
  'Debut Film',
  'https://example.com/profile.jpg',
  85,
  'high',
  0.85
);

-- Sample award
INSERT INTO actor_awards (
  actor_name, award_name, category, year, film_title, result, source, confidence
) VALUES (
  'Sample Actor',
  'Filmfare Award',
  'Best Actor',
  2020,
  'Sample Film',
  'won',
  'wikipedia',
  0.90
);

-- Sample enrichment change
INSERT INTO enrichment_changes (
  actor_name, action, entity_type, entity_id, entity_title,
  source, confidence, trust_score, change_reason
) VALUES (
  'Sample Actor',
  'added',
  'profile',
  gen_random_uuid()::text,
  'Sample Actor',
  'wikipedia',
  0.85,
  85,
  'Initial profile creation'
);
*/

-- =============================================================================
-- GRANTS (Adjust based on your security requirements)
-- =============================================================================

-- Grant SELECT to authenticated users (adjust role name as needed)
-- GRANT SELECT ON actor_profiles TO authenticated;
-- GRANT SELECT ON actor_awards TO authenticated;
-- GRANT SELECT ON enrichment_changes TO authenticated;

-- Grant INSERT, UPDATE, DELETE to service role (for enrichment scripts)
-- GRANT ALL ON actor_profiles TO service_role;
-- GRANT ALL ON actor_awards TO service_role;
-- GRANT ALL ON enrichment_changes TO service_role;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE actor_profiles IS 'Stores actor biographical data, career statistics, and profile information with governance integration';
COMMENT ON TABLE actor_awards IS 'Stores structured awards data for actors with confidence tracking and source attribution';
COMMENT ON TABLE enrichment_changes IS 'Audit trail for all enrichment operations with validation and governance tracking';

COMMENT ON COLUMN actor_profiles.career_highlights IS 'JSONB array of significant career events and milestones';
COMMENT ON COLUMN actor_profiles.trust_score IS 'Governance trust score (0-100) computed from multi-factor analysis';
COMMENT ON COLUMN actor_profiles.confidence_tier IS 'Confidence classification: verified, high, medium, low, unverified';

COMMENT ON COLUMN actor_awards.confidence IS 'Source confidence score (0-1) based on data quality and validation';
COMMENT ON COLUMN actor_awards.is_disputed IS 'Flag indicating if award information is disputed or conflicting';

COMMENT ON COLUMN enrichment_changes.consensus_sources IS 'JSONB object containing sources and agreement scores for multi-source changes';
COMMENT ON COLUMN enrichment_changes.session_id IS 'Links changes to specific enrichment session for batch tracking';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Migration complete. Created tables:';
  RAISE NOTICE '  - actor_profiles';
  RAISE NOTICE '  - actor_awards';
  RAISE NOTICE '  - enrichment_changes';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - recent_enrichment_changes';
  RAISE NOTICE '  - actor_profile_completeness';
  RAISE NOTICE '  - actor_awards_statistics';
  RAISE NOTICE 'Created functions:';
  RAISE NOTICE '  - get_actor_profile_with_stats()';
  RAISE NOTICE '  - log_enrichment_change()';
END $$;
