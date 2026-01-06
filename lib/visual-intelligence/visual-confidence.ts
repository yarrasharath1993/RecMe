/**
 * VISUAL CONFIDENCE CALCULATOR
 * 
 * Calculates visual confidence scores and determines archival tiers
 * for movie posters based on source, URL validity, and visual type.
 * 
 * Tier System:
 * - Tier 1 (0.9-1.0): Original posters from TMDB, IMDB, or verified sources
 * - Tier 2 (0.6-0.8): Archival visuals (stills, magazine ads, etc.)
 * - Tier 3 (0.3-0.5): Archive cards or placeholders
 */

import type {
  VisualType,
  VisualTier,
  VisualConfidenceResult,
  ArchiveCardData,
  ArchiveReason,
} from './types';
import {
  VISUAL_TYPE_TIERS,
  TIER_CONFIDENCE_RANGES,
  TIER_1_SOURCES,
  TIER_2_SOURCES,
} from './types';

// ============================================================
// URL VALIDATION
// ============================================================

/**
 * Check if a URL is a placeholder image
 */
export function isPlaceholderUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  
  const placeholderPatterns = [
    '/images/placeholders/',
    'placehold.it',
    'placeholder.com',
    'via.placeholder.com',
    'dummyimage.com',
    'fakeimg.pl',
  ];
  
  return placeholderPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

/**
 * Check if a URL is from TMDB
 */
export function isTMDBUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('image.tmdb.org') || url.includes('themoviedb.org');
}

/**
 * Check if a URL is from a verified source
 */
export function isVerifiedSource(url: string | null | undefined, source?: string | null): boolean {
  if (!url) return false;
  
  // Check explicit source field
  if (source && TIER_1_SOURCES.includes(source.toLowerCase())) {
    return true;
  }
  
  // Check URL patterns for verified sources
  const verifiedPatterns = [
    'image.tmdb.org',
    'themoviedb.org',
    'm.media-amazon.com',
    'imdb-iu.amazon.com',
    'upload.wikimedia.org',
  ];
  
  return verifiedPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

/**
 * Check if a URL is from an archival source
 */
export function isArchivalSource(url: string | null | undefined, source?: string | null): boolean {
  if (!url) return false;
  
  // Check explicit source field
  if (source && TIER_2_SOURCES.includes(source.toLowerCase())) {
    return true;
  }
  
  // Check URL patterns for archival sources
  const archivalPatterns = [
    'archive.org',
    'commons.wikimedia.org',
    'filmheritagefoundation',
    'nationalfilmarchive',
  ];
  
  return archivalPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// ============================================================
// VISUAL TYPE DETECTION
// ============================================================

/**
 * Detect visual type from URL and source information
 */
export function detectVisualType(
  posterUrl: string | null | undefined,
  posterSource?: string | null,
  releaseYear?: number | null
): VisualType {
  // No URL or placeholder
  if (!posterUrl || isPlaceholderUrl(posterUrl)) {
    return 'placeholder';
  }
  
  // TMDB or verified source = original poster
  if (isTMDBUrl(posterUrl) || isVerifiedSource(posterUrl, posterSource)) {
    return 'original_poster';
  }
  
  // Archival source
  if (isArchivalSource(posterUrl, posterSource)) {
    // Could be archival still or other archival type
    // Default to archival_still, can be refined with more metadata
    return 'archival_still';
  }
  
  // Very old films without TMDB likely need archive cards
  if (releaseYear && releaseYear < 1960 && !isTMDBUrl(posterUrl)) {
    return 'archival_still';
  }
  
  // Default to original poster for other valid URLs
  return 'original_poster';
}

// ============================================================
// CONFIDENCE CALCULATION
// ============================================================

/**
 * Calculate visual confidence score based on tier and source quality
 * 
 * Source confidence scores (aligned with enrich-waterfall.ts):
 * - tmdb: 0.95
 * - wikimedia: 0.85
 * - internet_archive: 0.75
 * - omdb: 0.80
 * - wikidata: 0.80
 * - google: 0.70
 * - letterboxd: 0.65
 * - cinemaazi: 0.60
 * - ai: 0.50
 */
export function calculateConfidenceScore(
  tier: VisualTier,
  source: string,
  urlValid: boolean
): number {
  const range = TIER_CONFIDENCE_RANGES[tier];
  
  if (!urlValid) {
    // Invalid URL gets minimum of tier 3
    return TIER_CONFIDENCE_RANGES[3].min;
  }
  
  // Direct source confidence mapping (for enrichment script sources)
  const SOURCE_CONFIDENCE: Record<string, number> = {
    tmdb: 0.95,
    imdb: 0.90,
    wikimedia: 0.85,
    wikimedia_commons: 0.85,
    internet_archive: 0.75,
    omdb: 0.80,
    wikidata: 0.80,
    google: 0.70,
    letterboxd: 0.65,
    cinemaazi: 0.60,
    ai: 0.50,
    film_heritage_foundation: 0.90,
    nfai: 0.90,
    archive_card: 0.40,
    placeholder: 0.30,
    other: 0.50,
    unknown: 0.40,
  };
  
  // If source has a direct confidence mapping, use it
  if (SOURCE_CONFIDENCE[source] !== undefined) {
    return SOURCE_CONFIDENCE[source];
  }
  
  // Fallback: Calculate within-tier score based on source quality
  let tierScore = 0.5; // Default to middle of range
  
  if (tier === 1) {
    // Tier 1 source quality scoring
    if (TIER_1_SOURCES.includes(source)) tierScore = 0.7;
    else tierScore = 0.5;
  } else if (tier === 2) {
    // Tier 2 source quality scoring
    if (TIER_2_SOURCES.includes(source)) tierScore = 0.7;
    else tierScore = 0.5;
  } else {
    // Tier 3 - archive cards and placeholders
    tierScore = 0.3;
  }
  
  // Map tier score to confidence range
  const confidence = range.min + (range.max - range.min) * tierScore;
  
  // Round to 2 decimal places
  return Math.round(confidence * 100) / 100;
}

/**
 * Get visual tier from visual type
 */
export function getTierFromVisualType(visualType: VisualType): VisualTier {
  return VISUAL_TYPE_TIERS[visualType];
}

/**
 * Determine source identifier from URL
 */
export function getSourceFromUrl(url: string | null | undefined): string {
  if (!url) return 'unknown';
  
  // Tier 1 sources (highest confidence)
  if (url.includes('tmdb.org') || url.includes('themoviedb.org')) return 'tmdb';
  if (url.includes('amazon.com') || url.includes('imdb')) return 'imdb';
  
  // Tier 2 archival sources
  if (url.includes('wikimedia.org') || url.includes('commons.wikimedia')) return 'wikimedia';
  if (url.includes('wikipedia.org')) return 'wikipedia';
  if (url.includes('archive.org')) return 'internet_archive';
  
  // Community and scraper sources
  if (url.includes('letterboxd.com')) return 'letterboxd';
  if (url.includes('cinemaazi.com')) return 'cinemaazi';
  
  // Other databases
  if (url.includes('omdbapi.com')) return 'omdb';
  
  // Placeholders
  if (url.includes('placeholder') || url.includes('placehold')) return 'placeholder';
  
  return 'other';
}

// ============================================================
// MAIN CONFIDENCE CALCULATOR
// ============================================================

/**
 * Calculate full visual confidence result for a movie
 */
export async function calculateVisualConfidence(params: {
  posterUrl: string | null | undefined;
  posterSource?: string | null;
  releaseYear?: number | null;
  validateUrl?: boolean;
}): Promise<VisualConfidenceResult> {
  const { posterUrl, posterSource, releaseYear, validateUrl = false } = params;
  
  // Detect visual type
  const visualType = detectVisualType(posterUrl, posterSource, releaseYear);
  
  // Get tier from visual type
  const tier = getTierFromVisualType(visualType);
  
  // Determine source
  const source = posterSource || getSourceFromUrl(posterUrl);
  
  // URL validation (optional, for server-side use)
  let urlValidated = true;
  if (validateUrl && posterUrl && !isPlaceholderUrl(posterUrl)) {
    try {
      const response = await fetch(posterUrl, { method: 'HEAD' });
      urlValidated = response.ok;
    } catch {
      urlValidated = false;
    }
  }
  
  // Calculate confidence score
  const confidence = calculateConfidenceScore(tier, source, urlValidated);
  
  return {
    confidence,
    tier,
    visualType,
    source,
    urlValidated,
    validatedAt: new Date(),
  };
}

// ============================================================
// BATCH PROCESSING
// ============================================================

/**
 * Calculate visual confidence for multiple movies
 */
export async function batchCalculateVisualConfidence(
  movies: Array<{
    id: string;
    poster_url: string | null;
    poster_source?: string | null;
    release_year?: number | null;
  }>,
  options?: {
    validateUrls?: boolean;
    concurrency?: number;
  }
): Promise<Map<string, VisualConfidenceResult>> {
  const results = new Map<string, VisualConfidenceResult>();
  const { validateUrls = false, concurrency = 10 } = options || {};
  
  // Process in batches for concurrency control
  for (let i = 0; i < movies.length; i += concurrency) {
    const batch = movies.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (movie) => {
        const result = await calculateVisualConfidence({
          posterUrl: movie.poster_url,
          posterSource: movie.poster_source,
          releaseYear: movie.release_year,
          validateUrl: validateUrls,
        });
        return { id: movie.id, result };
      })
    );
    
    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
  }
  
  return results;
}

// ============================================================
// ARCHIVE CARD ELIGIBILITY
// ============================================================

/**
 * Determine archive reason for a movie without a valid poster
 */
export function determineArchiveReason(
  releaseYear: number | null | undefined,
  hasAnyPoster: boolean
): ArchiveReason {
  if (!releaseYear) return 'no_digital_source';
  
  // Pre-1950 films rarely had theatrical poster culture
  if (releaseYear < 1950) return 'pre_poster_era';
  
  // 1950-1970 films often have lost media
  if (releaseYear < 1970) return hasAnyPoster ? 'no_digital_source' : 'lost_media';
  
  // Regional releases or low-budget films
  return 'regional_release';
}

/**
 * Check if a movie needs an archive card
 */
export function needsArchiveCard(params: {
  posterUrl: string | null | undefined;
  posterSource?: string | null;
  releaseYear?: number | null;
}): boolean {
  const { posterUrl, posterSource, releaseYear } = params;
  
  // No poster URL
  if (!posterUrl) return true;
  
  // Placeholder URL
  if (isPlaceholderUrl(posterUrl)) return true;
  
  // Old films without TMDB might benefit from archive cards
  if (releaseYear && releaseYear < 1970 && !isTMDBUrl(posterUrl)) {
    return true;
  }
  
  return false;
}

