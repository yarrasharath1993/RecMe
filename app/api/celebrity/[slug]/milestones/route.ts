/**
 * Celebrity Milestones API
 * GET /api/celebrity/[slug]/milestones
 * Returns career milestones for timeline visualization
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

    // Find celebrity
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('id, name_en, name_te, debut_movie, breakthrough_movie, peak_year, era')
      .eq('slug', slug)
      .single();

    if (celebrityError || !celebrity) {
      return NextResponse.json(
        { error: 'Celebrity not found' },
        { status: 404 }
      );
    }

    // Fetch milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('celebrity_milestones')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .eq('is_published', true)
      .order('year', { ascending: true });

    if (milestonesError) {
      console.error('Milestones query error:', milestonesError);
      return NextResponse.json(
        { error: 'Failed to fetch milestones' },
        { status: 500 }
      );
    }

    // Categorize milestones
    const debut = (milestones || []).find(m => m.milestone_type === 'debut');
    const breakthrough = (milestones || []).find(m => m.milestone_type === 'breakthrough');
    const peak = (milestones || []).find(m => m.milestone_type === 'peak');
    const comebacks = (milestones || []).filter(m => m.milestone_type === 'comeback');
    const records = (milestones || []).filter(m => m.milestone_type === 'record');
    const downfalls = (milestones || []).filter(m => m.milestone_type === 'downfall');

    // Build timeline
    const timeline = (milestones || []).map(m => ({
      ...m,
      icon: getMilestoneIcon(m.milestone_type),
      color: getMilestoneColor(m.milestone_type),
    }));

    // Career summary
    const careerSummary = {
      debut_year: debut?.year,
      debut_movie: debut?.movie_title || celebrity.debut_movie,
      breakthrough_year: breakthrough?.year,
      breakthrough_movie: breakthrough?.movie_title || celebrity.breakthrough_movie,
      peak_year: peak?.year || celebrity.peak_year,
      era: celebrity.era,
      total_milestones: (milestones || []).length,
      comebacks_count: comebacks.length,
      records_count: records.length,
    };

    return NextResponse.json({
      celebrity_id: celebrity.id,
      celebrity_name: celebrity.name_en,
      celebrity_name_te: celebrity.name_te,
      milestones: milestones || [],
      timeline,
      career_summary: careerSummary,
      highlights: {
        debut,
        breakthrough,
        peak,
        comebacks,
        records,
        downfalls,
      },
    });
  } catch (error) {
    console.error('Milestones API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getMilestoneIcon(type: string): string {
  const icons: Record<string, string> = {
    debut: '🎬',
    breakthrough: '🚀',
    peak: '⭐',
    comeback: '🔥',
    downfall: '📉',
    retirement: '🎭',
    award: '🏆',
    record: '📊',
  };
  return icons[type] || '📌';
}

function getMilestoneColor(type: string): string {
  const colors: Record<string, string> = {
    debut: '#3B82F6', // blue
    breakthrough: '#22C55E', // green
    peak: '#F59E0B', // amber
    comeback: '#EF4444', // red
    downfall: '#6B7280', // gray
    retirement: '#8B5CF6', // purple
    award: '#FFD700', // gold
    record: '#EC4899', // pink
  };
  return colors[type] || '#6B7280';
}


