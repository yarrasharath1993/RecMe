/**
 * Check for duplicate Nithin/Nithiin profiles
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkNithinProfiles() {
  console.log('\n🔍 Checking for Nithin duplicate profiles...\n');

  // Check celebrities table
  console.log('1️⃣  Checking celebrities table:\n');
  
  const { data: celebs } = await supabase
    .from('celebrities')
    .select('*')
    .or('slug.eq.nithin,slug.eq.nithiin,slug.eq.celeb-nithin,slug.eq.celeb-nithiin');

  if (celebs && celebs.length > 0) {
    celebs.forEach((celeb, idx) => {
      console.log(`   ${idx + 1}. ${celeb.name_en || 'Unknown'}`);
      console.log(`      Slug: ${celeb.slug}`);
      console.log(`      Name (Telugu): ${celeb.name_te || 'NULL'}`);
      console.log(`      Primary Role: ${celeb.primary_role || 'NULL'}`);
      console.log(`      TMDB ID: ${celeb.tmdb_id || 'NULL'}`);
      console.log();
    });
  } else {
    console.log('   No celebrity records found\n');
  }

  // Check movies for "Nithin" spelling
  console.log('2️⃣  Checking movies with "Nithin" as hero:\n');
  
  const { data: nithinMovies } = await supabase
    .from('movies')
    .select('title_en, release_year, hero')
    .eq('is_published', true)
    .eq('hero', 'Nithin')
    .order('release_year', { ascending: false })
    .limit(5);

  if (nithinMovies && nithinMovies.length > 0) {
    console.log(`   Found ${nithinMovies.length} movies with hero="Nithin":`);
    nithinMovies.forEach(m => {
      console.log(`   - ${m.title_en} (${m.release_year})`);
    });
  } else {
    console.log('   No movies found with exact hero="Nithin"');
  }

  // Check movies for "Nithiin" spelling
  console.log('\n3️⃣  Checking movies with "Nithiin" as hero:\n');
  
  const { data: nithiinMovies } = await supabase
    .from('movies')
    .select('title_en, release_year, hero')
    .eq('is_published', true)
    .eq('hero', 'Nithiin')
    .order('release_year', { ascending: false })
    .limit(5);

  if (nithiinMovies && nithiinMovies.length > 0) {
    console.log(`   Found ${nithiinMovies.length} movies with hero="Nithiin":`);
    nithiinMovies.forEach(m => {
      console.log(`   - ${m.title_en} (${m.release_year})`);
    });
  } else {
    console.log('   No movies found with exact hero="Nithiin"');
  }

  // Check for variations
  console.log('\n4️⃣  Checking all hero name variations:\n');
  
  const { data: allVariations } = await supabase
    .from('movies')
    .select('hero')
    .eq('is_published', true)
    .ilike('hero', '%nithi%')
    .limit(100);

  if (allVariations) {
    const uniqueNames = new Set(allVariations.map(m => m.hero).filter(Boolean));
    console.log('   Unique hero names containing "nithi":');
    Array.from(uniqueNames).sort().forEach(name => {
      console.log(`   - "${name}"`);
    });
  }

  // Count movies for each spelling
  console.log('\n5️⃣  Movie counts:\n');
  
  const { count: nithinCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('hero', 'Nithin');

  const { count: nithiinCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('hero', 'Nithiin');

  console.log(`   Movies with "Nithin": ${nithinCount || 0}`);
  console.log(`   Movies with "Nithiin": ${nithiinCount || 0}`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Investigation complete\n');
}

checkNithinProfiles().catch(console.error);
