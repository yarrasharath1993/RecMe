import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { detectSpellingDuplicates } from './lib/filmography-cross-validator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixDuplicates() {
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero, tmdb_id, slug, poster_url, is_published')
    .ilike('hero', '%Chiranjeevi%');

  const dupes = detectSpellingDuplicates(movies as any);
  
  console.log('\n=== FIXING CHIRANJEEVI SPELLING DUPLICATES ===\n');
  
  let fixed = 0;
  let errors: string[] = [];
  
  for (let i = 0; i < dupes.length; i++) {
    const d = dupes[i];
    
    // Determine which one to keep based on data quality
    // Score: +3 for TMDB ID, +2 for poster, +1 for published
    const score1 = (d.movie1.tmdb_id ? 3 : 0) + 
                   (d.movie1.poster_url && !d.movie1.poster_url.includes('placeholder') ? 2 : 0) +
                   (d.movie1.is_published ? 1 : 0);
    const score2 = (d.movie2.tmdb_id ? 3 : 0) + 
                   (d.movie2.poster_url && !d.movie2.poster_url.includes('placeholder') ? 2 : 0) +
                   (d.movie2.is_published ? 1 : 0);
    
    // If scores equal, prefer shorter/simpler title (likely canonical)
    const [keep, remove] = score1 >= score2 ? [d.movie1, d.movie2] : [d.movie2, d.movie1];
    
    console.log(`${i + 1}. Keeping: "${keep.title_en}" (${keep.slug})`);
    console.log(`   Deleting: "${remove.title_en}" (${remove.slug})`);
    
    try {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', remove.id);
      
      if (error) {
        errors.push(`Failed to delete ${remove.slug}: ${error.message}`);
        console.log(`   ❌ Error: ${error.message}`);
      } else {
        fixed++;
        console.log(`   ✓ Deleted successfully`);
      }
    } catch (e: any) {
      errors.push(`Exception deleting ${remove.slug}: ${e.message}`);
      console.log(`   ❌ Exception: ${e.message}`);
    }
    
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  console.log(`Fixed: ${fixed}/${dupes.length} duplicates`);
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  
  // Get new count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Chiranjeevi%');
  
  console.log(`\nNew Chiranjeevi movie count: ${count}`);
}

fixDuplicates();
