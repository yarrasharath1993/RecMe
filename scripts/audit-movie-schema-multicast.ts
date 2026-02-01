#!/usr/bin/env npx tsx
/**
 * Audit Movie Schema for Multi-Cast Support
 * 
 * This script audits the current movie schema to understand:
 * 1. Are hero/heroine single strings or arrays?
 * 2. How many movies would benefit from multi-hero support?
 * 3. What's the migration path?
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

async function auditMovieSchema() {
  console.log('🔍 Auditing Movie Schema for Multi-Cast Support\n');
  console.log('='.repeat(80));

  // Get sample movies to check schema
  const { data: sampleMovies } = await supabase
    .from('movies')
    .select('*')
    .eq('is_published', true)
    .limit(10);

  if (!sampleMovies || sampleMovies.length === 0) {
    console.log('❌ No movies found');
    return;
  }

  console.log('📋 Current Schema Analysis:\n');

  const firstMovie = sampleMovies[0];
  
  console.log('Sample Movie:', firstMovie.title_en);
  console.log('\nField Types:');
  console.log(`  hero: ${typeof firstMovie.hero} ${Array.isArray(firstMovie.hero) ? '(ARRAY)' : '(STRING)'}`);
  console.log(`  heroine: ${typeof firstMovie.heroine} ${Array.isArray(firstMovie.heroine) ? '(ARRAY)' : '(STRING)'}`);
  console.log(`  heroes: ${typeof (firstMovie as any).heroes} ${Array.isArray((firstMovie as any).heroes) ? `(ARRAY, ${(firstMovie as any).heroes?.length} items)` : '(MISSING/NULL)'}`);
  console.log(`  heroines: ${typeof (firstMovie as any).heroines} ${Array.isArray((firstMovie as any).heroines) ? `(ARRAY, ${(firstMovie as any).heroines?.length} items)` : '(MISSING/NULL)'}`);
  console.log(`  director: ${typeof firstMovie.director} ${Array.isArray(firstMovie.director) ? '(ARRAY)' : '(STRING)'}`);
  console.log(`  producer: ${typeof firstMovie.producer} ${Array.isArray(firstMovie.producer) ? '(ARRAY)' : '(STRING)'}`);
  console.log(`  music_director: ${typeof firstMovie.music_director} ${Array.isArray(firstMovie.music_director) ? '(ARRAY)' : '(STRING)'}`);
  console.log(`  actors: ${typeof firstMovie.actors} ${Array.isArray(firstMovie.actors) ? '(ARRAY)' : '(STRING/NULL)'}`);
  console.log(`  producers: ${typeof firstMovie.producers} ${Array.isArray(firstMovie.producers) ? '(ARRAY)' : '(STRING/NULL)'}`);
  console.log(`  supporting_cast: ${typeof firstMovie.supporting_cast} ${Array.isArray(firstMovie.supporting_cast) ? '(ARRAY)' : '(STRING/NULL)'}`);

  // Validation: heroes/heroines backfill
  const { count: withHeroes } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('heroes', 'is', null);
  const { count: withHeroines } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .not('heroines', 'is', null);
  const { count: totalPublished } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true);
  console.log('\nBackfill validation (published movies):');
  console.log(`  Total published: ${totalPublished ?? 0}`);
  console.log(`  With heroes[] populated: ${withHeroes ?? 0}`);
  console.log(`  With heroines[] populated: ${withHeroines ?? 0}`);
  if ((withHeroes ?? 0) > 0 && (withHeroines ?? 0) > 0) {
    console.log('  ✅ heroes/heroines columns in use.');
  } else {
    console.log('  ⚠️ Run backfill-heroes-heroines.sql if heroes/heroines are empty.');
  }

  // Check for potential multi-hero indicators
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Checking for Multi-Hero Indicators:\n');

  // Look for movies with commas in hero field (might indicate multiple heroes)
  const { data: commaHeroes, count: commaHeroCount } = await supabase
    .from('movies')
    .select('id, title_en, hero', { count: 'exact' })
    .eq('is_published', true)
    .ilike('hero', '%,%')
    .limit(20);

  console.log(`Movies with commas in hero field: ${commaHeroCount || 0}`);
  if (commaHeroes && commaHeroes.length > 0) {
    console.log('Sample movies:');
    commaHeroes.slice(0, 10).forEach((movie: any) => {
      console.log(`  - ${movie.title_en}: "${movie.hero}"`);
    });
  }

  // Look for movies with " and " in hero field
  const { data: andHeroes, count: andHeroCount } = await supabase
    .from('movies')
    .select('id, title_en, hero', { count: 'exact' })
    .eq('is_published', true)
    .or('hero.ilike.% and %,hero.ilike.%&%')
    .limit(20);

  console.log(`\nMovies with "and" or "&" in hero field: ${andHeroCount || 0}`);
  if (andHeroes && andHeroes.length > 0) {
    console.log('Sample movies:');
    andHeroes.slice(0, 10).forEach((movie: any) => {
      console.log(`  - ${movie.title_en}: "${movie.hero}"`);
    });
  }

  // Check if actors array is being used
  const { data: withActorsArray, count: actorsArrayCount } = await supabase
    .from('movies')
    .select('id, title_en, hero, actors', { count: 'exact' })
    .eq('is_published', true)
    .not('actors', 'is', null)
    .limit(20);

  console.log(`\nMovies with actors array populated: ${actorsArrayCount || 0}`);
  if (withActorsArray && withActorsArray.length > 0) {
    console.log('Sample movies:');
    withActorsArray.slice(0, 10).forEach((movie: any) => {
      console.log(`  - ${movie.title_en}:`);
      console.log(`    hero: "${movie.hero}"`);
      console.log(`    actors: ${JSON.stringify(movie.actors)}`);
    });
  }

  // Identify famous multi-starrers
  console.log('\n' + '='.repeat(80));
  console.log('🎬 Checking Famous Multi-Starrers:\n');

  const multiStarrers = [
    'Seethamma Vakitlo Sirimalle Chettu',
    'Manam',
    'RRR',
    'Baahubali',
    'Aravinda Sametha',
    'Magadheera',
  ];

  for (const title of multiStarrers) {
    const { data: movie } = await supabase
      .from('movies')
      .select('title_en, hero, heroine, actors, supporting_cast')
      .ilike('title_en', `%${title}%`)
      .limit(1)
      .maybeSingle();

    if (movie) {
      console.log(`\n"${movie.title_en}":`);
      console.log(`  hero: "${movie.hero}"`);
      console.log(`  heroine: "${movie.heroine}"`);
      console.log(`  actors: ${Array.isArray(movie.actors) ? `[${movie.actors.length} items]` : 'null'}`);
      console.log(`  supporting_cast: ${Array.isArray(movie.supporting_cast) ? `[${movie.supporting_cast.length} items]` : 'null'}`);
    }
  }

  // Get database schema info
  console.log('\n' + '='.repeat(80));
  console.log('📊 Database Column Types:\n');

  const { data: columns, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, udt_name')
    .eq('table_name', 'movies')
    .in('column_name', ['hero', 'heroine', 'director', 'producer', 'music_director', 'actors', 'producers', 'supporting_cast']);

  if (columns) {
    columns.forEach((col: any) => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Recommendations:\n');

  if ((commaHeroCount || 0) > 0 || (andHeroCount || 0) > 0) {
    console.log('⚠️  ISSUE DETECTED: Multiple heroes stored as comma-separated strings!');
    console.log('   This causes problems:');
    console.log('   1. Search doesn\'t work properly');
    console.log('   2. Can\'t link to individual celebrity profiles');
    console.log('   3. Can\'t aggregate statistics correctly');
    console.log('');
    console.log('✅ RECOMMENDED SOLUTION:');
    console.log('   1. Migrate hero/heroine to array fields');
    console.log('   2. Parse existing comma-separated values');
    console.log('   3. Update all API code to handle arrays');
    console.log('   4. Maintain backward compatibility during transition');
  } else if ((actorsArrayCount || 0) > 0) {
    console.log('✅ actors array is being used!');
    console.log('   Consider:');
    console.log('   1. Migrating hero → actors[0] (main hero)');
    console.log('   2. Using actors array as the primary source');
    console.log('   3. Keeping hero for backward compatibility');
  } else {
    console.log('ℹ️  No multi-hero data detected yet.');
    console.log('   Prepare for future by:');
    console.log('   1. Adding heroes[] array field');
    console.log('   2. Adding heroines[] array field');
    console.log('   3. Updating ingestion to populate arrays');
    console.log('   4. Updating APIs to read from arrays');
  }

  console.log('\n' + '='.repeat(80));
  console.log('📄 Next Steps:\n');
  console.log('1. Review this audit report');
  console.log('2. Run migrate-to-multi-cast-schema.ts to prepare migration');
  console.log('3. Test with sample movies');
  console.log('4. Deploy gradual migration\n');
}

auditMovieSchema().catch(console.error);
