/**
 * Celebrity Trivia API
 * GET /api/celebrity/[slug]/trivia
 * Returns trivia and fun facts about a celebrity
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
    const category = searchParams.get('category'); // personal, career, fun_fact, controversy

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

    // Build trivia query
    let query = supabase
      .from('celebrity_trivia')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .eq('is_published', true)
      .order('display_order', { ascending: true });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: trivia, error: triviaError } = await query;

    if (triviaError) {
      console.error('Trivia query error:', triviaError);
      return NextResponse.json(
        { error: 'Failed to fetch trivia' },
        { status: 500 }
      );
    }

    // Group trivia by category
    const byCategory: Record<string, any[]> = {
      personal: [],
      career: [],
      fun_fact: [],
      controversy: [],
      family: [],
      education: [],
    };

    for (const item of trivia || []) {
      const cat = item.category || 'fun_fact';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    }

    // Category labels
    const categoryLabels: Record<string, { en: string; te: string; icon: string }> = {
      personal: { en: 'Personal Life', te: 'వ్యక్తిగత జీవితం', icon: '👤' },
      career: { en: 'Career Facts', te: 'కెరీర్ విషయాలు', icon: '🎬' },
      fun_fact: { en: 'Fun Facts', te: 'ఆసక్తికర విషయాలు', icon: '🎉' },
      controversy: { en: 'Controversies', te: 'వివాదాలు', icon: '⚡' },
      family: { en: 'Family', te: 'కుటుంబం', icon: '👨‍👩‍👧‍👦' },
      education: { en: 'Education', te: 'విద్య', icon: '🎓' },
    };

    // Build response with metadata
    const categorizedTrivia = Object.entries(byCategory)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({
        category,
        label: categoryLabels[category],
        items,
        count: items.length,
      }));

    return NextResponse.json({
      celebrity_id: celebrity.id,
      celebrity_name: celebrity.name_en,
      trivia: trivia || [],
      by_category: categorizedTrivia,
      total: (trivia || []).length,
      verified_count: (trivia || []).filter(t => t.is_verified).length,
      available_categories: Object.keys(byCategory).filter(c => byCategory[c].length > 0),
    });
  } catch (error) {
    console.error('Trivia API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


