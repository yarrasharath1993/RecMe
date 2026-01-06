/**
 * Celebrity Filmography API
 * GET /api/celebrity/[slug]/filmography
 * Returns categorized filmography
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const groupBy = searchParams.get('group') || 'decade'; // decade, genre, verdict
    const limit = parseInt(searchParams.get('limit') || '100');

    // Find celebrity
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('id, name_en')
      .eq('slug', slug)
      .single();

    if (celebrityError || !celebrity) {
      return NextResponse.json(
        { error: 'Celebrity not found' },
        { status: 404 }
      );
    }

    // Fetch all movies for this celebrity
    const celebrityName = celebrity.name_en;
    const { data: movies, error: moviesError } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, release_year, poster_url, our_rating, verdict, box_office_category, genres, director, hero, heroine, is_blockbuster, is_classic')
      .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
      .eq('is_published', true)
      .order('release_year', { ascending: false })
      .limit(limit);

    if (moviesError) {
      console.error('Movies query error:', moviesError);
      return NextResponse.json(
        { error: 'Failed to fetch filmography' },
        { status: 500 }
      );
    }

    // Transform movies
    const filmography = (movies || []).map(movie => {
      // Determine role
      let role = 'Lead';
      let roleType = 'lead';
      if (movie.hero?.toLowerCase().includes(celebrityName.toLowerCase())) {
        role = 'Lead Hero';
        roleType = 'lead';
      } else if (movie.heroine?.toLowerCase().includes(celebrityName.toLowerCase())) {
        role = 'Lead Actress';
        roleType = 'lead';
      } else if (movie.director?.toLowerCase().includes(celebrityName.toLowerCase())) {
        role = 'Director';
        roleType = 'director';
      }

      return {
        movie_id: movie.id,
        title_en: movie.title_en,
        title_te: movie.title_te,
        slug: movie.slug,
        release_year: movie.release_year,
        poster_url: movie.poster_url,
        our_rating: movie.our_rating,
        verdict: movie.verdict || movie.box_office_category,
        verdict_color: getVerdictColor(movie.box_office_category),
        genres: movie.genres || [],
        director: movie.director,
        role,
        role_type: roleType,
        is_blockbuster: movie.is_blockbuster,
        is_classic: movie.is_classic,
        decade: getDecade(movie.release_year),
      };
    });

    // Group based on parameter
    let grouped: Record<string, any[]> = {};

    switch (groupBy) {
      case 'decade':
        for (const movie of filmography) {
          const decade = movie.decade;
          if (!grouped[decade]) grouped[decade] = [];
          grouped[decade].push(movie);
        }
        // Sort decades descending
        grouped = Object.fromEntries(
          Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]))
        );
        break;

      case 'genre':
        for (const movie of filmography) {
          for (const genre of movie.genres) {
            if (!grouped[genre]) grouped[genre] = [];
            grouped[genre].push(movie);
          }
        }
        // Sort by count
        grouped = Object.fromEntries(
          Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
        );
        break;

      case 'verdict':
        const verdictOrder = ['blockbuster', 'super-hit', 'hit', 'average', 'below-average', 'flop', 'disaster', 'unknown'];
        for (const movie of filmography) {
          const verdict = normalizeVerdict(movie.verdict);
          if (!grouped[verdict]) grouped[verdict] = [];
          grouped[verdict].push(movie);
        }
        // Sort by verdict order
        grouped = Object.fromEntries(
          verdictOrder
            .filter(v => grouped[v])
            .map(v => [v, grouped[v]])
        );
        break;

      default:
        grouped = { all: filmography };
    }

    // Calculate stats
    const stats = {
      total: filmography.length,
      hits: filmography.filter(m => isHit(m.verdict)).length,
      flops: filmography.filter(m => isFlop(m.verdict)).length,
      average: filmography.filter(m => m.verdict === 'average').length,
      as_hero: filmography.filter(m => m.role_type === 'lead' && m.role.includes('Hero')).length,
      as_heroine: filmography.filter(m => m.role_type === 'lead' && m.role.includes('Actress')).length,
      as_director: filmography.filter(m => m.role_type === 'director').length,
      decades_active: [...new Set(filmography.map(m => m.decade))].length,
      genres: [...new Set(filmography.flatMap(m => m.genres))].slice(0, 10),
    };

    return NextResponse.json({
      celebrity_id: celebrity.id,
      celebrity_name: celebrity.name_en,
      group_by: groupBy,
      filmography: grouped,
      all_movies: filmography,
      stats,
    });
  } catch (error) {
    console.error('Filmography API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getDecade(year?: number): string {
  if (!year) return 'Unknown';
  const decade = Math.floor(year / 10) * 10;
  return `${decade}s`;
}

function getVerdictColor(verdict?: string): string {
  const colors: Record<string, string> = {
    'industry-hit': '#FFD700',
    'blockbuster': '#22C55E',
    'super-hit': '#10B981',
    'hit': '#34D399',
    'average': '#FCD34D',
    'below-average': '#F97316',
    'flop': '#EF4444',
    'disaster': '#DC2626',
  };
  return colors[verdict?.toLowerCase() || ''] || '#6B7280';
}

function normalizeVerdict(verdict?: string): string {
  if (!verdict) return 'unknown';
  const v = verdict.toLowerCase();
  if (['industry-hit', 'blockbuster'].includes(v)) return 'blockbuster';
  if (v === 'super-hit') return 'super-hit';
  if (v === 'hit') return 'hit';
  if (v === 'average') return 'average';
  if (v === 'below-average') return 'below-average';
  if (['flop', 'disaster'].includes(v)) return 'flop';
  return 'unknown';
}

function isHit(verdict?: string): boolean {
  return ['industry-hit', 'blockbuster', 'super-hit', 'hit'].includes(verdict?.toLowerCase() || '');
}

function isFlop(verdict?: string): boolean {
  return ['flop', 'disaster', 'below-average'].includes(verdict?.toLowerCase() || '');
}


