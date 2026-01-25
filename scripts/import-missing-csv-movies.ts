#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CSV_FILE = 'movies-missing-telugu-titles-2026-01-14.csv';

interface MovieData {
  Slug: string;
  'Title (English)': string;
  'Title (Telugu - FILL THIS)': string;
  'Release Year': string;
  Hero: string;
  Heroine: string;
  Director: string;
}

function parseCsv(csvString: string): MovieData[] {
  const lines = csvString.split('\n');
  const movies: MovieData[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.length >= 7) {
      movies.push({
        'Slug': values[0],
        'Title (English)': values[1].replace(/^"|"$/g, ''),
        'Title (Telugu - FILL THIS)': values[2],
        'Release Year': values[3],
        'Hero': values[4].replace(/^"|"$/g, ''),
        'Heroine': values[5].replace(/^"|"$/g, ''),
        'Director': values[6].replace(/^"|"$/g, ''),
      });
    }
  }

  return movies;
}

async function importMissingMovies() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      IMPORT MISSING CSV MOVIES TO DATABASE (MERGE STRATEGY)         ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Loading CSV data...\n'));
  
  const csvContent = readFileSync(CSV_FILE, 'utf8');
  const csvMovies = parseCsv(csvContent);
  
  console.log(chalk.green(`✓ CSV contains ${csvMovies.length} movies\n`));

  console.log(chalk.yellow('📋 Step 2: Identifying movies not in database...\n'));

  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select('slug')
    .eq('language', 'Telugu');

  if (error) {
    console.error(chalk.red('❌ Error:'), error);
    return;
  }

  const dbSlugs = new Set(dbMovies?.map(m => m.slug) || []);
  const missingMovies = csvMovies.filter(m => !dbSlugs.has(m.Slug));

  console.log(chalk.green(`✓ Found ${missingMovies.length} movies to import\n`));

  if (missingMovies.length === 0) {
    console.log(chalk.green.bold('✅ All CSV movies are already in database!\n'));
    return;
  }

  // Analyze by year
  const byYear: Record<string, number> = {};
  missingMovies.forEach(m => {
    const year = m['Release Year'] || 'Unknown';
    byYear[year] = (byYear[year] || 0) + 1;
  });

  console.log(chalk.cyan('📊 Missing Movies by Year:\n'));
  Object.entries(byYear)
    .sort((a, b) => {
      if (a[0] === 'Unknown') return 1;
      if (b[0] === 'Unknown') return 1;
      return parseInt(b[0]) - parseInt(a[0]);
    })
    .forEach(([year, count]) => {
      console.log(chalk.white(`   ${year}: ${count} movies`));
    });
  console.log('');

  console.log(chalk.yellow(`📋 Step 3: Preparing movie data for import...\n`));

  const moviesToInsert = missingMovies.map(movie => ({
    slug: movie.Slug,
    title_en: movie['Title (English)'],
    title_te: movie['Title (Telugu - FILL THIS)'] || null,
    release_year: movie['Release Year'] ? parseInt(movie['Release Year']) : null,
    hero: movie.Hero || null,
    heroine: movie.Heroine || null,
    director: movie.Director || null,
    language: 'Telugu',
    is_published: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));

  console.log(chalk.yellow(`📋 Step 4: Importing ${moviesToInsert.length} movies in batches...\n`));

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{slug: string, error: string}> = [];
  const imported: string[] = [];

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < moviesToInsert.length; i += batchSize) {
    const batch = moviesToInsert.slice(i, i + batchSize);
    
    const { error: insertError, data } = await supabase
      .from('movies')
      .insert(batch)
      .select('slug, title_en');

    if (insertError) {
      console.log(chalk.red(`   ❌ Batch ${Math.floor(i/batchSize) + 1} failed: ${insertError.message}`));
      errorCount += batch.length;
      batch.forEach(m => {
        errors.push({ slug: m.slug, error: insertError.message });
      });
    } else {
      successCount += batch.length;
      data?.forEach(m => {
        imported.push(m.slug);
        console.log(chalk.green(`   ✓ ${m.title_en} (${m.slug})`));
      });
    }

    const progress = Math.min(i + batchSize, moviesToInsert.length);
    const percent = Math.round((progress / moviesToInsert.length) * 100);
    console.log(chalk.cyan(`\n   Progress: ${progress}/${moviesToInsert.length} (${percent}%)\n`));
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   IMPORT COMPLETE                                     '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Successfully imported: ${successCount}`));
  console.log(chalk.red(`❌ Errors: ${errorCount}\n`));

  if (errors.length > 0) {
    console.log(chalk.red(`⚠️  Import errors:\n`));
    errors.slice(0, 10).forEach(e => {
      console.log(chalk.red(`   • ${e.slug}: ${e.error}`));
    });
    if (errors.length > 10) {
      console.log(chalk.gray(`   ... and ${errors.length - 10} more errors\n`));
    }
    console.log('');
  }

  console.log(chalk.yellow('📋 Step 5: Verifying final database state...\n'));

  const { data: finalCheck, error: finalError } = await supabase
    .from('movies')
    .select('slug, title_te')
    .eq('language', 'Telugu');

  if (finalError) {
    console.error(chalk.red('❌ Error verifying:'), finalError);
    return;
  }

  const finalTotal = finalCheck?.length || 0;
  const finalWithTelugu = finalCheck?.filter(m => m.title_te && m.title_te.trim().length > 0).length || 0;
  const finalPercent = Math.round((finalWithTelugu / finalTotal) * 100);

  console.log(chalk.cyan.bold('📊 FINAL DATABASE STATE:\n'));
  console.log(chalk.white(`   Total Telugu movies: ${finalTotal}`));
  console.log(chalk.white(`   With Telugu titles: ${finalWithTelugu}`));
  console.log(chalk.white(`   Movies imported: ${successCount}`));
  console.log(chalk.green.bold(`   Telugu title completion: ${finalPercent}%\n`));

  const expectedTotal = 1000 + successCount;
  console.log(chalk.magenta.bold(`🎉 DATABASE GROWTH:\n`));
  console.log(chalk.white(`   Before: 1000 movies`));
  console.log(chalk.white(`   Added: ${successCount} movies`));
  console.log(chalk.green.bold(`   After: ${finalTotal} movies\n`));

  if (finalTotal >= expectedTotal - 10) {
    console.log(chalk.green.bold('╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('║        🎊 MERGE COMPLETE - MOST COMPREHENSIVE! 🎊         ║'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold(`║   ${finalTotal} Total Movies - Most Complete Database!        ║`));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('╚═══════════════════════════════════════════════════════════╝\n'));
  }

  // Calculate new Telugu titles from imported movies
  const importedWithTelugu = imported.filter(slug => {
    const csvMovie = csvMovies.find(m => m.Slug === slug);
    return csvMovie && csvMovie['Title (Telugu - FILL THIS)'] && csvMovie['Title (Telugu - FILL THIS)'].trim().length > 0;
  }).length;

  console.log(chalk.cyan.bold('📊 TELUGU TITLES IMPACT:\n'));
  console.log(chalk.white(`   Imported movies with Telugu titles: ${importedWithTelugu}/${successCount}`));
  console.log(chalk.white(`   Previous Telugu title %: 23%`));
  console.log(chalk.green.bold(`   New Telugu title %: ${finalPercent}%`));
  console.log(chalk.green.bold(`   Improvement: +${finalPercent - 23}%\n`));

  // Save import log
  const logLines: string[] = [];
  logLines.push('# MISSING MOVIES IMPORT LOG (MERGE STRATEGY)');
  logLines.push(`**Date:** ${new Date().toISOString()}`);
  logLines.push(`**Strategy:** Merge CSV + Database\n`);
  logLines.push('## Summary\n');
  logLines.push(`- Movies to import: ${missingMovies.length}`);
  logLines.push(`- Successfully imported: ${successCount}`);
  logLines.push(`- Errors: ${errorCount}\n`);
  logLines.push('## Final Database State\n');
  logLines.push(`- Total movies: ${finalTotal}`);
  logLines.push(`- With Telugu titles: ${finalWithTelugu} (${finalPercent}%)`);
  logLines.push(`- Database growth: 1000 → ${finalTotal} (+${successCount})\n`);
  logLines.push('## Movies by Year\n');
  Object.entries(byYear).forEach(([year, count]) => {
    logLines.push(`- ${year}: ${count} movies`);
  });
  logLines.push('\n');

  if (errors.length > 0) {
    logLines.push('## Import Errors\n');
    errors.forEach(e => {
      logLines.push(`- \`${e.slug}\`: ${e.error}`);
    });
    logLines.push('\n');
  }

  logLines.push('## Imported Movies\n');
  imported.forEach(slug => {
    const movie = csvMovies.find(m => m.Slug === slug);
    if (movie) {
      logLines.push(`- ${movie['Title (English)']} (\`${slug}\`) - ${movie['Release Year']}`);
    }
  });
  logLines.push('\n');

  const logFile = 'MISSING-MOVIES-IMPORT-LOG-2026-01-15.md';
  writeFileSync(logFile, logLines.join('\n'));
  console.log(chalk.green(`✅ Import log saved: ${logFile}\n`));

  console.log(chalk.magenta.bold('🎊 MERGE STRATEGY COMPLETE! 🎊\n'));
  console.log(chalk.cyan('🚀 Next: Run health audit to see the improvement!\n'));
}

importMissingMovies().catch(console.error);
