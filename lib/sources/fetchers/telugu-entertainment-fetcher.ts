/**
 * TELUGU ENTERTAINMENT SITES FETCHER
 * 
 * Unified fetcher for Telugu entertainment sites:
 * - Idlebrain (reviews, gallery)
 * - GreatAndhra (reviews, opinions)
 * - 123Telugu (reviews, news)
 * - Filmibeat Telugu (glamour, gossip)
 * 
 * All fetching is done through the compliance layer with rate limiting
 */

import { safeFetcher } from '@/lib/compliance';
import type { ComplianceDataSource } from '@/lib/compliance/types';

// ============================================================
// TYPES
// ============================================================

export interface TeluguReview {
  source: 'idlebrain' | 'greatandhra' | '123telugu' | 'filmibeat';
  movieTitle: string;
  rating: number; // Normalized to 10-point scale
  verdict: string;
  pros: string[];
  cons: string[];
  summary: string;
  reviewerName?: string;
  reviewDate?: string;
  url: string;
}

export interface TeluguGalleryImage {
  url: string;
  thumbnail?: string;
  caption?: string;
  source: string;
}

export interface TeluguNewsItem {
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
  category: 'news' | 'review' | 'gossip' | 'interview';
}

// ============================================================
// SITE CONFIGS
// ============================================================

const SITE_CONFIGS = {
  idlebrain: {
    baseUrl: 'https://www.idlebrain.com',
    reviewPath: '/movie/reviews',
    galleryPath: '/gallery',
    source: 'idlebrain' as ComplianceDataSource,
  },
  greatandhra: {
    baseUrl: 'https://www.greatandhra.com',
    reviewPath: '/movies/reviews',
    newsPath: '/movies/news',
    source: 'greatandhra' as ComplianceDataSource,
  },
  telugu123: {
    baseUrl: 'https://www.123telugu.com',
    reviewPath: '/reviews',
    newsPath: '/category/news',
    source: '123telugu' as ComplianceDataSource,
  },
  filmibeat: {
    baseUrl: 'https://www.filmibeat.com/telugu',
    reviewPath: '/reviews',
    glamourPath: '/photos',
    source: 'filmibeat' as ComplianceDataSource,
  },
};

// ============================================================
// TELUGU ENTERTAINMENT FETCHER CLASS
// ============================================================

export class TeluguEntertainmentFetcher {
  /**
   * Search for movie reviews across all Telugu sites
   */
  async searchReviews(movieTitle: string, year?: number): Promise<TeluguReview[]> {
    const reviews: TeluguReview[] = [];
    const searchPromises = [
      this.fetchIdlebrainReview(movieTitle, year),
      this.fetchGreatAndhraReview(movieTitle, year),
      this.fetch123TeluguReview(movieTitle, year),
      this.fetchFilmibeatReview(movieTitle, year),
    ];

    const results = await Promise.allSettled(searchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        reviews.push(result.value);
      }
    }

    return reviews;
  }

  /**
   * Fetch review from Idlebrain
   */
  async fetchIdlebrainReview(movieTitle: string, year?: number): Promise<TeluguReview | null> {
    const config = SITE_CONFIGS.idlebrain;
    const slug = this.createSlug(movieTitle);
    const yearSuffix = year ? `-${year}` : '';
    const url = `${config.baseUrl}${config.reviewPath}/${slug}${yearSuffix}.html`;

    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (!result.success || !result.data) {
      // Try alternate URL format
      const altUrl = `${config.baseUrl}${config.reviewPath}/${slug}.html`;
      const altResult = await safeFetcher.safeFetch<string>(config.source, altUrl);
      
      if (!altResult.success || !altResult.data) {
        return null;
      }
      
      return this.parseIdlebrainReview(altResult.data, altUrl, movieTitle);
    }

    return this.parseIdlebrainReview(result.data, url, movieTitle);
  }

  /**
   * Fetch review from GreatAndhra
   */
  async fetchGreatAndhraReview(movieTitle: string, year?: number): Promise<TeluguReview | null> {
    const config = SITE_CONFIGS.greatandhra;
    const slug = this.createSlug(movieTitle);
    const yearSuffix = year ? `-${year}` : '';
    const url = `${config.baseUrl}${config.reviewPath}/${slug}${yearSuffix}-review`;

    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseGreatAndhraReview(result.data, url, movieTitle);
  }

  /**
   * Fetch review from 123Telugu
   */
  async fetch123TeluguReview(movieTitle: string, year?: number): Promise<TeluguReview | null> {
    const config = SITE_CONFIGS.telugu123;
    const slug = this.createSlug(movieTitle);
    const yearSuffix = year ? `-${year}` : '';
    const url = `${config.baseUrl}${config.reviewPath}/${slug}${yearSuffix}-review/`;

    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (!result.success || !result.data) {
      return null;
    }

    return this.parse123TeluguReview(result.data, url, movieTitle);
  }

  /**
   * Fetch review from Filmibeat
   */
  async fetchFilmibeatReview(movieTitle: string, year?: number): Promise<TeluguReview | null> {
    const config = SITE_CONFIGS.filmibeat;
    const slug = this.createSlug(movieTitle);
    const yearSuffix = year ? `-${year}` : '';
    const url = `${config.baseUrl}${config.reviewPath}/${slug}${yearSuffix}-review.html`;

    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (!result.success || !result.data) {
      return null;
    }

    return this.parseFilmibeatReview(result.data, url, movieTitle);
  }

  /**
   * Fetch latest news from all sources
   */
  async fetchLatestNews(limit = 20): Promise<TeluguNewsItem[]> {
    const allNews: TeluguNewsItem[] = [];

    // Fetch from GreatAndhra
    const gaNews = await this.fetchGreatAndhraNews();
    allNews.push(...gaNews);

    // Fetch from 123Telugu
    const teluguNews = await this.fetch123TeluguNews();
    allNews.push(...teluguNews);

    // Sort by date and limit
    return allNews
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Fetch gallery images for a movie
   */
  async fetchGallery(movieTitle: string): Promise<TeluguGalleryImage[]> {
    const images: TeluguGalleryImage[] = [];

    // Try Idlebrain gallery
    const config = SITE_CONFIGS.idlebrain;
    const slug = this.createSlug(movieTitle);
    const url = `${config.baseUrl}${config.galleryPath}/${slug}/`;

    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (result.success && result.data) {
      const parsed = this.parseGalleryImages(result.data, 'idlebrain');
      images.push(...parsed);
    }

    return images;
  }

  // ============================================================
  // PARSING HELPERS
  // ============================================================

  private parseIdlebrainReview(html: string, url: string, movieTitle: string): TeluguReview | null {
    try {
      // Extract rating (Idlebrain uses X/5 format)
      const ratingMatch = html.match(/rating[^>]*>(\d+(?:\.\d+)?)\s*\/\s*5/i)
        || html.match(/(\d+(?:\.\d+)?)\s*\/\s*5/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) * 2 : 0; // Convert to 10-point scale

      // Extract verdict
      const verdictMatch = html.match(/verdict[^>]*>([^<]+)/i)
        || html.match(/<strong>verdict[^<]*<\/strong>\s*:?\s*([^<]+)/i);
      const verdict = verdictMatch ? verdictMatch[1].trim() : '';

      // Extract summary (first substantial paragraph)
      const summaryMatch = html.match(/<p[^>]*>([^<]{100,})<\/p>/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : '';

      // Extract pros and cons
      const pros = this.extractListItems(html, 'plus', 'positive', 'good');
      const cons = this.extractListItems(html, 'minus', 'negative', 'bad', 'weak');

      return {
        source: 'idlebrain',
        movieTitle,
        rating,
        verdict,
        pros,
        cons,
        summary,
        url,
      };
    } catch {
      return null;
    }
  }

  private parseGreatAndhraReview(html: string, url: string, movieTitle: string): TeluguReview | null {
    try {
      // Extract rating (GreatAndhra uses X/5 or X/10 format)
      const ratingMatch = html.match(/rating[^>]*>(\d+(?:\.\d+)?)\s*\/\s*(\d+)/i);
      let rating = 0;
      if (ratingMatch) {
        const value = parseFloat(ratingMatch[1]);
        const scale = parseInt(ratingMatch[2]);
        rating = scale === 5 ? value * 2 : value;
      }

      // Extract verdict
      const verdictMatch = html.match(/verdict[^>]*>([^<]+)/i);
      const verdict = verdictMatch ? verdictMatch[1].trim() : '';

      // Extract summary
      const summaryMatch = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      let summary = '';
      if (summaryMatch) {
        summary = summaryMatch[1].replace(/<[^>]+>/g, ' ').trim().substring(0, 500);
      }

      return {
        source: 'greatandhra',
        movieTitle,
        rating,
        verdict,
        pros: [],
        cons: [],
        summary,
        url,
      };
    } catch {
      return null;
    }
  }

  private parse123TeluguReview(html: string, url: string, movieTitle: string): TeluguReview | null {
    try {
      // Extract rating
      const ratingMatch = html.match(/rating[^>]*>(\d+(?:\.\d+)?)/i)
        || html.match(/(\d+(?:\.\d+)?)\s*out\s*of\s*5/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) * 2 : 0;

      // Extract verdict
      const verdictMatch = html.match(/verdict[^>]*>([^<]+)/i)
        || html.match(/final\s*word[^>]*>([^<]+)/i);
      const verdict = verdictMatch ? verdictMatch[1].trim() : '';

      // Extract summary
      const summaryMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
      let summary = '';
      if (summaryMatch) {
        const text = summaryMatch[1].replace(/<[^>]+>/g, ' ').trim();
        summary = text.substring(0, 500);
      }

      return {
        source: '123telugu',
        movieTitle,
        rating,
        verdict,
        pros: [],
        cons: [],
        summary,
        url,
      };
    } catch {
      return null;
    }
  }

  private parseFilmibeatReview(html: string, url: string, movieTitle: string): TeluguReview | null {
    try {
      // Extract rating
      const ratingMatch = html.match(/rating[^>]*>(\d+(?:\.\d+)?)/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

      // Extract verdict
      const verdictMatch = html.match(/verdict[^>]*>([^<]+)/i);
      const verdict = verdictMatch ? verdictMatch[1].trim() : '';

      // Extract summary
      const summaryMatch = html.match(/<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      let summary = '';
      if (summaryMatch) {
        summary = summaryMatch[1].replace(/<[^>]+>/g, ' ').trim().substring(0, 500);
      }

      return {
        source: 'filmibeat',
        movieTitle,
        rating,
        verdict,
        pros: [],
        cons: [],
        summary,
        url,
      };
    } catch {
      return null;
    }
  }

  private async fetchGreatAndhraNews(): Promise<TeluguNewsItem[]> {
    const config = SITE_CONFIGS.greatandhra;
    const url = `${config.baseUrl}${config.newsPath}`;
    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseNewsItems(result.data, 'greatandhra');
  }

  private async fetch123TeluguNews(): Promise<TeluguNewsItem[]> {
    const config = SITE_CONFIGS.telugu123;
    const url = `${config.baseUrl}${config.newsPath}`;
    const result = await safeFetcher.safeFetch<string>(config.source, url);

    if (!result.success || !result.data) {
      return [];
    }

    return this.parseNewsItems(result.data, '123telugu');
  }

  private parseNewsItems(html: string, source: string): TeluguNewsItem[] {
    const items: TeluguNewsItem[] = [];
    const articlePattern = /<article[^>]*>[\s\S]*?<\/article>/gi;
    const articles = html.matchAll(articlePattern);

    for (const article of articles) {
      const articleHtml = article[0];

      // Extract title
      const titleMatch = articleHtml.match(/<h[2-4][^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      const title = titleMatch ? titleMatch[1].trim() : null;

      if (!title) continue;

      // Extract URL
      const urlMatch = articleHtml.match(/href="([^"]+)"/i);
      const articleUrl = urlMatch ? urlMatch[1] : '';

      // Extract summary
      const summaryMatch = articleHtml.match(/<p[^>]*>([^<]+)<\/p>/i);
      const summary = summaryMatch ? summaryMatch[1].trim() : '';

      // Extract image
      const imageMatch = articleHtml.match(/src="([^"]+\.(jpg|png|webp))"/i);
      const imageUrl = imageMatch ? imageMatch[1] : undefined;

      items.push({
        title,
        summary,
        url: articleUrl.startsWith('http') ? articleUrl : `https://www.${source}.com${articleUrl}`,
        imageUrl,
        publishedAt: new Date().toISOString(),
        source,
        category: 'news',
      });

      if (items.length >= 10) break;
    }

    return items;
  }

  private parseGalleryImages(html: string, source: string): TeluguGalleryImage[] {
    const images: TeluguGalleryImage[] = [];
    const imgPattern = /<img[^>]*src="([^"]+)"[^>]*>/gi;
    const matches = html.matchAll(imgPattern);

    for (const match of matches) {
      const url = match[1];
      if (url.includes('gallery') || url.includes('movie') || url.includes('still')) {
        images.push({
          url,
          source,
        });
      }

      if (images.length >= 20) break;
    }

    return images;
  }

  private extractListItems(html: string, ...keywords: string[]): string[] {
    const items: string[] = [];

    for (const keyword of keywords) {
      const pattern = new RegExp(`${keyword}[^>]*>([\\s\\S]*?)<\\/(?:ul|ol|div)>`, 'i');
      const match = html.match(pattern);

      if (match) {
        const liPattern = /<li[^>]*>([^<]+)<\/li>/gi;
        const lis = match[1].matchAll(liPattern);

        for (const li of lis) {
          const text = li[1].trim();
          if (text.length > 5) {
            items.push(text);
          }
        }
      }
    }

    return items;
  }

  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const teluguEntertainmentFetcher = new TeluguEntertainmentFetcher();

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export async function fetchTeluguReviews(
  movieTitle: string,
  year?: number
): Promise<TeluguReview[]> {
  return teluguEntertainmentFetcher.searchReviews(movieTitle, year);
}

export async function fetchTeluguNews(limit = 20): Promise<TeluguNewsItem[]> {
  return teluguEntertainmentFetcher.fetchLatestNews(limit);
}

