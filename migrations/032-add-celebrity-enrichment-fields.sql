-- ============================================================
-- MIGRATION 032: Add Celebrity Enrichment Fields
-- ============================================================
-- Adds new columns to celebrities table for Wikipedia enrichments
-- ============================================================

-- Biography fields
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS full_bio TEXT,
ADD COLUMN IF NOT EXISTS full_bio_te TEXT;

COMMENT ON COLUMN celebrities.full_bio IS 
  'Full English biography from Wikipedia';
COMMENT ON COLUMN celebrities.full_bio_te IS 
  'Full Telugu biography from Wikipedia';

-- Personal details
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
ADD COLUMN IF NOT EXISTS education TEXT,
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS nicknames TEXT[];

COMMENT ON COLUMN celebrities.date_of_birth IS 
  'Birth date (stored as text for flexible formats)';
COMMENT ON COLUMN celebrities.place_of_birth IS 
  'Birthplace';
COMMENT ON COLUMN celebrities.education IS 
  'Educational background';
COMMENT ON COLUMN celebrities.height IS 
  'Height information';
COMMENT ON COLUMN celebrities.nicknames IS 
  'Alternative names and nicknames';

-- Family and relationships
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS family_relationships JSONB DEFAULT '{}';

COMMENT ON COLUMN celebrities.family_relationships IS 
  'Family tree and relationships in JSONB format';

-- Career information
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS known_for TEXT[],
ADD COLUMN IF NOT EXISTS industry_title TEXT,
ADD COLUMN IF NOT EXISTS signature_style TEXT,
ADD COLUMN IF NOT EXISTS brand_pillars TEXT[];

COMMENT ON COLUMN celebrities.known_for IS 
  'Notable works and achievements';
COMMENT ON COLUMN celebrities.industry_title IS 
  'Official title (e.g., Megastar, Young Tiger)';
COMMENT ON COLUMN celebrities.signature_style IS 
  'Acting/career signature style';
COMMENT ON COLUMN celebrities.brand_pillars IS 
  'Key brand attributes';

-- Actor eras
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS actor_eras JSONB DEFAULT '[]';

COMMENT ON COLUMN celebrities.actor_eras IS 
  'Career phases and eras in JSONB array format';

-- Awards
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS awards_count INTEGER DEFAULT 0;

COMMENT ON COLUMN celebrities.awards_count IS 
  'Total count of major awards won';

-- Social media (if not already present)
ALTER TABLE celebrities 
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN celebrities.twitter_url IS 
  'Twitter/X profile URL';
COMMENT ON COLUMN celebrities.instagram_url IS 
  'Instagram profile URL';
COMMENT ON COLUMN celebrities.facebook_url IS 
  'Facebook profile URL';
COMMENT ON COLUMN celebrities.website_url IS 
  'Official website URL';

-- Create indexes for searchable fields
CREATE INDEX IF NOT EXISTS idx_celebrities_full_bio 
  ON celebrities USING GIN (to_tsvector('english', full_bio));

CREATE INDEX IF NOT EXISTS idx_celebrities_known_for 
  ON celebrities USING GIN (known_for);

CREATE INDEX IF NOT EXISTS idx_celebrities_family 
  ON celebrities USING GIN (family_relationships);

CREATE INDEX IF NOT EXISTS idx_celebrities_actor_eras 
  ON celebrities USING GIN (actor_eras);

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Migration 032 completed successfully!';
  RAISE NOTICE '  - Added biography fields (full_bio, full_bio_te)';
  RAISE NOTICE '  - Added personal details (date_of_birth, place_of_birth, education, height, nicknames)';
  RAISE NOTICE '  - Added family_relationships (JSONB)';
  RAISE NOTICE '  - Added career fields (known_for, industry_title, signature_style, brand_pillars)';
  RAISE NOTICE '  - Added actor_eras (JSONB)';
  RAISE NOTICE '  - Added awards_count';
  RAISE NOTICE '  - Added social media URLs';
  RAISE NOTICE '  - Created search indexes';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step:';
  RAISE NOTICE '  Run: npx tsx scripts/apply-celebrity-enrichments.ts';
END $$;
