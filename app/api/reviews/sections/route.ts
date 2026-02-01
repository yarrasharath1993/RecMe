/**
 * Reviews Sections API
 * 
 * Provides movie sections for the reviews page:
 * - Recently Released
 * - Trending
 * - Hidden Gems
 * - Blockbusters
 * - Classics
 * - Genre-based sections
 * - Star spotlights
 * 
 * Section limits: Minimum 60, Maximum 300 movies per section
 * Discover More sections: Minimum 50, Maximum 100 movies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Section configuration constants
const MIN_SECTION_MOVIES = 60;
const MAX_SECTION_MOVIES = 300;
const MIN_DISCOVER_MOVIES = 50;
const MAX_DISCOVER_MOVIES = 100;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MovieCard {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  poster_url?: string;
  release_year?: number;
  release_date?: string;
  genres: string[];
  director?: string;
  hero?: string;
  avg_rating: number;
  our_rating?: number;
  total_reviews: number;
  is_classic?: boolean;
  is_blockbuster?: boolean;
  is_underrated?: boolean;
}

interface Section {
  id: string;
  title: string;
  title_te?: string;
  type: string;
  movies: MovieCard[];
  viewAllLink?: string;
  priority: number;
  isVisible: boolean;
}

interface Spotlight {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'initial';
  const language = searchParams.get('language') || 'Telugu';
  const search = searchParams.get('search');

  // Handle search
  if (search) {
    return handleSearch(search, language);
  }

  // Handle sections
  if (mode === 'initial') {
    return getInitialSections(language);
  } else {
    return getLazySections(language);
  }
}

async function handleSearch(query: string, language: string) {
  try {
    // Search movies
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, poster_url, release_year, director, hero, heroes, heroines')
      .or(`title_en.ilike.%${query}%,title_te.ilike.%${query}%,director.ilike.%${query}%,hero.ilike.%${query}%`)
      .eq('language', language)
      .limit(10);

    const results = (movies || []).map(m => ({
      type: 'movie' as const,
      id: m.id,
      title: m.title_en,
      subtitle: `${m.release_year || ''} • ${m.director || ''}`,
      image_url: m.poster_url,
      link: `/movies/${m.slug}`,
    }));

    // Also search for actors/directors if query matches
    const uniqueDirectors = [...new Set((movies || []).map(m => m.director).filter(Boolean))];
    const uniqueActors = [...new Set((movies || []).map(m => m.hero).filter(Boolean))];

    const actorResults = uniqueActors.slice(0, 3).map(name => ({
      type: 'actor' as const,
      id: `actor-${name}`,
      title: name!,
      subtitle: 'Actor',
      link: `/movies?actor=${encodeURIComponent(name!)}`,
    }));

    const directorResults = uniqueDirectors.slice(0, 3).map(name => ({
      type: 'director' as const,
      id: `director-${name}`,
      title: name!,
      subtitle: 'Director',
      link: `/movies?director=${encodeURIComponent(name!)}`,
    }));

    return NextResponse.json({
      results: [...results, ...actorResults, ...directorResults],
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}

async function getInitialSections(language: string): Promise<NextResponse> {
  try {
    const sections: Section[] = [];
    const currentYear = new Date().getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Recently Released (this year and last year, but exclude upcoming movies)
    // Fetch more to account for filtering out upcoming movies
    const { data: recentMoviesRaw } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .gte('release_year', currentYear - 1)
      .not('slug', 'like', '%-tba') // Exclude TBA movies
      .order('release_date', { ascending: false, nullsLast: true })
      .order('release_year', { ascending: false })
      .limit(MAX_SECTION_MOVIES + 50); // Fetch extra to account for filtering

    // Filter out upcoming movies
    const recentMovies = (recentMoviesRaw || []).filter(movie => {
      // Exclude if slug ends with -tba
      if (movie.slug?.endsWith('-tba')) {
        return false;
      }

      // Exclude if release year is in the future
      if (movie.release_year && movie.release_year > currentYear) {
        return false;
      }

      // Check release date
      if (movie.release_date) {
        const releaseDate = new Date(movie.release_date);
        // Exclude if release date is in the future
        if (releaseDate > today) {
          return false;
        }
        // Include if release date is in the past (already released)
        return true;
      } else {
        // No release date - check year
        if (movie.release_year === currentYear) {
          // Current year with no release date - likely unreleased, exclude
          return false;
        }
        // Past year with no release date - assume released
        return true;
      }
    }).slice(0, MAX_SECTION_MOVIES); // Take up to max after filtering

    // Only add section if we have minimum required movies
    if (recentMovies && recentMovies.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'recently-released',
        title: 'Recently Released',
        title_te: 'ఇటీవల విడుదలైనవి',
        type: 'recently_released',
        movies: mapMovies(recentMovies),
        viewAllLink: '/movies?year=' + currentYear,
        priority: 1,
        isVisible: true,
      });
    }

    // 2. Top Rated
    const { data: topRated } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .not('our_rating', 'is', null)
      .order('our_rating', { ascending: false })
      .limit(MAX_SECTION_MOVIES);

    if (topRated && topRated.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'top-rated',
        title: 'Top Rated',
        title_te: 'అత్యుత్తమ రేటింగ్',
        type: 'recommended',
        movies: mapMovies(topRated),
        viewAllLink: '/movies?sort=rating',
        priority: 2,
        isVisible: true,
      });
    }

    // 3. Hidden Gems (underrated)
    const { data: hiddenGems } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .eq('is_underrated', true)
      .order('our_rating', { ascending: false })
      .limit(MAX_SECTION_MOVIES);

    if (hiddenGems && hiddenGems.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'hidden-gems',
        title: 'Hidden Gems',
        title_te: 'దాగిన రత్నాలు',
        type: 'hidden-gems',
        movies: mapMovies(hiddenGems),
        viewAllLink: '/movies?underrated=true',
        priority: 3,
        isVisible: true,
      });
    }

    // Regroup sections if they don't meet minimum requirements
    const regroupedSections = await regroupSections(sections, language);

    return NextResponse.json({
      sections: regroupedSections || [],
      spotlights: [],
      hasMore: true,
    });
  } catch (error) {
    console.error('Error fetching initial sections:', error);
    return NextResponse.json({ sections: [], spotlights: [], hasMore: false });
  }
}

/**
 * Regroup sections that don't meet minimum requirements
 * Combines small sections or fills them with related movies
 */
async function regroupSections(sections: Section[], language: string): Promise<Section[]> {
  // Ensure sections is an array
  if (!Array.isArray(sections)) {
    console.error('regroupSections: sections is not an array', sections);
    return [];
  }

  const regrouped: Section[] = [];
  const smallSections: Section[] = [];

  // Separate sections that meet minimum and those that don't
  for (const section of sections) {
    if (section.movies.length >= MIN_SECTION_MOVIES) {
      regrouped.push(section);
    } else {
      smallSections.push(section);
    }
  }

  // Try to fill small sections with related movies
  for (const smallSection of smallSections) {
    let filled = false;

    // Try to get more movies based on section type
    if (smallSection.type === 'genre') {
      // Extract genre from viewAllLink or title
      const genreMatch = smallSection.viewAllLink?.match(/genre=([^&]+)/);
      if (genreMatch) {
        const genre = decodeURIComponent(genreMatch[1]);
        const { data: moreMovies } = await supabase
          .from('movies')
          .select('*')
          .eq('language', language)
          .eq('is_published', true)
          .contains('genres', [genre])
          .order('our_rating', { ascending: false })
          .limit(MAX_SECTION_MOVIES);

        if (moreMovies && moreMovies.length >= MIN_SECTION_MOVIES) {
          regrouped.push({
            ...smallSection,
            movies: mapMovies(moreMovies),
          });
          filled = true;
        }
      }
    }

    // If couldn't fill, try combining with similar sections
    if (!filled && smallSections.length > 1) {
      // Combine small sections of same type
      const similarSmall = smallSections.filter(s => 
        s.type === smallSection.type && s.id !== smallSection.id
      );
      if (similarSmall.length > 0) {
        const combinedMovies = [
          ...smallSection.movies,
          ...similarSmall[0].movies,
        ].slice(0, MAX_SECTION_MOVIES);
        
        if (combinedMovies.length >= MIN_SECTION_MOVIES) {
          regrouped.push({
            ...smallSection,
            title: `${smallSection.title} & More`,
            movies: combinedMovies,
          });
          filled = true;
          // Remove the combined section from smallSections
          const index = smallSections.indexOf(similarSmall[0]);
          if (index > -1) smallSections.splice(index, 1);
        }
      }
    }

    // If still couldn't fill, skip this section (don't show sections with insufficient data)
    if (!filled) {
      console.log(`Skipping section ${smallSection.id}: only ${smallSection.movies.length} movies (minimum: ${MIN_SECTION_MOVIES})`);
    }
  }

  return regrouped.sort((a, b) => a.priority - b.priority);
}

async function getLazySections(language: string): Promise<NextResponse> {
  try {
    const sections: Section[] = [];
    const spotlights: Spotlight[] = [];

    // 4. Blockbusters
    const { data: blockbusters } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .eq('is_blockbuster', true)
      .order('release_year', { ascending: false })
      .limit(MAX_SECTION_MOVIES);

    if (blockbusters && blockbusters.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'blockbusters',
        title: 'Blockbusters',
        title_te: 'బ్లాక్‌బస్టర్స్',
        type: 'blockbusters',
        movies: mapMovies(blockbusters),
        viewAllLink: '/movies?blockbuster=true',
        priority: 4,
        isVisible: true,
      });
    }

    // 5. Classics
    const { data: classics } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .eq('is_classic', true)
      .order('our_rating', { ascending: false })
      .limit(MAX_SECTION_MOVIES);

    if (classics && classics.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'classics',
        title: 'Classics',
        title_te: 'క్లాసిక్స్',
        type: 'classics',
        movies: mapMovies(classics),
        viewAllLink: '/movies?classic=true',
        priority: 5,
        isVisible: true,
      });
    }

    // 5.5. Special Categories
    const specialCategories = [
      { id: 'stress-buster', title: '🎭 Stress Busters', title_te: 'స్ట్రెస్ బస్టర్స్', category: 'stress-buster' },
      { id: 'popcorn', title: '🍿 Popcorn Movies', title_te: 'పాప్‌కార్న్ సినిమాలు', category: 'popcorn' },
      { id: 'group-watch', title: '👥 Group Watch', title_te: 'గ్రూప్ వాచ్', category: 'group-watch' },
      { id: 'watch-with-special-one', title: '💕 Watch with Special One', title_te: 'ప్రత్యేకమైన వారితో చూడండి', category: 'watch-with-special-one' },
      { id: 'weekend-binge', title: '📺 Weekend Binge', title_te: 'వీకెండ్ బింజ్', category: 'weekend-binge' },
      { id: 'family-night', title: '👨‍👩‍👧‍👦 Family Night', title_te: 'కుటుంబ రాత్రి', category: 'family-night' },
      { id: 'laugh-riot', title: '😂 Laugh Riot', title_te: 'లాఫ్ రియాట్', category: 'laugh-riot' },
      { id: 'mind-benders', title: '🧠 Mind Benders', title_te: 'మైండ్ బెండర్స్', category: 'mind-benders' },
      { id: 'cult-classics', title: '⭐ Cult Classics', title_te: 'కల్ట్ క్లాసిక్స్', category: 'cult-classics' },
      { id: 'horror-night', title: '👻 Horror Night', title_te: 'హారర్ రాత్రి', category: 'horror-night' },
    ];

    for (const { id, title, title_te, category } of specialCategories) {
      const { data: categoryMovies } = await supabase
        .from('movies')
        .select('*')
        .eq('language', language)
        .eq('is_published', true)
        .contains('special_categories', [category])
        .order('our_rating', { ascending: false })
        .limit(MAX_DISCOVER_MOVIES);

      // Only add if we have minimum required movies for Discover More sections
      if (categoryMovies && categoryMovies.length >= MIN_DISCOVER_MOVIES) {
        sections.push({
          id,
          title,
          title_te,
          type: 'special-category',
          movies: mapMovies(categoryMovies),
          viewAllLink: `/movies?specialCategory=${category}`,
          priority: 5.5,
          isVisible: true,
        });
      }
    }

    // 6. Action Movies
    const { data: actionMovies } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .contains('genres', ['Action'])
      .order('our_rating', { ascending: false })
      .limit(MAX_SECTION_MOVIES);

    if (actionMovies && actionMovies.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'genre-action',
        title: 'Action Movies',
        title_te: 'యాక్షన్ సినిమాలు',
        type: 'genre',
        movies: mapMovies(actionMovies),
        viewAllLink: '/movies?genre=Action',
        priority: 6,
        isVisible: true,
      });
    }

    // 7. Drama Movies
    const { data: dramaMovies } = await supabase
      .from('movies')
      .select('*')
      .eq('language', language)
      .eq('is_published', true)
      .contains('genres', ['Drama'])
      .order('our_rating', { ascending: false })
      .limit(MAX_SECTION_MOVIES);

    if (dramaMovies && dramaMovies.length >= MIN_SECTION_MOVIES) {
      sections.push({
        id: 'genre-drama',
        title: 'Drama Movies',
        title_te: 'డ్రామా సినిమాలు',
        type: 'genre',
        movies: mapMovies(dramaMovies),
        viewAllLink: '/movies?genre=Drama',
        priority: 7,
        isVisible: true,
      });
    }

    // Get Star Spotlights (top actors)
    const { data: allMovies } = await supabase
      .from('movies')
      .select('hero, our_rating, poster_url, title_en, slug, release_year, id')
      .eq('language', language)
      .eq('is_published', true)
      .not('hero', 'is', null)
      .order('our_rating', { ascending: false })
      .limit(MAX_SECTION_MOVIES * 2); // Fetch more for grouping

    if (allMovies && allMovies.length > 0) {
      // Group by hero
      const heroMovies: Record<string, typeof allMovies> = {};
      allMovies.forEach(m => {
        if (m.hero) {
          if (!heroMovies[m.hero]) heroMovies[m.hero] = [];
          heroMovies[m.hero].push(m);
        }
      });

      // Get top heroes by movie count, filter to those with minimum movies
      const topHeroes = Object.entries(heroMovies)
        .filter(([_, movies]) => movies.length >= MIN_DISCOVER_MOVIES) // Only heroes with enough movies
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 10); // Show more spotlights

      topHeroes.forEach(([heroName, movies]) => {
        // Limit movies per spotlight to max discover movies
        const spotlightMovies = movies.slice(0, MAX_DISCOVER_MOVIES);
        const avgRating = spotlightMovies.reduce((sum, m) => sum + (m.our_rating || 0), 0) / spotlightMovies.length;
        spotlights.push({
          id: `hero-${heroName.toLowerCase().replace(/\s+/g, '-')}`,
          type: 'hero',
          name: heroName,
          image_url: movies[0]?.poster_url, // Use first movie poster as placeholder
          movies: spotlightMovies.map(m => ({
            id: m.id,
            title_en: m.title_en,
            slug: m.slug,
            poster_url: m.poster_url,
            release_year: m.release_year,
            avg_rating: m.our_rating || 0,
            genres: [],
            total_reviews: 0,
          })),
          total_movies: movies.length,
          avg_rating: avgRating,
          link: `/movies?actor=${encodeURIComponent(heroName)}`,
        });
      });
    }

    // Regroup sections if they don't meet minimum requirements
    const regroupedSections = await regroupSections(sections, language);

    return NextResponse.json({
      sections: regroupedSections,
      spotlights,
      hasMore: false,
    });
  } catch (error) {
    console.error('Error fetching lazy sections:', error);
    return NextResponse.json({ sections: [], spotlights: [], hasMore: false });
  }
}

function mapMovies(movies: any[]): MovieCard[] {
  return movies.map(m => ({
    id: m.id,
    title_en: m.title_en || m.title,
    title_te: m.title_te,
    slug: m.slug,
    poster_url: m.poster_url,
    release_year: m.release_year,
    release_date: m.release_date,
    genres: m.genres || [],
    director: m.director,
    hero: m.hero,
    avg_rating: m.avg_rating || m.our_rating || 0,
    our_rating: m.our_rating,
    total_reviews: m.total_reviews || 0,
    is_classic: m.is_classic,
    is_blockbuster: m.is_blockbuster,
    is_underrated: m.is_underrated,
  }));
}

