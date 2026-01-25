-- ============================================================
-- MIGRATION 028: Entity Page Enhancement Columns
-- ============================================================
-- Adds rich entity page fields to celebrities table for:
-- - Industry identity (title, USP, brand pillars)
-- - Family relationships (dynasty graph)
-- - On-screen pairings (chemistry data)
-- - Actor-specific career eras
-- - Fan culture and trivia
-- - Integrity rules (what NOT to include)
-- ============================================================

-- Industry identity columns
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS industry_title TEXT;
COMMENT ON COLUMN celebrities.industry_title IS 'Industry title like "The Celluloid Scientist", "Megastar", "Power Star"';

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS usp TEXT;
COMMENT ON COLUMN celebrities.usp IS 'Unique selling point, e.g., "Extreme genre versatility + technical modernism"';

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS brand_pillars JSONB DEFAULT '[]';
COMMENT ON COLUMN celebrities.brand_pillars IS 'Array of key characteristics, e.g., ["Reinvented across decades", "Mass-Class-Devotional versatility"]';

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS legacy_impact TEXT;
COMMENT ON COLUMN celebrities.legacy_impact IS 'Paragraph describing their lasting impact on the industry';

-- Relationship columns
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS family_relationships JSONB DEFAULT '{}';
COMMENT ON COLUMN celebrities.family_relationships IS 'Dynasty graph: {father: {name, slug}, sons: [{name, slug}], spouse: {name, slug}, nephews: [...]}';

ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS romantic_pairings JSONB DEFAULT '[]';
COMMENT ON COLUMN celebrities.romantic_pairings IS 'On-screen chemistry: [{name, slug, count, highlight, films: [...]}]';

-- Career era classification (actor-specific, different from movie era)
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS actor_eras JSONB DEFAULT '[]';
COMMENT ON COLUMN celebrities.actor_eras IS 'Career eras: [{name: "Golden Era", years: "1986-2000", themes: [...], key_films: [...]}]';

-- Integrity rules for data quality
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS integrity_rules JSONB DEFAULT '{}';
COMMENT ON COLUMN celebrities.integrity_rules IS 'Rules for what NOT to include: {exclude_movies: [...], notes: [...], flag_as_antagonist: [...]}';

-- Fan culture and trivia
ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS fan_culture JSONB DEFAULT '{}';
COMMENT ON COLUMN celebrities.fan_culture IS 'Fan engagement data: {fan_identity, cultural_titles: [...], viral_moments: [...], trivia: [...]}';

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_celebrities_industry_title ON celebrities(industry_title)
  WHERE industry_title IS NOT NULL;

-- GIN index for searching within JSONB fields
CREATE INDEX IF NOT EXISTS idx_celebrities_brand_pillars ON celebrities USING GIN (brand_pillars);
CREATE INDEX IF NOT EXISTS idx_celebrities_family_relationships ON celebrities USING GIN (family_relationships);
CREATE INDEX IF NOT EXISTS idx_celebrities_actor_eras ON celebrities USING GIN (actor_eras);

-- ============================================================
-- SAMPLE DATA STRUCTURE (for reference)
-- ============================================================
-- 
-- family_relationships example:
-- {
--   "father": {"name": "Akkineni Nageswara Rao", "slug": "anr", "relation": "Patriarch"},
--   "spouse": {"name": "Amala Akkineni", "slug": "amala-akkineni"},
--   "sons": [
--     {"name": "Naga Chaitanya", "slug": "naga-chaitanya"},
--     {"name": "Akhil Akkineni", "slug": "akhil-akkineni"}
--   ],
--   "nephews": [
--     {"name": "Sumanth", "slug": "sumanth"},
--     {"name": "Sushanth", "slug": "sushanth"}
--   ]
-- }
--
-- romantic_pairings example:
-- [
--   {"name": "Amala Akkineni", "slug": "amala-akkineni", "highlight": "Real-to-reel authenticity", "films": ["Shiva", "Nirnayam"]},
--   {"name": "Ramya Krishnan", "slug": "ramya-krishnan", "highlight": "Most frequent & versatile", "count": 8},
--   {"name": "Tabu", "slug": "tabu", "highlight": "National romantic wave", "films": ["Ninne Pelladata"]}
-- ]
--
-- actor_eras example:
-- [
--   {
--     "name": "Golden Era",
--     "years": "1986-2000",
--     "themes": ["Raw action", "Romance", "Devotion"],
--     "key_films": ["shiva-1989", "geethanjali-1989", "ninne-pelladata-1996", "annamayya-1997"]
--   },
--   {
--     "name": "Experimental Era",
--     "years": "2001-2020",
--     "themes": ["Urban comedy", "Dual roles", "Genre mixing"],
--     "key_films": ["manmadhudu-2002", "soggade-chinni-nayana-2016", "oopiri-2016"]
--   },
--   {
--     "name": "Pan-Indian Era",
--     "years": "2021-2026",
--     "themes": ["Scale", "Grey roles", "Reinvention"],
--     "key_films": ["brahmastra-2022", "naa-saami-ranga-2024", "kuberaa-2025", "coolie-2025"]
--   }
-- ]
--
-- integrity_rules example:
-- {
--   "exclude_movies": ["30-rojullo-preminchadam-ela-2021"],
--   "notes": ["Only promotion, no acting role"],
--   "flag_as_antagonist": ["coolie-2025"],
--   "flag_as_grey_role": ["kuberaa-2025"]
-- }
--
-- fan_culture example:
-- {
--   "fan_identity": "Urban/Class fanbase",
--   "cultural_titles": ["Greeku Veerudu", "King of Romance"],
--   "viral_moments": ["Shiva cycle-chain scene recreation"],
--   "entrepreneurial": ["Annapurna Studios", "ISFT Film School"],
--   "tech_edge": "Automobile Engineering graduate (USA)"
-- }

