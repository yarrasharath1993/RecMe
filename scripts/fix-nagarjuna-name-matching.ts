#!/usr/bin/env npx tsx
/**
 * Fix Nagarjuna Name Matching
 * 
 * The movies exist in the database but the celebrity profile name
 * might not exactly match the movie field names.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const NAGARJUNA_ID = '7ea66985-c6f8-4f52-a51b-1dc9fd3f184d';

async function fixNagarjunaNameMatching() {
  console.log('🔧 Fixing Nagarjuna Name Matching\n');
  console.log('='.repeat(80));

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('id', NAGARJUNA_ID)
    .single();

  if (profileError || !profile) {
    console.error('❌ Profile not found');
    return;
  }

  console.log('📋 Current Profile:\n');
  console.log(`   Name (name_en): "${profile.name_en}"`);
  console.log(`   Name (name): "${profile.name || 'N/A'}"`);
  console.log(`   Slug: ${profile.slug}`);

  // Check what name formats exist in movies
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Checking name formats in movies...\n');

  const nameVariations = [
    'Nagarjuna',
    'Akkineni Nagarjuna',
    'Nag',
    'Nagarjuna Akkineni',
  ];

  const results = [];

  for (const name of nameVariations) {
    // Check as hero
    const { data: heroMovies, count: heroCount } = await supabase
      .from('movies')
      .select('id, title_en, release_year', { count: 'exact' })
      .eq('is_published', true)
      .eq('hero', name)
      .order('release_year', { ascending: false })
      .limit(5);

    // Check with OR across all fields
    const { count: totalCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(`hero.eq.${name},heroine.eq.${name},director.eq.${name},producer.eq.${name}`);

    if (heroCount || totalCount) {
      results.push({ name, heroCount: heroCount || 0, totalCount: totalCount || 0, sampleMovies: heroMovies || [] });
      console.log(`   "${name}":`);
      console.log(`      As Hero: ${heroCount || 0} movies`);
      console.log(`      Total (all roles): ${totalCount || 0} movies`);
      
      if (heroMovies && heroMovies.length > 0) {
        console.log(`      Sample movies:`);
        heroMovies.forEach((movie: any) => {
          console.log(`      - ${movie.title_en} (${movie.release_year})`);
        });
      }
      console.log('');
    }
  }

  // Find the best matching name
  const bestMatch = results.reduce((best, current) => {
    return current.heroCount > best.heroCount ? current : best;
  }, results[0] || { name: profile.name_en, heroCount: 0 });

  console.log('\n' + '='.repeat(80));
  console.log('💡 Recommendation:\n');

  if (bestMatch.heroCount > 0) {
    console.log(`   Best matching name in movies: "${bestMatch.name}"`);
    console.log(`   Movies as hero: ${bestMatch.heroCount}`);
    console.log(`   Total movies: ${bestMatch.totalCount}`);

    if (profile.name_en !== bestMatch.name) {
      console.log(`\n   ⚠️  Profile name "${profile.name_en}" doesn't match best format!`);
      console.log(`   ✅ Should update to: "${bestMatch.name}"`);
      
      console.log('\n📋 Updating profile name...\n');

      const { error: updateError } = await supabase
        .from('celebrities')
        .update({
          name_en: bestMatch.name,
          name: bestMatch.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', NAGARJUNA_ID);

      if (updateError) {
        console.error('   ❌ Error updating:', updateError.message);
      } else {
        console.log('   ✅ Profile updated successfully!');
        console.log(`   New name_en: "${bestMatch.name}"`);
      }
    } else {
      console.log(`\n   ✅ Profile name already matches movies!`);
    }
  } else {
    console.log('   ⚠️  No movies found with any name variation');
  }

  // Test the API would work now
  console.log('\n' + '='.repeat(80));
  console.log('🧪 Testing API query simulation...\n');

  const testName = bestMatch.name || profile.name_en;
  const { data: testMovies, error: testError, count } = await supabase
    .from('movies')
    .select('id, title_en', { count: 'exact' })
    .eq('is_published', true)
    .eq('language', 'Telugu')
    .or(`hero.eq.${testName},heroine.eq.${testName},director.eq.${testName},music_director.eq.${testName},producer.eq.${testName},writer.eq.${testName}`)
    .limit(10);

  if (testError) {
    console.error('   ❌ API query simulation failed:', testError.message);
  } else {
    console.log(`   ✅ API query would return: ${count || 0} movies`);
    if (testMovies && testMovies.length > 0) {
      console.log('   Sample results:');
      testMovies.forEach((movie: any) => {
        console.log(`   - ${movie.title_en}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Fix complete!\n');
  console.log('Next steps:');
  console.log('1. Test URL: http://localhost:3000/movies?profile=nagarjuna');
  console.log('2. Verify movies are now showing');
  console.log('3. Check other profiles that might have same issue\n');
}

fixNagarjunaNameMatching().catch(console.error);
