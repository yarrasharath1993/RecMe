import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Films that exist but need hero updated
const NEEDS_HERO_UPDATE = [
  'Mana Voori Pandavulu',
  'Idi Katha Kaadu',
  'Prema Tarangalu',
  '47 Rojulu',
  'Sri Manjunatha',
  'Tayaramma Bangarayya',
  'Kottapeta Rowdy',
  'Magadheera',
];

// Truly missing films
const MISSING_FILMS = [
  { title: 'Mosagadu', year: 1980 },
  { title: 'Kaali', year: 1980 },
  { title: 'Priya', year: 1981 },
  { title: 'Chiranjeevi', year: 1985 },
  { title: 'Puli', year: 1985 },
  { title: 'Bruce Lee: The Fighter', year: 2015 },
];

function generateSlug(title: string, year: number): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}-${year}`;
}

async function fix() {
  console.log('\n=== FIXING REMAINING CHIRANJEEVI ISSUES ===\n');
  
  // Check which films need hero update
  console.log('1. CHECKING FILMS WITH WRONG HERO...');
  for (const title of NEEDS_HERO_UPDATE) {
    const { data } = await supabase
      .from('movies')
      .select('id, title_en, release_year, hero')
      .ilike('title_en', `%${title}%`)
      .single();
    
    if (data && !data.hero?.toLowerCase().includes('chiranjeevi')) {
      console.log(`   ${data.title_en} (${data.release_year}): hero="${data.hero}"`);
      // These are multi-star films - Chiranjeevi might be supporting
    } else if (data) {
      console.log(`   ✓ ${data.title_en} - already has Chiranjeevi as hero`);
    }
  }
  
  // Add truly missing films
  console.log('\n2. ADDING MISSING FILMS...');
  let added = 0;
  
  for (const film of MISSING_FILMS) {
    // Check if exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id')
      .ilike('title_en', `%${film.title}%`)
      .eq('release_year', film.year)
      .single();
    
    if (existing) {
      console.log(`   ? "${film.title}" (${film.year}) already exists`);
      continue;
    }
    
    const { error } = await supabase
      .from('movies')
      .insert({
        title_en: film.title,
        title_te: film.title,
        release_year: film.year,
        hero: 'Chiranjeevi',
        slug: generateSlug(film.title, film.year),
        is_published: false,
        language: 'Telugu',
      });
    
    if (error) {
      console.log(`   ❌ "${film.title}": ${error.message}`);
    } else {
      added++;
      console.log(`   ✓ Added "${film.title}" (${film.year})`);
    }
  }
  
  console.log(`\nAdded: ${added} films`);
  
  // Final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%')
    .not('hero', 'ilike', '%Sarja%');
  
  console.log(`\n=== FINAL COUNT ===`);
  console.log(`Chiranjeevi hero roles: ${count}`);
  console.log(`Wikipedia lead roles: 143`);
  console.log(`Difference: ${(count || 0) - 143}`);
}

fix();
