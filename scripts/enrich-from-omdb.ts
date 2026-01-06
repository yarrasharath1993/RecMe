/**
 * OMDB ENRICHMENT SCRIPT
 * 
 * Uses the existing OMDB fetcher to enrich movies with:
 * - Director
 * - Hero/Heroine (from actors list)
 * - Poster URL
 * 
 * Works with movies that have IMDB IDs but missing data.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { getOMDbFetcher } from '../lib/sources/fetchers/omdb-fetcher';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface EnrichmentResult {
  processed: number;
  enriched: number;
  heroAdded: number;
  heroineAdded: number;
  directorAdded: number;
  posterAdded: number;
  errors: string[];
}

// Common male Telugu actor first names (to help identify hero vs supporting)
const maleActorIndicators = [
  'Chiranjeevi', 'Nagarjuna', 'Mahesh', 'Pawan', 'Allu', 'Ram', 'NTR', 'Prabhas',
  'Venkatesh', 'Balakrishna', 'Ravi', 'Nani', 'Vijay', 'Sudheer', 'Sai', 'Varun'
];

// Common female Telugu actress first names
const femaleActorIndicators = [
  'Samantha', 'Rashmika', 'Pooja', 'Kajal', 'Anushka', 'Tamanna', 'Shruti',
  'Nayanthara', 'Trisha', 'Sridevi', 'Ramya', 'Lavanya', 'Priyanka', 'Sneha'
];

async function enrichFromOmdb(limit: number = 100, dryRun: boolean = true): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    processed: 0,
    enriched: 0,
    heroAdded: 0,
    heroineAdded: 0,
    directorAdded: 0,
    posterAdded: 0,
    errors: []
  };

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`OMDB ENRICHMENT ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'═'.repeat(70)}\n`);

  const omdb = getOMDbFetcher();

  // Get movies with IMDB ID but missing any data
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, slug, title_en, release_year, imdb_id, hero, heroine, director, poster_url')
    .eq('language', 'Telugu')
    .not('our_rating', 'is', null)
    .not('imdb_id', 'is', null)
    .or('hero.is.null,heroine.is.null,director.is.null,poster_url.is.null')
    .limit(limit);

  if (error) {
    console.error('Error fetching movies:', error);
    return result;
  }

  console.log(`Found ${movies?.length || 0} movies with IMDB ID needing enrichment\n`);

  for (const movie of movies || []) {
    result.processed++;
    console.log(`[${result.processed}/${movies?.length}] ${movie.title_en} (${movie.release_year})`);
    console.log(`   IMDB ID: ${movie.imdb_id}`);

    try {
      const omdbData = await omdb.fetchByImdbId(movie.imdb_id);
      
      if (!omdbData) {
        console.log('   ⚠️  No OMDB data found');
        continue;
      }

      const updates: Record<string, any> = {};

      // Add director if missing
      if (!movie.director && omdbData.director && omdbData.director !== 'N/A') {
        updates.director = omdbData.director;
        result.directorAdded++;
        console.log(`   ✓ Director: ${omdbData.director}`);
      }

      // Add poster if missing (OMDB provides poster URL)
      if (!movie.poster_url && omdbData.imdbId) {
        // Try to construct poster URL from IMDB data
        // OMDB doesn't always return poster, but we can try
        const posterUrl = `https://img.omdbapi.com/?apikey=${process.env.OMDB_API_KEY}&i=${movie.imdb_id}`;
        updates.poster_url = posterUrl;
        result.posterAdded++;
        console.log(`   ✓ Poster URL added`);
      }

      // Extract hero/heroine from actors
      if (omdbData.actors && omdbData.actors.length > 0) {
        // First actor is usually the hero
        if (!movie.hero && omdbData.actors[0]) {
          const firstActor = omdbData.actors[0];
          // Check if it's a male actor (rough heuristic)
          const isMale = maleActorIndicators.some(name => 
            firstActor.toLowerCase().includes(name.toLowerCase())
          ) || !femaleActorIndicators.some(name => 
            firstActor.toLowerCase().includes(name.toLowerCase())
          );
          
          if (isMale) {
            updates.hero = firstActor;
            result.heroAdded++;
            console.log(`   ✓ Hero: ${firstActor}`);
          }
        }

        // Look for heroine in actors list
        if (!movie.heroine) {
          for (const actor of omdbData.actors) {
            const isFemale = femaleActorIndicators.some(name => 
              actor.toLowerCase().includes(name.toLowerCase())
            );
            if (isFemale) {
              updates.heroine = actor;
              result.heroineAdded++;
              console.log(`   ✓ Heroine: ${actor}`);
              break;
            }
          }
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        if (!dryRun) {
          const { error: updateError } = await supabase
            .from('movies')
            .update(updates)
            .eq('id', movie.id);

          if (updateError) {
            result.errors.push(`Failed to update ${movie.title_en}: ${updateError.message}`);
            console.log(`   ✗ Update failed: ${updateError.message}`);
          } else {
            result.enriched++;
            console.log(`   ✓ Updated ${Object.keys(updates).length} fields`);
          }
        } else {
          result.enriched++;
          console.log(`   Would update: ${Object.keys(updates).join(', ')}`);
        }
      } else {
        console.log('   No new data to add');
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Error processing ${movie.title_en}: ${errorMsg}`);
      console.log(`   ✗ Error: ${errorMsg}`);
    }

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`ENRICHMENT SUMMARY ${dryRun ? '(DRY RUN)' : '(COMPLETED)'}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Processed:        ${result.processed}`);
  console.log(`  Enriched:         ${result.enriched}`);
  console.log(`  Heroes added:     ${result.heroAdded}`);
  console.log(`  Heroines added:   ${result.heroineAdded}`);
  console.log(`  Directors added:  ${result.directorAdded}`);
  console.log(`  Posters added:    ${result.posterAdded}`);
  if (result.errors.length > 0) {
    console.log(`  Errors:           ${result.errors.length}`);
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
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

  await enrichFromOmdb(limit, dryRun);
}

main().catch(console.error);
