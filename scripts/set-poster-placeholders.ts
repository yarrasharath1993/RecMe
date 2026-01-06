/**
 * SET POSTER PLACEHOLDERS SCRIPT
 * 
 * For movies without posters, set era-based placeholder URLs.
 * This allows the UI to show appropriate placeholder images instead of broken images.
 * 
 * Placeholder URL pattern: /images/placeholders/era-{era}.png
 * Where era can be: golden (pre-1970), classic (1970-1989), modern (1990-2009), contemporary (2010+)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PlaceholderResult {
  processed: number;
  updated: number;
  byEra: Record<string, number>;
  errors: string[];
}

function getEra(year: number | null): string {
  if (!year) return 'contemporary';
  if (year < 1970) return 'golden';
  if (year < 1990) return 'classic';
  if (year < 2010) return 'modern';
  return 'contemporary';
}

function getPlaceholderUrl(era: string): string {
  // Use a consistent placeholder URL pattern
  return `/images/placeholders/telugu-${era}.png`;
}

async function setPosterPlaceholders(dryRun: boolean = true): Promise<PlaceholderResult> {
  const result: PlaceholderResult = {
    processed: 0,
    updated: 0,
    byEra: { golden: 0, classic: 0, modern: 0, contemporary: 0 },
    errors: []
  };

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SET POSTER PLACEHOLDERS ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'═'.repeat(70)}\n`);

  // Get count first
  const { count: totalCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('language', 'Telugu')
    .not('our_rating', 'is', null)
    .is('poster_url', null);

  console.log(`Total movies without posters: ${totalCount}\n`);

  // Get movies without poster URLs (fetch in batches to avoid limit)
  const allMovies: any[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (offset < (totalCount || 0)) {
    const { data: batch, error: batchError } = await supabase
      .from('movies')
      .select('id, slug, title_en, release_year')
      .eq('language', 'Telugu')
      .not('our_rating', 'is', null)
      .is('poster_url', null)
      .order('release_year', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (batchError) {
      console.error('Error fetching batch:', batchError);
      break;
    }
    
    allMovies.push(...(batch || []));
    offset += batchSize;
  }

  const movies = allMovies;
  const error = null;

  if (error) {
    console.error('Error fetching movies:', error);
    return result;
  }

  console.log(`Found ${movies?.length || 0} movies without posters\n`);

  // Group by era for reporting
  const byEra: Record<string, typeof movies> = {
    golden: [],
    classic: [],
    modern: [],
    contemporary: []
  };

  for (const movie of movies || []) {
    const era = getEra(movie.release_year);
    byEra[era].push(movie);
  }

  console.log('Distribution by Era:');
  console.log(`  Golden (pre-1970):      ${byEra.golden.length} movies`);
  console.log(`  Classic (1970-1989):    ${byEra.classic.length} movies`);
  console.log(`  Modern (1990-2009):     ${byEra.modern.length} movies`);
  console.log(`  Contemporary (2010+):   ${byEra.contemporary.length} movies`);
  console.log('');

  // Update each movie with era-based placeholder
  for (const era of Object.keys(byEra)) {
    const eraMovies = byEra[era];
    if (eraMovies.length === 0) continue;

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`Setting placeholders for ${era.toUpperCase()} era (${eraMovies.length} movies)`);
    console.log(`${'─'.repeat(50)}\n`);

    const placeholderUrl = getPlaceholderUrl(era);
    console.log(`Placeholder URL: ${placeholderUrl}`);
    console.log('Sample movies:');
    
    // Show sample of 5 movies per era
    for (const movie of eraMovies.slice(0, 5)) {
      console.log(`  • ${movie.title_en} (${movie.release_year || 'unknown'})`);
    }
    if (eraMovies.length > 5) {
      console.log(`  ... and ${eraMovies.length - 5} more`);
    }

    if (!dryRun) {
      // Batch update all movies in this era
      const movieIds = eraMovies.map(m => m.id);
      
      const { error: updateError } = await supabase
        .from('movies')
        .update({ poster_url: placeholderUrl })
        .in('id', movieIds);

      if (updateError) {
        result.errors.push(`Failed to update ${era} era movies: ${updateError.message}`);
        console.log(`   ✗ Update failed: ${updateError.message}`);
      } else {
        result.updated += eraMovies.length;
        result.byEra[era] = eraMovies.length;
        console.log(`   ✓ Updated ${eraMovies.length} movies`);
      }
    } else {
      result.updated += eraMovies.length;
      result.byEra[era] = eraMovies.length;
    }

    result.processed += eraMovies.length;
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SUMMARY ${dryRun ? '(DRY RUN)' : '(COMPLETED)'}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Total processed:    ${result.processed}`);
  console.log(`  Placeholders set:   ${result.updated}`);
  console.log('  By Era:');
  console.log(`    Golden:           ${result.byEra.golden}`);
  console.log(`    Classic:          ${result.byEra.classic}`);
  console.log(`    Modern:           ${result.byEra.modern}`);
  console.log(`    Contemporary:     ${result.byEra.contemporary}`);
  if (result.errors.length > 0) {
    console.log(`  Errors:             ${result.errors.length}`);
  }
  console.log('');

  if (dryRun) {
    console.log('Run with --execute to apply these changes.\n');
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  await setPosterPlaceholders(dryRun);
}

main().catch(console.error);

