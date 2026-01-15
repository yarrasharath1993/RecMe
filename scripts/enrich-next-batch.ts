#!/usr/bin/env npx tsx
/**
 * ENRICH NEXT BATCH
 * 
 * Runs ONE batch of enrichment and shows progress
 * Run multiple times to process all movies
 * 
 * Usage:
 *   npx tsx scripts/enrich-next-batch.ts [batch-size]
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { execSync } from 'child_process';

config({ path: resolve(process.cwd(), '.env.local') });

const BATCH_SIZE = parseInt(process.argv[2]) || 50;

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Check remaining movies
  const { count: remaining } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Telugu')
    .or('poster_url.is.null,poster_url.ilike.%placeholder%');
  
  console.log('\n🎯 ENRICHMENT STATUS');
  console.log('='.repeat(70));
  console.log(`📦 Movies needing posters: ${remaining}`);
  console.log(`📊 Batch size: ${BATCH_SIZE}`);
  console.log(`📈 Estimated batches remaining: ${Math.ceil(remaining! / BATCH_SIZE)}`);
  console.log('='.repeat(70));
  
  if (remaining === 0) {
    console.log('\n✅ All movies have posters! Nothing to enrich.\n');
    return;
  }
  
  console.log(`\n🚀 Processing next ${BATCH_SIZE} movies...\n`);
  
  const startTime = Date.now();
  
  try {
    execSync(
      `npx tsx scripts/enrich-waterfall.ts --placeholders-only --limit=${BATCH_SIZE} --execute --audit`,
      { 
        encoding: 'utf-8',
        stdio: 'inherit',
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    
    const duration = Date.now() - startTime;
    
    // Check new remaining count
    const { count: newRemaining } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('language', 'Telugu')
      .or('poster_url.is.null,poster_url.ilike.%placeholder%');
    
    const enriched = remaining! - newRemaining!;
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 BATCH COMPLETE');
    console.log('='.repeat(70));
    console.log(`✅ Enriched: ${enriched}`);
    console.log(`📦 Remaining: ${newRemaining}`);
    console.log(`⏱️  Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`🎯 Progress: ${(((remaining! - newRemaining!) / remaining!) * 100).toFixed(1)}% of batch`);
    console.log(`📈 Overall: ${Math.ceil(newRemaining! / BATCH_SIZE)} batches remaining`);
    console.log('='.repeat(70));
    
    if (newRemaining! > 0) {
      console.log(`\n💡 Run again to process next ${Math.min(BATCH_SIZE, newRemaining!)} movies:`);
      console.log(`   npx tsx scripts/enrich-next-batch.ts ${BATCH_SIZE}\n`);
    } else {
      console.log('\n🎉 All movies enriched! Great job!\n');
    }
    
  } catch (error) {
    console.error('\n❌ Batch failed:', (error as Error).message);
    process.exit(1);
  }
}

main().catch(console.error);
