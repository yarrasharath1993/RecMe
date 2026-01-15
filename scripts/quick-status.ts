#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Telugu')
    .or('poster_url.is.null,poster_url.ilike.%placeholder%');
  
  const enriched = 922 - (count || 0);
  const pct = ((enriched / 922) * 100).toFixed(1);
  
  console.log('\n🎯 ENRICHMENT STATUS\n');
  console.log('='.repeat(60));
  console.log(`Starting:   922 movies`);
  console.log(`Enriched:   ${enriched} movies (${pct}%)`);
  console.log(`Remaining:  ${count} movies`);
  console.log('='.repeat(60));
  console.log(`\n${count === 0 ? '🎉 COMPLETE!' : '🔄 In Progress'}\n`);
}

check();
