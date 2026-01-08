/**
 * Content Classification Types
 * 
 * Types for content categorization, sensitivity, and audience ratings.
 * Used for family-safe mode and content filtering.
 */

import { z } from 'zod';

// ============================================================
// CONTENT CATEGORY
// ============================================================

/**
 * Primary content category
 */
export type ContentCategory = 
  | 'feature'      // Full-length feature film
  | 'short'        // Short film
  | 'documentary'  // Documentary
  | 'web_film'     // Web series/OTT original
  | 'concert'      // Concert/musical film
  | 'anthology'    // Anthology film
  | 'tv_movie'     // Made-for-TV movie
  | 'animation';   // Animated film

export const ContentCategorySchema = z.enum([
  'feature',
  'short', 
  'documentary',
  'web_film',
  'concert',
  'anthology',
  'tv_movie',
  'animation',
]);

// ============================================================
// SENSITIVITY LEVELS
// ============================================================

export type SensitivityLevel = 'none' | 'mild' | 'moderate' | 'intense' | 'explicit';

export const SensitivityLevelSchema = z.enum(['none', 'mild', 'moderate', 'intense', 'explicit']);

/**
 * Sensitivity flags for different content types
 */
export interface SensitivityFlags {
  violence: SensitivityLevel;
  substances: SensitivityLevel;  // Alcohol, drugs, smoking
  language: SensitivityLevel;    // Profanity, slurs
  sexual: SensitivityLevel;      // Sexual content
  themes: SensitivityLevel;      // Dark/mature themes
  horror: SensitivityLevel;      // Scary/horror elements
  gambling: SensitivityLevel;    // Gambling content
}

export const SensitivityFlagsSchema = z.object({
  violence: SensitivityLevelSchema,
  substances: SensitivityLevelSchema,
  language: SensitivityLevelSchema,
  sexual: SensitivityLevelSchema,
  themes: SensitivityLevelSchema,
  horror: SensitivityLevelSchema,
  gambling: SensitivityLevelSchema,
});

// ============================================================
// AUDIENCE RATING
// ============================================================

/**
 * CBFC-style audience rating
 */
export type AudienceRating = 
  | 'U'     // Universal - suitable for all ages
  | 'U/A'   // Parental guidance for children below 12
  | 'A'     // Adults only (18+)
  | 'S';    // Restricted to special classes

export const AudienceRatingSchema = z.enum(['U', 'U/A', 'A', 'S']);

// ============================================================
// CONTENT WARNINGS
// ============================================================

/**
 * Specific content warnings
 */
export type ContentWarning =
  | 'violence_graphic'
  | 'violence_domestic'
  | 'violence_sexual'
  | 'death_suicide'
  | 'death_murder'
  | 'drug_use'
  | 'alcohol_abuse'
  | 'smoking'
  | 'sexual_content'
  | 'nudity'
  | 'strong_language'
  | 'discrimination'
  | 'animal_cruelty'
  | 'child_endangerment'
  | 'mental_health'
  | 'eating_disorders'
  | 'flashing_lights'
  | 'loud_sounds';

export const ContentWarningSchema = z.enum([
  'violence_graphic',
  'violence_domestic',
  'violence_sexual',
  'death_suicide',
  'death_murder',
  'drug_use',
  'alcohol_abuse',
  'smoking',
  'sexual_content',
  'nudity',
  'strong_language',
  'discrimination',
  'animal_cruelty',
  'child_endangerment',
  'mental_health',
  'eating_disorders',
  'flashing_lights',
  'loud_sounds',
]);

// ============================================================
// COMPLETE CONTENT PROFILE
// ============================================================

/**
 * Complete content profile for a movie
 */
export interface ContentProfile {
  // Category
  category: ContentCategory;
  
  // Sensitivity breakdown
  sensitivity: SensitivityFlags;
  
  // Audience rating
  audienceRating: AudienceRating;
  
  // Specific warnings
  warnings: ContentWarning[];
  
  // Quick flags
  isAdult: boolean;
  isFamilySafe: boolean;
  requiresWarning: boolean;
  
  // Age recommendation
  minimumAge: number;
  
  // Classification metadata
  classifiedAt: string;
  classifiedBy: 'auto' | 'admin' | string;
  confidence: number;
}

export const ContentProfileSchema = z.object({
  category: ContentCategorySchema,
  sensitivity: SensitivityFlagsSchema,
  audienceRating: AudienceRatingSchema,
  warnings: z.array(ContentWarningSchema),
  isAdult: z.boolean(),
  isFamilySafe: z.boolean(),
  requiresWarning: z.boolean(),
  minimumAge: z.number().min(0).max(21),
  classifiedAt: z.string().datetime(),
  classifiedBy: z.string(),
  confidence: z.number().min(0).max(1),
});

// ============================================================
// DEFAULT PROFILES
// ============================================================

/**
 * Default family-safe profile
 */
export const DEFAULT_FAMILY_SAFE_PROFILE: ContentProfile = {
  category: 'feature',
  sensitivity: {
    violence: 'none',
    substances: 'none',
    language: 'none',
    sexual: 'none',
    themes: 'none',
    horror: 'none',
    gambling: 'none',
  },
  audienceRating: 'U',
  warnings: [],
  isAdult: false,
  isFamilySafe: true,
  requiresWarning: false,
  minimumAge: 0,
  classifiedAt: new Date().toISOString(),
  classifiedBy: 'auto',
  confidence: 0.5,
};

/**
 * Default adult profile
 */
export const DEFAULT_ADULT_PROFILE: ContentProfile = {
  category: 'feature',
  sensitivity: {
    violence: 'moderate',
    substances: 'moderate',
    language: 'moderate',
    sexual: 'moderate',
    themes: 'moderate',
    horror: 'none',
    gambling: 'none',
  },
  audienceRating: 'A',
  warnings: [],
  isAdult: true,
  isFamilySafe: false,
  requiresWarning: true,
  minimumAge: 18,
  classifiedAt: new Date().toISOString(),
  classifiedBy: 'auto',
  confidence: 0.5,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Determine if profile allows family-safe viewing
 */
export function isFamilySafeProfile(profile: ContentProfile): boolean {
  if (profile.isAdult) return false;
  if (profile.audienceRating === 'A' || profile.audienceRating === 'S') return false;
  
  // Check sensitivity levels
  const sensitivityValues = Object.values(profile.sensitivity);
  const hasHighSensitivity = sensitivityValues.some(
    v => v === 'intense' || v === 'explicit'
  );
  
  return !hasHighSensitivity;
}

/**
 * Get minimum age from profile
 */
export function getMinimumAge(profile: ContentProfile): number {
  switch (profile.audienceRating) {
    case 'U': return 0;
    case 'U/A': return 12;
    case 'A': return 18;
    case 'S': return 21;
    default: return profile.minimumAge;
  }
}

/**
 * Get display label for audience rating
 */
export function getAudienceRatingLabel(rating: AudienceRating): string {
  switch (rating) {
    case 'U': return 'Universal';
    case 'U/A': return 'Parental Guidance (12+)';
    case 'A': return 'Adults Only (18+)';
    case 'S': return 'Restricted';
    default: return 'Unknown';
  }
}

/**
 * Get color for audience rating badge
 */
export function getAudienceRatingColor(rating: AudienceRating): string {
  switch (rating) {
    case 'U': return 'green';
    case 'U/A': return 'yellow';
    case 'A': return 'red';
    case 'S': return 'purple';
    default: return 'gray';
  }
}

/**
 * Get warning message for profile
 */
export function getWarningMessage(profile: ContentProfile): string | null {
  if (!profile.requiresWarning) return null;
  
  const warnings: string[] = [];
  
  if (profile.sensitivity.violence === 'intense' || profile.sensitivity.violence === 'explicit') {
    warnings.push('graphic violence');
  }
  if (profile.sensitivity.sexual === 'moderate' || profile.sensitivity.sexual === 'intense') {
    warnings.push('sexual content');
  }
  if (profile.sensitivity.substances === 'intense') {
    warnings.push('drug/alcohol use');
  }
  if (profile.sensitivity.themes === 'intense') {
    warnings.push('mature themes');
  }
  
  if (warnings.length === 0) return null;
  
  return `This content contains ${warnings.join(', ')}.`;
}

