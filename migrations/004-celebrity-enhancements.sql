-- =====================================================
-- Celebrity Profile Enhancement Migration
-- Version: 004
-- Description: Add tables for awards, trivia, milestones
-- =====================================================

-- 1. CELEBRITY AWARDS TABLE
CREATE TABLE IF NOT EXISTS celebrity_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID REFERENCES celebrities(id) ON DELETE CASCADE,
  award_name TEXT NOT NULL,
  award_type TEXT CHECK (award_type IN ('national', 'filmfare', 'nandi', 'siima', 'cinemaa', 'other')),
  category TEXT,
  year INTEGER,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  movie_title TEXT,
  is_won BOOLEAN DEFAULT true,
  is_nomination BOOLEAN DEFAULT false,
  source TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for celebrity_awards
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_celebrity ON celebrity_awards(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_year ON celebrity_awards(year DESC);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_type ON celebrity_awards(award_type);

-- 2. CELEBRITY TRIVIA TABLE
CREATE TABLE IF NOT EXISTS celebrity_trivia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID REFERENCES celebrities(id) ON DELETE CASCADE,
  trivia_text TEXT NOT NULL,
  trivia_text_te TEXT,
  category TEXT CHECK (category IN ('personal', 'career', 'fun_fact', 'controversy', 'family', 'education')),
  source_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for celebrity_trivia
CREATE INDEX IF NOT EXISTS idx_celebrity_trivia_celebrity ON celebrity_trivia(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_trivia_category ON celebrity_trivia(category);

-- 3. CELEBRITY MILESTONES TABLE (Rise to Stardom)
CREATE TABLE IF NOT EXISTS celebrity_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID REFERENCES celebrities(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'debut', 'breakthrough', 'peak', 'comeback', 'downfall', 'retirement', 'award', 'record'
  )),
  year INTEGER NOT NULL,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  movie_title TEXT,
  title TEXT NOT NULL,
  title_te TEXT,
  description TEXT,
  description_te TEXT,
  impact_score DECIMAL(3,2) DEFAULT 0.5 CHECK (impact_score >= 0 AND impact_score <= 1),
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for celebrity_milestones
CREATE INDEX IF NOT EXISTS idx_celebrity_milestones_celebrity ON celebrity_milestones(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_milestones_year ON celebrity_milestones(year);
CREATE INDEX IF NOT EXISTS idx_celebrity_milestones_type ON celebrity_milestones(milestone_type);

-- 4. EXTEND CELEBRITIES TABLE WITH NEW COLUMNS
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS full_bio TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS full_bio_te TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS family_details JSONB DEFAULT '{}';
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS net_worth TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS spouse TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS children_count INTEGER;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS known_for TEXT[] DEFAULT '{}';
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS signature_style TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS nicknames TEXT[] DEFAULT '{}';
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS awards_count INTEGER DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS hits_count INTEGER DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS flops_count INTEGER DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS total_movies INTEGER DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS hit_rate DECIMAL(5,2) DEFAULT 0;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS peak_year INTEGER;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS debut_movie TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS breakthrough_movie TEXT;
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS era TEXT CHECK (era IN ('legend', 'golden', 'classic', 'current', 'emerging'));
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS enrichment_status TEXT DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'partial', 'complete'));
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMPTZ;

-- 5. UPDATE TRIGGERS
CREATE OR REPLACE FUNCTION update_celebrity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_celebrity_awards_updated ON celebrity_awards;
CREATE TRIGGER trigger_celebrity_awards_updated
  BEFORE UPDATE ON celebrity_awards
  FOR EACH ROW EXECUTE FUNCTION update_celebrity_updated_at();

DROP TRIGGER IF EXISTS trigger_celebrity_trivia_updated ON celebrity_trivia;
CREATE TRIGGER trigger_celebrity_trivia_updated
  BEFORE UPDATE ON celebrity_trivia
  FOR EACH ROW EXECUTE FUNCTION update_celebrity_updated_at();

DROP TRIGGER IF EXISTS trigger_celebrity_milestones_updated ON celebrity_milestones;
CREATE TRIGGER trigger_celebrity_milestones_updated
  BEFORE UPDATE ON celebrity_milestones
  FOR EACH ROW EXECUTE FUNCTION update_celebrity_updated_at();

-- 6. USEFUL VIEWS

-- Celebrity Profile Summary View
CREATE OR REPLACE VIEW v_celebrity_profile AS
SELECT 
  c.id,
  c.slug,
  c.name_en,
  c.name_te,
  c.gender,
  c.birth_date,
  c.death_date,
  c.birth_place,
  c.occupation,
  c.short_bio,
  c.full_bio,
  c.profile_image,
  c.known_for,
  c.nicknames,
  c.era,
  c.debut_movie,
  c.breakthrough_movie,
  c.peak_year,
  c.total_movies,
  c.hits_count,
  c.flops_count,
  c.hit_rate,
  c.awards_count,
  c.popularity_score,
  c.tmdb_id,
  c.imdb_id,
  c.wikidata_id,
  c.wikipedia_url,
  c.enrichment_status,
  (SELECT COUNT(*) FROM celebrity_awards ca WHERE ca.celebrity_id = c.id AND ca.is_won = true) as total_awards,
  (SELECT COUNT(*) FROM celebrity_trivia ct WHERE ct.celebrity_id = c.id AND ct.is_published = true) as trivia_count,
  (SELECT COUNT(*) FROM celebrity_milestones cm WHERE cm.celebrity_id = c.id AND cm.is_published = true) as milestones_count
FROM celebrities c;

-- Celebrity Awards Summary View
CREATE OR REPLACE VIEW v_celebrity_awards_summary AS
SELECT 
  celebrity_id,
  award_type,
  COUNT(*) FILTER (WHERE is_won = true) as wins,
  COUNT(*) FILTER (WHERE is_nomination = true AND is_won = false) as nominations
FROM celebrity_awards
GROUP BY celebrity_id, award_type;

-- Comments
COMMENT ON TABLE celebrity_awards IS 'Awards won or nominated by celebrities';
COMMENT ON TABLE celebrity_trivia IS 'Interesting facts and trivia about celebrities';
COMMENT ON TABLE celebrity_milestones IS 'Career milestones like debut, breakthrough, peak years';


