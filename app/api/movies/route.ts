/**
 * Movies API
 * 
 * Provides filtered and paginated movie listings for the reviews page grid view.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { detectCategories, type SpecialCategory } from '@/lib/movies/special-categories';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Pagination
  const limit = parseInt(searchParams.get('limit') || '24');
  const offset = parseInt(searchParams.get('offset') || '0');
  
  // Filters
  const language = searchParams.get('language') || 'Telugu';
  const genre = searchParams.get('genre');
  const actor = searchParams.get('actor');
  const director = searchParams.get('director');
  const yearFrom = searchParams.get('yearFrom');
  const yearTo = searchParams.get('yearTo');
  const minRating = searchParams.get('minRating');
  const underrated = searchParams.get('underrated') === 'true';
  const blockbuster = searchParams.get('blockbuster') === 'true';
  const classic = searchParams.get('classic') === 'true';
  const specialCategory = searchParams.get('specialCategory');
  
  // Sorting
  const sortBy = searchParams.get('sortBy') || 'rating';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  try {
    let query = supabase
      .from('movies')
      .select('*')
      .eq('is_published', true)
      .eq('language', language);

    // Apply filters
    if (genre) {
      query = query.contains('genres', [genre]);
    }
    
    if (actor) {
      // Use exact match for actor names to avoid "N.T. Rama Rao" matching "N.T. Rama Rao Jr."
      query = query.or(`hero.eq.${actor},heroine.eq.${actor}`);
    }
    
    if (director) {
      query = query.ilike('director', `%${director}%`);
    }
    
    if (yearFrom) {
      query = query.gte('release_year', parseInt(yearFrom));
    }
    
    if (yearTo) {
      query = query.lte('release_year', parseInt(yearTo));
    }
    
    if (minRating) {
      query = query.gte('our_rating', parseFloat(minRating));
    }
    
    if (underrated) {
      query = query.eq('is_underrated', true);
    }
    
    if (blockbuster) {
      query = query.eq('is_blockbuster', true);
    }
    
    if (classic) {
      query = query.eq('is_classic', true);
    }
    
    // Note: specialCategory filter will be applied after fetching
    // because we need to handle both database column and auto-detection fallback
    const hasSpecialCategoryFilter = !!specialCategory;

    // Apply sorting
    const sortColumn = sortBy === 'rating' ? 'our_rating' : 
                       sortBy === 'year' ? 'release_year' :
                       sortBy === 'reviews' ? 'total_reviews' :
                       sortBy === 'title' ? 'title_en' : 'our_rating';
    
    query = query.order(sortColumn, { ascending: sortOrder === 'asc', nullsFirst: false });
    
    // Apply pagination
    // For special category filtering, fetch a larger batch to account for filtering
    // Then filter and paginate the results
    const fetchLimit = hasSpecialCategoryFilter ? 200 : limit;
    const fetchOffset = hasSpecialCategoryFilter ? 0 : offset;
    query = query.range(fetchOffset, fetchOffset + fetchLimit - 1);

    const { data: movies, error } = await query;

    if (error) {
      console.error('Error fetching movies:', error);
      return NextResponse.json({ movies: [], error: error.message }, { status: 500 });
    }

    // Apply special category filter with fallback to auto-detection
    let filteredMovies = movies || [];
    if (hasSpecialCategoryFilter && specialCategory) {
      filteredMovies = (movies || []).filter(movie => {
        // First, check if movie has special_categories column populated
        if (movie.special_categories && Array.isArray(movie.special_categories) && movie.special_categories.length > 0) {
          return movie.special_categories.includes(specialCategory as SpecialCategory);
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
        
        return detectedCategories.includes(specialCategory as SpecialCategory);
      });
      
      // Apply pagination to filtered results
      filteredMovies = filteredMovies.slice(offset, offset + limit);
    }

    // Map to MovieCard format
    const mappedMovies = filteredMovies.map(m => ({
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

    return NextResponse.json({
      movies: mappedMovies,
      total: filteredMovies.length,
      hasMore: hasSpecialCategoryFilter ? filteredMovies.length >= limit : (movies?.length || 0) >= limit,
    });
  } catch (error) {
    console.error('Movies API error:', error);
    return NextResponse.json({ movies: [], error: String(error) }, { status: 500 });
  }
}

