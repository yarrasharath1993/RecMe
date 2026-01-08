/**
 * SOURCES MODULE INDEX
 *
 * Exports all data fetchers and types.
 * 
 * MULTI-SOURCE DATA ARCHITECTURE:
 * - TMDB: Primary movie metadata, cast, crew, ratings
 * - Wikipedia: Plot summaries, reception, legacy (factual text)
 * - OMDb: Aggregated ratings (IMDB, RT, Metacritic), awards text
 * - Wikidata: Structured awards data (SPARQL queries)
 * - Google KG: Entity descriptions and context
 */

// Types
export * from './types';

// Base
export { BaseFetcher } from './base-fetcher';

// Fetchers
export { TMDBFetcher } from './fetchers/tmdb-fetcher';
export { WikipediaFetcher, getWikipediaFetcher } from './fetchers/wikipedia-fetcher';
export type { WikipediaMovieSections, WikipediaSectionResult } from './fetchers/wikipedia-fetcher';

export { OMDbFetcher, getOMDbFetcher } from './fetchers/omdb-fetcher';
export type { OMDbRating, OMDbResponse, ParsedOMDbData, ParsedAward } from './fetchers/omdb-fetcher';

export { GoogleKGFetcher, getGoogleKGFetcher } from './fetchers/google-kg-fetcher';
export type { KGEntity, KGSearchResult, ParsedKGEntity } from './fetchers/google-kg-fetcher';

export { WikidataAwardsFetcher, getWikidataAwardsFetcher } from './fetchers/wikidata-awards-fetcher';
export type { WikidataAward, MovieAwardsResult, PersonAwardsResult } from './fetchers/wikidata-awards-fetcher';

// Source registry
import { TMDBFetcher } from './fetchers/tmdb-fetcher';
import { WikipediaFetcher } from './fetchers/wikipedia-fetcher';
import { OMDbFetcher } from './fetchers/omdb-fetcher';
import { GoogleKGFetcher } from './fetchers/google-kg-fetcher';
import type { FetcherResult, FetcherConfig } from './types';

export type SourceName = 'tmdb' | 'wikipedia' | 'wikidata' | 'omdb' | 'google_kg' | 'youtube' | 'news';

export interface SourceRegistry {
  [key: string]: {
    fetcher: any;
    priority: number;
    enabled: boolean;
    description?: string;
  };
}

export const SOURCE_REGISTRY: SourceRegistry = {
  tmdb: {
    fetcher: TMDBFetcher,
    priority: 1, // Highest priority (canonical)
    enabled: true,
    description: 'Primary movie metadata, cast, crew, ratings',
  },
  wikipedia: {
    fetcher: WikipediaFetcher,
    priority: 2,
    enabled: true,
    description: 'Plot summaries, reception, legacy sections',
  },
  omdb: {
    fetcher: OMDbFetcher,
    priority: 3,
    enabled: !!process.env.OMDB_API_KEY,
    description: 'IMDB, Rotten Tomatoes, Metacritic ratings & awards',
  },
  google_kg: {
    fetcher: GoogleKGFetcher,
    priority: 4,
    enabled: !!process.env.GOOGLE_KG_API_KEY,
    description: 'Entity descriptions and context',
  },
  // Note: Wikidata is not in registry as it uses direct SPARQL, not the fetcher pattern
};

/**
 * Fetch data from all enabled sources
 */
export async function fetchFromAllSources(
  config: FetcherConfig
): Promise<FetcherResult<any>[]> {
  const results: FetcherResult<any>[] = [];

  const enabledSources = Object.entries(SOURCE_REGISTRY)
    .filter(([, s]) => s.enabled)
    .sort((a, b) => a[1].priority - b[1].priority);

  for (const [name, source] of enabledSources) {
    try {
      console.log(`📡 Fetching from ${name}...`);
      const fetcher = new source.fetcher();
      const data = await fetcher.fetch(config);
      results.push(...data);
      console.log(`   ✓ Got ${data.length} results`);
    } catch (error) {
      console.warn(`   ✗ ${name} failed:`, error);
    }
  }

  return results;
}

/**
 * Fetch from a specific source
 */
export async function fetchFromSource(
  sourceName: SourceName,
  config: FetcherConfig
): Promise<FetcherResult<any>[]> {
  const source = SOURCE_REGISTRY[sourceName];

  if (!source || !source.enabled) {
    throw new Error(`Source ${sourceName} is not available`);
  }

  const fetcher = new source.fetcher();
  return fetcher.fetch(config);
}










