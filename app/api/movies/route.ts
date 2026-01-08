/**
 * Movies API
 * List and filter movies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Filters
  const genre = searchParams.get('genre');
  const actor = searchParams.get('actor');
  const director = searchParams.get('director');
  const year = searchParams.get('year');
  const yearFrom = searchParams.get('yearFrom');
  const yearTo = searchParams.get('yearTo');
  const minRating = searchParams.get('minRating');
  const underrated = searchParams.get('underrated');
  const blockbuster = searchParams.get('blockbuster');
  const classic = searchParams.get('classic');
  const search = searchParams.get('search');
  const language = searchParams.get('language');

  // Pagination & Sorting
  const sortBy = searchParams.get('sortBy') || 'rating';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .eq('is_published', true);

  // For Telugu, show all published movies (many classics have no poster on TMDB)
  // For other languages, require poster for better UX
  if (language === 'Telugu') {
    // No poster filter - Telugu gets 100% visibility
  } else if (language) {
    query = query.not('poster_url', 'is', null);
  } else {
    // Default: require poster for mixed language results
    query = query.not('poster_url', 'is', null);
  }

  // Apply filters
  if (genre) {
    query = query.contains('genres', [genre]);
  }

  if (actor) {
    // Use exact match for actor name (not partial match)
    // This ensures "Krishna" doesn't match "Balakrishna", "Krishnam Raju", etc.
    query = query.or(`hero.eq.${actor},heroine.eq.${actor}`);
  }

  if (director) {
    query = query.ilike('director', `%${director}%`);
  }

  if (year) {
    query = query.eq('release_year', parseInt(year));
  }

  if (yearFrom) {
    query = query.gte('release_year', parseInt(yearFrom));
  }

  if (yearTo) {
    query = query.lte('release_year', parseInt(yearTo));
  }

  if (minRating) {
    // Use our_rating (editorial) for filtering, fallback to avg_rating
    query = query.or(`our_rating.gte.${parseFloat(minRating)},and(our_rating.is.null,avg_rating.gte.${parseFloat(minRating)})`);
  }

  if (underrated === 'true') {
    query = query.eq('is_underrated', true);
  }

  if (blockbuster === 'true') {
    query = query.eq('is_blockbuster', true);
  }

  if (classic === 'true') {
    query = query.eq('is_classic', true);
  }

  if (language) {
    query = query.eq('language', language);
  }

  if (search) {
    query = query.or(`title_en.ilike.%${search}%,title_te.ilike.%${search}%,director.ilike.%${search}%`);
  }

  // Sorting - use our_rating (editorial) for rating sort, with fallback
  if (sortBy === 'rating') {
    // Sort by our_rating first (editorial), then by avg_rating for movies without editorial rating
    query = query
      .order('our_rating', { ascending: sortOrder === 'asc', nullsFirst: sortOrder === 'asc' ? true : false })
      .order('avg_rating', { ascending: sortOrder === 'asc', nullsFirst: true });
  } else {
    const sortColumn = {
      year: 'release_year',
      reviews: 'total_reviews',
      recent: 'created_at',
    }[sortBy] || 'release_year';
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });
  }
  
  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 });
  }

  return NextResponse.json({
    movies: data,
    total: count,
    limit,
    offset,
  });
}






