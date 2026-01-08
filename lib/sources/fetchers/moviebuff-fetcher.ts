/**
 * MOVIEBUFF FETCHER
 * 
 * Fetches movie data from MovieBuff (moviebuff.com)
 * Uses compliant scraping with rate limiting and robots.txt respect
 * 
 * Data available:
 * - Movie details (title, year, synopsis)
 * - Cast and crew
 * - User reviews and ratings
 * - Release info
 */

import { safeFetcher } from '@/lib/compliance';
import type { ComplianceDataSource } from '@/lib/compliance/types';

// ============================================================
// TYPES
// ============================================================

export interface MovieBuffMovie {
  title: string;
  year: number;
  synopsis?: string;
  poster?: string;
  genre?: string[];
  duration?: number;
  language?: string;
  certification?: string;
  releaseDate?: string;
}

export interface MovieBuffCast {
  name: string;
  role: string;
  character?: string;
  imageUrl?: string;
}

export interface MovieBuffCrew {
  name: string;
  role: string;
  department: string;
}

export interface MovieBuffReview {
  author: string;
  rating: number;
  content: string;
  date: string;
}

export interface MovieBuffResult {
  movie: MovieBuffMovie | null;
  cast: MovieBuffCast[];
  crew: MovieBuffCrew[];
  reviews: MovieBuffReview[];
  source: 'moviebuff';
  url: string;
  fetchedAt: string;
}

// ============================================================
// MOVIEBUFF FETCHER CLASS
// ============================================================

export class MovieBuffFetcher {
  private source: ComplianceDataSource = 'moviebuff';
  private baseUrl = 'https://www.moviebuff.com';

  /**
   * Search for a movie on MovieBuff
   */
  async searchMovie(title: string, year?: number): Promise<string | null> {
    const searchQuery = year ? `${title} ${year}` : title;
    const searchUrl = `${this.baseUrl}/search?q=${encodeURIComponent(searchQuery)}`;

    const result = await safeFetcher.safeFetch<string>(this.source, searchUrl);

    if (!result.success || !result.data) {
      return null;
    }

    // Parse search results to find movie URL
    // MovieBuff uses format: /movie-title-year
    const html = result.data;
    const slugMatch = this.extractMovieSlug(html, title, year);
    
    return slugMatch ? `${this.baseUrl}/${slugMatch}` : null;
  }

  /**
   * Fetch movie details from MovieBuff
   */
  async fetchMovie(titleOrUrl: string, year?: number): Promise<MovieBuffResult> {
    const fetchedAt = new Date().toISOString();
    const emptyResult: MovieBuffResult = {
      movie: null,
      cast: [],
      crew: [],
      reviews: [],
      source: 'moviebuff',
      url: '',
      fetchedAt,
    };

    // Determine URL
    let url: string;
    if (titleOrUrl.startsWith('http')) {
      url = titleOrUrl;
    } else {
      const foundUrl = await this.searchMovie(titleOrUrl, year);
      if (!foundUrl) {
        return emptyResult;
      }
      url = foundUrl;
    }

    // Fetch movie page
    const result = await safeFetcher.safeFetch<string>(this.source, url);

    if (!result.success || !result.data) {
      return { ...emptyResult, url };
    }

    const html = result.data;

    // Parse movie details
    const movie = this.parseMovieDetails(html);
    const cast = this.parseCast(html);
    const crew = this.parseCrew(html);
    const reviews = this.parseReviews(html);

    return {
      movie,
      cast,
      crew,
      reviews,
      source: 'moviebuff',
      url,
      fetchedAt,
    };
  }

  /**
   * Fetch person/celebrity details
   */
  async fetchPerson(name: string): Promise<{
    name: string;
    bio?: string;
    imageUrl?: string;
    filmography: Array<{ title: string; year: number; role: string }>;
  } | null> {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const url = `${this.baseUrl}/people/${slug}`;

    const result = await safeFetcher.safeFetch<string>(this.source, url);

    if (!result.success || !result.data) {
      return null;
    }

    const html = result.data;
    
    // Parse person details
    return {
      name,
      bio: this.extractText(html, 'bio', 'biography'),
      imageUrl: this.extractImageUrl(html, 'profile', 'photo'),
      filmography: this.parseFilmography(html),
    };
  }

  // ============================================================
  // PARSING HELPERS
  // ============================================================

  private extractMovieSlug(html: string, title: string, year?: number): string | null {
    // Look for movie links in search results
    // Format: href="/movie-title-2024"
    const slugPattern = /href="\/([a-z0-9-]+)"/gi;
    const matches = html.matchAll(slugPattern);

    const titleSlug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    for (const match of matches) {
      const slug = match[1];
      // Check if slug matches title pattern
      if (slug.includes(titleSlug) || (year && slug.includes(String(year)))) {
        return slug;
      }
    }

    return null;
  }

  private parseMovieDetails(html: string): MovieBuffMovie | null {
    try {
      // Extract title
      const titleMatch = html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/h1>/i)
        || html.match(/<title>([^|<]+)/i);
      const title = titleMatch ? titleMatch[1].trim() : null;

      if (!title) return null;

      // Extract year
      const yearMatch = html.match(/\((\d{4})\)|release.*?(\d{4})/i);
      const year = yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : new Date().getFullYear();

      // Extract synopsis
      const synopsis = this.extractText(html, 'synopsis', 'description', 'plot', 'story');

      // Extract duration
      const durationMatch = html.match(/(\d+)\s*(?:min|minutes)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : undefined;

      // Extract genre
      const genreMatch = html.match(/genre[^>]*>([^<]+)/gi);
      const genre = genreMatch 
        ? genreMatch.map(g => g.replace(/<[^>]+>/g, '').replace(/genre[^:]*:/i, '').trim())
        : undefined;

      return {
        title,
        year,
        synopsis,
        duration,
        genre,
        language: 'Telugu',
      };
    } catch {
      return null;
    }
  }

  private parseCast(html: string): MovieBuffCast[] {
    const cast: MovieBuffCast[] = [];

    // Look for cast section
    const castSection = html.match(/cast[^>]*>([\s\S]*?)<\/(?:section|div|ul)>/i);
    if (!castSection) return cast;

    // Extract individual cast members
    const memberPattern = /<(?:li|div)[^>]*class="[^"]*cast[^"]*"[^>]*>[\s\S]*?<\/(?:li|div)>/gi;
    const members = castSection[1].matchAll(memberPattern);

    for (const member of members) {
      const memberHtml = member[0];
      
      // Extract name
      const nameMatch = memberHtml.match(/<a[^>]*>([^<]+)<\/a>/i)
        || memberHtml.match(/<h[3-6][^>]*>([^<]+)<\/h[3-6]>/i);
      const name = nameMatch ? nameMatch[1].trim() : null;

      if (!name) continue;

      // Extract role/character
      const roleMatch = memberHtml.match(/as\s+([^<]+)|character[^>]*>([^<]+)/i);
      const character = roleMatch ? (roleMatch[1] || roleMatch[2]).trim() : undefined;

      // Extract image
      const imgMatch = memberHtml.match(/src="([^"]+)"/i);
      const imageUrl = imgMatch ? imgMatch[1] : undefined;

      cast.push({
        name,
        role: 'Actor',
        character,
        imageUrl,
      });

      // Limit to top 10 cast
      if (cast.length >= 10) break;
    }

    return cast;
  }

  private parseCrew(html: string): MovieBuffCrew[] {
    const crew: MovieBuffCrew[] = [];

    // Common crew roles to look for
    const crewRoles = [
      { pattern: /director[^>]*>([^<]+)/i, role: 'Director', department: 'Direction' },
      { pattern: /producer[^>]*>([^<]+)/i, role: 'Producer', department: 'Production' },
      { pattern: /music[^>]*>([^<]+)|composer[^>]*>([^<]+)/i, role: 'Music Director', department: 'Music' },
      { pattern: /cinematograph[^>]*>([^<]+)|dop[^>]*>([^<]+)/i, role: 'Cinematographer', department: 'Camera' },
      { pattern: /writer[^>]*>([^<]+)|screenplay[^>]*>([^<]+)/i, role: 'Writer', department: 'Writing' },
      { pattern: /editor[^>]*>([^<]+)/i, role: 'Editor', department: 'Editing' },
    ];

    for (const { pattern, role, department } of crewRoles) {
      const match = html.match(pattern);
      if (match) {
        const name = (match[1] || match[2]).trim();
        if (name && name.length < 50) {
          crew.push({ name, role, department });
        }
      }
    }

    return crew;
  }

  private parseReviews(html: string): MovieBuffReview[] {
    const reviews: MovieBuffReview[] = [];

    // Look for reviews section
    const reviewPattern = /<div[^>]*class="[^"]*review[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
    const reviewMatches = html.matchAll(reviewPattern);

    for (const match of reviewMatches) {
      const reviewHtml = match[0];

      // Extract author
      const authorMatch = reviewHtml.match(/author[^>]*>([^<]+)|by\s+([^<]+)/i);
      const author = authorMatch ? (authorMatch[1] || authorMatch[2]).trim() : 'Anonymous';

      // Extract rating
      const ratingMatch = reviewHtml.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*10|\/\s*5|stars?)/i);
      let rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;
      // Normalize to 10-point scale
      if (rating <= 5) rating *= 2;

      // Extract content
      const contentMatch = reviewHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
      const content = contentMatch ? contentMatch[1].trim() : '';

      if (content.length > 10) {
        reviews.push({
          author,
          rating,
          content,
          date: new Date().toISOString().split('T')[0],
        });
      }

      // Limit to 5 reviews
      if (reviews.length >= 5) break;
    }

    return reviews;
  }

  private parseFilmography(html: string): Array<{ title: string; year: number; role: string }> {
    const filmography: Array<{ title: string; year: number; role: string }> = [];

    // Look for filmography section
    const filmPattern = /<(?:li|tr|div)[^>]*>.*?<a[^>]*>([^<]+)<\/a>.*?(\d{4}).*?<\/(?:li|tr|div)>/gi;
    const films = html.matchAll(filmPattern);

    for (const film of films) {
      filmography.push({
        title: film[1].trim(),
        year: parseInt(film[2]),
        role: 'Actor', // Default role
      });

      if (filmography.length >= 20) break;
    }

    return filmography;
  }

  private extractText(html: string, ...keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[^>]*>[\\s\\S]*?<p[^>]*>([^<]+)<\\/p>`, 'i');
      const match = html.match(pattern);
      if (match && match[1].trim().length > 20) {
        return match[1].trim();
      }
    }
    return undefined;
  }

  private extractImageUrl(html: string, ...keywords: string[]): string | undefined {
    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[^>]*src="([^"]+)"`, 'i');
      const match = html.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return undefined;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const movieBuffFetcher = new MovieBuffFetcher();

