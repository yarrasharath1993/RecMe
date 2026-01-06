/**
 * Celebrity Profile API
 * GET /api/celebrity/[slug]
 * Returns full celebrity profile with awards, milestones, and filmography
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

    // Fetch celebrity profile
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', slug)
      .single();

    if (celebrityError || !celebrity) {
      return NextResponse.json(
        { error: 'Celebrity not found' },
        { status: 404 }
      );
    }

    // Fetch awards
    const { data: awards } = await supabase
      .from('celebrity_awards')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .eq('is_won', true)
      .order('year', { ascending: false });

    // Fetch milestones
    const { data: milestones } = await supabase
      .from('celebrity_milestones')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .eq('is_published', true)
      .order('year', { ascending: true });

    // Fetch trivia
    const { data: trivia } = await supabase
      .from('celebrity_trivia')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    // Fetch filmography
    const celebrityName = celebrity.name_en;
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, title_te, slug, release_year, poster_url, our_rating, verdict, box_office_category, genres, director, is_blockbuster')
      .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
      .eq('is_published', true)
      .order('release_year', { ascending: false });

    // Transform filmography
    const filmography = (movies || []).map(movie => ({
      movie_id: movie.id,
      title_en: movie.title_en,
      title_te: movie.title_te,
      slug: movie.slug,
      release_year: movie.release_year,
      poster_url: movie.poster_url,
      our_rating: movie.our_rating,
      verdict: movie.verdict || movie.box_office_category,
      verdict_color: getVerdictColor(movie.box_office_category),
      genres: movie.genres,
      director: movie.director,
      is_blockbuster: movie.is_blockbuster,
    }));

    // Fetch related celebrities (frequent collaborators)
    const relatedCelebrities = await fetchRelatedCelebrities(celebrity.id, celebrityName);

    // Calculate awards summary
    const awardsSummary = {
      total: (awards || []).length,
      national: (awards || []).filter(a => a.award_type === 'national').length,
      filmfare: (awards || []).filter(a => a.award_type === 'filmfare').length,
      nandi: (awards || []).filter(a => a.award_type === 'nandi').length,
      siima: (awards || []).filter(a => a.award_type === 'siima').length,
      other: (awards || []).filter(a => !['national', 'filmfare', 'nandi', 'siima'].includes(a.award_type)).length,
    };

    // Calculate career stats
    const careerStats = {
      total_movies: celebrity.total_movies || filmography.length,
      hits: celebrity.hits_count || filmography.filter(m => isHit(m.verdict)).length,
      flops: celebrity.flops_count || filmography.filter(m => isFlop(m.verdict)).length,
      hit_rate: celebrity.hit_rate || 0,
      active_years: getActiveYears(filmography),
      peak_year: celebrity.peak_year,
      debut_movie: celebrity.debut_movie,
      awards_won: awardsSummary.total,
    };

    return NextResponse.json({
      celebrity: {
        ...celebrity,
        career_stats: careerStats,
        awards_summary: awardsSummary,
      },
      awards: awards || [],
      milestones: milestones || [],
      trivia: trivia || [],
      filmography,
      related_celebrities: relatedCelebrities,
    });
  } catch (error) {
    console.error('Celebrity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
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

function isHit(verdict?: string): boolean {
  return ['industry-hit', 'blockbuster', 'super-hit', 'hit'].includes(verdict?.toLowerCase() || '');
}

function isFlop(verdict?: string): boolean {
  return ['flop', 'disaster', 'below-average'].includes(verdict?.toLowerCase() || '');
}

function getActiveYears(filmography: any[]): string {
  if (filmography.length === 0) return 'N/A';
  const years = filmography.map(m => m.release_year).filter(Boolean).sort();
  const min = years[0];
  const max = years[years.length - 1];
  const current = new Date().getFullYear();
  return `${min}-${max === current ? 'Present' : max}`;
}

async function fetchRelatedCelebrities(celebrityId: string, celebrityName: string) {
  try {
    // Find frequent co-stars and directors
    const { data: movies } = await supabase
      .from('movies')
      .select('hero, heroine, director')
      .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
      .eq('is_published', true);

    if (!movies) return [];

    const collaborators = new Map<string, { count: number; type: string }>();

    for (const movie of movies) {
      // Add co-stars and directors (excluding the celebrity themselves)
      const names = [movie.hero, movie.heroine, movie.director].filter(Boolean);
      for (const name of names) {
        if (name.toLowerCase() !== celebrityName.toLowerCase()) {
          const existing = collaborators.get(name) || { count: 0, type: 'costar' };
          existing.count++;
          if (name === movie.director) existing.type = 'director';
          collaborators.set(name, existing);
        }
      }
    }

    // Get top 5 collaborators
    const topCollaborators = Array.from(collaborators.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5);

    // Fetch celebrity details for collaborators
    const related = [];
    for (const [name, { count, type }] of topCollaborators) {
      const { data: celeb } = await supabase
        .from('celebrities')
        .select('id, slug, name_en, name_te, profile_image, occupation')
        .ilike('name_en', `%${name}%`)
        .limit(1)
        .single();

      if (celeb) {
        related.push({
          ...celeb,
          collaboration_count: count,
          relation_type: type,
        });
      }
    }

    return related;
  } catch (error) {
    console.error('Error fetching related celebrities:', error);
    return [];
  }
}


