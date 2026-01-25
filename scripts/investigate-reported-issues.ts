import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateIssues() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 INVESTIGATING REPORTED ISSUES');
  console.log('='.repeat(80) + '\n');

  // Issue 1: Sivamani duplicate
  console.log('1️⃣  CHECKING SIVAMANI DUPLICATE:\n');
  
  const { data: sivamaniMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language')
    .eq('is_published', true)
    .ilike('title_en', '%sivamani%');

  console.log(`   Found ${sivamaniMovies?.length || 0} movies with "Sivamani" in title:\n`);
  sivamaniMovies?.forEach(m => {
    console.log(`   - "${m.title_en}" (${m.release_year}) [${m.language}]`);
    console.log(`     Hero: ${m.hero || 'N/A'}`);
    console.log(`     Director: ${m.director || 'N/A'}`);
    console.log(`     ID: ${m.id}`);
    console.log('');
  });

  // Issue 2: Aaha movie producer check
  console.log('2️⃣  CHECKING AAHA PRODUCER:\n');
  
  const { data: aahaMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, producer, language')
    .eq('is_published', true)
    .or('title_en.ilike.%aaha%,title_en.ilike.%aahaa%');

  console.log(`   Found ${aahaMovies?.length || 0} movies with "Aaha" in title:\n`);
  aahaMovies?.forEach(m => {
    console.log(`   - "${m.title_en}" (${m.release_year}) [${m.language}]`);
    console.log(`     Hero: ${m.hero || 'N/A'}`);
    console.log(`     Producer: ${m.producer || 'N/A'}`);
    console.log(`     ID: ${m.id}`);
    
    if (m.producer?.toLowerCase().includes('nagarjuna')) {
      console.log('     ⚠️  Contains "Nagarjuna" in producer field!');
    }
    console.log('');
  });

  // Issue 3: Kedi check
  console.log('3️⃣  CHECKING KEDI:\n');
  
  const { data: kediMovies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, language, poster_url')
    .eq('is_published', true)
    .ilike('title_en', '%kedi%');

  console.log(`   Found ${kediMovies?.length || 0} movies with "Kedi" in title:\n`);
  kediMovies?.forEach(m => {
    console.log(`   - "${m.title_en}" (${m.release_year}) [${m.language}]`);
    console.log(`     Hero: ${m.hero || 'N/A'}`);
    console.log(`     Director: ${m.director || 'N/A'}`);
    console.log(`     Poster: ${m.poster_url || 'NO POSTER'}`);
    console.log(`     ID: ${m.id}`);
    console.log('');
  });

  // Issue 4: Sri Ramadasu poster check
  console.log('4️⃣  CHECKING SRI RAMADASU POSTER:\n');
  
  const { data: ramadasu } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, poster_url')
    .eq('is_published', true)
    .ilike('title_en', '%ramadasu%');

  console.log(`   Found ${ramadasu?.length || 0} movies with "Ramadasu" in title:\n`);
  ramadasu?.forEach(m => {
    console.log(`   - "${m.title_en}" (${m.release_year})`);
    console.log(`     Hero: ${m.hero || 'N/A'}`);
    console.log(`     Poster URL: ${m.poster_url || 'NO POSTER'}`);
    console.log(`     ID: ${m.id}`);
    
    if (m.poster_url) {
      console.log(`     Testing if URL is accessible...`);
      // The poster might be broken - check if it's a valid URL format
      try {
        const url = new URL(m.poster_url);
        console.log(`     ✅ Valid URL format: ${url.hostname}`);
      } catch (e) {
        console.log(`     ❌ Invalid URL format!`);
      }
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('📊 SUMMARY OF ISSUES');
  console.log('='.repeat(80));
  console.log(`\n1. Sivamani: ${sivamaniMovies?.length || 0} movies found`);
  console.log(`2. Aaha: ${aahaMovies?.length || 0} movies found`);
  console.log(`3. Kedi: ${kediMovies?.length || 0} movies found`);
  console.log(`4. Ramadasu: ${ramadasu?.length || 0} movies found`);
  console.log('\n' + '='.repeat(80) + '\n');
}

investigateIssues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
