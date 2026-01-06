/**
 * Celebrity Awards API
 * GET /api/celebrity/[slug]/awards
 * Returns all awards for a celebrity
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // national, filmfare, nandi, siima, cinemaa
    const year = searchParams.get('year');

    // Find celebrity
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('id, name_en')
      .eq('slug', slug)
      .single();

    if (celebrityError || !celebrity) {
      return NextResponse.json(
        { error: 'Celebrity not found' },
        { status: 404 }
      );
    }

    // Build awards query
    let query = supabase
      .from('celebrity_awards')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .order('year', { ascending: false });

    if (type) {
      query = query.eq('award_type', type);
    }

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data: awards, error: awardsError } = await query;

    if (awardsError) {
      console.error('Awards query error:', awardsError);
      return NextResponse.json(
        { error: 'Failed to fetch awards' },
        { status: 500 }
      );
    }

    // Group awards by type
    const awardsByType: Record<string, any[]> = {};
    for (const award of awards || []) {
      const type = award.award_type || 'other';
      if (!awardsByType[type]) {
        awardsByType[type] = [];
      }
      awardsByType[type].push(award);
    }

    // Group awards by year
    const awardsByYear: Record<number, any[]> = {};
    for (const award of awards || []) {
      if (award.year) {
        if (!awardsByYear[award.year]) {
          awardsByYear[award.year] = [];
        }
        awardsByYear[award.year].push(award);
      }
    }

    // Calculate summary
    const summary = {
      total: (awards || []).length,
      won: (awards || []).filter(a => a.is_won).length,
      nominated: (awards || []).filter(a => a.is_nomination && !a.is_won).length,
      by_type: {
        national: (awards || []).filter(a => a.award_type === 'national').length,
        filmfare: (awards || []).filter(a => a.award_type === 'filmfare').length,
        nandi: (awards || []).filter(a => a.award_type === 'nandi').length,
        siima: (awards || []).filter(a => a.award_type === 'siima').length,
        cinemaa: (awards || []).filter(a => a.award_type === 'cinemaa').length,
        other: (awards || []).filter(a => a.award_type === 'other').length,
      },
    };

    // Get available years for filtering
    const years = [...new Set((awards || []).map(a => a.year).filter(Boolean))].sort((a, b) => b - a);

    return NextResponse.json({
      celebrity_id: celebrity.id,
      celebrity_name: celebrity.name_en,
      awards: awards || [],
      by_type: awardsByType,
      by_year: awardsByYear,
      summary,
      available_years: years,
    });
  } catch (error) {
    console.error('Awards API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


