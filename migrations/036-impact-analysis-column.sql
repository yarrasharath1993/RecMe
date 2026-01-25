-- Migration: Add impact_analysis column for Movie Impact & Intelligence System
-- Created: 2026-01-15
-- Purpose: Store comprehensive movie impact analysis data

-- Add impact_analysis column to movies table
ALTER TABLE movies ADD COLUMN IF NOT EXISTS impact_analysis JSONB;

-- Add index for efficient querying of movies with impact analysis
CREATE INDEX IF NOT EXISTS idx_movies_impact_analysis 
ON movies USING GIN (impact_analysis);

-- Add governance_flags column for data quality monitoring
ALTER TABLE movies ADD COLUMN IF NOT EXISTS governance_flags TEXT[] DEFAULT '{}';

-- Add index for governance flags
CREATE INDEX IF NOT EXISTS idx_movies_governance_flags 
ON movies USING GIN (governance_flags);

-- Verify columns exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movies' AND column_name = 'impact_analysis'
    ) THEN
        RAISE EXCEPTION 'impact_analysis column was not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'movies' AND column_name = 'governance_flags'
    ) THEN
        RAISE EXCEPTION 'governance_flags column was not created';
    END IF;
    
    RAISE NOTICE 'Migration 036 completed successfully';
END $$;
