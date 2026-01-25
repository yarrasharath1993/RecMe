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

async function upsertCsvMovies() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      SMART UPSERT: UPDATE EXISTING + INSERT NEW MOVIES              ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Loading CSV data...\n'));
  
  const csvContent = readFileSync(CSV_FILE, 'utf8');
  const csvMovies = parseCsv(csvContent);
  
  console.log(chalk.green(`✓ CSV contains ${csvMovies.length} movies\n`));

  console.log(chalk.yellow('📋 Step 2: Analyzing database state...\n'));

  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, hero, heroine, director, release_year')
    .eq('language', 'Telugu');

  if (error) {
    console.error(chalk.red('❌ Error:'), error);
    return;
  }

  console.log(chalk.green(`✓ Database contains ${dbMovies?.length || 0} Telugu movies\n`));

  const dbMap = new Map(dbMovies?.map(m => [m.slug, m]) || []);

  let toUpdate = 0;
  let toInsert = 0;
  let alreadyPerfect = 0;

  const updates: Array<{slug: string, data: any}> = [];
  const inserts: Array<any> = [];

  for (const csvMovie of csvMovies) {
    const dbMovie = dbMap.get(csvMovie.Slug);
    
    if (dbMovie) {
      // Movie exists - check if we need to update
      let needsUpdate = false;
      const updateData: any = {};

      // Update Telugu title if missing or empty
      if (csvMovie['Title (Telugu - FILL THIS)'] && 
          csvMovie['Title (Telugu - FILL THIS)'].trim().length > 0 &&
          (!dbMovie.title_te || dbMovie.title_te.trim().length === 0)) {
        updateData.title_te = csvMovie['Title (Telugu - FILL THIS)'];
        needsUpdate = true;
      }

      // Update hero if missing
      if (csvMovie.Hero && 
          csvMovie.Hero.trim().length > 0 &&
          (!dbMovie.hero || dbMovie.hero.trim().length === 0)) {
        updateData.hero = csvMovie.Hero;
        needsUpdate = true;
      }

      // Update heroine if missing
      if (csvMovie.Heroine && 
          csvMovie.Heroine.trim().length > 0 &&
          (!dbMovie.heroine || dbMovie.heroine.trim().length === 0)) {
        updateData.heroine = csvMovie.Heroine;
        needsUpdate = true;
      }

      // Update director if missing
      if (csvMovie.Director && 
          csvMovie.Director.trim().length > 0 &&
          (!dbMovie.director || dbMovie.director.trim().length === 0)) {
        updateData.director = csvMovie.Director;
        needsUpdate = true;
      }

      if (needsUpdate) {
        updates.push({ slug: csvMovie.Slug, data: updateData });
        toUpdate++;
      } else {
        alreadyPerfect++;
      }
    } else {
      // Movie doesn't exist - insert it
      inserts.push({
        slug: csvMovie.Slug,
        title_en: csvMovie['Title (English)'],
        title_te: csvMovie['Title (Telugu - FILL THIS)'] || null,
        release_year: csvMovie['Release Year'] ? parseInt(csvMovie['Release Year']) : null,
        hero: csvMovie.Hero || null,
        heroine: csvMovie.Heroine || null,
        director: csvMovie.Director || null,
        language: 'Telugu',
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      toInsert++;
    }
  }

  console.log(chalk.cyan.bold('📊 STRATEGY BREAKDOWN:\n'));
  console.log(chalk.green(`   ✅ Already perfect: ${alreadyPerfect}`));
  console.log(chalk.yellow(`   🔄 Need to update: ${toUpdate}`));
  console.log(chalk.blue(`   ➕ Need to insert: ${toInsert}\n`));

  let updateSuccess = 0;
  let updateFailed = 0;
  let insertSuccess = 0;
  let insertFailed = 0;

  if (toUpdate > 0) {
    console.log(chalk.yellow(`📋 Step 3: Updating ${toUpdate} existing movies...\n`));

    for (let i = 0; i < updates.length; i++) {
      const { slug, data } = updates[i];
      
      const { error: updateError } = await supabase
        .from('movies')
        .update(data)
        .eq('slug', slug);

      if (updateError) {
        updateFailed++;
        console.log(chalk.red(`   ❌ ${slug}: ${updateError.message}`));
      } else {
        updateSuccess++;
        const fields = Object.keys(data).join(', ');
        console.log(chalk.green(`   ✓ ${slug} (${fields})`));
      }

      if ((i + 1) % 50 === 0) {
        console.log(chalk.cyan(`\n   Progress: ${i + 1}/${updates.length} (${Math.round((i + 1)/updates.length*100)}%)\n`));
      }
    }
    console.log('');
  }

  if (toInsert > 0) {
    console.log(chalk.yellow(`📋 Step 4: Inserting ${toInsert} new movies...\n`));

    const batchSize = 50;
    for (let i = 0; i < inserts.length; i += batchSize) {
      const batch = inserts.slice(i, i + batchSize);
      
      const { error: insertError, data } = await supabase
        .from('movies')
        .insert(batch)
        .select('slug, title_en');

      if (insertError) {
        insertFailed += batch.length;
        console.log(chalk.red(`   ❌ Batch failed: ${insertError.message}`));
      } else {
        insertSuccess += data?.length || 0;
        data?.forEach(m => {
          console.log(chalk.green(`   ✓ ${m.title_en} (${m.slug})`));
        });
      }

      const progress = Math.min(i + batchSize, inserts.length);
      const percent = Math.round((progress / inserts.length) * 100);
      console.log(chalk.cyan(`\n   Progress: ${progress}/${inserts.length} (${percent}%)\n`));
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   UPSERT COMPLETE                                     '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Updated: ${updateSuccess}/${toUpdate}`));
  console.log(chalk.green(`✅ Inserted: ${insertSuccess}/${toInsert}`));
  console.log(chalk.red(`❌ Update errors: ${updateFailed}`));
  console.log(chalk.red(`❌ Insert errors: ${insertFailed}`));
  console.log(chalk.gray(`ℹ️  Already perfect: ${alreadyPerfect}\n`));

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
  console.log(chalk.green.bold(`   Telugu title completion: ${finalPercent}%\n`));

  const barLength = 50;
  const filledBars = Math.round((finalPercent / 100) * barLength);
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(barLength - filledBars)) + ` ${finalPercent}%\n`);

  if (finalPercent >= 95) {
    console.log(chalk.green.bold('╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('║        🎉 95%+ COMPLETION ACHIEVED! 🎉                     ║'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('╚═══════════════════════════════════════════════════════════╝\n'));
  } else if (finalPercent >= 75) {
    console.log(chalk.yellow.bold(`🎊 Great progress! ${finalPercent}% completion!\n`));
  }

  // Save log
  const logLines: string[] = [];
  logLines.push('# SMART UPSERT LOG');
  logLines.push(`**Date:** ${new Date().toISOString()}\n`);
  logLines.push('## Summary\n');
  logLines.push(`- CSV movies: ${csvMovies.length}`);
  logLines.push(`- Already perfect: ${alreadyPerfect}`);
  logLines.push(`- Updated: ${updateSuccess}/${toUpdate}`);
  logLines.push(`- Inserted: ${insertSuccess}/${toInsert}`);
  logLines.push(`- Update errors: ${updateFailed}`);
  logLines.push(`- Insert errors: ${insertFailed}\n`);
  logLines.push('## Final State\n');
  logLines.push(`- Total movies: ${finalTotal}`);
  logLines.push(`- With Telugu titles: ${finalWithTelugu} (${finalPercent}%)\n`);

  const logFile = 'SMART-UPSERT-LOG-2026-01-15.md';
  writeFileSync(logFile, logLines.join('\n'));
  console.log(chalk.green(`✅ Log saved: ${logFile}\n`));

  console.log(chalk.magenta.bold('🎊 SMART UPSERT COMPLETE! 🎊\n'));
  
  if (finalPercent >= 75) {
    console.log(chalk.green('🚀 Estimated health score increase from 67 to 80+!\n'));
  }
}

upsertCsvMovies().catch(console.error);
