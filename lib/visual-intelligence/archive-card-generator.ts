/**
 * ARCHIVE CARD GENERATOR
 * 
 * Generates archive reference card data for movies without valid posters.
 * Archive cards are Tier 3 visuals that provide transparent information
 * about why a poster is unavailable.
 */

import type { ArchiveCardData, ArchiveReason } from './types';
import { determineArchiveReason, needsArchiveCard } from './visual-confidence';

// ============================================================
// TYPES
// ============================================================

interface MovieData {
  id: string;
  title_en: string;
  title_te?: string | null;
  release_year: number | null;
  hero?: string | null;
  director?: string | null;
  poster_url?: string | null;
  poster_source?: string | null;
}

interface GenerationResult {
  movieId: string;
  archiveCardData: ArchiveCardData | null;
  needsCard: boolean;
  reason?: string;
}

// ============================================================
// ARCHIVE REASON DESCRIPTIONS
// ============================================================

const ARCHIVE_REASON_DESCRIPTIONS: Record<ArchiveReason, string> = {
  pre_poster_era: 'This film predates the era of theatrical poster marketing',
  lost_media: 'Original promotional materials for this film have been lost to time',
  no_digital_source: 'Physical posters exist but have not been digitized',
  regional_release: 'This was a limited regional release without standard marketing materials',
};

// ============================================================
// STUDIO DETECTION
// ============================================================

/**
 * Attempt to detect studio from movie data
 * This is a simplified implementation - can be extended with more data sources
 */
function detectStudio(movie: MovieData): string | undefined {
  // This would ideally look up from a database or external source
  // For now, return undefined to be filled manually
  return undefined;
}

/**
 * Determine metadata source for archive card
 */
function determineMetadataSource(movie: MovieData): string {
  // Prioritize sources based on available data
  if (movie.title_te) return 'filmography_record';
  if (movie.director) return 'filmography_record';
  if (movie.hero) return 'filmography_record';
  return 'database_record';
}

// ============================================================
// ARCHIVE CARD GENERATION
// ============================================================

/**
 * Generate archive card data for a single movie
 */
export function generateArchiveCardData(movie: MovieData): ArchiveCardData | null {
  // Check if movie needs an archive card
  if (!needsArchiveCard({
    posterUrl: movie.poster_url,
    posterSource: movie.poster_source,
    releaseYear: movie.release_year,
  })) {
    return null;
  }

  const archiveReason = determineArchiveReason(
    movie.release_year,
    !!movie.poster_url && !movie.poster_url.includes('placeholder')
  );

  return {
    title: movie.title_en,
    year: movie.release_year || 0,
    lead_actor: movie.hero || undefined,
    studio: detectStudio(movie),
    archive_reason: archiveReason,
    verified_limitation: false, // Requires manual verification
    metadata_source: determineMetadataSource(movie),
    notes: ARCHIVE_REASON_DESCRIPTIONS[archiveReason],
  };
}

/**
 * Generate archive card data for multiple movies
 */
export function batchGenerateArchiveCards(movies: MovieData[]): GenerationResult[] {
  return movies.map(movie => {
    const needsCard = needsArchiveCard({
      posterUrl: movie.poster_url,
      posterSource: movie.poster_source,
      releaseYear: movie.release_year,
    });

    if (!needsCard) {
      return {
        movieId: movie.id,
        archiveCardData: null,
        needsCard: false,
        reason: 'Movie has valid poster',
      };
    }

    const archiveCardData = generateArchiveCardData(movie);

    return {
      movieId: movie.id,
      archiveCardData,
      needsCard: true,
      reason: archiveCardData?.archive_reason,
    };
  });
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate archive card data completeness
 */
export function validateArchiveCardData(data: ArchiveCardData): {
  isValid: boolean;
  missingFields: string[];
  completeness: number;
} {
  const requiredFields = ['title', 'year', 'archive_reason'];
  const optionalFields = ['lead_actor', 'studio', 'metadata_source', 'notes'];
  
  const missingRequired = requiredFields.filter(field => {
    const value = data[field as keyof ArchiveCardData];
    return value === undefined || value === null || value === '';
  });
  
  const presentOptional = optionalFields.filter(field => {
    const value = data[field as keyof ArchiveCardData];
    return value !== undefined && value !== null && value !== '';
  });
  
  const totalFields = requiredFields.length + optionalFields.length;
  const presentFields = (requiredFields.length - missingRequired.length) + presentOptional.length;
  const completeness = presentFields / totalFields;
  
  return {
    isValid: missingRequired.length === 0,
    missingFields: missingRequired,
    completeness: Math.round(completeness * 100) / 100,
  };
}

// ============================================================
// SERIALIZATION
// ============================================================

/**
 * Serialize archive card data for database storage
 */
export function serializeArchiveCardData(data: ArchiveCardData): string {
  return JSON.stringify(data);
}

/**
 * Deserialize archive card data from database
 */
export function deserializeArchiveCardData(json: string | object | null): ArchiveCardData | null {
  if (!json) return null;
  
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    
    // Validate required fields
    if (!data.title || !data.archive_reason) {
      return null;
    }
    
    return data as ArchiveCardData;
  } catch {
    return null;
  }
}

// ============================================================
// DISPLAY HELPERS
// ============================================================

/**
 * Get human-readable archive reason
 */
export function getArchiveReasonDisplay(reason: ArchiveReason): string {
  return ARCHIVE_REASON_DESCRIPTIONS[reason] || 'Poster unavailable';
}

/**
 * Get archive card subtitle text
 */
export function getArchiveCardSubtitle(data: ArchiveCardData): string {
  const parts: string[] = [];
  
  if (data.year) parts.push(String(data.year));
  if (data.lead_actor) parts.push(data.lead_actor);
  if (data.studio) parts.push(data.studio);
  
  return parts.join(' • ');
}

/**
 * Get verification status text
 */
export function getVerificationStatus(data: ArchiveCardData): string {
  return data.verified_limitation
    ? 'Verified archival limitation'
    : 'Unverified archival limitation';
}

