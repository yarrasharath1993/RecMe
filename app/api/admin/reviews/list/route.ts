import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/reviews/list
 * 
 * Fetches movies with their review status for the admin review management page.
 * Supports search, filtering, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build query for movies
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
        hero,
        genres,
        our_rating,
        movie_reviews (
          id,
          overall_rating,
          reviewer_type,
          status,
          summary,
          updated_at
        )
      `, { count: 'exact' })
      .eq('is_published', true)
      .order('release_year', { ascending: false })
      .order('title_en', { ascending: true });

    // Apply search filter
    if (search) {
      query = query.or(`title_en.ilike.%${search}%,title_te.ilike.%${search}%,director.ilike.%${search}%,hero.ilike.%${search}%`);
    }

    // Apply category filter (handled post-query for review-based filters)
    const { data: movies, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching movies:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Transform data - flatten movie_reviews array to single review
    let transformedMovies = (movies || []).map((movie: any) => ({
      ...movie,
      review: movie.movie_reviews?.[0] || null,
      movie_reviews: undefined,
    }));

    // Apply filter (post-query for review-based filtering)
    if (filter === 'with-review') {
      transformedMovies = transformedMovies.filter((m: any) => m.review);
    } else if (filter === 'missing') {
      transformedMovies = transformedMovies.filter((m: any) => !m.review);
    } else if (filter === 'ai') {
      transformedMovies = transformedMovies.filter((m: any) => m.review && m.review.reviewer_type !== 'admin');
    } else if (filter === 'human') {
      transformedMovies = transformedMovies.filter((m: any) => m.review && m.review.reviewer_type === 'admin');
    }

    // Get stats
    const { count: totalMovies } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: withReviews } = await supabase
      .from('movies')
      .select('*, movie_reviews!inner(*)', { count: 'exact', head: true })
      .eq('is_published', true);

    const { count: aiGenerated } = await supabase
      .from('movie_reviews')
      .select('*', { count: 'exact', head: true })
      .neq('reviewer_type', 'admin');

    const { count: humanEdited } = await supabase
      .from('movie_reviews')
      .select('*', { count: 'exact', head: true })
      .eq('reviewer_type', 'admin');

    const stats = {
      total: totalMovies || 0,
      withReviews: withReviews || 0,
      aiGenerated: aiGenerated || 0,
      humanEdited: humanEdited || 0,
      coverage: totalMovies ? ((withReviews || 0) / totalMovies) * 100 : 0,
    };

    return NextResponse.json({
      success: true,
      movies: transformedMovies,
      stats,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error in reviews list API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


