/**
 * Debug specific movie image detection
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ACTOR_NAME_PATTERNS = [
  'vanisri', 'krishna', 'chiranjeevi', 'balakrishna', 'nagarjuna',
  'venkatesh', 'mahesh', 'pawan', 'allu', 'ramcharan', 'ntr',
  'savitri', 'jayalalitha', 'jamuna', 'rajasree', 'vijayashanti',
  'soundarya', 'simran', 'sangeetha', 'anjali', 'samantha',
  'actor', 'actress', 'person', 'portrait', 'headshot',
  'celebrity', 'star', 'artist', 'profile'
];

async function debugMovie(slug: string) {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!movie) {
    console.log('Movie not found');
    return;
  }

  console.log('\n=== Movie Data ===');
  console.log('Title:', movie.title_en);
  console.log('Year:', movie.release_year);
  console.log('Hero:', movie.hero);
  console.log('Heroine:', movie.heroine);
  console.log('Poster URL:', movie.poster_url);

  if (movie.poster_url) {
    const url = movie.poster_url;
    const urlLower = url.toLowerCase();
    const filename = url.split('/').pop()?.toLowerCase().replace(/\.(jpg|jpeg|png|webp)$/, '') || '';

    console.log('\n=== URL Analysis ===');
    console.log('URL (lowercase):', urlLower);
    console.log('Filename (no extension):', filename);
    console.log('Contains wikipedia.org:', urlLower.includes('wikipedia.org/'));

    console.log('\n=== Pattern Matching ===');
    for (const pattern of ACTOR_NAME_PATTERNS) {
      const inUrl = urlLower.includes(pattern);
      const inFilename = filename.includes(pattern);
      
      if (inUrl || inFilename) {
        console.log(`✅ Pattern "${pattern}" found:`);
        if (inUrl) console.log('   - In URL');
        if (inFilename) console.log('   - In filename');
      }
    }

    // Test the detection logic
    const hasActorName = ACTOR_NAME_PATTERNS.some(pattern => {
      return urlLower.includes(pattern) || filename.includes(pattern);
    });

    console.log('\n=== Detection Result ===');
    console.log('Has actor name pattern:', hasActorName);
    console.log('Is Wikipedia URL:', urlLower.includes('wikipedia.org/'));
    console.log('Should be flagged:', urlLower.includes('wikipedia.org/') && hasActorName);
  }
}

const slug = process.argv[2] || 'pellam-chatu-mogudu-1992';
debugMovie(slug).catch(console.error);
