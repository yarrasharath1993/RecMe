/**
 * AUDIT LOGGER
 * 
 * Extended audit logging for multi-source image validation.
 * Tracks source trace, license trace, and confidence breakdowns.
 */

import { writeFile, appendFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';

export interface ImageAuditRecord {
  timestamp: string;
  movie_id: string;
  movie_title: string;
  movie_year: number;
  image_url: string;
  source_trace: {
    baseline: string;
    baseline_confidence: number;
    validate_only: string[];
    validate_only_confirmed: string[];
    ingest_sources_tried: string[];
    ingest_source_used: string | null;
    agreement_count: number;
  };
  license_trace: {
    license_type: string;
    license_verified: boolean;
    license_warning: string | null;
    source_requires_attribution: boolean;
  };
  confidence_breakdown: {
    base_score: number;
    validate_only_boost: number;
    multi_source_boost: number;
    final_score: number;
    ai_generated: boolean;
    capped: boolean;
  };
  storage_decision: {
    stored: boolean;
    reason: string;
    dry_run: boolean;
  };
}

export interface AuditSummary {
  total_processed: number;
  total_enriched: number;
  by_source: Record<string, number>;
  validate_only_confirmations: number;
  multi_source_agreements: number;
  license_warnings: number;
  avg_confidence: number;
  records: ImageAuditRecord[];
}

/**
 * Create audit record for an image enrichment
 */
export function createAuditRecord(
  movieId: string,
  movieTitle: string,
  movieYear: number,
  imageUrl: string,
  baselineSource: string,
  baselineConfidence: number,
  validateOnlySources: string[],
  confirmedBy: string[],
  ingestSourcesTried: string[],
  ingestSourceUsed: string | null,
  agreementCount: number,
  licenseType: string,
  licenseVerified: boolean,
  licenseWarning: string | null,
  requiresAttribution: boolean,
  baseScore: number,
  validateOnlyBoost: number,
  multiSourceBoost: number,
  finalScore: number,
  aiGenerated: boolean,
  stored: boolean,
  reason: string,
  dryRun: boolean
): ImageAuditRecord {
  return {
    timestamp: new Date().toISOString(),
    movie_id: movieId,
    movie_title: movieTitle,
    movie_year: movieYear,
    image_url: imageUrl,
    source_trace: {
      baseline: baselineSource,
      baseline_confidence: baselineConfidence,
      validate_only: validateOnlySources,
      validate_only_confirmed: confirmedBy,
      ingest_sources_tried: ingestSourcesTried,
      ingest_source_used: ingestSourceUsed,
      agreement_count: agreementCount,
    },
    license_trace: {
      license_type: licenseType,
      license_verified: licenseVerified,
      license_warning: licenseWarning,
      source_requires_attribution: requiresAttribution,
    },
    confidence_breakdown: {
      base_score: baseScore,
      validate_only_boost: validateOnlyBoost,
      multi_source_boost: multiSourceBoost,
      final_score: finalScore,
      ai_generated: aiGenerated,
      capped: aiGenerated && finalScore <= 0.50,
    },
    storage_decision: {
      stored,
      reason,
      dry_run: dryRun,
    },
  };
}

/**
 * Write audit log to file
 */
export async function writeAuditLog(
  records: ImageAuditRecord[],
  outputPath?: string
): Promise<string> {
  const reportsDir = resolve(process.cwd(), 'reports');
  
  // Ensure reports directory exists
  if (!existsSync(reportsDir)) {
    await mkdir(reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = outputPath || resolve(reportsDir, `image-enrichment-${timestamp}.json`);
  
  const summary: AuditSummary = {
    total_processed: records.length,
    total_enriched: records.filter(r => r.storage_decision.stored).length,
    by_source: {},
    validate_only_confirmations: records.filter(r => r.source_trace.validate_only_confirmed.length > 0).length,
    multi_source_agreements: records.filter(r => r.source_trace.agreement_count >= 2).length,
    license_warnings: records.filter(r => r.license_trace.license_warning !== null).length,
    avg_confidence: records.length > 0 
      ? records.reduce((sum, r) => sum + r.confidence_breakdown.final_score, 0) / records.length 
      : 0,
    records,
  };
  
  // Count by source
  for (const record of records) {
    const source = record.source_trace.ingest_source_used || record.source_trace.baseline;
    summary.by_source[source] = (summary.by_source[source] || 0) + 1;
  }
  
  await writeFile(filename, JSON.stringify(summary, null, 2));
  
  return filename;
}

/**
 * Write audit log in markdown format
 */
export async function writeAuditLogMarkdown(
  records: ImageAuditRecord[],
  outputPath?: string
): Promise<string> {
  const reportsDir = resolve(process.cwd(), 'reports');
  
  if (!existsSync(reportsDir)) {
    await mkdir(reportsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = outputPath || resolve(reportsDir, `image-enrichment-${timestamp}.md`);
  
  let markdown = `# Image Enrichment Audit Report\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  
  // Summary
  const totalProcessed = records.length;
  const totalEnriched = records.filter(r => r.storage_decision.stored).length;
  const validateOnlyConfirmations = records.filter(r => r.source_trace.validate_only_confirmed.length > 0).length;
  const multiSourceAgreements = records.filter(r => r.source_trace.agreement_count >= 2).length;
  const licenseWarnings = records.filter(r => r.license_trace.license_warning !== null).length;
  const avgConfidence = totalProcessed > 0 
    ? records.reduce((sum, r) => sum + r.confidence_breakdown.final_score, 0) / totalProcessed 
    : 0;
  
  markdown += `## Summary\n\n`;
  markdown += `- **Total Processed**: ${totalProcessed}\n`;
  markdown += `- **Total Enriched**: ${totalEnriched}\n`;
  markdown += `- **Validate-Only Confirmations**: ${validateOnlyConfirmations}\n`;
  markdown += `- **Multi-Source Agreements**: ${multiSourceAgreements}\n`;
  markdown += `- **License Warnings**: ${licenseWarnings}\n`;
  markdown += `- **Average Confidence**: ${avgConfidence.toFixed(2)}\n\n`;
  
  // By source
  const bySource: Record<string, number> = {};
  for (const record of records) {
    const source = record.source_trace.ingest_source_used || record.source_trace.baseline;
    bySource[source] = (bySource[source] || 0) + 1;
  }
  
  markdown += `## By Source\n\n`;
  for (const [source, count] of Object.entries(bySource).sort((a, b) => b[1] - a[1])) {
    markdown += `- **${source}**: ${count}\n`;
  }
  markdown += `\n`;
  
  // Detailed records
  markdown += `## Detailed Records\n\n`;
  for (const record of records) {
    markdown += `### ${record.movie_title} (${record.movie_year})\n\n`;
    markdown += `- **Movie ID**: ${record.movie_id}\n`;
    markdown += `- **Image URL**: ${record.image_url}\n`;
    markdown += `- **Stored**: ${record.storage_decision.stored ? '✅' : '❌'} (${record.storage_decision.reason})\n\n`;
    
    markdown += `#### Source Trace\n`;
    markdown += `- **Baseline**: ${record.source_trace.baseline} (${record.source_trace.baseline_confidence.toFixed(2)})\n`;
    markdown += `- **Validate-Only Tried**: ${record.source_trace.validate_only.join(', ') || 'None'}\n`;
    markdown += `- **Validate-Only Confirmed**: ${record.source_trace.validate_only_confirmed.join(', ') || 'None'}\n`;
    markdown += `- **Ingest Sources Tried**: ${record.source_trace.ingest_sources_tried.join(', ') || 'None'}\n`;
    markdown += `- **Ingest Source Used**: ${record.source_trace.ingest_source_used || 'None'}\n`;
    markdown += `- **Agreement Count**: ${record.source_trace.agreement_count}\n\n`;
    
    markdown += `#### License Trace\n`;
    markdown += `- **Type**: ${record.license_trace.license_type}\n`;
    markdown += `- **Verified**: ${record.license_trace.license_verified ? '✅' : '❌'}\n`;
    markdown += `- **Attribution Required**: ${record.license_trace.source_requires_attribution ? 'Yes' : 'No'}\n`;
    if (record.license_trace.license_warning) {
      markdown += `- **Warning**: ${record.license_trace.license_warning}\n`;
    }
    markdown += `\n`;
    
    markdown += `#### Confidence Breakdown\n`;
    markdown += `- **Base Score**: ${record.confidence_breakdown.base_score.toFixed(2)}\n`;
    markdown += `- **Validate-Only Boost**: +${record.confidence_breakdown.validate_only_boost.toFixed(2)}\n`;
    markdown += `- **Multi-Source Boost**: +${record.confidence_breakdown.multi_source_boost.toFixed(2)}\n`;
    markdown += `- **Final Score**: ${record.confidence_breakdown.final_score.toFixed(2)}\n`;
    if (record.confidence_breakdown.ai_generated) {
      markdown += `- **AI Generated**: ⚠️ Yes (capped at 0.50)\n`;
    }
    markdown += `\n---\n\n`;
  }
  
  await writeFile(filename, markdown);
  
  return filename;
}

/**
 * Append record to audit log (for streaming)
 */
export async function appendAuditRecord(
  record: ImageAuditRecord,
  logFile: string
): Promise<void> {
  const line = JSON.stringify(record) + '\n';
  await appendFile(logFile, line);
}
