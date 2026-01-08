/**
 * Cast/Crew Validation Schema
 * 
 * Zod schemas for validating cast and crew data from external sources.
 */

import { z } from 'zod';

// ============================================================
// BASE SCHEMAS
// ============================================================

/**
 * Person/actor basic info
 */
export const PersonSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  original_name: z.string().optional(),
  gender: z.number().min(0).max(3).optional(), // 0=unknown, 1=female, 2=male, 3=non-binary
  adult: z.boolean().optional(),
  popularity: z.number().optional(),
  profile_path: z.string().nullable().optional(),
  known_for_department: z.string().optional(),
});

/**
 * Cast member (actor in a movie)
 */
export const CastMemberSchema = PersonSchema.extend({
  cast_id: z.number().optional(),
  character: z.string().nullable().optional(),
  credit_id: z.string().optional(),
  order: z.number().optional(),
});

/**
 * Crew member (director, writer, etc.)
 */
export const CrewMemberSchema = PersonSchema.extend({
  credit_id: z.string().optional(),
  department: z.string(),
  job: z.string(),
});

// ============================================================
// CREDITS SCHEMA
// ============================================================

/**
 * Movie credits response from TMDB
 */
export const TMDBCreditsSchema = z.object({
  id: z.number(),
  cast: z.array(CastMemberSchema),
  crew: z.array(CrewMemberSchema),
});

// ============================================================
// PERSON DETAILS
// ============================================================

/**
 * Extended person details from TMDB
 */
export const PersonDetailsSchema = PersonSchema.extend({
  // Bio
  biography: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  deathday: z.string().nullable().optional(),
  place_of_birth: z.string().nullable().optional(),
  
  // IDs
  imdb_id: z.string().nullable().optional(),
  
  // Aliases
  also_known_as: z.array(z.string()).optional(),
  
  // Homepage
  homepage: z.string().url().nullable().optional(),
});

// ============================================================
// NORMALIZED SCHEMAS
// ============================================================

/**
 * Normalized cast member for internal storage
 */
export const NormalizedCastSchema = z.object({
  // Identity
  tmdb_id: z.number().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  
  // Role
  role: z.enum(['hero', 'heroine', 'supporting', 'cameo', 'guest']).optional(),
  character_name: z.string().nullable().optional(),
  billing_order: z.number().optional(),
  
  // Profile
  profile_image: z.string().url().nullable().optional(),
  
  // Verification
  is_verified: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
});

/**
 * Normalized crew member for internal storage
 */
export const NormalizedCrewSchema = z.object({
  // Identity
  tmdb_id: z.number().optional(),
  name: z.string().min(1),
  slug: z.string().optional(),
  
  // Role
  department: z.enum([
    'directing',
    'writing',
    'music',
    'cinematography',
    'editing',
    'production',
    'art',
    'sound',
    'costume',
    'makeup',
    'visual_effects',
    'other'
  ]),
  job_title: z.string(),
  
  // Profile
  profile_image: z.string().url().nullable().optional(),
  
  // Verification
  is_verified: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
});

/**
 * Celebrity profile for storage
 */
export const CelebritySchema = z.object({
  // Required
  name: z.string().min(1),
  slug: z.string().min(1),
  
  // IDs
  tmdb_id: z.number().optional(),
  imdb_id: z.string().nullable().optional(),
  
  // Bio
  biography: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  date_of_death: z.string().nullable().optional(),
  place_of_birth: z.string().nullable().optional(),
  
  // Career
  primary_role: z.enum(['actor', 'director', 'writer', 'music_director', 'producer', 'cinematographer', 'other']).optional(),
  known_for: z.array(z.string()).optional(),
  years_active: z.string().nullable().optional(),
  
  // Media
  profile_image: z.string().url().nullable().optional(),
  images: z.array(z.string().url()).optional(),
  
  // Classification
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  nationality: z.string().nullable().optional(),
  
  // Stats
  total_movies: z.number().optional(),
  average_rating: z.number().min(0).max(10).optional(),
  
  // Verification
  is_verified: z.boolean().optional(),
  sources: z.array(z.string()).optional(),
  last_enriched_at: z.string().datetime().optional(),
});

// ============================================================
// TYPES
// ============================================================

export type Person = z.infer<typeof PersonSchema>;
export type CastMember = z.infer<typeof CastMemberSchema>;
export type CrewMember = z.infer<typeof CrewMemberSchema>;
export type TMDBCredits = z.infer<typeof TMDBCreditsSchema>;
export type PersonDetails = z.infer<typeof PersonDetailsSchema>;
export type NormalizedCast = z.infer<typeof NormalizedCastSchema>;
export type NormalizedCrew = z.infer<typeof NormalizedCrewSchema>;
export type Celebrity = z.infer<typeof CelebritySchema>;

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate TMDB credits response
 */
export function validateTMDBCredits(data: unknown): TMDBCredits {
  return TMDBCreditsSchema.parse(data);
}

/**
 * Safe parse TMDB credits
 */
export function safeParseTMDBCredits(data: unknown) {
  return TMDBCreditsSchema.safeParse(data);
}

/**
 * Validate person details
 */
export function validatePersonDetails(data: unknown): PersonDetails {
  return PersonDetailsSchema.parse(data);
}

/**
 * Validate celebrity profile
 */
export function validateCelebrity(data: unknown): Celebrity {
  return CelebritySchema.parse(data);
}

/**
 * Extract director from crew
 */
export function extractDirector(crew: CrewMember[]): CrewMember | undefined {
  return crew.find(c => c.job === 'Director');
}

/**
 * Extract music director from crew
 */
export function extractMusicDirector(crew: CrewMember[]): CrewMember | undefined {
  return crew.find(c => 
    c.job === 'Original Music Composer' || 
    c.job === 'Music Director' ||
    c.job === 'Music'
  );
}

/**
 * Extract writers from crew
 */
export function extractWriters(crew: CrewMember[]): CrewMember[] {
  return crew.filter(c => 
    c.department === 'Writing' || 
    c.job === 'Screenplay' || 
    c.job === 'Writer' ||
    c.job === 'Story'
  );
}

/**
 * Extract lead actors (first 2-3 by billing)
 */
export function extractLeadActors(cast: CastMember[], limit = 3): CastMember[] {
  return cast
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, limit);
}

