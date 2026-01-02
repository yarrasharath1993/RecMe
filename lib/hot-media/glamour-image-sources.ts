/**
 * Multi-Source Glamour Image Fetcher
 * 
 * Prioritizes full-body glamour shots over headshots
 * Sources: TMDB Movie Stills → TMDB Tagged → Wikimedia Commons → YouTube Thumbnails
 */

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Get API key at runtime (after dotenv loads)
function getTMDBApiKey(): string | undefined {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
}

export interface GlamourImage {
  url: string;
  thumbnail_url: string;
  source: 'tmdb_movie_still' | 'tmdb_tagged' | 'tmdb_backdrop' | 'wikimedia' | 'youtube' | 'tmdb_profile';
  width: number;
  height: number;
  aspect_ratio: number;
  movie_title?: string;
  license: string;
  confidence: number; // Higher = more likely to be glamour
  is_full_body: boolean;
}

interface TMDBImage {
  file_path: string;
  aspect_ratio: number;
  width: number;
  height: number;
  vote_average?: number;
}

interface TMDBTaggedImage {
  file_path: string;
  aspect_ratio: number;
  width: number;
  height: number;
  media: {
    title?: string;
    name?: string;
  };
}

interface TMDBMovie {
  id: number;
  title: string;
  original_language: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

/**
 * Find TMDB person ID by name
 */
async function findTMDBPersonId(name: string): Promise<number | null> {
  const apiKey = getTMDBApiKey();
  if (!apiKey) {
    console.log('   ⚠️ TMDB_API_KEY not set');
    return null;
  }
  
  try {
    const url = `${TMDB_BASE}/search/person?api_key=${apiKey}&query=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.log(`   ⚠️ TMDB search failed: ${res.status}`);
      return null;
    }
    
    const data = await res.json();
    const personId = data.results?.[0]?.id || null;
    
    if (!personId) {
      console.log(`   ⚠️ No TMDB match for: ${name}`);
    }
    
    return personId;
  } catch (error) {
    console.log(`   ⚠️ TMDB error: ${error}`);
    return null;
  }
}

/**
 * Get movies an actress appeared in (Telugu focus)
 */
async function getActressMovies(personId: number, limit = 10): Promise<TMDBMovie[]> {
  const apiKey = getTMDBApiKey();
  if (!apiKey) return [];
  
  try {
    const res = await fetch(
      `${TMDB_BASE}/person/${personId}/movie_credits?api_key=${apiKey}`
    );
    const data = await res.json();
    
    // Prioritize Telugu (te) and Hindi (hi) movies
    const sorted = (data.cast || [])
      .filter((m: TMDBMovie) => m.backdrop_path || m.poster_path)
      .sort((a: TMDBMovie, b: TMDBMovie) => {
        // Telugu first
        if (a.original_language === 'te' && b.original_language !== 'te') return -1;
        if (b.original_language === 'te' && a.original_language !== 'te') return 1;
        // Then Hindi
        if (a.original_language === 'hi' && b.original_language !== 'hi') return -1;
        if (b.original_language === 'hi' && a.original_language !== 'hi') return 1;
        return 0;
      });
    
    return sorted.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Get movie backdrops and stills (FULL BODY shots!)
 */
async function getMovieImages(movieId: number): Promise<GlamourImage[]> {
  const apiKey = getTMDBApiKey();
  if (!apiKey) return [];
  
  try {
    const res = await fetch(
      `${TMDB_BASE}/movie/${movieId}/images?api_key=${apiKey}`
    );
    const data = await res.json();
    
    const images: GlamourImage[] = [];
    
    // Backdrops are usually wide shots with full body
    for (const img of (data.backdrops || []).slice(0, 3)) {
      if (img.aspect_ratio > 1.5) { // Wide images
        images.push({
          url: `${TMDB_IMAGE_BASE}/w1280${img.file_path}`,
          thumbnail_url: `${TMDB_IMAGE_BASE}/w500${img.file_path}`,
          source: 'tmdb_backdrop',
          width: img.width,
          height: img.height,
          aspect_ratio: img.aspect_ratio,
          license: 'TMDB API',
          confidence: 85,
          is_full_body: true,
        });
      }
    }
    
    return images;
  } catch {
    return [];
  }
}

/**
 * Get tagged images (events, photoshoots, movie stills)
 * These are often FULL BODY glamour shots!
 */
async function getTaggedImages(personId: number, limit = 10): Promise<GlamourImage[]> {
  const apiKey = getTMDBApiKey();
  if (!apiKey) return [];
  
  try {
    const res = await fetch(
      `${TMDB_BASE}/person/${personId}/tagged_images?api_key=${apiKey}&page=1`
    );
    const data = await res.json();
    
    const images: GlamourImage[] = [];
    
    for (const img of (data.results || []).slice(0, limit)) {
      // Prefer landscape/square images (more likely to be full body)
      const isLandscape = img.aspect_ratio >= 1.0;
      const isHighRes = img.width >= 800;
      
      if (isHighRes) {
        images.push({
          url: `${TMDB_IMAGE_BASE}/w1280${img.file_path}`,
          thumbnail_url: `${TMDB_IMAGE_BASE}/w500${img.file_path}`,
          source: 'tmdb_tagged',
          width: img.width,
          height: img.height,
          aspect_ratio: img.aspect_ratio,
          movie_title: img.media?.title || img.media?.name,
          license: 'TMDB API',
          confidence: isLandscape ? 90 : 70,
          is_full_body: isLandscape,
        });
      }
    }
    
    // Sort by confidence (full body first)
    return images.sort((a, b) => b.confidence - a.confidence);
  } catch {
    return [];
  }
}

/**
 * Get profile images (fallback - mostly headshots)
 */
async function getProfileImages(personId: number, limit = 3): Promise<GlamourImage[]> {
  const apiKey = getTMDBApiKey();
  if (!apiKey) return [];
  
  try {
    const res = await fetch(
      `${TMDB_BASE}/person/${personId}/images?api_key=${apiKey}`
    );
    const data = await res.json();
    
    const images: GlamourImage[] = [];
    
    // Only take high-aspect-ratio profiles (might be more than headshots)
    for (const img of (data.profiles || []).slice(0, limit)) {
      // aspect_ratio > 0.7 suggests more than just face
      const mightBeFullBody = img.aspect_ratio > 0.7;
      
      images.push({
        url: `${TMDB_IMAGE_BASE}/w780${img.file_path}`,
        thumbnail_url: `${TMDB_IMAGE_BASE}/w342${img.file_path}`,
        source: 'tmdb_profile',
        width: img.width,
        height: img.height,
        aspect_ratio: img.aspect_ratio,
        license: 'TMDB API',
        confidence: mightBeFullBody ? 60 : 40,
        is_full_body: mightBeFullBody,
      });
    }
    
    return images;
  } catch {
    return [];
  }
}

/**
 * Fetch from Wikimedia Commons
 */
async function getWikimediaImages(celebrityName: string, limit = 5): Promise<GlamourImage[]> {
  try {
    // Search Wikimedia Commons for the celebrity
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(celebrityName)}&srnamespace=6&srlimit=${limit}&format=json&origin=*`;
    
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    const images: GlamourImage[] = [];
    
    for (const result of (data.query?.search || [])) {
      const title = result.title;
      
      // Get image info
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;
      
      const infoRes = await fetch(infoUrl);
      const infoData = await infoRes.json();
      
      const pages = infoData.query?.pages || {};
      const pageId = Object.keys(pages)[0];
      const imageInfo = pages[pageId]?.imageinfo?.[0];
      
      if (imageInfo && imageInfo.width >= 600) {
        const aspectRatio = imageInfo.width / imageInfo.height;
        const license = imageInfo.extmetadata?.LicenseShortName?.value || 'CC';
        
        images.push({
          url: imageInfo.url,
          thumbnail_url: imageInfo.thumburl || imageInfo.url,
          source: 'wikimedia',
          width: imageInfo.width,
          height: imageInfo.height,
          aspect_ratio: aspectRatio,
          license: `Wikimedia Commons - ${license}`,
          confidence: aspectRatio > 0.6 ? 75 : 50,
          is_full_body: aspectRatio > 0.6,
        });
      }
    }
    
    return images;
  } catch (error) {
    console.error('Wikimedia fetch error:', error);
    return [];
  }
}

/**
 * Get YouTube video thumbnails from songs/interviews
 * These often have glamour shots!
 */
async function getYouTubeThumbnails(celebrityName: string, limit = 5): Promise<GlamourImage[]> {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) return [];
  
  try {
    // Search for Telugu songs/movies featuring the celebrity
    const query = `${celebrityName} Telugu song HD`;
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${limit}&key=${YOUTUBE_API_KEY}`;
    
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    const images: GlamourImage[] = [];
    
    for (const item of (data.items || [])) {
      const thumbnails = item.snippet?.thumbnails;
      const highRes = thumbnails?.maxres || thumbnails?.high || thumbnails?.medium;
      
      if (highRes) {
        images.push({
          url: highRes.url,
          thumbnail_url: thumbnails.medium?.url || highRes.url,
          source: 'youtube',
          width: highRes.width || 1280,
          height: highRes.height || 720,
          aspect_ratio: 16/9,
          movie_title: item.snippet?.title,
          license: 'YouTube Thumbnail',
          confidence: 80,
          is_full_body: true, // Song videos usually have full body shots
        });
      }
    }
    
    return images;
  } catch {
    return [];
  }
}

/**
 * MAIN FUNCTION: Fetch glamour images from multiple sources
 * Prioritizes full-body shots over headshots
 * 
 * Priority:
 * 1. Movie Backdrops (full scene shots) - BEST!
 * 2. Tagged images (if available)
 * 3. Wikimedia Commons (licensed photos)
 * 4. Profile images (fallback)
 */
export async function fetchGlamourImages(
  celebrityName: string,
  options: {
    maxImages?: number;
    preferFullBody?: boolean;
    includeWikimedia?: boolean;
    includeYouTube?: boolean;
  } = {}
): Promise<GlamourImage[]> {
  const {
    maxImages = 10,
    preferFullBody = true,
    includeWikimedia = true,
    includeYouTube = false, // Requires API key
  } = options;

  console.log(`🔍 Fetching glamour images for: ${celebrityName}`);
  
  const allImages: GlamourImage[] = [];
  
  // 1. Find TMDB person ID
  const personId = await findTMDBPersonId(celebrityName);
  
  if (personId) {
    console.log(`   TMDB ID: ${personId}`);
    
    // 2. Get movie backdrops FIRST (full body scene shots) - BEST SOURCE!
    const movies = await getActressMovies(personId, 8);
    console.log(`   Telugu/Hindi movies: ${movies.length}`);
    
    for (const movie of movies) {
      const movieImages = await getMovieImages(movie.id);
      for (const img of movieImages) {
        img.movie_title = movie.title;
      }
      allImages.push(...movieImages);
      
      // Stop if we have enough
      if (allImages.length >= maxImages) break;
    }
    console.log(`   Movie backdrops: ${allImages.length}`);
    
    // 3. Get tagged images (events, photoshoots) - if available
    if (allImages.length < maxImages) {
      const taggedImages = await getTaggedImages(personId, 10);
      if (taggedImages.length > 0) {
        console.log(`   Tagged images: ${taggedImages.length}`);
        allImages.push(...taggedImages);
      }
    }
    
    // 4. Profile images (fallback - less preferred)
    if (allImages.length < 3) {
      const profileImages = await getProfileImages(personId, 3);
      console.log(`   Profile images (fallback): ${profileImages.length}`);
      allImages.push(...profileImages);
    }
  }
  
  // 5. Wikimedia Commons - good for event photos
  if (includeWikimedia && allImages.length < maxImages) {
    const wikimediaImages = await getWikimediaImages(celebrityName, 5);
    console.log(`   Wikimedia images: ${wikimediaImages.length}`);
    allImages.push(...wikimediaImages);
  }
  
  // 6. YouTube thumbnails (song videos often have glamour shots)
  if (includeYouTube && allImages.length < maxImages) {
    const youtubeImages = await getYouTubeThumbnails(celebrityName, 5);
    console.log(`   YouTube thumbnails: ${youtubeImages.length}`);
    allImages.push(...youtubeImages);
  }
  
  // Sort by confidence (full body first)
  if (preferFullBody) {
    allImages.sort((a, b) => {
      // Full body first
      if (a.is_full_body && !b.is_full_body) return -1;
      if (!a.is_full_body && b.is_full_body) return 1;
      // Then by confidence
      return b.confidence - a.confidence;
    });
  }
  
  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allImages.filter(img => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });
  
  console.log(`   Total unique images: ${unique.length}`);
  
  return unique.slice(0, maxImages);
}

/**
 * Categorize image based on aspect ratio and source
 * Valid categories: beach, bikini, photoshoot, fashion, reels, anchors, traditional, western, fitness, events, general
 */
export function categorizeImage(image: GlamourImage): string {
  // Movie backdrops are usually from films - categorize as events or fashion
  if (image.source === 'tmdb_backdrop') {
    if (image.aspect_ratio > 2.0) return 'photoshoot'; // Very wide shots
    return 'fashion'; // Scene shots
  }
  if (image.source === 'tmdb_tagged') {
    if (image.aspect_ratio > 1.5) return 'photoshoot';
    return 'events';
  }
  if (image.source === 'youtube') return 'reels';
  if (image.source === 'wikimedia') return 'events';
  if (image.aspect_ratio > 1.2) return 'photoshoot';
  if (image.aspect_ratio > 0.8) return 'fashion';
  return 'general';
}

/**
 * Map content_angle to valid database values
 * Valid: glam, fashion, viral, throwback, trending
 */
export function getContentAngle(image: GlamourImage): string {
  if (image.is_full_body) return 'glam';
  if (image.source === 'youtube') return 'viral';
  if (image.source === 'tmdb_backdrop') return 'fashion';
  return 'trending';
}

