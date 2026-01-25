#!/usr/bin/env npx tsx
/**
 * Complete Genre Enrichment - 3-Phase Process
 * 
 * Phase 1: Delete award entries (10 movies)
 * Phase 2: Auto-enrich 159 movies with TMDB IDs
 * Phase 3: Generate manual review list for 127 remaining movies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const BATCH_SIZE = 5;
const BATCH_DELAY = 1000;

// Award entries to delete
const AWARD_ENTRIES = [
  'best-actor-in-a-negative-role-tamil-2021',
  'best-actor-in-a-negative-role-2017',
  'best-actor-in-a-negative-role-malayalam-2016',
  'special-jury-award-2016',
  'best-actor-in-a-negative-role-telugu-2014',
  'best-villain-2014',
  'iifa-utsavam-2015',
  'karnataka-state-film-awards-1998',
  'special-jury-award-1989',
  'best-supporting-actor-telugu-2005'
];

async function fetchTMDBGenres(tmdbId: number) {
  if (!TMDB_API_KEY) return null;

  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`);
    if (!res.ok) return null;

    const movie = await res.json();
    return movie.genres?.map((g: any) => g.name) || [];
  } catch (error) {
    return null;
  }
}

// ============================================================================
// PHASE 1: DELETE AWARD ENTRIES
// ============================================================================

async function deleteAwardEntries() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                    PHASE 1: DELETE AWARD ENTRIES                      ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let deleted = 0;
  let notFound = 0;

  for (const slug of AWARD_ENTRIES) {
    console.log(chalk.gray(`  Checking: ${slug}`));

    const { data: movie } = await supabase
      .from('movies')
      .select('id, title_en, slug')
      .eq('slug', slug)
      .single();

    if (movie) {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', movie.id);

      if (error) {
        console.log(chalk.red(`    ✗ Delete failed: ${error.message}`));
      } else {
        console.log(chalk.green(`    ✓ Deleted: ${movie.title_en || slug}`));
        deleted++;
      }
    } else {
      console.log(chalk.yellow(`    ⚠ Not found (already deleted?)`));
      notFound++;
    }
  }

  console.log(chalk.cyan(`\n  Summary: ${chalk.green(deleted + ' deleted')} | ${chalk.yellow(notFound + ' not found')}\n`));
  return { deleted, notFound };
}

// ============================================================================
// PHASE 2: AUTO-ENRICH FROM TMDB
// ============================================================================

async function autoEnrichFromTMDB() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                 PHASE 2: AUTO-ENRICH FROM TMDB                        ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  // Find movies with TMDB IDs but no genres
  const { data: movies } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, tmdb_id, genres')
    .not('tmdb_id', 'is', null)
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false });

  if (!movies || movies.length === 0) {
    console.log(chalk.green('  ✅ All movies with TMDB IDs already have genres!\n'));
    return { enriched: 0, failed: 0, skipped: 0 };
  }

  console.log(chalk.green(`  ✓ Found ${movies.length} movies to enrich\n`));
  console.log(chalk.yellow(`  🚀 Processing ${BATCH_SIZE} movies at once...\n`));

  let enriched = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < movies.length; i += BATCH_SIZE) {
    const batch = movies.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(movies.length / BATCH_SIZE);

    console.log(chalk.cyan(`  📦 Batch ${batchNum}/${totalBatches}`));

    const results = await Promise.all(
      batch.map(async (movie) => {
        const title = movie.title_en || movie.title_te || 'Untitled';
        console.log(chalk.gray(`    Processing: ${title} (${movie.release_year})`));

        const genres = await fetchTMDBGenres(movie.tmdb_id);

        if (!genres || genres.length === 0) {
          console.log(chalk.red(`      ✗ No genres found in TMDB`));
          return { success: false, movie };
        }

        const { error } = await supabase
          .from('movies')
          .update({ genres })
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`      ✗ Update failed: ${error.message}`));
          return { success: false, movie };
        }

        console.log(chalk.green(`      ✓ Added genres: ${genres.join(', ')}`));
        return { success: true, movie, genres };
      })
    );

    enriched += results.filter(r => r.success).length;
    failed += results.filter(r => !r.success).length;

    // Delay between batches
    if (i + BATCH_SIZE < movies.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  console.log(chalk.cyan(`\n  Summary: ${chalk.green(enriched + ' enriched')} | ${chalk.red(failed + ' failed')}\n`));
  return { enriched, failed, skipped };
}

// ============================================================================
// PHASE 3: GENERATE MANUAL REVIEW LIST
// ============================================================================

async function generateManualReviewList() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              PHASE 3: GENERATE MANUAL REVIEW LIST                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  // Find movies without TMDB IDs or without genres
  const { data: movies } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, director, hero, heroine, tmdb_id, genres')
    .or('tmdb_id.is.null,genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false });

  if (!movies || movies.length === 0) {
    console.log(chalk.green('  ✅ All movies have genres! No manual review needed.\n'));
    return 0;
  }

  console.log(chalk.yellow(`  ⚠️  ${movies.length} movies need manual genre classification\n`));

  // Generate report
  const lines = [
    '═══════════════════════════════════════════════════════════════════════',
    `           ${movies.length} MOVIES NEEDING MANUAL GENRE CLASSIFICATION`,
    '═══════════════════════════════════════════════════════════════════════',
    '',
    'These movies need manual research to add genres:',
    ''
  ];

  movies.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    const hasTmdb = movie.tmdb_id ? '✓ TMDB' : '✗ No TMDB';
    const hasDirector = movie.director ? `Dir: ${movie.director.substring(0, 30)}` : '✗ No Director';
    
    lines.push(`${(i + 1).toString().padStart(3)}. ${title} (${movie.release_year}) [${hasTmdb}]`);
    lines.push(`     ${hasDirector}`);
    lines.push(`     http://localhost:3000/movies/${movie.slug}`);
    lines.push('');
  });

  lines.push('═══════════════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('Common genres: Action, Drama, Romance, Comedy, Thriller, Horror,');
  lines.push('               Family, Fantasy, Historical, Mythology, Devotional');
  lines.push('');

  const reportPath = resolve(process.cwd(), 'docs/manual-review/MANUAL-GENRE-CLASSIFICATION.txt');
  writeFileSync(reportPath, lines.join('\n'));

  console.log(chalk.green(`  ✓ Report saved: ${reportPath}\n`));
  console.log(chalk.gray(`  First 10 movies:\n`));

  movies.slice(0, 10).forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.white(`    ${i + 1}. ${title} (${movie.release_year})`));
  });

  console.log(chalk.gray(`\n    ... and ${movies.length - 10} more\n`));

  return movies.length;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           COMPLETE GENRE ENRICHMENT - 3-PHASE PROCESS                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  const startTime = Date.now();

  // Phase 1: Delete award entries
  const phase1 = await deleteAwardEntries();

  // Phase 2: Auto-enrich from TMDB
  const phase2 = await autoEnrichFromTMDB();

  // Phase 3: Generate manual review list
  const phase3Count = await generateManualReviewList();

  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Final Summary
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                        FINAL SUMMARY                                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('  Phase 1 - Award Entries Deleted:'));
  console.log(chalk.green(`    ✓ Deleted:      ${phase1.deleted}`));
  console.log(chalk.yellow(`    ⚠ Not found:    ${phase1.notFound}`));

  console.log(chalk.cyan('\n  Phase 2 - Auto-Enriched from TMDB:'));
  console.log(chalk.green(`    ✓ Enriched:     ${phase2.enriched}`));
  console.log(chalk.red(`    ✗ Failed:       ${phase2.failed}`));

  console.log(chalk.cyan('\n  Phase 3 - Manual Review Required:'));
  console.log(chalk.yellow(`    ⚠ Movies:       ${phase3Count}`));

  console.log(chalk.gray(`\n  Total Duration: ${duration} minutes\n`));

  console.log(chalk.green(`\n  ✅ Genre enrichment complete!\n`));
  console.log(chalk.gray(`  Next: Review MANUAL-GENRE-CLASSIFICATION.txt for remaining ${phase3Count} movies\n`));
}

main().catch(console.error);
