#!/usr/bin/env npx tsx
/**
 * ACTOR STATISTICS ENRICHMENT SCRIPT
 *
 * Calculates and enriches comprehensive career statistics for actors
 * from the existing movie database.
 *
 * Features:
 * - Career span calculation (debut, total films, years active)
 * - Genre distribution analysis
 * - Frequent collaborator identification
 * - Box office statistics
 * - Rating statistics
 * - Decade-wise filmography breakdown
 * - TURBO/FAST mode support
 *
 * Usage:
 *   npx tsx scripts/enrich-actor-statistics.ts --actor="Actor Name" --execute
 *   npx tsx scripts/enrich-actor-statistics.ts --all --turbo --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

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

interface ActorStatistics {
  total_films: number;
  debut_year: number | null;
  debut_film: string | null;
  latest_year: number | null;
  latest_film: string | null;
  years_active: number | null;
  genres_worked: string[];
  genre_distribution: Array<{ genre: string; count: number; percentage: number }>;
  frequent_directors: Array<{ name: string; count: number; films: string[] }>;
  frequent_music_directors: Array<{ name: string; count: number; films: string[] }>;
  frequent_cinematographers: Array<{ name: string; count: number; films: string[] }>;
  decade_breakdown: Array<{ decade: string; count: number }>;
  role_distribution: {
    hero: number;
    heroine: number;
    supporting: number;
  };
  avg_rating?: number;
  box_office_hits?: number;
  primary_genres: string[];
}

interface StatisticsResult {
  actor_name: string;
  status: 'success' | 'partial' | 'failed';
  statistics: ActorStatistics | null;
  profile_updated: boolean;
  errors: string[];
}

// ============================================================
// STATISTICS CALCULATION
// ============================================================

async function calculateActorStatistics(actorName: string): Promise<ActorStatistics | null> {
  try {
    console.log(chalk.gray('  Querying database for filmography...'));

    // Fetch all films for this actor (hero, heroine, or supporting)
    const { data: allFilms, error } = await supabase
      .from('movies')
      .select('*')
      .or(`hero.ilike.%${actorName}%,heroine.ilike.%${actorName}%,supporting_cast.cs.{${actorName}}`)
      .eq('language', 'Telugu')
      .order('release_year', { ascending: true });

    if (error) throw error;

    if (!allFilms || allFilms.length === 0) {
      console.log(chalk.yellow('  ⚠ No films found in database'));
      return null;
    }

    console.log(chalk.green(`  ✓ Found ${allFilms.length} films`));

    // Separate films by role
    const heroFilms = allFilms.filter((f) => 
      f.hero && f.hero.toLowerCase().includes(actorName.toLowerCase())
    );
    const heroineFilms = allFilms.filter((f) => 
      f.heroine && f.heroine.toLowerCase().includes(actorName.toLowerCase())
    );
    const supportingFilms = allFilms.filter((f) => 
      f.supporting_cast && 
      Array.isArray(f.supporting_cast) &&
      f.supporting_cast.some((c: string) => c.toLowerCase().includes(actorName.toLowerCase()))
    );

    // Basic stats
    const total_films = allFilms.length;
    const debutFilm = allFilms[0];
    const latestFilm = allFilms[allFilms.length - 1];

    const debut_year = debutFilm.release_year;
    const debut_film = debutFilm.title_en;
    const latest_year = latestFilm.release_year;
    const latest_film = latestFilm.title_en;
    const years_active = latest_year - debut_year + 1;

    // Genre analysis
    const genreCount = new Map<string, number>();
    allFilms.forEach((film) => {
      if (film.genres && Array.isArray(film.genres)) {
        film.genres.forEach((genre: string) => {
          genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
        });
      }
    });

    const genres_worked = Array.from(genreCount.keys());
    const genre_distribution = Array.from(genreCount.entries())
      .map(([genre, count]) => ({
        genre,
        count,
        percentage: Math.round((count / total_films) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const primary_genres = genre_distribution.slice(0, 3).map((g) => g.genre);

    // Frequent collaborators - Directors
    const directorCollabs = new Map<string, string[]>();
    allFilms.forEach((film) => {
      if (film.director && film.director !== 'Unknown') {
        if (!directorCollabs.has(film.director)) {
          directorCollabs.set(film.director, []);
        }
        directorCollabs.get(film.director)!.push(film.title_en);
      }
    });

    const frequent_directors = Array.from(directorCollabs.entries())
      .map(([name, films]) => ({ name, count: films.length, films }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Frequent collaborators - Music Directors
    const musicDirectorCollabs = new Map<string, string[]>();
    allFilms.forEach((film) => {
      if (film.music_director) {
        if (!musicDirectorCollabs.has(film.music_director)) {
          musicDirectorCollabs.set(film.music_director, []);
        }
        musicDirectorCollabs.get(film.music_director)!.push(film.title_en);
      }
    });

    const frequent_music_directors = Array.from(musicDirectorCollabs.entries())
      .map(([name, films]) => ({ name, count: films.length, films }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Frequent collaborators - Cinematographers
    const cinematographerCollabs = new Map<string, string[]>();
    allFilms.forEach((film) => {
      if (film.cinematographer) {
        if (!cinematographerCollabs.has(film.cinematographer)) {
          cinematographerCollabs.set(film.cinematographer, []);
        }
        cinematographerCollabs.get(film.cinematographer)!.push(film.title_en);
      }
    });

    const frequent_cinematographers = Array.from(cinematographerCollabs.entries())
      .map(([name, films]) => ({ name, count: films.length, films }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Decade breakdown
    const decadeCount = new Map<string, number>();
    allFilms.forEach((film) => {
      const decade = `${Math.floor(film.release_year / 10) * 10}s`;
      decadeCount.set(decade, (decadeCount.get(decade) || 0) + 1);
    });

    const decade_breakdown = Array.from(decadeCount.entries())
      .map(([decade, count]) => ({ decade, count }))
      .sort((a, b) => a.decade.localeCompare(b.decade));

    // Role distribution
    const role_distribution = {
      hero: heroFilms.length,
      heroine: heroineFilms.length,
      supporting: supportingFilms.length,
    };

    // Box office statistics (if available)
    const filmsWithBoxOffice = allFilms.filter((f) => f.box_office && f.box_office > 0);
    const box_office_hits = filmsWithBoxOffice.length;

    // Rating statistics (if available)
    const filmsWithRatings = allFilms.filter((f) => f.imdb_rating && f.imdb_rating > 0);
    const avg_rating = filmsWithRatings.length > 0
      ? filmsWithRatings.reduce((sum, f) => sum + (f.imdb_rating || 0), 0) / filmsWithRatings.length
      : undefined;

    return {
      total_films,
      debut_year,
      debut_film,
      latest_year,
      latest_film,
      years_active,
      genres_worked,
      genre_distribution,
      frequent_directors,
      frequent_music_directors,
      frequent_cinematographers,
      decade_breakdown,
      role_distribution,
      avg_rating,
      box_office_hits,
      primary_genres,
    };
  } catch (error) {
    console.error(`Error calculating statistics for ${actorName}:`, error);
    return null;
  }
}

// ============================================================
// PROFILE UPDATE
// ============================================================

async function enrichActorStatistics(actorName: string): Promise<StatisticsResult> {
  const result: StatisticsResult = {
    actor_name: actorName,
    status: 'failed',
    statistics: null,
    profile_updated: false,
    errors: [],
  };

  try {
    console.log(chalk.cyan(`\n📊 Calculating statistics for: ${chalk.bold(actorName)}`));

    // Calculate statistics
    const statistics = await calculateActorStatistics(actorName);

    if (!statistics) {
      result.errors.push('Failed to calculate statistics');
      return result;
    }

    result.statistics = statistics;

    // Display statistics summary
    console.log(chalk.cyan('\n  📈 Statistics Summary:'));
    console.log(chalk.gray(`    Total Films: ${statistics.total_films}`));
    console.log(chalk.gray(`    Career Span: ${statistics.debut_year} - ${statistics.latest_year} (${statistics.years_active} years)`));
    console.log(chalk.gray(`    Debut: ${statistics.debut_film} (${statistics.debut_year})`));
    console.log(chalk.gray(`    Latest: ${statistics.latest_film} (${statistics.latest_year})`));
    console.log(chalk.gray(`    Primary Genres: ${statistics.primary_genres.join(', ')}`));
    
    if (statistics.role_distribution.hero > 0) {
      console.log(chalk.gray(`    Hero Films: ${statistics.role_distribution.hero}`));
    }
    if (statistics.role_distribution.heroine > 0) {
      console.log(chalk.gray(`    Heroine Films: ${statistics.role_distribution.heroine}`));
    }
    if (statistics.role_distribution.supporting > 0) {
      console.log(chalk.gray(`    Supporting Films: ${statistics.role_distribution.supporting}`));
    }

    if (statistics.frequent_directors.length > 0) {
      console.log(chalk.gray(`    Top Directors: ${statistics.frequent_directors.slice(0, 3).map((d) => `${d.name} (${d.count})`).join(', ')}`));
    }

    if (statistics.avg_rating) {
      console.log(chalk.gray(`    Average Rating: ${statistics.avg_rating.toFixed(1)}/10`));
    }

    // Update profile
    if (EXECUTE && !DRY) {
      console.log(chalk.cyan('\n  💾 Updating actor profile...'));

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('actor_profiles')
        .select('id')
        .eq('name', actorName)
        .single();

      if (!existingProfile) {
        console.log(chalk.yellow('  ⚠ Profile not found, creating new profile...'));
        
        const { error: insertError } = await supabase.from('actor_profiles').insert({
          name: actorName,
          slug: actorName.toLowerCase().replace(/\s+/g, '-'),
          total_films: statistics.total_films,
          debut_year: statistics.debut_year,
          debut_film: statistics.debut_film,
          years_active: statistics.years_active,
          genres_worked: statistics.genres_worked,
          career_highlights: [
            {
              type: 'frequent_collaborators',
              directors: statistics.frequent_directors,
              music_directors: statistics.frequent_music_directors,
              cinematographers: statistics.frequent_cinematographers,
            },
            {
              type: 'decade_breakdown',
              decades: statistics.decade_breakdown,
            },
          ],
        });

        if (insertError) {
          console.error(chalk.red(`  ✗ Error creating profile: ${insertError.message}`));
          result.errors.push(`Profile creation error: ${insertError.message}`);
        } else {
          console.log(chalk.green('  ✓ Profile created with statistics'));
          result.profile_updated = true;
          result.status = 'success';
        }
      } else {
        const { error: updateError } = await supabase
          .from('actor_profiles')
          .update({
            total_films: statistics.total_films,
            debut_year: statistics.debut_year,
            debut_film: statistics.debut_film,
            years_active: statistics.years_active,
            genres_worked: statistics.genres_worked,
            career_highlights: [
              {
                type: 'frequent_collaborators',
                directors: statistics.frequent_directors,
                music_directors: statistics.frequent_music_directors,
                cinematographers: statistics.frequent_cinematographers,
              },
              {
                type: 'decade_breakdown',
                decades: statistics.decade_breakdown,
              },
              {
                type: 'role_distribution',
                ...statistics.role_distribution,
              },
            ],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingProfile.id);

        if (updateError) {
          console.error(chalk.red(`  ✗ Error updating profile: ${updateError.message}`));
          result.errors.push(`Profile update error: ${updateError.message}`);
        } else {
          console.log(chalk.green('  ✓ Profile updated with statistics'));
          result.profile_updated = true;
          result.status = 'success';
        }
      }
    } else {
      console.log(chalk.yellow('\n  [DRY RUN] Would update profile with calculated statistics'));
      result.status = 'partial';
    }

    return result;
  } catch (error) {
    console.error(chalk.red(`\n  ✗ Error enriching statistics for ${actorName}:`), error);
    result.errors.push(`Unexpected error: ${error}`);
    return result;
  }
}

// ============================================================
// BATCH PROCESSING
// ============================================================

async function processAllActors(): Promise<void> {
  try {
    console.log(chalk.magenta.bold('\n📊 Processing All Actors\n'));

    // Get actors with profiles
    const { data: actorsWithProfiles } = await supabase
      .from('actor_profiles')
      .select('name')
      .limit(LIMIT);

    const actors = actorsWithProfiles?.map((a) => a.name) || [];

    if (actors.length === 0) {
      console.log(chalk.yellow('No actor profiles found. Create profiles first using enrich-actor-profile.ts'));
      return;
    }

    console.log(chalk.cyan(`Found ${actors.length} actor profiles\n`));

    const results: StatisticsResult[] = [];
    let successCount = 0;
    let partialCount = 0;
    let failedCount = 0;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      console.log(chalk.gray(`[${i + 1}/${actors.length}]`));

      const result = await enrichActorStatistics(actor);
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
    console.log(chalk.gray(`\n  Total actors processed: ${results.length}`));
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
║           ACTOR STATISTICS ENRICHMENT                                ║
║           Career Analysis from Database                              ║
╠══════════════════════════════════════════════════════════════════════╣
║   Speed: ${speedColor(speedMode.padEnd(12))}  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  if (!ACTOR && !ALL) {
    console.log(chalk.yellow('Usage:'));
    console.log('  --actor="Actor Name"  Calculate statistics for specific actor');
    console.log('  --all                 Calculate statistics for all actors with profiles');
    console.log('  --execute             Apply changes (default: dry run)');
    console.log('  --turbo               TURBO mode (100 concurrent, 25ms rate limit)');
    console.log('  --fast                FAST mode (50 concurrent, 50ms rate limit)');
    console.log('  --limit=N             Limit actors to process (default: 100)');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/enrich-actor-statistics.ts --actor="Prabhas" --execute');
    console.log('  npx tsx scripts/enrich-actor-statistics.ts --all --turbo --execute');
    process.exit(0);
  }

  if (ACTOR) {
    const result = await enrichActorStatistics(ACTOR);
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
