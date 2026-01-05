/**
 * GOOGLE KNOWLEDGE GRAPH FETCHER
 *
 * Fetches entity data from Google's Knowledge Graph Search API.
 * Provides:
 * - Entity descriptions
 * - Entity types (Movie, Person, etc.)
 * - Related entities
 * - Official website, Wikipedia links
 *
 * Free tier: 100,000 requests/day
 * API Key required: GOOGLE_KG_API_KEY
 */

import { BaseFetcher } from '../base-fetcher';
import type { FetcherResult, FetcherConfig } from '../types';

const GOOGLE_KG_API_BASE = 'https://kgsearch.googleapis.com/v1/entities:search';

// ============================================================
// TYPES
// ============================================================

export interface KGSearchResult {
  '@type': string;
  result: KGEntity;
  resultScore: number;
}

export interface KGEntity {
  '@id': string;
  '@type': string[];
  name: string;
  description?: string;
  detailedDescription?: {
    articleBody: string;
    url: string;
    license: string;
  };
  image?: {
    contentUrl: string;
    url: string;
    license?: string;
  };
  url?: string;
}

export interface KGSearchResponse {
  '@context': {
    '@vocab': string;
    goog: string;
    EntitySearchResult: string;
    detailedDescription: string;
    resultScore: string;
    kg: string;
  };
  '@type': string;
  itemListElement: KGSearchResult[];
}

export interface ParsedKGEntity {
  id: string;
  name: string;
  types: string[];
  description?: string;
  detailedDescription?: string;
  wikipediaUrl?: string;
  imageUrl?: string;
  score: number;
  isMovie: boolean;
  isPerson: boolean;
}

// ============================================================
// GOOGLE KG FETCHER CLASS
// ============================================================

export class GoogleKGFetcher extends BaseFetcher<ParsedKGEntity> {
  private apiKey: string;

  constructor() {
    super('google_kg');
    this.apiKey = process.env.GOOGLE_KG_API_KEY || '';
    this.rateLimit = { requests: 100, windowMs: 1000 }; // 100 per second (generous limit)
  }

  /**
   * Search for an entity by query
   */
  async search(
    query: string,
    options: {
      types?: string[];
      limit?: number;
      languages?: string[];
    } = {}
  ): Promise<ParsedKGEntity[]> {
    if (!this.apiKey) {
      console.warn('Google Knowledge Graph API key not configured');
      return [];
    }

    await this.respectRateLimit();

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        query: query,
        limit: String(options.limit || 5),
        languages: (options.languages || ['en']).join(','),
      });

      // Add type filters if specified
      if (options.types && options.types.length > 0) {
        params.append('types', options.types.join(','));
      }

      const url = `${GOOGLE_KG_API_BASE}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Google KG error: ${response.status} ${response.statusText}`);
        return [];
      }

      const data: KGSearchResponse = await response.json();
      
      if (!data.itemListElement || data.itemListElement.length === 0) {
        return [];
      }

      return data.itemListElement.map(item => this.parseEntity(item));
    } catch (error) {
      console.error('Google KG fetch error:', error);
      return [];
    }
  }

  /**
   * Search specifically for a movie
   */
  async searchMovie(title: string, year?: number): Promise<ParsedKGEntity | null> {
    const query = year ? `${title} ${year} film` : `${title} film`;
    
    const results = await this.search(query, {
      types: ['Movie'],
      limit: 5,
    });

    // Find best match - prefer exact title match with year
    for (const entity of results) {
      if (!entity.isMovie) continue;
      
      const nameMatch = entity.name.toLowerCase().includes(title.toLowerCase());
      const yearMatch = !year || (entity.description?.includes(String(year)));
      
      if (nameMatch && yearMatch) {
        return entity;
      }
    }

    // Fallback to first movie result
    return results.find(e => e.isMovie) || null;
  }

  /**
   * Search specifically for a person (actor, director, etc.)
   */
  async searchPerson(name: string): Promise<ParsedKGEntity | null> {
    const results = await this.search(name, {
      types: ['Person'],
      limit: 5,
    });

    // Find best match
    for (const entity of results) {
      if (!entity.isPerson) continue;
      
      const nameMatch = entity.name.toLowerCase() === name.toLowerCase() ||
                       entity.name.toLowerCase().includes(name.toLowerCase());
      
      if (nameMatch) {
        return entity;
      }
    }

    return results.find(e => e.isPerson) || null;
  }

  /**
   * Get detailed description for an entity
   */
  async getEntityDescription(
    name: string,
    type: 'movie' | 'person'
  ): Promise<string | null> {
    const entity = type === 'movie'
      ? await this.searchMovie(name)
      : await this.searchPerson(name);

    return entity?.detailedDescription || entity?.description || null;
  }

  /**
   * Parse KG search result into structured data
   */
  private parseEntity(result: KGSearchResult): ParsedKGEntity {
    const entity = result.result;
    const types = Array.isArray(entity['@type']) ? entity['@type'] : [entity['@type']];

    return {
      id: entity['@id'],
      name: entity.name,
      types: types,
      description: entity.description,
      detailedDescription: entity.detailedDescription?.articleBody,
      wikipediaUrl: entity.detailedDescription?.url,
      imageUrl: entity.image?.contentUrl || entity.image?.url,
      score: result.resultScore,
      isMovie: types.some(t => 
        t.toLowerCase().includes('movie') || 
        t.toLowerCase().includes('film')
      ),
      isPerson: types.some(t => t.toLowerCase() === 'person'),
    };
  }

  /**
   * Required abstract method implementation
   */
  async fetch(_config: FetcherConfig): Promise<FetcherResult<ParsedKGEntity>[]> {
    // Generic fetch not practical for KG - use search methods directly
    console.warn('GoogleKGFetcher.fetch() requires specific entity search. Use search(), searchMovie(), or searchPerson().');
    return [];
  }

  protected isTeluguRelated(data: ParsedKGEntity): boolean {
    // Check if description mentions Telugu
    const text = `${data.description || ''} ${data.detailedDescription || ''}`.toLowerCase();
    return text.includes('telugu') || 
           text.includes('tollywood') ||
           text.includes('andhra') ||
           text.includes('telangana');
  }

  /**
   * Verify if an entity is a Telugu movie
   */
  async isTeluguMovie(title: string, year?: number): Promise<boolean> {
    const entity = await this.searchMovie(title, year);
    if (!entity) return false;
    return this.isTeluguRelated(entity);
  }
}

// Singleton instance
let googleKGFetcherInstance: GoogleKGFetcher | null = null;

export function getGoogleKGFetcher(): GoogleKGFetcher {
  if (!googleKGFetcherInstance) {
    googleKGFetcherInstance = new GoogleKGFetcher();
  }
  return googleKGFetcherInstance;
}

