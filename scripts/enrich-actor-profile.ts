#!/usr/bin/env npx tsx
/**
 * ACTOR PROFILE ENRICHMENT SCRIPT
 *
 * Enriches actor profiles with biography, profile images, and career data
 * using multi-source orchestrator for high-confidence data.
 *
 * Features:
 * - Multi-source biography (TMDB, Wikipedia, Wikidata)
 * - Profile image fetching (TMDB, Wikipedia)
 * - Career statistics calculation
 * - Governance integration for trust scoring
 * - TURBO/FAST mode support
 *
 * Usage:
 *   npx tsx scripts/enrich-actor-profile.ts --actor="Actor Name" --execute
 *   npx tsx scripts/enrich-actor-profile.ts --all --turbo --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import {
  fetchActorBiography,
  fetchActorProfileImage,
  type ActorBiography,
} from './lib/multi-source-orchestrator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// COMMAND LINE ARGUMENTS
// ============================================================

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ACTOR = getArg('actor', '');
const ALL = hasFlag('all');
const EXECUTE = hasFlag('execute');
const DRY = hasFlag('dry');
const TURBO = hasFlag('turbo');
const FAST = hasFlag('fast');
const LIMIT = parseInt(getArg('limit', '100'));

// ============================================================
// INTERFACES
// ============================================================

interface ProfileEnrichmentResult {
  actor_name: string;
  status: 'success' | 'partial' | 'failed';
  biography_updated: boolean;
  image_updated: boolean;
  statistics_updated: boolean;
  confidence: number;
  sources_used: string[];
  errors: string[];
}

// ============================================================
// CAREER STATISTICS CALCULATION
// ============================================================

async function calculateCareerStatistics(actorName: string): Promise<{
  total_films: number;
  debut_year: number | null;
  debut_film: string | null;
  years_active: number | null;
  genres_worked: string[];
  frequent_directors: Array<{ name: string; count: number }>;
  frequent_music_directors: Array<{ name: string; count: number }>;
}> {
  try {
    // Fetch all films for this actor
    const { data: films, error } = await supabase
      .from('movies')
      .select('*')
      .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%,supporting_cast.cs.{${actorName}}`)
      .eq('language', 'Telugu')
      .order('release_year', { ascending: true });

    if (error) throw error;

    if (!films || films.length === 0) {
      return {
        total_films: 0,
        debut_year: null,
        debut_film: null,
        years_active: null,
        genres_worked: [],
        frequent_directors: [],
        frequent_music_directors: [],
      };
    }

    // Total films
    const total_films = films.length;

    // Debut information
    const debutFilm = films[0];
    const debut_year = debutFilm.release_year;
    const debut_film = debutFilm.title_en;

    // Years active
    const latestYear = films[films.length - 1].release_year;
    const years_active = latestYear - debut_year + 1;

    // Genres worked
    const genresSet = new Set<string>();
    films.forEach((film) => {
      if (film.genres && Array.isArray(film.genres)) {
        film.genres.forEach((genre: string) => genresSet.add(genre));
      }
    });
    const genres_worked = Array.from(genresSet);

    // Frequent directors
    const directorCounts = new Map<string, number>();
    films.forEach((film) => {
      if (film.director && film.director !== 'Unknown') {
        directorCounts.set(film.director, (directorCounts.get(film.director) || 0) + 1);
      }
    });
    const frequent_directors = Array.from(directorCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Frequent music directors
    const musicDirectorCounts = new Map<string, number>();
    films.forEach((film) => {
      if (film.music_director) {
        musicDirectorCounts.set(
          film.music_director,
          (musicDirectorCounts.get(film.music_director) || 0) + 1
        );
      }
    });
    const frequent_music_directors = Array.from(musicDirectorCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total_films,
      debut_year,
      debut_film,
      years_active,
      genres_worked,
      frequent_directors,
      frequent_music_directors,
    };
  } catch (error) {
    console.error(`Error calculating statistics for ${actorName}:`, error);
    return {
      total_films: 0,
      debut_year: null,
      debut_film: null,
      years_active: null,
      genres_worked: [],
      frequent_directors: [],
      frequent_music_directors: [],
    };
  }
}

// ============================================================
// PROFILE ENRICHMENT
// ============================================================

async function enrichActorProfile(actorName: string): Promise<ProfileEnrichmentResult> {
  const result: ProfileEnrichmentResult = {
    actor_name: actorName,
    status: 'failed',
    biography_updated: false,
    image_updated: false,
    statistics_updated: false,
    confidence: 0,
    sources_used: [],
    errors: [],
  };

  try {
    console.log(chalk.cyan(`\n📝 Enriching profile for: ${chalk.bold(actorName)}`));

    // 1. Fetch biography from multiple sources
    console.log(chalk.gray('  Fetching biography from TMDB, Wikipedia, Wikidata...'));
    const biographyResult = await fetchActorBiography(actorName);

    if (biographyResult.sources.length > 0) {
      console.log(chalk.green(`  ✓ Biography found (confidence: ${(biographyResult.confidence * 100).toFixed(0)}%)`));
      console.log(chalk.gray(`    Sources: ${biographyResult.sources.map((s) => s.sourceId).join(', ')}`));
      result.sources_used.push(...biographyResult.sources.map((s) => s.sourceId));
    } else {
      console.log(chalk.yellow('  ⚠ No biography found'));
      result.errors.push('No biography sources available');
    }

    // 2. Fetch profile image
    console.log(chalk.gray('  Fetching profile image from TMDB, Wikipedia...'));
    const imageResult = await fetchActorProfileImage(actorName);

    if (imageResult.image_url) {
      console.log(chalk.green(`  ✓ Profile image found (confidence: ${(imageResult.confidence * 100).toFixed(0)}%)`));
      console.log(chalk.gray(`    Sources: ${imageResult.sources.map((s) => s.sourceId).join(', ')}`));
      result.sources_used.push(...imageResult.sources.map((s) => s.sourceId));
    } else {
      console.log(chalk.yellow('  ⚠ No profile image found'));
      result.errors.push('No profile image sources available');
    }

    // 3. Calculate career statistics
    console.log(chalk.gray('  Calculating career statistics from database...'));
    const statistics = await calculateCareerStatistics(actorName);

    if (statistics.total_films > 0) {
      console.log(chalk.green(`  ✓ Statistics calculated: ${statistics.total_films} films`));
      console.log(chalk.gray(`    Debut: ${statistics.debut_film} (${statistics.debut_year})`));
      console.log(chalk.gray(`    Genres: ${statistics.genres_worked.slice(0, 5).join(', ')}`));
    } else {
      console.log(chalk.yellow('  ⚠ No films found in database'));
      result.errors.push('No films found for statistics');
    }

    // 4. Compute trust score (governance integration)
    const tier1Sources = result.sources_used.filter((s) => ['tmdb', 'wikipedia'].includes(s)).length;
    const tier2Sources = result.sources_used.filter((s) => ['wikidata'].includes(s)).length;
    const sourceQuality = tier1Sources * 0.5 + tier2Sources * 0.3;

    const fieldCompleteness =
      (biographyResult.biography_en ? 1 : 0) +
      (biographyResult.birth_date ? 1 : 0) +
      (imageResult.image_url ? 1 : 0) +
      (statistics.total_films > 0 ? 1 : 0);
    const completenessScore = fieldCompleteness / 4;

    const trustScore = Math.round((biographyResult.confidence * 0.4 + sourceQuality * 0.3 + completenessScore * 0.3) * 100);

    const confidenceTier =
      trustScore >= 90
        ? 'verified'
        : trustScore >= 75
          ? 'high'
          : trustScore >= 60
            ? 'medium'
            : trustScore >= 40
              ? 'low'
              : 'unverified';

    result.confidence = trustScore;

    // 5. Execute: Update or insert profile
    if (EXECUTE && !DRY) {
      console.log(chalk.cyan('\n  💾 Updating database...'));

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('actor_profiles')
        .select('id, name')
        .eq('name', actorName)
        .single();

      const profileData = {
        name: actorName,
        slug: actorName.toLowerCase().replace(/\s+/g, '-'),
        biography_en: biographyResult.biography_en || null,
        birth_date: biographyResult.birth_date || null,
        birth_place: biographyResult.birth_place || null,
        profile_image_url: imageResult.image_url || null,
        total_films: statistics.total_films,
        debut_year: statistics.debut_year,
        debut_film: statistics.debut_film,
        years_active: statistics.years_active,
        genres_worked: statistics.genres_worked,
        career_highlights:
          statistics.frequent_directors.length > 0
            ? [
                {
                  type: 'frequent_collaborators',
                  directors: statistics.frequent_directors,
                  music_directors: statistics.frequent_music_directors,
                },
              ]
            : [],
        biography_sources: result.sources_used,
        trust_score: trustScore,
        confidence_tier: confidenceTier,
        data_confidence: biographyResult.confidence,
        last_verified_at: new Date().toISOString(),
      };

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('actor_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error(chalk.red(`  ✗ Error updating profile: ${updateError.message}`));
          result.errors.push(`Database update error: ${updateError.message}`);
        } else {
          console.log(chalk.green('  ✓ Profile updated successfully'));
          result.biography_updated = true;
          result.image_updated = true;
          result.statistics_updated = true;
          result.status = 'success';
        }
      } else {
        // Insert new profile
        const { error: insertError } = await supabase.from('actor_profiles').insert(profileData);

        if (insertError) {
          console.error(chalk.red(`  ✗ Error inserting profile: ${insertError.message}`));
          result.errors.push(`Database insert error: ${insertError.message}`);
        } else {
          console.log(chalk.green('  ✓ Profile created successfully'));
          result.biography_updated = true;
          result.image_updated = true;
          result.statistics_updated = true;
          result.status = 'success';
        }
      }
    } else {
      console.log(chalk.yellow('\n  [DRY RUN] Would update profile with:'));
      console.log(chalk.gray('    - Biography: ' + (biographyResult.biography_en ? `${biographyResult.biography_en.substring(0, 100)}...` : 'None')));
      console.log(chalk.gray('    - Birth Date: ' + (biographyResult.birth_date || 'Unknown')));
      console.log(chalk.gray('    - Profile Image: ' + (imageResult.image_url || 'None')));
      console.log(chalk.gray('    - Total Films: ' + statistics.total_films));
      console.log(chalk.gray('    - Trust Score: ' + trustScore + ` (${confidenceTier})`));

      result.status = 'partial';
    }

    // 6. Summary
    console.log(chalk.cyan('\n  📊 Summary:'));
    console.log(chalk.gray(`    Confidence: ${trustScore}% (${confidenceTier})`));
    console.log(chalk.gray(`    Sources: ${[...new Set(result.sources_used)].join(', ')}`));
    console.log(chalk.gray(`    Errors: ${result.errors.length}`));

    return result;
  } catch (error) {
    console.error(chalk.red(`\n  ✗ Error enriching profile for ${actorName}:`), error);
    result.errors.push(`Unexpected error: ${error}`);
    return result;
  }
}

// ============================================================
// BATCH PROCESSING
// ============================================================

async function processAllActors(): Promise<void> {
  try {
    console.log(chalk.magenta.bold('\n🎭 Processing All Actors\n'));

    // Get all unique actors from movies table
    const { data: heroFilms } = await supabase
      .from('movies')
      .select('hero')
      .eq('language', 'Telugu')
      .not('hero', 'is', null)
      .not('hero', 'eq', 'Unknown')
      .limit(LIMIT);

    const { data: heroineFilms } = await supabase
      .from('movies')
      .select('heroine')
      .eq('language', 'Telugu')
      .not('heroine', 'is', null)
      .limit(LIMIT);

    const actorsSet = new Set<string>();
    heroFilms?.forEach((film) => actorsSet.add(film.hero));
    heroineFilms?.forEach((film) => {
      if (film.heroine) actorsSet.add(film.heroine);
    });

    const actors = Array.from(actorsSet).slice(0, LIMIT);

    console.log(chalk.cyan(`Found ${actors.length} unique actors\n`));

    const results: ProfileEnrichmentResult[] = [];
    let successCount = 0;
    let partialCount = 0;
    let failedCount = 0;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      console.log(chalk.gray(`[${i + 1}/${actors.length}]`));

      const result = await enrichActorProfile(actor);
      results.push(result);

      if (result.status === 'success') successCount++;
      else if (result.status === 'partial') partialCount++;
      else failedCount++;

      // Rate limiting for TURBO/FAST modes
      if (TURBO) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      } else if (FAST) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Final summary
    console.log(chalk.magenta.bold('\n═══════════════════════════════════════'));
    console.log(chalk.magenta.bold('  BATCH PROCESSING COMPLETE'));
    console.log(chalk.magenta.bold('═══════════════════════════════════════\n'));
    console.log(chalk.green(`  ✓ Success: ${successCount}`));
    console.log(chalk.yellow(`  ⚠ Partial: ${partialCount}`));
    console.log(chalk.red(`  ✗ Failed: ${failedCount}`));
    console.log(chalk.gray(`\n  Total processed: ${results.length}`));

    // Average confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    console.log(chalk.cyan(`  Average confidence: ${avgConfidence.toFixed(1)}%`));
  } catch (error) {
    console.error(chalk.red('Error in batch processing:'), error);
    process.exit(1);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const speedMode = TURBO ? '🚀 TURBO' : FAST ? '⚡ FAST' : '📋 NORMAL';
  const speedColor = TURBO ? chalk.red : FAST ? chalk.yellow : chalk.gray;

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           ACTOR PROFILE ENRICHMENT                                   ║
║           Multi-Source Biography, Images & Statistics                ║
╠══════════════════════════════════════════════════════════════════════╣
║   Speed: ${speedColor(speedMode.padEnd(12))}  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  if (!ACTOR && !ALL) {
    console.log(chalk.yellow('Usage:'));
    console.log('  --actor="Actor Name"  Enrich specific actor');
    console.log('  --all                 Enrich all actors');
    console.log('  --execute             Apply changes (default: dry run)');
    console.log('  --turbo               TURBO mode (100 concurrent, 25ms rate limit)');
    console.log('  --fast                FAST mode (50 concurrent, 50ms rate limit)');
    console.log('  --limit=N             Limit actors to process (default: 100)');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/enrich-actor-profile.ts --actor="Prabhas" --execute');
    console.log('  npx tsx scripts/enrich-actor-profile.ts --all --turbo --execute');
    process.exit(0);
  }

  if (ACTOR) {
    const result = await enrichActorProfile(ACTOR);
    if (result.status === 'failed') {
      process.exit(1);
    }
  } else if (ALL) {
    await processAllActors();
  }

  console.log(chalk.green('\n✅ Done!\n'));
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
