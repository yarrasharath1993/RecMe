-- =====================================================
-- QUICK SETUP: Celebrity Awards Table
-- =====================================================
-- Run this in Supabase SQL Editor to create the awards table
-- Then run: npx tsx scripts/add-premium-celebrity-awards.ts
-- =====================================================

-- Create celebrity_awards table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_celebrity ON celebrity_awards(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_year ON celebrity_awards(year DESC);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_type ON celebrity_awards(award_type);

-- Verify table was created
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'celebrity_awards'
ORDER BY ordinal_position;
