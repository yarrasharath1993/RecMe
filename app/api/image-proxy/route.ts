/**
 * Image Proxy API Route
 * 
 * Securely proxies images from allowed external sources.
 * - Validates source domain against allowlist
 * - Caches responses
 * - Adds license attribution headers
 * 
 * Usage:
 *   /api/image-proxy?url=https://image.tmdb.org/t/p/w500/abc123.jpg
 *   /api/image-proxy?url=https://upload.wikimedia.org/...
 */

import { NextRequest, NextResponse } from 'next/server';
import { ALLOWED_IMAGE_DOMAINS } from '@/lib/compliance/schemas/image-schema';

// Extended allowed domains for the proxy
const PROXY_ALLOWED_DOMAINS = [
  ...ALLOWED_IMAGE_DOMAINS,
  // Additional domains for proxy only
  'i.imgur.com',
  'pbs.twimg.com',
] as const;

/**
 * Check if URL is from an allowed domain
 */
function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return PROXY_ALLOWED_DOMAINS.some(domain => 
      urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Get license info for domain
 */
function getLicenseInfo(url: string): { license: string; attribution?: string } {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (hostname.includes('tmdb.org')) {
      return { license: 'TMDB API Terms of Use' };
    }
    if (hostname.includes('wikimedia.org') || hostname.includes('wikipedia.org')) {
      return { license: 'CC BY-SA or Public Domain', attribution: 'Wikimedia Commons' };
    }
    if (hostname.includes('archive.org')) {
      return { license: 'Various - check source', attribution: 'Internet Archive' };
    }
    if (hostname.includes('amazon.com')) {
      return { license: 'Fair Use - Review/Commentary' };
    }

    return { license: 'Unknown' };
  } catch {
    return { license: 'Unknown' };
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  // Validate URL parameter
  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing url parameter' },
      { status: 400 }
    );
  }

  // Validate against allowlist
  if (!isAllowedDomain(imageUrl)) {
    return NextResponse.json(
      { 
        error: 'Domain not allowed',
        allowedDomains: PROXY_ALLOWED_DOMAINS,
      },
      { status: 403 }
    );
  }

  try {
    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'TeluguVibes/1.0 (https://teluguvibes.com)',
        'Accept': 'image/*',
      },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get content type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    // Validate it's actually an image
    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'URL does not point to an image' },
        { status: 400 }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Get license info
    const licenseInfo = getLicenseInfo(imageUrl);

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        'X-License': licenseInfo.license,
        ...(licenseInfo.attribution && { 'X-Attribution': licenseInfo.attribution }),
        'X-Proxy-Source': new URL(imageUrl).hostname,
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'",
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}

/**
 * HEAD request for checking if image exists
 */
export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl || !isAllowedDomain(imageUrl)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'TeluguVibes/1.0 (https://teluguvibes.com)',
      },
    });

    return new NextResponse(null, {
      status: response.ok ? 200 : 404,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Content-Length': response.headers.get('content-length') || '0',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

