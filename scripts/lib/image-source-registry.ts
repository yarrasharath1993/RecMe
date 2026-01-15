/**
 * IMAGE SOURCE REGISTRY
 * 
 * Centralized configuration for image sources with roles:
 * - baseline: Primary source (TMDB) - always runs first
 * - validate_only: Confirmation sources - fetch but don't store
 * - ingest: Licensed sources - store if license validates
 * - enrich: Additional sources - store with lower confidence
 */

export type SourceRole = 'baseline' | 'ingest' | 'enrich' | 'validate_only';

export interface ImageSource {
  id: string;
  name: string;
  role: SourceRole;
  trust_weight: number;
  license_required: boolean;
  storage_allowed: boolean;
  enabled: boolean;
  priority: number; // Lower = higher priority
}

export const IMAGE_SOURCE_REGISTRY: Record<string, ImageSource> = {
  // BASELINE - Primary source, always runs first
  tmdb: {
    id: 'tmdb',
    name: 'The Movie Database',
    role: 'baseline',
    trust_weight: 0.95,
    license_required: false,
    storage_allowed: true,
    enabled: true,
    priority: 1,
  },

  // VALIDATE_ONLY - Confirmation sources (fetch but never store)
  impawards: {
    id: 'impawards',
    name: 'IMPAwards',
    role: 'validate_only',
    trust_weight: 0.90,
    license_required: true,
    storage_allowed: false, // Never store from this source
    enabled: true,
    priority: 2,
  },
  letterboxd: {
    id: 'letterboxd',
    name: 'Letterboxd',
    role: 'validate_only',
    trust_weight: 0.85,
    license_required: true,
    storage_allowed: false, // Never store from this source
    enabled: true,
    priority: 3,
  },

  // INGEST - Licensed sources for storage
  openverse: {
    id: 'openverse',
    name: 'Openverse (CC Search)',
    role: 'ingest',
    trust_weight: 0.85,
    license_required: true,
    storage_allowed: true,
    enabled: true,
    priority: 4,
  },
  wikimedia: {
    id: 'wikimedia',
    name: 'Wikimedia Commons',
    role: 'ingest',
    trust_weight: 0.85,
    license_required: true,
    storage_allowed: true,
    enabled: true,
    priority: 5,
  },

  // ENRICH - Additional sources with lower confidence
  flickr_commons: {
    id: 'flickr_commons',
    name: 'Flickr Commons',
    role: 'enrich',
    trust_weight: 0.80,
    license_required: false, // Public domain
    storage_allowed: true,
    enabled: true,
    priority: 6,
  },
  internet_archive: {
    id: 'internet_archive',
    name: 'Internet Archive',
    role: 'enrich',
    trust_weight: 0.75,
    license_required: false, // Public domain/open access
    storage_allowed: true,
    enabled: true,
    priority: 7,
  },

  // LEGACY SOURCES - Keeping for backward compatibility
  wikidata: {
    id: 'wikidata',
    name: 'Wikidata',
    role: 'enrich',
    trust_weight: 0.80,
    license_required: false,
    storage_allowed: true,
    enabled: true,
    priority: 8,
  },
  omdb: {
    id: 'omdb',
    name: 'OMDb',
    role: 'enrich',
    trust_weight: 0.80,
    license_required: false,
    storage_allowed: true,
    enabled: true,
    priority: 9,
  },
  google: {
    id: 'google',
    name: 'Google Knowledge Graph',
    role: 'enrich',
    trust_weight: 0.70,
    license_required: false,
    storage_allowed: true,
    enabled: false, // Disabled by default
    priority: 10,
  },
  cinemaazi: {
    id: 'cinemaazi',
    name: 'Cinemaazi',
    role: 'enrich',
    trust_weight: 0.60,
    license_required: true,
    storage_allowed: true,
    enabled: true,
    priority: 11,
  },
  ai: {
    id: 'ai',
    name: 'AI Inference',
    role: 'enrich',
    trust_weight: 0.50,
    license_required: false,
    storage_allowed: true,
    enabled: false, // Only for metadata, not images
    priority: 12,
  },
};

/**
 * Get sources by role
 */
export function getSourcesByRole(role: SourceRole): ImageSource[] {
  return Object.values(IMAGE_SOURCE_REGISTRY)
    .filter(source => source.role === role && source.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get baseline source (should be only one - TMDB)
 */
export function getBaselineSource(): ImageSource | null {
  const baseline = getSourcesByRole('baseline');
  return baseline.length > 0 ? baseline[0] : null;
}

/**
 * Get validate-only sources for confirmation
 */
export function getValidateOnlySources(): ImageSource[] {
  return getSourcesByRole('validate_only');
}

/**
 * Get ingest sources that can store images
 */
export function getIngestSources(): ImageSource[] {
  return getSourcesByRole('ingest');
}

/**
 * Get enrich sources for additional coverage
 */
export function getEnrichSources(): ImageSource[] {
  return getSourcesByRole('enrich');
}

/**
 * Get source by ID
 */
export function getSourceById(id: string): ImageSource | null {
  return IMAGE_SOURCE_REGISTRY[id] || null;
}

/**
 * Check if source allows storage
 */
export function canStoreFromSource(sourceId: string): boolean {
  const source = getSourceById(sourceId);
  return source ? source.storage_allowed : false;
}

/**
 * Check if source requires license validation
 */
export function requiresLicenseValidation(sourceId: string): boolean {
  const source = getSourceById(sourceId);
  return source ? source.license_required : true; // Default to requiring validation
}
