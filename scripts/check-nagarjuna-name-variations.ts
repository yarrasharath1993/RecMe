#!/usr/bin/env npx tsx
/**
 * Check Nagarjuna Name Variations in Movies Table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNameVariations() {
  console.log('🔍 Checking Nagarjuna Name Variations\n');
  console.log('='.repeat(80));

  // Check celebrities table
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, is_published')
    .ilike('name_en', '%nagarjuna%')
    .not('name_en', 'ilike', '%balakrishna%');

  console.log('\n📋 Nagarjuna Profiles in Celebrities Table:\n');
  celebrities?.forEach(c => {
    console.log(`  ${c.name_en}`);
    console.log(`    Slug: ${c.slug}`);
    console.log(`    Published: ${c.is_published ? '✅' : '❌'}`);
    console.log();
  });

  // Check movies table - all name variations
  const { data: heroMovies } = await supabase
    .from('movies')
    .select('hero')
    .ilike('hero', '%nagarjuna%')
    .not('hero', 'ilike', '%balakrishna%')
    .eq('is_published', true);

  const nameVariations = new Map<string, number>();
  heroMovies?.forEach(m => {
    if (m.hero) {
      nameVariations.set(m.hero, (nameVariations.get(m.hero) || 0) + 1);
    }
  });

  console.log('📋 Nagarjuna Name Variations in Movies (hero field):\n');
  const sortedVariations = Array.from(nameVariations.entries())
    .sort((a, b) => b[1] - a[1]);

  sortedVariations.forEach(([name, count]) => {
    console.log(`  "${name}": ${count} movies`);
  });

  console.log(`\n  Total unique variations: ${nameVariations.size}`);
  console.log(`  Total movies: ${heroMovies?.length}`);

  // Check heroine field too
  const { data: heroineMovies } = await supabase
    .from('movies')
    .select('heroine')
    .ilike('heroine', '%nagarjuna%')
    .not('heroine', 'ilike', '%balakrishna%')
    .eq('is_published', true);

  console.log(`  As heroine: ${heroineMovies?.length || 0} movies`);

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Issue: Different name variations are not being normalized!');
  console.log('   Need fuzzy name matching to handle word order variations.\n');

  // Show what the canonical name should be
  const primary = celebrities?.find(c => c.slug === 'nagarjuna');
  if (primary) {
    console.log(`📌 Canonical Celebrity Name: "${primary.name_en}"`);
    console.log(`   All variations should map to this name\n`);
  }
}

checkNameVariations().catch(console.error);
