import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/admin/reviews/[id]
 * 
 * Fetches a movie and its review by movie ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: movieId } = await params;

    // Fetch movie
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select(`
        id,
        title_en,
        title_te,
        slug,
        release_year,
        poster_url,
        backdrop_url,
        director,
        hero,
        heroine,
        genres,
        synopsis
      `)
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Fetch existing review
    const { data: review } = await supabase
      .from('movie_reviews')
      .select('*')
      .eq('movie_id', movieId)
      .single();

    return NextResponse.json({
      success: true,
      movie,
      review: review || null,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/reviews/[id]
 * 
 * Creates or updates a movie review.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: movieId } = await params;
    const body = await request.json();

    // Validate movie exists
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('id, title_en')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Check if review exists
    const { data: existingReview } = await supabase
      .from('movie_reviews')
      .select('id')
      .eq('movie_id', movieId)
      .single();

    // Prepare review data
    const reviewData = {
      movie_id: movieId,
      
      // Ratings
      overall_rating: body.overall_rating || 7,
      direction_rating: body.direction_rating,
      screenplay_rating: body.screenplay_rating,
      acting_rating: body.acting_rating,
      music_rating: body.music_rating,
      cinematography_rating: body.cinematography_rating,
      production_rating: body.production_rating,
      entertainment_rating: body.entertainment_rating,
      
      // Content
      title: body.title,
      title_te: body.title_te,
      summary: body.summary,
      summary_te: body.summary_te,
      verdict: body.verdict,
      verdict_te: body.verdict_te,
      
      // Section Reviews
      direction_review: body.direction_review,
      screenplay_review: body.screenplay_review,
      acting_review: body.acting_review,
      music_review: body.music_review,
      cinematography_review: body.cinematography_review,
      
      // Tags
      strengths: body.strengths || [],
      weaknesses: body.weaknesses || [],
      recommended_for: body.recommended_for || [],
      
      // Meta
      reviewer_type: body.reviewer_type || 'admin',
      reviewer_name: body.reviewer_name || 'TeluguVibes Editor',
      is_featured: body.is_featured ?? false,
      is_spoiler_free: body.is_spoiler_free ?? true,
      status: body.status || 'draft',
      worth_watching: body.worth_watching ?? true,
      
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingReview) {
      // Update existing review
      const { data, error } = await supabase
        .from('movie_reviews')
        .update(reviewData)
        .eq('id', existingReview.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating review:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      result = data;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('movie_reviews')
        .insert({
          ...reviewData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating review:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      result = data;
    }

    // Update movie's total_reviews count if this was a new review
    if (!existingReview) {
      await supabase.rpc('increment_movie_reviews', { movie_id: movieId }).catch(() => {
        // RPC might not exist, ignore
      });
    }

    return NextResponse.json({
      success: true,
      review: result,
      message: existingReview ? 'Review updated' : 'Review created',
    });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/reviews/[id]
 * 
 * Deletes a movie review.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: movieId } = await params;

    const { error } = await supabase
      .from('movie_reviews')
      .delete()
      .eq('movie_id', movieId);

    if (error) {
      console.error('Error deleting review:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Review deleted',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


