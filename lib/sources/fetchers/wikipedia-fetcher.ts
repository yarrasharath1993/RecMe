/**
 * WIKIPEDIA FETCHER
 *
 * Fetches summaries and basic info via REST API.
 * Enhanced to parse specific sections:
 * - Plot: For movie synopsis
 * - Reception: For critical reception
 * - Legacy/Cultural Impact: For cultural context
 * - Accolades/Awards: For award information
 *
 * NO HTML SCRAPING - only structured API responses.
 */

import { BaseFetcher } from '../base-fetcher';
import type { FetcherResult, FetcherConfig, PersonData, MovieData } from '../types';

const WIKI_REST_BASE = 'https://en.wikipedia.org/api/rest_v1';
const WIKI_API_BASE = 'https://en.wikipedia.org/w/api.php';

type WikiEntity = PersonData | MovieData;

// ============================================================
// TYPES FOR ENHANCED SECTIONS
// ============================================================

export interface WikipediaMovieSections {
  title: string;
  pageId: number;
  plot?: string;
  reception?: string;
  legacy?: string;
  accolades?: string;
  production?: string;
  cast?: string;
  summary?: string;
  thumbnail?: string;
  lastModified?: string;
}

export interface WikipediaSectionResult {
  found: boolean;
  content: string;
  wordCount: number;
}

// Wikipedia API response types
interface WikiSearchResult {
  title: string;
  pageid: number;
  snippet: string;
}

interface WikiSummary {
  title: string;
  pageid: number;
  extract?: string;
  description?: string;
  thumbnail?: { source: string };
  timestamp?: string;
  type?: string;
}

interface WikiParseSection {
  line: string;
  index: string;
  toclevel: number;
}

interface WikiParseResponse {
  parse?: {
    title: string;
    sections: WikiParseSection[];
    text?: { '*': string };
    wikitext?: { '*': string };
  };
}

interface WikiQueryResponse {
  query?: {
    search?: WikiSearchResult[];
    pages?: Record<string, { extract?: string }>;
  };
}

export class WikipediaFetcher extends BaseFetcher<WikiEntity> {
  constructor() {
    super('wikipedia');
    this.rateLimit = { requests: 100, windowMs: 60000 }; // 100 per minute
  }

  async fetch(config: FetcherConfig): Promise<FetcherResult<WikiEntity>[]> {
    const results: FetcherResult<WikiEntity>[] = [];
    const limit = config.limit || 20;

    // Fetch Telugu cinema related articles
    const searchTerms = [
      'Telugu cinema',
      'Tollywood actors',
      'Telugu film directors',
      'Telugu films',
    ];

    for (const term of searchTerms) {
      if (results.length >= limit) break;

      const searchResults = await this.searchArticles(term, Math.min(10, limit - results.length));

      for (const article of searchResults) {
        if (results.length >= limit) break;

        const summary = await this.fetchSummary(article.title);
        if (!summary) continue;

        const entity = this.transformToEntity(summary, article);
        if (!entity) continue;

        const confidence = this.calculateConfidence(entity, {
          hasDescription: summary.extract ? 1.05 : 0.9,
          hasImage: summary.thumbnail ? 1.02 : 0.95,
        });

        results.push(this.wrapResult(entity, confidence, true, {
          query_used: term,
        }));
      }
    }

    return results;
  }

  protected isTeluguRelated(data: WikiEntity): boolean {
    // Check if data mentions Telugu cinema
    const text = JSON.stringify(data).toLowerCase();
    return text.includes('telugu') ||
           text.includes('tollywood') ||
           text.includes('andhra') ||
           text.includes('telangana');
  }

  /**
   * Search for Wikipedia articles
   */
  private async searchArticles(query: string, limit: number): Promise<WikiSearchResult[]> {
    const url = `${WIKI_API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(query)}` +
      `&srlimit=${limit}&format=json&origin=*`;

    const data = await this.fetchJSON<WikiQueryResponse>(url);
    return data?.query?.search || [];
  }

  /**
   * Fetch article summary via REST API
   */
  private async fetchSummary(title: string): Promise<WikiSummary | null> {
    const url = `${WIKI_REST_BASE}/page/summary/${encodeURIComponent(title)}`;
    return this.fetchJSON<WikiSummary>(url);
  }

  /**
   * Transform Wikipedia summary to entity
   */
  private transformToEntity(summary: WikiSummary, _searchResult: WikiSearchResult): WikiEntity | null {
    const extract = summary.extract || '';

    // Detect if it's a person or movie based on content
    const isPerson = this.isPerson(extract, summary.description);

    if (isPerson) {
      return this.transformToPerson(summary);
    } else if (this.isMovie(extract, summary.description)) {
      return this.transformToMovie(summary);
    }

    return null;
  }

  private isPerson(extract: string, description?: string): boolean {
    const personKeywords = ['actor', 'actress', 'director', 'singer', 'born', 'producer'];
    const text = `${extract} ${description || ''}`.toLowerCase();
    return personKeywords.some(kw => text.includes(kw));
  }

  private isMovie(extract: string, description?: string): boolean {
    const movieKeywords = ['film', 'movie', 'released', 'directed by', 'starring'];
    const text = `${extract} ${description || ''}`.toLowerCase();
    return movieKeywords.some(kw => text.includes(kw));
  }

  private transformToPerson(summary: WikiSummary): PersonData {
    const extract = summary.extract || '';

    return {
      name_en: summary.title,
      biography_en: extract.slice(0, 500),
      image_url: summary.thumbnail?.source,
      roles: this.inferRolesFromText(extract),
      primary_role: this.inferPrimaryRoleFromText(extract),
      catalogue_status: 'partial',
      data_sources: ['wikipedia'],
    };
  }

  private transformToMovie(summary: WikiSummary): MovieData {
    const extract = summary.extract || '';

    return {
      title_en: summary.title.replace(/\(film\)/i, '').trim(),
      overview_en: extract.slice(0, 500),
      poster_url: summary.thumbnail?.source,
      release_year: this.extractYear(extract),
      genres: [],
      catalogue_status: 'partial',
      data_sources: ['wikipedia'],
    };
  }

  private inferRolesFromText(text: string): PersonData['roles'] {
    const roles: PersonData['roles'] = [];
    const lower = text.toLowerCase();

    if (lower.includes('actor')) roles.push('actor');
    if (lower.includes('actress')) roles.push('actress');
    if (lower.includes('director')) roles.push('director');
    if (lower.includes('producer')) roles.push('producer');
    if (lower.includes('singer')) roles.push('singer');
    if (lower.includes('music director') || lower.includes('composer')) {
      roles.push('music_director');
    }

    return roles.length > 0 ? roles : ['actor'];
  }

  private inferPrimaryRoleFromText(text: string): PersonData['primary_role'] {
    const lower = text.toLowerCase();
    if (lower.indexOf('director') < lower.indexOf('actor') && lower.includes('director')) {
      return 'director';
    }
    if (lower.includes('actress')) return 'actress';
    return 'actor';
  }

  private extractYear(text: string): number | undefined {
    const match = text.match(/\b(19|20)\d{2}\b/);
    return match ? parseInt(match[0]) : undefined;
  }

  // ============================================================
  // ENHANCED SECTION PARSING
  // ============================================================

  /**
   * Get specific sections from a movie's Wikipedia article
   * Uses the MediaWiki API to fetch parsed sections
   */
  async getMovieSections(movieTitle: string, year?: number): Promise<WikipediaMovieSections | null> {
    await this.respectRateLimit();

    // Format title for Wikipedia lookup
    const searchTitle = year ? `${movieTitle} (${year} film)` : `${movieTitle} (film)`;
    
    try {
      // First, get the page summary to verify we have the right article
      const summary = await this.fetchSummary(searchTitle);
      if (!summary || summary.type === 'disambiguation') {
        // Try alternate format
        const altSummary = await this.fetchSummary(movieTitle);
        if (!altSummary) return null;
      }

      // Fetch the full article sections
      const sectionsData = await this.fetchArticleSections(summary?.title || searchTitle);
      if (!sectionsData) return null;

      const result: WikipediaMovieSections = {
        title: summary?.title || movieTitle,
        pageId: summary?.pageid || 0,
        summary: summary?.extract,
        thumbnail: summary?.thumbnail?.source,
        lastModified: summary?.timestamp,
      };

      // Parse specific sections
      result.plot = await this.extractSection(sectionsData, ['Plot', 'Synopsis', 'Story', 'Plot summary']);
      result.reception = await this.extractSection(sectionsData, ['Reception', 'Critical reception', 'Critical response', 'Reviews']);
      result.legacy = await this.extractSection(sectionsData, ['Legacy', 'Cultural impact', 'Impact', 'Influence', 'Cultural significance']);
      result.accolades = await this.extractSection(sectionsData, ['Accolades', 'Awards', 'Awards and nominations', 'Recognition']);
      result.production = await this.extractSection(sectionsData, ['Production', 'Filming', 'Development']);
      result.cast = await this.extractSection(sectionsData, ['Cast', 'Cast and crew', 'Casting']);

      return result;
    } catch (error) {
      console.error(`Wikipedia sections error for "${movieTitle}":`, error);
      return null;
    }
  }

  /**
   * Fetch article sections using MediaWiki API
   */
  private async fetchArticleSections(title: string): Promise<WikiParseResponse | null> {
    const url = `${WIKI_API_BASE}?` + new URLSearchParams({
      action: 'parse',
      page: title,
      prop: 'sections|text|wikitext',
      format: 'json',
      origin: '*',
    });

    return this.fetchJSON<WikiParseResponse>(url);
  }

  /**
   * Extract a specific section by trying multiple possible names
   */
  private async extractSection(parseData: WikiParseResponse, sectionNames: string[]): Promise<string | undefined> {
    if (!parseData?.parse?.sections) return undefined;

    const sections = parseData.parse.sections;
    
    // Find matching section
    for (const name of sectionNames) {
      const section = sections.find((s: WikiParseSection) => 
        s.line?.toLowerCase() === name.toLowerCase() ||
        s.line?.toLowerCase().includes(name.toLowerCase())
      );

      if (section) {
        // Fetch the section content
        const content = await this.fetchSectionContent(parseData.parse.title, section.index);
        if (content) {
          return this.cleanWikiText(content);
        }
      }
    }

    return undefined;
  }

  /**
   * Fetch content of a specific section
   */
  private async fetchSectionContent(title: string, sectionIndex: string): Promise<string | null> {
    const url = `${WIKI_API_BASE}?` + new URLSearchParams({
      action: 'query',
      titles: title,
      prop: 'extracts',
      exsectionformat: 'plain',
      explaintext: 'true',
      exlimit: '1',
      section: sectionIndex,
      format: 'json',
      origin: '*',
    });

    try {
      const data = await this.fetchJSON<WikiQueryResponse>(url);
      const pages = data?.query?.pages;
      if (!pages) return null;

      const pageId = Object.keys(pages)[0];
      return pages[pageId]?.extract || null;
    } catch {
      return null;
    }
  }

  /**
   * Clean Wikipedia text by removing wiki markup
   */
  private cleanWikiText(text: string): string {
    return text
      // Remove references like [1], [2], etc.
      .replace(/\[\d+\]/g, '')
      // Remove citation needed tags
      .replace(/\[citation needed\]/gi, '')
      // Remove multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Get plot summary for a movie
   */
  async getPlotSummary(movieTitle: string, year?: number): Promise<WikipediaSectionResult> {
    const sections = await this.getMovieSections(movieTitle, year);
    
    if (sections?.plot) {
      return {
        found: true,
        content: sections.plot,
        wordCount: sections.plot.split(/\s+/).length,
      };
    }

    // Fallback to general summary
    if (sections?.summary) {
      return {
        found: true,
        content: sections.summary,
        wordCount: sections.summary.split(/\s+/).length,
      };
    }

    return { found: false, content: '', wordCount: 0 };
  }

  /**
   * Get critical reception text for a movie
   */
  async getCriticalReception(movieTitle: string, year?: number): Promise<WikipediaSectionResult> {
    const sections = await this.getMovieSections(movieTitle, year);
    
    if (sections?.reception) {
      return {
        found: true,
        content: sections.reception,
        wordCount: sections.reception.split(/\s+/).length,
      };
    }

    return { found: false, content: '', wordCount: 0 };
  }

  /**
   * Get legacy/cultural impact text for a movie
   */
  async getLegacyAndImpact(movieTitle: string, year?: number): Promise<WikipediaSectionResult> {
    const sections = await this.getMovieSections(movieTitle, year);
    
    if (sections?.legacy) {
      return {
        found: true,
        content: sections.legacy,
        wordCount: sections.legacy.split(/\s+/).length,
      };
    }

    return { found: false, content: '', wordCount: 0 };
  }

  /**
   * Get awards/accolades text for a movie
   */
  async getAcoolades(movieTitle: string, year?: number): Promise<WikipediaSectionResult> {
    const sections = await this.getMovieSections(movieTitle, year);
    
    if (sections?.accolades) {
      return {
        found: true,
        content: sections.accolades,
        wordCount: sections.accolades.split(/\s+/).length,
      };
    }

    return { found: false, content: '', wordCount: 0 };
  }

  /**
   * Get all editorial-relevant sections for a movie
   */
  async getEditorialSections(movieTitle: string, year?: number): Promise<{
    plot: WikipediaSectionResult;
    reception: WikipediaSectionResult;
    legacy: WikipediaSectionResult;
    accolades: WikipediaSectionResult;
    hasSufficientData: boolean;
  }> {
    const sections = await this.getMovieSections(movieTitle, year);

    const plot = sections?.plot 
      ? { found: true, content: sections.plot, wordCount: sections.plot.split(/\s+/).length }
      : { found: false, content: '', wordCount: 0 };

    const reception = sections?.reception
      ? { found: true, content: sections.reception, wordCount: sections.reception.split(/\s+/).length }
      : { found: false, content: '', wordCount: 0 };

    const legacy = sections?.legacy
      ? { found: true, content: sections.legacy, wordCount: sections.legacy.split(/\s+/).length }
      : { found: false, content: '', wordCount: 0 };

    const accolades = sections?.accolades
      ? { found: true, content: sections.accolades, wordCount: sections.accolades.split(/\s+/).length }
      : { found: false, content: '', wordCount: 0 };

    // Has sufficient data if we have at least plot and one other section
    const hasSufficientData = plot.found && (reception.found || legacy.found || accolades.found);

    return { plot, reception, legacy, accolades, hasSufficientData };
  }
}

// Singleton instance
let wikipediaFetcherInstance: WikipediaFetcher | null = null;

export function getWikipediaFetcher(): WikipediaFetcher {
  if (!wikipediaFetcherInstance) {
    wikipediaFetcherInstance = new WikipediaFetcher();
  }
  return wikipediaFetcherInstance;
}








