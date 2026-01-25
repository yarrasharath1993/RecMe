/**
 * Recommendations API
 * 
 * Generates personalized movie recommendations based on user preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { RecommendMePreferences } from '@/lib/movies/recommend-me';
import { detectCategories, type SpecialCategory } from '@/lib/movies/special-categories';
import { slugifyWithYear } from '@/lib/utils/slugify';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map era preferences to year ranges
function getYearRange(era: string): { from: number; to: number } | null {
  const currentYear = new Date().getFullYear();
  switch (era) {
    case 'recent':
      return { from: 2020, to: currentYear };
    case '2010s':
      return { from: 2010, to: 2019 };
    case '2000s':
      return { from: 2000, to: 2009 };
    case '90s':
      return { from: 1990, to: 1999 };
    case 'classics':
    case 'classic':
      return { from: 1900, to: 1989 };
    default:
      return null;
  }
}

// Map moods to genres
function getMoodGenres(mood: string): string[] {
  const moodMap: Record<string, string[]> = {
    'feel-good': ['Comedy', 'Family', 'Romance'],
    'intense': ['Action', 'Thriller', 'Crime'],
    'emotional': ['Drama', 'Romance'],
    'inspirational': ['Drama', 'Family'],
    'light-hearted': ['Comedy', 'Romance'],
    'dark': ['Thriller', 'Horror', 'Crime'],
    'mass': ['Action'],
    'thought-provoking': ['Drama', 'Mystery'],
  };
  return moodMap[mood] || [];
}

export async function POST(request: NextRequest) {
  try {
    const prefs: RecommendMePreferences = await request.json();

    // Build base query
    let query = supabase
      .from('movies')
      .select('*')
      .eq('is_published', true);

    // Apply language filter
    if (prefs.languages && prefs.languages.length > 0) {
      if (prefs.languages.length === 1) {
        query = query.eq('language', prefs.languages[0]);
      } else {
        query = query.in('language', prefs.languages);
      }
    } else {
      // Default to Telugu if no language specified
      query = query.eq('language', 'Telugu');
    }

    // Apply genre filter
    let genresToMatch = [...(prefs.genres || [])];
    
    // Add mood-based genres
    if (prefs.moods && prefs.moods.length > 0) {
      prefs.moods.forEach(mood => {
        const moodGenres = getMoodGenres(mood);
        genresToMatch = [...genresToMatch, ...moodGenres];
      });
    }

    // Apply genre filter if we have any
    if (genresToMatch.length > 0) {
      // Use overlaps to match any of the genres
      query = query.overlaps('genres', genresToMatch);
    }

    // Apply era filter
    if (prefs.era && Array.isArray(prefs.era) && prefs.era.length > 0) {
      const yearRanges = prefs.era.map(e => getYearRange(e)).filter(Boolean);
      if (yearRanges.length > 0) {
        // Build OR condition for multiple eras
        const orConditions = yearRanges.map(range => 
          `and(release_year.gte.${range!.from},release_year.lte.${range!.to})`
        ).join(',');
        query = query.or(orConditions);
      }
    }

    // Apply special categories filter
    // Note: We'll handle this after fetching, as the column might not exist or be empty
    const hasSpecialCategoryFilter = prefs.specialCategories && prefs.specialCategories.length > 0;

    // Apply rating filters
    if (prefs.highlyRatedOnly) {
      query = query.gte('our_rating', 7.5);
    } else if (prefs.minRating) {
      query = query.gte('our_rating', prefs.minRating);
    }

    // Apply special filters
    if (prefs.blockbustersOnly) {
      query = query.eq('is_blockbuster', true);
    }

    if (prefs.hiddenGems) {
      query = query.eq('is_underrated', true);
    }

    // Family friendly filter (exclude horror, adult content)
    if (prefs.familyFriendly) {
      query = query.not('genres', 'cs', '["Horror"]');
    }

    // Fetch movies - increased limit for abundant data
    const { data: movies, error } = await query
      .order('our_rating', { ascending: false, nullsFirst: false })
      .limit(500); // Get more movies for better categorization and filtering

    if (error) {
      console.error('Error fetching recommendations:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch recommendations' 
      }, { status: 500 });
    }

    if (!movies || movies.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sections: [],
        total: 0 
      });
    }

    // Apply special categories filter (with fallback to auto-detection)
    let filteredMovies = movies;
    if (hasSpecialCategoryFilter && prefs.specialCategories) {
      filteredMovies = movies.filter(movie => {
        // First, check if movie has special_categories column populated
        if (movie.special_categories && Array.isArray(movie.special_categories) && movie.special_categories.length > 0) {
          // Check if any of the requested categories match
          const matches = prefs.specialCategories!.some(cat => 
            movie.special_categories.includes(cat as SpecialCategory)
          );
          return matches;
        }
        
        // Fallback: Auto-detect categories if column is empty/NULL
        const detectedCategories = detectCategories({
          id: movie.id,
          title_en: movie.title_en,
          genres: movie.genres,
          our_rating: movie.our_rating,
          avg_rating: movie.avg_rating,
          is_blockbuster: movie.is_blockbuster,
          is_classic: movie.is_classic,
          is_underrated: movie.is_underrated,
          tone: movie.tone,
          era: movie.era,
        });
        
        // Check if any detected category matches requested categories
        const matches = prefs.specialCategories!.some(cat => 
          detectedCategories.includes(cat as SpecialCategory)
        );
        return matches;
      });
    }

    // Use filtered movies for categorization
    const moviesToCategorize = filteredMovies;

    // Categorize movies into sections
    const sections: any[] = [];

    // Section 1: Top Rated - minimum 50, maximum 100
    const topRated = moviesToCategorize
      .filter(m => (m.our_rating || 0) >= 8)
      .slice(0, 100);
    if (topRated.length >= 50) {
      sections.push({
        title: 'Top Rated Picks',
        description: 'Critically acclaimed movies',
        movies: topRated.map(formatMovie),
      });
    }

    // Section 2: Recent Releases - minimum 50, maximum 100
    const recent = moviesToCategorize
      .filter(m => m.release_year && m.release_year >= 2020)
      .slice(0, 100);
    if (recent.length >= 50) {
      sections.push({
        title: 'Recent Releases',
        description: 'Latest movies',
        movies: recent.map(formatMovie),
      });
    }

    // Section 3: Hidden Gems (if not filtered already) - minimum 50, maximum 100
    if (!prefs.hiddenGems) {
      const gems = moviesToCategorize
        .filter(m => m.is_underrated === true)
        .slice(0, 100);
      if (gems.length >= 50) {
        sections.push({
          title: 'Hidden Gems',
          description: 'Underrated favorites',
          movies: gems.map(formatMovie),
        });
      }
    }

    // Section 4: Blockbusters (if not filtered already) - minimum 50, maximum 100
    if (!prefs.blockbustersOnly) {
      const blockbusters = moviesToCategorize
        .filter(m => m.is_blockbuster === true)
        .slice(0, 100);
      if (blockbusters.length >= 50) {
        sections.push({
          title: 'Blockbusters',
          description: 'Box office hits',
          movies: blockbusters.map(formatMovie),
        });
      }
    }

    // Section 5: Special Categories (if selected) - Show filtered results
    if (hasSpecialCategoryFilter && prefs.specialCategories) {
      const categoryLabels: Record<string, string> = {
        'stress-buster': 'Stress Busters',
        'popcorn': 'Popcorn Movies',
        'group-watch': 'Group Watch',
        'watch-with-special-one': 'Watch with Special One',
        'weekend-binge': 'Weekend Binge',
        'family-night': 'Family Night',
        'laugh-riot': 'Laugh Riot',
        'mind-benders': 'Mind Benders',
        'cult-classics': 'Cult Classics',
        'horror-night': 'Horror Night',
      };
      const categoryEmojis: Record<string, string> = {
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
      const categoryDescriptions: Record<string, string> = {
        'stress-buster': 'Light, feel-good movies to lift your mood',
        'popcorn': 'Entertaining, easy-watch films',
        'group-watch': 'Perfect for watching with friends and family',
        'watch-with-special-one': 'Romantic and intimate movies for couples',
        'weekend-binge': 'High-rated movies perfect for a weekend marathon',
        'family-night': 'Perfect movies to watch with the whole family',
        'laugh-riot': 'Hilarious comedies guaranteed to make you laugh',
        'mind-benders': 'Twist-filled thrillers that keep you guessing',
        'cult-classics': 'Underrated gems that deserve more recognition',
        'horror-night': 'Scary horror movies for thrill seekers',
      };

      // Group filtered movies by category
      prefs.specialCategories.forEach(category => {
        const categoryMovies = moviesToCategorize
          .filter(m => {
            // Check database column first
            if (m.special_categories && Array.isArray(m.special_categories) && m.special_categories.includes(category as SpecialCategory)) {
              return true;
            }
            // Fallback to auto-detection
            const detected = detectCategories({
              id: m.id,
              title_en: m.title_en,
              genres: m.genres,
              our_rating: m.our_rating,
              avg_rating: m.avg_rating,
              is_blockbuster: m.is_blockbuster,
              is_classic: m.is_classic,
              is_underrated: m.is_underrated,
              tone: m.tone,
              era: m.era,
            });
            return detected.includes(category as SpecialCategory);
          })
          .slice(0, 100);
        if (categoryMovies.length >= 50) {
          sections.push({
            title: `${categoryEmojis[category] || ''} ${categoryLabels[category] || category}`,
            description: categoryDescriptions[category] || '',
            movies: categoryMovies.map(formatMovie),
          });
        }
      });
    }

    // Section 6: By Genre (if specific genres selected) - minimum 50, maximum 100
    if (prefs.genres && prefs.genres.length > 0) {
      prefs.genres.forEach(genre => {
        const genreMovies = moviesToCategorize
          .filter(m => m.genres?.includes(genre))
          .slice(0, 100);
        if (genreMovies.length >= 50) {
          sections.push({
            title: `${genre} Movies`,
            description: `Best ${genre.toLowerCase()} picks`,
            movies: genreMovies.map(formatMovie),
          });
        }
      });
    }

    // Section 7: Classics (if not filtered already) - minimum 50, maximum 100
    const classics = moviesToCategorize
      .filter(m => m.is_classic === true || (m.release_year && m.release_year < 2000))
      .slice(0, 100);
    if (classics.length >= 50) {
      sections.push({
        title: 'Timeless Classics',
        description: 'Legendary movies',
        movies: classics.map(formatMovie),
      });
    }

    return NextResponse.json({
      success: true,
      sections,
      total: filteredMovies.length,
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function formatMovie(movie: any) {
  // Ensure slug is always present - generate if missing
  const title = movie.title_en || movie.title || 'Untitled';
  const year = movie.release_year || new Date().getFullYear();
  const slug = movie.slug || slugifyWithYear(title, year);

  return {
    id: movie.id,
    title_en: title, // SimilarMoviesCarousel expects title_en
    title: title, // Also include title for compatibility
    slug,
    poster_url: movie.poster_url,
    release_year: year, // SimilarMoviesCarousel expects release_year
    year: year, // Also include year for compatibility
    avg_rating: movie.our_rating || movie.avg_rating,
    rating: movie.our_rating || movie.avg_rating, // Also include rating for compatibility
    genres: movie.genres || [],
    is_blockbuster: movie.is_blockbuster,
    is_classic: movie.is_classic,
    is_underrated: movie.is_underrated,
  };
}
