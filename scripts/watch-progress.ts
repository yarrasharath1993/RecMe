#!/usr/bin/env npx tsx
/**
 * Watch enrichment progress in real-time
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const STARTING_COUNT = 922;

async function checkProgress() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { count: remaining } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Telugu')
    .or('poster_url.is.null,poster_url.ilike.%placeholder%');
  
  const enriched = STARTING_COUNT - (remaining || 0);
  const progress = ((enriched / STARTING_COUNT) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(Number(progress) / 5)) + '░'.repeat(20 - Math.floor(Number(progress) / 5));
  
  console.clear();
  console.log('\n🎯 ENRICHMENT PROGRESS\n');
  console.log('='.repeat(60));
  console.log(`[${bar}] ${progress}%`);
  console.log('='.repeat(60));
  console.log(`Enriched:   ${enriched} movies`);
  console.log(`Remaining:  ${remaining} movies`);
  console.log(`Total:      ${STARTING_COUNT} movies`);
  console.log('='.repeat(60));
  console.log(`\n⏱️  Last updated: ${new Date().toLocaleTimeString()}`);
  console.log('\nPress Ctrl+C to stop watching\n');
}

async function watch() {
  await checkProgress();
  setInterval(checkProgress, 10000); // Update every 10 seconds
}

watch();
