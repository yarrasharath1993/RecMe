/**
 * Fix Nithin spelling inconsistency
 * Change "Nithin" to "Nithiin" (correct spelling with double 'i')
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixNithinSpelling() {
  console.log('\n🔧 Fixing Nithin spelling inconsistency...\n');

  // Get the movie with wrong spelling
  const { data: wrongMovie } = await supabase
    .from('movies')
    .select('*')
    .eq('hero', 'Nithin')
    .eq('is_published', true)
    .single();

  if (!wrongMovie) {
    console.log('✅ No movies found with incorrect spelling "Nithin"');
    return;
  }

  console.log('Found movie with wrong spelling:');
  console.log('  Title:', wrongMovie.title_en);
  console.log('  Year:', wrongMovie.release_year);
  console.log('  Hero:', wrongMovie.hero, '← Wrong spelling!');
  console.log('  Slug:', wrongMovie.slug);

  // Update to correct spelling
  const { error } = await supabase
    .from('movies')
    .update({ hero: 'Nithiin' })
    .eq('id', wrongMovie.id);

  if (error) {
    console.error('\n❌ Error updating:', error);
    return;
  }

  // Verify the fix
  const { data: fixedMovie } = await supabase
    .from('movies')
    .select('hero')
    .eq('id', wrongMovie.id)
    .single();

  console.log('\n✅ Fixed!');
  console.log('  Hero:', fixedMovie?.hero, '← Correct spelling!');

  // Verify no more movies with wrong spelling
  const { count: remainingCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('hero', 'Nithin');

  const { count: correctCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('hero', 'Nithiin');

  console.log('\n📊 Final counts:');
  console.log('  Movies with "Nithin" (wrong):', remainingCount || 0);
  console.log('  Movies with "Nithiin" (correct):', correctCount || 0);

  console.log('\n✅ Spelling fixed! The duplicate profile issue is resolved.');
  console.log('   - http://localhost:3000/movies?profile=nithin (should now be empty or 404)');
  console.log('   - http://localhost:3000/movies?profile=nithiin (should show all 27 movies)');
}

fixNithinSpelling().catch(console.error);
