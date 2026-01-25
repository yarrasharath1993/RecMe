import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testMovies() {
  console.log('\n🔍 Searching for K. Balachander movies...\n');
  
  const testTitles = [
    'Arangetram',
    'Neerkumizhi',
    'Bama Vijayam',
    'Chilaka Gorinka'
  ];
  
  for (const title of testTitles) {
    const { data } = await supabase
      .from('movies')
      .select('id, title_en, release_year, director, crew')
      .or(`title_en.ilike.%${title}%,title_te.ilike.%${title}%`)
      .limit(3);
    
    if (data && data.length > 0) {
      console.log(`✓ Found: ${title}`);
      data.forEach(m => {
        console.log(`  - ${m.title_en} (${m.release_year}) | Director: ${m.director || '(empty)'}`);
        console.log(`    Crew:`, m.crew);
      });
    } else {
      console.log(`✗ Not found: ${title}`);
    }
    console.log('');
  }
}

testMovies();
