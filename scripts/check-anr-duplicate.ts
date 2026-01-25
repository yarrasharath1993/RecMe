/**
 * Check ANR (Akkineni Nageswara Rao) duplicate profiles
 * Two variations: "Akkineni Nageswara Rao" vs "Nageshwara Rao Akkineni"
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkANRDuplicate() {
  console.log('\n🔍 Checking ANR duplicate profiles...\n');

  // Check for all variations of ANR name
  const nameVariations = [
    'Akkineni Nageswara Rao',
    'Akkineni Nageshwara Rao',
    'Nageswara Rao Akkineni',
    'Nageshwara Rao Akkineni',
    'A. Nageswara Rao',
    'A. Nageshwara Rao',
    'ANR',
  ];

  console.log('1️⃣  Checking all name variations in hero field:\n');

  for (const name of nameVariations) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .eq('hero', name);

    if (count && count > 0) {
      console.log(`   "${name}": ${count} movies`);
    }
  }

  console.log('\n2️⃣  Checking celebrities table:\n');

  const { data: celebs } = await supabase
    .from('celebrities')
    .select('*')
    .or('slug.eq.akkineni-nageswara-rao,slug.eq.nageshwara-rao-akkineni,slug.eq.akkineni-nageshwara-rao,slug.eq.celeb-akkineni-nageswara-rao');

  if (celebs && celebs.length > 0) {
    celebs.forEach((celeb, idx) => {
      console.log(`   ${idx + 1}. ${celeb.name_en || 'Unknown'}`);
      console.log(`      Slug: ${celeb.slug}`);
      console.log(`      Name (Telugu): ${celeb.name_te || 'NULL'}`);
      console.log(`      TMDB ID: ${celeb.tmdb_id || 'NULL'}`);
      console.log();
    });
  } else {
    console.log('   No celebrity records found\n');
  }

  console.log('3️⃣  Checking sample movies for each variation:\n');

  // Check first variation
  const { data: movies1 } = await supabase
    .from('movies')
    .select('title_en, release_year, hero')
    .eq('is_published', true)
    .ilike('hero', '%Akkineni Nageswara Rao%')
    .order('release_year', { ascending: false })
    .limit(3);

  if (movies1 && movies1.length > 0) {
    console.log('   Movies with "Akkineni Nageswara Rao":');
    movies1.forEach(m => {
      console.log(`   - ${m.title_en} (${m.release_year}) - Hero: "${m.hero}"`);
    });
  }

  // Check second variation
  const { data: movies2 } = await supabase
    .from('movies')
    .select('title_en, release_year, hero')
    .eq('is_published', true)
    .ilike('hero', '%Nageshwara Rao Akkineni%')
    .order('release_year', { ascending: false })
    .limit(3);

  if (movies2 && movies2.length > 0) {
    console.log('\n   Movies with "Nageshwara Rao Akkineni":');
    movies2.forEach(m => {
      console.log(`   - ${m.title_en} (${m.release_year}) - Hero: "${m.hero}"`);
    });
  }

  console.log('\n4️⃣  Summary:\n');
  
  const { count: total1 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .ilike('hero', '%Akkineni Nageswara Rao%');

  const { count: total2 } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .ilike('hero', '%Nageshwara Rao Akkineni%');

  console.log(`   "Akkineni Nageswara/Nageshwara Rao": ${total1 || 0} movies`);
  console.log(`   "Nageswara/Nageshwara Rao Akkineni": ${total2 || 0} movies`);
  console.log(`   Total: ${(total1 || 0) + (total2 || 0)} movies across 2 profiles`);

  console.log('\n💡 ISSUE: Same person with name in different order!');
  console.log('   - First name first: "Akkineni Nageswara Rao"');
  console.log('   - Last name first: "Nageshwara Rao Akkineni"');
  console.log('   - Both refer to legendary actor ANR');
  
  console.log('\n📝 Recommendation:');
  console.log('   - Standard: Use "Akkineni Nageswara Rao" (First name first)');
  console.log('   - This matches celebrity records and common usage');
  console.log('   - Merge all variations into this master name');

  console.log('\n' + '='.repeat(60));
}

checkANRDuplicate().catch(console.error);
