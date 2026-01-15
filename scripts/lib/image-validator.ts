/**
 * Image Validator
 * 
 * Validates image URLs for:
 * - Accessibility (HTTP status)
 * - Content type (actual image)
 * - Poster/movie matching via TMDB
 * - Placeholder/generic image detection
 */

import chalk from 'chalk';

// ============================================================
// TYPES
// ============================================================

export interface ImageValidationResult {
  url: string;
  isValid: boolean;
  isAccessible: boolean;
  isImage: boolean;
  statusCode?: number;
  contentType?: string;
  error?: string;
  confidence: number;
}

export interface PosterValidationResult extends ImageValidationResult {
  matchesMovie: boolean;
  tmdbPosterUrl?: string;
  similarity?: number;
}

export interface CelebrityImageValidationResult extends ImageValidationResult {
  matchesPerson: boolean;
  tmdbImageUrl?: string;
}

export interface ValidationIssue {
  type: 'broken_url' | 'wrong_poster' | 'wrong_actor_image' | 'placeholder' | 'generic_image';
  entityId: string;
  entityType: 'movie' | 'celebrity';
  entityName: string;
  field: string;
  currentUrl: string;
  suggestedUrl?: string;
  confidence: number;
  autoFixable: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Known placeholder/generic image patterns
const PLACEHOLDER_PATTERNS = [
  /placeholder/i,
  /no-image/i,
  /default\.(jpg|png|webp)/i,
  /missing\.(jpg|png|webp)/i,
  /null/i,
  /undefined/i,
  /avatar-default/i,
  /profile-placeholder/i,
];

// Known bad image hosts
const SUSPICIOUS_HOSTS = [
  'example.com',
  'placeholder.com',
  'via.placeholder.com',
  'dummyimage.com',
];

// ============================================================
// URL VALIDATION
// ============================================================

/**
 * Check if URL is syntactically valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL matches placeholder patterns
 */
export function isPlaceholderUrl(url: string): boolean {
  // Check patterns
  if (PLACEHOLDER_PATTERNS.some(pattern => pattern.test(url))) {
    return true;
  }

  // Check suspicious hosts
  try {
    const hostname = new URL(url).hostname;
    if (SUSPICIOUS_HOSTS.some(host => hostname.includes(host))) {
      return true;
    }
  } catch {
    return true; // Invalid URL is suspicious
  }

  return false;
}

/**
 * Check if image URL is accessible (HTTP HEAD request)
 */
export async function checkImageAccessibility(url: string): Promise<{
  accessible: boolean;
  statusCode?: number;
  contentType?: string;
  error?: string;
}> {
  if (!isValidUrl(url)) {
    return { accessible: false, error: 'Invalid URL format' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'TeluguPortal-ImageValidator/1.0',
      },
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');

    return {
      accessible: response.ok && isImage,
      statusCode: response.status,
      contentType,
      error: !response.ok ? `HTTP ${response.status}` : (!isImage ? 'Not an image' : undefined),
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      accessible: false,
      error: errorMessage.includes('abort') ? 'Timeout' : errorMessage,
    };
  }
}

/**
 * Validate a single image URL
 */
export async function validateImageUrl(url: string): Promise<ImageValidationResult> {
  if (!url || !isValidUrl(url)) {
    return {
      url,
      isValid: false,
      isAccessible: false,
      isImage: false,
      error: 'Invalid URL',
      confidence: 1.0,
    };
  }

  if (isPlaceholderUrl(url)) {
    return {
      url,
      isValid: false,
      isAccessible: true, // Might be accessible but it's a placeholder
      isImage: true,
      error: 'Placeholder image',
      confidence: 0.95,
    };
  }

  const accessibility = await checkImageAccessibility(url);

  return {
    url,
    isValid: accessibility.accessible,
    isAccessible: accessibility.statusCode ? accessibility.statusCode < 400 : false,
    isImage: accessibility.contentType?.startsWith('image/') || false,
    statusCode: accessibility.statusCode,
    contentType: accessibility.contentType,
    error: accessibility.error,
    confidence: accessibility.accessible ? 1.0 : 0.9,
  };
}

// ============================================================
// TMDB VALIDATION
// ============================================================

/**
 * Get correct poster URL from TMDB for a movie
 */
export async function getTMDBPosterUrl(
  title: string,
  year: number,
  language: string = 'te'
): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=${language}`;
    const res = await fetch(searchUrl);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      // Find Telugu movie
      const teluguMovie = data.results.find((m: { original_language: string; poster_path: string }) => 
        m.original_language === 'te' && m.poster_path
      ) || data.results.find((m: { poster_path: string }) => m.poster_path);
      
      if (teluguMovie?.poster_path) {
        return `${TMDB_IMAGE_BASE}/w500${teluguMovie.poster_path}`;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Get correct profile image from TMDB for a person
 */
export async function getTMDBPersonImage(name: string): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const res = await fetch(searchUrl);
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      const person = data.results.find((p: { profile_path: string }) => p.profile_path);
      if (person?.profile_path) {
        return `${TMDB_IMAGE_BASE}/w185${person.profile_path}`;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Validate movie poster against TMDB
 */
export async function validateMoviePoster(
  currentUrl: string,
  movieTitle: string,
  movieYear: number
): Promise<PosterValidationResult> {
  const baseValidation = await validateImageUrl(currentUrl);
  
  if (!baseValidation.isValid) {
    const tmdbPoster = await getTMDBPosterUrl(movieTitle, movieYear);
    return {
      ...baseValidation,
      matchesMovie: false,
      tmdbPosterUrl: tmdbPoster || undefined,
    };
  }

  // If current URL is from TMDB, it's likely correct
  if (currentUrl.includes('image.tmdb.org')) {
    return {
      ...baseValidation,
      matchesMovie: true,
      confidence: 0.95,
    };
  }

  // For other sources, we can't easily verify without image comparison
  // Just check if TMDB has a poster we could use instead
  const tmdbPoster = await getTMDBPosterUrl(movieTitle, movieYear);

  return {
    ...baseValidation,
    matchesMovie: true, // Assume it's correct if accessible
    tmdbPosterUrl: tmdbPoster || undefined,
    confidence: tmdbPoster ? 0.7 : 0.8, // Lower confidence if TMDB has different poster
  };
}

/**
 * Validate celebrity image against TMDB
 */
export async function validateCelebrityImage(
  currentUrl: string,
  personName: string
): Promise<CelebrityImageValidationResult> {
  const baseValidation = await validateImageUrl(currentUrl);
  
  if (!baseValidation.isValid) {
    const tmdbImage = await getTMDBPersonImage(personName);
    return {
      ...baseValidation,
      matchesPerson: false,
      tmdbImageUrl: tmdbImage || undefined,
    };
  }

  // If current URL is from TMDB, it's likely correct
  if (currentUrl.includes('image.tmdb.org')) {
    return {
      ...baseValidation,
      matchesPerson: true,
      confidence: 0.95,
    };
  }

  const tmdbImage = await getTMDBPersonImage(personName);

  return {
    ...baseValidation,
    matchesPerson: true,
    tmdbImageUrl: tmdbImage || undefined,
    confidence: tmdbImage ? 0.7 : 0.8,
  };
}

// ============================================================
// BATCH VALIDATION
// ============================================================

/**
 * Validate multiple URLs in parallel with rate limiting
 */
export async function batchValidateUrls(
  urls: string[],
  concurrency: number = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, ImageValidationResult>> {
  const results = new Map<string, ImageValidationResult>();
  const uniqueUrls = [...new Set(urls.filter(u => u))];
  
  let completed = 0;
  
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => validateImageUrl(url))
    );
    
    batch.forEach((url, index) => {
      results.set(url, batchResults[index]);
    });
    
    completed += batch.length;
    onProgress?.(completed, uniqueUrls.length);
    
    // Rate limit: wait 100ms between batches
    if (i + concurrency < uniqueUrls.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  
  return results;
}

// ============================================================
// ISSUE DETECTION
// ============================================================

/**
 * Detect image-related issues for a movie
 */
export async function detectMovieImageIssues(movie: {
  id: string;
  title_en: string;
  release_year: number;
  poster_url?: string | null;
}): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  if (!movie.poster_url) {
    // Missing poster - try to find one from TMDB
    const tmdbPoster = await getTMDBPosterUrl(movie.title_en, movie.release_year);
    if (tmdbPoster) {
      issues.push({
        type: 'broken_url',
        entityId: movie.id,
        entityType: 'movie',
        entityName: movie.title_en,
        field: 'poster_url',
        currentUrl: '',
        suggestedUrl: tmdbPoster,
        confidence: 0.9,
        autoFixable: true,
      });
    }
    return issues;
  }

  const validation = await validateMoviePoster(movie.poster_url, movie.title_en, movie.release_year);
  
  if (!validation.isAccessible) {
    issues.push({
      type: 'broken_url',
      entityId: movie.id,
      entityType: 'movie',
      entityName: movie.title_en,
      field: 'poster_url',
      currentUrl: movie.poster_url,
      suggestedUrl: validation.tmdbPosterUrl,
      confidence: 0.95,
      autoFixable: !!validation.tmdbPosterUrl,
    });
  } else if (isPlaceholderUrl(movie.poster_url)) {
    issues.push({
      type: 'placeholder',
      entityId: movie.id,
      entityType: 'movie',
      entityName: movie.title_en,
      field: 'poster_url',
      currentUrl: movie.poster_url,
      suggestedUrl: validation.tmdbPosterUrl,
      confidence: 0.9,
      autoFixable: !!validation.tmdbPosterUrl,
    });
  }
  
  return issues;
}

/**
 * Detect image-related issues for a celebrity
 */
export async function detectCelebrityImageIssues(celebrity: {
  id: string;
  name_en: string;
  profile_image?: string | null;
}): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  
  if (!celebrity.profile_image) {
    const tmdbImage = await getTMDBPersonImage(celebrity.name_en);
    if (tmdbImage) {
      issues.push({
        type: 'broken_url',
        entityId: celebrity.id,
        entityType: 'celebrity',
        entityName: celebrity.name_en,
        field: 'profile_image',
        currentUrl: '',
        suggestedUrl: tmdbImage,
        confidence: 0.85,
        autoFixable: true,
      });
    }
    return issues;
  }

  const validation = await validateCelebrityImage(celebrity.profile_image, celebrity.name_en);
  
  if (!validation.isAccessible) {
    issues.push({
      type: 'broken_url',
      entityId: celebrity.id,
      entityType: 'celebrity',
      entityName: celebrity.name_en,
      field: 'profile_image',
      currentUrl: celebrity.profile_image,
      suggestedUrl: validation.tmdbImageUrl,
      confidence: 0.95,
      autoFixable: !!validation.tmdbImageUrl,
    });
  } else if (isPlaceholderUrl(celebrity.profile_image)) {
    issues.push({
      type: 'placeholder',
      entityId: celebrity.id,
      entityType: 'celebrity',
      entityName: celebrity.name_en,
      field: 'profile_image',
      currentUrl: celebrity.profile_image,
      suggestedUrl: validation.tmdbImageUrl,
      confidence: 0.9,
      autoFixable: !!validation.tmdbImageUrl,
    });
  }
  
  return issues;
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Print validation summary
 */
export function printValidationSummary(
  results: Map<string, ImageValidationResult>,
  verbose: boolean = false
): void {
  let valid = 0;
  let broken = 0;
  let placeholder = 0;
  
  results.forEach((result, url) => {
    if (result.isValid) {
      valid++;
    } else if (isPlaceholderUrl(url)) {
      placeholder++;
    } else {
      broken++;
    }
    
    if (verbose && !result.isValid) {
      console.log(chalk.red(`  ✗ ${url.substring(0, 60)}... - ${result.error}`));
    }
  });
  
  console.log(chalk.cyan(`\n  Image Validation Summary:`));
  console.log(`    Valid:       ${chalk.green(valid.toString())}`);
  console.log(`    Broken:      ${chalk.red(broken.toString())}`);
  console.log(`    Placeholder: ${chalk.yellow(placeholder.toString())}`);
}
