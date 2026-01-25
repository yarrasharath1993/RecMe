import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fix() {
  console.log('\n=== FIXING CHIRANJEEVI HERO ATTRIBUTIONS ===\n');
  
  // 1. Fix "Chiranjeevi (1985)" - obviously should have Chiranjeevi as hero
  console.log('1. Fixing "Chiranjeevi (1985)" hero attribution...');
  const { data: chiru1985, error: err1 } = await supabase
    .from('movies')
    .update({ hero: 'Chiranjeevi' })
    .eq('title_en', 'Chiranjeevi')
    .eq('release_year', 1985)
    .select();
  
  if (chiru1985?.length) {
    console.log('   ✓ Fixed: Chiranjeevi (1985) → hero: Chiranjeevi');
  }
  
  // 2. Add Jwaala (1985) back
  console.log('\n2. Adding "Jwaala (1985)" back...');
  const { error: err2 } = await supabase
    .from('movies')
    .insert({
      title_en: 'Jwaala',
      title_te: 'Jwaala',
      release_year: 1985,
      hero: 'Chiranjeevi',
      slug: 'jwaala-1985',
      is_published: false,
      language: 'Telugu',
    });
  
  if (err2) {
    if (err2.code === '23505') {
      console.log('   ? Jwaala (1985) already exists');
    } else {
      console.log(`   ❌ Error: ${err2.message}`);
    }
  } else {
    console.log('   ✓ Added: Jwaala (1985)');
  }
  
  // 3. Check multi-hero films - these films had multiple heroes
  // According to Wikipedia, Chiranjeevi was lead in these
  console.log('\n3. Checking multi-hero films...');
  const multiHeroFilms = [
    { title: 'Mosagadu', year: 1980, note: 'Sobhan Babu + Chiranjeevi' },
    { title: '47 Rojulu', year: 1981, note: 'Jayaprada + Chiranjeevi' },
  ];
  
  for (const film of multiHeroFilms) {
    const { data } = await supabase
      .from('movies')
      .select('hero')
      .ilike('title_en', film.title)
      .eq('release_year', film.year)
      .single();
    
    if (data) {
      console.log(`   ${film.title} (${film.year}): current hero = "${data.hero}"`);
      console.log(`     Note: ${film.note}`);
    }
  }
  
  // Final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log(`\n=== FINAL COUNT ===`);
  console.log(`Chiranjeevi films: ${count}`);
}

fix();
