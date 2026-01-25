#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getMissingTeluguTitles() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         MOVIES MISSING TELUGU TITLES                                 ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const { data: movies, error, count } = await supabase
    .from('movies')
    .select('id, slug, title_en, title_te, release_year, hero, heroine, director', { count: 'exact' })
    .eq('language', 'Telugu')
    .or('title_te.is.null,title_te.eq.')
    .order('release_year', { ascending: false });

  if (error) {
    console.error(chalk.red('Error:', error.message));
    return;
  }

  console.log(`Found ${chalk.cyan(count)} movies without Telugu titles\n`);
  console.log(chalk.gray('='.repeat(100)) + '\n');
  
  movies?.forEach((movie, index) => {
    console.log(chalk.yellow(`${index + 1}. ${movie.title_en}`) + chalk.gray(` (${movie.release_year || 'Year Unknown'})`));
    console.log(chalk.dim(`   Slug: ${movie.slug}`));
    if (movie.hero) console.log(chalk.dim(`   Hero: ${movie.hero}`));
    if (movie.heroine) console.log(chalk.dim(`   Heroine: ${movie.heroine}`));
    if (movie.director) console.log(chalk.dim(`   Director: ${movie.director}`));
    console.log('');
  });
  
  console.log(chalk.gray('='.repeat(100)));
  console.log(chalk.green(`\n✅ Total: ${count} movies need Telugu titles\n`));

  // Export to CSV
  const csvHeaders = 'Slug,Title (English),Title (Telugu - FILL THIS),Release Year,Hero,Heroine,Director';
  const csvRows = movies?.map(movie =>
    [
      movie.slug,
      `"${(movie.title_en || '').replace(/"/g, '""')}"`,
      '', // Empty Telugu title to fill
      movie.release_year || '',
      `"${(movie.hero || '').replace(/"/g, '""')}"`,
      `"${(movie.heroine || '').replace(/"/g, '""')}"`,
      `"${(movie.director || '').replace(/"/g, '""')}"`,
    ].join(',')
  ) || [];
  
  const csv = [csvHeaders, ...csvRows].join('\n');
  const filename = `movies-missing-telugu-titles-${new Date().toISOString().slice(0, 10)}.csv`;
  writeFileSync(filename, csv, 'utf-8');
  
  console.log(chalk.green(`📄 Exported to CSV: ${chalk.bold(filename)}`));
  console.log(chalk.dim('\nInstructions:'));
  console.log(chalk.dim('1. Open the CSV file'));
  console.log(chalk.dim('2. Fill in the Telugu titles in the "Title (Telugu - FILL THIS)" column'));
  console.log(chalk.dim('3. Save and share the file back\n'));
}

getMissingTeluguTitles();
