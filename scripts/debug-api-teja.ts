/**
 * Debug what the API is doing for "teja" slug
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeSlugForSearch(slug: string): string {
  return `%${slug.replace(/-/g, '%')}%`;
}

async function debugTejaAPI() {
  const slug = 'teja';
  
  console.log('\n🔍 Debugging API for slug:', slug);
  console.log('='.repeat(60));

  // Step 1: Check celebrity table
  console.log('\n1️⃣  Checking celebrities table...');
  
  const { data: exactMatch } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', slug)
    .single();
  
  console.log('   Exact match (slug =', slug + '):', exactMatch?.name_en || 'NOT FOUND');
  
  const { data: prefixMatch } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', `celeb-${slug}`)
    .single();
  
  console.log('   Prefix match (slug = celeb-' + slug + '):', prefixMatch?.name_en || 'NOT FOUND');

  // Step 2: Search in movies
  console.log('\n2️⃣  Searching in movies...');
  
  const searchPattern = normalizeSlugForSearch(slug);
  console.log('   Search pattern:', searchPattern);
  
  const { data: sampleMovies } = await supabase
    .from('movies')
    .select('hero, heroine, director, music_director, producer, writer, title_en')
    .eq('is_published', true)
    .or(`hero.ilike.${searchPattern},heroine.ilike.${searchPattern},director.ilike.${searchPattern},music_director.ilike.${searchPattern},producer.ilike.${searchPattern},writer.ilike.${searchPattern}`)
    .limit(10);

  console.log('   Found', sampleMovies?.length || 0, 'sample movies');

  // Step 3: Test matching logic
  console.log('\n3️⃣  Testing matching logic...');
  
  const fields = ['director', 'music_director', 'writer', 'hero', 'heroine', 'producer'];
  const slugNormalized = slug.toLowerCase().replace(/-/g, '');
  console.log('   Normalized slug:', slugNormalized);

  let personName = null;

  // Phase 1: Exact match
  console.log('\n   Phase 1: Exact match');
  for (const movie of sampleMovies || []) {
    for (const field of fields) {
      const value = movie[field as keyof typeof movie] as string;
      if (value) {
        const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
        if (valueNormalized === slugNormalized) {
          console.log('   ✅ EXACT MATCH:', field, '=', value, 'in', movie.title_en);
          personName = value;
          break;
        }
      }
    }
    if (personName) break;
  }

  // Phase 2: Word boundary
  if (!personName) {
    console.log('\n   Phase 2: Word boundary match');
    for (const movie of sampleMovies || []) {
      for (const field of fields) {
        const value = movie[field as keyof typeof movie] as string;
        if (value) {
          const valueNormalized = value.toLowerCase().replace(/[^a-z0-9]+/g, '');
          if (valueNormalized.startsWith(slugNormalized) || valueNormalized.endsWith(slugNormalized)) {
            console.log('   ✅ BOUNDARY MATCH:', field, '=', value, 'in', movie.title_en);
            personName = value;
            break;
          }
        }
      }
      if (personName) break;
    }
  }

  console.log('\n4️⃣  Resolved person name:', personName || 'NOT FOUND');

  // Step 4: Check what movies would be fetched
  if (personName) {
    console.log('\n5️⃣  Fetching movies for:', personName);
    
    const { data: mainMovies } = await supabase
      .from('movies')
      .select('id, title_en, release_year, director, hero, heroine')
      .eq('is_published', true)
      .eq('language', 'Telugu')
      .or(`hero.ilike.%${personName}%,heroine.ilike.%${personName}%,director.ilike.%${personName}%,music_director.ilike.%${personName}%,producer.ilike.%${personName}%,writer.ilike.%${personName}%`)
      .limit(10);

    console.log('   Found', mainMovies?.length || 0, 'movies');
    
    const directorMovies = mainMovies?.filter(m => m.director?.toLowerCase().includes(personName!.toLowerCase()));
    const heroMovies = mainMovies?.filter(m => m.hero?.toLowerCase().includes(personName!.toLowerCase()));
    
    console.log('   - As director:', directorMovies?.length || 0);
    console.log('   - As hero:', heroMovies?.length || 0);

    if (directorMovies && directorMovies.length > 0) {
      console.log('\n   Sample director movies:');
      directorMovies.slice(0, 3).forEach(m => {
        console.log('     -', m.title_en, '(' + m.release_year + ')');
      });
    }

    if (heroMovies && heroMovies.length > 0) {
      console.log('\n   Sample hero movies:');
      heroMovies.slice(0, 3).forEach(m => {
        console.log('     -', m.title_en, '(' + m.release_year + ')');
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Debug complete\n');
}

debugTejaAPI().catch(console.error);
