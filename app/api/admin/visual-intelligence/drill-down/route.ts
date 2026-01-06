/**
 * API Route: Visual Intelligence Drill-Down
 * 
 * Provides paginated filtered data for the visual intelligence dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type FilterType = 
  | 'all' 
  | 'with_confidence' 
  | 'tier1' 
  | 'tier2' 
  | 'tier3' 
  | 'all_reviews'
  | 'with_smart_review' 
  | 'needs_human_review';

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const searchParams = request.nextUrl.searchParams;
  
  const filter = (searchParams.get('filter') || 'all') as FilterType;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    // Movie filters
    if (['all', 'with_confidence', 'tier1', 'tier2', 'tier3'].includes(filter)) {
      let query = supabase
        .from('movies')
        .select('id, title_en, release_year, poster_url, poster_confidence, poster_visual_type, archive_card_data, hero, is_published', { count: 'exact' });
      
      switch (filter) {
        case 'with_confidence':
          query = query.not('poster_confidence', 'is', null);
          break;
        case 'tier1':
          query = query.gte('poster_confidence', 0.9);
          break;
        case 'tier2':
          query = query.gte('poster_confidence', 0.6).lt('poster_confidence', 0.9);
          break;
        case 'tier3':
          query = query.lt('poster_confidence', 0.6);
          break;
      }
      
      const { data, count, error } = await query
        .order('release_year', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return NextResponse.json({
        items: data || [],
        total: count || 0,
        page,
        pageSize,
      });
    }
    
    // Review filters
    if (['all_reviews', 'with_smart_review', 'needs_human_review'].includes(filter)) {
      let query = supabase
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
        `, { count: 'exact' });
      
      switch (filter) {
        case 'with_smart_review':
          query = query.not('smart_review', 'is', null);
          break;
        case 'needs_human_review':
          query = query.eq('needs_human_review', true);
          break;
      }
      
      const { data, count, error } = await query
        .order('id', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return NextResponse.json({
        items: data || [],
        total: count || 0,
        page,
        pageSize,
      });
    }

    return NextResponse.json({ error: 'Invalid filter' }, { status: 400 });
  } catch (error: any) {
    console.error('Error fetching drill-down data:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

