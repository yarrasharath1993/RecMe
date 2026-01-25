import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Cast Images API (Enhanced)
 * Fetches profile images for movie cast members (hero, heroine, director)
 * Features:
 * - Database lookup with fuzzy matching
 * - TMDB fallback
 * - Image URL validation
 * - Aggressive caching
 * - Auto-save discovered images to DB
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w185';

// In-memory cache for faster repeated lookups
const imageCache = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// ============================================================
// TYPES
// ============================================================

interface CastImagesResponse {
  hero?: string | null;
  heroine?: string | null;
  director?: string | null;
}

// ============================================================
// IMAGE VALIDATION
// ============================================================

/**
 * Check if an image URL is valid and accessible
 */
async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') || false);
  } catch {
    return false;
  }
}

/**
 * Validate and return URL only if it's accessible
 */
async function getValidatedImageUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  
  // Check common invalid patterns
  if (url.includes('placeholder') || url.includes('null') || url.includes('undefined')) {
    return null;
  }
  
  // For TMDB images, trust they're valid (they have good uptime)
  if (url.includes('image.tmdb.org')) {
    return url;
  }
  
  // For other sources, validate
  const isValid = await isImageUrlValid(url);
  return isValid ? url : null;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Normalize name for matching (lowercase, remove extra spaces, handle special chars)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,'"-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check cache for image
 */
function getCachedImage(name: string): string | null | undefined {
  const cached = imageCache.get(normalizeName(name));
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }
  return undefined;
}

/**
 * Set cache for image
 */
function setCachedImage(name: string, url: string | null): void {
  imageCache.set(normalizeName(name), { url, timestamp: Date.now() });
}

/**
 * Look up celebrity image from database with fuzzy matching
 */
async function getCelebrityImage(name: string): Promise<string | null> {
  const normalizedName = normalizeName(name);
  
  // Try exact match first
  const { data: exactMatch } = await supabase
    .from('celebrities')
    .select('id, profile_image')
    .ilike('name_en', name)
    .not('profile_image', 'is', null)
    .limit(1)
    .single();

  if (exactMatch?.profile_image) {
    const validUrl = await getValidatedImageUrl(exactMatch.profile_image);
    if (validUrl) return validUrl;
    
    // If URL is invalid, clear it from DB
    await supabase
      .from('celebrities')
      .update({ profile_image: null })
      .eq('id', exactMatch.id);
  }

  // Try variations (e.g., "Jr. NTR" -> "Jr NTR" -> "NTR Jr")
  const nameVariations = [
    name,
    name.replace(/\./g, ''),
    name.replace(/Jr\./gi, 'Jr'),
    name.replace(/Sr\./gi, 'Sr'),
    name.split(' ').reverse().join(' '),
  ];

  for (const variation of nameVariations) {
    const { data: match } = await supabase
      .from('celebrities')
      .select('profile_image')
      .ilike('name_en', `%${variation}%`)
      .not('profile_image', 'is', null)
      .limit(1)
      .single();

    if (match?.profile_image) {
      const validUrl = await getValidatedImageUrl(match.profile_image);
      if (validUrl) return validUrl;
    }
  }

  return null;
}

/**
 * Fetch person image from TMDB API
 */
async function getTMDBPersonImage(name: string): Promise<string | null> {
  if (!TMDB_API_KEY) return null;

  try {
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(name)}`;
    const res = await fetch(searchUrl, { 
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.results && data.results.length > 0) {
      // Find best match - prefer actors with profile images
      const bestMatch = data.results.find((p: { known_for_department: string; profile_path: string }) => 
        p.known_for_department === 'Acting' && p.profile_path
      ) || data.results.find((p: { known_for_department: string; profile_path: string }) => 
        p.known_for_department === 'Directing' && p.profile_path
      ) || data.results.find((p: { profile_path: string }) => p.profile_path);
      
      if (bestMatch?.profile_path) {
        return `${TMDB_IMAGE_BASE}${bestMatch.profile_path}`;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Save discovered image to database for future use
 */
async function saveImageToDb(name: string, imageUrl: string, tmdbId?: number): Promise<void> {
  try {
    // Check if celebrity exists
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id, profile_image')
      .ilike('name_en', name)
      .limit(1)
      .single();

    if (existing) {
      // Update if missing image
      if (!existing.profile_image) {
        await supabase
          .from('celebrities')
          .update({ 
            profile_image: imageUrl,
            profile_image_source: 'TMDB',
            ...(tmdbId && { tmdb_id: tmdbId }),
          })
          .eq('id', existing.id);
      }
    } else {
      // Create new entry
      await supabase
        .from('celebrities')
        .insert({
          name_en: name,
          profile_image: imageUrl,
          profile_image_source: 'TMDB',
          ...(tmdbId && { tmdb_id: tmdbId }),
          is_published: true,
        });
    }
  } catch {
    // Silently fail - this is just for caching
  }
}

/**
 * Get image for a person (tries cache -> DB -> TMDB)
 */
async function getPersonImage(name: string): Promise<string | null> {
  // Check in-memory cache first
  const cached = getCachedImage(name);
  if (cached !== undefined) {
    return cached;
  }

  // Try database
  const dbImage = await getCelebrityImage(name);
  if (dbImage) {
    setCachedImage(name, dbImage);
    return dbImage;
  }
  
  // Fall back to TMDB
  const tmdbImage = await getTMDBPersonImage(name);
  if (tmdbImage) {
    // Save to DB for future lookups
    saveImageToDb(name, tmdbImage);
    setCachedImage(name, tmdbImage);
    return tmdbImage;
  }

  // Cache the "not found" result too
  setCachedImage(name, null);
  return null;
}

// ============================================================
// API HANDLER - GET
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const hero = searchParams.get('hero');
    const heroine = searchParams.get('heroine');
    const director = searchParams.get('director');

    // Validate at least one parameter
    if (!hero && !heroine && !director) {
      return NextResponse.json(
        { error: 'At least one cast member name is required' },
        { status: 400 }
      );
    }

    const response: CastImagesResponse = {};

    // Fetch images in parallel
    const [heroImage, heroineImage, directorImage] = await Promise.all([
      hero ? getPersonImage(hero) : null,
      heroine ? getPersonImage(heroine) : null,
      director ? getPersonImage(director) : null,
    ]);

    if (hero) response.hero = heroImage;
    if (heroine) response.heroine = heroineImage;
    if (director) response.director = directorImage;

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Cast images API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cast images' },
      { status: 500 }
    );
  }
}

// ============================================================
// API HANDLER - POST (Batch)
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!Array.isArray(body.movies)) {
      return NextResponse.json(
        { error: 'movies array is required' },
        { status: 400 }
      );
    }

    const results: Record<string, CastImagesResponse> = {};
    
    // Collect unique names to minimize API calls
    const uniqueNames = new Set<string>();
    for (const movie of body.movies) {
      if (movie.hero) uniqueNames.add(movie.hero);
      if (movie.heroine) uniqueNames.add(movie.heroine);
      if (movie.director) uniqueNames.add(movie.director);
    }

    // Fetch all images in parallel (with concurrency limit)
    const nameArray = Array.from(uniqueNames);
    const BATCH_SIZE = 10;
    const imageMap = new Map<string, string | null>();

    for (let i = 0; i < nameArray.length; i += BATCH_SIZE) {
      const batch = nameArray.slice(i, i + BATCH_SIZE);
      const images = await Promise.all(
        batch.map(name => getPersonImage(name))
      );
      batch.forEach((name, index) => {
        imageMap.set(name, images[index]);
      });
    }

    // Build results for each movie
    for (const movie of body.movies) {
      if (!movie.id) continue;
      
      results[movie.id] = {
        hero: movie.hero ? imageMap.get(movie.hero) || null : null,
        heroine: movie.heroine ? imageMap.get(movie.heroine) || null : null,
        director: movie.director ? imageMap.get(movie.director) || null : null,
      };
    }

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Cast images batch API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cast images' },
      { status: 500 }
    );
  }
}
