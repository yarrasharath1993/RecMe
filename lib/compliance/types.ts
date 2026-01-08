/**
 * COMPLIANCE LAYER - Type Definitions
 * 
 * Types for privacy, compliance, licensing, and safe data fetching.
 */

import type { DataSource } from '@/lib/data/conflict-resolution';

// ============================================================
// DATA SOURCE TYPES
// ============================================================

export type ComplianceDataSource = 
  | DataSource 
  | 'moviebuff' | 'jiosaavn' | 'idlebrain' | 'greatandhra' | '123telugu' | 'filmibeat' 
  | 'sakshi' | 'eenadu' | 'cinemaazi' | 'archive_org'
  // New sources for content platform extension
  | 'news_portals'      // Aggregated news sources
  | 'public_interviews' // Interview archives
  | 'reddit_public'     // Reddit public posts
  | 'court_documents'   // Court/legal documents
  | 'books_references'  // Book citations
  | 'archive_articles'  // Historical articles
  | 'youtube_public'    // YouTube public content
  | 'press_releases';   // Official press releases

export interface SourceConfig {
  id: ComplianceDataSource;
  name: string;
  website: string;
  category: 'api' | 'scraper' | 'archive' | 'news' | 'ai' | 'official' | 'social';
  
  // Rate limiting
  rateLimit: {
    requestsPerSecond: number;
    burstLimit: number;
    dailyLimit?: number;
  };
  
  // Compliance
  robotsTxt?: string;
  tosUrl?: string;
  apiTermsUrl?: string;
  
  // Access
  requiresAuth: boolean;
  authType?: 'api_key' | 'oauth' | 'session' | 'none';
  
  // Licensing
  defaultLicense: LicenseType;
  attributionRequired: boolean;
  
  // Flags
  isActive: boolean;
  isOfficial: boolean;  // Official API vs scraping
}

// ============================================================
// LICENSING TYPES
// ============================================================

export type LicenseType = 
  | 'public_domain'
  | 'CC0'
  | 'CC-BY'
  | 'CC-BY-SA'
  | 'CC-BY-NC'
  | 'CC-BY-NC-SA'
  | 'fair_use'
  | 'editorial_use'
  | 'archive_license'
  | 'permission_granted'
  | 'api_terms'
  | 'unknown';

export interface License {
  type: LicenseType;
  name: string;
  allowCommercial: boolean;
  allowModification: boolean;
  requiresAttribution: boolean;
  shareAlike: boolean;
  restrictions: string[];
}

export const LICENSES: Record<LicenseType, License> = {
  public_domain: {
    type: 'public_domain',
    name: 'Public Domain',
    allowCommercial: true,
    allowModification: true,
    requiresAttribution: false,
    shareAlike: false,
    restrictions: [],
  },
  CC0: {
    type: 'CC0',
    name: 'Creative Commons Zero',
    allowCommercial: true,
    allowModification: true,
    requiresAttribution: false,
    shareAlike: false,
    restrictions: [],
  },
  'CC-BY': {
    type: 'CC-BY',
    name: 'Creative Commons Attribution',
    allowCommercial: true,
    allowModification: true,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Must provide attribution'],
  },
  'CC-BY-SA': {
    type: 'CC-BY-SA',
    name: 'Creative Commons Attribution-ShareAlike',
    allowCommercial: true,
    allowModification: true,
    requiresAttribution: true,
    shareAlike: true,
    restrictions: ['Must provide attribution', 'Derivatives must use same license'],
  },
  'CC-BY-NC': {
    type: 'CC-BY-NC',
    name: 'Creative Commons Attribution-NonCommercial',
    allowCommercial: false,
    allowModification: true,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Must provide attribution', 'No commercial use'],
  },
  'CC-BY-NC-SA': {
    type: 'CC-BY-NC-SA',
    name: 'Creative Commons Attribution-NonCommercial-ShareAlike',
    allowCommercial: false,
    allowModification: true,
    requiresAttribution: true,
    shareAlike: true,
    restrictions: ['Must provide attribution', 'No commercial use', 'ShareAlike'],
  },
  fair_use: {
    type: 'fair_use',
    name: 'Fair Use',
    allowCommercial: true,
    allowModification: false,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Limited use for commentary/education', 'Attribution recommended'],
  },
  editorial_use: {
    type: 'editorial_use',
    name: 'Editorial Use Only',
    allowCommercial: false,
    allowModification: false,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Editorial context only', 'No modification', 'Attribution required'],
  },
  archive_license: {
    type: 'archive_license',
    name: 'Archive License',
    allowCommercial: false,
    allowModification: false,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Must credit archive', 'Follow archive terms', 'May require permission'],
  },
  permission_granted: {
    type: 'permission_granted',
    name: 'Permission Granted',
    allowCommercial: true,
    allowModification: true,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Follow granted permissions', 'Attribution as specified'],
  },
  api_terms: {
    type: 'api_terms',
    name: 'API Terms of Service',
    allowCommercial: true,
    allowModification: true,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Follow API ToS', 'May require attribution'],
  },
  unknown: {
    type: 'unknown',
    name: 'Unknown License',
    allowCommercial: false,
    allowModification: false,
    requiresAttribution: true,
    shareAlike: false,
    restrictions: ['Treat as restricted until verified'],
  },
};

// ============================================================
// COMPLIANCE CHECK TYPES
// ============================================================

export interface ComplianceResult {
  allowed: boolean;
  rateLimitOk: boolean;
  tosCompliant: boolean;
  robotsTxtAllowed: boolean;
  requiredDelay: number; // ms to wait before request
  reason?: string;
  warnings: string[];
}

export interface SafeFetchResult<T = unknown> {
  success: boolean;
  data: T | null;
  error?: string;
  
  // Compliance metadata
  source: ComplianceDataSource;
  fetchedAt: string;
  responseTime: number;
  
  // License info
  license: LicenseType;
  attribution: Attribution | null;
  
  // Audit trail
  requestId: string;
  rateLimitRemaining: number;
}

export interface Attribution {
  text: string;
  html: string;
  markdown: string;
  license: LicenseType;
  sourceUrl: string;
  sourceName: string;
  requiresLink: boolean;
  fetchedAt: string;
}

// ============================================================
// PRIVACY TYPES
// ============================================================

export interface PrivacyCheck {
  safe: boolean;
  hasPersonalInfo: boolean;
  hasSensitiveData: boolean;
  requiresConsent: boolean;
  flaggedFields: PrivacyFlag[];
  recommendations: string[];
}

export interface PrivacyFlag {
  field: string;
  type: 'pii' | 'contact' | 'location' | 'financial' | 'health' | 'political' | 'minor';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value?: string;
  recommendation: string;
}

// ============================================================
// USAGE VALIDATION
// ============================================================

export interface UsageValidation {
  canUse: boolean;
  license: LicenseType;
  licenseInfo: License;
  attribution: Attribution | null;
  restrictions: string[];
  warnings: string[];
  expiresAt?: Date;
}

// ============================================================
// CONTENT SAFETY (integrates with existing)
// ============================================================

export interface ContentSafetyResult {
  safe: boolean;
  status: 'approved' | 'needs_review' | 'flagged' | 'blocked';
  flags: ContentFlag[];
  score: number;  // 0-100, higher = safer
}

export interface ContentFlag {
  type: 'copyright' | 'adult' | 'violence' | 'political' | 'fake' | 'privacy' | 'tos_violation';
  severity: 'info' | 'warning' | 'critical';
  reason: string;
  autoResolve: boolean;
  field?: string;
}

// ============================================================
// AUDIT TYPES
// ============================================================

export interface FetchAuditEntry {
  id: string;
  source: ComplianceDataSource;
  url: string;
  method: 'GET' | 'POST';
  timestamp: string;
  responseStatus: number;
  responseTime: number;
  rateLimitRemaining: number;
  userAgent: string;
  success: boolean;
  error?: string;
}

export interface ComplianceReport {
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    rateLimitHits: number;
    complianceViolations: number;
  };
  bySource: Record<ComplianceDataSource, {
    requests: number;
    failures: number;
    avgResponseTime: number;
    rateLimitHits: number;
  }>;
  violations: Array<{
    timestamp: string;
    source: ComplianceDataSource;
    type: string;
    description: string;
  }>;
}

