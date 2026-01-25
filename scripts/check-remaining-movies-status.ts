import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const movieIds = [
  '6b831ff9-31b6-4999-ae25-878d20083188', // N.T.R: Kathanayukudu
  '1ed8526e-092e-4c3a-bc13-34b92bd70a29', // Annabelle Sethupathi
  '8de2c23e-055a-4087-9860-83a74be23f32', // Oh! Baby
  'c5949c91-7b3a-4278-ae52-178706cdd8a7', // Putham Pudhu Kaalai
  'd6ee6ab1-8d6f-4186-8bae-412ed1f96fc2', // College Kumar
  '00d07415-78b6-4145-8bbd-a592d4d4d8ac', // Rocky: The Revenge
  '3ba14033-504a-42b8-8709-9ed05ec44ba6', // Madhagaja
  '96178d3c-b21f-4894-90a9-c1902e0784e9', // Kalyanam Panni Paar
  'f6069bac-c8e0-43a6-9742-22cd0cb22ac1', // Adarsham
  '285042d3-ebc9-4074-81de-bd9c03eb6014', // Or Iravu
  '500fcf82-76ca-4a65-99a9-89da8e605c60', // Shanti
];

async function checkMovies() {
  console.log('🔍 Checking Status of 11 Movies...\n');
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, language, is_published')
    .in('id', movieIds);
  
  if (error) {
    console.error('❌ Database error:', error);
    return;
  }
  
  console.log(`Found ${movies?.length || 0} movies in database:\n`);
  
  if (movies) {
    movies.forEach(movie => {
      console.log(`📽️  ${movie.title_en} (${movie.release_year})`);
      console.log(`   ID: ${movie.id}`);
      console.log(`   Hero: ${movie.hero || 'MISSING'}`);
      console.log(`   Language: ${movie.language}`);
      console.log(`   Published: ${movie.is_published ? '✅ YES' : '❌ NO'}`);
      console.log('');
    });
  }
  
  // Check total counts
  const { data: totalTelugu } = await supabase
    .from('movies')
    .select('id, is_published', { count: 'exact' })
    .eq('language', 'Telugu');
  
  const published = totalTelugu?.filter(m => m.is_published).length || 0;
  const unpublished = totalTelugu?.filter(m => !m.is_published).length || 0;
  
  console.log('=' + '='.repeat(59));
  console.log(`📊 Total Telugu Movies: ${totalTelugu?.length || 0}`);
  console.log(`   ✅ Published: ${published}`);
  console.log(`   ❌ Unpublished: ${unpublished}`);
  console.log('=' + '='.repeat(59));
}

checkMovies()
  .then(() => {
    console.log('\n✅ Status check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
