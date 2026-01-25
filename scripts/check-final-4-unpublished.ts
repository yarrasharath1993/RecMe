import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinal4() {
  console.log('\n🔍 CHECKING FINAL 4 UNPUBLISHED MOVIES\n');

  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, director, our_rating, poster_url, synopsis, language')
    .eq('is_published', false)
    .eq('language', 'Telugu');

  if (error || !movies) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${movies.length} unpublished Telugu movies:\n`);

  movies.forEach((m, i) => {
    console.log(`${i + 1}. ${m.title_en} (${m.release_year})`);
    console.log(`   Hero: ${m.hero || 'MISSING'}`);
    console.log(`   Director: ${m.director || 'MISSING'}`);
    console.log(`   Rating: ${m.our_rating || 'MISSING'}`);
    console.log(`   Poster: ${m.poster_url ? 'YES' : 'NO'}`);
    console.log(`   Synopsis: ${m.synopsis ? 'YES' : 'NO'}`);
    console.log(`   ID: ${m.id}\n`);
  });

  return movies;
}

checkFinal4()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
