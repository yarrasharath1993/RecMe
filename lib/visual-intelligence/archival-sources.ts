/**
 * ARCHIVAL SOURCES LIBRARY
 * 
 * Definitions and helpers for managing archival image sources.
 * Includes known source registry, confidence calculations,
 * and attribution generation.
 */

import type {
  ArchivalSourceType,
  LicenseType,
  ArchivalSource,
  VisualType,
  VisualTier,
} from './types';

import {
  SOURCE_TYPE_TIERS,
  SOURCE_DEFAULT_CONFIDENCE,
  SOURCE_TYPE_LABELS,
  LICENSE_TYPE_LABELS,
  VISUAL_TYPE_LABELS,
} from './types';

// ============================================================
// KNOWN ARCHIVAL SOURCES REGISTRY
// ============================================================

export interface KnownArchivalSource {
  code: string;
  name: string;
  type: ArchivalSourceType;
  tier: VisualTier;
  website?: string;
  email?: string;
  accessType: 'open_access' | 'request_required' | 'membership_required' | 'paid_license' | 'partnership_only';
  typicalLicense: LicenseType;
  typicalResponseTime?: string;
  description: string;
  coveragePeriod?: string;
  specialNotes?: string;
}

/**
 * Registry of known archival sources for Telugu films
 */
export const KNOWN_SOURCES: KnownArchivalSource[] = [
  // Tier 1 - Government & Official Archives
  {
    code: 'nfai',
    name: 'National Film Archive of India',
    type: 'government_archive',
    tier: 1,
    website: 'https://nfrp.gov.in/',
    email: 'nfai-pune@nic.in',
    accessType: 'request_required',
    typicalLicense: 'archive_license',
    typicalResponseTime: '2-4 weeks',
    description: 'Primary government archive for Indian cinema. Holds film stills, promotional photos, press kits for Telugu classics.',
    coveragePeriod: '1930s - present',
    specialNotes: 'Best source for classics. Request low-res previews first, then apply for reproduction rights.',
  },
  {
    code: 'ap_culture',
    name: 'Andhra Pradesh Culture Department',
    type: 'state_cultural_dept',
    tier: 1,
    accessType: 'request_required',
    typicalLicense: 'public_domain',
    description: 'State-funded film materials often under government works. Many Telugu films were state-promoted.',
    coveragePeriod: '1950s - 2014',
  },
  {
    code: 'ts_culture',
    name: 'Telangana Culture Department',
    type: 'state_cultural_dept',
    tier: 1,
    accessType: 'request_required',
    typicalLicense: 'public_domain',
    description: 'State cultural archives for Telangana region films.',
    coveragePeriod: '2014 - present',
  },
  {
    code: 'fhf',
    name: 'Film Heritage Foundation',
    type: 'museum',
    tier: 1,
    website: 'https://filmheritagefoundation.co.in/',
    accessType: 'partnership_only',
    typicalLicense: 'archive_license',
    description: 'Preservation-focused organization with high-quality restorations. Partner for digital preservation grants.',
    specialNotes: 'Your system is architecturally grant-ready for FHF partnership.',
  },

  // Tier 2 - Print Media & Publications
  {
    code: 'andhra_patrika',
    name: 'Andhra Patrika',
    type: 'newspaper',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'editorial_use',
    description: 'Historical Telugu newspaper with film advertisements. Pre-1978 ads especially useful.',
    coveragePeriod: '1930s - 1990s',
    specialNotes: 'Newspaper ads were commercial announcements - courts treat them as historical records.',
  },
  {
    code: 'sitara',
    name: 'Sitara Magazine',
    type: 'magazine',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'editorial_use',
    description: 'Classic Telugu film magazine with stills, ads, and features.',
    coveragePeriod: '1960s - 1990s',
  },
  {
    code: 'jyothi',
    name: 'Jyothi Magazine',
    type: 'magazine',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'editorial_use',
    description: 'Telugu film and entertainment magazine.',
  },
  {
    code: 'bharati',
    name: 'Bharati Magazine',
    type: 'magazine',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'editorial_use',
    description: 'Telugu arts and culture magazine with film coverage.',
  },
  {
    code: 'cinema_rangam',
    name: 'Cinema Rangam',
    type: 'magazine',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'editorial_use',
    description: 'Older Telugu cinema magazine.',
  },

  // Tier 2 - Community & Digital Archives
  {
    code: 'internet_archive',
    name: 'Internet Archive',
    type: 'community',
    tier: 2,
    website: 'https://archive.org/',
    accessType: 'open_access',
    typicalLicense: 'public_domain',
    description: 'Community digital archive with some Telugu film materials.',
    specialNotes: 'Check for scanned magazines and newspapers.',
  },
  {
    code: 'wikimedia',
    name: 'Wikimedia Commons',
    type: 'community',
    tier: 2,
    website: 'https://commons.wikimedia.org/',
    accessType: 'open_access',
    typicalLicense: 'public_domain',
    description: 'Open source image repository. Some film stills available.',
    specialNotes: 'Verify license on each image individually.',
  },

  // Tier 2/3 - Family & Film Society Archives
  {
    code: 'family_archive',
    name: 'Actor/Director Family Estate',
    type: 'family_archive',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'permission_granted',
    description: 'Families of iconic actors/directors often hold original stills and press photos.',
    specialNotes: 'Outreach via email/social media. Offer attribution and non-commercial archival preservation.',
  },
  {
    code: 'film_society',
    name: 'Telugu Film Society / Cine Club',
    type: 'film_society',
    tier: 2,
    accessType: 'request_required',
    typicalLicense: 'attribution_required',
    description: 'Old film clubs often digitize stills and programme notes.',
    specialNotes: 'Usually happy to share with attribution and preservation efforts.',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get a known source by its code
 */
export function getKnownSource(code: string): KnownArchivalSource | undefined {
  return KNOWN_SOURCES.find(s => s.code === code);
}

/**
 * Get all sources of a specific type
 */
export function getSourcesByType(type: ArchivalSourceType): KnownArchivalSource[] {
  return KNOWN_SOURCES.filter(s => s.type === type);
}

/**
 * Get all sources of a specific tier
 */
export function getSourcesByTier(tier: VisualTier): KnownArchivalSource[] {
  return KNOWN_SOURCES.filter(s => s.tier === tier);
}

/**
 * Calculate confidence score based on source and visual type
 */
export function calculateArchivalConfidence(
  sourceType: ArchivalSourceType,
  visualType: VisualType,
  isVerified: boolean = false
): number {
  // Base confidence from source type
  let confidence = SOURCE_DEFAULT_CONFIDENCE[sourceType] || 0.5;

  // Boost for original posters
  if (visualType === 'original_poster') {
    confidence = Math.min(1.0, confidence + 0.1);
  }

  // Slight reduction for some visual types
  if (['newspaper_clipping', 'cassette_cover'].includes(visualType)) {
    confidence = Math.max(0.3, confidence - 0.05);
  }

  // Boost for verified sources
  if (isVerified) {
    confidence = Math.min(1.0, confidence + 0.1);
  }

  return Math.round(confidence * 100) / 100;
}

/**
 * Get tier from archival source type
 */
export function getTierFromSourceType(sourceType: ArchivalSourceType): VisualTier {
  return SOURCE_TYPE_TIERS[sourceType] || 3;
}

/**
 * Generate attribution text from archival source data
 */
export function generateAttributionText(source: ArchivalSource): string {
  if (source.attribution_text) {
    return source.attribution_text;
  }

  const parts: string[] = [];
  
  parts.push(`Source: ${source.source_name}`);
  
  if (source.year_estimated) {
    parts.push(`(${source.year_estimated})`);
  }

  return parts.join(' ');
}

/**
 * Generate display label for visual type with source
 */
export function getVisualDisplayLabel(
  visualType: VisualType,
  sourceType?: ArchivalSourceType
): string {
  const typeLabel = VISUAL_TYPE_LABELS[visualType];
  
  if (!sourceType) {
    return typeLabel;
  }

  const sourceLabel = SOURCE_TYPE_LABELS[sourceType];
  return `${typeLabel} (${sourceLabel})`;
}

/**
 * Get suggested license for a source type
 */
export function getSuggestedLicense(sourceType: ArchivalSourceType): LicenseType {
  const source = KNOWN_SOURCES.find(s => s.type === sourceType);
  return source?.typicalLicense || 'attribution_required';
}

/**
 * Check if a source type requires attribution display
 */
export function requiresAttribution(licenseType: LicenseType): boolean {
  return ['attribution_required', 'editorial_use', 'archive_license'].includes(licenseType);
}

/**
 * Get badge color based on source type
 */
export function getSourceBadgeColor(sourceType: ArchivalSourceType): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  const tier = SOURCE_TYPE_TIERS[sourceType];
  
  switch (tier) {
    case 1:
      return {
        bg: 'bg-green-900/80',
        text: 'text-green-100',
        border: 'border-green-700',
        icon: 'text-green-400',
      };
    case 2:
      return {
        bg: 'bg-amber-900/80',
        text: 'text-amber-100',
        border: 'border-amber-700',
        icon: 'text-amber-400',
      };
    default:
      return {
        bg: 'bg-gray-800/80',
        text: 'text-gray-300',
        border: 'border-gray-600',
        icon: 'text-gray-400',
      };
  }
}

/**
 * Get badge color based on visual type
 */
export function getVisualTypeBadgeColor(visualType: VisualType): {
  bg: string;
  text: string;
  border: string;
  icon: string;
  label: string;
} {
  switch (visualType) {
    case 'original_poster':
      return {
        bg: 'bg-green-900/80',
        text: 'text-green-100',
        border: 'border-green-700',
        icon: 'text-green-400',
        label: 'Verified',
      };
    case 'archival_still':
    case 'studio_photo':
    case 'press_kit_photo':
      return {
        bg: 'bg-blue-900/80',
        text: 'text-blue-100',
        border: 'border-blue-700',
        icon: 'text-blue-400',
        label: 'Studio Photo',
      };
    case 'magazine_ad':
    case 'newspaper_clipping':
      return {
        bg: 'bg-amber-900/80',
        text: 'text-amber-100',
        border: 'border-amber-700',
        icon: 'text-amber-400',
        label: 'Historical Ad',
      };
    case 'song_book_cover':
    case 'lobby_card':
      return {
        bg: 'bg-purple-900/80',
        text: 'text-purple-100',
        border: 'border-purple-700',
        icon: 'text-purple-400',
        label: 'Book/Print',
      };
    case 're_release_poster':
      return {
        bg: 'bg-cyan-900/80',
        text: 'text-cyan-100',
        border: 'border-cyan-700',
        icon: 'text-cyan-400',
        label: 'Re-release',
      };
    default:
      return {
        bg: 'bg-gray-800/80',
        text: 'text-gray-300',
        border: 'border-gray-600',
        icon: 'text-gray-400',
        label: 'Archive',
      };
  }
}

// ============================================================
// OUTREACH HELPERS
// ============================================================

/**
 * Generate email template for NFAI request
 */
export function generateNFAIRequestEmail(
  movieTitles: string[],
  siteDescription: string = 'informational film archive / review portal'
): string {
  return `Subject: Request for Digital Reproduction Rights - Telugu Film Stills

Dear Sir/Madam,

I am writing to request access to archival materials for the following Telugu films:

${movieTitles.map((title, i) => `${i + 1}. ${title}`).join('\n')}

Intended Use: ${siteDescription}

We are building a respectful Telugu cinema archive that prioritizes:
- Accurate historical documentation
- Proper attribution and provenance
- Non-commercial, informational use

We would be grateful if you could:
1. Provide low-resolution previews of available materials
2. Advise on the process for obtaining digital reproduction rights
3. Share any licensing terms or fees applicable

Thank you for your consideration and for preserving our film heritage.

Sincerely,
[Your Name]
[Organization]
[Contact Information]`;
}

/**
 * Generate family outreach template
 */
export function generateFamilyOutreachTemplate(
  actorName: string,
  movieTitle: string
): string {
  return `Dear ${actorName} Family,

I am reaching out regarding the preservation of Telugu cinema history.

We are building an archival resource for classic Telugu films, and would be honored to include authentic materials from "${movieTitle}" in our collection.

What we offer:
- Full attribution and credit to your family
- Links to your official work/foundation
- Non-commercial, archival preservation focus
- Respectful presentation as historical record

If you have any original stills, press photos, or promotional materials you would be willing to share, we would be deeply grateful.

This builds long-term partnerships for preserving our film heritage.

With respect,
[Your Name]`;
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate archival source data
 */
export function validateArchivalSource(source: Partial<ArchivalSource>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!source.source_name?.trim()) {
    errors.push('Source name is required');
  }

  if (!source.source_type) {
    errors.push('Source type is required');
  }

  if (!source.license_type) {
    errors.push('License type is required');
  }

  if (source.year_estimated && (source.year_estimated < 1900 || source.year_estimated > new Date().getFullYear())) {
    errors.push('Year must be between 1900 and current year');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if URL is from a trusted source
 */
export function isTrustedSourceUrl(url: string): boolean {
  const trustedDomains = [
    'nfrp.gov.in',
    'archive.org',
    'commons.wikimedia.org',
    'filmheritagefoundation.co.in',
  ];

  try {
    const urlObj = new URL(url);
    return trustedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

