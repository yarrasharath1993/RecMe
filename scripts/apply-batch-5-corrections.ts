#!/usr/bin/env npx tsx
/**
 * Apply Batch 5 Manual Review Corrections (1953-1977)
 * 
 * Fixes historical data corruption in classic movies
 * Corrects language, cast, crew with historically accurate data
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Batch 5 corrections from manual review
const batch5Corrections = [
  {
    id: '7679cc2a',
    title: 'Nirakudam',
    year: 1977,
    language: 'Malayalam',
    hero: 'Kamal Haasan',
    heroine: 'Sridevi',
    director: 'A. Bhimsingh',
    music_director: 'Jaya Vijaya',
    note: 'Corrected Language (was Telugu, actually Malayalam)'
  },
  {
    id: '3aa5a84e',
    title: 'Oorummadi Brathukulu',
    year: 1976,
    language: 'Telugu',
    hero: 'G.V. Narayana Rao',
    heroine: 'Madhavi',
    director: 'B.S. Narayana',
    music_director: 'G.K. Venkatesh',
    note: 'Removed German Crew (Franz Tappers, Norbert Schultze)'
  },
  {
    id: '43c49acb',
    title: 'Santhanam Soubhagyam',
    year: 1975,
    language: 'Telugu',
    hero: 'Krishnam Raju',
    heroine: 'Vanisri',
    director: 'Dasari Narayana Rao',
    music_director: 'P. Adinarayana Rao',
    note: 'Added Music Director'
  },
  {
    id: 'fe2267ad',
    title: 'Monagadostunnadu Jagartta',
    year: 1972,
    language: 'Telugu',
    hero: 'Krishna',
    heroine: 'Vijaya Nirmala',
    director: 'K.S.R. Das',
    music_director: 'Satyam',
    note: 'Added Music Director'
  },
  {
    id: '1d604c78',
    title: 'Menakodalu',
    year: 1972,
    language: 'Telugu',
    hero: 'Krishna',
    heroine: 'Jamuna',
    director: 'B.S. Narayana',
    music_director: 'Satyam',
    note: 'Fixed Heroine/Music (synopsis said Vijaya Nirmala)'
  },
  {
    id: '2a590415',
    title: 'Manishichina Maguva',
    year: 1969,
    language: 'Telugu',
    hero: 'Murali Mohan',
    heroine: 'Savitri',
    director: 'A. Bhimsingh',
    music_director: 'S. Rajeswara Rao',
    note: 'Verified Murali Mohan Debut (synopsis said NTR/Vanisri)'
  },
  {
    id: '313aa829',
    title: 'Bangaru Thimmaraju',
    year: 1963,
    language: 'Telugu',
    hero: 'N.T. Rama Rao',
    heroine: 'Krishna Kumari',
    director: 'G. Viswanathan',
    music_director: 'S. Rajeswara Rao',
    note: 'Fixed Director/Music'
  },
  {
    id: '9be5935c',
    title: 'Samrat Pruthviraj',
    year: 1962,
    language: 'Telugu',
    hero: 'N.T. Rama Rao',
    heroine: 'Anjali Devi',
    director: 'Hunsur Krishnamurthy',
    music_director: 'Vasant Desai',
    note: 'Fixed Synopsis Error (described 1959 Hindi film)'
  },
  {
    id: '964f1bbc',
    title: 'Ramasundari',
    year: 1960,
    language: 'Telugu',
    hero: 'N.T. Rama Rao',
    heroine: 'Rajasree',
    director: 'Hunsur Krishnamurthy',
    music_director: 'G.K. Venkatesh',
    note: 'Fixed Synopsis Error (said ANR/B. Saroja Devi)'
  },
  {
    id: 'f7d50074',
    title: 'Chandirani',
    year: 1953,
    language: 'Telugu',
    hero: 'N.T. Rama Rao',
    heroine: 'P. Bhanumathi',
    director: 'P. Bhanumathi',
    music_director: 'C.R. Subbaraman',
    note: 'Fixed Title (was song "Kitukendo Cheppave Chalaki Bullemma")'
  }
];

async function applyBatch5Corrections() {
  console.log('🔧 Applying Batch 5 Manual Review Corrections (1953-1977)\n');
  console.log('='.repeat(80));
  console.log(`\n📝 Corrections to apply: ${batch5Corrections.length}\n`);
  
  let updated = 0;
  let notFound = 0;
  const errors = [];
  
  for (const correction of batch5Corrections) {
    try {
      // Find movie by partial ID and year
      const { data: movies } = await supabase
        .from('movies')
        .select('id, title_en, release_year, language')
        .ilike('id', `${correction.id}%`)
        .eq('release_year', correction.year)
        .limit(1);
      
      if (!movies || movies.length === 0) {
        console.log(`   ❌ Not found: ${correction.title} (${correction.year})`);
        notFound++;
        continue;
      }
      
      const movie = movies[0];
      const oldTitle = movie.title_en;
      const oldLanguage = movie.language;
      
      // Update movie
      const { data, error } = await supabase
        .from('movies')
        .update({
          title_en: correction.title,
          language: correction.language,
          hero: correction.hero,
          heroine: correction.heroine,
          director: correction.director,
          music_director: correction.music_director,
          updated_at: new Date().toISOString(),
        })
        .eq('id', movie.id)
        .select();
      
      if (error) {
        errors.push({ title: correction.title, error: error.message });
        console.log(`   ❌ Error: ${correction.title} - ${error.message}`);
      } else if (!data || data.length === 0) {
        console.log(`   ❌ Update failed: ${correction.title}`);
        notFound++;
      } else {
        updated++;
        console.log(`   ✅ ${correction.year} - ${correction.title}`);
        if (oldTitle !== correction.title) {
          console.log(`      Title: "${oldTitle}" → "${correction.title}"`);
        }
        if (oldLanguage !== correction.language) {
          console.log(`      Language: ${oldLanguage} → ${correction.language}`);
        }
        console.log(`      ${correction.note}`);
      }
    } catch (err: any) {
      errors.push({ title: correction.title, error: err.message });
      console.log(`   ❌ Exception: ${correction.title} - ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 Update Summary:\n');
  console.log(`   Total corrections: ${batch5Corrections.length}`);
  console.log(`   ✅ Successfully updated: ${updated}`);
  console.log(`   ❌ Not found: ${notFound}`);
  console.log(`   ⚠️  Errors: ${errors.length}\n`);
  
  if (errors.length > 0) {
    console.log('⚠️  Errors encountered:\n');
    errors.forEach(e => {
      console.log(`   - ${e.title}: ${e.error}`);
    });
    console.log();
  }
  
  console.log('='.repeat(80));
  console.log('\n✅ Batch 5 corrections applied!\n');
  console.log('📋 Key Fixes:\n');
  console.log('   - Language: 1 Malayalam film corrected');
  console.log('   - Historical Accuracy: Removed German crew from 1976 film');
  console.log('   - Title Fix: Song name → Correct movie title (Chandirani)');
  console.log('   - Cast Verification: Fixed NTR, Krishna filmographies');
  console.log('   - Music Directors: Added missing composers for classics\n');
}

applyBatch5Corrections().catch(console.error);
