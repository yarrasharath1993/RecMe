import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixGhosts() {
  console.log('\n=== FIXING CHIRANJEEVI GHOST ENTRIES ===\n');
  
  // Ghost entries that belong to Chiranjeevi Sarja (Kannada actor)
  const sarjaFilms = ['Rudra Tandava', 'Aatagara'];
  
  // Ghost entries with wrong TMDB IDs (upcoming Telugu films)
  const wrongTmdbFilms = ['Auto Jaani', 'Mana Shankara Vara Prasad Garu'];
  
  let fixed = 0;
  
  // Fix Chiranjeevi Sarja films - change hero to Chiranjeevi Sarja
  for (const title of sarjaFilms) {
    const { data, error } = await supabase
      .from('movies')
      .update({ hero: 'Chiranjeevi Sarja' })
      .ilike('title_en', title)
      .ilike('hero', '%Chiranjeevi%')
      .select();
    
    if (error) {
      console.log(`❌ Error fixing "${title}": ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✓ Fixed "${title}" → hero changed to "Chiranjeevi Sarja"`);
      fixed++;
    } else {
      console.log(`? "${title}" not found or already fixed`);
    }
  }
  
  // Clear wrong TMDB IDs for upcoming films
  for (const title of wrongTmdbFilms) {
    const { data, error } = await supabase
      .from('movies')
      .update({ tmdb_id: null })
      .ilike('title_en', title)
      .ilike('hero', '%Chiranjeevi%')
      .select();
    
    if (error) {
      console.log(`❌ Error fixing "${title}": ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`✓ Fixed "${title}" → cleared wrong TMDB ID`);
      fixed++;
    } else {
      console.log(`? "${title}" not found or already fixed`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Fixed: ${fixed} entries`);
  
  // Get new count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log(`Megastar Chiranjeevi films now: ${count}`);
}

fixGhosts();
