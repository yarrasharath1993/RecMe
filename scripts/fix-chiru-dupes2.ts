import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Duplicate pairs - delete the non-Wikipedia spelling
const DUPLICATES_TO_DELETE = [
  { title: 'Simhapoori Simham', year: 1983 },  // Keep "Simhapuri Simham"
  { title: 'Palleturi Monagadu', year: 1983 }, // Keep "Palletoori Monagadu"
  { title: 'Alludaa Majakaa', year: 1995 },   // Keep "Alluda Majaka"
];

async function fixDupes() {
  console.log('\n=== REMOVING DUPLICATE SPELLING VARIATIONS ===\n');
  
  let removed = 0;
  
  for (const film of DUPLICATES_TO_DELETE) {
    const { data, error } = await supabase
      .from('movies')
      .delete()
      .eq('title_en', film.title)
      .eq('release_year', film.year)
      .select();
    
    if (error) {
      console.log(`❌ "${film.title}": ${error.message}`);
    } else if (data && data.length > 0) {
      removed++;
      console.log(`✓ Deleted duplicate "${film.title}" (${film.year})`);
    } else {
      console.log(`? "${film.title}" not found`);
    }
  }
  
  console.log(`\nRemoved: ${removed} duplicates`);
  
  // Final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log(`\nFinal Chiranjeevi count: ${count}`);
}

fixDupes();
