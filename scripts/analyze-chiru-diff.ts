import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Analyze the differences
const SPELLING_VARIANTS = [
  // [DB title, Wiki title, year]
  ['Shivudu Shivudu Shivudu', 'Sivudu Sivudu Sivudu', 1983],
  ['Jwala', 'Jwaala', 1985],
  ['Allulu Vasthunnaru', 'Allullostunnaru', 1984], // Actually different - Allulu Vasthunnaru was not in wiki
  ['Andarivadu', 'Andarivaadu', 2005],
  ['Alludaa Majakaa', 'Alluda Majaka', 1995],
  ['Simhapoori Simham', 'Simhapuri Simham', 1983],
  ['Palleturi Monagadu', 'Palletoori Monagadu', 1983],
];

const HINDI_DUBS = [
  'Zulm Ki Zanjeer', // Hindi dub
  'Meri Zindagi Ek Agneepath', // Hindi dub
];

const GENUINE_EXTRAS = [
  'Illanta Sandadi', // Not in wiki
  'Jaggu', // Not in wiki
  'Maro Maya Bazaar', // Not in wiki
  'Koteeswarudu', // Not in wiki
  'Rojulu Marayi', // Not in wiki
  'Rana', // Not in wiki
  'Best Actor', // Not in wiki
  'Antima Teerpu', // Not in wiki
  'Stuvartpuram Dongalu', // Not in wiki (possibly a spin-off or related to Stuartpuram Police Station)
  'Mega 159', // Upcoming/placeholder
  'Auto Jaani', // Upcoming/placeholder
];

async function analyze() {
  console.log('\n=== DETAILED ANALYSIS OF DISCREPANCIES ===\n');
  
  console.log('1. SPELLING VARIATIONS (same film, different spelling):');
  console.log('   These are duplicates that should be consolidated:');
  for (const [dbTitle, wikiTitle, year] of SPELLING_VARIANTS) {
    console.log(`   - "${dbTitle}" = "${wikiTitle}" (${year})`);
  }
  
  console.log('\n2. HINDI DUBBED VERSIONS (should be removed or marked):');
  for (const title of HINDI_DUBS) {
    console.log(`   - ${title}`);
  }
  
  console.log('\n3. FILMS IN DB BUT NOT IN WIKIPEDIA (need verification):');
  for (const title of GENUINE_EXTRAS) {
    console.log(`   - ${title}`);
  }
  
  // Check specific films
  console.log('\n4. VERIFYING SPECIFIC FILMS IN DATABASE:');
  
  const filmsToCheck = [
    'Illanta Sandadi',
    'Jaggu',
    'Koteeswarudu',
    'Stuvartpuram Dongalu',
    'Mega 159',
    'Auto Jaani',
  ];
  
  for (const title of filmsToCheck) {
    const { data } = await supabase
      .from('movies')
      .select('title_en, release_year, hero, tmdb_id')
      .ilike('title_en', `%${title}%`)
      .single();
    
    if (data) {
      console.log(`   ${data.title_en} (${data.release_year})`);
      console.log(`     Hero: ${data.hero}, TMDB: ${data.tmdb_id || 'null'}`);
    }
  }
  
  // Missing cameos
  console.log('\n5. MISSING CAMEO APPEARANCES (10 films):');
  const cameos = [
    'Tayaramma Bangarayya (1979)',
    'Kottapeta Rowdy (1980)',
    'Aadavaallu Meeku Joharlu (1981)',
    'Prema Natakam (1981)',
    'Maa Inti Premayanam (1983)',
    'Hands Up (2000)',
    'Style (2006)',
    'Magadheera (2009)',
    'Jagadguru Adi Shankara (2013)',
    'Bruce Lee: The Fighter (2015)',
  ];
  for (const c of cameos) {
    console.log(`   - ${c}`);
  }
  
  // Missing lead roles
  console.log('\n6. MISSING LEAD ROLES (13 films):');
  const leads = [
    'Mana Voori Pandavulu (1978)',
    'Idi Katha Kaadu (1979)',
    'Mosagadu (1980)',
    'Kaali (1980)',
    'Prema Tarangalu (1980)',
    '47 Rojulu (1981)',
    'Priya (1981)',
    'Sivudu Sivudu Sivudu (1983) - check spelling',
    'Chiranjeevi (1985) - self-titled film',
    'Jwaala (1985) - check spelling',
    'Puli (1985)',
    'Sri Manjunatha (2001)',
    'Andarivaadu (2005) - check spelling',
  ];
  for (const l of leads) {
    console.log(`   - ${l}`);
  }
  
  console.log('\n=== RECOMMENDATIONS ===');
  console.log('1. Fix spelling duplicates (7 pairs found)');
  console.log('2. Remove or mark Hindi dubs (2 films)');
  console.log('3. Add missing lead roles (13 films)');
  console.log('4. Optionally add cameos (10 films)');
  console.log('5. Verify & remove extras not in any source (11 films)');
}

analyze();
