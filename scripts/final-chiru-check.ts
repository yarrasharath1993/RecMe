import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function finalCheck() {
  console.log('\n=== FINAL CHIRANJEEVI FILMOGRAPHY CHECK ===\n');
  
  // Get all films where Chiranjeevi is hero
  const { data: heroFilms, count: heroCount } = await supabase
    .from('movies')
    .select('title_en, release_year', { count: 'exact' })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%')
    .order('release_year');
  
  // Get all films where Chiranjeevi is in supporting cast (cameos)
  const { data: cameoFilms, count: cameoCount } = await supabase
    .from('movies')
    .select('title_en, release_year, supporting_cast')
    .ilike('supporting_cast', '%Chiranjeevi%')
    .order('release_year');
  
  console.log(`Hero roles: ${heroCount}`);
  console.log(`Cameo appearances found: ${cameoCount || 0}`);
  
  // Check specific missing films
  console.log('\n--- Checking "Missing" Films ---');
  
  const toCheck = [
    'Mana Voori Pandavulu',
    'Idi Katha Kaadu', 
    'Mosagadu',
    'Kaali',
    'Prema Tarangalu',
    '47 Rojulu',
    'Priya',
    'Chiranjeevi',
    'Puli',
    'Sri Manjunatha',
    'Tayaramma Bangarayya',
    'Kottapeta Rowdy',
    'Magadheera',
    'Bruce Lee',
  ];
  
  for (const title of toCheck) {
    const { data } = await supabase
      .from('movies')
      .select('title_en, release_year, hero, supporting_cast')
      .ilike('title_en', `%${title}%`)
      .single();
    
    if (data) {
      const role = data.hero?.includes('Chiranjeevi') ? 'Hero' : 
                   data.supporting_cast?.includes('Chiranjeevi') ? 'Cameo' : 'Other';
      console.log(`✓ ${data.title_en} (${data.release_year}) - ${role}`);
    } else {
      console.log(`❌ ${title} - NOT FOUND`);
    }
  }
  
  // Year-wise breakdown
  console.log('\n--- Year-wise Distribution ---');
  const yearDist: Record<number, number> = {};
  heroFilms?.forEach(f => {
    const decade = Math.floor(f.release_year / 10) * 10;
    yearDist[decade] = (yearDist[decade] || 0) + 1;
  });
  
  Object.entries(yearDist).sort().forEach(([decade, count]) => {
    console.log(`${decade}s: ${count} films`);
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`Wikipedia Telugu films: 153 (143 lead + 10 cameos)`);
  console.log(`Database hero roles: ${heroCount}`);
  console.log(`Database cameos: ${cameoCount || 0}`);
  console.log(`Difference: ${153 - (heroCount || 0)} films`);
}

finalCheck();
