-- =====================================================
-- TeluguVibes Editorial Authority System
-- Human POV + Zero-Click SEO Schema v1.0
-- =====================================================
-- This schema enables:
-- 1. Human Point of View layer (anti-AI fatigue)
-- 2. Zero-Click SEO optimization (citation tracking)
-- 3. Author entity management
-- 4. Editorial learning from human edits
-- =====================================================

-- =====================================================
-- PART 1: HUMAN POINT OF VIEW SYSTEM
-- =====================================================

-- 1.1 HUMAN POV ENTRIES (Mandatory human perspective)
CREATE TABLE IF NOT EXISTS human_pov (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- The human-written perspective
  pov_text TEXT NOT NULL CHECK (length(pov_text) >= 50), -- Min 2 sentences
  pov_text_te TEXT, -- Telugu version

  -- POV Type
  pov_type TEXT NOT NULL CHECK (pov_type IN (
    'insider_trivia',      -- Behind-the-scenes knowledge
    'cultural_context',    -- Telugu cinema cultural insight
    'opinion_framing',     -- Opinionated but factual perspective
    'industry_relevance',  -- Why this matters in Tollywood
    'historical_context',  -- Connection to past events
    'fan_perspective',     -- What fans are saying
    'expert_analysis'      -- Industry expert viewpoint
  )),

  -- Editor info
  editor_id UUID,
  editor_name TEXT NOT NULL,
  editor_role TEXT DEFAULT 'editor',

  -- Source/verification
  source_type TEXT DEFAULT 'editorial' CHECK (source_type IN (
    'editorial', 'interview', 'press_release', 'social_media', 'industry_source'
  )),
  source_link TEXT,
  is_verified BOOLEAN DEFAULT false,

  -- Placement
  placement TEXT DEFAULT 'after_intro' CHECK (placement IN (
    'before_intro', 'after_intro', 'mid_article', 'before_conclusion', 'sidebar'
  )),

  -- Performance tracking
  impact_score DECIMAL(5,2) DEFAULT 0, -- Calculated from engagement

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id) -- One POV per post
);

-- 1.2 POV PATTERNS (What humans add that AI misses)
CREATE TABLE IF NOT EXISTS pov_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'missing_context',     -- AI missed cultural context
    'wrong_tone',          -- AI tone was off
    'generic_phrasing',    -- AI was too generic
    'factual_addition',    -- Human added facts AI didn't know
    'emotional_hook',      -- Human added emotional element
    'insider_knowledge',   -- Human added industry knowledge
    'local_relevance'      -- Human added local/regional context
  )),

  -- The pattern
  pattern_description TEXT NOT NULL,
  example_before TEXT, -- AI-generated text
  example_after TEXT,  -- Human-edited text

  -- Applicability
  categories TEXT[] DEFAULT '{}',
  entity_types TEXT[] DEFAULT '{}',

  -- Learning
  frequency INTEGER DEFAULT 1,
  confidence DECIMAL(3,2) DEFAULT 0.5,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_applied_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 POV IMPACT METRICS (Does POV improve engagement?)
CREATE TABLE IF NOT EXISTS pov_impact_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  pov_id UUID REFERENCES human_pov(id) ON DELETE SET NULL,

  -- With vs Without POV comparison
  has_pov BOOLEAN DEFAULT false,

  -- Engagement metrics
  bounce_rate DECIMAL(5,2),
  avg_time_on_page DECIMAL(8,2),
  scroll_to_pov_rate DECIMAL(5,2), -- % who scrolled to POV section
  engagement_after_pov DECIMAL(5,2), -- Engagement in section after POV

  -- Comparison to category average
  bounce_vs_category DECIMAL(5,2), -- Difference from category average
  time_vs_category DECIMAL(5,2),

  -- POV-specific
  pov_visible_time DECIMAL(8,2), -- Seconds POV was in viewport
  pov_share_clicks INTEGER DEFAULT 0, -- Shares of POV section

  measured_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id)
);

-- =====================================================
-- PART 2: ZERO-CLICK SEO SYSTEM
-- =====================================================

-- 2.1 CITATION BLOCKS (Quotable answer snippets)
CREATE TABLE IF NOT EXISTS citation_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- The citation-ready content
  question TEXT NOT NULL, -- The question this answers
  question_te TEXT,
  answer TEXT NOT NULL CHECK (length(answer) BETWEEN 40 AND 300), -- 40-60 words optimal
  answer_te TEXT,

  -- Schema.org type
  schema_type TEXT DEFAULT 'Answer' CHECK (schema_type IN (
    'Answer', 'FAQPage', 'HowTo', 'Review', 'Event', 'Person', 'Movie'
  )),

  -- SEO optimization
  target_keywords TEXT[] DEFAULT '{}',
  featured_snippet_optimized BOOLEAN DEFAULT false,
  voice_search_optimized BOOLEAN DEFAULT false,

  -- Tracking
  impressions INTEGER DEFAULT 0,
  citations_detected INTEGER DEFAULT 0, -- Times quoted by AI/search
  click_through_rate DECIMAL(5,4) DEFAULT 0,

  -- Position in article
  position INTEGER DEFAULT 0, -- Order in article
  is_primary BOOLEAN DEFAULT false, -- Main answer for the article

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 SCHEMA PERFORMANCE (Track schema markup success)
CREATE TABLE IF NOT EXISTS schema_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Schema types applied
  schemas_applied TEXT[] DEFAULT '{}', -- ['Article', 'Person', 'Movie']

  -- Rich results
  rich_result_eligible BOOLEAN DEFAULT false,
  rich_result_type TEXT, -- 'FAQ', 'HowTo', 'Review', etc.

  -- Search performance
  search_impressions INTEGER DEFAULT 0,
  search_clicks INTEGER DEFAULT 0,
  avg_position DECIMAL(5,2),

  -- AI citation detection
  ai_overview_citations INTEGER DEFAULT 0,
  gemini_citations INTEGER DEFAULT 0,
  chatgpt_citations INTEGER DEFAULT 0,
  perplexity_citations INTEGER DEFAULT 0,

  -- Last checked
  last_checked_at TIMESTAMPTZ,
  citation_detected_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id)
);

-- 2.3 AUTHOR ENTITIES (Entity-based authorship for E-E-A-T)
CREATE TABLE IF NOT EXISTS author_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name_en TEXT NOT NULL,
  name_te TEXT,
  slug TEXT UNIQUE NOT NULL,

  -- Profile
  bio TEXT,
  bio_te TEXT,
  expertise TEXT[] DEFAULT '{}', -- ['Telugu Cinema', 'Box Office Analysis']
  credentials TEXT,

  -- Links (for schema.org sameAs)
  profile_image TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,

  -- Authority signals
  total_articles INTEGER DEFAULT 0,
  avg_article_performance DECIMAL(5,2) DEFAULT 0,
  citations_earned INTEGER DEFAULT 0,

  -- Schema.org Person data
  schema_data JSONB DEFAULT '{}',

  -- Status
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 POST AUTHORS (Link posts to author entities)
CREATE TABLE IF NOT EXISTS post_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES author_entities(id) ON DELETE CASCADE,

  role TEXT DEFAULT 'author' CHECK (role IN ('author', 'editor', 'contributor', 'reviewer')),
  contribution_type TEXT, -- 'wrote', 'edited', 'fact-checked'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id, author_id)
);

-- =====================================================
-- PART 3: AI LEARNING FROM HUMAN EDITS
-- =====================================================

-- 3.1 EDIT HISTORY (Track what humans change)
CREATE TABLE IF NOT EXISTS ai_edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- What was changed
  field_changed TEXT NOT NULL, -- 'title', 'body', 'hook', 'conclusion'
  original_text TEXT NOT NULL, -- AI-generated
  edited_text TEXT NOT NULL,   -- Human-edited

  -- Analysis
  edit_type TEXT CHECK (edit_type IN (
    'tone_adjustment',
    'factual_correction',
    'context_addition',
    'length_adjustment',
    'cultural_localization',
    'simplification',
    'elaboration',
    'restructure'
  )),

  -- Learning
  change_magnitude DECIMAL(3,2), -- 0-1, how much was changed
  improvement_detected BOOLEAN,

  editor_id UUID,
  editor_note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 ORIGINALITY SCORES (Anti-generic AI content)
CREATE TABLE IF NOT EXISTS originality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Scores (0-100)
  uniqueness_score DECIMAL(5,2), -- How unique vs other content
  insight_score DECIMAL(5,2),    -- Original insights present
  voice_score DECIMAL(5,2),      -- Distinct editorial voice
  local_score DECIMAL(5,2),      -- Telugu/regional specificity

  -- Flags
  is_generic BOOLEAN DEFAULT false,
  generic_phrases_found TEXT[] DEFAULT '{}',
  needs_human_edit BOOLEAN DEFAULT true,

  -- AI-generated vs Human ratio
  ai_content_ratio DECIMAL(3,2), -- 0-1
  human_content_ratio DECIMAL(3,2),

  calculated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id)
);

-- 3.3 PHRASE BLOCKLIST (Generic phrases to avoid)
CREATE TABLE IF NOT EXISTS generic_phrase_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  phrase TEXT NOT NULL UNIQUE,
  phrase_te TEXT,

  reason TEXT, -- Why this is blocked
  alternative TEXT, -- What to use instead
  alternative_te TEXT,

  category TEXT, -- 'overused', 'too_formal', 'clickbait', 'ai_giveaway'
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('warning', 'block', 'auto_replace')),

  times_detected INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 4: EDITORIAL QUALITY GATES
-- =====================================================

-- 4.1 PUBLISH READINESS CHECK
CREATE TABLE IF NOT EXISTS publish_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  -- Mandatory checks
  has_human_pov BOOLEAN DEFAULT false,
  has_citation_block BOOLEAN DEFAULT false,
  has_schema_markup BOOLEAN DEFAULT false,
  has_author_entity BOOLEAN DEFAULT false,

  -- Quality checks
  passed_originality BOOLEAN DEFAULT false,
  passed_factcheck BOOLEAN DEFAULT false,
  passed_seo_check BOOLEAN DEFAULT false,
  passed_readability BOOLEAN DEFAULT false,

  -- Scores
  overall_readiness DECIMAL(5,2) DEFAULT 0,
  missing_requirements TEXT[] DEFAULT '{}',

  -- Approval
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  last_checked_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(post_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Human POV
CREATE INDEX idx_human_pov_post ON human_pov(post_id);
CREATE INDEX idx_human_pov_editor ON human_pov(editor_id);
CREATE INDEX idx_human_pov_type ON human_pov(pov_type);
CREATE INDEX idx_human_pov_impact ON human_pov(impact_score DESC);

-- POV Patterns
CREATE INDEX idx_pov_patterns_type ON pov_patterns(pattern_type);
CREATE INDEX idx_pov_patterns_active ON pov_patterns(is_active) WHERE is_active = true;

-- Citation Blocks
CREATE INDEX idx_citation_blocks_post ON citation_blocks(post_id);
CREATE INDEX idx_citation_blocks_citations ON citation_blocks(citations_detected DESC);
CREATE INDEX idx_citation_blocks_primary ON citation_blocks(post_id) WHERE is_primary = true;

-- Schema Performance
CREATE INDEX idx_schema_performance_post ON schema_performance(post_id);
CREATE INDEX idx_schema_performance_citations ON schema_performance(ai_overview_citations DESC);

-- Author Entities
CREATE INDEX idx_author_entities_slug ON author_entities(slug);
CREATE INDEX idx_author_entities_citations ON author_entities(citations_earned DESC);

-- Edit History
CREATE INDEX idx_ai_edit_history_post ON ai_edit_history(post_id);
CREATE INDEX idx_ai_edit_history_type ON ai_edit_history(edit_type);

-- Originality
CREATE INDEX idx_originality_scores_generic ON originality_scores(is_generic) WHERE is_generic = true;
CREATE INDEX idx_originality_scores_needs_edit ON originality_scores(needs_human_edit) WHERE needs_human_edit = true;

-- Publish Readiness
CREATE INDEX idx_publish_readiness_post ON publish_readiness(post_id);
CREATE INDEX idx_publish_readiness_ready ON publish_readiness(overall_readiness DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Calculate POV impact score
CREATE OR REPLACE FUNCTION calculate_pov_impact(p_post_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_has_pov BOOLEAN;
  v_bounce DECIMAL;
  v_time DECIMAL;
  v_category_bounce DECIMAL;
  v_category_time DECIMAL;
  v_impact DECIMAL;
BEGIN
  -- Check if post has POV
  SELECT EXISTS(SELECT 1 FROM human_pov WHERE post_id = p_post_id) INTO v_has_pov;

  IF NOT v_has_pov THEN RETURN 0; END IF;

  -- Get post metrics
  SELECT bounce_rate, avg_time_on_page INTO v_bounce, v_time
  FROM content_performance WHERE post_id = p_post_id;

  -- Get category averages
  SELECT AVG(cp.bounce_rate), AVG(cp.avg_time_on_page)
  INTO v_category_bounce, v_category_time
  FROM content_performance cp
  JOIN posts p ON p.id = cp.post_id
  WHERE p.category = (SELECT category FROM posts WHERE id = p_post_id);

  -- Calculate impact (lower bounce + higher time = better)
  v_impact := (
    (COALESCE(v_category_bounce, 50) - COALESCE(v_bounce, 50)) * 0.5 +
    (COALESCE(v_time, 0) - COALESCE(v_category_time, 0)) / 10 * 0.5
  );

  -- Update POV impact score
  UPDATE human_pov SET impact_score = v_impact WHERE post_id = p_post_id;

  RETURN v_impact;
END;
$$ LANGUAGE plpgsql;

-- Check publish readiness
CREATE OR REPLACE FUNCTION check_publish_readiness(p_post_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_missing TEXT[] := '{}';
  v_score DECIMAL := 0;
  v_has_pov BOOLEAN;
  v_has_citation BOOLEAN;
  v_has_author BOOLEAN;
  v_originality DECIMAL;
BEGIN
  -- Check POV
  SELECT EXISTS(SELECT 1 FROM human_pov WHERE post_id = p_post_id) INTO v_has_pov;
  IF NOT v_has_pov THEN v_missing := array_append(v_missing, 'human_pov'); ELSE v_score := v_score + 25; END IF;

  -- Check citation block
  SELECT EXISTS(SELECT 1 FROM citation_blocks WHERE post_id = p_post_id AND is_primary = true) INTO v_has_citation;
  IF NOT v_has_citation THEN v_missing := array_append(v_missing, 'citation_block'); ELSE v_score := v_score + 25; END IF;

  -- Check author
  SELECT EXISTS(SELECT 1 FROM post_authors WHERE post_id = p_post_id) INTO v_has_author;
  IF NOT v_has_author THEN v_missing := array_append(v_missing, 'author_entity'); ELSE v_score := v_score + 25; END IF;

  -- Check originality
  SELECT uniqueness_score INTO v_originality FROM originality_scores WHERE post_id = p_post_id;
  IF v_originality IS NULL OR v_originality < 60 THEN
    v_missing := array_append(v_missing, 'originality');
  ELSE
    v_score := v_score + 25;
  END IF;

  -- Upsert readiness record
  INSERT INTO publish_readiness (post_id, has_human_pov, has_citation_block, has_author_entity,
    passed_originality, overall_readiness, missing_requirements, last_checked_at)
  VALUES (p_post_id, v_has_pov, v_has_citation, v_has_author,
    COALESCE(v_originality >= 60, false), v_score, v_missing, NOW())
  ON CONFLICT (post_id) DO UPDATE SET
    has_human_pov = EXCLUDED.has_human_pov,
    has_citation_block = EXCLUDED.has_citation_block,
    has_author_entity = EXCLUDED.has_author_entity,
    passed_originality = EXCLUDED.passed_originality,
    overall_readiness = EXCLUDED.overall_readiness,
    missing_requirements = EXCLUDED.missing_requirements,
    last_checked_at = NOW();

  v_result := jsonb_build_object(
    'ready', v_score >= 75,
    'score', v_score,
    'missing', v_missing
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Learn from human edits
CREATE OR REPLACE FUNCTION record_human_edit(
  p_post_id UUID,
  p_field TEXT,
  p_original TEXT,
  p_edited TEXT,
  p_editor_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_change_magnitude DECIMAL;
  v_edit_type TEXT;
BEGIN
  -- Calculate change magnitude (simple length-based for now)
  v_change_magnitude := 1.0 - (
    GREATEST(length(p_original), length(p_edited)) -
    ABS(length(p_original) - length(p_edited))
  )::DECIMAL / GREATEST(length(p_original), length(p_edited));

  -- Detect edit type (simplified)
  IF length(p_edited) < length(p_original) * 0.7 THEN
    v_edit_type := 'simplification';
  ELSIF length(p_edited) > length(p_original) * 1.3 THEN
    v_edit_type := 'elaboration';
  ELSE
    v_edit_type := 'tone_adjustment';
  END IF;

  -- Record the edit
  INSERT INTO ai_edit_history (post_id, field_changed, original_text, edited_text,
    edit_type, change_magnitude, editor_id)
  VALUES (p_post_id, p_field, p_original, p_edited, v_edit_type, v_change_magnitude, p_editor_id);

  -- Update POV patterns if significant change
  IF v_change_magnitude > 0.3 THEN
    INSERT INTO pov_patterns (pattern_type, pattern_description, example_before, example_after, frequency)
    VALUES (
      CASE
        WHEN v_edit_type = 'elaboration' THEN 'missing_context'
        WHEN v_edit_type = 'simplification' THEN 'generic_phrasing'
        ELSE 'wrong_tone'
      END,
      'Detected from human edit on ' || p_field,
      LEFT(p_original, 500),
      LEFT(p_edited, 500),
      1
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Update author stats
CREATE OR REPLACE FUNCTION update_author_stats()
RETURNS void AS $$
BEGIN
  UPDATE author_entities ae SET
    total_articles = (
      SELECT COUNT(*) FROM post_authors pa
      JOIN posts p ON p.id = pa.post_id
      WHERE pa.author_id = ae.id AND p.status = 'published'
    ),
    avg_article_performance = (
      SELECT AVG(cp.overall_performance)
      FROM post_authors pa
      JOIN content_performance cp ON cp.post_id = pa.post_id
      WHERE pa.author_id = ae.id
    ),
    citations_earned = (
      SELECT COALESCE(SUM(sp.ai_overview_citations), 0)
      FROM post_authors pa
      JOIN schema_performance sp ON sp.post_id = pa.post_id
      WHERE pa.author_id = ae.id
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA: Generic Phrase Blocklist
-- =====================================================

INSERT INTO generic_phrase_blocklist (phrase, reason, alternative, category, severity) VALUES
('In conclusion', 'Overused AI phrase', 'Final thoughts / To summarize', 'ai_giveaway', 'auto_replace'),
('It is worth noting that', 'Filler phrase', 'Notably', 'overused', 'warning'),
('In the realm of', 'Overly formal', 'In Telugu cinema', 'too_formal', 'auto_replace'),
('It goes without saying', 'Empty phrase', '[Remove entirely]', 'overused', 'block'),
('At the end of the day', 'Cliche', 'Ultimately', 'overused', 'warning'),
('Needless to say', 'Redundant', '[Remove entirely]', 'overused', 'block'),
('In this article we will', 'Meta commentary', '[Start directly with content]', 'ai_giveaway', 'block'),
('Let us delve into', 'AI giveaway', '[Start directly]', 'ai_giveaway', 'block'),
('Dive into', 'Overused', 'Explore / Examine', 'overused', 'warning'),
('Game changer', 'Clickbait', 'Significant development', 'clickbait', 'warning'),
('Broke the internet', 'Clickbait', 'Went viral', 'clickbait', 'warning'),
('Mind-blowing', 'Clickbait', 'Remarkable / Impressive', 'clickbait', 'warning')
ON CONFLICT (phrase) DO NOTHING;

-- =====================================================
-- SEED DATA: Default Author Entity
-- =====================================================

INSERT INTO author_entities (name_en, name_te, slug, bio, expertise, is_verified)
VALUES (
  'TeluguVibes Editorial',
  'తెలుగు వైబ్స్ ఎడిటోరియల్',
  'teluguvibes-editorial',
  'The editorial team at TeluguVibes brings you the latest in Telugu entertainment, cinema news, and cultural insights.',
  ARRAY['Telugu Cinema', 'Tollywood News', 'Celebrity Updates', 'Movie Reviews'],
  true
)
ON CONFLICT (slug) DO NOTHING;
