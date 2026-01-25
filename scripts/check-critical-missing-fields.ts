#!/usr/bin/env npx tsx
/**
 * Check Critical Missing Fields
 * 
 * List movies with critical missing data for quick fixes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCriticalFields() {
  console.log(chalk.blue.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              CRITICAL MISSING FIELDS - QUICK FIX LIST                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  // 1. Missing Directors
  console.log(chalk.red.bold('\n  1. MISSING DIRECTOR:\n'));
  const { data: noDirector } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id')
    .or('director.is.null,director.eq.""')
    .order('release_year', { ascending: false })
    .limit(10);

  noDirector?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year}) ${movie.tmdb_id ? chalk.yellow('[TMDB:' + movie.tmdb_id + ']') : chalk.red('[NO TMDB]')}`));
    console.log(chalk.gray(`        http://localhost:3000/movies/${movie.slug}\n`));
  });

  // 2. Missing Hero
  console.log(chalk.red.bold('\n  2. MISSING HERO:\n'));
  const { data: noHero } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id, director')
    .or('hero.is.null,hero.eq.""')
    .order('release_year', { ascending: false })
    .limit(10);

  noHero?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year})`));
    console.log(chalk.gray(`        Director: ${movie.director || 'Unknown'} ${movie.tmdb_id ? chalk.yellow('[TMDB:' + movie.tmdb_id + ']') : chalk.red('[NO TMDB]')}`));
    console.log(chalk.gray(`        http://localhost:3000/movies/${movie.slug}\n`));
  });

  // 3. Missing Heroine
  console.log(chalk.red.bold('\n  3. MISSING HEROINE:\n'));
  const { data: noHeroine } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id, director, hero')
    .or('heroine.is.null,heroine.eq.""')
    .order('release_year', { ascending: false })
    .limit(10);

  noHeroine?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year})`));
    console.log(chalk.gray(`        Director: ${movie.director || 'Unknown'}, Hero: ${movie.hero || 'Unknown'} ${movie.tmdb_id ? chalk.yellow('[TMDB:' + movie.tmdb_id + ']') : chalk.red('[NO TMDB]')}`));
    console.log(chalk.gray(`        http://localhost:3000/movies/${movie.slug}\n`));
  });

  // 4. Missing Poster
  console.log(chalk.red.bold('\n  4. MISSING POSTER:\n'));
  const { data: noPoster } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id, director')
    .or('poster_url.is.null,poster_url.eq.""')
    .order('release_year', { ascending: false })
    .limit(10);

  noPoster?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year})`));
    console.log(chalk.gray(`        Director: ${movie.director || 'Unknown'} ${movie.tmdb_id ? chalk.yellow('[TMDB:' + movie.tmdb_id + ']') : chalk.red('[NO TMDB]')}`));
    console.log(chalk.gray(`        http://localhost:3000/movies/${movie.slug}\n`));
  });

  // 5. Missing Genres
  console.log(chalk.red.bold('\n  5. MISSING GENRES:\n'));
  const { data: noGenres } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id')
    .or('genres.is.null,genres.eq.{}')
    .order('release_year', { ascending: false })
    .limit(10);

  noGenres?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year}) ${movie.tmdb_id ? chalk.yellow('[TMDB:' + movie.tmdb_id + ']') : chalk.red('[NO TMDB]')}`));
    console.log(chalk.gray(`        http://localhost:3000/movies/${movie.slug}\n`));
  });

  // 6. Missing Telugu Synopsis
  console.log(chalk.yellow.bold('\n  6. MISSING TELUGU SYNOPSIS (Top 10):\n'));
  const { data: noSynopsisTe } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, tmdb_id')
    .or('synopsis_te.is.null,synopsis_te.eq.""')
    .order('release_year', { ascending: false })
    .limit(10);

  noSynopsisTe?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year}) ${movie.tmdb_id ? chalk.yellow('[TMDB:' + movie.tmdb_id + ']') : chalk.red('[NO TMDB]')}`));
  });

  // 7. Missing TMDB ID
  console.log(chalk.yellow.bold('\n\n  7. MISSING TMDB ID (Top 10 recent movies):\n'));
  const { data: noTmdb } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, director, hero')
    .is('tmdb_id', null)
    .gte('release_year', 2020)
    .order('release_year', { ascending: false })
    .limit(10);

  noTmdb?.forEach((movie, i) => {
    const title = movie.title_en || movie.title_te || 'Untitled';
    console.log(chalk.gray(`    ${(i + 1).toString().padStart(2)}. ${title} (${movie.release_year})`));
    console.log(chalk.gray(`        Director: ${movie.director || 'Unknown'}, Hero: ${movie.hero || 'Unknown'}`));
    console.log(chalk.gray(`        http://localhost:3000/movies/${movie.slug}\n`));
  });

  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY\n'));
  console.log(chalk.gray('  Most critical issues are minimal!'));
  console.log(chalk.gray('  Focus areas: TMDB linking, Telugu synopses, backdrop images\n'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════════════\n'));
}

async function main() {
  await checkCriticalFields();
}

main().catch(console.error);
