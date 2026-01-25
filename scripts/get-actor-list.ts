#!/usr/bin/env npx tsx
/**
 * Get list of all actors from database sorted by film count
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: movies } = await supabase
    .from('movies')
    .select('hero, heroine')
    .eq('language', 'Telugu')
    .not('hero', 'is', null)
    .not('hero', 'eq', 'Unknown');

  // Extract unique actors and count films
  const actorCounts: Record<string, number> = {};
  
  for (const movie of movies || []) {
    if (movie.hero && movie.hero !== 'Unknown') {
      const heroes = movie.hero.split(',').map(h => h.trim());
      heroes.forEach(h => {
        if (h) actorCounts[h] = (actorCounts[h] || 0) + 1;
      });
    }
    if (movie.heroine && movie.heroine !== 'Unknown') {
      const heroines = movie.heroine.split(',').map(h => h.trim());
      heroines.forEach(h => {
        if (h) actorCounts[h] = (actorCounts[h] || 0) + 1;
      });
    }
  }

  // Sort by film count (descending)
  const sortedActors = Object.entries(actorCounts)
    .filter(([_, count]) => count >= 3) // Only actors with 3+ films
    .sort((a, b) => b[1] - a[1]);

  console.log('Top 50 Actors by Film Count:');
  console.log('=============================\n');
  sortedActors.slice(0, 50).forEach(([actor, count], i) => {
    console.log(`${(i+1).toString().padStart(2)}. ${actor.padEnd(35)} - ${count} films`);
  });
  
  console.log(`\n\nTotal actors with 3+ films: ${sortedActors.length}`);
  console.log(`Total unique actors: ${Object.keys(actorCounts).length}`);
  
  // Output top 30 as comma-separated list for batch processing
  console.log(`\n\nTop 30 for batch processing:`);
  const top30 = sortedActors.slice(0, 30).map(([actor]) => actor);
  console.log(top30.join('", "'));
}

main().catch(console.error);
