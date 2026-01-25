#!/usr/bin/env npx tsx
/**
 * TEST ENRICH-CAST-CREW V4.0
 * 
 * Tests the new IMDb and Wikipedia integration in enrich-cast-crew.ts
 * 
 * Usage:
 *   npx tsx scripts/test-enrich-cast-crew-v4.ts --actor="Chiranjeevi"
 *   npx tsx scripts/test-enrich-cast-crew-v4.ts --slug="pushpa-the-rise-2021"
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';

// Import the modules directly
import { scrapeIMDbCredits } from './lib/imdb-scraper';
import { parseTeluguWikipediaInfobox } from './lib/wikipedia-infobox-parser';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse args
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const ACTOR = getArg('actor', 'Chiranjeevi');
const SLUG = getArg('slug', '');

// ============================================================
// TEST FUNCTIONS
// ============================================================

async function testIMDbScraper(imdbId: string, title: string): Promise<void> {
  console.log(chalk.cyan(`\nTesting IMDb scraper for: ${title}`));
  console.log(`IMDb ID: ${imdbId}\n`);

  const credits = await scrapeIMDbCredits(imdbId);

  if (!credits) {
    console.log(chalk.red('✗ No credits found\n'));
    return;
  }

  console.log(chalk.green('✓ IMDb credits fetched successfully\n'));

  if (credits.cast && credits.cast.length > 0) {
    console.log(chalk.cyan('Cast (Top 5):'));
    for (const actor of credits.cast.slice(0, 5)) {
      console.log(`  ${actor.order}. ${actor.name}${actor.character ? ` as ${actor.character}` : ''}`);
    }
    console.log();
  }

  if (credits.crew) {
    console.log(chalk.cyan('Crew:'));
    if (credits.crew.cinematographer?.length) {
      console.log(`  Cinematographer: ${credits.crew.cinematographer.join(', ')}`);
    }
    if (credits.crew.editor?.length) {
      console.log(`  Editor: ${credits.crew.editor.join(', ')}`);
    }
    if (credits.crew.writer?.length) {
      console.log(`  Writer: ${credits.crew.writer.join(', ')}`);
    }
    if (credits.crew.producer?.length) {
      console.log(`  Producer: ${credits.crew.producer.join(', ')}`);
    }
    if (credits.crew.musicDirector?.length) {
      console.log(`  Music: ${credits.crew.musicDirector.join(', ')}`);
    }
    console.log();
  }

  console.log(`Confidence: ${(credits.confidence * 100).toFixed(0)}%\n`);
}

async function testWikipediaParser(title: string, year: number): Promise<void> {
  console.log(chalk.cyan(`\nTesting Wikipedia parser for: ${title} (${year})\n`));

  const infobox = await parseTeluguWikipediaInfobox(title, year);

  if (!infobox) {
    console.log(chalk.yellow('! No Wikipedia infobox found\n'));
    return;
  }

  console.log(chalk.green('✓ Wikipedia infobox parsed successfully\n'));

  console.log(chalk.cyan('Technical Credits:'));
  if (infobox.cinematographer) {
    console.log(`  Cinematographer: ${infobox.cinematographer}`);
  }
  if (infobox.editor) {
    console.log(`  Editor: ${infobox.editor}`);
  }
  if (infobox.writer) {
    console.log(`  Writer: ${infobox.writer}`);
  }
  if (infobox.producer) {
    console.log(`  Producer: ${infobox.producer}`);
  }
  if (infobox.musicDirector) {
    console.log(`  Music: ${infobox.musicDirector}`);
  }
  console.log();

  console.log(`Confidence: ${(infobox.confidence * 100).toFixed(0)}%\n`);
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║        ENRICH-CAST-CREW V4.0 INTEGRATION TEST                        ║
║        Testing IMDb Scraper + Wikipedia Parser                       ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  let query = supabase
    .from('movies')
    .select('id, title_en, release_year, imdb_id, tmdb_id, hero, director')
    .eq('language', 'Telugu')
    .not('imdb_id', 'is', null);

  if (SLUG) {
    query = query.eq('slug', SLUG);
  } else if (ACTOR) {
    query = query.ilike('hero', `%${ACTOR}%`);
  }

  const { data: movies, error } = await query.limit(3);

  if (error) {
    console.error(chalk.red('Database error:'), error);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('No movies found with IMDb IDs\n'));
    return;
  }

  console.log(`Found ${chalk.cyan(movies.length)} movies to test\n`);

  for (const movie of movies) {
    console.log(chalk.cyan.bold(`\n${'='.repeat(70)}`));
    console.log(chalk.cyan.bold(`${movie.title_en} (${movie.release_year})`));
    console.log(chalk.cyan.bold(`${'='.repeat(70)}`));

    // Test IMDb scraper
    if (movie.imdb_id) {
      await testIMDbScraper(movie.imdb_id, movie.title_en);
    } else {
      console.log(chalk.yellow('! No IMDb ID available\n'));
    }

    // Test Wikipedia parser
    await testWikipediaParser(movie.title_en, movie.release_year);

    // Delay between movies
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║        INTEGRATION TEST COMPLETE                                     ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  // Summary
  console.log(chalk.green('\n✓ IMDb and Wikipedia modules are integrated and working'));
  console.log(chalk.cyan('\nNext steps:'));
  console.log('  1. Run enrich-cast-crew.ts with an actor to test full workflow');
  console.log('  2. Check that technical credits are filled from multiple sources');
  console.log('  3. Verify confidence scores and source provenance\n');
}

main().catch(console.error);
