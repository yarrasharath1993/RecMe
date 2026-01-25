import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Movies that are ready to publish (excluding 2026 unreleased and problematic ones)
const readyMovies = [
  // Skip: '340635c8-f4a4-410e-aa3f-ed1ba3f314f3' - Jayammu Nischayammu Raa (has index error)
  // Skip: '9b7b604c-6907-4c79-bd7f-dd22d1a3f974' - Devara Part 2 (2026 - unreleased)
  { id: '6dcf4ef0-f5e9-4717-96dd-14513908ce02', title: 'Gopi – Goda Meedha Pilli', year: 2006 },
  { id: 'ff32a1f8-e0a8-41fd-9fe9-5f9ffb94b6fa', title: 'Angala Parameswari', year: 2002 },
  { id: 'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485', title: 'Shri Krishnarjuna Vijayam', year: 1996 },
  { id: '6d038721-fec0-4ba3-a90b-acbb26ef088e', title: 'Raja Muthirai', year: 1995 },
  { id: '86e58157-d33f-48d1-a562-7413efddffd9', title: 'Shubha Lagnam', year: 1994 },
  { id: '9fcf70da-160e-4635-af49-538749378675', title: 'Shubha Muhurtam', year: 1983 },
  { id: '06506eed-73d6-43dd-af5e-66030ac47b65', title: 'Parvathi Parameshwarulu', year: 1981 },
  { id: '90c2fb7e-6c92-45a4-81c4-a6c18b32e742', title: 'Rakta Sambandham', year: 1980 },
  { id: '0a0d8345-02a7-4343-ada9-89ea66b5f912', title: 'Agni Sanskaram', year: 1980 },
];

async function quickPublish() {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 QUICK PUBLISH - READY MOVIES');
  console.log('='.repeat(80) + '\n');
  
  console.log(`Publishing ${readyMovies.length} movies that already have complete data...\n`);
  
  const results = {
    published: [] as string[],
    errors: [] as {title: string, error: string}[],
  };
  
  for (const movie of readyMovies) {
    console.log(`📢 Publishing: ${movie.title} (${movie.year})`);
    
    try {
      const { error } = await supabase
        .from('movies')
        .update({ is_published: true })
        .eq('id', movie.id);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push({ title: movie.title, error: error.message });
        continue;
      }
      
      console.log(`   ✅ Published!`);
      results.published.push(movie.title);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: movie.title, error: String(error) });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));
  console.log(`\n✅ Published: ${results.published.length}/${readyMovies.length}`);
  
  if (results.published.length > 0) {
    console.log('\nSuccessfully Published:');
    results.published.forEach(t => console.log(`   - ${t}`));
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(e => console.log(`   - ${e.title}: ${e.error}`));
  }
  
  // Get updated counts
  const { count: teluguPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const { count: teluguUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 UPDATED STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published:    ${teluguPublished?.toLocaleString()}`);
  console.log(`Telugu Unpublished:  ${teluguUnpublished?.toLocaleString()}`);
  console.log('='.repeat(80));
  
  return results;
}

quickPublish()
  .then((results) => {
    console.log(`\n🎉 Quick publish complete! ${results.published.length} movies published!\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
