import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MovieCorrection {
  id: string;
  title: string;
  year: number;
  action: 'PUBLISH' | 'FIX+PUBLISH' | 'FIX_LANG' | 'SKIP';
  updates?: {
    hero?: string;
    language?: string;
  };
  notes: string;
}

const corrections: MovieCorrection[] = [
  // FIX + PUBLISH (2 movies)
  {
    id: '6b831ff9-31b6-4999-ae25-878d20083188',
    title: 'N.T.R: Kathanayukudu',
    year: 2019,
    action: 'FIX+PUBLISH',
    updates: { hero: 'Nandamuri Balakrishna' },
    notes: 'Added Balakrishna as hero',
  },
  {
    id: '1ed8526e-092e-4c3a-bc13-34b92bd70a29',
    title: 'Annabelle Sethupathi',
    year: 2021,
    action: 'FIX_LANG',
    updates: { language: 'Tamil' },
    notes: 'Corrected language to Tamil (horror-comedy)',
  },
  
  // PUBLISH AS-IS (5 good quality movies)
  {
    id: '8de2c23e-055a-4087-9860-83a74be23f32',
    title: 'Oh! Baby',
    year: 2019,
    action: 'FIX+PUBLISH',
    updates: { hero: 'Samantha Ruth Prabhu' },
    notes: 'Added Samantha as hero',
  },
  {
    id: 'c5949c91-7b3a-4278-ae52-178706cdd8a7',
    title: 'Putham Pudhu Kaalai',
    year: 2020,
    action: 'PUBLISH',
    notes: 'Good quality - ready to publish',
  },
  {
    id: 'd6ee6ab1-8d6f-4186-8bae-412ed1f96fc2',
    title: 'College Kumar',
    year: 2020,
    action: 'PUBLISH',
    notes: 'Good quality - ready to publish',
  },
  {
    id: '00d07415-78b6-4145-8bbd-a592d4d4d8ac',
    title: 'Rocky: The Revenge',
    year: 2019,
    action: 'PUBLISH',
    notes: 'Good quality - ready to publish',
  },
  {
    id: '3ba14033-504a-42b8-8709-9ed05ec44ba6',
    title: 'Madhagaja',
    year: 2021,
    action: 'PUBLISH',
    notes: 'Good quality - ready to publish',
  },
  
  // VINTAGE FILMS (3 movies)
  {
    id: '96178d3c-b21f-4894-90a9-c1902e0784e9',
    title: 'Kalyanam Panni Paar',
    year: 1952,
    action: 'PUBLISH',
    notes: 'Vintage film - historical preservation',
  },
  {
    id: 'f6069bac-c8e0-43a6-9742-22cd0cb22ac1',
    title: 'Adarsham',
    year: 1952,
    action: 'PUBLISH',
    notes: 'Vintage ANR classic',
  },
  {
    id: '285042d3-ebc9-4074-81de-bd9c03eb6014',
    title: 'Or Iravu',
    year: 1951,
    action: 'PUBLISH',
    notes: 'Vintage ANR classic',
  },
  
  // SKIP (1 movie)
  {
    id: '500fcf82-76ca-4a65-99a9-89da8e605c60',
    title: 'Shanti',
    year: 1952,
    action: 'SKIP',
    notes: 'Data unclear - multiple films with same name',
  },
];

async function applyCorrections() {
  console.log('🚀 Applying Final 11 Movie Corrections (by ID)...\n');
  
  const results = {
    fixed: [] as string[],
    published: [] as string[],
    skipped: [] as string[],
    errors: [] as { title: string; error: string }[],
  };
  
  for (const correction of corrections) {
    console.log(`\n📽️  Processing: ${correction.title} (${correction.year})`);
    console.log(`   ID: ${correction.id}`);
    console.log(`   Action: ${correction.action}`);
    
    try {
      // Find the movie by ID
      const { data: movie, error: findError } = await supabase
        .from('movies')
        .select('id, title_en, release_year, hero, language, is_published')
        .eq('id', correction.id)
        .single();
      
      if (findError || !movie) {
        console.log(`   ❌ Not found in database`);
        results.errors.push({ title: correction.title, error: 'Not found' });
        continue;
      }
      
      console.log(`   ✓ Found: ${movie.title_en}`);
      
      // Handle different actions
      if (correction.action === 'SKIP') {
        console.log(`   ⏭️  Skipped (${correction.notes})`);
        results.skipped.push(correction.title);
        continue;
      }
      
      // Apply updates if needed
      if (correction.updates && (correction.action === 'FIX+PUBLISH' || correction.action === 'FIX_LANG')) {
        const { error: updateError } = await supabase
          .from('movies')
          .update(correction.updates)
          .eq('id', movie.id);
        
        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          results.errors.push({ title: correction.title, error: updateError.message });
          continue;
        }
        
        const updatedFields = Object.keys(correction.updates).join(', ');
        console.log(`   ✅ Updated: ${updatedFields}`);
        results.fixed.push(`${correction.title} (${updatedFields})`);
      }
      
      // Publish the movie (unless it's just FIX_LANG)
      if (correction.action !== 'FIX_LANG') {
        const { error: publishError } = await supabase
          .from('movies')
          .update({ is_published: true })
          .eq('id', movie.id);
        
        if (publishError) {
          console.log(`   ❌ Publish failed: ${publishError.message}`);
          results.errors.push({ title: correction.title, error: publishError.message });
          continue;
        }
        
        console.log(`   ✅ Published!`);
        results.published.push(correction.title);
      } else {
        console.log(`   ✅ Language fixed (not publishing)`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title, error: String(error) });
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n✅ Fixed & Updated: ${results.fixed.length}`);
  results.fixed.forEach(item => console.log(`   - ${item}`));
  
  console.log(`\n📢 Published: ${results.published.length}`);
  results.published.forEach(item => console.log(`   - ${item}`));
  
  console.log(`\n⏭️  Skipped: ${results.skipped.length}`);
  results.skipped.forEach(item => console.log(`   - ${item}`));
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(item => console.log(`   - ${item.title}: ${item.error}`));
  }
  
  // Get final count
  const { data: totalPublished } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const { data: totalUnpublished } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 TOTAL TELUGU MOVIES PUBLISHED: ${totalPublished?.length || 'unknown'}`);
  console.log(`📝 TOTAL TELUGU MOVIES UNPUBLISHED: ${totalUnpublished?.length || 'unknown'}`);
  console.log('='.repeat(60));
  
  return results;
}

applyCorrections()
  .then(() => {
    console.log('\n✅ All corrections applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
