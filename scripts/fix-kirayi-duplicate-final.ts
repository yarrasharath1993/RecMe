import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixKirayiDuplicate() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIXING KIRAYI DADA DUPLICATE');
  console.log('='.repeat(80) + '\n');

  // Get both Kirayi/Kirai Dada entries from 1987
  const { data: kirayiMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, director, poster_url')
    .eq('release_year', 1987)
    .or('title_en.ilike.%kirai dada%,title_en.ilike.%kirayi dada%');

  if (!kirayiMovies || kirayiMovies.length === 0) {
    console.log('   ❌ No movies found!\n');
    return;
  }

  console.log(`   Found ${kirayiMovies.length} movies:\n`);
  kirayiMovies.forEach((m, idx) => {
    console.log(`   ${idx + 1}. "${m.title_en}"`);
    console.log(`      Hero: ${m.hero}`);
    console.log(`      Director: ${m.director}`);
    console.log(`      Poster: ${m.poster_url ? 'YES' : 'NO'}`);
    console.log(`      ID: ${m.id}`);
    console.log('');
  });

  if (kirayiMovies.length !== 2) {
    console.log(`   ⚠️  Expected 2 movies, found ${kirayiMovies.length}. Skipping deletion.\n`);
    return;
  }

  // Determine which to keep (prefer "Akkineni Nagarjuna" over "Nagarjuna")
  const movie1 = kirayiMovies[0];
  const movie2 = kirayiMovies[1];

  const keep = (movie1.hero?.includes('Akkineni') ? movie1 : movie2);
  const deleteMovie = keep.id === movie1.id ? movie2 : movie1;

  console.log(`   ✅ KEEPING: "${keep.title_en}" (Hero: ${keep.hero})`);
  console.log(`   ❌ DELETING: "${deleteMovie.title_en}" (Hero: ${deleteMovie.hero})`);
  console.log('');

  // Delete from career_milestones first
  console.log(`   Deleting career milestones for: ${deleteMovie.id}...`);
  const { error: milestoneError } = await supabase
    .from('career_milestones')
    .delete()
    .eq('movie_id', deleteMovie.id);

  if (milestoneError) {
    console.log(`   ⚠️  ${milestoneError.message}`);
  } else {
    console.log(`   ✅ Career milestones deleted`);
  }

  // Delete the movie
  console.log(`   Deleting movie: ${deleteMovie.id}...`);
  const { error: deleteError } = await supabase
    .from('movies')
    .delete()
    .eq('id', deleteMovie.id);

  if (deleteError) {
    console.log(`   ❌ Error: ${deleteError.message}\n`);
  } else {
    console.log(`   ✅ Movie deleted successfully!\n`);
  }

  console.log('='.repeat(80));
  console.log('✅ KIRAYI DADA DUPLICATE FIX COMPLETE');
  console.log('='.repeat(80));
  console.log('\n📝 Next: Hard refresh browser to see changes\n');
}

fixKirayiDuplicate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
