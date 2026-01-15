#!/usr/bin/env npx tsx
/**
 * BATCH ENRICHMENT - ALL MOVIES
 * 
 * Processes all movies needing posters in batches of 50
 * Tracks progress, logs results, handles errors gracefully
 * 
 * Usage:
 *   npx tsx scripts/batch-enrich-all.ts
 */

import { execSync } from 'child_process';
import { writeFile, appendFile } from 'fs/promises';
import { existsSync } from 'fs';

const BATCH_SIZE = 50;
const MAX_BATCHES = 999; // Safety limit
const DELAY_BETWEEN_BATCHES = 5000; // 5 seconds

interface BatchResult {
  batch: number;
  processed: number;
  enriched: number;
  failed: number;
  duration: number;
  timestamp: string;
}

const results: BatchResult[] = [];
let totalProcessed = 0;
let totalEnriched = 0;
let totalFailed = 0;

async function runBatch(batchNumber: number): Promise<BatchResult> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔄 BATCH ${batchNumber} - Processing ${BATCH_SIZE} movies`);
  console.log(`${'='.repeat(70)}\n`);
  
  const startTime = Date.now();
  
  try {
    const output = execSync(
      `npx tsx scripts/enrich-waterfall.ts --placeholders-only --limit=${BATCH_SIZE} --execute --audit`,
      { 
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
        timeout: 300000, // 5 minutes per batch
      }
    );
    
    // Parse output for statistics
    const processedMatch = output.match(/Processed:\s+(\d+)/);
    const enrichedMatch = output.match(/Enriched:\s+(\d+)/);
    
    const processed = processedMatch ? parseInt(processedMatch[1]) : 0;
    const enriched = enrichedMatch ? parseInt(enrichedMatch[1]) : 0;
    const failed = processed - enriched;
    
    const duration = Date.now() - startTime;
    
    const result: BatchResult = {
      batch: batchNumber,
      processed,
      enriched,
      failed,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    results.push(result);
    totalProcessed += processed;
    totalEnriched += enriched;
    totalFailed += failed;
    
    console.log(`\n✅ Batch ${batchNumber} Complete:`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Enriched: ${enriched}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(1)}s`);
    
    // Save progress
    await saveProgress();
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`\n❌ Batch ${batchNumber} Failed:`, (error as Error).message);
    
    const result: BatchResult = {
      batch: batchNumber,
      processed: 0,
      enriched: 0,
      failed: BATCH_SIZE,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    results.push(result);
    totalFailed += BATCH_SIZE;
    
    await saveProgress();
    
    return result;
  }
}

async function saveProgress() {
  const report = {
    timestamp: new Date().toISOString(),
    totalBatches: results.length,
    totalProcessed,
    totalEnriched,
    totalFailed,
    successRate: totalProcessed > 0 ? ((totalEnriched / totalProcessed) * 100).toFixed(1) : 0,
    batches: results,
  };
  
  await writeFile(
    'batch-enrichment-progress.json',
    JSON.stringify(report, null, 2)
  );
}

async function generateFinalReport() {
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = totalDuration / results.length;
  
  const report = `
# Batch Enrichment Final Report

**Date**: ${new Date().toISOString()}

## Summary

- **Total Batches**: ${results.length}
- **Total Processed**: ${totalProcessed}
- **Total Enriched**: ${totalEnriched}
- **Total Failed**: ${totalFailed}
- **Success Rate**: ${((totalEnriched / totalProcessed) * 100).toFixed(1)}%
- **Total Duration**: ${(totalDuration / 1000 / 60).toFixed(1)} minutes
- **Average Batch Duration**: ${(avgDuration / 1000).toFixed(1)} seconds

## Batch Details

| Batch | Processed | Enriched | Failed | Duration (s) | Success % |
|-------|-----------|----------|--------|--------------|-----------|
${results.map(r => 
  `| ${r.batch} | ${r.processed} | ${r.enriched} | ${r.failed} | ${(r.duration / 1000).toFixed(1)} | ${r.processed > 0 ? ((r.enriched / r.processed) * 100).toFixed(1) : 0}% |`
).join('\n')}

## Performance

- **Movies per minute**: ${(totalProcessed / (totalDuration / 1000 / 60)).toFixed(1)}
- **Average time per movie**: ${(totalDuration / totalProcessed / 1000).toFixed(2)}s
- **Total API calls**: ~${totalProcessed * 3}

## Conclusion

${totalEnriched > 0 ? '✅ Batch enrichment completed successfully!' : '❌ Enrichment encountered errors'}

**Status**: ${((totalEnriched / totalProcessed) * 100) >= 80 ? 'SUCCESS' : 'PARTIAL'}
`;
  
  await writeFile('BATCH-ENRICHMENT-FINAL-REPORT.md', report);
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Processed: ${totalProcessed}`);
  console.log(`Total Enriched: ${totalEnriched} (${((totalEnriched / totalProcessed) * 100).toFixed(1)}%)`);
  console.log(`Total Failed: ${totalFailed}`);
  console.log(`Total Duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
  console.log('='.repeat(70));
  console.log('\n📄 Report saved: BATCH-ENRICHMENT-FINAL-REPORT.md');
  console.log('📄 Progress saved: batch-enrichment-progress.json\n');
}

async function main() {
  console.log('\n🚀 BATCH ENRICHMENT - ALL MOVIES');
  console.log('='.repeat(70));
  console.log(`Batch size: ${BATCH_SIZE} movies`);
  console.log(`Delay between batches: ${DELAY_BETWEEN_BATCHES / 1000}s`);
  console.log(`Max batches: ${MAX_BATCHES}`);
  console.log('='.repeat(70));
  
  let batchNumber = 1;
  let hasMore = true;
  
  while (hasMore && batchNumber <= MAX_BATCHES) {
    const result = await runBatch(batchNumber);
    
    // Stop if we processed less than batch size (no more movies)
    if (result.processed < BATCH_SIZE) {
      console.log(`\n✅ All movies processed! (Batch ${batchNumber} had only ${result.processed} movies)`);
      hasMore = false;
    } else {
      console.log(`\n⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
      batchNumber++;
    }
  }
  
  await generateFinalReport();
  
  console.log('\n🎉 BATCH ENRICHMENT COMPLETE!\n');
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  saveProgress().then(() => process.exit(1));
});
