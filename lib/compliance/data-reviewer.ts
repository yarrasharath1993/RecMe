/**
 * DATA REVIEWER - Unified Data Review System
 * 
 * Combines existing validation systems into a unified review flow:
 * - Multi-source validation (consensus building)
 * - Content safety checks
 * - Privacy validation
 * - License compliance
 * - Attribution generation
 */

import type { DataSource } from '@/lib/data/conflict-resolution';
import type {
  ComplianceDataSource,
  UsageValidation,
  PrivacyCheck,
  ContentSafetyResult,
  Attribution,
  LicenseType,
} from './types';
import { complianceValidator } from './compliance-validator';
import { safeFetcher, SOURCE_CONFIGS } from './safe-fetcher';

// ============================================================
// TYPES
// ============================================================

export interface SourceDataInput {
  source: ComplianceDataSource;
  data: Record<string, unknown>;
  url?: string;
  license?: LicenseType;
  fetchedAt?: string;
}

export interface DataReviewResult {
  // Overall status
  approved: boolean;
  status: 'approved' | 'needs_review' | 'flagged' | 'blocked';
  
  // Individual checks
  usageValidation: UsageValidation;
  privacyCheck: PrivacyCheck;
  safetyCheck: ContentSafetyResult;
  
  // Consensus (if multiple sources)
  consensus?: {
    agreedFields: string[];
    conflictedFields: string[];
    confidence: number;
    recommendedValues: Record<string, unknown>;
  };
  
  // Attribution
  attributions: Attribution[];
  
  // Issues and recommendations
  issues: ReviewIssue[];
  recommendations: string[];
  
  // Metadata
  reviewedAt: string;
  reviewDuration: number;
}

export interface ReviewIssue {
  type: 'usage' | 'privacy' | 'safety' | 'consensus' | 'license';
  severity: 'info' | 'warning' | 'critical';
  field?: string;
  message: string;
  autoResolvable: boolean;
  resolution?: string;
}

export interface MovieReviewInput {
  movieId: string;
  title: string;
  year?: number;
  sources: SourceDataInput[];
  checkFields?: string[];
}

// ============================================================
// DATA REVIEWER CLASS
// ============================================================

export class DataReviewer {
  /**
   * Review data from a single source
   */
  async reviewSingleSource(input: SourceDataInput): Promise<DataReviewResult> {
    const startTime = Date.now();
    const issues: ReviewIssue[] = [];
    const recommendations: string[] = [];

    // Usage validation
    const usageValidation = complianceValidator.validateUsage({
      source: input.source,
      url: input.url || '',
      license: input.license,
    });

    if (!usageValidation.canUse) {
      issues.push({
        type: 'usage',
        severity: 'critical',
        message: usageValidation.warnings.join('; '),
        autoResolvable: false,
      });
    }

    // Privacy check
    const privacyCheck = complianceValidator.checkPrivacy(input.data);
    if (!privacyCheck.safe) {
      for (const flag of privacyCheck.flaggedFields) {
        issues.push({
          type: 'privacy',
          severity: flag.severity === 'critical' ? 'critical' : 'warning',
          field: flag.field,
          message: flag.recommendation,
          autoResolvable: false,
        });
      }
      recommendations.push(...privacyCheck.recommendations);
    }

    // Content safety check
    const textContent = this.extractTextContent(input.data);
    const safetyCheck = await complianceValidator.checkContentSafety({
      text: textContent,
      source: input.source,
    });

    if (!safetyCheck.safe) {
      for (const flag of safetyCheck.flags) {
        issues.push({
          type: 'safety',
          severity: flag.severity === 'critical' ? 'critical' : flag.severity === 'warning' ? 'warning' : 'info',
          message: flag.reason,
          autoResolvable: flag.autoResolve,
        });
      }
    }

    // Generate attribution
    const attribution = safeFetcher.generateAttribution(input.source, input.url || '');
    const attributions = [attribution];

    // Determine overall status
    let status: DataReviewResult['status'] = 'approved';
    if (issues.some(i => i.severity === 'critical')) {
      status = 'blocked';
    } else if (issues.some(i => i.severity === 'warning')) {
      status = 'needs_review';
    } else if (issues.length > 0) {
      status = 'flagged';
    }

    return {
      approved: status === 'approved',
      status,
      usageValidation,
      privacyCheck,
      safetyCheck,
      attributions,
      issues,
      recommendations,
      reviewedAt: new Date().toISOString(),
      reviewDuration: Date.now() - startTime,
    };
  }

  /**
   * Review movie data from multiple sources with consensus building
   */
  async reviewMovieData(input: MovieReviewInput): Promise<DataReviewResult> {
    const startTime = Date.now();
    const issues: ReviewIssue[] = [];
    const recommendations: string[] = [];
    const attributions: Attribution[] = [];

    // Review each source
    const sourceReviews = await Promise.all(
      input.sources.map(source => this.reviewSingleSource(source))
    );

    // Combine usage validations
    let usageValidation = sourceReviews[0]?.usageValidation || {
      canUse: false,
      license: 'unknown' as LicenseType,
      licenseInfo: complianceValidator.getLicenseInfo('unknown'),
      attribution: null,
      restrictions: [],
      warnings: ['No sources provided'],
    };

    // Combine privacy checks
    let privacyCheck: PrivacyCheck = {
      safe: true,
      hasPersonalInfo: false,
      hasSensitiveData: false,
      requiresConsent: false,
      flaggedFields: [],
      recommendations: [],
    };

    // Combine safety checks
    let safetyCheck: ContentSafetyResult = {
      safe: true,
      status: 'approved',
      flags: [],
      score: 100,
    };

    // Aggregate issues and attributions from all sources
    for (const review of sourceReviews) {
      issues.push(...review.issues);
      recommendations.push(...review.recommendations);
      attributions.push(...review.attributions);

      // Merge privacy
      if (!review.privacyCheck.safe) {
        privacyCheck.safe = false;
        privacyCheck.hasPersonalInfo = privacyCheck.hasPersonalInfo || review.privacyCheck.hasPersonalInfo;
        privacyCheck.hasSensitiveData = privacyCheck.hasSensitiveData || review.privacyCheck.hasSensitiveData;
        privacyCheck.requiresConsent = privacyCheck.requiresConsent || review.privacyCheck.requiresConsent;
        privacyCheck.flaggedFields.push(...review.privacyCheck.flaggedFields);
        privacyCheck.recommendations.push(...review.privacyCheck.recommendations);
      }

      // Merge safety (take worst score)
      if (review.safetyCheck.score < safetyCheck.score) {
        safetyCheck = review.safetyCheck;
      }
    }

    // Build consensus from multiple sources
    const consensus = this.buildConsensus(input.sources, input.checkFields);
    
    // Add consensus issues
    for (const field of consensus.conflictedFields) {
      issues.push({
        type: 'consensus',
        severity: 'warning',
        field,
        message: `Conflicting values for "${field}" across sources`,
        autoResolvable: false,
      });
    }

    if (consensus.confidence < 0.7) {
      recommendations.push('Low confidence in data consensus - consider manual review');
    }

    // Determine overall status
    let status: DataReviewResult['status'] = 'approved';
    if (issues.some(i => i.severity === 'critical')) {
      status = 'blocked';
    } else if (issues.some(i => i.severity === 'warning')) {
      status = 'needs_review';
    } else if (issues.length > 0) {
      status = 'flagged';
    }

    // Deduplicate recommendations
    const uniqueRecommendations = [...new Set(recommendations)];

    return {
      approved: status === 'approved',
      status,
      usageValidation,
      privacyCheck,
      safetyCheck,
      consensus,
      attributions,
      issues,
      recommendations: uniqueRecommendations,
      reviewedAt: new Date().toISOString(),
      reviewDuration: Date.now() - startTime,
    };
  }

  /**
   * Build consensus from multiple sources
   */
  private buildConsensus(
    sources: SourceDataInput[],
    checkFields?: string[]
  ): {
    agreedFields: string[];
    conflictedFields: string[];
    confidence: number;
    recommendedValues: Record<string, unknown>;
  } {
    if (sources.length === 0) {
      return {
        agreedFields: [],
        conflictedFields: [],
        confidence: 0,
        recommendedValues: {},
      };
    }

    if (sources.length === 1) {
      const fields = Object.keys(sources[0].data);
      return {
        agreedFields: fields,
        conflictedFields: [],
        confidence: 0.7, // Single source = moderate confidence
        recommendedValues: { ...sources[0].data },
      };
    }

    // Get all unique fields across sources
    const allFields = new Set<string>();
    for (const source of sources) {
      for (const key of Object.keys(source.data)) {
        allFields.add(key);
      }
    }

    const fieldsToCheck = checkFields || Array.from(allFields);
    const agreedFields: string[] = [];
    const conflictedFields: string[] = [];
    const recommendedValues: Record<string, unknown> = {};

    for (const field of fieldsToCheck) {
      const values: Array<{ source: ComplianceDataSource; value: unknown }> = [];
      
      for (const source of sources) {
        if (field in source.data) {
          values.push({ source: source.source, value: source.data[field] });
        }
      }

      if (values.length === 0) {
        continue;
      }

      if (values.length === 1) {
        agreedFields.push(field);
        recommendedValues[field] = values[0].value;
        continue;
      }

      // Check if all values agree
      const normalizedValues = values.map(v => this.normalizeValue(v.value));
      const allAgree = normalizedValues.every(v => v === normalizedValues[0]);

      if (allAgree) {
        agreedFields.push(field);
        recommendedValues[field] = values[0].value;
      } else {
        conflictedFields.push(field);
        // Choose value from highest-priority source
        const prioritized = this.prioritizeValue(values);
        recommendedValues[field] = prioritized;
      }
    }

    // Calculate confidence
    const totalFields = agreedFields.length + conflictedFields.length;
    const confidence = totalFields > 0
      ? agreedFields.length / totalFields
      : 0;

    return {
      agreedFields,
      conflictedFields,
      confidence,
      recommendedValues,
    };
  }

  /**
   * Normalize value for comparison
   */
  private normalizeValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (Array.isArray(value)) {
      return value.map(v => this.normalizeValue(v)).sort().join(',');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Prioritize value from multiple sources
   */
  private prioritizeValue(values: Array<{ source: ComplianceDataSource; value: unknown }>): unknown {
    // Source priority (higher = more trusted)
    const priority: Record<string, number> = {
      internal: 100,
      official: 90,
      tmdb: 80,
      wikipedia: 75,
      wikidata: 75,
      omdb: 70,
      imdb: 70,
      google_kg: 65,
      letterboxd: 60,
      archive_org: 55,
      cinemaazi: 50,
      moviebuff: 45,
      jiosaavn: 40,
      idlebrain: 35,
      greatandhra: 35,
      '123telugu': 35,
      filmibeat: 30,
      sakshi: 25,
      eenadu: 25,
      regional: 20,
    };

    // Sort by priority
    const sorted = [...values].sort((a, b) => {
      const priorityA = priority[a.source] || 0;
      const priorityB = priority[b.source] || 0;
      return priorityB - priorityA;
    });

    return sorted[0]?.value;
  }

  /**
   * Extract text content from data for safety checking
   */
  private extractTextContent(data: Record<string, unknown>): string {
    const textFields = ['synopsis', 'description', 'review', 'content', 'text', 'bio', 'plot'];
    const texts: string[] = [];

    for (const field of textFields) {
      if (typeof data[field] === 'string') {
        texts.push(data[field] as string);
      }
    }

    return texts.join(' ');
  }

  /**
   * Quick check if data is likely safe (fast path)
   */
  quickSafetyCheck(data: Record<string, unknown>): boolean {
    const textContent = this.extractTextContent(data);
    if (!textContent) return true;

    const lowerText = textContent.toLowerCase();
    const blockedPatterns = [
      'xxx', 'nude', 'naked', 'porn', 'nsfw', 'explicit',
      'leaked', 'private video', 'scandal',
    ];

    return !blockedPatterns.some(p => lowerText.includes(p));
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const dataReviewer = new DataReviewer();

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export async function reviewData(source: SourceDataInput): Promise<DataReviewResult> {
  return dataReviewer.reviewSingleSource(source);
}

export async function reviewMovieData(input: MovieReviewInput): Promise<DataReviewResult> {
  return dataReviewer.reviewMovieData(input);
}

export function quickSafetyCheck(data: Record<string, unknown>): boolean {
  return dataReviewer.quickSafetyCheck(data);
}

