/**
 * REVIEWS SECTION INTELLIGENCE
 * 
 * Auto-generates data-driven sections for the Reviews landing page.
 * Uses existing movie data, ratings, and learning engine.
 * ZERO manual curation - all sections are dynamically computed.
 * 
 * Sections:
 * 1. Recently Released (last 30-60 days)
 * 2. Releasing Soon (upcoming)
 * 3. Trending Reviews (from content_performance)
 * 4. Classics (high-rated, older films)
 * 5. Genre Blocks (auto-generated per genre)
 * 6. Hero/Heroine Spotlight (top performers)
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export interface MovieCard {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  poster_url?: string;
  backdrop_url?: string;
  release_year?: number;
  release_date?: string;
  genres: string[];
  director?: string;
  hero?: string;
  heroine?: string;
  avg_rating: number;
  total_reviews: number;
  is_classic?: boolean;
  is_blockbuster?: boolean;
  is_underrated?: boolean;
}

export interface ReviewSection {
  id: string;
  title: string;
  title_te?: string;
  type: 'recently_released' | 'upcoming' | 'trending' | 'classics' | 'blockbusters' | 'hidden-gems' | 'cult-classics' | 'recommended' | 'genre' | 'spotlight' | 'custom';
  movies: MovieCard[];
  viewAllLink?: string;
  icon?: string;
  priority: number;       // For ordering
  performanceScore?: number;  // From learning engine
  isVisible: boolean;
}

export interface SpotlightSection {
  id: string;
  type: 'hero' | 'heroine' | 'director';
  name: string;
  name_te?: string;
  image_url?: string;
  movies: MovieCard[];
  total_movies: number;
  avg_rating: number;
  link: string;
}

export interface SectionLimits {
  hero: number;        // Hero sections (Recently Released, Trending, Top Rated)
  standard: number;    // Standard sections (Blockbusters, Classics, Hidden Gems)
  genre: number;       // Genre sections
  spotlight: number;   // Actor spotlights
}

export interface SectionConfig {
  recentDays: number;        // Days for "Recently Released"
  upcomingDays: number;      // Days ahead for "Upcoming"
  classicYearThreshold: number;  // Year cutoff for classics
  classicMinRating: number;  // Min rating for classics
  genreMinMovies: number;    // Min movies for a genre section
  spotlightMinMovies: number; // Min movies for spotlight
  maxMoviesPerSection: SectionLimits;  // ✅ Now tiered!
  language?: string;         // Language filter (defaults to 'Telugu')
}

const DEFAULT_CONFIG: SectionConfig = {
  recentDays: 60,
  upcomingDays: 90,
  classicYearThreshold: 2000,
  classicMinRating: 7.0,
  genreMinMovies: 5,
  spotlightMinMovies: 3,
  maxMoviesPerSection: {
    hero: 12,        // Reduced from 24 for performance
    standard: 10,    // Reduced from 18 for performance
    genre: 8,        // Reduced from 15 for performance
    spotlight: 6,    // Reduced from 12 for performance
  },
  language: 'Telugu',
};

// Slim movie fields for optimized API responses
const SLIM_MOVIE_FIELDS = 'id, title_en, title_te, slug, poster_url, release_year, avg_rating, genres' as const;

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// ============================================================
// SECTION GENERATORS
// ============================================================

/**
 * Recently Released Movies (already released, not future)
 */
export async function getRecentlyReleased(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // Get movies that have already been released
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .eq('language', language) // ✅ FILTER BY LANGUAGE
    .or(`release_date.lte.${today},and(release_date.is.null,release_year.lte.${currentYear - 1})`)
    .gte('release_year', currentYear - 2)
    .order('release_year', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(config.maxMoviesPerSection.hero); // ✅ Hero section

  return {
    id: 'recently-released',
    title: 'Recent Releases',
    title_te: 'ఇటీవల విడుదలైనవి',
    type: 'recently_released',
    movies: (movies || []).map(mapToMovieCard),
    viewAllLink: '/reviews?sortBy=recent',
    icon: '🎬',
    priority: 1,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Upcoming Releases (future releases - show synopsis not review)
 */
export async function getUpcoming(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();

  // Get movies with future release dates OR next year without date
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, synopsis')
    .eq('is_published', true)
    .eq('language', language) // ✅ FILTER BY LANGUAGE
    .or(`release_date.gt.${today},and(release_date.is.null,release_year.gt.${currentYear})`)
    .order('release_date', { ascending: true, nullsFirst: false })
    .limit(config.maxMoviesPerSection.standard); // ✅ Standard section

  // Map with isUpcoming flag for special rendering
  const upcomingMovies = (movies || []).map(m => ({
    ...mapToMovieCard(m),
    isUpcoming: true,
    synopsis: m.synopsis,
    release_date: m.release_date,
  }));

  return {
    id: 'upcoming',
    title: 'Coming Soon',
    title_te: 'త్వరలో వస్తున్నవి',
    type: 'upcoming',
    movies: upcomingMovies,
    viewAllLink: '/reviews?upcoming=true',
    icon: '📅',
    priority: 2,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Trending Reviews (based on rating and reviews)
 */
export async function getTrending(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  // Get popular movies sorted by rating and reviews
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .eq('language', language) // ✅ FILTER BY LANGUAGE
    .not('avg_rating', 'is', null)
    .order('avg_rating', { ascending: false })
    .order('total_reviews', { ascending: false })
    .limit(config.maxMoviesPerSection.hero); // ✅ Hero section

  return {
    id: 'trending',
    title: 'Top Rated',
    title_te: 'టాప్ రేటెడ్',
    type: 'trending',
    movies: (movies || []).map(mapToMovieCard),
    viewAllLink: '/reviews?sortBy=rating',
    icon: '🔥',
    priority: 3,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Classics (older films before 2010)
 */
export async function getClassics(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  // Get movies tagged as classics
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews, is_classic')
    .eq('is_published', true)
    .eq('language', language)
    .eq('is_classic', true)
    .order('release_year', { ascending: false })
    .limit(config.maxMoviesPerSection.standard); // ✅ Standard section

  return {
    id: 'classics',
    title: 'Telugu Classics',
    title_te: 'క్లాసిక్స్',
    type: 'classics',
    movies: (movies || []).map(m => ({ ...mapToMovieCard(m), is_classic: true })),
    viewAllLink: '/reviews?classic=true',
    icon: '⭐',
    priority: 5,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Blockbusters (big-budget, star-studded hits)
 */
export async function getBlockbusters(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .eq('language', language)
    .eq('is_blockbuster', true)
    .order('avg_rating', { ascending: false })
    .limit(config.maxMoviesPerSection.standard); // ✅ Standard section

  return {
    id: 'blockbusters',
    title: 'Blockbusters',
    title_te: 'బ్లాక్‌బస్టర్లు',
    type: 'blockbusters',
    movies: (movies || []).map(m => ({ ...mapToMovieCard(m), is_blockbuster: true })),
    viewAllLink: '/reviews?blockbuster=true',
    icon: '🏆',
    priority: 4,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Hidden Gems (underrated movies worth discovering)
 */
export async function getHiddenGems(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .eq('language', language)
    .eq('is_underrated', true)
    .order('avg_rating', { ascending: false })
    .limit(config.maxMoviesPerSection.standard); // ✅ Standard section

  return {
    id: 'hidden-gems',
    title: 'Hidden Gems',
    title_te: 'దాగిన రత్నాలు',
    type: 'hidden-gems',
    movies: (movies || []).map(m => ({ ...mapToMovieCard(m), is_underrated: true })),
    viewAllLink: '/reviews?underrated=true',
    icon: '💎',
    priority: 6,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Cult Classics (movies with cult following)
 */
export async function getCultClassics(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews, tags')
    .eq('is_published', true)
    .eq('language', language)
    .contains('tags', ['cult-classic'])
    .order('release_year', { ascending: false })
    .limit(config.maxMoviesPerSection.standard); // ✅ Standard section

  return {
    id: 'cult-classics',
    title: 'Cult Classics',
    title_te: 'కల్ట్ క్లాసిక్స్',
    type: 'cult-classics',
    movies: (movies || []).map(mapToMovieCard),
    viewAllLink: '/reviews?tag=cult-classic',
    icon: '🎭',
    priority: 7,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Top 10 Movies - highest rated movies overall
 */
export async function getTop10(
  timeframe: 'all-time' | 'decade' | 'year' = 'all-time',
  config: SectionConfig = DEFAULT_CONFIG
): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';
  const currentYear = new Date().getFullYear();
  
  let query = supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .eq('language', language)
    .not('avg_rating', 'is', null)
    .gte('avg_rating', 7.0);
  
  // Apply timeframe filters
  if (timeframe === 'decade') {
    query = query.gte('release_year', currentYear - 10);
  } else if (timeframe === 'year') {
    query = query.eq('release_year', currentYear);
  }
  
  const { data: movies } = await query
    .order('avg_rating', { ascending: false })
    .order('total_reviews', { ascending: false })
    .limit(10);
  
  const titleSuffix = timeframe === 'decade' ? ' (Last Decade)' : 
                      timeframe === 'year' ? ` (${currentYear})` : '';
  
  return {
    id: `top-10-${timeframe}`,
    title: `Top 10 Movies${titleSuffix}`,
    title_te: 'టాప్ 10 సినిమాలు',
    type: 'custom',
    movies: (movies || []).map(mapToMovieCard),
    viewAllLink: `/reviews?sortBy=rating&timeframe=${timeframe}`,
    icon: '🏆',
    priority: 2.5,
    isVisible: (movies?.length || 0) >= 5,
  };
}

/**
 * Most Recommended - rotating selection of highly rated classic and modern films
 */
export async function getMostRecommended(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  // Get a mix of highly rated classics and modern hits
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .eq('language', language)
    .not('avg_rating', 'is', null)
    .gte('avg_rating', 7)
    .order('avg_rating', { ascending: false })
    .limit(config.maxMoviesPerSection.hero * 2); // ✅ Fetch double for shuffling

  // Shuffle to create rotation effect
  const shuffled = (movies || []).sort(() => Math.random() - 0.5).slice(0, config.maxMoviesPerSection.hero);

  return {
    id: 'most-recommended',
    title: 'Most Recommended',
    title_te: 'సిఫారసు చేయబడినవి',
    type: 'recommended',
    movies: shuffled.map(mapToMovieCard),
    viewAllLink: '/reviews?sortBy=rating&minRating=7',
    icon: '⭐',
    priority: 3.5,
    isVisible: (movies?.length || 0) >= 1,
  };
}

/**
 * Genre-based sections (auto-generated)
 */
export async function getGenreSections(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection[]> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';
  
  const PRIORITY_GENRES = [
    { genre: 'Action', title: 'Action Entertainers', title_te: 'యాక్షన్', icon: '💥' },
    { genre: 'Drama', title: 'Family Dramas', title_te: 'డ్రామా', icon: '🎭' },
    { genre: 'Thriller', title: 'Thriller Picks', title_te: 'థ్రిల్లర్', icon: '🔪' },
    { genre: 'Romance', title: 'Romantic Films', title_te: 'రొమాన్స్', icon: '❤️' },
    { genre: 'Comedy', title: 'Comedy Hits', title_te: 'కామెడీ', icon: '😂' },
    { genre: 'Horror', title: 'Horror & Supernatural', title_te: 'హారర్', icon: '👻' },
    { genre: 'Crime', title: 'Crime Thrillers', title_te: 'క్రైమ్', icon: '🔍' },
    { genre: 'Family', title: 'Family Entertainment', title_te: 'ఫ్యామిలీ', icon: '👨‍👩‍👧‍👦' },
  ];

  const sections: ReviewSection[] = [];
  let priority = 10;

  for (const { genre, title, title_te, icon } of PRIORITY_GENRES) {
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
      .eq('is_published', true)
      .eq('language', language)
      .contains('genres', [genre])
      .order('avg_rating', { ascending: false })
      .limit(config.maxMoviesPerSection.genre); // ✅ Genre section

    if ((movies?.length || 0) >= 1) {
      sections.push({
        id: `genre-${genre.toLowerCase()}`,
        title,
        title_te,
        type: 'genre',
        movies: (movies || []).map(mapToMovieCard),
        viewAllLink: `/reviews?genre=${genre}`,
        icon,
        priority: priority++,
        isVisible: true,
      });
    }
  }

  return sections;
}

/**
 * Hero/Heroine Spotlight sections
 * 
 * FIXED: Uses proper count queries instead of fetching all rows
 * (Supabase has a default limit of 1000 rows which caused incorrect counts)
 */
export async function getSpotlightSections(config: SectionConfig = DEFAULT_CONFIG): Promise<SpotlightSection[]> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';
  const spotlights: SpotlightSection[] = [];
  const MIN_MOVIES_FOR_SPOTLIGHT = 5; // Minimum movies to appear in spotlight

  // DYNAMIC: Fetch ALL unique heroes, heroines, and directors from database
  // Note: Supabase has a default limit of 1000 rows, so we need to fetch in batches
  const heroCounts = new Map<string, number>();
  const heroineCounts = new Map<string, number>();
  const directorCounts = new Map<string, number>();
  
  const BATCH_SIZE = 1000;
  let offset = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data: batch } = await supabase
      .from('movies')
      .select('hero, heroine, director')
      .eq('is_published', true)
      .eq('language', language)
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (!batch || batch.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const m of batch) {
      if (m.hero && m.hero !== 'Unknown' && m.hero !== 'N/A') {
        heroCounts.set(m.hero, (heroCounts.get(m.hero) || 0) + 1);
      }
      if (m.heroine && m.heroine !== 'Unknown' && m.heroine !== 'N/A' && m.heroine !== 'No Female Lead') {
        heroineCounts.set(m.heroine, (heroineCounts.get(m.heroine) || 0) + 1);
      }
      if (m.director && m.director !== 'Unknown' && m.director !== 'N/A') {
        directorCounts.set(m.director, (directorCounts.get(m.director) || 0) + 1);
      }
    }
    
    if (batch.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  // Build dynamic spotlight list sorted by movie count
  const topActors: Array<{ name: string; type: 'hero' | 'heroine' | 'director'; count: number }> = [];

  // Add all heroes with minimum movies
  for (const [name, count] of heroCounts.entries()) {
    if (count >= MIN_MOVIES_FOR_SPOTLIGHT) {
      topActors.push({ name, type: 'hero', count });
    }
  }

  // Add all heroines with minimum movies
  for (const [name, count] of heroineCounts.entries()) {
    if (count >= MIN_MOVIES_FOR_SPOTLIGHT) {
      topActors.push({ name, type: 'heroine', count });
    }
  }

  // Add all directors with minimum movies
  for (const [name, count] of directorCounts.entries()) {
    if (count >= MIN_MOVIES_FOR_SPOTLIGHT) {
      topActors.push({ name, type: 'director', count });
    }
  }

  // Sort by movie count (highest first)
  topActors.sort((a, b) => b.count - a.count);

  for (const actor of topActors) {
    const field = actor.type === 'director' ? 'director' : actor.type;
    const totalCount = actor.count;

    // Get top movies for display
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
      .eq('is_published', true)
      .eq('language', language)
      .eq(field, actor.name)
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(config.maxMoviesPerSection.spotlight);

    // Smart rating calculation:
    // 1. Get all movies with actual ratings for this actor
    // 2. Calculate weighted average based on rated movies only
    // 3. Apply cultural significance baseline for legendary actors with sparse ratings
    const { data: ratedMovies } = await supabase
      .from('movies')
      .select('avg_rating, total_reviews')
      .eq('is_published', true)
      .eq('language', language)
      .eq(field, actor.name)
      .gt('avg_rating', 0);

    const ratedCount = ratedMovies?.length || 0;
    const ratingCoverage = totalCount > 0 ? ratedCount / totalCount : 0;
    
    let avgRating = 0;
    if (ratedMovies && ratedMovies.length > 0) {
      // Weighted average: movies with more reviews count more
      const totalWeight = ratedMovies.reduce((sum, m) => sum + Math.max(m.total_reviews || 1, 1), 0);
      const weightedSum = ratedMovies.reduce((sum, m) => sum + (m.avg_rating || 0) * Math.max(m.total_reviews || 1, 1), 0);
      avgRating = weightedSum / totalWeight;
    }
    
    // Apply cultural significance baseline for legendary actors with low rating coverage
    // Actors with 100+ movies are considered legendary; 50+ are established
    if (totalCount >= 100 && ratingCoverage < 0.1) {
      // Legendary actors with <10% rating coverage: use 7.0 baseline (industry icons)
      avgRating = Math.max(avgRating, 7.0);
    } else if (totalCount >= 50 && ratingCoverage < 0.2) {
      // Established actors with <20% rating coverage: use 6.5 baseline
      avgRating = Math.max(avgRating, 6.5);
    } else if (totalCount >= 20 && ratingCoverage < 0.3) {
      // Known actors with <30% rating coverage: use 6.0 baseline
      avgRating = Math.max(avgRating, 6.0);
    }
    
    // Ensure minimum rating of 5.0 for any actor in spotlight
    avgRating = Math.max(avgRating, 5.0);

    // Try to get celebrity image
    const { data: celeb } = await supabase
      .from('celebrities')
      .select('profile_image, name_te')
      .ilike('name_en', actor.name)
      .single();

    spotlights.push({
      id: `${actor.type}-${actor.name.toLowerCase().replace(/\s+/g, '-')}`,
      type: actor.type,
      name: actor.name,
      name_te: celeb?.name_te,
      image_url: celeb?.profile_image,
      movies: (movies || []).map(mapToMovieCard),
      total_movies: totalCount,
      avg_rating: avgRating,
      link: `/reviews?actor=${encodeURIComponent(actor.name)}`,
    });
  }

  return spotlights;
}

/**
 * Get all sections for the Reviews page
 */
export async function getAllReviewSections(partialConfig: Partial<SectionConfig> = {}): Promise<{
  sections: ReviewSection[];
  spotlights: SpotlightSection[];
}> {
  // Merge partial config with defaults to ensure all required properties exist
  const config: SectionConfig = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
    maxMoviesPerSection: {
      ...DEFAULT_CONFIG.maxMoviesPerSection,
      ...(partialConfig.maxMoviesPerSection || {}),
    },
  };

  const [
    recentlyReleased,
    upcoming,
    top10AllTime,
    trending,
    mostRecommended,
    blockbusters,
    hiddenGems,
    classics,
    cultClassics,
    genreSections,
    spotlights,
  ] = await Promise.all([
    getRecentlyReleased(config),
    getUpcoming(config),
    getTop10('all-time', config),
    getTrending(config),
    getMostRecommended(config),
    getBlockbusters(config),
    getHiddenGems(config),
    getClassics(config),
    getCultClassics(config),
    getGenreSections(config),
    getSpotlightSections(config),
  ]);

  // Combine and sort by priority
  const allSections = [
    recentlyReleased,
    upcoming,
    top10AllTime,
    trending,
    mostRecommended,
    blockbusters,
    hiddenGems,
    classics,
    cultClassics,
    ...genreSections,
  ].filter(s => s.isVisible);

  // Sort by priority (can be reordered by learning engine later)
  allSections.sort((a, b) => a.priority - b.priority);

  return {
    sections: allSections,
    spotlights,
  };
}

/**
 * Get initial sections for fast first load (3 sections only, NO spotlights)
 * Used for mode=initial to reduce payload size and load time
 * Spotlights are loaded via mode=lazy for better performance
 */
export async function getInitialSections(partialConfig: Partial<SectionConfig> = {}): Promise<{
  sections: ReviewSection[];
  spotlights: SpotlightSection[];
  hasMore: boolean;
  totalSections: number;
}> {
  const config: SectionConfig = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
    maxMoviesPerSection: {
      ...DEFAULT_CONFIG.maxMoviesPerSection,
      ...(partialConfig.maxMoviesPerSection || {}),
    },
  };

  // Only fetch the first 3 most important sections (NO spotlights - they're slow)
  const [
    recentlyReleased,
    trending,
    blockbusters,
  ] = await Promise.all([
    getRecentlyReleased(config),
    getTrending(config),
    getBlockbusters(config),
  ]);

  const sections = [
    recentlyReleased,
    trending,
    blockbusters,
  ].filter(s => s.isVisible);

  sections.sort((a, b) => a.priority - b.priority);

  return {
    sections,
    spotlights: [], // Spotlights loaded lazily for performance
    hasMore: true,
    totalSections: 9,
  };
}

/**
 * Get lazy-loaded sections (everything after initial, including spotlights)
 * Used for mode=lazy to load remaining sections on scroll
 */
export async function getLazySections(partialConfig: Partial<SectionConfig> = {}): Promise<{
  sections: ReviewSection[];
  spotlights: SpotlightSection[];
}> {
  const config: SectionConfig = {
    ...DEFAULT_CONFIG,
    ...partialConfig,
    maxMoviesPerSection: {
      ...DEFAULT_CONFIG.maxMoviesPerSection,
      ...(partialConfig.maxMoviesPerSection || {}),
    },
  };

  // Fetch the remaining sections (not included in initial) + spotlights
  const [
    upcoming,
    top10AllTime,
    mostRecommended,
    hiddenGems,
    classics,
    cultClassics,
    genreSections,
    spotlights,
  ] = await Promise.all([
    getUpcoming(config),
    getTop10('all-time', config),
    getMostRecommended(config),
    getHiddenGems(config),
    getClassics(config),
    getCultClassics(config),
    getGenreSections(config),
    getTopSpotlights(config, 6), // Fast version: only top 6 spotlights
  ]);

  const sections = [
    upcoming,
    top10AllTime,
    mostRecommended,
    hiddenGems,
    classics,
    cultClassics,
    ...genreSections,
  ].filter(s => s.isVisible);

  sections.sort((a, b) => a.priority - b.priority);

  return { sections, spotlights };
}

/**
 * Fast spotlight fetcher - only returns top N spotlights with minimal queries
 * Optimized version that avoids N+1 query problem
 */
async function getTopSpotlights(config: SectionConfig, limit: number = 6): Promise<SpotlightSection[]> {
  const supabase = getSupabaseClient();
  const language = config.language || 'Telugu';

  // Single query to get top actors by movie count using aggregation
  const { data: heroData } = await supabase
    .from('movies')
    .select('hero')
    .eq('is_published', true)
    .eq('language', language)
    .not('hero', 'is', null)
    .not('hero', 'in', '("Unknown","N/A")');

  // Count heroes efficiently in JS
  const heroCounts = new Map<string, number>();
  for (const m of heroData || []) {
    if (m.hero) {
      heroCounts.set(m.hero, (heroCounts.get(m.hero) || 0) + 1);
    }
  }

  // Get top heroes sorted by count
  const topHeroes = Array.from(heroCounts.entries())
    .filter(([, count]) => count >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Batch fetch celebrity images for all top heroes at once
  const heroNames = topHeroes.map(([name]) => name);
  const { data: celebs } = await supabase
    .from('celebrities')
    .select('name_en, name_te, profile_image')
    .in('name_en', heroNames);

  const celebMap = new Map(
    (celebs || []).map(c => [c.name_en.toLowerCase(), c])
  );

  // Build spotlights with minimal additional queries
  const spotlights: SpotlightSection[] = [];

  for (const [heroName, count] of topHeroes) {
    // Get top 6 movies for this hero
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, release_year, genres, avg_rating')
      .eq('is_published', true)
      .eq('language', language)
      .eq('hero', heroName)
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(6);

    const celeb = celebMap.get(heroName.toLowerCase());
    const avgRating = movies && movies.length > 0
      ? movies.reduce((sum, m) => sum + (m.avg_rating || 0), 0) / movies.length
      : 6.0;

    spotlights.push({
      id: `hero-${heroName.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'hero',
      name: heroName,
      name_te: celeb?.name_te,
      image_url: celeb?.profile_image,
      movies: (movies || []).map(m => ({
        id: m.id,
        title_en: m.title_en,
        title_te: m.title_te,
        slug: m.slug,
        poster_url: m.poster_url,
        release_year: m.release_year,
        genres: m.genres || [],
        avg_rating: m.avg_rating || 0,
        total_reviews: 0,
      })),
      total_movies: count,
      avg_rating: Math.max(avgRating, 5.0),
      link: `/reviews?actor=${encodeURIComponent(heroName)}`,
    });
  }

  return spotlights;
}

// ============================================================
// UNIFIED SEARCH
// ============================================================

export interface SearchResult {
  type: 'movie' | 'actor' | 'director' | 'genre';
  id: string;
  title: string;
  subtitle?: string;
  image_url?: string;
  link: string;
  score: number;
}

/**
 * Unified search across movies, actors, directors
 * 
 * Ensures balanced results: actors/directors appear even when many movies match.
 * Result composition: up to 6 movies + 2 actors + 1 director + 1 genre = 10 max
 */
export async function unifiedSearch(query: string, limit: number = 10): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];

  const supabase = getSupabaseClient();
  const searchTerm = `%${query}%`;

  // Run all searches in parallel for speed
  const [moviesResult, directorResult, actorResult] = await Promise.all([
    // Search movies by title
    supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, director, release_year')
      .eq('is_published', true)
      .or(`title_en.ilike.${searchTerm},title_te.ilike.${searchTerm}`)
      .limit(6), // Limit movies to leave room for actors/directors

    // Search by director name
    supabase
      .from('movies')
      .select('director')
      .eq('is_published', true)
      .ilike('director', searchTerm)
      .limit(5),

    // Search by actor (hero/heroine)
    supabase
      .from('movies')
      .select('hero, heroine')
      .eq('is_published', true)
      .or(`hero.ilike.${searchTerm},heroine.ilike.${searchTerm}`)
      .limit(20), // Get more to find unique actors
  ]);

  const results: SearchResult[] = [];

  // 1. Add ACTORS first (high priority for actor searches like "Krishna")
  const actors = new Set<string>();
  for (const m of actorResult.data || []) {
    if (m.hero && m.hero.toLowerCase().includes(query.toLowerCase())) actors.add(m.hero);
    if (m.heroine && m.heroine.toLowerCase().includes(query.toLowerCase())) actors.add(m.heroine);
  }

  // Fetch actor images from celebrities table
  const actorList = Array.from(actors).slice(0, 3);
  const actorImages: Record<string, string | null> = {};
  
  for (const actor of actorList) {
    const { data: celeb } = await supabase
      .from('celebrities')
      .select('profile_image')
      .ilike('name_en', actor)
      .single();
    actorImages[actor] = celeb?.profile_image || null;
  }

  for (const actor of actorList) {
    results.push({
      type: 'actor',
      id: `actor-${actor}`,
      title: actor,
      subtitle: 'Actor',
      image_url: actorImages[actor] || undefined,
      link: `/reviews?actor=${encodeURIComponent(actor)}`,
      score: 95, // High score to appear before most movies
    });
  }

  // 2. Add DIRECTORS
  const directors = [...new Set((directorResult.data || []).map(m => m.director).filter(Boolean))];
  const directorList = directors.slice(0, 2);
  
  // Fetch director images from celebrities table
  const directorImages: Record<string, string | null> = {};
  for (const director of directorList) {
    if (director) {
      const { data: celeb } = await supabase
        .from('celebrities')
        .select('profile_image')
        .ilike('name_en', director)
        .single();
      directorImages[director] = celeb?.profile_image || null;
    }
  }
  
  for (const director of directorList) {
    results.push({
      type: 'director',
      id: `director-${director}`,
      title: director!,
      subtitle: 'Director',
      image_url: directorImages[director!] || undefined,
      link: `/reviews?director=${encodeURIComponent(director!)}`,
      score: 90,
    });
  }

  // 3. Add MOVIES
  for (const m of moviesResult.data || []) {
    results.push({
      type: 'movie',
      id: m.id,
      title: m.title_en,
      subtitle: `${m.release_year} • ${m.director || 'Unknown Director'}`,
      image_url: m.poster_url,
      link: `/reviews/${m.slug}`,
      score: 85,
    });
  }

  // 4. Add GENRES (lowest priority)
  const GENRES = ['Action', 'Drama', 'Romance', 'Comedy', 'Thriller', 'Horror', 'Fantasy', 'Crime', 'Period', 'Family'];
  const matchingGenres = GENRES.filter(g => g.toLowerCase().includes(query.toLowerCase()));
  for (const genre of matchingGenres.slice(0, 1)) {
    results.push({
      type: 'genre',
      id: `genre-${genre}`,
      title: genre,
      subtitle: 'Genre',
      link: `/reviews?genre=${genre}`,
      score: 60,
    });
  }

  // Sort by score (actors first, then directors, then movies, then genres)
  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ============================================================
// MOVIE DETAIL CONTEXTUAL SECTIONS
// ============================================================

/**
 * Get contextual sections for a movie detail page
 */
export async function getMovieContextSections(movieId: string): Promise<{
  similarMovies: MovieCard[];
  sameActor: MovieCard[];
  sameDirector: MovieCard[];
  relatedClassics: MovieCard[];
}> {
  const supabase = getSupabaseClient();

  // Get the movie first
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single();

  if (!movie) {
    return { similarMovies: [], sameActor: [], sameDirector: [], relatedClassics: [] };
  }

  // Similar movies (same genre + high rating)
  const { data: similar } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .neq('id', movieId)
    .overlaps('genres', movie.genres || [])
    .order('avg_rating', { ascending: false })
    .limit(6);

  // Same actor movies
  let sameActorMovies: MovieCard[] = [];
  if (movie.hero) {
    const { data } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
      .eq('is_published', true)
      .eq('hero', movie.hero)
      .neq('id', movieId)
      .order('avg_rating', { ascending: false })
      .limit(6);
    sameActorMovies = (data || []).map(mapToMovieCard);
  }

  // Same director movies
  let sameDirectorMovies: MovieCard[] = [];
  if (movie.director) {
    const { data } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
      .eq('is_published', true)
      .eq('director', movie.director)
      .neq('id', movieId)
      .order('avg_rating', { ascending: false })
      .limit(6);
    sameDirectorMovies = (data || []).map(mapToMovieCard);
  }

  // Related classics (same genre, older, high-rated)
  const { data: classics } = await supabase
    .from('movies')
    .select('id, title_en, title_te, slug, poster_url, release_year, release_date, genres, director, hero, heroine, avg_rating, total_reviews')
    .eq('is_published', true)
    .neq('id', movieId)
    .overlaps('genres', movie.genres || [])
    .lte('release_year', 2000)
    .gte('avg_rating', 7.5)
    .order('avg_rating', { ascending: false })
    .limit(6);

  return {
    similarMovies: (similar || []).map(mapToMovieCard),
    sameActor: sameActorMovies,
    sameDirector: sameDirectorMovies,
    relatedClassics: (classics || []).map(mapToMovieCard),
  };
}

// ============================================================
// HELPERS
// ============================================================

interface RawMovie {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  poster_url?: string;
  backdrop_url?: string;
  release_year?: number;
  release_date?: string;
  genres?: string[];
  director?: string;
  hero?: string;
  heroine?: string;
  avg_rating?: number;
  total_reviews?: number;
  is_classic?: boolean;
  is_blockbuster?: boolean;
  is_underrated?: boolean;
}

function mapToMovieCard(movie: RawMovie): MovieCard {
  return {
    id: movie.id,
    title_en: movie.title_en,
    title_te: movie.title_te,
    slug: movie.slug,
    poster_url: movie.poster_url,
    backdrop_url: movie.backdrop_url,
    release_year: movie.release_year,
    release_date: movie.release_date,
    genres: movie.genres || [],
    director: movie.director,
    hero: movie.hero,
    heroine: movie.heroine,
    avg_rating: movie.avg_rating || 0,
    total_reviews: movie.total_reviews || 0,
    is_classic: movie.is_classic,
    is_blockbuster: movie.is_blockbuster,
    is_underrated: movie.is_underrated,
  };
}

