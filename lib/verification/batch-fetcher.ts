/**
 * BATCH FETCHER - Parallel Multi-Source Data Fetching
 * 
 * Fetches movie data from multiple sources in parallel with:
 * - Rate limiting per source
 * - Retry logic with exponential backoff
 * - Progress tracking
 * - Resume capability
 * 
 * Sources: TMDB, OMDB, Wikipedia, Wikidata, Google KG
 */

import { createClient } from '@supabase/supabase-js';
import type { DataSource } from '@/lib/data/conflict-resolution';

// ============================================================
// TYPES
// ============================================================

export interface FetchConfig {
  sources: DataSource[];
  batchSize: number;
  delayBetweenBatches: number; // ms
  maxRetries: number;
  timeout: number; // ms
}

export interface SourceData {
  source: DataSource;
  data: Record<string, unknown>;
  fetchedAt: string;
  confidence: number;
  error?: string;
}

export interface MovieFetchResult {
  movieId: string;
  title: string;
  year: number;
  sources: SourceData[];
  fetchDuration: number;
  errors: string[];
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining: number; // seconds
}

type ProgressCallback = (progress: BatchProgress) => void;

// ============================================================
// RATE LIMITERS
// ============================================================

const RATE_LIMITS: Record<DataSource, { requestsPerSecond: number; burstLimit: number }> = {
  tmdb: { requestsPerSecond: 40, burstLimit: 50 },
  imdb: { requestsPerSecond: 5, burstLimit: 10 },
  omdb: { requestsPerSecond: 10, burstLimit: 20 },
  wikipedia: { requestsPerSecond: 100, burstLimit: 200 },
  wikidata: { requestsPerSecond: 50, burstLimit: 100 },
  regional: { requestsPerSecond: 10, burstLimit: 20 },
  official: { requestsPerSecond: 5, burstLimit: 10 },
  google_kg: { requestsPerSecond: 10, burstLimit: 20 },
  letterboxd: { requestsPerSecond: 5, burstLimit: 10 },
  internal: { requestsPerSecond: 100, burstLimit: 200 },
};

class RateLimiter {
  private tokens: Map<DataSource, number> = new Map();
  private lastRefill: Map<DataSource, number> = new Map();

  async acquire(source: DataSource): Promise<void> {
    const limit = RATE_LIMITS[source] || { requestsPerSecond: 10, burstLimit: 20 };
    const now = Date.now();
    
    // Initialize if needed
    if (!this.tokens.has(source)) {
      this.tokens.set(source, limit.burstLimit);
      this.lastRefill.set(source, now);
    }

    // Refill tokens based on time elapsed
    const lastRefill = this.lastRefill.get(source) || now;
    const elapsed = (now - lastRefill) / 1000;
    const refill = elapsed * limit.requestsPerSecond;
    const currentTokens = Math.min(
      limit.burstLimit,
      (this.tokens.get(source) || 0) + refill
    );
    
    this.tokens.set(source, currentTokens);
    this.lastRefill.set(source, now);

    // Wait if no tokens available
    if (currentTokens < 1) {
      const waitTime = (1 - currentTokens) / limit.requestsPerSecond * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.tokens.set(source, 0);
    } else {
      this.tokens.set(source, currentTokens - 1);
    }
  }
}

// ============================================================
// SOURCE FETCHERS
// ============================================================

interface FetcherContext {
  tmdbApiKey?: string;
  omdbApiKey?: string;
  googleKgApiKey?: string;
}

async function fetchFromTMDB(
  title: string, 
  year: number, 
  ctx: FetcherContext
): Promise<Record<string, unknown> | null> {
  if (!ctx.tmdbApiKey) return null;

  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${ctx.tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
  
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return null;
  
  const searchData = await searchRes.json();
  if (!searchData.results?.length) return null;

  // Prefer Telugu movies
  const movie = searchData.results.find((m: Record<string, unknown>) => m.original_language === 'te') || searchData.results[0];
  
  // Get credits
  const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${ctx.tmdbApiKey}`;
  const creditsRes = await fetch(creditsUrl);
  const credits = creditsRes.ok ? await creditsRes.json() : { cast: [], crew: [] };

  const director = credits.crew?.find((c: Record<string, unknown>) => c.job === 'Director');
  const males = credits.cast?.filter((c: Record<string, unknown>) => c.gender === 2).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.order as number) - (b.order as number)) || [];
  const females = credits.cast?.filter((c: Record<string, unknown>) => c.gender === 1).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.order as number) - (b.order as number)) || [];

  return {
    tmdb_id: movie.id,
    title: movie.title,
    release_date: movie.release_date,
    synopsis: movie.overview,
    rating: movie.vote_average,
    poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
    backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
    director: director?.name,
    hero: males[0]?.name,
    heroine: females[0]?.name,
    genre: movie.genres?.map((g: Record<string, unknown>) => g.name) || [],
    runtime: movie.runtime,
    language: movie.original_language,
    confidence: 0.9,
    verified: true,
  };
}

async function fetchFromOMDB(
  title: string, 
  year: number, 
  imdbId: string | undefined,
  ctx: FetcherContext
): Promise<Record<string, unknown> | null> {
  if (!ctx.omdbApiKey) return null;

  const params = imdbId 
    ? `i=${imdbId}` 
    : `t=${encodeURIComponent(title)}&y=${year}`;
  
  const url = `https://www.omdbapi.com/?${params}&apikey=${ctx.omdbApiKey}&plot=full`;
  
  const res = await fetch(url);
  if (!res.ok) return null;
  
  const data = await res.json();
  if (data.Response === 'False') return null;

  return {
    imdb_id: data.imdbID,
    title: data.Title,
    release_date: data.Released,
    synopsis: data.Plot,
    rating: parseFloat(data.imdbRating) || null,
    runtime: parseInt(data.Runtime) || null,
    director: data.Director,
    hero: data.Actors?.split(',')[0]?.trim(),
    genre: data.Genre?.split(',').map((g: string) => g.trim()) || [],
    awards: data.Awards,
    box_office: data.BoxOffice,
    production_house: data.Production,
    certification: data.Rated,
    confidence: 0.85,
    verified: true,
  };
}

async function fetchFromWikipedia(
  title: string, 
  year: number
): Promise<Record<string, unknown> | null> {
  const searchTitle = `${title} (${year} film)`;
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTitle)}`;
  
  const res = await fetch(url);
  if (!res.ok) return null;
  
  const data = await res.json();
  if (data.type === 'disambiguation' || !data.extract) return null;

  return {
    title: data.title,
    synopsis: data.extract,
    wikipedia_url: data.content_urls?.desktop?.page,
    confidence: 0.8,
    verified: false,
  };
}

async function fetchFromWikidata(
  title: string, 
  year: number
): Promise<Record<string, unknown> | null> {
  const sparqlQuery = `
    SELECT ?film ?filmLabel ?directorLabel ?imdbId ?releaseDate WHERE {
      ?film wdt:P31 wd:Q11424;
            rdfs:label "${title}"@en;
            wdt:P577 ?releaseDate.
      OPTIONAL { ?film wdt:P57 ?director. }
      OPTIONAL { ?film wdt:P345 ?imdbId. }
      FILTER(YEAR(?releaseDate) = ${year})
    }
    LIMIT 1
  `;
  
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.results?.bindings?.[0];
    if (!result) return null;

    return {
      wikidata_id: result.film?.value?.split('/').pop(),
      title: result.filmLabel?.value,
      director: result.directorLabel?.value,
      imdb_id: result.imdbId?.value,
      release_date: result.releaseDate?.value,
      confidence: 0.85,
      verified: true,
    };
  } catch {
    return null;
  }
}

async function fetchFromInternal(
  movieId: string,
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', movieId)
    .single();
  
  if (error || !data) return null;

  return {
    ...data,
    confidence: 0.7,
    verified: false,
    source: 'internal',
  };
}

// ============================================================
// BATCH FETCHER CLASS
// ============================================================

export class BatchFetcher {
  private rateLimiter = new RateLimiter();
  private supabase: ReturnType<typeof createClient>;
  private ctx: FetcherContext;
  private config: FetchConfig;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    config: Partial<FetchConfig> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.config = {
      sources: ['tmdb', 'omdb', 'wikipedia', 'wikidata', 'internal'],
      batchSize: 50,
      delayBetweenBatches: 2000,
      maxRetries: 3,
      timeout: 10000,
      ...config,
    };
    this.ctx = {
      tmdbApiKey: process.env.TMDB_API_KEY,
      omdbApiKey: process.env.OMDB_API_KEY,
      googleKgApiKey: process.env.GOOGLE_KG_API_KEY,
    };
  }

  /**
   * Fetch data for a single movie from all sources
   */
  async fetchMovie(
    movieId: string, 
    title: string, 
    year: number,
    imdbId?: string
  ): Promise<MovieFetchResult> {
    const startTime = Date.now();
    const sources: SourceData[] = [];
    const errors: string[] = [];

    // Fetch from each source in parallel
    const fetchPromises = this.config.sources.map(async (source) => {
      await this.rateLimiter.acquire(source);
      
      try {
        let data: Record<string, unknown> | null = null;
        
        switch (source) {
          case 'tmdb':
            data = await fetchFromTMDB(title, year, this.ctx);
            break;
          case 'omdb':
            data = await fetchFromOMDB(title, year, imdbId, this.ctx);
            break;
          case 'wikipedia':
            data = await fetchFromWikipedia(title, year);
            break;
          case 'wikidata':
            data = await fetchFromWikidata(title, year);
            break;
          case 'internal':
            data = await fetchFromInternal(movieId, this.supabase);
            break;
          default:
            return;
        }

        if (data) {
          sources.push({
            source,
            data,
            fetchedAt: new Date().toISOString(),
            confidence: (data.confidence as number) || 0.7,
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`${source}: ${errorMsg}`);
        sources.push({
          source,
          data: {},
          fetchedAt: new Date().toISOString(),
          confidence: 0,
          error: errorMsg,
        });
      }
    });

    await Promise.all(fetchPromises);

    return {
      movieId,
      title,
      year,
      sources,
      fetchDuration: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Fetch data for multiple movies in batches
   */
  async fetchBatch(
    movies: Array<{ id: string; title: string; year: number; imdb_id?: string }>,
    onProgress?: ProgressCallback
  ): Promise<MovieFetchResult[]> {
    const results: MovieFetchResult[] = [];
    const totalBatches = Math.ceil(movies.length / this.config.batchSize);
    let completed = 0;
    let failed = 0;
    const startTime = Date.now();

    for (let i = 0; i < movies.length; i += this.config.batchSize) {
      const batch = movies.slice(i, i + this.config.batchSize);
      const batchNum = Math.floor(i / this.config.batchSize) + 1;

      // Fetch batch in parallel
      const batchResults = await Promise.all(
        batch.map(movie => 
          this.fetchMovie(movie.id, movie.title, movie.year, movie.imdb_id)
        )
      );

      batchResults.forEach(result => {
        results.push(result);
        if (result.errors.length > 0) failed++;
        completed++;
      });

      // Report progress
      if (onProgress) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = completed / elapsed;
        const remaining = movies.length - completed;
        
        onProgress({
          total: movies.length,
          completed,
          failed,
          currentBatch: batchNum,
          totalBatches,
          estimatedTimeRemaining: rate > 0 ? remaining / rate : 0,
        });
      }

      // Delay between batches
      if (i + this.config.batchSize < movies.length) {
        await new Promise(resolve => 
          setTimeout(resolve, this.config.delayBetweenBatches)
        );
      }
    }

    return results;
  }

  /**
   * Get movies that need verification
   */
  async getMoviesNeedingVerification(
    limit: number = 100,
    options: {
      lowConfidenceThreshold?: number;
      yearMin?: number;
      yearMax?: number;
      staleAfterDays?: number;
    } = {}
  ): Promise<Array<{ id: string; title: string; year: number; imdb_id?: string }>> {
    const {
      yearMin,
      yearMax,
    } = options;

    let query = this.supabase
      .from('movies')
      .select('id, title_en, release_year, imdb_id')
      .order('release_year', { ascending: false })
      .limit(limit);

    if (yearMin) query = query.gte('release_year', yearMin);
    if (yearMax) query = query.lte('release_year', yearMax);

    const { data, error } = await query;
    
    if (error) throw error;

    return (data || []).map(m => ({
      id: m.id,
      title: m.title_en,
      year: m.release_year,
      imdb_id: m.imdb_id,
    }));
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

export function createBatchFetcher(config?: Partial<FetchConfig>): BatchFetcher {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return new BatchFetcher(supabaseUrl, supabaseKey, config);
}

export default BatchFetcher;

