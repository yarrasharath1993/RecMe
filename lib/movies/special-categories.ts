/**
 * Special Movie Categories
 * 
 * Defines criteria and utilities for categorizing movies into special watch categories.
 * Categories are designed to help users find movies based on their mood and viewing context.
 */

export type SpecialCategory = 
  | 'stress-buster'        // Light, feel-good movies
  | 'popcorn'              // Entertaining, easy-watch films
  | 'group-watch'          // Movies perfect for watching with friends/family
  | 'watch-with-special-one' // Romantic/intimate viewing
  | 'weekend-binge'        // High-rated binge-worthy movies
  | 'family-night'         // Perfect for family viewing
  | 'laugh-riot'           // Hilarious comedies
  | 'mind-benders'         // Twist-filled thrillers
  | 'cult-classics'        // Underrated gems
  | 'horror-night';        // Scary horror movies

export interface MovieForCategorization {
  id: string;
  title_en?: string;
  genres?: string[];
  our_rating?: number;
  avg_rating?: number;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
  tone?: string;
  era?: string;
}

export interface CategoryCriteria {
  genres?: string[];
  minRating?: number;
  maxRating?: number;
  mustBeBlockbuster?: boolean;
  mustBeFamilyFriendly?: boolean;
  excludeGenres?: string[];
  tone?: string[];
}

/**
 * Category detection criteria
 */
export const CATEGORY_CRITERIA: Record<SpecialCategory, CategoryCriteria> = {
  'stress-buster': {
    genres: ['Comedy', 'Family', 'Romance'],
    minRating: 7.0,
    excludeGenres: ['Horror', 'Thriller', 'Crime'],
    tone: ['feel-good', 'light-hearted'],
  },
  'popcorn': {
    genres: ['Action', 'Thriller', 'Comedy', 'Adventure'],
    minRating: 6.5,
    // Include blockbusters OR high-rated action movies
  },
  'group-watch': {
    genres: ['Comedy', 'Action', 'Thriller', 'Adventure', 'Family'],
    minRating: 6.5,
    mustBeFamilyFriendly: true,
    excludeGenres: ['Horror'],
  },
  'watch-with-special-one': {
    genres: ['Romance', 'Drama'],
    minRating: 7.0,
    excludeGenres: ['Horror', 'Crime', 'Thriller'],
  },
  'weekend-binge': {
    genres: ['Drama', 'Thriller', 'Action'],
    minRating: 7.5,
  },
  'family-night': {
    genres: ['Family'],
    minRating: 7.0,
    excludeGenres: ['Horror'],
    mustBeFamilyFriendly: true,
  },
  'laugh-riot': {
    genres: ['Comedy'],
    minRating: 7.0,
    excludeGenres: ['Horror'],
  },
  'mind-benders': {
    genres: ['Thriller', 'Mystery'],
    minRating: 7.5,
  },
  'cult-classics': {
    // No genre requirement - just underrated + high rating
    minRating: 7.5,
  },
  'horror-night': {
    genres: ['Horror'],
    minRating: 6.0, // Lower threshold for horror
  },
};

/**
 * Check if a movie matches category criteria
 */
export function matchesCategory(
  movie: MovieForCategorization,
  category: SpecialCategory
): boolean {
  const criteria = CATEGORY_CRITERIA[category];
  const rating = movie.our_rating || movie.avg_rating || 0;

  // Special case: Cult Classics (underrated + high rating)
  if (category === 'cult-classics') {
    return movie.is_underrated === true && rating >= (criteria.minRating || 7.5);
  }

  // Special case: Popcorn Movies (blockbuster OR high-rated action)
  if (category === 'popcorn') {
    const hasMatchingGenre = criteria.genres && movie.genres && 
      criteria.genres.some(genre => movie.genres!.includes(genre));
    if (!hasMatchingGenre) return false;
    
    // Must be blockbuster OR (Action genre + rating >= 7)
    const isActionBlockbuster = movie.is_blockbuster === true ||
      (movie.genres?.includes('Action') && rating >= 7);
    if (!isActionBlockbuster) return false;
    
    if (rating < (criteria.minRating || 6.5)) return false;
    return true;
  }

  // Check genres (if required)
  if (criteria.genres && movie.genres) {
    const hasMatchingGenre = criteria.genres.some(genre =>
      movie.genres!.includes(genre)
    );
    if (!hasMatchingGenre) return false;
  }

  // Check excluded genres
  if (criteria.excludeGenres && movie.genres) {
    const hasExcludedGenre = criteria.excludeGenres.some(genre =>
      movie.genres!.includes(genre)
    );
    if (hasExcludedGenre) return false;
  }

  // Check rating
  if (criteria.minRating && rating < criteria.minRating) return false;
  if (criteria.maxRating && rating > criteria.maxRating) return false;

  // Check blockbuster requirement
  if (criteria.mustBeBlockbuster && !movie.is_blockbuster) return false;

  // Check family-friendly (no horror, no adult content)
  if (criteria.mustBeFamilyFriendly) {
    if (movie.genres?.includes('Horror')) return false;
    // Could add more checks here for adult content
  }

  // Check tone
  if (criteria.tone && movie.tone) {
    const hasMatchingTone = criteria.tone.some(t =>
      movie.tone!.toLowerCase().includes(t.toLowerCase())
    );
    if (!hasMatchingTone) return false;
  }

  return true;
}

/**
 * Detect all categories a movie belongs to
 */
export function detectCategories(
  movie: MovieForCategorization
): SpecialCategory[] {
  const categories: SpecialCategory[] = [];

  for (const category of Object.keys(CATEGORY_CRITERIA) as SpecialCategory[]) {
    if (matchesCategory(movie, category)) {
      categories.push(category);
    }
  }

  return categories;
}

/**
 * Get display label for a category
 */
export function getCategoryLabel(category: SpecialCategory): string {
  const labels: Record<SpecialCategory, string> = {
    'stress-buster': 'Stress Buster',
    'popcorn': 'Popcorn Movie',
    'group-watch': 'Group Watch',
    'watch-with-special-one': 'Watch with Special One',
    'weekend-binge': 'Weekend Binge',
    'family-night': 'Family Night',
    'laugh-riot': 'Laugh Riot',
    'mind-benders': 'Mind Benders',
    'cult-classics': 'Cult Classics',
    'horror-night': 'Horror Night',
  };
  return labels[category];
}

/**
 * Get emoji for a category
 */
export function getCategoryEmoji(category: SpecialCategory): string {
  const emojis: Record<SpecialCategory, string> = {
    'stress-buster': '🎭',
    'popcorn': '🍿',
    'group-watch': '👥',
    'watch-with-special-one': '💕',
    'weekend-binge': '📺',
    'family-night': '👨‍👩‍👧‍👦',
    'laugh-riot': '😂',
    'mind-benders': '🧠',
    'cult-classics': '⭐',
    'horror-night': '👻',
  };
  return emojis[category];
}

/**
 * Get description for a category
 */
export function getCategoryDescription(category: SpecialCategory): string {
  const descriptions: Record<SpecialCategory, string> = {
    'stress-buster': 'Light, feel-good movies to lift your mood',
    'popcorn': 'Entertaining, easy-watch films perfect for casual viewing',
    'group-watch': 'Movies perfect for watching with friends and family',
    'watch-with-special-one': 'Romantic and intimate movies for couples',
    'weekend-binge': 'High-rated movies perfect for a weekend marathon',
    'family-night': 'Perfect movies to watch with the whole family',
    'laugh-riot': 'Hilarious comedies guaranteed to make you laugh',
    'mind-benders': 'Twist-filled thrillers that keep you guessing',
    'cult-classics': 'Underrated gems that deserve more recognition',
    'horror-night': 'Scary horror movies for thrill seekers',
  };
  return descriptions[category];
}
