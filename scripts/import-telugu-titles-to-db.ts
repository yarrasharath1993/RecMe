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

async function importTeluguTitles() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      IMPORT TELUGU TITLES FROM CSV TO DATABASE                      ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Reading CSV file...\n'));
  
  const csvContent = readFileSync(CSV_FILE, 'utf8');
  const movies = parseCsv(csvContent);
  
  const moviesWithTeluguTitles = movies.filter(m => 
    m['Title (Telugu - FILL THIS)'] && 
    m['Title (Telugu - FILL THIS)'].trim().length > 0 &&
    m['Title (Telugu - FILL THIS)'] !== '-'
  );

  console.log(chalk.green(`✓ Loaded ${movies.length} total movies from CSV`));
  console.log(chalk.green(`✓ Found ${moviesWithTeluguTitles.length} movies with Telugu titles\n`));

  console.log(chalk.yellow('📋 Step 2: Fetching current database state...\n'));

  const { data: dbMovies, error: fetchError } = await supabase
    .from('movies')
    .select('slug, title_te, title_en')
    .eq('language', 'Telugu');

  if (fetchError) {
    console.error(chalk.red('❌ Error fetching movies:'), fetchError);
    return;
  }

  console.log(chalk.green(`✓ Found ${dbMovies?.length || 0} Telugu movies in database\n`));

  // Create a map for quick lookup
  const dbMovieMap = new Map(dbMovies?.map(m => [m.slug, m]) || []);

  console.log(chalk.yellow('📋 Step 3: Identifying movies to update...\n'));

  const toUpdate: Array<{slug: string, csvTitle: string, dbTitle: string | null, englishTitle: string}> = [];
  const notInDb: Array<{slug: string, csvTitle: string, englishTitle: string}> = [];
  const alreadyHave: Array<{slug: string, title: string}> = [];

  for (const movie of moviesWithTeluguTitles) {
    const dbMovie = dbMovieMap.get(movie.Slug);
    
    if (!dbMovie) {
      notInDb.push({
        slug: movie.Slug,
        csvTitle: movie['Title (Telugu - FILL THIS)'],
        englishTitle: movie['Title (English)']
      });
    } else if (!dbMovie.title_te || dbMovie.title_te.trim().length === 0) {
      toUpdate.push({
        slug: movie.Slug,
        csvTitle: movie['Title (Telugu - FILL THIS)'],
        dbTitle: null,
        englishTitle: movie['Title (English)']
      });
    } else {
      alreadyHave.push({
        slug: movie.Slug,
        title: dbMovie.title_te
      });
    }
  }

  console.log(chalk.cyan('📊 Analysis Results:\n'));
  console.log(chalk.green(`   ✅ Already have Telugu titles: ${alreadyHave.length}`));
  console.log(chalk.yellow(`   🔄 Need to update: ${toUpdate.length}`));
  console.log(chalk.red(`   ❌ Not in database: ${notInDb.length}\n`));

  if (notInDb.length > 0) {
    console.log(chalk.red(`⚠️  Warning: ${notInDb.length} movies in CSV are not in database:\n`));
    notInDb.slice(0, 10).forEach(m => {
      console.log(chalk.gray(`   • ${m.englishTitle} (${m.slug})`));
    });
    if (notInDb.length > 10) {
      console.log(chalk.gray(`   ... and ${notInDb.length - 10} more\n`));
    }
    console.log('');
  }

  if (toUpdate.length === 0) {
    console.log(chalk.green.bold('✅ All movies already have Telugu titles! No updates needed.\n'));
    return;
  }

  console.log(chalk.yellow(`📋 Step 4: Updating ${toUpdate.length} movies with Telugu titles...\n`));

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{slug: string, error: string}> = [];

  // Update in batches of 10
  const batchSize = 10;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    
    const updatePromises = batch.map(async (movie) => {
      const { error } = await supabase
        .from('movies')
        .update({ title_te: movie.csvTitle })
        .eq('slug', movie.slug);

      if (error) {
        errorCount++;
        errors.push({ slug: movie.slug, error: error.message });
        console.log(chalk.red(`   ❌ ${movie.englishTitle} (${movie.slug})`));
        console.log(chalk.gray(`      Error: ${error.message}`));
        return false;
      } else {
        successCount++;
        console.log(chalk.green(`   ✓ ${movie.englishTitle}`));
        console.log(chalk.gray(`      Telugu: ${movie.csvTitle}`));
        return true;
      }
    });

    await Promise.all(updatePromises);
    
    // Show progress
    const progress = Math.min(i + batchSize, toUpdate.length);
    const percent = Math.round((progress / toUpdate.length) * 100);
    console.log(chalk.cyan(`\n   Progress: ${progress}/${toUpdate.length} (${percent}%)\n`));
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   IMPORT COMPLETE                                     '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Successfully updated: ${successCount}`));
  console.log(chalk.red(`❌ Errors: ${errorCount}`));
  console.log(chalk.gray(`ℹ️  Already had titles: ${alreadyHave.length}`));
  console.log(chalk.gray(`ℹ️  Not in database: ${notInDb.length}\n`));

  if (errors.length > 0) {
    console.log(chalk.red(`⚠️  Errors occurred during import:\n`));
    errors.forEach(e => {
      console.log(chalk.red(`   • ${e.slug}: ${e.error}`));
    });
    console.log('');
  }

  // Verify final state
  console.log(chalk.yellow('📋 Step 5: Verifying final database state...\n'));

  const { data: finalCheck, error: finalError } = await supabase
    .from('movies')
    .select('slug, title_te, title_en')
    .eq('language', 'Telugu');

  if (finalError) {
    console.error(chalk.red('❌ Error verifying:'), finalError);
    return;
  }

  const finalWithTelugu = finalCheck?.filter(m => m.title_te && m.title_te.trim().length > 0).length || 0;
  const finalTotal = finalCheck?.length || 0;
  const finalPercent = Math.round((finalWithTelugu / finalTotal) * 100);

  console.log(chalk.cyan.bold('📊 FINAL DATABASE STATE:\n'));
  console.log(chalk.white(`   Total Telugu movies: ${finalTotal}`));
  console.log(chalk.white(`   With Telugu titles: ${finalWithTelugu}`));
  console.log(chalk.green.bold(`   Completion: ${finalPercent}%\n`));

  const barLength = 50;
  const filledBars = Math.round((finalPercent / 100) * barLength);
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(barLength - filledBars)) + ` ${finalPercent}%\n`);

  if (finalPercent === 100) {
    console.log(chalk.green.bold('╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('║        🎉 100% COMPLETION ACHIEVED IN DATABASE! 🎉         ║'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('╚═══════════════════════════════════════════════════════════╝\n'));
  } else if (finalPercent >= 95) {
    console.log(chalk.yellow.bold('🎊 Almost there! 95%+ completion achieved!\n'));
  } else {
    console.log(chalk.yellow.bold(`📈 Progress made! ${finalPercent}% completion.\n`));
  }

  // Save import log
  const logLines: string[] = [];
  logLines.push('# TELUGU TITLES IMPORT LOG');
  logLines.push(`**Date:** ${new Date().toISOString()}`);
  logLines.push(`**Source:** ${CSV_FILE}\n`);
  logLines.push('## Summary\n');
  logLines.push(`- Successfully updated: ${successCount}`);
  logLines.push(`- Errors: ${errorCount}`);
  logLines.push(`- Already had titles: ${alreadyHave.length}`);
  logLines.push(`- Not in database: ${notInDb.length}\n`);
  logLines.push('## Final Database State\n');
  logLines.push(`- Total movies: ${finalTotal}`);
  logLines.push(`- With Telugu titles: ${finalWithTelugu}`);
  logLines.push(`- Completion: ${finalPercent}%\n`);

  if (errors.length > 0) {
    logLines.push('## Errors\n');
    errors.forEach(e => {
      logLines.push(`- \`${e.slug}\`: ${e.error}`);
    });
    logLines.push('\n');
  }

  if (notInDb.length > 0) {
    logLines.push('## Movies Not in Database\n');
    notInDb.forEach(m => {
      logLines.push(`- ${m.englishTitle} (\`${m.slug}\`) - ${m.csvTitle}`);
    });
    logLines.push('\n');
  }

  const logFile = 'TELUGU-TITLES-IMPORT-LOG-2026-01-15.md';
  writeFileSync(logFile, logLines.join('\n'));
  console.log(chalk.green(`✅ Import log saved: ${logFile}\n`));

  console.log(chalk.magenta.bold('🎊 IMPORT PROCESS COMPLETE! 🎊\n'));
  
  if (finalPercent >= 95) {
    console.log(chalk.green('🚀 Database health score estimated to increase from 66 to 85+!\n'));
  }
}

importTeluguTitles().catch(console.error);
