-- ============================================================
-- CONTENT PLATFORM EXTENSION MIGRATION
-- ============================================================
-- 
-- This migration extends the posts table to support multiple
-- content sectors and types while preserving all existing data.
--
-- SAFE: All operations are additive with sensible defaults.
-- ============================================================

-- ============================================================
-- PART 1: EXTEND POSTS TABLE
-- ============================================================

-- Content Classification
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'article';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_sector TEXT DEFAULT 'general';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_subsector TEXT;

-- Audience & Sensitivity
ALTER TABLE posts ADD COLUMN IF NOT EXISTS audience_profile TEXT DEFAULT 'general';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sensitivity_level TEXT DEFAULT 'none';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS age_group TEXT;

-- Fact Verification
ALTER TABLE posts ADD COLUMN IF NOT EXISTS fact_confidence_score INT DEFAULT 0 CHECK (fact_confidence_score >= 0 AND fact_confidence_score <= 100);
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_count INT DEFAULT 0;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_refs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft' CHECK (verification_status IN ('draft', 'pending', 'verified', 'locked', 'rejected'));

-- Publishing Workflow
ALTER TABLE posts ADD COLUMN IF NOT EXISTS publish_batch_id UUID;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;

-- Content Labels
ALTER TABLE posts ADD COLUMN IF NOT EXISTS fictional_label BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS historical_period TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS geo_context TEXT;

-- Disclaimer Requirements
ALTER TABLE posts ADD COLUMN IF NOT EXISTS requires_disclaimer BOOLEAN DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS disclaimer_type TEXT;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS disclaimer_text TEXT;

-- ============================================================
-- PART 2: CREATE PUBLISH BATCHES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS publish_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Batch Info
  name TEXT NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  
  -- Stats
  content_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  
  -- Validation
  validation_errors JSONB DEFAULT '[]'::jsonb,
  pre_publish_checks JSONB DEFAULT '{}'::jsonb,
  
  -- Audit
  created_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 3: CREATE SOURCE REFERENCES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to content
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  
  -- Source Info
  source_type TEXT NOT NULL, -- tmdb, wikipedia, news_portal, court_document, etc.
  source_name TEXT NOT NULL,
  source_url TEXT,
  
  -- Verification
  trust_level DECIMAL(3,2) DEFAULT 0.50,
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  
  -- Claim Data
  claim_type TEXT, -- fact, opinion, quote
  claim_text TEXT,
  claim_context TEXT,
  
  -- License
  license_type TEXT,
  attribution_required BOOLEAN DEFAULT false,
  attribution_text TEXT,
  
  -- Timestamps
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 4: CREATE CONTENT DISCLAIMERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS content_disclaimers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Disclaimer Definition
  disclaimer_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  display_text TEXT NOT NULL,
  display_text_te TEXT, -- Telugu version
  
  -- Usage
  applicable_sectors TEXT[] DEFAULT '{}',
  is_mandatory BOOLEAN DEFAULT false,
  
  -- Display
  position TEXT DEFAULT 'top' CHECK (position IN ('top', 'bottom', 'both')),
  style TEXT DEFAULT 'warning', -- info, warning, danger
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_posts_content_sector ON posts(content_sector);
CREATE INDEX IF NOT EXISTS idx_posts_content_type ON posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_audience_profile ON posts(audience_profile);
CREATE INDEX IF NOT EXISTS idx_posts_verification_status ON posts(verification_status);
CREATE INDEX IF NOT EXISTS idx_posts_publish_batch ON posts(publish_batch_id);
CREATE INDEX IF NOT EXISTS idx_posts_fictional ON posts(fictional_label) WHERE fictional_label = true;

CREATE INDEX IF NOT EXISTS idx_publish_batches_status ON publish_batches(status);
CREATE INDEX IF NOT EXISTS idx_publish_batches_scheduled ON publish_batches(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_content_sources_post ON content_sources(post_id);
CREATE INDEX IF NOT EXISTS idx_content_sources_type ON content_sources(source_type);

-- ============================================================
-- PART 6: DEFAULT EXISTING REVIEWS TO SAFE VALUES
-- ============================================================

-- Set existing movie reviews to movies_cinema sector
UPDATE posts 
SET content_sector = 'movies_cinema', 
    content_type = 'review'
WHERE category IN ('movies', 'reviews', 'entertainment')
AND content_sector = 'general';

-- Set existing stories to appropriate sector
UPDATE posts 
SET content_sector = 'stories_narratives', 
    content_type = 'story'
WHERE category IN ('stories', 'life')
AND content_sector = 'general';

-- ============================================================
-- PART 7: INSERT DEFAULT DISCLAIMERS
-- ============================================================

INSERT INTO content_disclaimers (disclaimer_type, display_name, display_text, display_text_te, applicable_sectors, is_mandatory, style)
VALUES
  ('medical', 'Medical Disclaimer', 'This content is for informational purposes only and is not a substitute for professional medical advice. Please consult your healthcare provider.', 'ఈ కంటెంట్ సమాచార ప్రయోజనాల కోసం మాత్రమే. దయచేసి మీ వైద్యుడిని సంప్రదించండి.', ARRAY['pregnancy_wellness'], true, 'warning'),
  ('legal', 'Legal Disclaimer', 'This content is based on publicly available records and documents. Information should be independently verified for legal purposes.', 'ఈ కంటెంట్ బహిరంగంగా అందుబాటులో ఉన్న రికార్డులపై ఆధారపడి ఉంది. చట్టపరమైన ప్రయోజనాల కోసం సమాచారాన్ని స్వతంత్రంగా ధృవీకరించండి.', ARRAY['crime_courts', 'archives_buried'], true, 'info'),
  ('fictional', 'Fictional Content', 'This is a work of fiction or speculation. Any resemblance to actual events or persons is coincidental.', 'ఇది కల్పిత రచన. వాస్తవ సంఘటనలు లేదా వ్యక్తులతో సారూప్యత యాదృచ్ఛికం.', ARRAY['what_if_fiction'], true, 'info'),
  ('sensitive', 'Sensitive Content', 'This content discusses sensitive historical topics and may contain disturbing material.', 'ఈ కంటెంట్ సున్నితమైన చారిత్రక అంశాలను చర్చిస్తుంది మరియు అసహ్యకరమైన విషయాలను కలిగి ఉండవచ్చు.', ARRAY['archives_buried', 'crime_courts'], false, 'warning'),
  ('kids_parental', 'Parental Guidance', 'Parental guidance is recommended for this content.', 'ఈ కంటెంట్ కోసం తల్లిదండ్రుల మార్గదర్శకత్వం సిఫార్సు చేయబడింది.', ARRAY['kids_family'], false, 'info')
ON CONFLICT (disclaimer_type) DO NOTHING;

-- ============================================================
-- PART 8: ADD FOREIGN KEY FOR BATCH
-- ============================================================

ALTER TABLE posts 
ADD CONSTRAINT fk_posts_publish_batch 
FOREIGN KEY (publish_batch_id) 
REFERENCES publish_batches(id) 
ON DELETE SET NULL;

-- Handle if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_posts_publish_batch'
  ) THEN
    ALTER TABLE posts 
    ADD CONSTRAINT fk_posts_publish_batch 
    FOREIGN KEY (publish_batch_id) 
    REFERENCES publish_batches(id) 
    ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

