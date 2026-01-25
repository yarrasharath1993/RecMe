import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MISSING = [
  { title: 'Mosagadu', year: 1980 },
  { title: 'Kaali', year: 1980 },
  { title: 'Prema Tarangalu', year: 1980 },
  { title: '47 Rojulu', year: 1981 },
  { title: 'Priya', year: 1981 },
  { title: 'Chiranjeevi', year: 1985 },
  { title: 'Jwaala', year: 1985 },
  { title: 'Puli', year: 1985 },
  { title: 'Sri Manjunatha', year: 2001 },
];

async function check() {
  console.log('\n=== CHECKING IF "MISSING" FILMS EXIST WITH DIFFERENT HERO ===\n');
  
  for (const film of MISSING) {
    const { data } = await supabase
      .from('movies')
      .select('title_en, release_year, hero, slug')
      .ilike('title_en', `%${film.title}%`)
      .gte('release_year', film.year - 1)
      .lte('release_year', film.year + 1);
    
    if (data && data.length > 0) {
      console.log(`✓ "${film.title}" (${film.year}) exists:`);
      data.forEach(d => {
        console.log(`    → ${d.title_en} (${d.release_year}) - hero: ${d.hero}`);
      });
    } else {
      console.log(`❌ "${film.title}" (${film.year}) - NOT IN DATABASE`);
    }
  }
}

check();
