#!/usr/bin/env npx tsx
/**
 * Fix Incomplete Data - Batch Processing
 * 
 * Phase 1: Delete non-movies (9 entries)
 * Phase 2: Enrich from TMDB (1 movie)
 * Phase 3: Try alternative searches for remaining 28 movies
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Non-movies to delete
const TO_DELETE = [
  'padma-vibhushan-2011',
  'best-supporting-actress-tamil-2002',
  'national-film-awards-2003',
  'best-actress-tamil-2001',
  'best-actress-kannada-2004',
  'indian-idol-2021',
  'overall-contribution-to-telugu-film-industry-2007',
  'drama-juniors-4-telugu-2023',
  'the-kapil-sharma-show-season-2-2021',
];

// Movies to enrich from TMDB
const TO_ENRICH = [
  'vallamai-tharayo-2008',
];

// Movies needing manual research
const TO_RESEARCH = [
  '1st-iifa-utsavam-2015',
  'balu-abcdefg-2005',
  'prince-of-peace-2012',
  'bhale-mogudu-bhale-pellam-2011',
  'andaru-dongale-dorikithe-2004',
  'apparao-driving-school-2004',
  'iddaru-attala-muddula-alludu-2006',
  'dagudumoota-dandakore-2015',
  'palanati-brahmanaidu-2003',
  'vamsoddarakudu-2000',
  'premaku-swagatham-2002',
  'jayam-manade-raa-2000',
  'sangolli-rayanna-2012',
  'sri-renukadevi-2003',
  'sesh-sangat-2009',
  'perfect-pati-2018',
  'ee-snehatheerathu-2004',
  'kizhakku-kadalkarai-salai-2006',
  'sakutumba-saparivaara-sametham-2000',
  'o-baby-yentha-sakkagunnave-2019',
  'kana-kandaen-2005',
  'meri-warrant-2010',
  'mayajalam-2006',
  'roja-kootam-2002',
  'nambiar-2014',
  '-2016',
  'joot-2004',
  'ethiri-en-3-2012',
];

async function deleteNonMovies(execute: boolean) {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.red.bold('  PHASE 1: DELETE NON-MOVIES (9 entries)\n'));

  let deleted = 0;
  const deletedItems: string[] = [];

  for (const slug of TO_DELETE) {
    const { data: movie } = await supabase
      .from('movies')
      .select('title_en, release_year')
      .eq('slug', slug)
      .single();

    if (!movie) {
      console.log(chalk.yellow(`  ⊘ ${slug}: Not found`));
      continue;
    }

    console.log(chalk.cyan(`  ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`    Slug: ${slug}`));
    console.log(chalk.red(`    Action: DELETE - Award/TV show entry`));

    if (execute) {
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('slug', slug);

      if (error) {
        console.log(chalk.red(`    ❌ Delete failed: ${error.message}\n`));
      } else {
        console.log(chalk.green(`    ✅ Deleted!\n`));
        deleted++;
        deletedItems.push(`${movie.title_en} (${movie.release_year})`);
      }
    } else {
      console.log(chalk.yellow(`    (Dry run - not deleted)\n`));
    }
  }

  return { deleted, deletedItems };
}

async function enrichFromTMDB(execute: boolean) {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  PHASE 2: ENRICH FROM TMDB (1 movie)\n'));

  let enriched = 0;

  for (const slug of TO_ENRICH) {
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!movie || !movie.tmdb_id) {
      console.log(chalk.yellow(`  ⊘ ${slug}: Not found or no TMDB ID`));
      continue;
    }

    console.log(chalk.cyan(`  ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`    TMDB ID: ${movie.tmdb_id}`));

    try {
      const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.tmdb_id}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
      const response = await fetch(detailsUrl);
      const tmdbData = await response.json();

      const updates: any = {};

      // Poster
      if (tmdbData.poster_path && !movie.poster_url) {
        updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
        console.log(chalk.green(`    + Poster: ${updates.poster_url}`));
      }

      // Backdrop
      if (tmdbData.backdrop_path && !movie.backdrop_url) {
        updates.backdrop_url = `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`;
        console.log(chalk.green(`    + Backdrop: ${updates.backdrop_url}`));
      }

      // Director
      if (tmdbData.credits?.crew && !movie.director) {
        const director = tmdbData.credits.crew.find((c: any) => c.job === 'Director');
        if (director) {
          updates.director = director.name;
          console.log(chalk.green(`    + Director: ${director.name}`));
        }
      }

      // Cast
      if (tmdbData.credits?.cast && tmdbData.credits.cast.length > 0) {
        const maleCast = tmdbData.credits.cast.filter((c: any) => c.gender === 2);
        const femaleCast = tmdbData.credits.cast.filter((c: any) => c.gender === 1);

        if (maleCast.length > 0 && !movie.hero) {
          updates.hero = maleCast[0].name;
          console.log(chalk.green(`    + Hero: ${maleCast[0].name}`));
        }

        if (femaleCast.length > 0 && !movie.heroine) {
          updates.heroine = femaleCast[0].name;
          console.log(chalk.green(`    + Heroine: ${femaleCast[0].name}`));
        }
      }

      // Genres
      if (tmdbData.genres && tmdbData.genres.length > 0) {
        updates.genres = tmdbData.genres.map((g: any) => g.name);
        console.log(chalk.green(`    + Genres: ${updates.genres.join(', ')}`));
      }

      if (Object.keys(updates).length === 0) {
        console.log(chalk.yellow(`    No new data to add\n`));
        continue;
      }

      if (execute) {
        const { error } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);

        if (error) {
          console.log(chalk.red(`    ❌ Update failed: ${error.message}\n`));
        } else {
          console.log(chalk.green(`    ✅ Enriched with ${Object.keys(updates).length} fields!\n`));
          enriched++;
        }
      } else {
        console.log(chalk.yellow(`    (Dry run - not updated)\n`));
      }
    } catch (error: any) {
      console.log(chalk.red(`    ❌ TMDB fetch failed: ${error.message}\n`));
    }
  }

  return { enriched };
}

async function tryAlternativeSearch(slug: string): Promise<any> {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!movie) return null;

  // Try different search strategies
  const searchVariations = [
    movie.title_en,
    movie.title_te,
    movie.title_en?.replace(/[0-9]/g, ''), // Remove numbers
    movie.title_en?.split(' ')[0], // First word
  ].filter(Boolean);

  for (const searchTerm of searchVariations) {
    try {
      const searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm!)}&year=${movie.release_year}`;
      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        // Get full details
        const movieId = data.results[0].id;
        const detailsUrl = `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        const detailsResponse = await fetch(detailsUrl);
        return await detailsResponse.json();
      }
    } catch (error) {
      // Continue to next variation
    }

    await new Promise(r => setTimeout(r, 250));
  }

  return null;
}

async function researchMovies(execute: boolean) {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.yellow.bold('  PHASE 3: TRY ALTERNATIVE SEARCHES (28 movies)\n'));
  console.log(chalk.gray('  Trying multiple search strategies for each movie...\n'));

  let found = 0;
  let notFound = 0;
  const foundMovies: any[] = [];
  const stillMissing: any[] = [];

  for (let i = 0; i < TO_RESEARCH.length; i++) {
    const slug = TO_RESEARCH[i];
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!movie) {
      console.log(chalk.yellow(`  [${i + 1}/${TO_RESEARCH.length}] ${slug}: Not found in DB`));
      notFound++;
      continue;
    }

    console.log(chalk.cyan(`  [${i + 1}/${TO_RESEARCH.length}] ${movie.title_en} (${movie.release_year})`));

    const tmdbData = await tryAlternativeSearch(slug);

    if (tmdbData) {
      console.log(chalk.green(`    ✓ Found: ${tmdbData.title}`));
      console.log(chalk.gray(`      TMDB ID: ${tmdbData.id}`));
      
      const director = tmdbData.credits?.crew?.find((c: any) => c.job === 'Director');
      if (director) {
        console.log(chalk.gray(`      Director: ${director.name}`));
      }

      found++;
      foundMovies.push({
        slug,
        title: movie.title_en,
        year: movie.release_year,
        tmdbId: tmdbData.id,
        tmdbTitle: tmdbData.title,
      });

      // Apply enrichment if execute mode
      if (execute) {
        const updates: any = { tmdb_id: tmdbData.id };

        if (tmdbData.poster_path) updates.poster_url = `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`;
        if (tmdbData.backdrop_path) updates.backdrop_url = `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}`;
        if (director) updates.director = director.name;

        const maleCast = tmdbData.credits?.cast?.filter((c: any) => c.gender === 2);
        const femaleCast = tmdbData.credits?.cast?.filter((c: any) => c.gender === 1);

        if (maleCast?.length > 0) updates.hero = maleCast[0].name;
        if (femaleCast?.length > 0) updates.heroine = femaleCast[0].name;
        if (tmdbData.genres) updates.genres = tmdbData.genres.map((g: any) => g.name);

        const { error } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);

        if (!error) {
          console.log(chalk.green(`      ✅ Enriched!\n`));
        } else {
          console.log(chalk.red(`      ❌ Update failed: ${error.message}\n`));
        }
      } else {
        console.log(chalk.yellow(`      (Dry run - not updated)\n`));
      }
    } else {
      console.log(chalk.red(`    ✗ Not found in TMDB`));
      notFound++;
      stillMissing.push({
        slug,
        title: movie.title_en,
        year: movie.release_year,
      });
    }

    await new Promise(r => setTimeout(r, 300));
  }

  return { found, notFound, foundMovies, stillMissing };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');

  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           FIX INCOMPLETE DATA - BATCH PROCESSING                      ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}\n`);

  // Phase 1: Delete non-movies
  const phase1 = await deleteNonMovies(execute);

  // Phase 2: Enrich from TMDB
  const phase2 = await enrichFromTMDB(execute);

  // Phase 3: Research movies
  const phase3 = await researchMovies(execute);

  // Summary
  console.log(chalk.blue.bold(`\n╔═══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.blue.bold('║                           SUMMARY                                     ║'));
  console.log(chalk.blue.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.cyan('  📊 RESULTS:\n'));
  console.log(chalk.red(`    Deleted (Non-movies):        ${phase1.deleted}/9`));
  console.log(chalk.green(`    Enriched (Known TMDB):       ${phase2.enriched}/1`));
  console.log(chalk.green(`    Found (Alternative Search):  ${phase3.found}/28`));
  console.log(chalk.yellow(`    Still Missing:               ${phase3.notFound}/28\n`));

  const totalFixed = phase1.deleted + phase2.enriched + phase3.found;
  const totalRemaining = 9 - phase1.deleted + 1 - phase2.enriched + phase3.notFound;

  console.log(chalk.blue.bold(`  Total Fixed:     ${totalFixed}/38`));
  console.log(chalk.yellow.bold(`  Total Remaining: ${totalRemaining}/38\n`));

  if (phase3.stillMissing.length > 0) {
    const reportPath = resolve(process.cwd(), 'docs/manual-review/still-missing-incomplete-data.csv');
    const csv = 'Slug,Title,Year,Action\n' + phase3.stillMissing.map(m => 
      `"${m.slug}","${m.title}",${m.year},"Manual research or consider deletion"`
    ).join('\n');
    writeFileSync(reportPath, csv);
    console.log(chalk.yellow(`  ⚠️  Manual review needed: docs/manual-review/still-missing-incomplete-data.csv\n`));
  }

  if (!execute) {
    console.log(chalk.yellow(`  Run with --execute to apply all fixes\n`));
  } else {
    console.log(chalk.green(`  ✅ All automatic fixes applied!\n`));
  }
}

main().catch(console.error);
