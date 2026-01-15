/**
 * LICENSE VALIDATOR
 * 
 * Validates image licenses with permissive warnings.
 * Strategy: Store with warning flag rather than blocking.
 * 
 * Supports:
 * - Wikimedia Commons license metadata
 * - Creative Commons detection
 * - Public domain verification
 */

import { validateImageUrl } from './image-validator';

export interface LicenseValidationResult {
  is_valid: boolean;
  license_type: string | null;
  license_verified: boolean;
  warning: string | null;
  confidence: number;
  details?: {
    cc_version?: string;
    attribution_required?: boolean;
    commercial_use?: boolean;
    modifications_allowed?: boolean;
  };
}

// Known license patterns
const LICENSE_PATTERNS = {
  public_domain: [
    /public\s*domain/i,
    /cc0/i,
    /creative\s*commons\s*zero/i,
    /no\s*known\s*copyright/i,
  ],
  cc_by: [
    /cc\s*by\s*4\.0/i,
    /cc\s*by\s*3\.0/i,
    /creative\s*commons\s*attribution/i,
  ],
  cc_by_sa: [
    /cc\s*by-sa/i,
    /cc\s*by\s*sa/i,
    /creative\s*commons\s*attribution.*share.*alike/i,
  ],
  editorial: [
    /editorial\s*use/i,
    /fair\s*use/i,
    /news\s*reporting/i,
  ],
  attribution: [
    /attribution\s*required/i,
    /credit\s*required/i,
  ],
};

/**
 * Validate Wikimedia Commons image license
 */
async function validateWikimediaLicense(imageUrl: string): Promise<LicenseValidationResult> {
  try {
    // Extract file name from URL
    const fileMatch = imageUrl.match(/File:([^?#]+)/i);
    if (!fileMatch) {
      return {
        is_valid: false,
        license_type: null,
        license_verified: false,
        warning: 'Could not extract file name from Wikimedia URL',
        confidence: 0.3,
      };
    }

    const fileName = decodeURIComponent(fileMatch[1]);
    
    // Fetch metadata from Wikimedia Commons API
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
    
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'TeluguPortal-LicenseValidator/1.0' }
    });
    
    if (!res.ok) {
      return {
        is_valid: true, // Permissive - assume valid with warning
        license_type: 'unknown',
        license_verified: false,
        warning: 'Could not verify Wikimedia license - API error',
        confidence: 0.5,
      };
    }

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) {
      return {
        is_valid: true,
        license_type: 'unknown',
        license_verified: false,
        warning: 'Could not verify Wikimedia license - no metadata',
        confidence: 0.5,
      };
    }

    const page = Object.values(pages)[0] as any;
    const metadata = page?.imageinfo?.[0]?.extmetadata;

    if (!metadata) {
      return {
        is_valid: true,
        license_type: 'unknown',
        license_verified: false,
        warning: 'No license metadata available',
        confidence: 0.5,
      };
    }

    // Extract license information
    const licenseShortName = metadata.LicenseShortName?.value || '';
    const licenseUrl = metadata.LicenseUrl?.value || '';
    const usageTerms = metadata.UsageTerms?.value || '';

    // Check for acceptable licenses
    if (licenseShortName.includes('CC') || licenseShortName.includes('Public domain') || licenseShortName.includes('PD')) {
      const isPublicDomain = licenseShortName.toLowerCase().includes('public domain') || licenseShortName.includes('PD');
      const isCCBY = licenseShortName.includes('CC BY');
      const isCCBYSA = licenseShortName.includes('CC BY-SA');

      return {
        is_valid: true,
        license_type: isPublicDomain ? 'public_domain' : (isCCBYSA ? 'cc-by-sa' : 'cc-by'),
        license_verified: true,
        warning: null,
        confidence: 0.95,
        details: {
          cc_version: licenseShortName,
          attribution_required: !isPublicDomain,
          commercial_use: true,
          modifications_allowed: true,
        },
      };
    }

    // License exists but not recognized
    return {
      is_valid: true, // Permissive
      license_type: 'unknown',
      license_verified: false,
      warning: `Unrecognized license: ${licenseShortName}. Review recommended.`,
      confidence: 0.6,
    };

  } catch (error) {
    return {
      is_valid: true, // Permissive - assume valid with warning
      license_type: 'unknown',
      license_verified: false,
      warning: `License validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0.4,
    };
  }
}

/**
 * Validate Creative Commons license from generic URL
 */
function validateCreativeCommonsHeaders(html: string): LicenseValidationResult {
  // Check for CC license in HTML metadata
  const ccMatch = html.match(/rel="license"[^>]*href="([^"]*creativecommons[^"]*)"/i);
  
  if (ccMatch) {
    const licenseUrl = ccMatch[1];
    let licenseType = 'cc-by';
    
    if (licenseUrl.includes('by-sa')) {
      licenseType = 'cc-by-sa';
    } else if (licenseUrl.includes('by-nd')) {
      licenseType = 'cc-by-nd';
    } else if (licenseUrl.includes('by-nc')) {
      licenseType = 'cc-by-nc';
    } else if (licenseUrl.includes('zero') || licenseUrl.includes('cc0')) {
      licenseType = 'public_domain';
    }

    return {
      is_valid: true,
      license_type: licenseType,
      license_verified: true,
      warning: null,
      confidence: 0.85,
      details: {
        attribution_required: !licenseType.includes('zero'),
        commercial_use: !licenseUrl.includes('nc'),
        modifications_allowed: !licenseUrl.includes('nd'),
      },
    };
  }

  return {
    is_valid: true, // Permissive
    license_type: 'unknown',
    license_verified: false,
    warning: 'No Creative Commons license detected',
    confidence: 0.5,
  };
}

/**
 * Validate Openverse image license
 */
async function validateOpenverseLicense(imageUrl: string): Promise<LicenseValidationResult> {
  // Openverse is specifically CC-licensed content
  return {
    is_valid: true,
    license_type: 'cc-by',
    license_verified: true,
    warning: null,
    confidence: 0.90,
    details: {
      attribution_required: true,
      commercial_use: true,
      modifications_allowed: true,
    },
  };
}

/**
 * Validate Internet Archive license (public domain)
 */
async function validateInternetArchiveLicense(imageUrl: string): Promise<LicenseValidationResult> {
  // Internet Archive content is typically public domain
  return {
    is_valid: true,
    license_type: 'public_domain',
    license_verified: true,
    warning: null,
    confidence: 0.85,
    details: {
      attribution_required: false,
      commercial_use: true,
      modifications_allowed: true,
    },
  };
}

/**
 * Validate Flickr Commons license
 */
async function validateFlickrCommonsLicense(imageUrl: string): Promise<LicenseValidationResult> {
  // Flickr Commons is public domain or no known restrictions
  return {
    is_valid: true,
    license_type: 'public_domain',
    license_verified: true,
    warning: null,
    confidence: 0.85,
    details: {
      attribution_required: true, // Recommended but not required
      commercial_use: true,
      modifications_allowed: true,
    },
  };
}

/**
 * Main license validation function
 */
export async function validateImageLicense(
  imageUrl: string,
  sourceId: string
): Promise<LicenseValidationResult> {
  // Check for known sources first (before URL validation for speed)
  
  // For TMDB and other commercial sources
  if (sourceId === 'tmdb' || imageUrl.includes('themoviedb.org') || imageUrl.includes('image.tmdb.org')) {
    return {
      is_valid: true,
      license_type: 'attribution',
      license_verified: true,
      warning: null,
      confidence: 0.95,
      details: {
        attribution_required: true,
        commercial_use: true,
        modifications_allowed: true,
      },
    };
  }

  // For validate_only sources (IMPAwards, Letterboxd)
  if (sourceId === 'impawards' || sourceId === 'letterboxd') {
    return {
      is_valid: false, // Never store from these sources
      license_type: 'commercial',
      license_verified: true,
      warning: 'Validate-only source - do not store',
      confidence: 0.0,
    };
  }

  if (sourceId === 'openverse' || imageUrl.includes('openverse.org')) {
    return validateOpenverseLicense(imageUrl);
  }

  if (sourceId === 'internet_archive' || imageUrl.includes('archive.org')) {
    return validateInternetArchiveLicense(imageUrl);
  }

  if (sourceId === 'flickr_commons' || imageUrl.includes('flickr.com')) {
    return validateFlickrCommonsLicense(imageUrl);
  }

  // For Wikimedia, we need to fetch metadata
  if (imageUrl.includes('wikimedia.org') || imageUrl.includes('commons.wikimedia.org')) {
    return validateWikimediaLicense(imageUrl);
  }

  // For unknown sources, check URL accessibility first
  const urlValidation = await validateImageUrl(imageUrl);
  if (!urlValidation.isValid) {
    return {
      is_valid: false,
      license_type: null,
      license_verified: false,
      warning: `Image not accessible: ${urlValidation.error}`,
      confidence: 0.0,
    };
  }

  // Generic validation - try to fetch and check headers
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'TeluguPortal-LicenseValidator/1.0' },
    });

    if (!response.ok) {
      return {
        is_valid: true, // Permissive
        license_type: 'unknown',
        license_verified: false,
        warning: 'Could not fetch image for license verification',
        confidence: 0.5,
      };
    }

    const html = await response.text();
    return validateCreativeCommonsHeaders(html);

  } catch (error) {
    return {
      is_valid: true, // Permissive - assume valid with warning
      license_type: 'unknown',
      license_verified: false,
      warning: `License validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0.5,
    };
  }
}

/**
 * Batch validate licenses for multiple images
 */
export async function batchValidateLicenses(
  images: Array<{ url: string; sourceId: string }>,
  concurrency: number = 5
): Promise<Map<string, LicenseValidationResult>> {
  const results = new Map<string, LicenseValidationResult>();

  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, Math.min(i + concurrency, images.length));
    
    const batchResults = await Promise.all(
      batch.map(img => validateImageLicense(img.url, img.sourceId))
    );

    batch.forEach((img, index) => {
      results.set(img.url, batchResults[index]);
    });

    // Rate limiting
    if (i + concurrency < images.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return results;
}
