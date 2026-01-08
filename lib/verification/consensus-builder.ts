/**
 * CONSENSUS BUILDER - Smart Verification Rules
 * 
 * Builds consensus from multiple sources with:
 * - Verification rules (unanimous, consensus, trust-weighted)
 * - Discrepancy detection and classification
 * - Auto-resolution for known patterns (name aliases, format differences)
 * - Manual review flagging for critical conflicts
 */

import { 
  conflictResolver, 
  type DataSource, 
  type FieldType,
  type ConflictResolutionResult,
  getVerifiedFacts,
  getFieldsRequiringReview,
} from '@/lib/data/conflict-resolution';
import type { SourceData, MovieFetchResult } from './batch-fetcher';

// ============================================================
// TYPES
// ============================================================

export interface VerifiedFact {
  field: string;
  value: unknown;
  confidence: number;
  sources: DataSource[];
  verificationMethod: VerificationMethod;
}

export type VerificationMethod = 
  | 'unanimous'      // All sources agree exactly
  | 'consensus'      // 2+ high-trust sources agree
  | 'trust_weighted' // Used highest-trust source
  | 'auto_resolved'  // Auto-resolved known pattern (e.g., name alias)
  | 'manual';        // Requires manual verification

export interface Discrepancy {
  field: string;
  severity: 'critical' | 'warning' | 'info';
  sources: Array<{
    name: DataSource;
    value: unknown;
    trust: number;
  }>;
  recommendedValue: unknown;
  recommendedSource: DataSource;
  requiresManualReview: boolean;
  autoResolutionReason?: string;
}

export interface ConsensusResult {
  movieId: string;
  title: string;
  
  // Verified facts (high confidence, agreed upon)
  verifiedFacts: VerifiedFact[];
  
  // Discrepancies (sources disagree)
  discrepancies: Discrepancy[];
  
  // Consensus values (final computed values)
  consensus: Record<string, {
    value: unknown;
    confidence: number;
    method: VerificationMethod;
    sources: DataSource[];
  }>;
  
  // Summary metrics
  summary: {
    totalFields: number;
    verifiedFields: number;
    discrepancyCount: number;
    overallConfidence: number;
    dataQualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    needsManualReview: boolean;
  };
  
  // Raw data for audit
  rawSources: SourceData[];
  processedAt: string;
}

// ============================================================
// VERIFICATION RULES
// ============================================================

/**
 * Minimum sources required for different verification levels
 */
const VERIFICATION_THRESHOLDS = {
  unanimous: 3,    // Need 3+ sources agreeing for unanimous
  consensus: 2,    // Need 2+ high-trust sources for consensus
  highTrust: 0.8,  // Minimum confidence for "high trust"
  verified: 0.75,  // Minimum confidence to be "verified"
};

/**
 * Fields that are critical and require extra scrutiny
 */
const CRITICAL_FIELDS: FieldType[] = [
  'title',
  'director',
  'hero',
  'release_date',
];

/**
 * Fields that can have auto-resolution patterns
 */
const AUTO_RESOLVABLE_FIELDS: FieldType[] = [
  'director',
  'hero',
  'heroine',
  'music_director',
  'title',        // Can resolve Wikipedia "(YYYY film)" suffix
  'release_date', // Can normalize date formats
];

// ============================================================
// CONSENSUS BUILDER CLASS
// ============================================================

export class ConsensusBuilder {
  /**
   * Build consensus from fetched movie data
   */
  buildConsensus(fetchResult: MovieFetchResult): ConsensusResult {
    const { movieId, title, sources } = fetchResult;
    
    // Convert sources to conflict resolver format
    const sourceData: Record<DataSource, Record<string, unknown>> = {};
    sources.forEach(s => {
      if (s.data && Object.keys(s.data).length > 0 && !s.error) {
        sourceData[s.source] = {
          ...s.data,
          confidence: s.confidence,
          timestamp: s.fetchedAt,
          verified: s.confidence >= 0.8,
        };
      }
    });

    // Run conflict resolution
    const resolved = conflictResolver.resolveMovie(sourceData);
    
    // Extract verified facts
    const verifiedFacts = this.extractVerifiedFacts(resolved);
    
    // Detect discrepancies
    const discrepancies = this.detectDiscrepancies(resolved, sourceData);
    
    // Build consensus values
    const consensus = this.buildConsensusValues(resolved, discrepancies);
    
    // Calculate summary
    const summary = this.calculateSummary(resolved, verifiedFacts, discrepancies);

    return {
      movieId,
      title,
      verifiedFacts,
      discrepancies,
      consensus,
      summary,
      rawSources: sources,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Extract verified facts (high confidence, good agreement)
   */
  private extractVerifiedFacts(resolved: ConflictResolutionResult): VerifiedFact[] {
    const facts: VerifiedFact[] = [];
    
    Object.entries(resolved.fields).forEach(([field, data]) => {
      // Check verification criteria
      if (data.confidence < VERIFICATION_THRESHOLDS.verified) return;
      if (data.agreementLevel === 'conflict') return;
      
      let method: VerificationMethod = 'trust_weighted';
      
      if (data.agreementLevel === 'unanimous' && data.rawValues.length >= VERIFICATION_THRESHOLDS.unanimous) {
        method = 'unanimous';
      } else if (data.agreementLevel === 'consensus') {
        method = 'consensus';
      }
      
      facts.push({
        field,
        value: data.derivedValue,
        confidence: data.confidence,
        sources: data.rawValues.map(rv => rv.source),
        verificationMethod: method,
      });
    });
    
    return facts;
  }

  /**
   * Detect and classify discrepancies
   */
  private detectDiscrepancies(
    resolved: ConflictResolutionResult,
    sourceData: Record<DataSource, Record<string, unknown>>
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = [];
    
    resolved.conflicts.forEach(conflict => {
      const fieldData = resolved.fields[conflict.field];
      if (!fieldData) return;
      
      // Get source values
      const sourceValues = fieldData.rawValues.map(rv => ({
        name: rv.source,
        value: rv.value,
        trust: rv.confidence,
      }));
      
      // Check if this is auto-resolvable
      const autoResolution = this.tryAutoResolve(
        conflict.field as FieldType,
        sourceValues
      );
      
      const isCritical = CRITICAL_FIELDS.includes(conflict.field as FieldType);
      const hasHighTrustConflict = this.hasHighTrustConflict(sourceValues);
      
      // If auto-resolved, downgrade severity from critical to info
      const effectiveSeverity = autoResolution 
        ? 'info'  // Auto-resolved = no longer critical
        : (isCritical && hasHighTrustConflict ? 'critical' : 
           hasHighTrustConflict ? 'warning' : 'info');
      
      discrepancies.push({
        field: conflict.field,
        severity: effectiveSeverity,
        sources: sourceValues,
        recommendedValue: autoResolution?.value ?? fieldData.derivedValue,
        recommendedSource: fieldData.primarySource,
        requiresManualReview: autoResolution === null && (isCritical || hasHighTrustConflict),
        autoResolutionReason: autoResolution?.reason,
      });
    });
    
    return discrepancies;
  }

  /**
   * Try to auto-resolve known patterns
   */
  private tryAutoResolve(
    field: FieldType,
    sources: Array<{ name: DataSource; value: unknown; trust: number }>
  ): { value: unknown; reason: string } | null {
    if (!AUTO_RESOLVABLE_FIELDS.includes(field)) return null;
    
    const values = sources.map(s => s.value).filter(v => v != null);
    if (values.length < 2) return null;
    
    const stringValues = values.filter(v => typeof v === 'string') as string[];
    
    // Handle title field - Wikipedia adds "(YYYY film)" suffix
    if (field === 'title' && stringValues.length >= 2) {
      const normalizedTitles = stringValues.map(v => this.normalizeTitle(v));
      const unique = [...new Set(normalizedTitles)];
      
      if (unique.length === 1) {
        // All titles match after normalization - use shortest (without suffix)
        const shortest = stringValues.sort((a, b) => a.length - b.length)[0];
        return {
          value: shortest,
          reason: `Auto-resolved: Wikipedia "(YYYY film)" suffix stripped`,
        };
      }
      
      // Check for spelling variants (similar titles with minor differences)
      const spellingVariants = this.findSpellingVariants(stringValues, sources);
      if (spellingVariants) {
        return spellingVariants;
      }
    }
    
    // Handle release_date field - normalize date formats
    if (field === 'release_date' && stringValues.length >= 2) {
      const normalizedDates = stringValues.map(v => this.normalizeDate(v));
      const unique = [...new Set(normalizedDates)];
      
      if (unique.length === 1) {
        // All dates match after normalization - use the normalized format
        return {
          value: unique[0],
          reason: `Auto-resolved: Date formats normalized to YYYY-MM-DD`,
        };
      }
      
      // Check date differences
      const dates = normalizedDates
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()));
      
      if (dates.length >= 2) {
        const minDate = Math.min(...dates.map(d => d.getTime()));
        const maxDate = Math.max(...dates.map(d => d.getTime()));
        const diffDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays <= 7) {
          // Within a week - use the earliest date
          const earliest = new Date(minDate).toISOString().split('T')[0];
          return {
            value: earliest,
            reason: `Auto-resolved: Dates within ${Math.round(diffDays)} days, using earliest`,
          };
        }
        
        // For gaps > 7 days: check if one source has Jan 1 (year-only placeholder)
        const hasYearOnlyPlaceholder = normalizedDates.some(d => 
          d.endsWith('-01-01') || d.endsWith('-01-01T00:00:00Z')
        );
        
        if (hasYearOnlyPlaceholder) {
          // Use the later/more specific date (not Jan 1)
          const specificDates = normalizedDates.filter(d => 
            !d.endsWith('-01-01') && !d.endsWith('-01-01T00:00:00Z')
          );
          if (specificDates.length > 0) {
            // Use the latest specific date
            const latestSpecific = specificDates.sort().pop()!;
            return {
              value: latestSpecific,
              reason: `Auto-resolved: Using specific date over year-only placeholder`,
            };
          }
        }
        
        // For other large gaps: use the later date (usually more accurate release)
        const latest = new Date(maxDate).toISOString().split('T')[0];
        return {
          value: latest,
          reason: `Auto-resolved: Using later date for large gap (${Math.round(diffDays)} days)`,
        };
      }
    }
    
    // Check for name aliases (same person, different formatting)
    if (stringValues.length >= 2) {
      // Check if they're variations of the same name
      const normalized = stringValues.map(v => this.normalizeName(v));
      const unique = [...new Set(normalized)];
      
      if (unique.length === 1) {
        // All variations of the same name - use most common format
        const valueCounts = new Map<string, number>();
        stringValues.forEach(v => {
          valueCounts.set(v, (valueCounts.get(v) || 0) + 1);
        });
        const mostCommon = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        
        return {
          value: mostCommon,
          reason: `Auto-resolved: All values are variations of the same name`,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Normalize movie titles for comparison
   * Strips Wikipedia suffixes like "(2024 film)", "(film)", "(2024 Telugu film)"
   */
  private normalizeTitle(title: string): string {
    return title
      .replace(/\s*\(\d{4}\s*(film|Telugu film|Indian film|American film)?\)$/i, '')
      .replace(/\s*\(film\)$/i, '')
      .toLowerCase()
      .trim();
  }
  
  /**
   * Find and resolve spelling variants for titles
   * Examples: "Akkada Ammayi" vs "Akkada Ammai", "Theerpu" vs "Theerpu"
   */
  private findSpellingVariants(
    titles: string[],
    sources: Array<{ name: DataSource; value: unknown; trust: number }>
  ): { value: unknown; reason: string } | null {
    // Check if titles are similar (only differ by 1-3 characters)
    const normalized = titles.map(t => this.normalizeTitle(t));
    
    // Calculate similarity between titles
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        const similarity = this.calculateSimilarity(normalized[i], normalized[j]);
        
        // If titles are >80% similar, they're likely spelling variants
        if (similarity > 0.8) {
          // Choose the one from the highest trust source
          const sourceMap = new Map(sources.map(s => [
            this.normalizeTitle(String(s.value)),
            { value: s.value, trust: s.trust, name: s.name }
          ]));
          
          // Priority: internal > tmdb > wikipedia > others
          const priorities: DataSource[] = ['internal', 'tmdb', 'omdb', 'wikipedia', 'wikidata'];
          
          for (const priority of priorities) {
            const match = sources.find(s => 
              s.name === priority && typeof s.value === 'string'
            );
            if (match) {
              return {
                value: match.value,
                reason: `Auto-resolved: Spelling variant, using ${priority} version`,
              };
            }
          }
          
          // Fallback: use the title that appears most frequently
          const counts = new Map<string, number>();
          titles.forEach(t => counts.set(t, (counts.get(t) || 0) + 1));
          const mostCommon = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
          
          return {
            value: mostCommon,
            reason: `Auto-resolved: Spelling variant, using most common`,
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Calculate Levenshtein similarity between two strings (0-1)
   */
  private calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  /**
   * Normalize dates to YYYY-MM-DD format
   * Handles: "2024-01-15", "2024-01-15T00:00:00Z", "January 15, 2024"
   */
  private normalizeDate(dateStr: string): string {
    // Handle ISO format with time
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0];
    }
    
    // Handle YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // Try to parse other formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return dateStr;
  }

  /**
   * Normalize names for comparison
   */
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+(jr\.?|sr\.?|ii|iii)$/i, '')
      .replace(/^(dr\.?|mr\.?|ms\.?|mrs\.?)\s+/i, '')
      .replace(/[.']/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if there's a conflict between high-trust sources
   */
  private hasHighTrustConflict(
    sources: Array<{ name: DataSource; value: unknown; trust: number }>
  ): boolean {
    const highTrust = sources.filter(s => s.trust >= VERIFICATION_THRESHOLDS.highTrust);
    if (highTrust.length < 2) return false;
    
    const values = highTrust.map(s => JSON.stringify(s.value));
    const unique = new Set(values);
    return unique.size > 1;
  }

  /**
   * Build final consensus values
   */
  private buildConsensusValues(
    resolved: ConflictResolutionResult,
    discrepancies: Discrepancy[]
  ): ConsensusResult['consensus'] {
    const consensus: ConsensusResult['consensus'] = {};
    
    Object.entries(resolved.fields).forEach(([field, data]) => {
      const discrepancy = discrepancies.find(d => d.field === field);
      
      let method: VerificationMethod = 'trust_weighted';
      let value = data.derivedValue;
      
      if (data.agreementLevel === 'unanimous') {
        method = 'unanimous';
      } else if (data.agreementLevel === 'consensus') {
        method = 'consensus';
      } else if (discrepancy?.autoResolutionReason) {
        method = 'auto_resolved';
        value = discrepancy.recommendedValue;
      } else if (discrepancy?.requiresManualReview) {
        method = 'manual';
      }
      
      consensus[field] = {
        value,
        confidence: data.confidence,
        method,
        sources: data.rawValues.map(rv => rv.source),
      };
    });
    
    return consensus;
  }

  /**
   * Calculate summary metrics
   */
  private calculateSummary(
    resolved: ConflictResolutionResult,
    verifiedFacts: VerifiedFact[],
    discrepancies: Discrepancy[]
  ): ConsensusResult['summary'] {
    const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'critical');
    const manualReviewNeeded = discrepancies.some(d => d.requiresManualReview);
    
    return {
      totalFields: Object.keys(resolved.fields).length,
      verifiedFields: verifiedFacts.length,
      discrepancyCount: discrepancies.length,
      overallConfidence: resolved.metadata.avgConfidence,
      dataQualityGrade: resolved.metadata.dataQualityGrade,
      needsManualReview: manualReviewNeeded || criticalDiscrepancies.length > 0,
    };
  }

  /**
   * Merge multiple consensus results
   */
  mergeConsensusResults(results: ConsensusResult[]): {
    totalMovies: number;
    moviesWithIssues: number;
    avgConfidence: number;
    gradeDistribution: Record<string, number>;
    commonDiscrepancies: Array<{ field: string; count: number }>;
  } {
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    const discrepancyCounts = new Map<string, number>();
    let totalConfidence = 0;
    let moviesWithIssues = 0;
    
    results.forEach(result => {
      gradeDistribution[result.summary.dataQualityGrade]++;
      totalConfidence += result.summary.overallConfidence;
      
      if (result.summary.needsManualReview) moviesWithIssues++;
      
      result.discrepancies.forEach(d => {
        discrepancyCounts.set(d.field, (discrepancyCounts.get(d.field) || 0) + 1);
      });
    });
    
    const commonDiscrepancies = [...discrepancyCounts.entries()]
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalMovies: results.length,
      moviesWithIssues,
      avgConfidence: results.length > 0 ? totalConfidence / results.length : 0,
      gradeDistribution,
      commonDiscrepancies,
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const consensusBuilder = new ConsensusBuilder();
export default consensusBuilder;

