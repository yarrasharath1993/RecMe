/**
 * Check if Teja (director) exists in celebrity database
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCelebrity() {
  console.log('\n🔍 Checking for "Teja" in celebrities table...\n');

  // Check for Teja
  const { data: tejas, error } = await supabase
    .from('celebrities')
    .select('*')
    .or('name_en.ilike.%teja%,slug.eq.teja');

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!tejas || tejas.length === 0) {
    console.log('❌ No celebrity named "Teja" found in database');
    console.log('\n💡 Need to create celebrity profile for director Teja');
    
    // Check movies directed by Teja
    console.log('\n📽️  Movies directed by "Teja":\n');
    const { data: movies } = await supabase
      .from('movies')
      .select('title_en, release_year, director')
      .ilike('director', '%teja%')
      .not('director', 'ilike', '%ravi%')
      .not('director', 'ilike', '%ram%')
      .not('director', 'ilike', '%venkata%')
      .eq('is_published', true)
      .order('release_year', { ascending: false })
      .limit(20);

    if (movies && movies.length > 0) {
      const directors = new Set<string>();
      movies.forEach(m => {
        if (m.director) directors.add(m.director);
      });

      console.log('Unique directors found:');
      directors.forEach(d => {
        const count = movies.filter(m => m.director === d).length;
        console.log(`  - ${d} (${count} movies)`);
      });

      console.log('\nSample movies:');
      movies.slice(0, 10).forEach(m => {
        console.log(`  - ${m.title_en} (${m.release_year}) - Dir: ${m.director}`);
      });
    } else {
      console.log('No movies found');
    }
    
    return;
  }

  console.log(`✅ Found ${tejas.length} celebrity/ies:\n`);
  tejas.forEach((celeb, idx) => {
    console.log(`${idx + 1}. ${celeb.name_en}`);
    console.log(`   Slug: ${celeb.slug}`);
    console.log(`   Primary Role: ${celeb.primary_role}`);
    console.log(`   Birth Year: ${celeb.birth_year || 'N/A'}`);
    console.log();
  });
}

checkCelebrity().catch(console.error);
