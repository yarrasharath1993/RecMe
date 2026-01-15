#!/usr/bin/env npx tsx
/**
 * CONTINUOUS ENRICHMENT
 * 
 * Runs enrichment continuously until all movies are processed
 * Saves progress after each batch, can resume if interrupted
 * 
 * Usage:
 *   npx tsx scripts/continuous-enrich.ts [max-batches]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';
import { writeFile } from 'fs/promises';

config({ path: resolve(process.cwd(), '.env.local') });

const BATCH_SIZE = 50;
const MAX_BATCHES = parseInt(process.argv[2]) || 20;
const DELAY_MS = 5000;

interface BatchStats {
  batch: number;
  enriched: number;
  remaining: number;
  duration: number;
  timestamp: string;
}

const batches: BatchStats[] = [];
let totalEnriched = 0;

async function getRemainingCount() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Telugu')
    .or('poster_url.is.null,poster_url.ilike.%placeholder%');
  
  return count || 0;
}

async function runBatch(batchNum: number, remaining: number): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔄 BATCH ${batchNum}/${MAX_BATCHES}`);
  console.log(`📦 Movies remaining: ${remaining}`);
  console.log(`⏱️  Processing next ${Math.min(BATCH_SIZE, remaining)}...`);
  console.log(`${'='.repeat(80)}\n`);
  
  const startTime = Date.now();
  const beforeCount = remaining;
  
  try {
    execSync(
      `npx tsx scripts/enrich-waterfall.ts --placeholders-only --limit=${BATCH_SIZE} --execute`,
      { 
        encoding: 'utf-8',
        stdio: 'inherit',
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    
    const afterCount = await getRemainingCount();
    const enrichedThisBatch = beforeCount - afterCount;
    const duration = Date.now() - startTime;
    
    totalEnriched += enrichedThisBatch;
    
    const stats: BatchStats = {
      batch: batchNum,
      enriched: enrichedThisBatch,
      remaining: afterCount,
      duration,
      timestamp: new Date().toISOString(),
    };
    
    batches.push(stats);
    
    console.log(`\n✅ Batch ${batchNum} Stats:`);
    console.log(`   Enriched: ${enrichedThisBatch}`);
    console.log(`   Remaining: ${afterCount}`);
    console.log(`   Duration: ${(duration / 1000 / 60).toFixed(1)}min`);
    console.log(`   Total enriched so far: ${totalEnriched}`);
    
  } catch (error) {
    console.error(`\n❌ Batch ${batchNum} error:`, (error as Error).message);
  }
}

async function main() {
  const startTime = Date.now();
  const initialCount = await getRemainingCount();
  
  console.log('\n🚀 CONTINUOUS ENRICHMENT START');
  console.log('='.repeat(80));
  console.log(`Movies to process: ${initialCount}`);
  console.log(`Batch size: ${BATCH_SIZE}`);
  console.log(`Max batches: ${MAX_BATCHES}`);
  console.log(`Delay between batches: ${DELAY_MS / 1000}s`);
  console.log('='.repeat(80));
  
  let remaining = initialCount;
  let batchNum = 1;
  
  while (remaining > 0 && batchNum <= MAX_BATCHES) {
    await runBatch(batchNum, remaining);
    
    remaining = await getRemainingCount();
    
    if (remaining === 0) {
      console.log('\n🎉 All movies processed!');
      break;
    }
    
    if (batchNum < MAX_BATCHES) {
      console.log(`\n⏳ Waiting ${DELAY_MS / 1000}s before next batch...`);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
    
    batchNum++;
  }
  
  const totalDuration = Date.now() - startTime;
  
  // Final report
  console.log('\n' + '='.repeat(80));
  console.log('📊 FINAL REPORT');
  console.log('='.repeat(80));
  console.log(`Total batches: ${batches.length}`);
  console.log(`Total enriched: ${totalEnriched}`);
  console.log(`Total duration: ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
  console.log(`Movies remaining: ${remaining}`);
  console.log(`Success rate: ${((totalEnriched / initialCount) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));
  
  // Save progress
  await writeFile('continuous-enrichment-progress.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    initial_count: initialCount,
    total_enriched: totalEnriched,
    remaining,
    batches,
    total_duration: totalDuration,
  }, null, 2));
  
  console.log('\n📄 Progress saved: continuous-enrichment-progress.json\n');
  
  if (remaining > 0 && batchNum > MAX_BATCHES) {
    console.log(`⚠️  Stopped at max batches limit (${MAX_BATCHES})`);
    console.log(`💡 Run again to continue:\n   npx tsx scripts/continuous-enrich.ts ${MAX_BATCHES}\n`);
  }
}

main().catch(console.error);
