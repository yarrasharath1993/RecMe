/**
 * Force Enrich API
 * 
 * POST /api/admin/movies/[id]/enrich - Force enrich movie from specified sources
 * 
 * Wraps enrich-waterfall.ts logic with compliance layer
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { safeFetcher, complianceGateway } from '@/lib/compliance';
import type { ComplianceDataSource } from '@/lib/compliance/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

interface RouteParams {
  params: Promise<{ id: string }>;
}

type EnrichSource = 'tmdb' | 'omdb' | 'wikipedia' | 'wikidata' | 'all';

interface EnrichResult {
  source: EnrichSource;
  success: boolean;
  fieldsUpdated: string[];
  error?: string;
  attribution?: string;
}

/**
 * POST - Force enrich movie from specified sources
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const sources: EnrichSource[] = body.sources || ['all'];
    const dryRun = body.dryRun === true;

    // Fetch movie
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    const results: EnrichResult[] = [];
    const updates: Record<string, unknown> = {};

    // Determine which sources to use
    const sourcesToUse = sources.includes('all')
      ? ['tmdb', 'omdb', 'wikipedia', 'wikidata'] as EnrichSource[]
      : sources;

    // Enrich from each source
    for (const source of sourcesToUse) {
      try {
        const result = await enrichFromSource(source, movie, updates);
        results.push(result);
      } catch (error) {
        results.push({
          source,
          success: false,
          fieldsUpdated: [],
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Apply updates if not dry run
    if (!dryRun && Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      updates.last_enriched_at = new Date().toISOString();
      updates.last_enriched_by = 'force_enrich_api';

      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to apply updates', details: updateError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      movieId: id,
      movieTitle: movie.title_en,
      dryRun,
      results,
      totalFieldsUpdated: Object.keys(updates).filter(k => !k.includes('_at') && !k.includes('_by')).length,
      updates: dryRun ? updates : undefined,
    });
  } catch (error) {
    console.error('Error enriching movie:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function enrichFromSource(
  source: EnrichSource,
  movie: Record<string, unknown>,
  updates: Record<string, unknown>
): Promise<EnrichResult> {
  const fieldsUpdated: string[] = [];

  switch (source) {
    case 'tmdb': {
      if (!TMDB_API_KEY) {
        return { source, success: false, fieldsUpdated: [], error: 'TMDB API key not configured' };
      }

      // Check compliance
      const compliance = await safeFetcher.canFetch('tmdb', 'https://api.themoviedb.org');
      if (!compliance.allowed) {
        return { source, success: false, fieldsUpdated: [], error: compliance.reason };
      }

      // Search TMDB
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(String(movie.title_en))}&year=${movie.release_year}`;
      const searchResult = await safeFetcher.safeFetch<{ results: Array<Record<string, unknown>> }>('tmdb', searchUrl);

      if (!searchResult.success || !searchResult.data?.results?.length) {
        return { source, success: false, fieldsUpdated: [], error: 'No TMDB match found' };
      }

      const tmdbMovie = searchResult.data.results.find((m: Record<string, unknown>) => m.original_language === 'te') 
        || searchResult.data.results[0];

      // Get credits
      const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbMovie.id}/credits?api_key=${TMDB_API_KEY}`;
      const creditsResult = await safeFetcher.safeFetch<{ cast: Array<Record<string, unknown>>; crew: Array<Record<string, unknown>> }>('tmdb', creditsUrl);
      const credits = creditsResult.data || { cast: [], crew: [] };

      // Update fields
      if (tmdbMovie.poster_path && !movie.poster_url) {
        updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`;
        fieldsUpdated.push('poster_url');
      }

      if (tmdbMovie.backdrop_path && !movie.backdrop_url) {
        updates.backdrop_url = `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`;
        fieldsUpdated.push('backdrop_url');
      }

      if (tmdbMovie.overview && !movie.synopsis) {
        updates.synopsis = tmdbMovie.overview;
        fieldsUpdated.push('synopsis');
      }

      if (tmdbMovie.runtime && !movie.runtime) {
        updates.runtime = tmdbMovie.runtime;
        fieldsUpdated.push('runtime');
      }

      if (!movie.tmdb_id) {
        updates.tmdb_id = tmdbMovie.id;
        fieldsUpdated.push('tmdb_id');
      }

      // Extract director
      const director = credits.crew?.find((c: Record<string, unknown>) => c.job === 'Director');
      if (director && !movie.director) {
        updates.director = director.name;
        fieldsUpdated.push('director');
      }

      // Extract hero/heroine
      const males = credits.cast?.filter((c: Record<string, unknown>) => c.gender === 2).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.order as number) - (b.order as number)) || [];
      const females = credits.cast?.filter((c: Record<string, unknown>) => c.gender === 1).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.order as number) - (b.order as number)) || [];

      if (males[0] && !movie.hero) {
        updates.hero = males[0].name;
        fieldsUpdated.push('hero');
      }

      if (females[0] && !movie.heroine) {
        updates.heroine = females[0].name;
        fieldsUpdated.push('heroine');
      }

      return {
        source,
        success: true,
        fieldsUpdated,
        attribution: searchResult.attribution?.text,
      };
    }

    case 'omdb': {
      if (!OMDB_API_KEY) {
        return { source, success: false, fieldsUpdated: [], error: 'OMDB API key not configured' };
      }

      const imdbId = movie.imdb_id || movie.tmdb_id;
      let url: string;

      if (imdbId && String(imdbId).startsWith('tt')) {
        url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
      } else {
        url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(String(movie.title_en))}&y=${movie.release_year}`;
      }

      const result = await safeFetcher.safeFetch<Record<string, unknown>>('omdb', url);

      if (!result.success || !result.data || result.data.Response === 'False') {
        return { source, success: false, fieldsUpdated: [], error: 'No OMDB match found' };
      }

      const omdbData = result.data;

      if (omdbData.imdbID && !movie.imdb_id) {
        updates.imdb_id = omdbData.imdbID;
        fieldsUpdated.push('imdb_id');
      }

      if (omdbData.Runtime && !movie.runtime) {
        const runtime = parseInt(String(omdbData.Runtime));
        if (!isNaN(runtime)) {
          updates.runtime = runtime;
          fieldsUpdated.push('runtime');
        }
      }

      if (omdbData.Rated && !movie.certification) {
        updates.certification = omdbData.Rated;
        fieldsUpdated.push('certification');
      }

      return {
        source,
        success: true,
        fieldsUpdated,
        attribution: result.attribution?.text,
      };
    }

    case 'wikipedia': {
      const title = String(movie.title_en).replace(/ /g, '_');
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

      const result = await safeFetcher.safeFetch<Record<string, unknown>>('wikipedia', url);

      if (!result.success || !result.data) {
        // Try with year suffix
        const urlWithYear = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}_(${movie.release_year}_film)`;
        const retryResult = await safeFetcher.safeFetch<Record<string, unknown>>('wikipedia', urlWithYear);

        if (!retryResult.success || !retryResult.data) {
          return { source, success: false, fieldsUpdated: [], error: 'No Wikipedia article found' };
        }

        if (retryResult.data.extract && !movie.synopsis) {
          updates.synopsis = retryResult.data.extract;
          fieldsUpdated.push('synopsis');
        }

        return {
          source,
          success: true,
          fieldsUpdated,
          attribution: retryResult.attribution?.text,
        };
      }

      if (result.data.extract && !movie.synopsis) {
        updates.synopsis = result.data.extract;
        fieldsUpdated.push('synopsis');
      }

      return {
        source,
        success: true,
        fieldsUpdated,
        attribution: result.attribution?.text,
      };
    }

    case 'wikidata': {
      // Search for movie entity
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(String(movie.title_en))}&language=en&format=json`;
      
      const result = await safeFetcher.safeFetch<{ search: Array<{ id: string }> }>('wikidata', searchUrl);

      if (!result.success || !result.data?.search?.length) {
        return { source, success: false, fieldsUpdated: [], error: 'No Wikidata entity found' };
      }

      const entityId = result.data.search[0].id;
      
      // Get entity data
      const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
      const entityResult = await safeFetcher.safeFetch<{ entities: Record<string, Record<string, unknown>> }>('wikidata', entityUrl);

      if (!entityResult.success || !entityResult.data?.entities?.[entityId]) {
        return { source, success: false, fieldsUpdated: [], error: 'Failed to fetch Wikidata entity' };
      }

      // Wikidata is mainly for structured facts - no direct field updates in this simple version
      return {
        source,
        success: true,
        fieldsUpdated,
        attribution: entityResult.attribution?.text,
      };
    }

    default:
      return { source, success: false, fieldsUpdated: [], error: `Unknown source: ${source}` };
  }
}

