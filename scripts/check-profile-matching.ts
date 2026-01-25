/**
 * Check Profile Matching Issue
 * Debug why "teja" slug matches wrong person
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeSlugForSearch(slug: string): string {
  return `%${slug.replace(/-/g, '%')}%`;
}

async function testProfileMatching(slug: string) {
  console.log(`\n🔍 Testing profile matching for slug: "${slug}"\n`);

  // Check celebrities table
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', slug)
    .single();

  if (celebrity) {
    console.log('✅ Found in celebrities table:');
    console.log('  Name:', celebrity.name || celebrity.name_en);
    console.log('  Slug:', celebrity.slug);
    console.log('  Primary Role:', celebrity.primary_role);
    return;
  }

  console.log('❌ Not found in celebrities table');
  console.log('\n🔍 Searching in movies...\n');

  // Search movies
  const searchPattern = normalizeSlugForSearch(slug);
  console.log('Search pattern:', searchPattern);

  const { data: sampleMovies } = await supabase
    .from('movies')
    .select('hero, heroine, director, music_director, producer, writer, title_en, release_year')
    .eq('is_published', true)
    .or(`hero.ilike.${searchPattern},heroine.ilike.${searchPattern},director.ilike.${searchPattern},music_director.ilike.${searchPattern},producer.ilike.${searchPattern},writer.ilike.${searchPattern}`)
    .limit(10);

  if (!sampleMovies || sampleMovies.length === 0) {
    console.log('❌ No movies found matching pattern');
    return;
  }

  console.log(`✅ Found ${sampleMovies.length} sample movies\n`);

  // Test matching logic
  const fields = ['director', 'hero', 'heroine', 'music_director', 'producer', 'writer'];
  const slugNormalized = slug.toLowerCase().replace(/-/g, '');
  
  console.log(`Normalized slug: "${slugNormalized}"\n`);

  const matches: Record<string, Set<string>> = {
    director: new Set(),
    hero: new Set(),
    heroine: new Set(),
    music_director: new Set(),
    producer: new Set(),
    writer: new Set(),
  };

  for (const movie of sampleMovies) {
    console.log(`Movie: ${movie.title_en} (${movie.release_year})`);
    
    for (const field of fields) {
      const value = movie[field as keyof typeof movie] as string;
      if (value) {
        const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
        
        const exactMatch = valueNormalized === slugNormalized;
        const valueIncludesSlug = valueNormalized.includes(slugNormalized);
        const slugIncludesValue = slugNormalized.includes(valueNormalized);
        
        console.log(`  ${field}: ${value}`);
        console.log(`    Normalized: "${valueNormalized}"`);
        console.log(`    Exact match: ${exactMatch}`);
        console.log(`    Value includes slug: ${valueIncludesSlug}`);
        console.log(`    Slug includes value: ${slugIncludesValue}`);
        
        if (exactMatch || valueIncludesSlug || slugIncludesValue) {
          matches[field].add(value);
          console.log(`    ✅ MATCHED!`);
        }
      }
    }
    console.log();
  }

  // Summary
  console.log('\n📊 Match Summary:\n');
  for (const [field, names] of Object.entries(matches)) {
    if (names.size > 0) {
      console.log(`${field}:`);
      names.forEach(name => console.log(`  - ${name}`));
    }
  }

  // Show the problem
  console.log('\n⚠️  PROBLEM IDENTIFIED:\n');
  console.log('The current logic uses THREE conditions:');
  console.log('1. valueNormalized === slugNormalized (exact match)');
  console.log('2. valueNormalized.includes(slugNormalized) ← THIS IS TOO BROAD!');
  console.log('3. slugNormalized.includes(valueNormalized)');
  console.log('\nCondition #2 causes "teja" to match "raviteja" because:');
  console.log('  "raviteja".includes("teja") = true');
}

const slug = process.argv[2] || 'teja';
testProfileMatching(slug).catch(console.error);
