#!/usr/bin/env npx tsx
/**
 * Analyze Krishna Name Variations
 * 
 * Check how Krishna's name appears in movies table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeKrishnaNames() {
  console.log('🔍 Analyzing Krishna Name Variations\n');
  console.log('='.repeat(80));

  // Check celebrities table
  const { data: profiles } = await supabase
    .from('celebrities')
    .select('id, name_en, slug')
    .ilike('name_en', '%krishna%')
    .order('name_en');

  console.log('\n📋 Krishna Profiles in Celebrities Table:\n');
  profiles?.forEach(p => {
    console.log(`  ${p.name_en} (slug: ${p.slug})`);
  });

  // Check movies table - hero field
  const { data: heroMovies } = await supabase
    .from('movies')
    .select('hero')
    .ilike('hero', '%krishna%')
    .not('hero', 'is', null);

  const heroNames = new Set<string>();
  heroMovies?.forEach(m => {
    if (m.hero) heroNames.add(m.hero);
  });

  console.log('\n📋 Krishna Name Variations in Movies (hero field):\n');
  const heroNameCounts = new Map<string, number>();
  heroMovies?.forEach(m => {
    if (m.hero) {
      heroNameCounts.set(m.hero, (heroNameCounts.get(m.hero) || 0) + 1);
    }
  });

  const sortedHeroNames = Array.from(heroNameCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  sortedHeroNames.forEach(([name, count]) => {
    console.log(`  ${name}: ${count} movies`);
  });

  console.log(`\n  Total unique name variations: ${heroNames.size}`);
  console.log(`  Total movies with Krishna as hero: ${heroMovies?.length}`);

  // Check specific Krishna profile
  const { data: krishna } = await supabase
    .from('celebrities')
    .select('id, name_en, slug')
    .eq('slug', 'krishna')
    .single();

  if (krishna) {
    console.log('\n📋 Primary Krishna Profile:\n');
    console.log(`  Name: ${krishna.name_en}`);
    console.log(`  Slug: ${krishna.slug}`);

    // Count movies with exact name match
    const { count: exactCount } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('hero', krishna.name_en)
      .eq('is_published', true);

    console.log(`  Movies with exact name "${krishna.name_en}": ${exactCount}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 Issue: Multiple name variations are being counted separately in search!');
  console.log('   Need to normalize all variations to the canonical celebrity name.\n');
}

analyzeKrishnaNames().catch(console.error);
