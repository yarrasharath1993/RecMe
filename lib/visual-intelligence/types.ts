/**
 * VISUAL INTELLIGENCE TYPES
 * 
 * Type definitions for the archival visual tier system.
 * Supports 3-tier visual classification for movie posters.
 * Enhanced with provenance tracking, license types, and source attribution.
 */

// ============================================================
// VISUAL TIER TYPES
// ============================================================

/**
 * Visual source types organized by tier
 * 
 * Tier 1 (Confidence 0.9-1.0): Original posters from verified sources
 * Tier 2 (Confidence 0.6-0.8): Archival materials (stills, ads, etc.)
 * Tier 3 (Confidence 0.3-0.5): Archive cards or placeholders
 */
export type VisualType =
  | 'original_poster'     // Tier 1
  | 'archival_still'      // Tier 2
  | 'magazine_ad'         // Tier 2
  | 'song_book_cover'     // Tier 2
  | 'newspaper_clipping'  // Tier 2
  | 'cassette_cover'      // Tier 2
  | 'studio_photo'        // Tier 2 - NEW
  | 're_release_poster'   // Tier 2 - NEW
  | 'lobby_card'          // Tier 2 - NEW
  | 'press_kit_photo'     // Tier 2 - NEW
  | 'archive_card'        // Tier 3
  | 'placeholder';        // Tier 3

// ============================================================
// ARCHIVAL SOURCE TYPES
// ============================================================

/**
 * Types of archival sources for image provenance
 */
export type ArchivalSourceType =
  | 'government_archive'   // NFAI, state archives
  | 'state_cultural_dept'  // AP/Telangana culture departments
  | 'university'           // Film studies departments
  | 'museum'               // Film Heritage Foundation, museums
  | 'magazine'             // Sitara, Jyothi, Bharati
  | 'newspaper'            // Andhra Patrika, etc.
  | 'book'                 // Cinema history books
  | 'family_archive'       // Actor/director family estates
  | 'film_society'         // Cine clubs
  | 'community'            // Internet Archive, Wikimedia
  | 'private_collection';  // Private collectors

/**
 * License types for archival images
 */
export type LicenseType =
  | 'public_domain'        // No restrictions
  | 'editorial_use'        // For informational/journalistic use
  | 'archive_license'      // Specific license from archive
  | 'attribution_required' // Must credit source
  | 'permission_granted'   // Explicit permission obtained
  | 'fair_use';            // Fair use claim (educational/commentary)

/**
 * Archival source provenance data
 */
export interface ArchivalSource {
  /** Name of the source (e.g., "NFAI", "Andhra Patrika") */
  source_name: string;
  /** Type of source */
  source_type: ArchivalSourceType;
  /** License under which we can use the image */
  license_type: LicenseType;
  /** Attribution text to display */
  attribution_text?: string;
  /** Estimated year of the image */
  year_estimated?: number;
  /** Contact information for the source */
  contact_info?: string;
  /** When the image was acquired */
  acquisition_date?: string;
  /** Who acquired the image */
  acquired_by?: string;
  /** Additional notes about provenance */
  provenance_notes?: string;
  /** Whether the source has been verified */
  is_verified?: boolean;
}

/**
 * Movie archival image entry (for gallery)
 */
export interface MovieArchivalImage {
  id: string;
  movie_id: string;
  image_url: string;
  image_type: VisualType;
  source_name: string;
  source_type: ArchivalSourceType;
  license_type: LicenseType;
  attribution_text?: string;
  year_estimated?: number;
  description?: string;
  is_primary: boolean;
  is_verified: boolean;
  confidence_score: number;
  display_order: number;
  created_at: string;
  created_by?: string;
}

/**
 * Outreach request status
 */
export type OutreachStatus =
  | 'draft'
  | 'sent'
  | 'pending_response'
  | 'responded'
  | 'approved'
  | 'rejected'
  | 'partial_approval'
  | 'negotiating'
  | 'completed'
  | 'cancelled';

/**
 * Outreach request type
 */
export type OutreachRequestType =
  | 'poster_request'
  | 'still_request'
  | 'bulk_collection'
  | 'general_inquiry'
  | 'partnership';

/**
 * Archival outreach record
 */
export interface ArchivalOutreach {
  id: string;
  movie_id?: string;
  movie_title?: string;
  request_type: OutreachRequestType;
  source_type: ArchivalSourceType;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  organization_name?: string;
  status: OutreachStatus;
  created_at: string;
  sent_at?: string;
  response_at?: string;
  completed_at?: string;
  request_notes?: string;
  response_notes?: string;
  license_terms?: string;
  created_by?: string;
}

export type VisualTier = 1 | 2 | 3;

/**
 * Archive reasons for movies without valid posters
 */
export type ArchiveReason =
  | 'pre_poster_era'      // Films from before theatrical poster culture (pre-1950s)
  | 'lost_media'          // Posters existed but are now lost
  | 'no_digital_source'   // Physical posters exist but not digitized
  | 'regional_release';   // Limited regional release without marketing materials

// ============================================================
// ARCHIVE CARD DATA
// ============================================================

/**
 * Data structure for rendering archive reference cards (Tier 3)
 */
export interface ArchiveCardData {
  /** Movie title */
  title: string;
  /** Release year */
  year: number;
  /** Lead actor name (if known) */
  lead_actor?: string;
  /** Production studio (if known) */
  studio?: string;
  /** Reason why no poster is available */
  archive_reason: ArchiveReason;
  /** Whether this limitation has been verified */
  verified_limitation: boolean;
  /** Source of metadata (e.g., 'wikipedia', 'filmography_record') */
  metadata_source?: string;
  /** Optional additional notes */
  notes?: string;
}

// ============================================================
// VISUAL CONFIDENCE
// ============================================================

/**
 * Visual confidence calculation result
 */
export interface VisualConfidenceResult {
  /** Confidence score from 0.0 to 1.0 */
  confidence: number;
  /** Determined visual tier (1, 2, or 3) */
  tier: VisualTier;
  /** Classified visual type */
  visualType: VisualType;
  /** Source of the visual (e.g., 'tmdb', 'wikimedia', 'manual') */
  source: string;
  /** Whether the URL was validated as accessible */
  urlValidated: boolean;
  /** Timestamp of validation */
  validatedAt: Date;
  /** Additional metadata about the visual */
  metadata?: {
    width?: number;
    height?: number;
    aspectRatio?: number;
    format?: string;
  };
}

// ============================================================
// VISUAL AUDIT
// ============================================================

/**
 * Result of a visual audit for a movie
 */
export interface VisualAuditResult {
  movieId: string;
  title: string;
  releaseYear: number;
  currentPosterUrl: string | null;
  currentSource: string | null;
  confidenceResult: VisualConfidenceResult | null;
  archiveCardData: ArchiveCardData | null;
  needsArchiveCard: boolean;
  issues: string[];
}

// ============================================================
// TIER MAPPING
// ============================================================

/**
 * Mapping of visual types to their tiers
 */
export const VISUAL_TYPE_TIERS: Record<VisualType, VisualTier> = {
  original_poster: 1,
  archival_still: 2,
  magazine_ad: 2,
  song_book_cover: 2,
  newspaper_clipping: 2,
  cassette_cover: 2,
  studio_photo: 2,
  re_release_poster: 2,
  lobby_card: 2,
  press_kit_photo: 2,
  archive_card: 3,
  placeholder: 3,
};

/**
 * Mapping of archival source types to their quality tiers
 * Tier 1: Government/Official archives (highest reliability)
 * Tier 2: Publications and community archives
 * Tier 3: Family and private sources (need verification)
 */
export const SOURCE_TYPE_TIERS: Record<ArchivalSourceType, VisualTier> = {
  government_archive: 1,
  state_cultural_dept: 1,
  university: 1,
  museum: 1,
  magazine: 2,
  newspaper: 2,
  book: 2,
  community: 2,
  family_archive: 2,
  film_society: 2,
  private_collection: 3,
};

/**
 * Default confidence scores by source type
 */
export const SOURCE_DEFAULT_CONFIDENCE: Record<ArchivalSourceType, number> = {
  government_archive: 0.9,
  state_cultural_dept: 0.85,
  university: 0.85,
  museum: 0.9,
  magazine: 0.75,
  newspaper: 0.7,
  book: 0.75,
  community: 0.65,
  family_archive: 0.7,
  film_society: 0.7,
  private_collection: 0.55,
};

/**
 * Confidence ranges for each tier
 */
export const TIER_CONFIDENCE_RANGES: Record<VisualTier, { min: number; max: number }> = {
  1: { min: 0.9, max: 1.0 },
  2: { min: 0.6, max: 0.8 },
  3: { min: 0.3, max: 0.5 },
};

/**
 * Verified poster sources that qualify for Tier 1
 */
export const TIER_1_SOURCES = [
  'tmdb',
  'imdb',
  'wikipedia_official',
  'studio_official',
  'verified_archive',
];

/**
 * Archival sources that qualify for Tier 2
 */
export const TIER_2_SOURCES = [
  'wikimedia_commons',
  'internet_archive',
  'film_heritage_foundation',
  'manual_archival',
  'museum_collection',
  'andhra_patrika',
  'sitara_magazine',
  'jyothi_magazine',
  'bharati_magazine',
  'cinema_rangam',
  'family_estate',
  'film_society',
];

/**
 * Display labels for visual types
 */
export const VISUAL_TYPE_LABELS: Record<VisualType, string> = {
  original_poster: 'Original Poster',
  archival_still: 'Film Still',
  magazine_ad: 'Magazine Advertisement',
  song_book_cover: 'Song Book Cover',
  newspaper_clipping: 'Newspaper Clipping',
  cassette_cover: 'Cassette Cover',
  studio_photo: 'Studio Publicity Photo',
  re_release_poster: 'Re-release Poster',
  lobby_card: 'Lobby Card',
  press_kit_photo: 'Press Kit Photo',
  archive_card: 'Archive Reference Card',
  placeholder: 'Placeholder',
};

/**
 * Display labels for archival source types
 */
export const SOURCE_TYPE_LABELS: Record<ArchivalSourceType, string> = {
  government_archive: 'Government Archive',
  state_cultural_dept: 'State Cultural Department',
  university: 'University Collection',
  museum: 'Museum / Foundation',
  magazine: 'Film Magazine',
  newspaper: 'Newspaper Archive',
  book: 'Book / Publication',
  community: 'Community Archive',
  family_archive: 'Family Estate',
  film_society: 'Film Society',
  private_collection: 'Private Collection',
};

/**
 * Display labels for license types
 */
export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  public_domain: 'Public Domain',
  editorial_use: 'Editorial Use',
  archive_license: 'Archive License',
  attribution_required: 'Attribution Required',
  permission_granted: 'Permission Granted',
  fair_use: 'Fair Use',
};

