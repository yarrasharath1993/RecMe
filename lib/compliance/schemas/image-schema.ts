/**
 * Image Validation Schema
 * 
 * Zod schemas for validating image metadata and URLs.
 * Ensures proper licensing and safe image sources.
 */

import { z } from 'zod';

// ============================================================
// ALLOWED DOMAINS
// ============================================================

/**
 * Allowlisted image domains for security
 */
export const ALLOWED_IMAGE_DOMAINS = [
  'image.tmdb.org',
  'images.tmdb.org',
  'm.media-amazon.com',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'archive.org',
  'ia800.us.archive.org',
  'ia600.us.archive.org',
  'ia902.us.archive.org',
] as const;

// ============================================================
// BASE SCHEMAS
// ============================================================

/**
 * TMDB image configuration
 */
export const TMDBImageConfigSchema = z.object({
  base_url: z.string().url(),
  secure_base_url: z.string().url(),
  backdrop_sizes: z.array(z.string()),
  logo_sizes: z.array(z.string()),
  poster_sizes: z.array(z.string()),
  profile_sizes: z.array(z.string()),
  still_sizes: z.array(z.string()),
});

/**
 * TMDB image object
 */
export const TMDBImageSchema = z.object({
  aspect_ratio: z.number().positive(),
  height: z.number().positive(),
  width: z.number().positive(),
  file_path: z.string(),
  vote_average: z.number().min(0).max(10).optional(),
  vote_count: z.number().min(0).optional(),
  iso_639_1: z.string().nullable().optional(),
});

/**
 * TMDB images response
 */
export const TMDBImagesResponseSchema = z.object({
  id: z.number(),
  backdrops: z.array(TMDBImageSchema).optional(),
  logos: z.array(TMDBImageSchema).optional(),
  posters: z.array(TMDBImageSchema).optional(),
  profiles: z.array(TMDBImageSchema).optional(),
});

// ============================================================
// LICENSED IMAGE SCHEMAS
// ============================================================

/**
 * License types
 */
export const LicenseTypeSchema = z.enum([
  'public_domain',
  'cc0',
  'cc_by',
  'cc_by_sa',
  'cc_by_nc',
  'cc_by_nc_sa',
  'fair_use',
  'api_terms',
  'unknown',
]);

/**
 * Wikimedia Commons image
 */
export const WikimediaImageSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  descriptionurl: z.string().url().optional(),
  descriptionshorturl: z.string().url().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  size: z.number().positive().optional(),
  mime: z.string().optional(),
  extmetadata: z.object({
    License: z.object({ value: z.string() }).optional(),
    LicenseShortName: z.object({ value: z.string() }).optional(),
    Artist: z.object({ value: z.string() }).optional(),
    Credit: z.object({ value: z.string() }).optional(),
    ImageDescription: z.object({ value: z.string() }).optional(),
  }).optional(),
});

// ============================================================
// NORMALIZED SCHEMAS
// ============================================================

/**
 * Normalized image for internal storage
 */
export const NormalizedImageSchema = z.object({
  // URL
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  
  // Dimensions
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  aspectRatio: z.number().positive().optional(),
  
  // Type
  type: z.enum(['poster', 'backdrop', 'profile', 'still', 'logo', 'photo']),
  
  // Source
  source: z.enum(['tmdb', 'imdb', 'wikimedia', 'archive', 'internal', 'unknown']),
  sourceUrl: z.string().url().optional(),
  
  // License
  license: LicenseTypeSchema.optional(),
  attribution: z.string().nullable().optional(),
  
  // Safety
  isSafe: z.boolean().optional(),
  isAdult: z.boolean().optional(),
  
  // Metadata
  language: z.string().optional(),
  rating: z.number().min(0).max(10).optional(),
  
  // Verification
  isVerified: z.boolean().optional(),
  verifiedAt: z.string().datetime().optional(),
});

/**
 * Image set for a movie/celebrity
 */
export const ImageSetSchema = z.object({
  primary: NormalizedImageSchema.optional(),
  posters: z.array(NormalizedImageSchema).optional(),
  backdrops: z.array(NormalizedImageSchema).optional(),
  stills: z.array(NormalizedImageSchema).optional(),
  profiles: z.array(NormalizedImageSchema).optional(),
});

// ============================================================
// TYPES
// ============================================================

export type TMDBImageConfig = z.infer<typeof TMDBImageConfigSchema>;
export type TMDBImage = z.infer<typeof TMDBImageSchema>;
export type TMDBImagesResponse = z.infer<typeof TMDBImagesResponseSchema>;
export type WikimediaImage = z.infer<typeof WikimediaImageSchema>;
export type LicenseType = z.infer<typeof LicenseTypeSchema>;
export type NormalizedImage = z.infer<typeof NormalizedImageSchema>;
export type ImageSet = z.infer<typeof ImageSetSchema>;

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate TMDB images response
 */
export function validateTMDBImages(data: unknown): TMDBImagesResponse {
  return TMDBImagesResponseSchema.parse(data);
}

/**
 * Safe parse TMDB images
 */
export function safeParseTMDBImages(data: unknown) {
  return TMDBImagesResponseSchema.safeParse(data);
}

/**
 * Validate normalized image
 */
export function validateNormalizedImage(data: unknown): NormalizedImage {
  return NormalizedImageSchema.parse(data);
}

/**
 * Check if URL is from allowed domain
 */
export function isAllowedImageDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Build TMDB image URL
 */
export function buildTMDBImageUrl(
  path: string | null | undefined,
  size: 'original' | 'w500' | 'w780' | 'w185' | 'w342' = 'w500'
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

/**
 * Get best poster from set
 */
export function getBestPoster(images: TMDBImage[]): TMDBImage | undefined {
  return images
    .filter(img => !img.iso_639_1 || img.iso_639_1 === 'en' || img.iso_639_1 === 'te')
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    [0];
}

/**
 * Get best backdrop from set
 */
export function getBestBackdrop(images: TMDBImage[]): TMDBImage | undefined {
  return images
    .filter(img => !img.iso_639_1) // No text overlays
    .sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
    [0];
}

/**
 * Determine license from Wikimedia metadata
 */
export function parseLicenseFromWikimedia(image: WikimediaImage): LicenseType {
  const licenseValue = image.extmetadata?.LicenseShortName?.value?.toLowerCase() ?? '';
  
  if (licenseValue.includes('public domain') || licenseValue.includes('pd')) {
    return 'public_domain';
  }
  if (licenseValue.includes('cc0')) return 'cc0';
  if (licenseValue.includes('cc-by-nc-sa') || licenseValue.includes('cc by-nc-sa')) return 'cc_by_nc_sa';
  if (licenseValue.includes('cc-by-nc') || licenseValue.includes('cc by-nc')) return 'cc_by_nc';
  if (licenseValue.includes('cc-by-sa') || licenseValue.includes('cc by-sa')) return 'cc_by_sa';
  if (licenseValue.includes('cc-by') || licenseValue.includes('cc by')) return 'cc_by';
  
  return 'unknown';
}

