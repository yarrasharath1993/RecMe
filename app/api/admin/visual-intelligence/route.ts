/**
 * API Route: Visual Intelligence Admin Data
 * 
 * Provides stats and sample data for the visual intelligence dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get stats
    const [
      { count: totalMovies },
      { count: withConfidence },
      { count: tier1 },
      { count: tier2 },
      { count: tier3 },
      { count: totalReviews },
      { count: withSmartReview },
      { count: needsHumanReview },
    ] = await Promise.all([
      supabase.from('movies').select('*', { count: 'exact', head: true }),
      supabase.from('movies').select('*', { count: 'exact', head: true }).not('poster_confidence', 'is', null),
      supabase.from('movies').select('*', { count: 'exact', head: true }).gte('poster_confidence', 0.9),
      supabase.from('movies').select('*', { count: 'exact', head: true }).gte('poster_confidence', 0.6).lt('poster_confidence', 0.9),
      supabase.from('movies').select('*', { count: 'exact', head: true }).lt('poster_confidence', 0.6),
      supabase.from('movie_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('movie_reviews').select('*', { count: 'exact', head: true }).not('smart_review', 'is', null),
      supabase.from('movie_reviews').select('*', { count: 'exact', head: true }).eq('needs_human_review', true),
    ]);

    // Get sample movies with visual confidence
    const { data: movies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, poster_url, poster_confidence, poster_visual_type, archive_card_data, hero')
      .not('poster_confidence', 'is', null)
      .order('release_year', { ascending: false })
      .limit(12);

    // Get sample reviews with smart review
    const { data: reviews } = await supabase
      .from('movie_reviews')
      .select(`
        id,
        movie_id,
        smart_review,
        needs_human_review,
        movies!inner (
          title_en,
          release_year
        )
      `)
      .not('smart_review', 'is', null)
      .order('smart_review_derived_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      stats: {
        totalMovies: totalMovies || 0,
        withConfidence: withConfidence || 0,
        tier1: tier1 || 0,
        tier2: tier2 || 0,
        tier3: tier3 || 0,
        totalReviews: totalReviews || 0,
        withSmartReview: withSmartReview || 0,
        needsHumanReview: needsHumanReview || 0,
      },
      movies: movies || [],
      reviews: reviews || [],
    });
  } catch (error: any) {
    console.error('Error fetching visual intelligence data:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

