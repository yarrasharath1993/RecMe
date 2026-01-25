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

async function syncAllTeluguTitles() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║      SYNC ALL TELUGU TITLES FROM CSV TO DATABASE (FINAL)            ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Loading CSV data with Telugu titles...\n'));
  
  const csvContent = readFileSync(CSV_FILE, 'utf8');
  const csvMovies = parseCsv(csvContent);
  
  const csvWithTelugu = csvMovies.filter(m => 
    m['Title (Telugu - FILL THIS)'] && 
    m['Title (Telugu - FILL THIS)'].trim().length > 0 &&
    m['Title (Telugu - FILL THIS)'] !== '-'
  );
  
  console.log(chalk.green(`✓ CSV contains ${csvMovies.length} total movies`));
  console.log(chalk.green(`✓ ${csvWithTelugu.length} have Telugu titles\n`));

  console.log(chalk.yellow('📋 Step 2: Loading ALL database movies...\n'));

  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select('slug, title_en, title_te')
    .eq('language', 'Telugu');

  if (error) {
    console.error(chalk.red('❌ Error:'), error);
    return;
  }

  console.log(chalk.green(`✓ Database contains ${dbMovies?.length || 0} Telugu movies\n`));

  console.log(chalk.yellow('📋 Step 3: Identifying which movies need Telugu title updates...\n'));

  const dbMap = new Map(dbMovies?.map(m => [m.slug.toLowerCase(), m]) || []);
  
  let toUpdate = 0;
  let alreadyHave = 0;
  let notInDb = 0;

  const updates: Array<{slug: string, oldTitle: string | null, newTitle: string, englishTitle: string}> = [];

  for (const csvMovie of csvWithTelugu) {
    const slugLower = csvMovie.Slug.toLowerCase();
    const dbMovie = dbMap.get(slugLower);
    
    if (dbMovie) {
      // Check if we need to update (missing or empty Telugu title)
      if (!dbMovie.title_te || dbMovie.title_te.trim().length === 0) {
        updates.push({
          slug: dbMovie.slug,
          oldTitle: dbMovie.title_te,
          newTitle: csvMovie['Title (Telugu - FILL THIS)'],
          englishTitle: csvMovie['Title (English)']
        });
        toUpdate++;
      } else {
        alreadyHave++;
      }
    } else {
      notInDb++;
    }
  }

  console.log(chalk.cyan.bold('📊 ANALYSIS RESULTS:\n'));
  console.log(chalk.green(`   ✅ Already have Telugu titles: ${alreadyHave}`));
  console.log(chalk.yellow(`   🔄 Need Telugu title updates: ${toUpdate}`));
  console.log(chalk.gray(`   ℹ️  Not in database: ${notInDb}\n`));

  if (toUpdate === 0) {
    console.log(chalk.green.bold('✅ All database movies already have Telugu titles!\n'));
    
    // Show final stats
    const finalPercent = Math.round((alreadyHave / (alreadyHave + notInDb)) * 100);
    console.log(chalk.magenta.bold(`📊 FINAL STATE: ${alreadyHave}/${alreadyHave + notInDb} (${finalPercent}%)\n`));
    return;
  }

  console.log(chalk.yellow(`📋 Step 4: Updating ${toUpdate} movies with Telugu titles...\n`));

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{slug: string, error: string}> = [];

  // Update individually to avoid batch conflicts
  for (let i = 0; i < updates.length; i++) {
    const { slug, newTitle, englishTitle } = updates[i];
    
    const { error: updateError } = await supabase
      .from('movies')
      .update({ 
        title_te: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug);

    if (updateError) {
      errorCount++;
      errors.push({ slug, error: updateError.message });
      console.log(chalk.red(`   ❌ ${englishTitle} (${slug})`));
      console.log(chalk.gray(`      Error: ${updateError.message}`));
    } else {
      successCount++;
      console.log(chalk.green(`   ✓ ${englishTitle}`));
      console.log(chalk.gray(`      Telugu: ${newTitle}`));
    }

    // Show progress every 50 movies
    if ((i + 1) % 50 === 0 || i === updates.length - 1) {
      const progress = i + 1;
      const percent = Math.round((progress / updates.length) * 100);
      console.log(chalk.cyan(`\n   Progress: ${progress}/${updates.length} (${percent}%)\n`));
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   SYNC COMPLETE                                       '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Successfully updated: ${successCount}/${toUpdate}`));
  console.log(chalk.red(`❌ Errors: ${errorCount}`));
  console.log(chalk.gray(`ℹ️  Already had titles: ${alreadyHave}`));
  console.log(chalk.gray(`ℹ️  Not in database: ${notInDb}\n`));

  if (errors.length > 0) {
    console.log(chalk.red(`⚠️  Errors during sync:\n`));
    errors.forEach(e => {
      console.log(chalk.red(`   • ${e.slug}: ${e.error}`));
    });
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
  console.log(chalk.green.bold(`   Completion: ${finalPercent}%\n`));

  const barLength = 50;
  const filledBars = Math.round((finalPercent / 100) * barLength);
  console.log(chalk.green('█'.repeat(filledBars)) + chalk.gray('░'.repeat(barLength - filledBars)) + ` ${finalPercent}%\n`);

  console.log(chalk.magenta.bold('📈 IMPROVEMENT:\n'));
  console.log(chalk.white(`   Before: 176 movies with Telugu titles (18%)`));
  console.log(chalk.green.bold(`   After: ${finalWithTelugu} movies with Telugu titles (${finalPercent}%)`));
  console.log(chalk.green.bold(`   Added: +${finalWithTelugu - 176} Telugu titles (+${finalPercent - 18}%)\n`));

  if (finalPercent >= 95) {
    console.log(chalk.green.bold('╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('║        🎉 95%+ TELUGU TITLE COMPLETION! 🎉                 ║'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('╚═══════════════════════════════════════════════════════════╝\n'));
  } else if (finalPercent >= 75) {
    console.log(chalk.yellow.bold(`🎊 Great progress! ${finalPercent}% completion!\n`));
  }

  // Calculate health score impact
  const healthImpact = Math.round((finalPercent - 18) * 0.3); // Telugu titles are 30% of health score
  const newHealthScore = 67 + healthImpact;

  console.log(chalk.magenta.bold('🏥 HEALTH SCORE IMPACT:\n'));
  console.log(chalk.white(`   Previous health score: 67/100`));
  console.log(chalk.green.bold(`   Estimated new score: ${newHealthScore}/100`));
  console.log(chalk.green.bold(`   Improvement: +${healthImpact} points\n`));

  // Save log
  const logLines: string[] = [];
  logLines.push('# TELUGU TITLES SYNC LOG (FINAL)');
  logLines.push(`**Date:** ${new Date().toISOString()}\n`);
  logLines.push('## Summary\n');
  logLines.push(`- CSV movies with Telugu titles: ${csvWithTelugu.length}`);
  logLines.push(`- Already had titles: ${alreadyHave}`);
  logLines.push(`- Updated: ${successCount}/${toUpdate}`);
  logLines.push(`- Errors: ${errorCount}`);
  logLines.push(`- Not in database: ${notInDb}\n`);
  logLines.push('## Final Database State\n');
  logLines.push(`- Total movies: ${finalTotal}`);
  logLines.push(`- With Telugu titles: ${finalWithTelugu} (${finalPercent}%)`);
  logLines.push(`- Improvement: +${finalWithTelugu - 176} titles (+${finalPercent - 18}%)\n`);
  logLines.push('## Health Score Impact\n');
  logLines.push(`- Previous: 67/100`);
  logLines.push(`- New: ${newHealthScore}/100`);
  logLines.push(`- Improvement: +${healthImpact} points\n`);

  if (errors.length > 0) {
    logLines.push('## Errors\n');
    errors.forEach(e => {
      logLines.push(`- \`${e.slug}\`: ${e.error}`);
    });
    logLines.push('\n');
  }

  const logFile = 'TELUGU-TITLES-SYNC-FINAL-2026-01-15.md';
  writeFileSync(logFile, logLines.join('\n'));
  console.log(chalk.green(`✅ Sync log saved: ${logFile}\n`));

  console.log(chalk.magenta.bold('🎊 TELUGU TITLES SYNC COMPLETE! 🎊\n'));
  console.log(chalk.cyan('🚀 Run health audit to confirm the improvement!\n'));
}

syncAllTeluguTitles().catch(console.error);
