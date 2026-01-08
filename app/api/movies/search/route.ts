import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Movie Search API
 * GET /api/movies/search?q=<query>&limit=<limit>&language=<language>
 * 
 * Searches movies by title (English and Telugu)
 * Pass language=all to search across all languages
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const language = searchParams.get('language') || 'all'; // Changed default to 'all'

  if (!query || query.length < 2) {
    return NextResponse.json({ movies: [], message: 'Query too short' });
  }

  try {
    // Search by title_en or title_te using ilike for case-insensitive matching
    let queryBuilder = supabase
      .from('movies')
      .select(`
        id,
        title_en,
        title_te,
        slug,
        release_year,
        poster_url,
        genres,
        director,
        our_rating,
        language
      `)
      .or(`title_en.ilike.%${query}%,title_te.ilike.%${query}%,slug.ilike.%${query}%`);

    // Only filter by language if not 'all'
    if (language && language !== 'all') {
      queryBuilder = queryBuilder.eq('language', language);
    }

    const { data: movies, error } = await queryBuilder
      .order('our_rating', { ascending: false, nullsFirst: true })
      .order('release_year', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Search error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform for the dashboard
    const results = (movies || []).map(m => ({
      id: m.id,
      title_en: m.title_en,
      title_te: m.title_te,
      slug: m.slug,
      release_year: m.release_year,
      poster_url: m.poster_url,
      genres: m.genres || [],
      director: m.director,
      our_rating: m.our_rating,
      verified: false, // Would need to check movie_verification table
      confidence_score: null, // Would need to check movie_verification table
    }));

    return NextResponse.json({ 
      movies: results,
      total: results.length,
      query
    });
  } catch (err: any) {
    console.error('Search exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

