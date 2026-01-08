/**
 * Pipeline Control API
 * 
 * POST /api/admin/pipeline - Start/control enrichment pipelines
 * GET /api/admin/pipeline - Get pipeline status
 * 
 * Wraps enrich-master.ts logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

type PipelineType = 
  | 'full_enrich'
  | 'images_only'
  | 'reviews_only'
  | 'verification'
  | 'cast_crew';

interface PipelineStatus {
  id: string;
  type: PipelineType;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
  options: Record<string, unknown>;
  results?: {
    successCount: number;
    failureCount: number;
    errors: string[];
  };
}

// In-memory pipeline tracking (in production, use Redis or DB)
const activePipelines: Map<string, PipelineStatus> = new Map();

/**
 * GET - Get pipeline status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pipelineId = searchParams.get('id');

  if (pipelineId) {
    const pipeline = activePipelines.get(pipelineId);
    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(pipeline);
  }

  // Return all active pipelines
  const pipelines = Array.from(activePipelines.values());
  
  return NextResponse.json({
    activePipelines: pipelines.filter(p => p.status === 'running'),
    recentPipelines: pipelines
      .filter(p => p.status !== 'running')
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 10),
  });
}

/**
 * POST - Start or control a pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, type, options = {} } = body;

    if (action === 'cancel') {
      // Cancel a running pipeline
      const { pipelineId } = body;
      const pipeline = activePipelines.get(pipelineId);
      
      if (!pipeline) {
        return NextResponse.json(
          { error: 'Pipeline not found' },
          { status: 404 }
        );
      }

      pipeline.status = 'cancelled';
      pipeline.completedAt = new Date().toISOString();

      return NextResponse.json({
        success: true,
        message: 'Pipeline cancelled',
        pipeline,
      });
    }

    if (action === 'start') {
      // Start a new pipeline
      const pipelineType = type as PipelineType;
      
      if (!pipelineType) {
        return NextResponse.json(
          { error: 'Pipeline type required' },
          { status: 400 }
        );
      }

      // Check if similar pipeline is already running
      const running = Array.from(activePipelines.values())
        .find(p => p.type === pipelineType && p.status === 'running');

      if (running) {
        return NextResponse.json(
          { error: `Pipeline of type ${pipelineType} is already running`, pipelineId: running.id },
          { status: 409 }
        );
      }

      // Determine movies to process
      const movies = await getMoviesToProcess(pipelineType, options);
      
      if (movies.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No movies match the criteria',
        });
      }

      // Create pipeline
      const pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const pipeline: PipelineStatus = {
        id: pipelineId,
        type: pipelineType,
        status: 'running',
        startedAt: new Date().toISOString(),
        progress: {
          total: movies.length,
          completed: 0,
          failed: 0,
          percentage: 0,
        },
        options,
      };

      activePipelines.set(pipelineId, pipeline);

      // Start pipeline in background
      runPipeline(pipelineId, pipelineType, movies, options).catch(console.error);

      return NextResponse.json({
        success: true,
        message: 'Pipeline started',
        pipelineId,
        totalMovies: movies.length,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "start" or "cancel"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling pipeline request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function getMoviesToProcess(
  type: PipelineType,
  options: Record<string, unknown>
): Promise<Array<{ id: string; title_en: string; release_year: number }>> {
  let query = supabase.from('movies').select('id, title_en, release_year');

  // Apply filters based on options
  if (options.language) {
    query = query.eq('language', options.language);
  }

  if (options.yearFrom) {
    query = query.gte('release_year', options.yearFrom);
  }

  if (options.yearTo) {
    query = query.lte('release_year', options.yearTo);
  }

  // Type-specific filters
  switch (type) {
    case 'images_only':
      query = query.or('poster_url.is.null,backdrop_url.is.null');
      break;
    case 'reviews_only':
      // Movies without reviews - need subquery
      break;
    case 'verification':
      query = query.eq('verified', false);
      break;
    case 'cast_crew':
      query = query.or('hero.is.null,director.is.null');
      break;
  }

  // Limit
  const limit = typeof options.limit === 'number' ? Math.min(options.limit, 500) : 100;
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching movies for pipeline:', error);
    return [];
  }

  return data || [];
}

async function runPipeline(
  pipelineId: string,
  type: PipelineType,
  movies: Array<{ id: string; title_en: string; release_year: number }>,
  options: Record<string, unknown>
): Promise<void> {
  const pipeline = activePipelines.get(pipelineId);
  if (!pipeline) return;

  const errors: string[] = [];
  const concurrency = typeof options.concurrency === 'number' ? Math.min(options.concurrency, 5) : 3;

  try {
    for (let i = 0; i < movies.length; i += concurrency) {
      // Check if cancelled
      const currentPipeline = activePipelines.get(pipelineId);
      if (!currentPipeline || currentPipeline.status === 'cancelled') {
        return;
      }

      const batch = movies.slice(i, i + concurrency);
      
      await Promise.all(
        batch.map(async (movie) => {
          try {
            await processMovie(type, movie, options);
            pipeline.progress.completed++;
          } catch (error) {
            pipeline.progress.failed++;
            const errorMsg = `${movie.title_en}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
          }
        })
      );

      // Update progress
      pipeline.progress.percentage = Math.round(
        ((pipeline.progress.completed + pipeline.progress.failed) / pipeline.progress.total) * 100
      );

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Complete pipeline
    pipeline.status = 'completed';
    pipeline.completedAt = new Date().toISOString();
    pipeline.results = {
      successCount: pipeline.progress.completed,
      failureCount: pipeline.progress.failed,
      errors: errors.slice(0, 20), // Keep first 20 errors
    };
  } catch (error) {
    pipeline.status = 'failed';
    pipeline.completedAt = new Date().toISOString();
    pipeline.results = {
      successCount: pipeline.progress.completed,
      failureCount: pipeline.progress.failed,
      errors: [error instanceof Error ? error.message : 'Pipeline failed'],
    };
  }
}

async function processMovie(
  type: PipelineType,
  movie: { id: string; title_en: string; release_year: number },
  options: Record<string, unknown>
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  switch (type) {
    case 'full_enrich': {
      const response = await fetch(`${baseUrl}/api/admin/movies/${movie.id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: options.sources || ['all'] }),
      });

      if (!response.ok) {
        throw new Error(`Enrich failed: ${response.status}`);
      }
      break;
    }

    case 'images_only': {
      const response = await fetch(`${baseUrl}/api/admin/movies/${movie.id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: ['tmdb'] }), // TMDB for images
      });

      if (!response.ok) {
        throw new Error(`Image enrich failed: ${response.status}`);
      }
      break;
    }

    case 'reviews_only': {
      const response = await fetch(`${baseUrl}/api/admin/reviews/${movie.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: options.reviewType || 'template',
          forceRegenerate: options.forceRegenerate || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Review generation failed: ${response.status}`);
      }
      break;
    }

    case 'verification': {
      const response = await fetch(`${baseUrl}/api/admin/verification/${movie.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sources: options.sources || ['tmdb', 'omdb', 'wikipedia'],
          applyFixes: options.applyFixes || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }
      break;
    }

    case 'cast_crew': {
      const response = await fetch(`${baseUrl}/api/admin/movies/${movie.id}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources: ['tmdb'] }),
      });

      if (!response.ok) {
        throw new Error(`Cast/crew enrich failed: ${response.status}`);
      }
      break;
    }
  }
}

