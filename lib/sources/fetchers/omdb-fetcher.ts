/**
 * OMDB FETCHER
 *
 * Fetches movie data from the Open Movie Database API.
 * Provides:
 * - Plot (short & full)
 * - Ratings: IMDB, Rotten Tomatoes, Metacritic
 * - Awards text
 * - Director, Actors, Genre
 * - BoxOffice, Runtime
 *
 * Free tier: 1,000 requests/day
 * API Key required: OMDB_API_KEY
 */

import { BaseFetcher } from '../base-fetcher';
import type { FetcherResult, FetcherConfig } from '../types';

const OMDB_API_BASE = 'https://www.omdbapi.com';

// ============================================================
// TYPES
// ============================================================

export interface OMDbRating {
  Source: string;
  Value: string;
}

export interface OMDbResponse {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Language: string;
  Country: string;
  Awards: string;
  Poster: string;
  Ratings: OMDbRating[];
  Metascore: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  DVD: string;
  BoxOffice: string;
  Production: string;
  Website: string;
  Response: string;
  Error?: string;
}

export interface ParsedOMDbData {
  title: string;
  year: number;
  plot: string;
  plotFull?: string;
  director: string;
  actors: string[];
  genres: string[];
  runtime_minutes?: number;
  awards: string;
  parsedAwards: ParsedAward[];
  ratings: {
    imdb?: number;
    rottenTomatoes?: number;
    metacritic?: number;
  };
  boxOffice?: number;
  imdbId: string;
  language: string;
  country: string;
}

export interface ParsedAward {
  type: 'win' | 'nomination';
  count: number;
  description: string;
}

// ============================================================
// OMDB FETCHER CLASS
// ============================================================

export class OMDbFetcher extends BaseFetcher<ParsedOMDbData> {
  private apiKey: string;

  constructor() {
    super('omdb');
    this.apiKey = process.env.OMDB_API_KEY || '';
    this.rateLimit = { requests: 10, windowMs: 1000 }; // 10 per second (conservative)
  }

  /**
   * Fetch movie data by IMDB ID
   */
  async fetchByImdbId(imdbId: string, fullPlot: boolean = true): Promise<ParsedOMDbData | null> {
    if (!this.apiKey) {
      console.warn('OMDb API key not configured');
      return null;
    }

    await this.respectRateLimit();

    try {
      const url = `${OMDB_API_BASE}/?apikey=${this.apiKey}&i=${imdbId}&plot=${fullPlot ? 'full' : 'short'}`;
      const response = await fetch(url);
      const data: OMDbResponse = await response.json();

      if (data.Response === 'False') {
        console.warn(`OMDb error for ${imdbId}: ${data.Error}`);
        return null;
      }

      return this.parseResponse(data);
    } catch (error) {
      console.error(`OMDb fetch error for ${imdbId}:`, error);
      return null;
    }
  }

  /**
   * Fetch movie data by title and year
   */
  async fetchByTitle(title: string, year?: number, fullPlot: boolean = true): Promise<ParsedOMDbData | null> {
    if (!this.apiKey) {
      console.warn('OMDb API key not configured');
      return null;
    }

    await this.respectRateLimit();

    try {
      let url = `${OMDB_API_BASE}/?apikey=${this.apiKey}&t=${encodeURIComponent(title)}&plot=${fullPlot ? 'full' : 'short'}`;
      if (year) {
        url += `&y=${year}`;
      }

      const response = await fetch(url);
      const data: OMDbResponse = await response.json();

      if (data.Response === 'False') {
        console.warn(`OMDb error for "${title}": ${data.Error}`);
        return null;
      }

      return this.parseResponse(data);
    } catch (error) {
      console.error(`OMDb fetch error for "${title}":`, error);
      return null;
    }
  }

  /**
   * Parse OMDb response into structured data
   */
  private parseResponse(data: OMDbResponse): ParsedOMDbData {
    return {
      title: data.Title,
      year: parseInt(data.Year) || 0,
      plot: data.Plot,
      director: data.Director,
      actors: data.Actors ? data.Actors.split(',').map(a => a.trim()) : [],
      genres: data.Genre ? data.Genre.split(',').map(g => g.trim()) : [],
      runtime_minutes: this.parseRuntime(data.Runtime),
      awards: data.Awards,
      parsedAwards: this.parseAwards(data.Awards),
      ratings: {
        imdb: data.imdbRating !== 'N/A' ? parseFloat(data.imdbRating) : undefined,
        rottenTomatoes: this.extractRottenTomatoes(data.Ratings),
        metacritic: data.Metascore !== 'N/A' ? parseInt(data.Metascore) : undefined,
      },
      boxOffice: this.parseBoxOffice(data.BoxOffice),
      imdbId: data.imdbID,
      language: data.Language,
      country: data.Country,
    };
  }

  /**
   * Parse runtime string to minutes
   */
  private parseRuntime(runtime: string): number | undefined {
    if (!runtime || runtime === 'N/A') return undefined;
    const match = runtime.match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * Parse box office string to number
   */
  private parseBoxOffice(boxOffice: string): number | undefined {
    if (!boxOffice || boxOffice === 'N/A') return undefined;
    const cleaned = boxOffice.replace(/[$,]/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? undefined : num;
  }

  /**
   * Extract Rotten Tomatoes score from ratings array
   */
  private extractRottenTomatoes(ratings: OMDbRating[]): number | undefined {
    const rt = ratings?.find(r => r.Source === 'Rotten Tomatoes');
    if (!rt) return undefined;
    const match = rt.Value.match(/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * Parse awards text into structured format
   * Examples:
   * - "Won 3 Oscars. 11 wins & 27 nominations total."
   * - "2 wins & 5 nominations."
   * - "Won 2 Filmfare Awards. Another 8 wins & 12 nominations."
   */
  private parseAwards(awardsText: string): ParsedAward[] {
    if (!awardsText || awardsText === 'N/A') return [];

    const parsed: ParsedAward[] = [];

    // Match "Won X [Award]" pattern
    const wonMatches = awardsText.matchAll(/Won\s+(\d+)\s+([^.]+)/gi);
    for (const match of wonMatches) {
      parsed.push({
        type: 'win',
        count: parseInt(match[1]),
        description: match[2].trim(),
      });
    }

    // Match "Nominated for X [Award]" pattern
    const nominatedMatches = awardsText.matchAll(/Nominated\s+for\s+(\d+)\s+([^.]+)/gi);
    for (const match of nominatedMatches) {
      parsed.push({
        type: 'nomination',
        count: parseInt(match[1]),
        description: match[2].trim(),
      });
    }

    // Match "X wins & Y nominations" pattern
    const totalMatch = awardsText.match(/(\d+)\s*wins?\s*[&,]\s*(\d+)\s*nominations?/i);
    if (totalMatch) {
      parsed.push({
        type: 'win',
        count: parseInt(totalMatch[1]),
        description: 'total wins',
      });
      parsed.push({
        type: 'nomination',
        count: parseInt(totalMatch[2]),
        description: 'total nominations',
      });
    }

    return parsed;
  }

  /**
   * Required abstract method implementation
   */
  async fetch(_config: FetcherConfig): Promise<FetcherResult<ParsedOMDbData>[]> {
    // This fetcher is meant to be called directly with IMDB ID or title
    // Generic fetch not supported - use fetchByImdbId or fetchByTitle
    console.warn('OMDbFetcher.fetch() requires specific movie lookup. Use fetchByImdbId or fetchByTitle.');
    return [];
  }

  protected isTeluguRelated(data: ParsedOMDbData): boolean {
    // Check if language includes Telugu
    const lang = data.language?.toLowerCase() || '';
    return lang.includes('telugu') || lang.includes('tollywood');
  }

  /**
   * Get aggregated ratings for a movie
   */
  async getAggregatedRatings(imdbId: string): Promise<{
    imdb?: number;
    rottenTomatoes?: number;
    metacritic?: number;
    average?: number;
  } | null> {
    const data = await this.fetchByImdbId(imdbId, false);
    if (!data) return null;

    const { imdb, rottenTomatoes, metacritic } = data.ratings;

    // Calculate weighted average (IMDB on 10 scale, RT and Meta on 100)
    const scores: number[] = [];
    if (imdb) scores.push(imdb);
    if (rottenTomatoes) scores.push(rottenTomatoes / 10);
    if (metacritic) scores.push(metacritic / 10);

    const average = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : undefined;

    return { imdb, rottenTomatoes, metacritic, average };
  }

  /**
   * Get awards information for a movie
   */
  async getAwardsInfo(imdbId: string): Promise<{
    rawText: string;
    parsed: ParsedAward[];
    totalWins: number;
    totalNominations: number;
  } | null> {
    const data = await this.fetchByImdbId(imdbId, false);
    if (!data) return null;

    const totalWins = data.parsedAwards
      .filter(a => a.type === 'win')
      .reduce((sum, a) => sum + a.count, 0);

    const totalNominations = data.parsedAwards
      .filter(a => a.type === 'nomination')
      .reduce((sum, a) => sum + a.count, 0);

    return {
      rawText: data.awards,
      parsed: data.parsedAwards,
      totalWins,
      totalNominations,
    };
  }
}

// Singleton instance
let omdbFetcherInstance: OMDbFetcher | null = null;

export function getOMDbFetcher(): OMDbFetcher {
  if (!omdbFetcherInstance) {
    omdbFetcherInstance = new OMDbFetcher();
  }
  return omdbFetcherInstance;
}

