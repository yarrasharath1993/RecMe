-- =====================================================
-- Migration: 007-enhance-archival-images.sql
-- Purpose: Enhanced archival image provenance and outreach tracking
-- Date: January 2026
-- Strategy: ADDITIVE ONLY - no modifications to existing columns
-- =====================================================

-- =====================================================
-- PART 1: ARCHIVAL SOURCE PROVENANCE
-- =====================================================

-- Archival source metadata for tracking image provenance
-- Structure:
-- {
--   source_name: "NFAI" | "Andhra Patrika" | "Family Archive" | etc.,
--   source_type: "government_archive" | "magazine" | "newspaper" | "book" | "family" | "film_society" | "university" | "museum",
--   license_type: "public_domain" | "editorial_use" | "archive_license" | "attribution_required" | "permission_granted",
--   attribution_text: "Source: Andhra Patrika (1954 issue)",
--   year_estimated: 1954,
--   contact_info: "nfai@gov.in",
--   acquisition_date: "2026-01-06",
--   acquired_by: "admin",
--   provenance_notes: "Original film still from NFAI collection",
--   is_verified: true
-- }
ALTER TABLE movies ADD COLUMN IF NOT EXISTS archival_source JSONB DEFAULT NULL;

-- Index for querying by source type
CREATE INDEX IF NOT EXISTS idx_movies_archival_source_type 
ON movies ((archival_source->>'source_type'));

-- Index for querying by license type
CREATE INDEX IF NOT EXISTS idx_movies_archival_license_type 
ON movies ((archival_source->>'license_type'));

-- =====================================================
-- PART 2: MULTIPLE ARCHIVAL IMAGES SUPPORT
-- =====================================================

-- For canonical films, support multiple archival images (gallery)
-- This allows storing multiple visuals per movie (release ads, stills, re-release posters)
CREATE TABLE IF NOT EXISTS movie_archival_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  
  -- Image data
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN (
    'original_poster',
    'archival_still',
    'magazine_ad',
    'song_book_cover',
    'newspaper_clipping',
    'cassette_cover',
    'studio_photo',
    're_release_poster',
    'lobby_card',
    'press_kit_photo'
  )),
  
  -- Source provenance
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'government_archive',
    'state_cultural_dept',
    'university',
    'museum',
    'magazine',
    'newspaper',
    'book',
    'family_archive',
    'film_society',
    'community',
    'private_collection'
  )),
  
  -- Licensing
  license_type TEXT NOT NULL CHECK (license_type IN (
    'public_domain',
    'editorial_use',
    'archive_license',
    'attribution_required',
    'permission_granted',
    'fair_use'
  )),
  attribution_text TEXT,
  
  -- Metadata
  year_estimated INTEGER,
  description TEXT,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  confidence_score DECIMAL(3,2) DEFAULT 0.7,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  
  -- Ordering for gallery display
  display_order INTEGER DEFAULT 0
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_movie_archival_images_movie_id 
ON movie_archival_images(movie_id);

CREATE INDEX IF NOT EXISTS idx_movie_archival_images_source_type 
ON movie_archival_images(source_type);

CREATE INDEX IF NOT EXISTS idx_movie_archival_images_is_primary 
ON movie_archival_images(is_primary) WHERE is_primary = true;

-- =====================================================
-- PART 3: OUTREACH TRACKING
-- =====================================================

-- Track outreach efforts to archives, families, film societies
CREATE TABLE IF NOT EXISTS archival_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What we're requesting
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  movie_title TEXT, -- Stored separately in case movie doesn't exist yet
  request_type TEXT NOT NULL CHECK (request_type IN (
    'poster_request',
    'still_request',
    'bulk_collection',
    'general_inquiry',
    'partnership'
  )),
  
  -- Who we're contacting
  source_type TEXT NOT NULL CHECK (source_type IN (
    'nfai',
    'state_archive',
    'university',
    'museum',
    'family_estate',
    'film_society',
    'publisher',
    'private_collector'
  )),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  organization_name TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'sent',
    'pending_response',
    'responded',
    'approved',
    'rejected',
    'partial_approval',
    'negotiating',
    'completed',
    'cancelled'
  )),
  
  -- Timeline
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Details
  request_notes TEXT,
  response_notes TEXT,
  license_terms TEXT,
  attachments JSONB, -- Store file references
  
  -- Audit
  created_by TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_archival_outreach_movie_id 
ON archival_outreach(movie_id);

CREATE INDEX IF NOT EXISTS idx_archival_outreach_status 
ON archival_outreach(status);

CREATE INDEX IF NOT EXISTS idx_archival_outreach_source_type 
ON archival_outreach(source_type);

-- =====================================================
-- PART 4: KNOWN ARCHIVAL SOURCES REFERENCE
-- =====================================================

-- Reference table for known archival sources
CREATE TABLE IF NOT EXISTS archival_source_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source identification
  source_code TEXT UNIQUE NOT NULL, -- e.g., 'nfai', 'andhra_patrika', 'fhf'
  source_name TEXT NOT NULL, -- e.g., 'National Film Archive of India'
  source_type TEXT NOT NULL,
  
  -- Contact info
  website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  
  -- Access details
  access_type TEXT CHECK (access_type IN (
    'open_access',
    'request_required',
    'membership_required',
    'paid_license',
    'partnership_only'
  )),
  typical_license TEXT,
  typical_response_time TEXT, -- e.g., '2-4 weeks'
  
  -- Quality assessment
  quality_tier INTEGER CHECK (quality_tier IN (1, 2, 3)),
  reliability_score DECIMAL(3,2),
  
  -- Notes
  description TEXT,
  special_notes TEXT,
  coverage_period TEXT, -- e.g., '1930s-1970s Telugu films'
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_contacted TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with known sources
INSERT INTO archival_source_registry (source_code, source_name, source_type, quality_tier, access_type, typical_license, description)
VALUES 
  ('nfai', 'National Film Archive of India', 'government_archive', 1, 'request_required', 'archive_license', 'Primary government archive for Indian cinema. Holds film stills, promotional photos, press kits for Telugu classics.'),
  ('ap_culture', 'Andhra Pradesh Culture Department', 'state_cultural_dept', 1, 'request_required', 'public_domain', 'State-funded film materials often under government works.'),
  ('ts_culture', 'Telangana Culture Department', 'state_cultural_dept', 1, 'request_required', 'public_domain', 'State cultural archives for Telangana region films.'),
  ('fhf', 'Film Heritage Foundation', 'museum', 1, 'partnership_only', 'archive_license', 'Preservation-focused organization with high-quality restorations.'),
  ('internet_archive', 'Internet Archive', 'community', 2, 'open_access', 'public_domain', 'Community digital archive with some Telugu film materials.'),
  ('andhra_patrika', 'Andhra Patrika Archives', 'newspaper', 2, 'request_required', 'editorial_use', 'Historical Telugu newspaper with film advertisements.'),
  ('sitara_magazine', 'Sitara Magazine', 'magazine', 2, 'request_required', 'editorial_use', 'Classic Telugu film magazine with stills and features.'),
  ('jyothi_magazine', 'Jyothi Magazine', 'magazine', 2, 'request_required', 'editorial_use', 'Telugu film and entertainment magazine.'),
  ('bharati_magazine', 'Bharati Magazine', 'magazine', 2, 'request_required', 'editorial_use', 'Telugu arts and culture magazine.'),
  ('wikimedia', 'Wikimedia Commons', 'community', 2, 'open_access', 'public_domain', 'Open source image repository with some film materials.')
ON CONFLICT (source_code) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE movie_archival_images IS 'Gallery of archival images for movies - supports multiple images per film';
COMMENT ON TABLE archival_outreach IS 'Track outreach efforts to archives, families, and film societies';
COMMENT ON TABLE archival_source_registry IS 'Reference registry of known archival sources with contact info and quality tiers';
COMMENT ON COLUMN movies.archival_source IS 'Primary archival source metadata for the movie poster/image';

