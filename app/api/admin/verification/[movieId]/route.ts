/**
 * Verification API
 * 
 * GET /api/admin/verification/[movieId] - Get verification status
 * POST /api/admin/verification/[movieId] - Run verification
 * 
 * Wraps consensus-builder.ts and verification system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { dataReviewer } from '@/lib/compliance';
import { safeFetcher } from '@/lib/compliance';
import type { ComplianceDataSource } from '@/lib/compliance/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

interface RouteParams {
  params: Promise<{ movieId: string }>;
}

/**
 * GET - Get verification status for a movie
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { movieId } = await params;

  try {
    // Fetch movie
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Fetch verification data
    const { data: verification } = await supabase
      .from('movie_verification')
      .select('*')
      .eq('movie_id', movieId)
      .single();

    if (!verification) {
      return NextResponse.json({
        movieId,
        movieTitle: movie.title_en,
        verified: false,
        message: 'No verification data available',
        recommendation: 'Run verification to check data accuracy',
      });
    }

    return NextResponse.json({
      movieId,
      movieTitle: movie.title_en,
      verified: true,
      overallConfidence: verification.overall_confidence,
      dataQualityGrade: verification.data_quality_grade,
      needsManualReview: verification.needs_manual_review,
      verifiedFacts: verification.verified_facts,
      pendingDiscrepancies: verification.pending_discrepancies,
      fieldsVerified: verification.fields_verified,
      lastVerifiedAt: verification.verified_at,
      isStale: verification.is_stale,
    });
  } catch (error) {
    console.error('Error fetching verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST - Run verification for a movie
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { movieId } = await params;

  try {
    const body = await request.json();
    const sources: ComplianceDataSource[] = body.sources || ['tmdb', 'omdb', 'wikipedia', 'wikidata'];
    const applyFixes = body.applyFixes === true;

    // Fetch movie
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Fetch data from each source
    const sourceData: Array<{
      source: ComplianceDataSource;
      data: Record<string, unknown>;
      url?: string;
    }> = [];

    // Internal data
    sourceData.push({
      source: 'internal',
      data: movie as Record<string, unknown>,
    });

    // TMDB
    if (sources.includes('tmdb') && TMDB_API_KEY) {
      const tmdbData = await fetchTMDBData(movie.title_en, movie.release_year);
      if (tmdbData) {
        sourceData.push({
          source: 'tmdb',
          data: tmdbData.data,
          url: tmdbData.url,
        });
      }
    }

    // OMDB
    if (sources.includes('omdb') && OMDB_API_KEY) {
      const omdbData = await fetchOMDBData(movie.title_en, movie.release_year, movie.imdb_id);
      if (omdbData) {
        sourceData.push({
          source: 'omdb',
          data: omdbData.data,
          url: omdbData.url,
        });
      }
    }

    // Wikipedia
    if (sources.includes('wikipedia')) {
      const wikiData = await fetchWikipediaData(movie.title_en, movie.release_year);
      if (wikiData) {
        sourceData.push({
          source: 'wikipedia',
          data: wikiData.data,
          url: wikiData.url,
        });
      }
    }

    // Review data with DataReviewer
    const reviewResult = await dataReviewer.reviewMovieData({
      movieId,
      title: movie.title_en,
      sources: sourceData,
    });

    // Calculate overall confidence
    const overallConfidence = reviewResult.consensus 
      ? reviewResult.consensus.confidence 
      : sourceData.length > 1 ? 0.7 : 0.5;

    // Determine data quality grade
    const grade = getDataQualityGrade(overallConfidence, reviewResult.issues.length);

    // Prepare verification record
    const verificationRecord = {
      movie_id: movieId,
      verified_facts: reviewResult.consensus?.recommendedValues || {},
      pending_discrepancies: reviewResult.issues.map(issue => ({
        field: issue.field,
        severity: issue.severity,
        message: issue.message,
        autoResolvable: issue.autoResolvable,
      })),
      overall_confidence: overallConfidence,
      data_quality_grade: grade,
      needs_manual_review: reviewResult.issues.some(i => i.severity === 'critical'),
      fields_verified: reviewResult.consensus?.agreedFields || [],
      verified_at: new Date().toISOString(),
      is_stale: false,
    };

    // Upsert verification data
    const { error: upsertError } = await supabase
      .from('movie_verification')
      .upsert(verificationRecord);

    if (upsertError) {
      console.error('Error saving verification:', upsertError);
    }

    // Apply fixes if requested and approved
    let appliedFixes: string[] = [];
    if (applyFixes && reviewResult.consensus?.recommendedValues) {
      const fixes = reviewResult.consensus.recommendedValues;
      const allowedFields = ['synopsis', 'director', 'hero', 'heroine', 'music_director', 'runtime'];
      
      const updates: Record<string, unknown> = {};
      for (const field of allowedFields) {
        if (fixes[field] && !movie[field]) {
          updates[field] = fixes[field];
          appliedFixes.push(field);
        }
      }

      if (Object.keys(updates).length > 0) {
        await supabase
          .from('movies')
          .update(updates)
          .eq('id', movieId);
      }
    }

    return NextResponse.json({
      success: true,
      movieId,
      movieTitle: movie.title_en,
      sourcesChecked: sourceData.map(s => s.source),
      overallConfidence,
      dataQualityGrade: grade,
      verifiedFields: reviewResult.consensus?.agreedFields || [],
      conflictedFields: reviewResult.consensus?.conflictedFields || [],
      issues: reviewResult.issues,
      recommendations: reviewResult.recommendations,
      appliedFixes,
      needsManualReview: verificationRecord.needs_manual_review,
    });
  } catch (error) {
    console.error('Error running verification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function fetchTMDBData(title: string, year: number): Promise<{ data: Record<string, unknown>; url: string } | null> {
  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
  const result = await safeFetcher.safeFetch<{ results: Array<Record<string, unknown>> }>('tmdb', searchUrl);

  if (!result.success || !result.data?.results?.length) {
    return null;
  }

  const movie = result.data.results.find(m => m.original_language === 'te') || result.data.results[0];

  return {
    data: {
      title: movie.title,
      release_date: movie.release_date,
      synopsis: movie.overview,
      poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      tmdb_id: movie.id,
    },
    url: searchUrl,
  };
}

async function fetchOMDBData(title: string, year: number, imdbId?: string): Promise<{ data: Record<string, unknown>; url: string } | null> {
  let url: string;
  if (imdbId) {
    url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
  } else {
    url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&y=${year}`;
  }

  const result = await safeFetcher.safeFetch<Record<string, unknown>>('omdb', url);

  if (!result.success || !result.data || result.data.Response === 'False') {
    return null;
  }

  return {
    data: {
      title: result.data.Title,
      release_date: result.data.Released,
      synopsis: result.data.Plot,
      runtime: parseInt(String(result.data.Runtime)) || null,
      director: result.data.Director,
      imdb_id: result.data.imdbID,
      certification: result.data.Rated,
    },
    url,
  };
}

async function fetchWikipediaData(title: string, year: number): Promise<{ data: Record<string, unknown>; url: string } | null> {
  const wikiTitle = title.replace(/ /g, '_');
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}_(${year}_film)`;

  const result = await safeFetcher.safeFetch<Record<string, unknown>>('wikipedia', url);

  if (!result.success || !result.data) {
    // Try without year
    const altUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`;
    const altResult = await safeFetcher.safeFetch<Record<string, unknown>>('wikipedia', altUrl);

    if (!altResult.success || !altResult.data) {
      return null;
    }

    return {
      data: {
        synopsis: altResult.data.extract,
        wikipedia_url: altResult.data.content_urls?.desktop?.page,
      },
      url: altUrl,
    };
  }

  return {
    data: {
      synopsis: result.data.extract,
      wikipedia_url: result.data.content_urls?.desktop?.page,
    },
    url,
  };
}

function getDataQualityGrade(confidence: number, issueCount: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (confidence >= 0.9 && issueCount === 0) return 'A';
  if (confidence >= 0.8 && issueCount <= 2) return 'B';
  if (confidence >= 0.6 && issueCount <= 5) return 'C';
  if (confidence >= 0.4) return 'D';
  return 'F';
}

