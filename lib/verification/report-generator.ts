/**
 * REPORT GENERATOR - Discrepancy Reports and Smart Summaries
 * 
 * Generates:
 * - Discrepancy reports for manual review
 * - Verified facts summaries
 * - Data quality reports
 * - Smart text summaries
 */

import type { ConsensusResult, Discrepancy, VerifiedFact } from './consensus-builder';
import type { DataSource } from '@/lib/data/conflict-resolution';

// ============================================================
// TYPES
// ============================================================

export interface VerificationReport {
  movieId: string;
  title: string;
  generatedAt: string;
  
  // Quality metrics
  qualityMetrics: {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    confidence: number;
    sourcesUsed: number;
    verifiedFieldCount: number;
    discrepancyCount: number;
    needsManualReview: boolean;
  };
  
  // Verified facts in structured format
  verifiedFacts: Record<string, {
    value: unknown;
    confidence: number;
    sources: DataSource[];
    verificationLevel: 'verified' | 'consensus' | 'inferred';
  }>;
  
  // Discrepancies requiring attention
  discrepancies: Discrepancy[];
  
  // Human-readable summary
  summary: string;
  
  // Actionable items
  actions: Array<{
    type: 'auto_apply' | 'manual_review' | 're_fetch' | 'ignore';
    field: string;
    reason: string;
    suggestedValue?: unknown;
  }>;
}

export interface BatchReport {
  generatedAt: string;
  totalMovies: number;
  
  // Aggregate metrics
  metrics: {
    avgConfidence: number;
    moviesNeedingReview: number;
    autoApplicable: number;
    gradeDistribution: Record<string, number>;
  };
  
  // Most common issues
  commonIssues: Array<{
    field: string;
    count: number;
    severity: 'critical' | 'warning' | 'info';
  }>;
  
  // Movies by status
  moviesByStatus: {
    verified: string[];      // High quality, no issues
    autoApplicable: string[];  // Can be auto-applied
    needsReview: string[];    // Requires manual review
    lowQuality: string[];     // Low confidence, needs re-fetching
  };
  
  // Detailed reports
  reports: VerificationReport[];
}

// ============================================================
// REPORT GENERATOR CLASS
// ============================================================

export class ReportGenerator {
  /**
   * Generate a verification report for a single movie
   */
  generateReport(consensus: ConsensusResult): VerificationReport {
    const verifiedFacts: VerificationReport['verifiedFacts'] = {};
    
    // Build verified facts structure
    consensus.verifiedFacts.forEach(fact => {
      verifiedFacts[fact.field] = {
        value: fact.value,
        confidence: fact.confidence,
        sources: fact.sources,
        verificationLevel: fact.verificationMethod === 'unanimous' ? 'verified' :
                          fact.verificationMethod === 'consensus' ? 'consensus' : 'inferred',
      };
    });
    
    // Generate actions
    const actions = this.generateActions(consensus);
    
    // Generate human-readable summary
    const summary = this.generateSummary(consensus);

    return {
      movieId: consensus.movieId,
      title: consensus.title,
      generatedAt: new Date().toISOString(),
      qualityMetrics: {
        grade: consensus.summary.dataQualityGrade,
        confidence: consensus.summary.overallConfidence,
        sourcesUsed: consensus.rawSources.filter(s => !s.error).length,
        verifiedFieldCount: consensus.summary.verifiedFields,
        discrepancyCount: consensus.summary.discrepancyCount,
        needsManualReview: consensus.summary.needsManualReview,
      },
      verifiedFacts,
      discrepancies: consensus.discrepancies,
      summary,
      actions,
    };
  }

  /**
   * Generate a batch report from multiple consensus results
   */
  generateBatchReport(results: ConsensusResult[]): BatchReport {
    const reports = results.map(r => this.generateReport(r));
    
    // Calculate metrics
    let totalConfidence = 0;
    let moviesNeedingReview = 0;
    let autoApplicable = 0;
    const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    
    const moviesByStatus = {
      verified: [] as string[],
      autoApplicable: [] as string[],
      needsReview: [] as string[],
      lowQuality: [] as string[],
    };
    
    // Track common issues
    const issueTracker = new Map<string, { count: number; severity: 'critical' | 'warning' | 'info' }>();
    
    reports.forEach(report => {
      totalConfidence += report.qualityMetrics.confidence;
      gradeDistribution[report.qualityMetrics.grade]++;
      
      // Categorize movies
      if (report.qualityMetrics.needsManualReview) {
        moviesNeedingReview++;
        moviesByStatus.needsReview.push(report.movieId);
      } else if (report.qualityMetrics.grade === 'A' || report.qualityMetrics.grade === 'B') {
        moviesByStatus.verified.push(report.movieId);
      } else if (report.qualityMetrics.grade === 'F') {
        moviesByStatus.lowQuality.push(report.movieId);
      }
      
      // Check for auto-applicable
      const hasAutoApply = report.actions.some(a => a.type === 'auto_apply');
      if (hasAutoApply && !report.qualityMetrics.needsManualReview) {
        autoApplicable++;
        moviesByStatus.autoApplicable.push(report.movieId);
      }
      
      // Track issues
      report.discrepancies.forEach(d => {
        const key = d.field;
        const existing = issueTracker.get(key);
        if (existing) {
          existing.count++;
          if (d.severity === 'critical' && existing.severity !== 'critical') {
            existing.severity = 'critical';
          } else if (d.severity === 'warning' && existing.severity === 'info') {
            existing.severity = 'warning';
          }
        } else {
          issueTracker.set(key, { count: 1, severity: d.severity });
        }
      });
    });
    
    // Sort common issues
    const commonIssues = [...issueTracker.entries()]
      .map(([field, data]) => ({ field, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      generatedAt: new Date().toISOString(),
      totalMovies: results.length,
      metrics: {
        avgConfidence: results.length > 0 ? totalConfidence / results.length : 0,
        moviesNeedingReview,
        autoApplicable,
        gradeDistribution,
      },
      commonIssues,
      moviesByStatus,
      reports,
    };
  }

  /**
   * Generate actionable items from consensus
   */
  private generateActions(consensus: ConsensusResult): VerificationReport['actions'] {
    const actions: VerificationReport['actions'] = [];
    
    // Check each consensus value
    Object.entries(consensus.consensus).forEach(([field, data]) => {
      if (data.method === 'unanimous' && data.confidence >= 0.9) {
        actions.push({
          type: 'auto_apply',
          field,
          reason: 'High confidence unanimous agreement',
          suggestedValue: data.value,
        });
      } else if (data.method === 'auto_resolved') {
        actions.push({
          type: 'auto_apply',
          field,
          reason: 'Auto-resolved known pattern',
          suggestedValue: data.value,
        });
      }
    });
    
    // Check discrepancies
    consensus.discrepancies.forEach(d => {
      if (d.requiresManualReview) {
        actions.push({
          type: 'manual_review',
          field: d.field,
          reason: `${d.severity} discrepancy between ${d.sources.length} sources`,
          suggestedValue: d.recommendedValue,
        });
      } else if (d.autoResolutionReason) {
        actions.push({
          type: 'auto_apply',
          field: d.field,
          reason: d.autoResolutionReason,
          suggestedValue: d.recommendedValue,
        });
      }
    });
    
    // Check for low source count
    if (consensus.rawSources.filter(s => !s.error).length < 2) {
      actions.push({
        type: 're_fetch',
        field: '*',
        reason: 'Insufficient sources - recommend fetching additional data',
      });
    }
    
    return actions;
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(consensus: ConsensusResult): string {
    const lines: string[] = [];
    
    lines.push(`${consensus.title} - Verification Summary`);
    lines.push('='.repeat(50));
    lines.push('');
    
    // Quality grade
    const gradeEmoji: Record<string, string> = {
      'A': '🟢', 'B': '🔵', 'C': '🟡', 'D': '🟠', 'F': '🔴'
    };
    lines.push(`Quality Grade: ${gradeEmoji[consensus.summary.dataQualityGrade]} ${consensus.summary.dataQualityGrade} (${(consensus.summary.overallConfidence * 100).toFixed(0)}% confidence)`);
    lines.push(`Sources: ${consensus.rawSources.filter(s => !s.error).length} active`);
    lines.push('');
    
    // Verified facts
    if (consensus.verifiedFacts.length > 0) {
      lines.push('✅ VERIFIED FACTS:');
      consensus.verifiedFacts.slice(0, 10).forEach(fact => {
        const value = typeof fact.value === 'string' ? fact.value : JSON.stringify(fact.value);
        const truncated = value.length > 50 ? value.slice(0, 50) + '...' : value;
        lines.push(`   ${fact.field}: ${truncated}`);
        lines.push(`      [${fact.sources.join(', ')}] (${(fact.confidence * 100).toFixed(0)}%)`);
      });
      lines.push('');
    }
    
    // Discrepancies
    if (consensus.discrepancies.length > 0) {
      lines.push('⚠️ DISCREPANCIES:');
      consensus.discrepancies.forEach(d => {
        const icon = d.severity === 'critical' ? '🔴' : d.severity === 'warning' ? '🟡' : '🔵';
        lines.push(`   ${icon} ${d.field}:`);
        d.sources.forEach(s => {
          const value = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
          const truncated = value.length > 40 ? value.slice(0, 40) + '...' : value;
          lines.push(`      - ${s.name}: ${truncated}`);
        });
        if (d.autoResolutionReason) {
          lines.push(`      ✓ Auto-resolved: ${d.autoResolutionReason}`);
        } else if (d.requiresManualReview) {
          lines.push(`      ⚡ Requires manual review`);
        }
      });
      lines.push('');
    }
    
    // Actions needed
    if (consensus.summary.needsManualReview) {
      lines.push('📋 ACTION NEEDED: Manual review required');
    } else if (consensus.summary.dataQualityGrade === 'A' || consensus.summary.dataQualityGrade === 'B') {
      lines.push('✨ STATUS: Ready to use');
    } else {
      lines.push('📋 ACTION: Consider additional data sources');
    }
    
    return lines.join('\n');
  }

  /**
   * Generate JSON export for verified facts (for DB storage)
   */
  generateVerifiedFactsJSON(consensus: ConsensusResult): Record<string, {
    value: unknown;
    confidence: number;
    sources: DataSource[];
  }> {
    const result: Record<string, { value: unknown; confidence: number; sources: DataSource[] }> = {};
    
    consensus.verifiedFacts.forEach(fact => {
      result[fact.field] = {
        value: fact.value,
        confidence: fact.confidence,
        sources: fact.sources,
      };
    });
    
    return result;
  }

  /**
   * Generate smart summary text (for display in reviews)
   */
  generateSmartSummary(consensus: ConsensusResult): string {
    const parts: string[] = [];
    
    // Core facts
    const director = consensus.consensus['director'];
    const hero = consensus.consensus['hero'];
    const heroine = consensus.consensus['heroine'];
    const rating = consensus.consensus['rating'];
    const runtime = consensus.consensus['runtime'];
    
    if (director?.confidence >= 0.8) {
      parts.push(`Directed by ${director.value}`);
    }
    
    if (hero?.confidence >= 0.8) {
      if (heroine?.confidence >= 0.8) {
        parts.push(`starring ${hero.value} and ${heroine.value}`);
      } else {
        parts.push(`starring ${hero.value}`);
      }
    }
    
    if (rating?.confidence >= 0.8) {
      parts.push(`rated ${rating.value}/10`);
    }
    
    if (runtime?.confidence >= 0.8) {
      parts.push(`${runtime.value} minutes`);
    }
    
    return parts.length > 0 
      ? parts.join(', ') + '.'
      : 'Verified data pending.';
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const reportGenerator = new ReportGenerator();
export default reportGenerator;

