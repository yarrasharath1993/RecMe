/**
 * Utility functions for determining movie release status
 */

export interface MovieWithReleaseInfo {
  release_date?: string | null;
  release_year?: number | null;
}

/**
 * Check if a movie should hide its rating
 * Returns true for:
 * - Upcoming movies (not yet released)
 * - Movies with no release year (incomplete data)
 */
export function shouldHideRating(movie: MovieWithReleaseInfo): boolean {
  // No release year at all = incomplete data, hide rating
  if (!movie.release_year) {
    return true;
  }
  
  // Check if upcoming
  return isMovieUpcoming(movie);
}

/**
 * Check if a movie is upcoming (not yet released)
 */
export function isMovieUpcoming(movie: MovieWithReleaseInfo): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day
  
  if (movie.release_date) {
    const releaseDate = new Date(movie.release_date);
    releaseDate.setHours(0, 0, 0, 0);
    return releaseDate > today;
  }
  
  // If no specific date, check if release year is in the future
  return (movie.release_year || 0) > today.getFullYear();
}

/**
 * Get a human-friendly label for upcoming movies
 * Returns relative dates like "Coming Tomorrow", "Coming Friday", "Coming in 2 weeks"
 */
export function getUpcomingLabel(movie: MovieWithReleaseInfo): string {
  if (!movie.release_date) {
    return 'Coming Soon';
  }
  
  const releaseDate = new Date(movie.release_date);
  releaseDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffMs = releaseDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  // Already released
  if (diffDays <= 0) {
    return '';
  }
  
  // Tomorrow
  if (diffDays === 1) {
    return 'Coming Tomorrow';
  }
  
  // Within this week (show day name)
  if (diffDays <= 7) {
    const dayName = releaseDate.toLocaleDateString('en-US', { weekday: 'long' });
    return `Coming ${dayName}`;
  }
  
  // Next week
  if (diffDays <= 14) {
    return 'Coming Next Week';
  }
  
  // Within a month (show weeks)
  if (diffDays <= 30) {
    const weeks = Math.ceil(diffDays / 7);
    return `Coming in ${weeks} weeks`;
  }
  
  // Next month
  if (diffDays <= 60) {
    return 'Coming Next Month';
  }
  
  // Further out - show month and year
  return `Coming ${releaseDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`;
}

