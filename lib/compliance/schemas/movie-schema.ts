/**
 * Movie Validation Schema
 * 
 * Zod schemas for validating movie data from external sources.
 * Ensures data integrity before storage.
 */

import { z } from 'zod';

// ============================================================
// BASE SCHEMAS
// ============================================================

/**
 * Rating from external source
 */
export const ExternalRatingSchema = z.object({
  source: z.string(),
  value: z.union([z.string(), z.number()]),
  normalizedValue: z.number().min(0).max(10).optional(),
});

/**
 * Genre information
 */
export const GenreSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
});

/**
 * Production company
 */
export const ProductionCompanySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  logo_path: z.string().nullable().optional(),
  origin_country: z.string().optional(),
});

/**
 * Spoken language
 */
export const SpokenLanguageSchema = z.object({
  iso_639_1: z.string(),
  name: z.string(),
  english_name: z.string().optional(),
});

// ============================================================
// MAIN MOVIE SCHEMA
// ============================================================

/**
 * Core movie data validated from TMDB
 */
export const TMDBMovieSchema = z.object({
  // Required fields
  id: z.number(),
  title: z.string().min(1),
  
  // Optional fields with defaults
  original_title: z.string().optional(),
  original_language: z.string().optional(),
  overview: z.string().nullable().optional(),
  
  // Release info
  release_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
  status: z.enum(['Released', 'Post Production', 'In Production', 'Planned', 'Canceled', 'Rumored']).optional(),
  
  // Ratings
  vote_average: z.number().min(0).max(10).optional(),
  vote_count: z.number().min(0).optional(),
  popularity: z.number().optional(),
  
  // Media
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  
  // Categorization
  adult: z.boolean().optional(),
  genres: z.array(GenreSchema).optional(),
  genre_ids: z.array(z.number()).optional(),
  
  // Production
  runtime: z.number().nullable().optional(),
  budget: z.number().optional(),
  revenue: z.number().optional(),
  production_companies: z.array(ProductionCompanySchema).optional(),
  production_countries: z.array(z.object({
    iso_3166_1: z.string(),
    name: z.string(),
  })).optional(),
  spoken_languages: z.array(SpokenLanguageSchema).optional(),
  
  // External IDs
  imdb_id: z.string().regex(/^tt\d{7,}$/).nullable().optional(),
  
  // Additional
  tagline: z.string().nullable().optional(),
  homepage: z.string().url().nullable().optional(),
  video: z.boolean().optional(),
});

/**
 * OMDB movie data
 */
export const OMDBMovieSchema = z.object({
  Title: z.string(),
  Year: z.string(),
  Rated: z.string().optional(),
  Released: z.string().optional(),
  Runtime: z.string().optional(),
  Genre: z.string().optional(),
  Director: z.string().optional(),
  Writer: z.string().optional(),
  Actors: z.string().optional(),
  Plot: z.string().optional(),
  Language: z.string().optional(),
  Country: z.string().optional(),
  Awards: z.string().optional(),
  Poster: z.string().optional(),
  Ratings: z.array(z.object({
    Source: z.string(),
    Value: z.string(),
  })).optional(),
  Metascore: z.string().optional(),
  imdbRating: z.string().optional(),
  imdbVotes: z.string().optional(),
  imdbID: z.string().optional(),
  Type: z.string().optional(),
  DVD: z.string().optional(),
  BoxOffice: z.string().optional(),
  Production: z.string().optional(),
  Website: z.string().optional(),
  Response: z.enum(['True', 'False']),
});

/**
 * Internal normalized movie schema
 */
export const NormalizedMovieSchema = z.object({
  // Identifiers
  tmdb_id: z.number().optional(),
  imdb_id: z.string().nullable().optional(),
  
  // Core info
  title: z.string().min(1),
  title_en: z.string().min(1),
  original_title: z.string().optional(),
  slug: z.string().min(1),
  
  // Release
  release_year: z.number().min(1800).max(2100),
  release_date: z.string().nullable().optional(),
  
  // Classification
  language: z.string(),
  genres: z.array(z.string()).optional(),
  
  // Content
  synopsis: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  
  // Ratings
  avg_rating: z.number().min(0).max(10).nullable().optional(),
  imdb_rating: z.number().min(0).max(10).nullable().optional(),
  
  // Media
  poster_url: z.string().url().nullable().optional(),
  poster_path: z.string().nullable().optional(),
  backdrop_path: z.string().nullable().optional(),
  
  // Production
  runtime: z.number().nullable().optional(),
  budget: z.number().nullable().optional(),
  revenue: z.number().nullable().optional(),
  
  // Crew
  director: z.string().nullable().optional(),
  hero: z.string().nullable().optional(),
  heroine: z.string().nullable().optional(),
  music_director: z.string().nullable().optional(),
  producer: z.string().nullable().optional(),
  
  // Status
  is_adult: z.boolean().optional(),
  is_published: z.boolean().optional(),
  
  // Metadata
  sources: z.array(z.string()).optional(),
  confidence_score: z.number().min(0).max(1).optional(),
  last_enriched_at: z.string().datetime().optional(),
});

// ============================================================
// TYPES
// ============================================================

export type TMDBMovie = z.infer<typeof TMDBMovieSchema>;
export type OMDBMovie = z.infer<typeof OMDBMovieSchema>;
export type NormalizedMovie = z.infer<typeof NormalizedMovieSchema>;
export type ExternalRating = z.infer<typeof ExternalRatingSchema>;

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate TMDB movie response
 */
export function validateTMDBMovie(data: unknown): TMDBMovie {
  return TMDBMovieSchema.parse(data);
}

/**
 * Safe parse TMDB movie (returns success/error)
 */
export function safeParseTMDBMovie(data: unknown) {
  return TMDBMovieSchema.safeParse(data);
}

/**
 * Validate OMDB movie response
 */
export function validateOMDBMovie(data: unknown): OMDBMovie {
  return OMDBMovieSchema.parse(data);
}

/**
 * Validate normalized movie data
 */
export function validateNormalizedMovie(data: unknown): NormalizedMovie {
  return NormalizedMovieSchema.parse(data);
}

/**
 * Check if TMDB response is valid
 */
export function isTMDBMovieValid(data: unknown): data is TMDBMovie {
  return TMDBMovieSchema.safeParse(data).success;
}

