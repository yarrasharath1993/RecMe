import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Films to fix hero (Chiranjeevi was NOT the hero)
const WRONG_HERO = [
  { title: 'Illanta Sandadi', year: 1982, correctHero: 'Chandra Mohan' },
  { title: 'Jaggu', year: 1982, correctHero: 'Krishnam Raju' },
  { title: 'Maro Maya Bazaar', year: 1983, correctHero: 'Chandra Mohan' },
  { title: 'Koteeswarudu', year: 1984, correctHero: 'Akkineni Nageswara Rao' },
  { title: 'Rojulu Marayi', year: 1984, correctHero: 'Rajendra Prasad' },
  { title: 'Rana', year: 1984, correctHero: 'Suman' },
  { title: 'Best Actor', year: 1987, correctHero: 'Rajendra Prasad' },
  { title: 'Antima Teerpu', year: 1988, correctHero: 'Krishnam Raju' },
  { title: 'Stuvartpuram Dongalu', year: 1991, correctHero: 'Bhanu Chander' },
];

// Multi-hero film - KEEP Chiranjeevi
const MULTI_HERO = [
  { title: 'Allulu Vasthunnaru', year: 1984, hero: 'Chiranjeevi, Chandra Mohan' },
];

async function fix() {
  console.log('\n=== FIXING VERIFIED HERO ATTRIBUTIONS ===\n');
  
  let fixed = 0;
  
  // Fix wrong hero attributions
  console.log('1. FIXING WRONG HERO ATTRIBUTIONS...');
  for (const film of WRONG_HERO) {
    const { data, error } = await supabase
      .from('movies')
      .update({ hero: film.correctHero })
      .ilike('title_en', film.title)
      .eq('release_year', film.year)
      .select();
    
    if (data && data.length > 0) {
      fixed++;
      console.log(`   ✓ ${film.title} (${film.year}) → hero: ${film.correctHero}`);
    } else {
      console.log(`   ? ${film.title} not found`);
    }
  }
  
  // Update multi-hero film
  console.log('\n2. UPDATING MULTI-HERO FILM...');
  for (const film of MULTI_HERO) {
    const { data, error } = await supabase
      .from('movies')
      .update({ hero: film.hero })
      .ilike('title_en', film.title)
      .eq('release_year', film.year)
      .select();
    
    if (data && data.length > 0) {
      console.log(`   ✓ ${film.title} (${film.year}) → hero: ${film.hero}`);
    }
  }
  
  console.log(`\nFixed: ${fixed} films`);
  
  // Final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log(`\n=== FINAL COUNT ===`);
  console.log(`Chiranjeevi films (including multi-hero): ${count}`);
  console.log(`Wikipedia Telugu leads: 143`);
  console.log(`Difference: ${(count || 0) - 143}`);
}

fix();
