/**
 * VERIFICATION MODULE
 * 
 * Cross-reference verification system for movie data.
 * Compares data from multiple sources and produces verified facts summaries.
 */

// Core components
export { BatchFetcher, createBatchFetcher } from './batch-fetcher';
export type { 
  FetchConfig, 
  SourceData, 
  MovieFetchResult, 
  BatchProgress 
} from './batch-fetcher';

export { ConsensusBuilder, consensusBuilder } from './consensus-builder';
export type { 
  VerifiedFact, 
  VerificationMethod, 
  Discrepancy, 
  ConsensusResult 
} from './consensus-builder';

export { ReportGenerator, reportGenerator } from './report-generator';
export type { 
  VerificationReport, 
  BatchReport 
} from './report-generator';

// Re-export conflict resolution types
export { 
  conflictResolver,
  mergeMovieData,
  getDataQualityScore,
  getVerifiedFacts,
  getFieldsRequiringReview,
} from '@/lib/data/conflict-resolution';
export type { 
  DataSource, 
  FieldType, 
  SourceValue, 
  ResolvedField,
  ConflictResolutionResult,
  AgreementLevel,
  ResolutionMethod,
} from '@/lib/data/conflict-resolution';

// ============================================================
// MAIN VERIFICATION PIPELINE
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { createBatchFetcher, type FetchConfig, type MovieFetchResult } from './batch-fetcher';
import { consensusBuilder, type ConsensusResult } from './consensus-builder';
import { reportGenerator, type VerificationReport, type BatchReport } from './report-generator';

export interface VerificationPipelineConfig extends Partial<FetchConfig> {
  autoApplyThreshold?: number; // Confidence threshold for auto-apply (default: 0.9)
  dryRun?: boolean;           // Don't save changes to DB
}

export interface VerificationPipelineResult {
  batchReport: BatchReport;
  autoApplied: number;
  skipped: number;
  duration: number;
}

// Database client for saving verification data
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Save verification data to the database
 */
async function saveVerificationToDb(
  consensus: ConsensusResult,
  report: VerificationReport
): Promise<boolean> {
  const supabase = getSupabase();
  
  // Build verified facts JSONB
  const verifiedFacts: Record<string, unknown> = {};
  consensus.verifiedFacts.forEach(fact => {
    verifiedFacts[fact.field] = {
      value: fact.value,
      confidence: fact.confidence,
      sources: fact.sources,
      verificationMethod: fact.verificationMethod,
    };
  });
  
  // Build discrepancies JSONB array
  const pendingDiscrepancies = consensus.discrepancies.map(d => ({
    field: d.field,
    severity: d.severity,
    sources: d.sources,
    recommendedValue: d.recommendedValue,
    recommendedSource: d.recommendedSource,
    requiresManualReview: d.requiresManualReview,
    autoResolutionReason: d.autoResolutionReason,
  }));
  
  // Build source data for audit trail
  const sourceData: Record<string, unknown> = {};
  consensus.rawSources.forEach(s => {
    if (!s.error) {
      sourceData[s.source] = {
        data: s.data,
        fetchedAt: s.fetchedAt,
        confidence: s.confidence,
      };
    }
  });
  
  // Sources used
  const sourcesUsed = consensus.rawSources
    .filter(s => !s.error && Object.keys(s.data).length > 0)
    .map(s => s.source);
  
  try {
    const { error } = await supabase
      .from('movie_verification')
      .upsert({
        movie_id: consensus.movieId,
        verified_facts: verifiedFacts,
        pending_discrepancies: pendingDiscrepancies,
        source_data: sourceData,
        overall_confidence: consensus.summary.overallConfidence,
        data_quality_grade: consensus.summary.dataQualityGrade,
        needs_manual_review: consensus.summary.needsManualReview,
        sources_used: sourcesUsed,
        fields_verified: consensus.summary.verifiedFields,
        discrepancy_count: consensus.summary.discrepancyCount,
        last_verified_at: new Date().toISOString(),
      }, {
        onConflict: 'movie_id',
      });
    
    if (error) {
      console.error(`Failed to save verification for ${consensus.movieId}:`, error.message);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`Error saving verification for ${consensus.movieId}:`, err);
    return false;
  }
}

/**
 * Run the complete verification pipeline for a batch of movies
 */
export async function runVerificationPipeline(
  movies: Array<{ id: string; title: string; year: number; imdb_id?: string }>,
  config: VerificationPipelineConfig = {},
  onProgress?: (msg: string) => void
): Promise<VerificationPipelineResult> {
  const startTime = Date.now();
  const { autoApplyThreshold = 0.9, dryRun = false, ...fetchConfig } = config;
  
  onProgress?.(`Starting verification pipeline for ${movies.length} movies...`);
  
  // Step 1: Fetch data from all sources
  const fetcher = createBatchFetcher(fetchConfig);
  const fetchResults: MovieFetchResult[] = await fetcher.fetchBatch(movies, (progress) => {
    onProgress?.(`Fetching: ${progress.completed}/${progress.total} (Batch ${progress.currentBatch}/${progress.totalBatches})`);
  });
  
  onProgress?.(`Fetched data for ${fetchResults.length} movies`);
  
  // Step 2: Build consensus for each movie
  const consensusResults: ConsensusResult[] = [];
  fetchResults.forEach((result, idx) => {
    const consensus = consensusBuilder.buildConsensus(result);
    consensusResults.push(consensus);
    
    if ((idx + 1) % 50 === 0) {
      onProgress?.(`Built consensus: ${idx + 1}/${fetchResults.length}`);
    }
  });
  
  onProgress?.(`Built consensus for ${consensusResults.length} movies`);
  
  // Step 3: Generate batch report
  const batchReport = reportGenerator.generateBatchReport(consensusResults);
  
  onProgress?.(`Generated batch report`);
  onProgress?.(`  - Grade distribution: A=${batchReport.metrics.gradeDistribution.A}, B=${batchReport.metrics.gradeDistribution.B}, C=${batchReport.metrics.gradeDistribution.C}, D=${batchReport.metrics.gradeDistribution.D}, F=${batchReport.metrics.gradeDistribution.F}`);
  onProgress?.(`  - Movies needing review: ${batchReport.metrics.moviesNeedingReview}`);
  onProgress?.(`  - Auto-applicable: ${batchReport.metrics.autoApplicable}`);
  
  // Step 4: Auto-apply high-confidence updates (if not dry run)
  let autoApplied = 0;
  let skipped = 0;
  
  if (!dryRun) {
    onProgress?.(`Saving verification data to database...`);
    
    for (let i = 0; i < consensusResults.length; i++) {
      const consensus = consensusResults[i];
      const report = batchReport.reports[i];
      
      // Check if this movie qualifies for auto-apply
      const hasAutoApplyActions = report.actions.some(a => a.type === 'auto_apply');
      const meetsConfidenceThreshold = report.qualityMetrics.confidence >= autoApplyThreshold;
      const noManualReviewNeeded = !report.qualityMetrics.needsManualReview;
      
      if (hasAutoApplyActions && meetsConfidenceThreshold && noManualReviewNeeded) {
        // Save to database
        const saved = await saveVerificationToDb(consensus, report);
        if (saved) {
          autoApplied++;
        } else {
          skipped++;
        }
      } else {
        // Still save the verification data, but mark appropriately
        await saveVerificationToDb(consensus, report);
        skipped++;
      }
      
      if ((i + 1) % 100 === 0) {
        onProgress?.(`Saved: ${i + 1}/${consensusResults.length} (Applied: ${autoApplied})`);
      }
    }
    
    onProgress?.(`Saved ${consensusResults.length} verification records (${autoApplied} auto-applied)`);
  } else {
    // Dry run - just count what would be auto-applied
    batchReport.reports.forEach(report => {
      const autoApplyActions = report.actions.filter(
        a => a.type === 'auto_apply' && report.qualityMetrics.confidence >= autoApplyThreshold
      );
      if (autoApplyActions.length > 0 && !report.qualityMetrics.needsManualReview) {
        autoApplied++;
      } else {
        skipped++;
      }
    });
    skipped = movies.length;
    onProgress?.(`DRY RUN: No changes applied`);
  }
  
  const duration = Date.now() - startTime;
  onProgress?.(`Completed in ${(duration / 1000).toFixed(1)}s`);
  
  return {
    batchReport,
    autoApplied,
    skipped,
    duration,
  };
}

/**
 * Verify a single movie
 */
export async function verifySingleMovie(
  movie: { id: string; title: string; year: number; imdb_id?: string },
  config?: Partial<FetchConfig>
): Promise<{ consensus: ConsensusResult; report: VerificationReport }> {
  const fetcher = createBatchFetcher(config);
  const fetchResult = await fetcher.fetchMovie(movie.id, movie.title, movie.year, movie.imdb_id);
  const consensus = consensusBuilder.buildConsensus(fetchResult);
  const report = reportGenerator.generateReport(consensus);
  
  return { consensus, report };
}

