#!/usr/bin/env npx tsx
/**
 * TMDB Telugu Movie Discovery CLI
 * 
 * Single command to discover ALL Telugu movies from TMDB.
 * 
 * Usage:
 *   pnpm ingest:tmdb:telugu --dry          # Preview mode
 *   pnpm ingest:tmdb:telugu                # Full discovery
 *   pnpm ingest:tmdb:telugu --year=2024    # Single year
 *   pnpm ingest:tmdb:telugu --from=2020    # 2020 to present
 *   pnpm ingest:tmdb:telugu --credits      # Also fetch credits (slower)
 *   pnpm ingest:tmdb:telugu --status       # Show current index status
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import {
  paginateTeluguMovies,
  paginateByYear,
  getIndexStats,
  PaginatorOptions,
} from '../lib/movie-index/tmdb-paginator';

// ============================================================
// CLI ARGUMENT PARSING
// ============================================================

interface CLIArgs {
  dryRun: boolean;
  year?: number;
  fromYear?: number;
  toYear?: number;
  maxPages?: number;
  fetchCredits: boolean;
  verbose: boolean;
  statusOnly: boolean;
  help: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const parsed: CLIArgs = {
    dryRun: false,
    fetchCredits: false,
    verbose: false,
    statusOnly: false,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--dry' || arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--credits') {
      parsed.fetchCredits = true;
    } else if (arg === '-v' || arg === '--verbose') {
      parsed.verbose = true;
    } else if (arg === '--status') {
      parsed.statusOnly = true;
    } else if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (arg.startsWith('--year=')) {
      parsed.year = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--from=')) {
      parsed.fromYear = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--to=')) {
      parsed.toYear = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--max-pages=')) {
      parsed.maxPages = parseInt(arg.split('=')[1]);
    }
  }

  return parsed;
}

function showHelp(): void {
  console.log(`
${chalk.cyan.bold('TMDB Telugu Movie Discovery')}

Discover and index ALL Telugu movies from TMDB.
Creates the canonical telugu_movie_index table.

${chalk.yellow('Usage:')}
  pnpm ingest:tmdb:telugu [options]

${chalk.yellow('Options:')}
  --dry, --dry-run    Preview mode - don't write to database
  --status            Show current index statistics
  --year=YYYY         Discover movies for a single year
  --from=YYYY         Start year for range discovery
  --to=YYYY           End year for range discovery (default: current year)
  --max-pages=N       Limit pages per request
  --credits           Also fetch credits (slower, better confidence)
  -v, --verbose       Show detailed output
  -h, --help          Show this help message

${chalk.yellow('Examples:')}
  pnpm ingest:tmdb:telugu --dry           # Preview all Telugu movies
  pnpm ingest:tmdb:telugu                 # Full discovery
  pnpm ingest:tmdb:telugu --year=2024     # Only 2024 movies
  pnpm ingest:tmdb:telugu --from=2020     # 2020 to present
  pnpm ingest:tmdb:telugu --from=2000 --to=2010 --credits  # Decade with credits

${chalk.yellow('Notes:')}
  - TMDB has ~2000 Telugu movies total
  - Discovery uses original_language=te as the canonical filter
  - Rate limited to respect TMDB API limits
  - First run may take 15-30 minutes for full index
  `);
}

async function showStatus(): Promise<void> {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════╗
║           TELUGU MOVIE INDEX - STATUS                         ║
╚══════════════════════════════════════════════════════════════╝
`));

  try {
    const stats = await getIndexStats();

    console.log(chalk.bold('📊 INDEX OVERVIEW'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  Total Indexed:     ${chalk.cyan(stats.total)}`);
    console.log(`  Verified:          ${chalk.green(stats.verified)} (${((stats.verified / stats.total) * 100 || 0).toFixed(1)}%)`);
    console.log(`  Valid:             ${chalk.green(stats.valid)}`);
    console.log(`  Needs Review:      ${chalk.yellow(stats.needsReview)}`);
    console.log(`  Rejected:          ${chalk.red(stats.rejected)}`);

    console.log(chalk.bold('\n📷 DATA QUALITY'));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(`  With Poster:       ${stats.withPoster} (${((stats.withPoster / stats.total) * 100 || 0).toFixed(1)}%)`);
    console.log(`  With Director:     ${stats.withDirector} (${((stats.withDirector / stats.total) * 100 || 0).toFixed(1)}%)`);
    console.log(`  With 3+ Cast:      ${stats.withCast3Plus} (${((stats.withCast3Plus / stats.total) * 100 || 0).toFixed(1)}%)`);

    // Top years
    const sortedYears = Object.entries(stats.byYear)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    if (sortedYears.length > 0) {
      console.log(chalk.bold('\n📅 TOP YEARS'));
      console.log(chalk.gray('─'.repeat(50)));
      const maxCount = sortedYears[0][1];
      for (const [year, count] of sortedYears) {
        const bar = '█'.repeat(Math.round((count / maxCount) * 30));
        console.log(`  ${year}: ${chalk.blue(bar)} ${count}`);
      }
    }

    // Coverage estimate vs TMDB total
    console.log(chalk.bold('\n📈 COVERAGE ESTIMATE'));
    console.log(chalk.gray('─'.repeat(50)));
    const estimatedTotal = 2000; // TMDB typically has ~2000 Telugu movies
    const coverage = ((stats.total / estimatedTotal) * 100).toFixed(1);
    console.log(`  Estimated TMDB Total: ~${estimatedTotal}`);
    console.log(`  Current Coverage:     ${coverage}%`);

    if (stats.total < estimatedTotal * 0.9) {
      console.log(chalk.yellow(`\n  ⚠️ Run 'pnpm ingest:tmdb:telugu' to complete discovery`));
    } else {
      console.log(chalk.green(`\n  ✅ Index is at ${coverage}% coverage`));
    }

  } catch (error: any) {
    console.error(chalk.red('Failed to fetch status:'), error.message);
    console.log(chalk.yellow('\nNote: Run the SQL schema first if table doesn\'t exist:'));
    console.log(chalk.gray('  psql -f supabase-telugu-movie-index.sql'));
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main(): Promise<void> {
  const args = parseArgs();

  // Help
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Status only
  if (args.statusOnly) {
    await showStatus();
    process.exit(0);
  }

  // Validate environment
  if (!process.env.TMDB_API_KEY) {
    console.error(chalk.red.bold('❌ TMDB_API_KEY not set'));
    console.error(chalk.red('Set TMDB_API_KEY in your .env file'));
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(chalk.red.bold('❌ Supabase credentials not set'));
    console.error(chalk.red('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'));
    process.exit(1);
  }

  // Header
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║           TMDB TELUGU MOVIE DISCOVERY                         ║
╚══════════════════════════════════════════════════════════════╝
`));

  if (args.dryRun) {
    console.log(chalk.yellow.bold('🔍 DRY RUN MODE - No data will be saved\n'));
  }

  const startTime = Date.now();

  try {
    let result;

    if (args.fromYear) {
      // Year range discovery
      const toYear = args.toYear || new Date().getFullYear();
      console.log(chalk.cyan(`📅 Discovering Telugu movies from ${args.fromYear} to ${toYear}...`));
      
      result = await paginateByYear(args.fromYear, toYear, {
        dryRun: args.dryRun,
        fetchCredits: args.fetchCredits,
        verbose: args.verbose,
        maxPages: args.maxPages,
      });
    } else if (args.year) {
      // Single year discovery
      console.log(chalk.cyan(`📅 Discovering Telugu movies for year ${args.year}...`));
      
      result = await paginateTeluguMovies({
        year: args.year,
        dryRun: args.dryRun,
        fetchCredits: args.fetchCredits,
        verbose: args.verbose,
        maxPages: args.maxPages,
      });
    } else {
      // Full discovery
      console.log(chalk.cyan('🔍 Discovering ALL Telugu movies from TMDB...'));
      
      result = await paginateTeluguMovies({
        dryRun: args.dryRun,
        fetchCredits: args.fetchCredits,
        verbose: args.verbose,
        maxPages: args.maxPages,
      });
    }

    // Results
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
    console.log(chalk.bold('📊 DISCOVERY RESULTS'));
    console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

    console.log(`  Pages Processed:   ${result.pagesProcessed}`);
    console.log(`  Total Found:       ${chalk.cyan(result.totalFound)}`);
    console.log(`  New Indexed:       ${chalk.green(result.newIndexed)}`);
    console.log(`  Updated:           ${chalk.blue(result.updated)}`);
    console.log(`  Rejected:          ${chalk.red(result.rejected)}`);
    console.log(`  Errors:            ${result.errors.length}`);
    console.log(`  Duration:          ${duration}s`);

    if (result.errors.length > 0) {
      console.log(chalk.yellow('\n⚠️ Errors:'));
      for (const error of result.errors.slice(0, 5)) {
        console.log(chalk.yellow(`  - ${error}`));
      }
      if (result.errors.length > 5) {
        console.log(chalk.yellow(`  ... and ${result.errors.length - 5} more`));
      }
    }

    // Next steps
    console.log(chalk.bold('\n📋 NEXT STEPS'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (args.dryRun) {
      console.log(chalk.yellow('  Run without --dry to save to database'));
    } else {
      console.log(`  1. Run ${chalk.cyan('pnpm intel:movie-audit')} to validate movies`);
      console.log(`  2. Run ${chalk.cyan('pnpm intel:movie-audit --fix')} to auto-fix issues`);
      console.log(`  3. Run ${chalk.cyan('pnpm reviews:coverage --target=0.95')} to generate reviews`);
    }

    console.log(chalk.green.bold('\n✅ Discovery complete!\n'));

    // Show quick status
    if (!args.dryRun) {
      await showStatus();
    }

    process.exit(0);

  } catch (error: any) {
    console.error(chalk.red.bold('\n❌ Discovery failed:'), error.message);
    
    if (error.message.includes('telugu_movie_index')) {
      console.log(chalk.yellow('\nDid you run the schema migration?'));
      console.log(chalk.gray('  psql -f supabase-telugu-movie-index.sql'));
    }

    process.exit(1);
  }
}

main();

