/**
 * Movie CRUD API
 * 
 * GET /api/admin/movies/[id] - Get movie details
 * PUT /api/admin/movies/[id] - Update movie
 * DELETE /api/admin/movies/[id] - Delete movie
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - Fetch movie details with all related data
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Fetch movie
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (movieError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found', details: movieError?.message },
        { status: 404 }
      );
    }

    // Fetch related review
    const { data: review } = await supabase
      .from('movie_reviews')
      .select('*')
      .eq('movie_id', id)
      .single();

    // Fetch verification data
    const { data: verification } = await supabase
      .from('movie_verification')
      .select('*')
      .eq('movie_id', id)
      .single();

    // Fetch extended cast
    const { data: cast } = await supabase
      .from('movie_cast')
      .select('*')
      .eq('movie_id', id)
      .order('cast_order', { ascending: true });

    return NextResponse.json({
      movie,
      review,
      verification,
      cast,
      _meta: {
        hasReview: !!review,
        hasVerification: !!verification,
        castCount: cast?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update movie fields
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { fields, source = 'admin_manual' } = body;

    if (!fields || typeof fields !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request: fields object required' },
        { status: 400 }
      );
    }

    // Allowed fields for update
    const allowedFields = [
      'title_en', 'title_te', 'synopsis', 'synopsis_te',
      'release_date', 'release_year', 'runtime',
      'director', 'hero', 'heroine', 'music_director', 'producer',
      'genre', 'language', 'certification',
      'poster_url', 'backdrop_url',
      'tmdb_id', 'imdb_id',
      'budget', 'box_office', 'ott_platform',
      'verified', 'confidence_score',
    ];

    // Filter to allowed fields
    const updateFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (allowedFields.includes(key)) {
        updateFields[key] = value;
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add metadata
    updateFields.updated_at = new Date().toISOString();
    updateFields.last_enriched_by = source;

    // Update movie
    const { data: movie, error } = await supabase
      .from('movies')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update movie', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movie,
      updatedFields: Object.keys(updateFields),
    });
  } catch (error) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete movie and related data
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    // Check if movie exists
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en')
      .eq('id', id)
      .single();

    if (fetchError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Delete related data first (cascading)
    await supabase.from('movie_reviews').delete().eq('movie_id', id);
    await supabase.from('movie_verification').delete().eq('movie_id', id);
    await supabase.from('movie_cast').delete().eq('movie_id', id);

    // Delete movie
    const { error: deleteError } = await supabase
      .from('movies')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete movie', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Movie "${movie.title_en}" deleted successfully`,
      deletedId: id,
    });
  } catch (error) {
    console.error('Error deleting movie:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

