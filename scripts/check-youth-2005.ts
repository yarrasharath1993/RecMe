/**
 * Check current data for Youth (2005) movie
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkYouthMovie() {
  console.log('\n🔍 Checking Youth (2005) movie data...\n');

  const { data: movie, error } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', 'youth-2005')
    .single();

  if (error) {
    console.error('❌ Error fetching movie:', error);
    return;
  }

  if (!movie) {
    console.log('❌ Movie not found with slug "youth-2005"');
    return;
  }

  console.log('📽️  Current Movie Data:\n');
  console.log('Title:', movie.title_en);
  console.log('Year:', movie.release_year);
  console.log('Slug:', movie.slug);
  console.log('\n👥 Cast & Crew:\n');
  console.log('Director:', movie.director || 'NULL');
  console.log('Writer:', movie.writer || 'NULL');
  console.log('Producer:', movie.producer || 'NULL');
  console.log('Music Director:', movie.music_director || 'NULL');
  console.log('Cinematographer:', movie.cinematographer || 'NULL');
  console.log('Editor:', movie.editor || 'NULL');
  console.log('\n🎬 Cast:\n');
  console.log('Hero:', movie.hero || 'NULL');
  console.log('Heroine:', movie.heroine || 'NULL');
  console.log('Supporting Cast:', movie.supporting_cast || 'NULL');
  
  console.log('\n📊 Other Info:\n');
  console.log('Production Company:', movie.production_company || 'NULL');
  console.log('Is Published:', movie.is_published);
  console.log('TMDB ID:', movie.tmdb_id || 'NULL');

  console.log('\n\n✅ Correct Data (from user):\n');
  console.log('Director: J. Jitendra');
  console.log('Writer: J. Jitendra');
  console.log('Producer: Gogikar Bajarang Jayadev');
  console.log('Music Director: Ramana Ogeti');
  console.log('Cinematographer: Ramana Salwa');
  console.log('Editor: Menaga');
  console.log('Hero: Vikram, Sri Harsha');
  console.log('Heroine: Lahari, Sishwa');
  console.log('Production Company: Sri Siva Kesava (SSK) Films');

  console.log('\n\n🔍 Comparing...\n');
  
  const issues: string[] = [];
  
  if (movie.director !== 'J. Jitendra') {
    issues.push(`❌ Director: "${movie.director}" → Should be "J. Jitendra"`);
  }
  if (movie.writer !== 'J. Jitendra') {
    issues.push(`❌ Writer: "${movie.writer}" → Should be "J. Jitendra"`);
  }
  if (movie.producer !== 'Gogikar Bajarang Jayadev') {
    issues.push(`❌ Producer: "${movie.producer}" → Should be "Gogikar Bajarang Jayadev"`);
  }
  if (movie.music_director !== 'Ramana Ogeti') {
    issues.push(`❌ Music Director: "${movie.music_director}" → Should be "Ramana Ogeti"`);
  }
  if (movie.cinematographer !== 'Ramana Salwa') {
    issues.push(`❌ Cinematographer: "${movie.cinematographer}" → Should be "Ramana Salwa"`);
  }
  if (movie.editor !== 'Menaga') {
    issues.push(`❌ Editor: "${movie.editor}" → Should be "Menaga"`);
  }
  if (movie.production_company !== 'Sri Siva Kesava (SSK) Films') {
    issues.push(`❌ Production Company: "${movie.production_company}" → Should be "Sri Siva Kesava (SSK) Films"`);
  }

  if (issues.length > 0) {
    console.log('Found', issues.length, 'issues:\n');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ All data is correct!');
  }
}

checkYouthMovie().catch(console.error);
