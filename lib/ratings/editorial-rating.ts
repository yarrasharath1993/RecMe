/**
 * EDITORIAL RATING SYSTEM
 * 
 * Telugu Portal's hybrid rating system that combines:
 * - Manual editorial overrides
 * - Cross-referenced external ratings (TMDB, IMDb)
 * - Smart rating based on movie attributes
 * - AI-generated dimensional analysis
 * 
 * @see docs/RATING-MODEL.md for full documentation
 */

// Legendary directors - guaranteed minimum 7.0 rating for all their films
export const LEGENDARY_DIRECTORS = [
  'Bapu',
  'K. Viswanath',
  'Dasari Narayana Rao',
  'B. Vittalacharya',
];

// Famous directors eligible for rating boost (+0.5)
export const FAMOUS_DIRECTORS = [
  'S. S. Rajamouli',
  'Ram Gopal Varma',
  'Trivikram Srinivas',
  'Puri Jagannadh',
  'Sukumar',
  'Koratala Siva',
  'Boyapati Srinu',
  'Srikanth Addala',
  'Vamshi Paidipally',
  'K. Raghavendra Rao',
  'B. Gopal',
  'Krishna Vamsi',
  'Shankar',
  'Mani Ratnam',
  'Sekhar Kammula',
  'Nag Ashwin',
  'Sandeep Reddy Vanga',
  'Prashanth Neel',
  // Comedy legends (1985-1995 era)
  'E.V.V. Satyanarayana',
  'EVV Satyanarayana',
  'E. V. V. Satyanarayana',
  'Jandhyala',
  'Relangi Narasimha Rao',
  'Vamsy',
];

// Star actors eligible for rating boost
export const STAR_ACTORS = [
  'NTR',
  'Jr. NTR',
  'Chiranjeevi',
  'Mahesh Babu',
  'Prabhas',
  'Pawan Kalyan',
  'Allu Arjun',
  'Ram Charan',
  'Venkatesh',
  'Nagarjuna',
  'Balakrishna',
  'Nandamuri Taraka Rama Rao',
  'Akkineni Nageswara Rao',
  'Sobhan Babu',
  'Krishna',
  'Mohan Babu',
  'Ravi Teja',
  'Vijay Deverakonda',
  'Nani',
  'Ram Pothineni',
];

// Star actresses for additional context
export const STAR_ACTRESSES = [
  'Savitri',
  'Sridevi',
  'Jayasudha',
  'Jyothika',
  'Samantha',
  'Anushka Shetty',
  'Kajal Aggarwal',
  'Rashmika Mandanna',
  'Pooja Hegde',
];

/**
 * Rating category based on score
 */
export type RatingCategory =
  | 'masterpiece'     // 9.0 - 10.0
  | 'excellent'       // 8.0 - 8.9
  | 'very_good'       // 7.0 - 7.9
  | 'good'            // 6.0 - 6.9
  | 'average'         // 5.0 - 5.9
  | 'below_average'   // 4.0 - 4.9
  | 'poor';           // < 4.0

/**
 * Get category from rating score
 */
export function getRatingCategory(rating: number): RatingCategory {
  if (rating >= 9.0) return 'masterpiece';
  if (rating >= 8.0) return 'excellent';
  if (rating >= 7.0) return 'very_good';
  if (rating >= 6.0) return 'good';
  if (rating >= 5.0) return 'average';
  if (rating >= 4.0) return 'below_average';
  return 'poor';
}

/**
 * Get human-readable category label
 */
export function getCategoryLabel(category: RatingCategory): string {
  const labels: Record<RatingCategory, string> = {
    masterpiece: 'Masterpiece',
    excellent: 'Excellent',
    very_good: 'Very Good',
    good: 'Good',
    average: 'Average',
    below_average: 'Below Average',
    poor: 'Poor',
  };
  return labels[category];
}

/**
 * Get category color for UI
 */
export function getCategoryColor(category: RatingCategory): string {
  const colors: Record<RatingCategory, string> = {
    masterpiece: '#FFD700',  // Gold
    excellent: '#4CAF50',    // Green
    very_good: '#8BC34A',    // Light Green
    good: '#2196F3',         // Blue
    average: '#FF9800',      // Orange
    below_average: '#F44336', // Red
    poor: '#9E9E9E',         // Gray
  };
  return colors[category];
}

interface Movie {
  our_rating?: number;
  avg_rating?: number;
  is_classic?: boolean;
  is_blockbuster?: boolean;
  release_year?: number;
  director?: string;
  hero?: string;
  title?: string; // For landmark title pattern matching
}

/**
 * Get display rating with proper priority
 * 
 * Priority:
 * 1. Return 0 for movies without release_year (incomplete data)
 * 2. our_rating (editorial)
 * 3. avg_rating (TMDB, capped at 8.5)
 * 4. Default based on movie attributes
 */
export function getDisplayRating(movie: Movie): number {
  // Return 0 for incomplete data (no release year)
  if (!movie.release_year) {
    return 0;
  }

  // Priority 1: Editorial rating
  if (movie.our_rating && movie.our_rating > 0) {
    return movie.our_rating;
  }

  // Priority 2: TMDB rating (capped to prevent inflation)
  if (movie.avg_rating && movie.avg_rating > 0) {
    return Math.min(movie.avg_rating, 8.5);
  }

  // Priority 3: Default based on attributes
  if (movie.is_classic) return 7.5;
  if (movie.is_blockbuster) return 7.0;
  if (movie.release_year < 1990) return 6.5;
  
  return 6.0; // Conservative default
}

// Title patterns that indicate blockbuster/landmark films
export const LANDMARK_TITLE_PATTERNS = [
  'Shankar Dada',
  'Shiva',
  'Khaidi',
  'Pokiri',
  'Magadheera',
  'Baahubali',
  'Pushpa',
  'RRR',
  'Gabbar Singh',
  'Athadu',
  'Simhadri',
  'Chatrapathi',
];

// Comedy era films (1985-1995) - higher replay value
export const COMEDY_ERA_DIRECTORS = [
  'E.V.V. Satyanarayana',
  'Jandhyala',
  'Relangi Narasimha Rao',
  'Vamsy',
];

/**
 * Calculate smart rating for a movie without external validation
 * 
 * Refined logic based on manual review:
 * - Legendary directors (Bapu, K. Viswanath) get minimum 7.0
 * - Blockbuster title patterns get 7.0+ check
 * - Comedy era films (1985-1995) get higher base
 * - Post-2000 successful films shouldn't default to 5.5
 */
export function calculateSmartRating(movie: Movie): number {
  let baseRating = 5.5;
  let boost = 0;

  // LEGENDARY DIRECTORS - guaranteed minimum 7.0
  if (movie.director && LEGENDARY_DIRECTORS.some(d => movie.director?.includes(d))) {
    baseRating = 7.0;
    // Return early - legendary directors don't need further adjustment
    return baseRating;
  }

  // Era-based adjustment
  if (movie.release_year) {
    if (movie.release_year < 1970) {
      baseRating = 6.5; // Golden era classics
    } else if (movie.release_year < 1985) {
      baseRating = 6.0;
    } else if (movie.release_year < 2000) {
      baseRating = 5.8;
      // Comedy era (1985-1995) gets extra boost
      if (movie.release_year >= 1985 && movie.release_year <= 1995) {
        if (movie.director && COMEDY_ERA_DIRECTORS.some(d => movie.director?.includes(d))) {
          boost += 1.5; // EVV/Jandhyala comedies
        }
      }
    }
  }

  // Landmark title pattern check
  if (movie.title && LANDMARK_TITLE_PATTERNS.some(p => movie.title?.includes(p))) {
    baseRating = Math.max(baseRating, 7.0);
  }

  // Famous director boost (+0.5)
  if (movie.director && FAMOUS_DIRECTORS.some(d => movie.director?.includes(d))) {
    boost += 0.5;
  }

  // Star cast boost (+0.3)
  if (movie.hero && STAR_ACTORS.some(a => movie.hero?.includes(a))) {
    boost += 0.3;
  }

  // Classic/Blockbuster status
  if (movie.is_classic) {
    baseRating = 7.5;
    boost = Math.max(boost, 0);
  } else if (movie.is_blockbuster) {
    baseRating = 7.0;
    boost = Math.max(boost, 0);
  }

  // Calculate final rating with cap
  const finalRating = Math.min(baseRating + boost, 8.5);
  return Math.round(finalRating * 10) / 10;
}

/**
 * Check if a movie is directed by a legendary director
 */
export function isLegendaryDirector(director: string | null | undefined): boolean {
  if (!director) return false;
  return LEGENDARY_DIRECTORS.some(d => director.includes(d));
}

/**
 * Validate and adjust rating against external sources
 */
export function crossReferenceRating(
  currentRating: number,
  tmdbRating: number | null,
  hasAwards: boolean,
  isClassic: boolean,
  isBlockbuster: boolean
): { rating: number; reason: string } {
  let newRating = currentRating;
  let reason = '';

  // Rule 1: Blend with TMDB if significant discrepancy
  if (tmdbRating && Math.abs(currentRating - tmdbRating) >= 2.0) {
    newRating = currentRating * 0.6 + tmdbRating * 0.4;
    reason = 'cross_ref_tmdb';
  }

  // Rule 2: Award boost
  if (hasAwards && newRating < 7.5) {
    newRating = Math.max(newRating, 7.5);
    reason = reason || 'award_boost';
  }

  // Rule 3: Classic boost
  if (isClassic && newRating < 7.0) {
    newRating = 7.5;
    reason = reason || 'classic_boost';
  }

  // Rule 4: Blockbuster boost
  if (isBlockbuster && newRating < 7.0) {
    newRating = 7.0;
    reason = reason || 'blockbuster_boost';
  }

  // Rule 5: Deflate inflated non-notables
  if (!isClassic && !isBlockbuster && newRating >= 9.0) {
    newRating = Math.min(newRating, 8.5);
    reason = reason || 'deflate_inflated';
  }

  return {
    rating: Math.round(newRating * 10) / 10,
    reason: reason || 'no_change',
  };
}

/**
 * Calibrate breakdown scores to match overall rating
 */
export function calibrateBreakdownScores(
  overallRating: number,
  breakdownScores: number[]
): number[] {
  if (breakdownScores.length === 0) return [];

  const avgBreakdown = breakdownScores.reduce((a, b) => a + b, 0) / breakdownScores.length;
  const delta = overallRating - avgBreakdown;

  // Only calibrate if delta is significant
  if (Math.abs(delta) < 0.3) return breakdownScores;

  return breakdownScores.map(score => {
    const calibrated = score + delta;
    // Cap between 1.0 and 10.0
    return Math.round(Math.max(1, Math.min(10, calibrated)) * 10) / 10;
  });
}

/**
 * Check if a rating is an anomaly that needs review
 */
export function isRatingAnomaly(
  rating: number,
  tmdbRating: number | null,
  isClassic: boolean,
  isBlockbuster: boolean
): { isAnomaly: boolean; reason: string } {
  // Classic rated too low
  if (isClassic && rating < 7.0) {
    return { isAnomaly: true, reason: 'low_classic' };
  }

  // Non-notable rated too high
  if (!isClassic && !isBlockbuster && rating >= 9.0) {
    return { isAnomaly: true, reason: 'inflated_non_notable' };
  }

  // Large TMDB discrepancy
  if (tmdbRating && Math.abs(rating - tmdbRating) >= 2.0) {
    return { isAnomaly: true, reason: 'tmdb_discrepancy' };
  }

  // Very low rating
  if (rating < 4.0) {
    return { isAnomaly: true, reason: 'very_low' };
  }

  return { isAnomaly: false, reason: '' };
}

/**
 * Watch recommendation types based on rating
 */
export type WatchRecommendation = 
  | 'masterpiece'        // 9.0+ - Absolute must-watch
  | 'must-watch'         // 8.5-8.9 - Highly acclaimed  
  | 'highly-recommended' // 8.0-8.4 - Excellent choice
  | 'recommended'        // 7.0-7.9 - Good movie
  | 'worth-watching'     // 6.0-6.9 - Decent entertainment
  | 'one-time-watch'     // 5.0-5.9 - Watch if you like the genre
  | 'skip';              // <5.0 - Not recommended

/**
 * Get watch recommendation based on rating and movie attributes
 * 
 * @param rating - The movie rating (0-10)
 * @param isClassic - Whether the movie is a classic
 * @param isCult - Whether the movie has cult status
 * @returns WatchRecommendation category
 */
export function getWatchRecommendation(
  rating: number,
  isClassic?: boolean,
  isCult?: boolean
): WatchRecommendation {
  // Cult classics get a boost in recommendation even if rating is lower
  if (isCult && rating >= 6.5) {
    return rating >= 8.0 ? 'must-watch' : 'highly-recommended';
  }

  if (rating >= 9.0) return 'masterpiece';
  if (rating >= 8.5) return 'must-watch';
  if (rating >= 8.0) return 'highly-recommended';
  if (rating >= 7.0) return 'recommended';
  if (rating >= 6.0) return 'worth-watching';
  if (rating >= 5.0) return 'one-time-watch';
  return 'skip';
}

/**
 * Get display label for watch recommendation
 */
export function getWatchLabel(recommendation: WatchRecommendation): string {
  const labels: Record<WatchRecommendation, string> = {
    'masterpiece': 'MASTERPIECE',
    'must-watch': 'MUST WATCH',
    'highly-recommended': 'HIGHLY RECOMMENDED',
    'recommended': 'RECOMMENDED',
    'worth-watching': 'WORTH WATCHING',
    'one-time-watch': 'ONE-TIME WATCH',
    'skip': 'SKIP',
  };
  return labels[recommendation];
}

/**
 * Get styling for watch recommendation badge
 */
export function getWatchStyle(recommendation: WatchRecommendation): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const styles: Record<WatchRecommendation, { bg: string; text: string; border: string; icon: string }> = {
    'masterpiece': {
      bg: 'bg-gradient-to-r from-yellow-400 to-amber-500',
      text: 'text-black',
      border: 'border-yellow-400/50',
      icon: '🏆',
    },
    'must-watch': {
      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
      text: 'text-black',
      border: 'border-amber-400/50',
      icon: '👑',
    },
    'highly-recommended': {
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      text: 'text-white',
      border: 'border-emerald-400/50',
      icon: '⭐',
    },
    'recommended': {
      bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      text: 'text-white',
      border: 'border-blue-400/50',
      icon: '👍',
    },
    'worth-watching': {
      bg: 'bg-gradient-to-r from-sky-500 to-blue-500',
      text: 'text-white',
      border: 'border-sky-400/50',
      icon: '📺',
    },
    'one-time-watch': {
      bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
      text: 'text-white',
      border: 'border-gray-500/50',
      icon: '📽️',
    },
    'skip': {
      bg: 'bg-gradient-to-r from-red-500 to-rose-600',
      text: 'text-white',
      border: 'border-red-400/50',
      icon: '⚠️',
    },
  };
  return styles[recommendation];
}

