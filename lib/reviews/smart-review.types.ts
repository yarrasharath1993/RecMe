/**
 * SMART REVIEW TYPES
 * 
 * Type definitions for the smart review enrichment system.
 * These fields are derived from existing metadata and review content.
 */

// ============================================================
// LEGACY STATUS
// ============================================================

/**
 * Legacy/cultural status of a movie
 */
export type LegacyStatus =
  | 'cult_classic'    // Small but devoted fanbase, often rediscovered
  | 'forgotten_gem'   // Quality film that didn't get recognition
  | 'landmark'        // Industry-changing or culturally significant
  | 'mainstream'      // Popular and well-known
  | null;             // Not yet classified

// ============================================================
// BEST-OF TAGS
// ============================================================

/**
 * Flags indicating if this is among the best work for key crew
 */
export interface BestOfTags {
  /** Among the lead actor's best performances */
  actor_best: boolean;
  /** Among the director's best work */
  director_best: boolean;
  /** Among the music director's best compositions */
  music_best: boolean;
}

// ============================================================
// SMART REVIEW FIELDS
// ============================================================

/**
 * Structured smart review data derived from metadata
 */
export interface SmartReviewFields {
  /** Reasons to watch this movie (derived from positives) */
  why_to_watch: string[];
  
  /** Reasons someone might want to skip (derived from negatives/warnings) */
  why_to_skip: string[];
  
  /** Critical perspective on the film */
  critics_pov: string | null;
  
  /** General audience perspective */
  audience_pov: string | null;
  
  /** Cultural/historical status of the film */
  legacy_status: LegacyStatus;
  
  /** Suitable moods for watching */
  mood_suitability: string[];
  
  /** Content warnings (violence, gore, language, etc.) */
  content_warnings: string[];
  
  /** Whether this is among the best work for key crew */
  best_of_tags: BestOfTags;
  
  /** Significance of this film in its era */
  era_significance: string | null;
  
  /** Confidence in the derived data (0-1) */
  derivation_confidence: number;
}

// ============================================================
// DERIVATION METADATA
// ============================================================

/**
 * Metadata about how smart review was derived
 */
export interface SmartReviewDerivation {
  /** When the smart review was derived */
  derived_at: string;
  
  /** Version of the derivation algorithm */
  version: string;
  
  /** Sources used for derivation */
  sources_used: string[];
  
  /** Fields that need human verification */
  fields_needing_review: string[];
  
  /** Overall confidence in the derivation */
  overall_confidence: number;
}

// ============================================================
// DERIVATION INPUT
// ============================================================

/**
 * Input data for smart review derivation
 */
export interface SmartReviewDerivationInput {
  /** Movie data */
  movie: {
    id: string;
    title_en: string;
    release_year?: number | null;
    genres?: string[] | null;
    hero?: string | null;
    heroine?: string | null;
    director?: string | null;
    music_director?: string | null;
    certification?: string | null;
    era?: string | null;
    is_blockbuster?: boolean;
    is_classic?: boolean;
    is_cult?: boolean;
    is_underrated?: boolean;
    avg_rating?: number | null;
    verdict?: string | null;
    tags?: string[] | null;
  };
  
  /** Existing review data (if available) */
  review?: {
    overall_rating?: number | null;
    strengths?: string[] | null;
    weaknesses?: string[] | null;
    dimensions?: any;
    audience_signals?: any;
    summary?: string | null;
    verdict?: string | null;
  } | null;
  
  /** Actor filmography stats for best-of comparison */
  actorStats?: {
    totalFilms: number;
    avgRating: number;
    bestRatedFilmId?: string;
  } | null;
  
  /** Director filmography stats for best-of comparison */
  directorStats?: {
    totalFilms: number;
    avgRating: number;
    bestRatedFilmId?: string;
  } | null;
  
  /** Music director filmography stats */
  musicStats?: {
    totalFilms: number;
    avgRating: number;
    bestRatedFilmId?: string;
  } | null;
}

// ============================================================
// CONTENT WARNING TYPES
// ============================================================

/**
 * Standard content warning categories
 */
export type ContentWarningCategory =
  | 'violence'
  | 'gore'
  | 'language'
  | 'sexual_content'
  | 'nudity'
  | 'substance_use'
  | 'frightening_scenes'
  | 'mature_themes'
  | 'discrimination'
  | 'suicide_self_harm';

/**
 * Content warning with severity
 */
export interface ContentWarning {
  category: ContentWarningCategory;
  severity: 'mild' | 'moderate' | 'severe';
  description?: string;
}

// ============================================================
// MOOD MAPPINGS
// ============================================================

/**
 * Standard moods for movie suitability
 */
export type MoodType =
  | 'feel-good'
  | 'intense'
  | 'emotional'
  | 'thought-provoking'
  | 'light-hearted'
  | 'romantic'
  | 'thrilling'
  | 'nostalgic'
  | 'inspirational'
  | 'dark'
  | 'action-packed'
  | 'family-friendly';

// ============================================================
// DEFAULTS
// ============================================================

/**
 * Default empty smart review fields
 */
export const DEFAULT_SMART_REVIEW_FIELDS: SmartReviewFields = {
  why_to_watch: [],
  why_to_skip: [],
  critics_pov: null,
  audience_pov: null,
  legacy_status: null,
  mood_suitability: [],
  content_warnings: [],
  best_of_tags: {
    actor_best: false,
    director_best: false,
    music_best: false,
  },
  era_significance: null,
  derivation_confidence: 0,
};

/**
 * Default best-of tags
 */
export const DEFAULT_BEST_OF_TAGS: BestOfTags = {
  actor_best: false,
  director_best: false,
  music_best: false,
};

