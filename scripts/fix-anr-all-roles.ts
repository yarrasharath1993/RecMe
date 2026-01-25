/**
 * Fix ANR name in ALL roles (not just hero)
 * Also fix heroine and producer fields
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixANRAllRoles() {
  console.log('\n🔧 Fixing ANR name in ALL roles...\n');

  const masterName = 'Akkineni Nageswara Rao';
  const wrongName = 'Nageshwara Rao Akkineni';

  // Check all fields where this wrong name might appear
  const fields = ['hero', 'heroine', 'director', 'producer', 'music_director', 'writer'];
  
  let totalFixed = 0;

  for (const field of fields) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq(field, wrongName);

    if (!count || count === 0) {
      continue;
    }

    console.log(`🔄 Fixing ${field}: ${count} movies`);

    // Get sample movies
    const { data: samples } = await supabase
      .from('movies')
      .select('title_en, release_year')
      .eq(field, wrongName)
      .limit(3);

    if (samples) {
      samples.forEach(m => {
        console.log(`   - ${m.title_en} (${m.release_year})`);
      });
    }

    // Update
    const { error } = await supabase
      .from('movies')
      .update({ [field]: masterName })
      .eq(field, wrongName);

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      continue;
    }

    totalFixed += count;
    console.log(`   ✅ Fixed ${count} movies\n`);
  }

  console.log('=' .repeat(60));
  console.log('📊 RESULTS:');
  console.log('=' .repeat(60));
  console.log(`\nTotal movies fixed across all roles: ${totalFixed}`);
  console.log('\n✅ All ANR name variations unified!');
  console.log('\nCorrect profile:');
  console.log('   ✅ http://localhost:3000/movies?profile=akkineni-nageswara-rao');
  console.log('      (Complete filmography)');
  console.log('\nIncorrect profile:');
  console.log('   ❌ http://localhost:3000/movies?profile=nageshwara-rao-akkineni');
  console.log('      (Should now be empty or minimal)');

  console.log('\n' + '='.repeat(60));
}

fixANRAllRoles().catch(console.error);
