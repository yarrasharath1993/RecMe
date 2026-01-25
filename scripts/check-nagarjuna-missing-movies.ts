#!/usr/bin/env npx tsx
/**
 * Check what movies Nagarjuna is missing from his profile
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingMovies() {
  console.log('🔍 Checking Nagarjuna Missing Movies\n');
  console.log('='.repeat(80));

  const personName = 'Akkineni Nagarjuna';

  // Current query (what profile API does)
  const { data: currentMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, language, is_published')
    .eq('is_published', true)
    .eq('language', 'Telugu') // Problem 1: Filters out other languages
    .or(`hero.eq.${personName},heroine.eq.${personName},director.eq.${personName}`)
    .order('release_year', { ascending: false });

  console.log(`\n📊 Current Query (Profile API):`);
  console.log(`   Total: ${currentMovies?.length || 0} movies`);
  console.log(`   Language filter: Telugu only`);
  console.log(`   Name match: Exact (hero.eq.${personName})`);

  // Better query 1: Remove language filter
  const { data: allLanguagesMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, language, is_published')
    .eq('is_published', true)
    // No language filter!
    .or(`hero.eq.${personName},heroine.eq.${personName},director.eq.${personName}`)
    .order('release_year', { ascending: false });

  console.log(`\n📊 Query Without Language Filter:`);
  console.log(`   Total: ${allLanguagesMovies?.length || 0} movies`);
  console.log(`   Difference: +${(allLanguagesMovies?.length || 0) - (currentMovies?.length || 0)} movies`);

  // Show non-Telugu movies
  const nonTeluguMovies = allLanguagesMovies?.filter(m => m.language !== 'Telugu') || [];
  if (nonTeluguMovies.length > 0) {
    console.log(`\n   Non-Telugu movies found:`);
    nonTeluguMovies.forEach(m => {
      console.log(`     - ${m.title_en} (${m.language})`);
    });
  }

  // Better query 2: Use ilike for multi-cast
  const { data: multiCastMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, language, is_published')
    .eq('is_published', true)
    // .eq('language', 'Telugu')
    .or(`hero.ilike.%${personName}%,heroine.ilike.%${personName}%,director.ilike.%${personName}%`)
    .order('release_year', { ascending: false });

  console.log(`\n📊 Query With Partial Match (ilike):`);
  console.log(`   Total: ${multiCastMovies?.length || 0} movies`);
  console.log(`   Difference from current: +${(multiCastMovies?.length || 0) - (currentMovies?.length || 0)} movies`);

  // Find multi-cast movies
  const currentIds = new Set(currentMovies?.map(m => m.id) || []);
  const additionalMovies = multiCastMovies?.filter(m => !currentIds.has(m.id)) || [];
  
  if (additionalMovies.length > 0) {
    console.log(`\n   Additional movies found (multi-cast or other languages):`);
    additionalMovies.forEach(m => {
      console.log(`     - ${m.title_en}`);
      console.log(`       Hero: ${m.hero}`);
      console.log(`       Language: ${m.language}`);
    });
  }

  // Check name variations
  const { data: nameVariationMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, language, is_published')
    .eq('is_published', true)
    .or(`hero.ilike.%nagarjuna%,heroine.ilike.%nagarjuna%`)
    .order('release_year', { ascending: false });

  console.log(`\n📊 Query With Name Variation (any "nagarjuna"):`);
  console.log(`   Total: ${nameVariationMovies?.length || 0} movies`);

  const variationIds = new Set(multiCastMovies?.map(m => m.id) || []);
  const moreMovies = nameVariationMovies?.filter(m => !variationIds.has(m.id)) || [];
  
  if (moreMovies.length > 0) {
    console.log(`\n   Movies with name variations:`);
    moreMovies.forEach(m => {
      console.log(`     - ${m.title_en}`);
      console.log(`       Hero: ${m.hero}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Summary:\n');
  console.log(`   Current Profile API: ${currentMovies?.length || 0} movies`);
  console.log(`   Should Show: ${nameVariationMovies?.length || 0} movies`);
  console.log(`   Missing: ${(nameVariationMovies?.length || 0) - (currentMovies?.length || 0)} movies\n`);

  console.log('📝 Required Fixes:\n');
  console.log('   1. Remove language filter (show all languages)');
  console.log('   2. Use ilike instead of eq (catch multi-cast)');
  console.log('   3. Handle name variations ("Nagarjuna Akkineni")\n');
}

checkMissingMovies().catch(console.error);
