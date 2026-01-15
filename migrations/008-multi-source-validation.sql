-- =====================================================
-- Migration: 008-multi-source-validation.sql
-- Purpose: Add license warning field for multi-source validation
-- Date: January 2026
-- Strategy: ADDITIVE ONLY - no modifications to existing columns
-- =====================================================

-- Add license warning field
-- Stores warnings when license cannot be fully verified
-- Permissive strategy: store with warning rather than blocking
ALTER TABLE movies ADD COLUMN IF NOT EXISTS license_warning TEXT DEFAULT NULL;

-- Add index for querying movies with license warnings
CREATE INDEX IF NOT EXISTS idx_movies_license_warning 
ON movies(license_warning) WHERE license_warning IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN movies.license_warning IS 'License validation warning for permissive storage strategy. Null = verified or no warning.';

-- NOTE: Multi-source validation metadata is stored in existing archival_source JSONB field
-- Structure (extends existing archival_source):
-- {
--   source_name: string,
--   source_type: string,
--   license_type: string,
--   acquisition_date: string,
--   image_url: string,
--   validate_only_confirmed_by: string[],  // NEW: validate-only sources that confirmed
--   multi_source_agreement: number,        // NEW: total agreement count
--   license_verified: boolean              // NEW: license verification status
-- }

-- No additional schema changes needed - reusing existing archival_source JSONB field
