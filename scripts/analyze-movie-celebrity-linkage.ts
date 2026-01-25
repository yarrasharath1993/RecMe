#!/usr/bin/env npx tsx
/**
 * Analyze Movie-Celebrity Linkage
 * 
 * This script analyzes how celebrities are linked to movies in the database
 * and helps identify naming inconsistencies.
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

async function analyzeMovieCelebrityLinkage() {
  console.log('🔍 Analyzing Movie-Celebrity Linkage\n');
  console.log('='.repeat(80));

  // Get total movies count
  const { count: totalMovies } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);

  console.log(`📊 Total published movies: ${totalMovies || 0}\n`);

  // Sample some movies to see structure
  const { data: sampleMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine, director, producer, music_director, supporting_cast, actors, producers')
    .eq('is_published', true)
    .limit(10);

  console.log('📋 Sample Movie Structure:\n');
  if (sampleMovies && sampleMovies.length > 0) {
    const firstMovie = sampleMovies[0];
    console.log(`   Title: ${firstMovie.title_en}`);
    console.log(`   Hero: ${firstMovie.hero || 'N/A'}`);
    console.log(`   Heroine: ${firstMovie.heroine || 'N/A'}`);
    console.log(`   Director: ${firstMovie.director || 'N/A'}`);
    console.log(`   Producer: ${firstMovie.producer || 'N/A'}`);
    console.log(`   Music Director: ${firstMovie.music_director || 'N/A'}`);
    console.log(`   Supporting Cast: ${JSON.stringify(firstMovie.supporting_cast || 'N/A').substring(0, 100)}...`);
    console.log(`   Actors array: ${Array.isArray(firstMovie.actors) ? `[${firstMovie.actors.length} items]` : 'N/A'}`);
    console.log(`   Producers array: ${Array.isArray(firstMovie.producers) ? `[${firstMovie.producers.length} items]` : 'N/A'}`);
  }

  // Get unique celebrity names from all fields
  console.log('\n' + '='.repeat(80));
  console.log('📊 Analyzing Celebrity Name Distribution...\n');

  const { data: allMovies } = await supabase
    .from('movies')
    .select('hero, heroine, director, producer, music_director')
    .eq('is_published', true);

  const uniqueHeroes = new Set<string>();
  const uniqueHeroines = new Set<string>();
  const uniqueDirectors = new Set<string>();
  const uniqueProducers = new Set<string>();
  const uniqueMusicDirectors = new Set<string>();

  allMovies?.forEach((movie: any) => {
    if (movie.hero) uniqueHeroes.add(movie.hero);
    if (movie.heroine) uniqueHeroines.add(movie.heroine);
    if (movie.director) uniqueDirectors.add(movie.director);
    if (movie.producer) uniqueProducers.add(movie.producer);
    if (movie.music_director) uniqueMusicDirectors.add(movie.music_director);
  });

  console.log(`   Unique Heroes: ${uniqueHeroes.size}`);
  console.log(`   Unique Heroines: ${uniqueHeroines.size}`);
  console.log(`   Unique Directors: ${uniqueDirectors.size}`);
  console.log(`   Unique Producers: ${uniqueProducers.size}`);
  console.log(`   Unique Music Directors: ${uniqueMusicDirectors.size}`);

  // Show top 20 heroes
  console.log('\n📋 Top 20 Heroes in Database:\n');
  const heroCounts = new Map<string, number>();
  allMovies?.forEach((movie: any) => {
    if (movie.hero) {
      heroCounts.set(movie.hero, (heroCounts.get(movie.hero) || 0) + 1);
    }
  });

  const topHeroes = Array.from(heroCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  topHeroes.forEach(([name, count], index) => {
    console.log(`   ${index + 1}. ${name} (${count} movies)`);
  });

  // Check specifically for Akkineni family members
  console.log('\n' + '='.repeat(80));
  console.log('👨‍👩‍👧‍👦 Checking Akkineni Family Members...\n');

  const akkineniNames = [
    'Nagarjuna',
    'Akkineni Nagarjuna',
    'Nag',
    'Nageswara Rao',
    'Akkineni Nageswara Rao',
    'ANR',
    'Naga Chaitanya',
    'Chaitanya',
    'Akhil',
    'Akhil Akkineni',
  ];

  for (const name of akkineniNames) {
    const { count } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(`hero.ilike.%${name}%,heroine.ilike.%${name}%,director.ilike.%${name}%,producer.ilike.%${name}%`);

    if (count && count > 0) {
      console.log(`   ✓ "${name}": ${count} movies`);
    } else {
      console.log(`   ✗ "${name}": 0 movies`);
    }
  }

  // Check if celebrities table has better coverage
  console.log('\n' + '='.repeat(80));
  console.log('📊 Celebrities Table vs Movies Table...\n');

  const { count: totalCelebrities } = await supabase
    .from('celebrities')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total celebrities in database: ${totalCelebrities || 0}`);

  // Sample check: how many celebrities have movies?
  const { data: sampleCelebs } = await supabase
    .from('celebrities')
    .select('id, name_en, slug')
    .eq('is_published', true)
    .limit(20);

  if (sampleCelebs) {
    console.log('\n   Checking movie associations for sample celebrities:\n');
    
    for (const celeb of sampleCelebs) {
      const { count } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .or(`hero.eq.${celeb.name_en},heroine.eq.${celeb.name_en},director.eq.${celeb.name_en},producer.eq.${celeb.name_en}`);

      const icon = (count && count > 0) ? '✓' : '✗';
      console.log(`   ${icon} ${celeb.name_en}: ${count || 0} movies`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 Findings:\n');

  if (totalMovies === 0) {
    console.log('   ⚠️  NO MOVIES in database!');
    console.log('   → Need to ingest movies first');
  } else if (uniqueHeroes.size === 0) {
    console.log('   ⚠️  Movies exist but have NO celebrity linkage!');
    console.log('   → Need to run celebrity linkage script');
  } else {
    console.log('   ✓ Movies and celebrities are linked');
    console.log('   ✓ Celebrity names are stored in movie fields');
    console.log('   \n   → For missing celebrities:');
    console.log('     1. Check name format differences');
    console.log('     2. Update movie records with correct names');
    console.log('     3. Or re-ingest from TMDB/IMDb');
  }

  console.log('\n' + '='.repeat(80));
}

analyzeMovieCelebrityLinkage().catch(console.error);
