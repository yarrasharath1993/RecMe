#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getFinalStatus() {
  // Total movies
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });

  // Movies with genres (has array with at least one genre)
  const { data: withGenresData } = await supabase
    .from('movies')
    .select('genres')
    .not('genres', 'is', null);

  const withGenres = withGenresData?.filter(m => Array.isArray(m.genres) && m.genres.length > 0).length || 0;

  // Movies without genres
  const withoutGenres = (total || 0) - withGenres;

  // Recent movies (2020+)
  const { count: recentTotal } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .gte('release_year', 2020);

  const { data: recentWithGenres } = await supabase
    .from('movies')
    .select('genres')
    .gte('release_year', 2020)
    .not('genres', 'is', null);

  const recentGenreCount = recentWithGenres?.filter(m => Array.isArray(m.genres) && m.genres.length > 0).length || 0;

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                 FINAL GENRE STATUS REPORT                             ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`  OVERALL DATABASE:`));
  console.log(chalk.white(`    Total movies:           ${chalk.cyan(total)}`));
  console.log(chalk.green(`    ✓ With genres:          ${chalk.cyan(withGenres)} (${Math.round((withGenres/(total||1))*100)}%)`));
  console.log(chalk.red(`    ✗ Without genres:       ${chalk.cyan(withoutGenres)} (${Math.round((withoutGenres/(total||1))*100)}%)`));

  console.log(chalk.white(`\n  RECENT MOVIES (2020+):`));
  console.log(chalk.white(`    Total:                  ${chalk.cyan(recentTotal)}`));
  console.log(chalk.green(`    ✓ With genres:          ${chalk.cyan(recentGenreCount)} (${Math.round((recentGenreCount/(recentTotal||1))*100)}%)`));
  console.log(chalk.red(`    ✗ Without genres:       ${chalk.cyan((recentTotal||0) - recentGenreCount)} (${Math.round((((recentTotal||0) - recentGenreCount)/(recentTotal||1))*100)}%)`));

  // Check movies without TMDB IDs
  const { count: noTmdb } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .is('tmdb_id', null);

  console.log(chalk.white(`\n  TMDB COVERAGE:`));
  console.log(chalk.yellow(`    ⚠ Without TMDB ID:      ${chalk.cyan(noTmdb)} (${Math.round((noTmdb/(total||1))*100)}%)`));

  // Award entries check
  const { count: awards } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('title_en.ilike.%award%,title_en.ilike.%villain%,title_en.ilike.%jury%');

  console.log(chalk.white(`\n  DATA QUALITY:`));
  console.log(chalk.yellow(`    Potential awards:       ${chalk.cyan(awards)}`));

  console.log(chalk.green.bold(`\n  🎉 Genre enrichment is ${chalk.cyan(Math.round((withGenres/(total||1))*100) + '%')} complete!\n`));

  // Achievement summary
  if ((withGenres/(total||1)) >= 0.99) {
    console.log(chalk.green.bold(`  ✅ EXCELLENT! Database is in great shape!\n`));
  } else if ((withGenres/(total||1)) >= 0.95) {
    console.log(chalk.yellow.bold(`  ⚠️  Good progress, but ${withoutGenres} movies still need genres\n`));
  }
}

getFinalStatus();
