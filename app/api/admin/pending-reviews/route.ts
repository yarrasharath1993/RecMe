import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Pending Reviews API
 * GET /api/admin/pending-reviews?filter=<filter>&page=<page>&limit=<limit>
 * 
 * Returns movies that don't have reviews yet
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filter = searchParams.get('filter') || 'recent';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = (page - 1) * limit;

  try {
    // Build base query for movies without reviews
    let query = supabase
      .from('movies')
      .select(`
        id,
        title_en,
        title_te,
        slug,
        release_year,
        poster_url,
        director,
        our_rating,
        is_classic,
        is_blockbuster,
        language
      `)
      .eq('language', 'Telugu')
      .is('our_rating', null); // Movies without our_rating likely don't have reviews

    // Actually, let's find movies that don't have entries in movie_reviews
    // First, get all movie_ids that have reviews
    const { data: reviewedMovies } = await supabase
      .from('movie_reviews')
      .select('movie_id');
    
    const reviewedIds = new Set((reviewedMovies || []).map(r => r.movie_id));

    // Now get movies without reviews
    let moviesQuery = supabase
      .from('movies')
      .select(`
        id,
        title_en,
        title_te,
        slug,
        release_year,
        poster_url,
        director,
        our_rating,
        is_classic,
        is_blockbuster,
        language
      `)
      .eq('language', 'Telugu');

    // Apply sorting based on filter
    switch (filter) {
      case 'recent':
        moviesQuery = moviesQuery.order('release_year', { ascending: false, nullsFirst: false });
        break;
      case 'classic':
        moviesQuery = moviesQuery
          .lte('release_year', 2000)
          .order('release_year', { ascending: true });
        break;
      case 'popular':
        moviesQuery = moviesQuery
          .not('our_rating', 'is', null)
          .order('our_rating', { ascending: false });
        break;
      default:
        moviesQuery = moviesQuery.order('title_en', { ascending: true });
    }

    // Apply pagination
    moviesQuery = moviesQuery.range(offset, offset + limit - 1);

    const { data: allMovies, error } = await moviesQuery;

    if (error) {
      console.error('Error fetching movies:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter out movies that already have reviews
    const pendingMovies = (allMovies || []).filter(m => !reviewedIds.has(m.id));

    // Transform response
    const movies = pendingMovies.map(m => ({
      id: m.id,
      title_en: m.title_en,
      title_te: m.title_te,
      slug: m.slug,
      release_year: m.release_year,
      poster_url: m.poster_url,
      director: m.director,
      our_rating: m.our_rating,
      verified: false,
      confidence_score: null,
      has_review: false,
      review_status: 'none' as const,
    }));

    // Get total count of pending reviews
    const { count: totalCount } = await supabase
      .from('movies')
      .select('id', { count: 'exact', head: true })
      .eq('language', 'Telugu');

    const pendingCount = (totalCount || 0) - reviewedIds.size;

    return NextResponse.json({
      movies,
      total: pendingCount,
      page,
      limit,
      hasMore: movies.length === limit,
    });
  } catch (err: any) {
    console.error('Pending reviews exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

