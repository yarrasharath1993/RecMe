/**
 * SEO Utilities for TeluguVibes
 * 
 * Comprehensive SEO toolkit for first-class search engine optimization:
 * - Meta tags (Open Graph, Twitter Card, basic SEO)
 * - Schema.org structured data (Movie, Review, Person, BreadcrumbList)
 * - Canonical URLs
 * - Sitemap generation helpers
 * - Robots.txt validation
 * 
 * Usage:
 *   import { generateMovieSEO, generateMovieSchema } from '@/lib/utils/seo';
 *   
 *   // In page component
 *   export const metadata = generateMovieSEO(movie);
 */

import type { Metadata } from 'next';

// ============================================================
// TYPES
// ============================================================

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  slug: string;
  synopsis?: string;
  release_year?: number;
  release_date?: string;
  poster_url?: string;
  backdrop_url?: string;
  genres?: string[];
  director?: string;
  hero?: string;
  heroine?: string;
  tmdb_rating?: number;
  imdb_rating?: number;
  our_rating?: number;
  language?: string;
}

interface Review {
  id: string;
  movie_id: string;
  reviewer_name: string;
  overall_rating: number;
  verdict: string;
  summary?: string;
  created_at: string;
}

interface Celebrity {
  id: string;
  name: string;
  name_te?: string;
  slug: string;
  profile_image?: string;
  biography?: string;
  birthdate?: string;
  birthplace?: string;
  occupation?: string[];
}

// ============================================================
// META TAG GENERATION
// ============================================================

/**
 * Generate SEO metadata for movie pages
 */
export function generateMovieSEO(movie: Movie, baseUrl: string = 'https://teluguvibes.com'): Metadata {
  const title = `${movie.title_en} (${movie.release_year || 'TBA'}) - Telugu Movie Review`;
  const description = movie.synopsis 
    ? `${movie.synopsis.slice(0, 155)}...`
    : `Watch ${movie.title_en} movie review, ratings, cast, and more. ${movie.director ? `Directed by ${movie.director}.` : ''}`;
  
  const url = `${baseUrl}/reviews/${movie.slug}`;
  const imageUrl = movie.backdrop_url || movie.poster_url || `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: [
      movie.title_en,
      movie.title_te || '',
      'Telugu movie',
      'movie review',
      ...(movie.genres || []),
      movie.director || '',
      movie.hero || '',
      movie.heroine || '',
      movie.release_year?.toString() || '',
    ].filter(Boolean),
    authors: [{ name: 'TeluguVibes Editorial Team' }],
    creator: 'TeluguVibes',
    publisher: 'TeluguVibes',
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'video.movie',
      title,
      description,
      url,
      siteName: 'TeluguVibes',
      locale: 'te_IN',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: movie.title_en,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '@teluguvibes',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Generate SEO metadata for review pages
 */
export function generateReviewSEO(review: Review, movie: Movie, baseUrl: string = 'https://teluguvibes.com'): Metadata {
  const title = `${movie.title_en} Review by ${review.reviewer_name} - ${review.overall_rating}/10`;
  const description = review.summary 
    ? `${review.summary.slice(0, 155)}...`
    : `Read ${review.reviewer_name}'s review of ${movie.title_en}. Rating: ${review.overall_rating}/10. ${review.verdict}`;
  
  const url = `${baseUrl}/reviews/${movie.slug}`;
  const imageUrl = movie.backdrop_url || movie.poster_url || `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: 'TeluguVibes',
      publishedTime: review.created_at,
      authors: [review.reviewer_name],
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: movie.title_en,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

/**
 * Generate SEO metadata for celebrity pages
 */
export function generateCelebritySEO(celebrity: Celebrity, baseUrl: string = 'https://teluguvibes.com'): Metadata {
  const title = `${celebrity.name} - Telugu Cinema Actor/Director - Biography & Movies`;
  const description = celebrity.biography
    ? `${celebrity.biography.slice(0, 155)}...`
    : `Explore ${celebrity.name}'s biography, movies, and filmography. ${celebrity.occupation?.join(', ') || 'Telugu cinema personality'}.`;
  
  const url = `${baseUrl}/celebrities/${celebrity.slug}`;
  const imageUrl = celebrity.profile_image || `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'profile',
      title,
      description,
      url,
      siteName: 'TeluguVibes',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: celebrity.name,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
  };
}

// ============================================================
// SCHEMA.ORG STRUCTURED DATA
// ============================================================

/**
 * Generate Schema.org Movie structured data
 */
export function generateMovieSchema(movie: Movie, baseUrl: string = 'https://teluguvibes.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title_en,
    alternateName: movie.title_te,
    url: `${baseUrl}/reviews/${movie.slug}`,
    image: movie.poster_url,
    description: movie.synopsis,
    datePublished: movie.release_date,
    genre: movie.genres,
    inLanguage: movie.language || 'Telugu',
    director: movie.director ? {
      '@type': 'Person',
      name: movie.director,
    } : undefined,
    actor: [
      movie.hero ? { '@type': 'Person', name: movie.hero } : undefined,
      movie.heroine ? { '@type': 'Person', name: movie.heroine } : undefined,
    ].filter(Boolean),
    aggregateRating: movie.our_rating ? {
      '@type': 'AggregateRating',
      ratingValue: movie.our_rating,
      bestRating: 10,
      worstRating: 0,
    } : undefined,
  };
}

/**
 * Generate Schema.org Review structured data
 */
export function generateReviewSchema(review: Review, movie: Movie, baseUrl: string = 'https://teluguvibes.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Movie',
      name: movie.title_en,
      url: `${baseUrl}/reviews/${movie.slug}`,
      image: movie.poster_url,
    },
    author: {
      '@type': 'Person',
      name: review.reviewer_name,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: review.overall_rating,
      bestRating: 10,
      worstRating: 0,
    },
    reviewBody: review.summary,
    datePublished: review.created_at,
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };
}

/**
 * Generate Schema.org Person structured data (for celebrities)
 */
export function generatePersonSchema(celebrity: Celebrity, baseUrl: string = 'https://teluguvibes.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: celebrity.name,
    alternateName: celebrity.name_te,
    url: `${baseUrl}/celebrities/${celebrity.slug}`,
    image: celebrity.profile_image,
    description: celebrity.biography,
    birthDate: celebrity.birthdate,
    birthPlace: celebrity.birthplace,
    jobTitle: celebrity.occupation?.join(', '),
  };
}

/**
 * Generate Schema.org BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>, baseUrl: string = 'https://teluguvibes.com') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };
}

/**
 * Generate Schema.org Collection structured data (for movie lists)
 */
export function generateCollectionSchema(
  title: string,
  description: string,
  movies: Movie[],
  url: string,
  baseUrl: string = 'https://teluguvibes.com'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: title,
    description,
    url: `${baseUrl}${url}`,
    numberOfItems: movies.length,
    itemListElement: movies.map((movie, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Movie',
        name: movie.title_en,
        url: `${baseUrl}/reviews/${movie.slug}`,
        image: movie.poster_url,
      },
    })),
  };
}

// ============================================================
// SITEMAP HELPERS
// ============================================================

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

/**
 * Generate sitemap entry for movie
 */
export function generateMovieSitemapEntry(movie: Movie, baseUrl: string = 'https://teluguvibes.com'): SitemapEntry {
  return {
    url: `${baseUrl}/reviews/${movie.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  };
}

/**
 * Generate sitemap entry for celebrity
 */
export function generateCelebritySitemapEntry(celebrity: Celebrity, baseUrl: string = 'https://teluguvibes.com'): SitemapEntry {
  return {
    url: `${baseUrl}/celebrities/${celebrity.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  };
}

/**
 * Generate sitemap entry for static page
 */
export function generateStaticSitemapEntry(path: string, priority: number = 0.5, baseUrl: string = 'https://teluguvibes.com'): SitemapEntry {
  return {
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority,
  };
}

// ============================================================
// CANONICAL URL HELPERS
// ============================================================

/**
 * Generate canonical URL
 */
export function getCanonicalUrl(path: string, baseUrl: string = 'https://teluguvibes.com'): string {
  // Remove query params and trailing slashes
  const cleanPath = path.split('?')[0].replace(/\/$/, '');
  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate language alternate URLs
 */
export function getLanguageAlternates(path: string, languages: string[], baseUrl: string = 'https://teluguvibes.com') {
  return languages.map(lang => ({
    hrefLang: lang,
    href: `${baseUrl}/${lang}${path}`,
  }));
}

// ============================================================
// ROBOTS META HELPERS
// ============================================================

/**
 * Generate robots meta tag
 */
export function getRobotsMeta(options: {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nosnippet?: boolean;
  maxSnippet?: number;
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
} = {}) {
  const parts: string[] = [];
  
  parts.push(options.index !== false ? 'index' : 'noindex');
  parts.push(options.follow !== false ? 'follow' : 'nofollow');
  
  if (options.noarchive) parts.push('noarchive');
  if (options.nosnippet) parts.push('nosnippet');
  if (options.maxSnippet) parts.push(`max-snippet:${options.maxSnippet}`);
  if (options.maxImagePreview) parts.push(`max-image-preview:${options.maxImagePreview}`);
  if (options.maxVideoPreview) parts.push(`max-video-preview:${options.maxVideoPreview}`);
  
  return parts.join(', ');
}

// ============================================================
// SEO VALIDATION
// ============================================================

/**
 * Validate SEO-friendly URL slug
 */
export function validateSlug(slug: string): boolean {
  // Must be lowercase, alphanumeric with hyphens, no spaces
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug);
}

/**
 * Generate SEO-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validate meta description length (ideal: 150-160 chars)
 */
export function validateMetaDescription(description: string): {
  valid: boolean;
  length: number;
  message: string;
} {
  const length = description.length;
  
  if (length < 120) {
    return {
      valid: false,
      length,
      message: 'Meta description too short (min 120 chars recommended)',
    };
  }
  
  if (length > 160) {
    return {
      valid: false,
      length,
      message: 'Meta description too long (max 160 chars recommended)',
    };
  }
  
  return {
    valid: true,
    length,
    message: 'Meta description length optimal',
  };
}

/**
 * Validate page title length (ideal: 50-60 chars)
 */
export function validatePageTitle(title: string): {
  valid: boolean;
  length: number;
  message: string;
} {
  const length = title.length;
  
  if (length < 30) {
    return {
      valid: false,
      length,
      message: 'Title too short (min 30 chars recommended)',
    };
  }
  
  if (length > 60) {
    return {
      valid: false,
      length,
      message: 'Title too long (max 60 chars recommended)',
    };
  }
  
  return {
    valid: true,
    length,
    message: 'Title length optimal',
  };
}

// ============================================================
// EXPORTS
// ============================================================

export const seo = {
  // Meta generation
  generateMovieSEO,
  generateReviewSEO,
  generateCelebritySEO,
  
  // Schema.org
  generateMovieSchema,
  generateReviewSchema,
  generatePersonSchema,
  generateBreadcrumbSchema,
  generateCollectionSchema,
  
  // Sitemap
  generateMovieSitemapEntry,
  generateCelebritySitemapEntry,
  generateStaticSitemapEntry,
  
  // URLs
  getCanonicalUrl,
  getLanguageAlternates,
  getRobotsMeta,
  
  // Validation
  validateSlug,
  generateSlug,
  validateMetaDescription,
  validatePageTitle,
};

export default seo;


