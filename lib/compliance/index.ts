/**
 * COMPLIANCE LAYER - Main Exports
 * 
 * Unified privacy and compliance layer for safe data fetching,
 * validation, licensing, and attribution.
 * 
 * Usage:
 *   import { safeFetcher, complianceValidator, dataReviewer, attributionGenerator } from '@/lib/compliance';
 *   
 *   // Safe fetch with rate limiting
 *   const result = await safeFetcher.safeFetch('tmdb', url);
 *   
 *   // Validate usage rights
 *   const usage = complianceValidator.validateUsage({ source: 'tmdb', url });
 *   
 *   // Check privacy
 *   const privacy = complianceValidator.checkPrivacy(data);
 *   
 *   // Review movie data from multiple sources
 *   const review = await dataReviewer.reviewMovieData({ movieId, title, sources });
 *   
 *   // Generate attributions
 *   const attributions = attributionGenerator.generateMoviePageAttributions(title, url, sources);
 */

// Types
export * from './types';

// Safe Fetcher
export {
  SafeFetcher,
  safeFetcher,
  safeFetch,
  canFetch,
  SOURCE_CONFIGS,
  getAuditLog,
  getAuditStats,
} from './safe-fetcher';

// Compliance Validator
export {
  ComplianceValidator,
  complianceValidator,
  validateUsage,
  checkPrivacy,
  checkContentSafety,
} from './compliance-validator';

// Data Reviewer
export {
  DataReviewer,
  dataReviewer,
  reviewData,
  reviewMovieData,
  quickSafetyCheck,
  type SourceDataInput,
  type DataReviewResult,
  type ReviewIssue,
  type MovieReviewInput,
} from './data-reviewer';

// Attribution Generator
export {
  AttributionGenerator,
  attributionGenerator,
  generateAttribution,
  generateMovieAttributions,
  generateArchivalAttribution,
  type ContentAttribution,
  type PageAttributions,
} from './attribution-generator';

// ============================================================
// UNIFIED COMPLIANCE GATEWAY
// ============================================================

import { safeFetcher } from './safe-fetcher';
import { complianceValidator } from './compliance-validator';
import { dataReviewer } from './data-reviewer';
import { attributionGenerator } from './attribution-generator';
import type { ComplianceDataSource, SafeFetchResult, LicenseType } from './types';

/**
 * ComplianceGateway - Unified interface for all compliance operations
 * 
 * Use this when you need to perform multiple compliance checks in one flow.
 */
export class ComplianceGateway {
  /**
   * Fetch data with full compliance checking
   */
  async fetchWithCompliance<T = unknown>(
    source: ComplianceDataSource,
    url: string,
    options?: {
      validatePrivacy?: boolean;
      validateSafety?: boolean;
      generateAttribution?: boolean;
    }
  ): Promise<{
    fetch: SafeFetchResult<T>;
    compliance: {
      privacyOk: boolean;
      safetyOk: boolean;
      usageOk: boolean;
    };
    attribution: ReturnType<typeof attributionGenerator.generateAttribution> | null;
  }> {
    // Fetch data
    const fetchResult = await safeFetcher.safeFetch<T>(source, url);

    if (!fetchResult.success) {
      return {
        fetch: fetchResult,
        compliance: {
          privacyOk: true,
          safetyOk: true,
          usageOk: false,
        },
        attribution: null,
      };
    }

    // Check usage rights
    const usage = complianceValidator.validateUsage({ source, url });

    // Check privacy if data is object
    let privacyOk = true;
    if (options?.validatePrivacy && fetchResult.data && typeof fetchResult.data === 'object') {
      const privacy = complianceValidator.checkPrivacy(fetchResult.data as Record<string, unknown>);
      privacyOk = privacy.safe;
    }

    // Check content safety
    let safetyOk = true;
    if (options?.validateSafety && fetchResult.data) {
      const textContent = typeof fetchResult.data === 'string' 
        ? fetchResult.data 
        : JSON.stringify(fetchResult.data);
      const safety = await complianceValidator.checkContentSafety({ text: textContent, source });
      safetyOk = safety.safe;
    }

    // Generate attribution
    let attribution = null;
    if (options?.generateAttribution) {
      attribution = attributionGenerator.generateAttribution(source, url);
    }

    return {
      fetch: fetchResult,
      compliance: {
        privacyOk,
        safetyOk,
        usageOk: usage.canUse,
      },
      attribution,
    };
  }

  /**
   * Review and enrich movie data with full compliance
   */
  async reviewAndEnrich(
    movieId: string,
    title: string,
    sources: Array<{
      source: ComplianceDataSource;
      data: Record<string, unknown>;
      url?: string;
      license?: LicenseType;
    }>
  ): Promise<{
    review: Awaited<ReturnType<typeof dataReviewer.reviewMovieData>>;
    attributions: ReturnType<typeof attributionGenerator.generateMoviePageAttributions>;
    approved: boolean;
    issues: string[];
  }> {
    // Review movie data
    const review = await dataReviewer.reviewMovieData({
      movieId,
      title,
      sources: sources.map(s => ({
        source: s.source,
        data: s.data,
        url: s.url,
        license: s.license,
      })),
    });

    // Generate attributions
    const attributions = attributionGenerator.generateMoviePageAttributions(
      title,
      `/reviews/${movieId}`,
      sources.map(s => ({
        source: s.source,
        url: s.url || '',
        contentType: 'data' as const,
        license: s.license,
      }))
    );

    return {
      review,
      attributions,
      approved: review.approved,
      issues: review.issues.map(i => i.message),
    };
  }

  /**
   * Quick compliance check (fast path)
   */
  quickCheck(
    source: ComplianceDataSource,
    data?: Record<string, unknown>
  ): {
    sourceActive: boolean;
    sourceTrusted: boolean;
    dataSafe: boolean;
    license: LicenseType;
    requiresAttribution: boolean;
  } {
    const config = safeFetcher.getSourceConfig(source);
    
    return {
      sourceActive: config?.isActive ?? false,
      sourceTrusted: config?.isOfficial ?? false,
      dataSafe: data ? dataReviewer.quickSafetyCheck(data) : true,
      license: config?.defaultLicense ?? 'unknown',
      requiresAttribution: config?.attributionRequired ?? true,
    };
  }

  /**
   * Get all active sources with their compliance status
   */
  getActiveSources(): Array<{
    id: ComplianceDataSource;
    name: string;
    category: string;
    isOfficial: boolean;
    license: LicenseType;
    rateLimit: { remaining: number; dailyRemaining: number | null };
  }> {
    return safeFetcher.getActiveSources().map(source => ({
      id: source.id,
      name: source.name,
      category: source.category,
      isOfficial: source.isOfficial,
      license: source.defaultLicense,
      rateLimit: safeFetcher.getRateLimitStatus(source.id),
    }));
  }
}

// Singleton instance
export const complianceGateway = new ComplianceGateway();

