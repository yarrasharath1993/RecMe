import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateNewIssues() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 INVESTIGATING NEW REPORTED ISSUES');
  console.log('='.repeat(80) + '\n');

  // Issue 1: Kirayi Dada duplicate
  console.log('1️⃣  CHECKING KIRAYI DADA DUPLICATE:\n');
  
  const { data: kirayiMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language, poster_url, slug')
    .eq('is_published', true)
    .or('title_en.ilike.%kirayi%,title_en.ilike.%kirai%');

  console.log(`   Found ${kirayiMovies?.length || 0} movies with "Kirayi/Kirai" in title:\n`);
  kirayiMovies?.forEach(m => {
    console.log(`   - "${m.title_en}" (${m.release_year}) [${m.language}]`);
    console.log(`     Hero: ${m.hero || 'N/A'}`);
    console.log(`     Director: ${m.director || 'N/A'}`);
    console.log(`     Slug: ${m.slug}`);
    console.log(`     Poster: ${m.poster_url || 'NO POSTER'}`);
    console.log(`     ID: ${m.id}`);
    console.log('');
  });

  // Issue 2: Auto Driver (1998)
  console.log('2️⃣  CHECKING AUTO DRIVER (1998):\n');
  
  const { data: autoDriver } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', 'auto-driver-1998')
    .single();

  if (autoDriver) {
    console.log(`   Title: "${autoDriver.title_en}" (${autoDriver.release_year})`);
    console.log(`   Hero: ${autoDriver.hero || 'N/A'}`);
    console.log(`   Director: ${autoDriver.director || 'N/A'}`);
    console.log(`   Language: ${autoDriver.language}`);
    console.log(`   Current Poster: ${autoDriver.poster_url || 'NO POSTER'}`);
    console.log(`   TMDB ID: ${autoDriver.tmdb_id || 'N/A'}`);
    console.log(`   ID: ${autoDriver.id}`);
    console.log('');
    
    if (autoDriver.poster_url) {
      console.log(`   ⚠️  Current poster URL might be wrong!`);
      console.log(`   Please verify this is correct for Telugu "Auto Driver" (1998) with Nagarjuna\n`);
    }
  } else {
    console.log('   ❌ Movie not found!\n');
  }

  // Issue 3: Shanti Kranti (1991)
  console.log('3️⃣  CHECKING SHANTI KRANTI (1991):\n');
  
  const { data: shantiKranti } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', 'shanti-kranti-1991')
    .single();

  if (shantiKranti) {
    console.log(`   Title: "${shantiKranti.title_en}" (${shantiKranti.release_year})`);
    console.log(`   Hero: ${shantiKranti.hero || 'N/A'}`);
    console.log(`   Director: ${shantiKranti.director || 'N/A'}`);
    console.log(`   Language: ${shantiKranti.language}`);
    console.log(`   Current Poster: ${shantiKranti.poster_url || 'NO POSTER'}`);
    console.log(`   TMDB ID: ${shantiKranti.tmdb_id || 'N/A'}`);
    console.log(`   ID: ${shantiKranti.id}`);
    console.log('');
    
    if (shantiKranti.poster_url?.includes('tamil') || shantiKranti.poster_url?.includes('ta.')) {
      console.log(`   ⚠️  Poster URL suggests Tamil version!`);
    }
    
    console.log(`   Note: Need to find Telugu poster with Nagarjuna\n`);
  } else {
    console.log('   ❌ Movie not found!\n');
  }

  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n1. Kirayi Dada: ${kirayiMovies?.length || 0} movies found`);
  console.log(`2. Auto Driver: ${autoDriver ? 'Found' : 'Not found'}`);
  console.log(`3. Shanti Kranti: ${shantiKranti ? 'Found' : 'Not found'}`);
  console.log('\n' + '='.repeat(80) + '\n');
}

investigateNewIssues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
