/**
 * Profile Derived Insights Utilities
 * 
 * Functions to derive insights from movie data for profile pages.
 * Includes career analysis, performance metrics, and data visualization helpers.
 */

interface Movie {
  id: string;
  title: string;
  year: number;
  slug: string;
  rating?: number;
  poster_url?: string;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
  genres?: string[];
}

interface CareerStats {
  total_movies: number;
  first_year: number;
  last_year: number;
  decades_active: number;
  avg_rating: number;
  hit_rate: number;
  blockbusters: number;
  classics: number;
}

/**
 * Find high-rated movies that aren't blockbusters
 */
export function deriveUnderratedGems(movies: Movie[]): Movie[] {
  return movies
    .filter(m => 
      (m.rating || 0) >= 7.5 && 
      !m.is_blockbuster &&
      m.is_underrated !== false
    )
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
}

/**
 * Break down filmography by decade with performance metrics
 */
export function deriveDecadeBreakdown(movies: Movie[]) {
  const decades = new Map<number, { count: number; ratings: number[]; years: Set<number> }>();
  
  for (const movie of movies) {
    const decade = Math.floor(movie.year / 10) * 10;
    const existing = decades.get(decade) || { count: 0, ratings: [], years: new Set() };
    existing.count++;
    existing.years.add(movie.year);
    if (movie.rating) {
      existing.ratings.push(movie.rating);
    }
    decades.set(decade, existing);
  }
  
  return Array.from(decades.entries())
    .map(([decade, data]) => ({
      decade,
      count: data.count,
      years: data.years.size,
      avgRating: data.ratings.length > 0
        ? (data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)
        : 'N/A',
    }))
    .sort((a, b) => a.decade - b.decade);
}

/**
 * Find the decade with most films
 */
export function derivePeakDecade(movies: Movie[]): number {
  const breakdown = deriveDecadeBreakdown(movies);
  if (breakdown.length === 0) return 0;
  return breakdown.reduce((max, curr) => 
    curr.count > max.count ? curr : max
  ).decade;
}

/**
 * Find the most productive year
 */
export function deriveMostProductiveYear(movies: Movie[]): { year: number; count: number } {
  const years = new Map<number, number>();
  for (const movie of movies) {
    years.set(movie.year, (years.get(movie.year) || 0) + 1);
  }
  
  let maxYear = 0;
  let maxCount = 0;
  for (const [year, count] of years.entries()) {
    if (count > maxCount) {
      maxCount = count;
      maxYear = year;
    }
  }
  
  return { year: maxYear, count: maxCount };
}

/**
 * Create year distribution for activity heatmap
 */
export function deriveYearDistribution(movies: Movie[]): Record<number, number> {
  const distribution: Record<number, number> = {};
  
  for (const movie of movies) {
    distribution[movie.year] = (distribution[movie.year] || 0) + 1;
  }
  
  return distribution;
}

/**
 * Identify career gaps (years with no releases)
 */
export function deriveCareerGaps(
  movies: Movie[], 
  careerStats: CareerStats
): Array<{ years: string; duration: number; comebackFilm?: string }> {
  const years = movies.map(m => m.year).sort((a, b) => a - b);
  const gaps: Array<{ years: string; duration: number; comebackFilm?: string }> = [];
  
  for (let i = 1; i < years.length; i++) {
    const gap = years[i] - years[i - 1];
    if (gap > 1) {
      const gapYears = [];
      for (let y = years[i - 1] + 1; y < years[i]; y++) {
        gapYears.push(y);
      }
      
      const comebackFilm = movies.find(m => m.year === years[i]);
      
      gaps.push({
        years: gapYears.length === 1 ? String(gapYears[0]) : `${gapYears[0]}-${gapYears[gapYears.length - 1]}`,
        duration: gap - 1,
        comebackFilm: comebackFilm?.title,
      });
    }
  }
  
  return gaps;
}

/**
 * Get comeback films after career breaks
 */
export function deriveComebackFilms(
  movies: Movie[], 
  gaps: ReturnType<typeof deriveCareerGaps>
): Movie[] {
  return gaps
    .filter(gap => gap.duration >= 2)
    .map(gap => {
      const endYear = parseInt(gap.years.includes('-') ? gap.years.split('-')[1] : gap.years);
      return movies.find(m => m.year === endYear + 1);
    })
    .filter((m): m is Movie => m !== undefined);
}

/**
 * Calculate career highlights
 */
export function deriveCareerHighlights(
  movies: Movie[],
  careerStats: CareerStats
): string[] {
  const highlights: string[] = [];
  
  // First film
  const firstFilm = movies.find(m => m.year === careerStats.first_year);
  if (firstFilm) {
    highlights.push(`Debut: ${firstFilm.title} (${firstFilm.year})`);
  }
  
  // 100th film milestone
  if (careerStats.total_movies >= 100) {
    const sorted = [...movies].sort((a, b) => a.year - b.year);
    const film100 = sorted[99];
    if (film100) {
      highlights.push(`100th Film: ${film100.title} (${film100.year})`);
    }
  }
  
  // 50th film milestone
  if (careerStats.total_movies >= 50 && careerStats.total_movies < 100) {
    const sorted = [...movies].sort((a, b) => a.year - b.year);
    const film50 = sorted[49];
    if (film50) {
      highlights.push(`50th Film: ${film50.title} (${film50.year})`);
    }
  }
  
  // Longest gap
  const gaps = deriveCareerGaps(movies, careerStats);
  const longestGap = gaps.reduce((max, curr) => 
    curr.duration > max.duration ? curr : max, 
    { duration: 0, years: '' }
  );
  if (longestGap.duration > 2) {
    highlights.push(`Career Break: ${longestGap.duration} years (${longestGap.years})`);
  }
  
  return highlights;
}

/**
 * Get intensity level for heatmap (0-4)
 */
export function getIntensityLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4; // 4+
}

/**
 * Get color for intensity level
 */
export function getIntensityColor(level: number): string {
  const colors = [
    'rgba(255, 255, 255, 0.05)',  // 0 films
    'rgba(249, 115, 22, 0.3)',     // 1 film
    'rgba(249, 115, 22, 0.5)',     // 2 films
    'rgba(249, 115, 22, 0.7)',     // 3 films
    'rgba(249, 115, 22, 0.9)',     // 4+ films
  ];
  return colors[Math.min(level, 4)];
}

/**
 * Get decade ranges for heatmap display
 */
export function getDecadeRanges(firstYear: number, lastYear: number): number[] {
  const firstDecade = Math.floor(firstYear / 10) * 10;
  const lastDecade = Math.floor(lastYear / 10) * 10;
  const decades: number[] = [];
  
  for (let decade = firstDecade; decade <= lastDecade; decade += 10) {
    decades.push(decade);
  }
  
  return decades;
}

/**
 * Get years in a decade range
 */
export function getYearsInDecade(decade: number, firstYear: number, lastYear: number): number[] {
  const years: number[] = [];
  const decadeEnd = decade + 9;
  
  for (let year = decade; year <= decadeEnd; year++) {
    if (year >= firstYear && year <= lastYear) {
      years.push(year);
    }
  }
  
  return years;
}

/**
 * Calculate average films per year for a period
 */
export function calculateFilmsPerYear(movies: Movie[], startYear: number, endYear: number): number {
  const yearsSpan = endYear - startYear + 1;
  if (yearsSpan <= 0) return 0;
  
  const moviesInPeriod = movies.filter(m => m.year >= startYear && m.year <= endYear);
  return Number((moviesInPeriod.length / yearsSpan).toFixed(2));
}

/**
 * Get productivity trend (increasing, stable, decreasing)
 */
export function getProductivityTrend(movies: Movie[], careerStats: CareerStats): 'increasing' | 'stable' | 'decreasing' {
  const midPoint = careerStats.first_year + Math.floor((careerStats.last_year - careerStats.first_year) / 2);
  
  const firstHalf = movies.filter(m => m.year >= careerStats.first_year && m.year <= midPoint);
  const secondHalf = movies.filter(m => m.year > midPoint && m.year <= careerStats.last_year);
  
  const firstHalfRate = calculateFilmsPerYear(firstHalf, careerStats.first_year, midPoint);
  const secondHalfRate = calculateFilmsPerYear(secondHalf, midPoint + 1, careerStats.last_year);
  
  const difference = secondHalfRate - firstHalfRate;
  
  if (Math.abs(difference) < 0.3) return 'stable';
  if (difference > 0) return 'increasing';
  return 'decreasing';
}
