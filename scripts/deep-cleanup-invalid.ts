/**
 * DEEP CLEANUP SCRIPT
 * 
 * Cleans up invalid data entries in the movies table:
 * 1. Deletes entries with no data at all (no hero, heroine, director, poster)
 * 2. Clears production house names incorrectly stored as hero
 * 3. Clears cast lists incorrectly stored as director
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Production company patterns (stored incorrectly as hero)
const productionPatterns = [
  /films?$/i, /studios?$/i, /productions?$/i, /entertainments?$/i,
  /creations?$/i, /pictures?$/i, /media$/i, /movies?$/i, /factory$/i,
  /works$/i, /banner$/i
];

interface CleanupResult {
  deleted: string[];
  heroCleared: string[];
  directorCleared: string[];
  errors: string[];
}

async function deepCleanup(dryRun: boolean = true): Promise<CleanupResult> {
  const result: CleanupResult = {
    deleted: [],
    heroCleared: [],
    directorCleared: [],
    errors: []
  };

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`DEEP DATA CLEANUP ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'═'.repeat(70)}\n`);

  // Get all Telugu movies with our_rating
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, hero, heroine, director, poster_url')
    .eq('language', 'Telugu')
    .not('our_rating', 'is', null)
    .order('title_en');

  if (error) {
    console.error('Error fetching movies:', error);
    return result;
  }

  console.log(`Total Telugu movies to analyze: ${movies?.length || 0}\n`);

  const toDelete: typeof movies = [];
  const toClearHero: typeof movies = [];
  const toClearDirector: typeof movies = [];

  for (const movie of movies || []) {
    const title = movie.title_en || '';
    const hero = movie.hero || '';
    const director = movie.director || '';

    // Check if entry has no data at all
    const hasNoData = !movie.hero && !movie.heroine && !movie.director && !movie.poster_url;
    if (hasNoData) {
      toDelete.push(movie);
      continue;
    }

    // Check if hero field contains a production house
    const heroIsProduction = productionPatterns.some(p => p.test(hero));
    if (heroIsProduction) {
      toClearHero.push(movie);
    }

    // Check for invalid directors (too long, contains commas = cast list)
    if (director && (director.length > 50 || director.includes(','))) {
      toClearDirector.push(movie);
    }
  }

  // === PHASE 1: DELETE ENTRIES WITH NO DATA ===
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`PHASE 1: DELETE ENTRIES WITH NO DATA (${toDelete.length} entries)`);
  console.log(`${'─'.repeat(50)}`);

  for (const movie of toDelete) {
    console.log(`  • ${movie.title_en} (${movie.release_year})`);
    
    if (!dryRun) {
      const { error: deleteError } = await supabase
        .from('movies')
        .delete()
        .eq('id', movie.id);

      if (deleteError) {
        result.errors.push(`Failed to delete ${movie.title_en}: ${deleteError.message}`);
      } else {
        result.deleted.push(movie.title_en);
      }
    } else {
      result.deleted.push(movie.title_en);
    }
  }

  // === PHASE 2: CLEAR PRODUCTION HOUSE FROM HERO FIELD ===
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`PHASE 2: CLEAR PRODUCTION HOUSES FROM HERO (${toClearHero.length} entries)`);
  console.log(`${'─'.repeat(50)}`);

  for (const movie of toClearHero) {
    console.log(`  • ${movie.title_en} (${movie.release_year})`);
    console.log(`      Was: "${movie.hero}"`);
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ hero: null })
        .eq('id', movie.id);

      if (updateError) {
        result.errors.push(`Failed to clear hero for ${movie.title_en}: ${updateError.message}`);
      } else {
        result.heroCleared.push(movie.title_en);
      }
    } else {
      result.heroCleared.push(movie.title_en);
    }
  }

  // === PHASE 3: CLEAR INVALID DIRECTORS (CAST LISTS) ===
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`PHASE 3: CLEAR INVALID DIRECTORS (${toClearDirector.length} entries)`);
  console.log(`${'─'.repeat(50)}`);

  for (const movie of toClearDirector) {
    console.log(`  • ${movie.title_en} (${movie.release_year})`);
    console.log(`      Was: "${movie.director?.substring(0, 60)}${(movie.director?.length || 0) > 60 ? '...' : ''}"`);
    
    if (!dryRun) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ director: null })
        .eq('id', movie.id);

      if (updateError) {
        result.errors.push(`Failed to clear director for ${movie.title_en}: ${updateError.message}`);
      } else {
        result.directorCleared.push(movie.title_en);
      }
    } else {
      result.directorCleared.push(movie.title_en);
    }
  }

  // === SUMMARY ===
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`CLEANUP SUMMARY ${dryRun ? '(DRY RUN - no changes made)' : '(COMPLETED)'}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Entries deleted:        ${result.deleted.length}`);
  console.log(`  Hero fields cleared:    ${result.heroCleared.length}`);
  console.log(`  Director fields cleared: ${result.directorCleared.length}`);
  if (result.errors.length > 0) {
    console.log(`  Errors:                 ${result.errors.length}`);
    result.errors.forEach(e => console.log(`    - ${e}`));
  }
  console.log('');

  if (dryRun) {
    console.log('Run with --execute to apply these changes.');
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  await deepCleanup(dryRun);
}

main().catch(console.error);


