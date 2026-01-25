import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for collaborator statistics
interface Collaborator {
  name: string;
  count: number;
  movies: Array<{ title: string; year: number; slug: string }>;
}

interface CollaboratorsByRole {
  directors: Collaborator[];
  music_directors: Collaborator[];
  cinematographers: Collaborator[];
  writers: Collaborator[];
  editors: Collaborator[];
  producers: Collaborator[];
}

interface Milestone {
  title: string;
  year: number;
  slug: string;
  rating?: number;
}

interface GenreMilestones {
  cult_classics: Milestone[];
  award_winners: Milestone[];
  commercial_hits: Milestone[];
  top_rated: Milestone[];
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

interface ActorStatsResponse {
  actor: string;
  collaborators: CollaboratorsByRole;
  milestones: GenreMilestones;
  career_stats: CareerStats;
}

// Helper to aggregate collaborators by field
function aggregateCollaborators(
  movies: Array<{
    title_en: string;
    release_year: number;
    slug: string;
    [key: string]: unknown;
  }>,
  field: string
): Collaborator[] {
  const collabMap = new Map<string, { count: number; movies: Array<{ title: string; year: number; slug: string }> }>();

  for (const movie of movies) {
    const name = movie[field] as string | null;
    if (!name) continue;

    const existing = collabMap.get(name);
    if (existing) {
      existing.count++;
      existing.movies.push({
        title: movie.title_en,
        year: movie.release_year,
        slug: movie.slug,
      });
    } else {
      collabMap.set(name, {
        count: 1,
        movies: [{
          title: movie.title_en,
          year: movie.release_year,
          slug: movie.slug,
        }],
      });
    }
  }

  // Convert to array and sort by count descending
  return Array.from(collabMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      movies: data.movies.sort((a, b) => b.year - a.year),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // Top 10 collaborators per role
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const actor = searchParams.get('actor');

  if (!actor) {
    return NextResponse.json({ error: 'Actor name is required' }, { status: 400 });
  }

  try {
    // Fetch all movies where the actor is hero or heroine
    const { data: movies, error } = await supabase
      .from('movies')
      .select(`
        id, title_en, title_te, slug, release_year, our_rating, avg_rating,
        director, music_director, cinematographer, writer, editor, producer,
        is_blockbuster, is_classic, is_underrated, genres,
        hero, heroine, supporting_cast
      `)
      .eq('is_published', true)
      .eq('language', 'Telugu')
      .or(`hero.ilike.%${actor}%,heroine.ilike.%${actor}%`)
      .order('release_year', { ascending: true });

    if (error) {
      console.error('Error fetching actor movies:', error);
      return NextResponse.json({ error: 'Failed to fetch actor data' }, { status: 500 });
    }

    if (!movies || movies.length === 0) {
      return NextResponse.json({ error: 'No movies found for this actor' }, { status: 404 });
    }

    // Aggregate collaborators by role
    const collaborators: CollaboratorsByRole = {
      directors: aggregateCollaborators(movies, 'director'),
      music_directors: aggregateCollaborators(movies, 'music_director'),
      cinematographers: aggregateCollaborators(movies, 'cinematographer'),
      writers: aggregateCollaborators(movies, 'writer'),
      editors: aggregateCollaborators(movies, 'editor'),
      producers: aggregateCollaborators(movies, 'producer'),
    };

    // Identify milestones
    const milestones: GenreMilestones = {
      cult_classics: movies
        .filter(m => m.is_classic || m.is_underrated)
        .map(m => ({
          title: m.title_en,
          year: m.release_year,
          slug: m.slug,
          rating: m.our_rating || m.avg_rating,
        }))
        .slice(0, 5),

      award_winners: movies
        .filter(m => {
          // Check for National Award, Filmfare, etc. in genres or if highly rated classics
          const rating = m.our_rating || m.avg_rating || 0;
          return m.is_classic && rating >= 8;
        })
        .map(m => ({
          title: m.title_en,
          year: m.release_year,
          slug: m.slug,
          rating: m.our_rating || m.avg_rating,
        }))
        .slice(0, 5),

      commercial_hits: movies
        .filter(m => m.is_blockbuster)
        .map(m => ({
          title: m.title_en,
          year: m.release_year,
          slug: m.slug,
          rating: m.our_rating || m.avg_rating,
        }))
        .slice(0, 5),

      top_rated: [...movies]
        .filter(m => (m.our_rating || m.avg_rating || 0) >= 7)
        .sort((a, b) => (b.our_rating || b.avg_rating || 0) - (a.our_rating || a.avg_rating || 0))
        .slice(0, 5)
        .map(m => ({
          title: m.title_en,
          year: m.release_year,
          slug: m.slug,
          rating: m.our_rating || m.avg_rating,
        })),
    };

    // Calculate career stats
    const years = movies.map(m => m.release_year).filter((y): y is number => y !== null);
    const ratings = movies
      .map(m => m.our_rating || m.avg_rating)
      .filter((r): r is number => r !== null && r > 0);

    const firstYear = Math.min(...years);
    const lastYear = Math.max(...years);
    const decadesActive = Math.ceil((lastYear - firstYear + 1) / 10);

    const blockbusters = movies.filter(m => m.is_blockbuster).length;
    const classics = movies.filter(m => m.is_classic).length;

    // Hit rate: movies with rating >= 7
    const hits = movies.filter(m => (m.our_rating || m.avg_rating || 0) >= 7).length;

    const career_stats: CareerStats = {
      total_movies: movies.length,
      first_year: firstYear,
      last_year: lastYear,
      decades_active: decadesActive,
      avg_rating: ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : 0,
      hit_rate: movies.length > 0
        ? Math.round((hits / movies.length) * 100)
        : 0,
      blockbusters,
      classics,
    };

    const response: ActorStatsResponse = {
      actor,
      collaborators,
      milestones,
      career_stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Actor stats API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
