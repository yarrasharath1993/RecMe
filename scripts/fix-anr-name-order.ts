/**
 * Fix ANR name order variations
 * Merge all variations into "Akkineni Nageswara Rao" (master name)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixANRNames() {
  console.log('\n🔧 Fixing ANR name variations...\n');

  const masterName = 'Akkineni Nageswara Rao';
  const variations = [
    'Nageshwara Rao Akkineni',  // Last name first
    'A. Nageswara Rao',          // Abbreviated
    'ANR',                        // Acronym
  ];

  console.log(`Master name: "${masterName}"`);
  console.log('Celebrity record: akkineni-nageswara-rao\n');

  let totalFixed = 0;

  for (const variation of variations) {
    // Count movies
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('hero', variation);

    if (!count || count === 0) {
      console.log(`✓ "${variation}": No movies found (already fixed)`);
      continue;
    }

    console.log(`🔄 Merging "${variation}": ${count} movies`);

    // Update movies
    const { error } = await supabase
      .from('movies')
      .update({ hero: masterName })
      .eq('hero', variation);

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      continue;
    }

    totalFixed += count;
    console.log(`   ✅ Fixed ${count} movies\n`);
  }

  // Verify final count
  const { count: finalCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('hero', masterName);

  console.log('=' .repeat(60));
  console.log('📊 RESULTS:');
  console.log('=' .repeat(60));
  console.log(`\nMovies merged: ${totalFixed}`);
  console.log(`Total movies for "${masterName}": ${finalCount || 0}`);
  console.log('\n✅ ANR profile unified!');
  console.log('\nProfiles:');
  console.log('   ✅ http://localhost:3000/movies?profile=akkineni-nageswara-rao');
  console.log('      (Should show all ~236 movies)');
  console.log('\n   ❌ http://localhost:3000/movies?profile=nageshwara-rao-akkineni');
  console.log('      (Should now be empty or redirect)');

  console.log('\n' + '='.repeat(60));
}

fixANRNames().catch(console.error);
