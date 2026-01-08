/**
 * Bulk Operations API
 * 
 * POST /api/admin/bulk - Execute bulk operations on movies
 * 
 * Supports:
 * - Bulk enrich
 * - Bulk verify
 * - Bulk update fields
 * - Bulk regenerate reviews
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

type BulkOperation = 
  | 'enrich'
  | 'verify'
  | 'update_field'
  | 'regenerate_review'
  | 'delete'
  | 'tag';

interface BulkRequest {
  operation: BulkOperation;
  movieIds: string[];
  options?: {
    sources?: string[];
    field?: string;
    value?: unknown;
    dryRun?: boolean;
    concurrency?: number;
  };
}

interface BulkResult {
  movieId: string;
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * POST - Execute bulk operation
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkRequest = await request.json();
    const { operation, movieIds, options = {} } = body;

    if (!operation || !movieIds || !Array.isArray(movieIds) || movieIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: operation and movieIds required' },
        { status: 400 }
      );
    }

    // Limit batch size
    const maxBatchSize = 100;
    if (movieIds.length > maxBatchSize) {
      return NextResponse.json(
        { error: `Batch size exceeds maximum of ${maxBatchSize}` },
        { status: 400 }
      );
    }

    // Verify all movies exist
    const { data: movies, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .in('id', movieIds);

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch movies' },
        { status: 500 }
      );
    }

    const foundIds = new Set(movies?.map(m => m.id) || []);
    const missingIds = movieIds.filter(id => !foundIds.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Movies not found: ${missingIds.join(', ')}` },
        { status: 404 }
      );
    }

    // Execute operation
    const results: BulkResult[] = [];
    const concurrency = Math.min(options.concurrency || 5, 10);
    const dryRun = options.dryRun === true;

    // Process in batches
    for (let i = 0; i < movieIds.length; i += concurrency) {
      const batch = movieIds.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(movieId => executeOperation(operation, movieId, options, dryRun))
      );
      results.push(...batchResults);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      operation,
      dryRun,
      total: movieIds.length,
      successful: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error('Error executing bulk operation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function executeOperation(
  operation: BulkOperation,
  movieId: string,
  options: BulkRequest['options'],
  dryRun: boolean
): Promise<BulkResult> {
  try {
    switch (operation) {
      case 'enrich': {
        if (dryRun) {
          return { movieId, success: true, message: 'Would enrich from sources' };
        }

        // Call enrich API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/movies/${movieId}/enrich`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources: options?.sources || ['all'] }),
        });

        if (response.ok) {
          const result = await response.json();
          return { 
            movieId, 
            success: true, 
            message: `Enriched ${result.totalFieldsUpdated} fields` 
          };
        } else {
          return { movieId, success: false, error: 'Enrich failed' };
        }
      }

      case 'verify': {
        if (dryRun) {
          return { movieId, success: true, message: 'Would run verification' };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/verification/${movieId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sources: options?.sources || ['tmdb', 'omdb', 'wikipedia'] }),
        });

        if (response.ok) {
          const result = await response.json();
          return { 
            movieId, 
            success: true, 
            message: `Confidence: ${Math.round(result.overallConfidence * 100)}%` 
          };
        } else {
          return { movieId, success: false, error: 'Verification failed' };
        }
      }

      case 'update_field': {
        if (!options?.field || options.value === undefined) {
          return { movieId, success: false, error: 'Field and value required' };
        }

        if (dryRun) {
          return { movieId, success: true, message: `Would set ${options.field}` };
        }

        const { error } = await supabase
          .from('movies')
          .update({ 
            [options.field]: options.value,
            updated_at: new Date().toISOString(),
          })
          .eq('id', movieId);

        if (error) {
          return { movieId, success: false, error: error.message };
        }

        return { movieId, success: true, message: `Updated ${options.field}` };
      }

      case 'regenerate_review': {
        if (dryRun) {
          return { movieId, success: true, message: 'Would regenerate review' };
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/reviews/${movieId}/regenerate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'template', forceRegenerate: true }),
        });

        if (response.ok) {
          return { movieId, success: true, message: 'Review regenerated' };
        } else {
          return { movieId, success: false, error: 'Review regeneration failed' };
        }
      }

      case 'delete': {
        if (dryRun) {
          return { movieId, success: true, message: 'Would delete movie' };
        }

        // Delete related data first
        await supabase.from('movie_reviews').delete().eq('movie_id', movieId);
        await supabase.from('movie_verification').delete().eq('movie_id', movieId);
        await supabase.from('movie_cast').delete().eq('movie_id', movieId);

        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', movieId);

        if (error) {
          return { movieId, success: false, error: error.message };
        }

        return { movieId, success: true, message: 'Deleted' };
      }

      case 'tag': {
        if (!options?.value) {
          return { movieId, success: false, error: 'Tag value required' };
        }

        if (dryRun) {
          return { movieId, success: true, message: `Would add tag: ${options.value}` };
        }

        // Get current tags
        const { data: movie } = await supabase
          .from('movies')
          .select('tags')
          .eq('id', movieId)
          .single();

        const currentTags = movie?.tags || [];
        const newTags = Array.isArray(options.value) 
          ? [...new Set([...currentTags, ...options.value])]
          : [...new Set([...currentTags, options.value])];

        const { error } = await supabase
          .from('movies')
          .update({ tags: newTags })
          .eq('id', movieId);

        if (error) {
          return { movieId, success: false, error: error.message };
        }

        return { movieId, success: true, message: `Tags updated` };
      }

      default:
        return { movieId, success: false, error: `Unknown operation: ${operation}` };
    }
  } catch (error) {
    return { 
      movieId, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}


