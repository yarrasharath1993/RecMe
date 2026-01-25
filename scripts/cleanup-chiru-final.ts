import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Hindi films to remove (these are not Telugu originals)
const HINDI_FILMS = [
  { title: 'Pratibandh', year: 1990 },
  { title: 'Aaj Ka Goonda Raaj', year: 1992 },
  { title: 'The Gentleman', year: 1994 },
];

// Tamil bilingual - should be removed (47 Rojulu exists)
const TAMIL_BILINGUAL = [
  { title: '47 Natkal', year: 1981 },
];

// Spelling duplicate
const SPELLING_DUPE = [
  { title: 'Jwala', year: 1985 }, // Keep Jwaala
];

async function cleanup() {
  console.log('\n=== FINAL CLEANUP ===\n');
  
  let removed = 0;
  
  // Remove Hindi films
  console.log('1. REMOVING HINDI FILMS...');
  for (const film of HINDI_FILMS) {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .ilike('title_en', `%${film.title}%`)
      .eq('release_year', film.year)
      .select();
    
    if (data && data.length > 0) {
      removed++;
      console.log(`   ✓ Removed "${film.title}" (${film.year}) [Hindi]`);
    } else {
      console.log(`   ? "${film.title}" not found`);
    }
  }
  
  // Remove Tamil bilingual
  console.log('\n2. REMOVING TAMIL BILINGUAL...');
  for (const film of TAMIL_BILINGUAL) {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .ilike('title_en', `%${film.title}%`)
      .eq('release_year', film.year)
      .select();
    
    if (data && data.length > 0) {
      removed++;
      console.log(`   ✓ Removed "${film.title}" (${film.year}) [Tamil bilingual]`);
    } else {
      console.log(`   ? "${film.title}" not found`);
    }
  }
  
  // Remove spelling duplicate
  console.log('\n3. REMOVING SPELLING DUPLICATES...');
  for (const film of SPELLING_DUPE) {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .eq('title_en', film.title)
      .eq('release_year', film.year)
      .select();
    
    if (data && data.length > 0) {
      removed++;
      console.log(`   ✓ Removed "${film.title}" (${film.year}) [duplicate of Jwaala]`);
    } else {
      console.log(`   ? "${film.title}" not found`);
    }
  }
  
  console.log(`\nTotal removed: ${removed}`);
  
  // Final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log(`\n=== FINAL COUNT ===`);
  console.log(`Chiranjeevi Telugu films: ${count}`);
  console.log(`Wikipedia Telugu leads: 143`);
  console.log(`Difference: ${(count || 0) - 143}`);
  
  // Remaining extras
  console.log('\n--- Remaining films not in Wikipedia ---');
  const remainingExtras = [
    'Illanta Sandadi (1982)',
    'Jaggu (1982)',
    'Maro Maya Bazaar (1983)',
    'Allulu Vasthunnaru (1984)',
    'Koteeswarudu (1984)',
    'Rojulu Marayi (1984)',
    'Rana (1984)',
    'Best Actor (1987)',
    'Antima Teerpu (1988)',
    'Stuvartpuram Dongalu (1991)',
  ];
  
  console.log('These might be legitimate films missing from Wikipedia:');
  remainingExtras.forEach(f => console.log(`  - ${f}`));
}

cleanup();
