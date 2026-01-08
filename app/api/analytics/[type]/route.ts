/**
 * Analytics API Endpoint
 * 
 * GET /api/analytics/collaborations?actor=Chiranjeevi
 * GET /api/analytics/director-stats?director=Rajamouli
 * GET /api/analytics/era-trends?decade=2010
 * GET /api/analytics/music-directors
 * GET /api/analytics/verdicts
 * GET /api/analytics/producers
 * GET /api/analytics/quick-stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMovieIntelligenceEngine } from '@/lib/analytics/movie-intelligence';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const { searchParams } = new URL(request.url);
  const engine = getMovieIntelligenceEngine();

  try {
    const { type } = params;

    switch (type) {
      case 'collaborations': {
        const actor = searchParams.get('actor') || undefined;
        const director = searchParams.get('director') || undefined;
        const minMovies = parseInt(searchParams.get('minMovies') || '2');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const data = await engine.getDirectorActorCollaborations(
          actor,
          director,
          minMovies,
          limit
        );
        
        return NextResponse.json({
          success: true,
          type: 'director-actor-collaborations',
          filters: { actor, director, minMovies, limit },
          count: data.length,
          data,
        });
      }

      case 'actor-pairs': {
        const minMovies = parseInt(searchParams.get('minMovies') || '3');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const data = await engine.getActorPairFrequency(minMovies, limit);
        
        return NextResponse.json({
          success: true,
          type: 'actor-pair-frequency',
          filters: { minMovies, limit },
          count: data.length,
          data,
        });
      }

      case 'music-directors': {
        const minMovies = parseInt(searchParams.get('minMovies') || '5');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const data = await engine.getMusicDirectorStats(minMovies, limit);
        
        return NextResponse.json({
          success: true,
          type: 'music-director-stats',
          filters: { minMovies, limit },
          count: data.length,
          data,
        });
      }

      case 'era-trends': {
        const data = await engine.getEraTrends();
        
        return NextResponse.json({
          success: true,
          type: 'era-trends',
          count: data.length,
          data,
        });
      }

      case 'verdicts': {
        const data = await engine.getVerdictDistribution();
        
        return NextResponse.json({
          success: true,
          type: 'verdict-distribution',
          count: data.length,
          data,
        });
      }

      case 'producers': {
        const minMovies = parseInt(searchParams.get('minMovies') || '5');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        const data = await engine.getProducerStats(minMovies, limit);
        
        return NextResponse.json({
          success: true,
          type: 'producer-stats',
          filters: { minMovies, limit },
          count: data.length,
          data,
        });
      }

      case 'quick-stats': {
        const data = await engine.getQuickStats();
        
        return NextResponse.json({
          success: true,
          type: 'quick-stats',
          data,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown analytics type: ${type}`,
            availableTypes: [
              'collaborations',
              'actor-pairs',
              'music-directors',
              'era-trends',
              'verdicts',
              'producers',
              'quick-stats',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

