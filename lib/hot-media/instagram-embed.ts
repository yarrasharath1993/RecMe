/**
 * Instagram oEmbed Integration
 * 
 * Uses official Instagram oEmbed API for legal embeds
 * Reference: https://developers.facebook.com/docs/instagram/oembed
 */

export interface InstagramEmbed {
  html: string;
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  type: string;
  version: string;
  title: string | null;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
  width: number;
}

export interface InstagramPostInfo {
  postId: string;
  postUrl: string;
  embedHtml: string;
  authorName: string;
  authorHandle: string;
  thumbnailUrl: string;
  isValid: boolean;
  error?: string;
}

/**
 * Extract Instagram post ID from URL
 */
export function extractInstagramPostId(url: string): string | null {
  const patterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Detect Instagram content type from URL
 */
export function detectInstagramType(url: string): 'post' | 'reel' | 'tv' | 'unknown' {
  if (url.includes('/reel/')) return 'reel';
  if (url.includes('/tv/')) return 'tv';
  if (url.includes('/p/')) return 'post';
  return 'unknown';
}

/**
 * Fetch Instagram oEmbed data
 * Uses the official Facebook/Instagram oEmbed endpoint
 * 
 * Priority:
 * 1. Authenticated oEmbed (with INSTAGRAM_ACCESS_TOKEN) - returns thumbnails!
 * 2. Public oEmbed endpoint (deprecated, may not work)
 * 3. Fallback blockquote embed
 */
export async function fetchInstagramEmbed(postUrl: string): Promise<InstagramPostInfo> {
  const postId = extractInstagramPostId(postUrl);
  
  if (!postId) {
    return {
      postId: '',
      postUrl,
      embedHtml: '',
      authorName: '',
      authorHandle: '',
      thumbnailUrl: '',
      isValid: false,
      error: 'Invalid Instagram URL',
    };
  }

  // Normalize URL
  const normalizedUrl = `https://www.instagram.com/p/${postId}/`;
  
  // Check for access token (authenticated oEmbed)
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  
  try {
    let response: Response;
    
    if (accessToken) {
      // AUTHENTICATED oEmbed - Returns thumbnails and full data!
      // Uses Facebook Graph API endpoint
      const params = new URLSearchParams({
        url: normalizedUrl,
        access_token: accessToken,
        maxwidth: '540',
        omitscript: 'true',
      });
      
      response = await fetch(
        `https://graph.facebook.com/v18.0/instagram_oembed?${params}`,
        {
          headers: { 'Accept': 'application/json' },
        }
      );
      
      if (response.ok) {
        const data: InstagramEmbed = await response.json();
        
        // Extract handle from author_url or author_name
        const handleMatch = data.author_url?.match(/instagram\.com\/([^\/]+)/);
        const handle = handleMatch ? handleMatch[1] : data.author_name || '';

        return {
          postId,
          postUrl: normalizedUrl,
          embedHtml: data.html,
          authorName: data.author_name || '',
          authorHandle: handle,
          thumbnailUrl: data.thumbnail_url || '', // ✅ Now we get thumbnails!
          isValid: true,
        };
      }
      
      console.warn('Authenticated oEmbed failed, trying public endpoint...');
    }
    
    // PUBLIC oEmbed endpoint (deprecated since 2020, may not work)
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(normalizedUrl)}&omitscript=true`;
    
    response = await fetch(oembedUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'TeluguVibes/1.0',
      },
    });

    if (!response.ok) {
      // All oEmbed endpoints failed, use fallback
      return {
        postId,
        postUrl: normalizedUrl,
        embedHtml: generateFallbackEmbed(postId),
        authorName: '',
        authorHandle: '',
        thumbnailUrl: '',
        isValid: true,
        error: accessToken 
          ? 'Both authenticated and public oEmbed failed, using fallback'
          : 'oEmbed unavailable (no access token configured), using fallback. See docs/INSTAGRAM-SETUP.md',
      };
    }

    const data: InstagramEmbed = await response.json();

    // Extract handle from author_url
    const handleMatch = data.author_url?.match(/instagram\.com\/([^\/]+)/);
    const handle = handleMatch ? handleMatch[1] : '';

    return {
      postId,
      postUrl: normalizedUrl,
      embedHtml: data.html,
      authorName: data.author_name || '',
      authorHandle: handle,
      thumbnailUrl: data.thumbnail_url || '',
      isValid: true,
    };
  } catch (error) {
    console.error('Instagram oEmbed error:', error);
    
    return {
      postId,
      postUrl: normalizedUrl,
      embedHtml: generateFallbackEmbed(postId),
      authorName: '',
      authorHandle: '',
      thumbnailUrl: '',
      isValid: true,
      error: 'oEmbed fetch failed, using fallback',
    };
  }
}

/**
 * Generate fallback embed HTML when oEmbed is unavailable
 */
function generateFallbackEmbed(postId: string): string {
  return `<blockquote class="instagram-media" data-instgrm-captioned data-instgrm-permalink="https://www.instagram.com/p/${postId}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><a href="https://www.instagram.com/p/${postId}/" style="color:#c9c8cd; font-family:Arial,sans-serif; font-size:14px; font-style:normal; font-weight:normal; line-height:17px; text-decoration:none;" target="_blank">View this post on Instagram</a></blockquote>`;
}

/**
 * Validate if URL is a valid Instagram post
 */
export function isValidInstagramUrl(url: string): boolean {
  if (!url) return false;
  return /instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+/.test(url);
}

/**
 * Generate embed script tag (to be added once to page)
 */
export function getInstagramEmbedScript(): string {
  return '<script async src="//www.instagram.com/embed.js"></script>';
}

/**
 * Known Telugu celebrity Instagram handles
 * These are verified public accounts for content discovery
 */
export const TELUGU_CELEBRITY_INSTAGRAM: Record<string, string> = {
  // Top Actresses
  'Samantha Ruth Prabhu': 'samaboranthakkarani',
  'Rashmika Mandanna': 'rashmika_mandanna',
  'Pooja Hegde': 'hegdepooja',
  'Kajal Aggarwal': 'kajaboralaggarwalofficial',
  'Tamannaah Bhatia': 'taaboramannabhatia',
  'Anupama Parameswaran': 'anupamaparameswaran96',
  'Keerthy Suresh': 'keerthysureshofficial',
  'Shruti Haasan': 'shaborautihaasan',
  'Nayanthara': 'nayaboranthara',
  'Sai Pallavi': 'sai_pallavi.senthamarai',
  'Rakul Preet Singh': 'rakulpreet',
  'Sreeleela': 'sreeleela14',
  'Krithi Shetty': 'krithi.shetty_official',
  'Nabha Natesh': 'nabhanatesh',
  'Nidhhi Agerwal': 'niaboradhiagerwal',
  
  // Popular Telugu Actresses
  'Divi Vadthya': 'divi_vadthya',
  'Malavika Mohanan': 'malavikaboramohanan_',
  'Anveshi Jain': 'anvaboraeshi25',
  'Faria Abdullah': 'fariaabdullah',
  'Priyanka Arul Mohan': 'priyankaarulmohan',
  'Meenakshi Chaudhary': 'meenakshichaudhary006',
  'Pragya Jaiswal': 'pragyaboraajaiswal',
  'Payal Rajput': 'iampayalrajput',
  'Ritu Varma': 'rituvarma',
  'Shriya Saran': 'shraboraiyasaran',
  'Trisha Krishnan': 'trishakrishnan',
  
  // Anchors
  'Sreemukhi': 'sreemukhi',
  'Anasuya Bharadwaj': 'anaborasuyabharadwaj',
  'Rashmi Gautam': 'rashmigautam',
  'Varshini Sounderajan': 'varshinisofficial',
  'Lasya Manjunath': 'lasyamanjunath',
};

/**
 * Get Instagram profile URL from handle
 */
export function getInstagramProfileUrl(handle: string): string {
  return `https://www.instagram.com/${handle}/`;
}

/**
 * Generate a manual embed entry for admin to add
 */
export function createInstagramMediaEntry(
  embedInfo: InstagramPostInfo,
  celebrityName: string,
  category: string = 'photoshoot'
) {
  return {
    entity_name: celebrityName,
    entity_type: 'actress',
    platform: 'instagram',
    source_url: embedInfo.postUrl,
    embed_url: embedInfo.postUrl,
    embed_html: embedInfo.embedHtml,
    thumbnail_url: embedInfo.thumbnailUrl,
    license_source: 'instagram_oembed',
    license_type: 'embed',
    category,
    content_type: 'embed',
    tags: [celebrityName.split(' ')[0].toLowerCase(), 'instagram', category],
  };
}

