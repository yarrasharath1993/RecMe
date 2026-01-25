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

async function syncAllCorrections() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║   SYNC ALL CORRECTIONS FROM CSV TO DATABASE (COMPREHENSIVE)         ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.yellow('📋 Step 1: Loading CSV data with all corrections...\n'));
  
  const csvContent = readFileSync(CSV_FILE, 'utf8');
  const csvMovies = parseCsv(csvContent);
  
  console.log(chalk.green(`✓ CSV contains ${csvMovies.length} curated movies with corrections\n`));

  console.log(chalk.yellow('📋 Step 2: Loading database movies...\n'));

  const { data: dbMovies, error } = await supabase
    .from('movies')
    .select('slug, title_en, title_te, release_year, hero, heroine, director')
    .eq('language', 'Telugu');

  if (error) {
    console.error(chalk.red('❌ Error:'), error);
    return;
  }

  console.log(chalk.green(`✓ Database contains ${dbMovies?.length || 0} Telugu movies\n`));

  console.log(chalk.yellow('📋 Step 3: Analyzing what corrections are needed...\n'));

  const dbMap = new Map(dbMovies?.map(m => [m.slug.toLowerCase(), m]) || []);
  
  const corrections = {
    teluguTitle: 0,
    englishTitle: 0,
    hero: 0,
    heroine: 0,
    director: 0,
    releaseYear: 0,
    multiple: 0
  };

  const updates: Array<{
    slug: string;
    data: any;
    changes: string[];
    csvTitle: string;
  }> = [];

  let alreadyPerfect = 0;
  let notInDb = 0;

  for (const csvMovie of csvMovies) {
    const slugLower = csvMovie.Slug.toLowerCase();
    const dbMovie = dbMap.get(slugLower);
    
    if (!dbMovie) {
      notInDb++;
      continue;
    }

    const updateData: any = {};
    const changes: string[] = [];
    let needsUpdate = false;

    // 1. Telugu Title
    if (csvMovie['Title (Telugu - FILL THIS)'] && 
        csvMovie['Title (Telugu - FILL THIS)'].trim().length > 0 &&
        csvMovie['Title (Telugu - FILL THIS)'] !== '-' &&
        (!dbMovie.title_te || dbMovie.title_te.trim().length === 0)) {
      updateData.title_te = csvMovie['Title (Telugu - FILL THIS)'];
      changes.push('Telugu title');
      corrections.teluguTitle++;
      needsUpdate = true;
    }

    // 2. English Title (if significantly different or missing)
    if (csvMovie['Title (English)'] && 
        csvMovie['Title (English)'].trim().length > 0 &&
        (!dbMovie.title_en || dbMovie.title_en.trim().length === 0)) {
      updateData.title_en = csvMovie['Title (English)'];
      changes.push('English title');
      corrections.englishTitle++;
      needsUpdate = true;
    }

    // 3. Hero
    if (csvMovie.Hero && 
        csvMovie.Hero.trim().length > 0 &&
        csvMovie.Hero !== 'No Hero Lead' &&
        (!dbMovie.hero || dbMovie.hero.trim().length === 0)) {
      updateData.hero = csvMovie.Hero;
      changes.push('Hero');
      corrections.hero++;
      needsUpdate = true;
    }

    // 4. Heroine
    if (csvMovie.Heroine && 
        csvMovie.Heroine.trim().length > 0 &&
        csvMovie.Heroine !== 'No Female Lead' &&
        (!dbMovie.heroine || dbMovie.heroine.trim().length === 0)) {
      updateData.heroine = csvMovie.Heroine;
      changes.push('Heroine');
      corrections.heroine++;
      needsUpdate = true;
    }

    // 5. Director
    if (csvMovie.Director && 
        csvMovie.Director.trim().length > 0 &&
        (!dbMovie.director || dbMovie.director.trim().length === 0)) {
      updateData.director = csvMovie.Director;
      changes.push('Director');
      corrections.director++;
      needsUpdate = true;
    }

    // 6. Release Year
    if (csvMovie['Release Year'] && 
        csvMovie['Release Year'].trim().length > 0 &&
        !isNaN(parseInt(csvMovie['Release Year'])) &&
        !dbMovie.release_year) {
      updateData.release_year = parseInt(csvMovie['Release Year']);
      changes.push('Release year');
      corrections.releaseYear++;
      needsUpdate = true;
    }

    if (needsUpdate) {
      if (changes.length > 1) corrections.multiple++;
      updates.push({
        slug: dbMovie.slug,
        data: updateData,
        changes,
        csvTitle: csvMovie['Title (English)']
      });
    } else {
      alreadyPerfect++;
    }
  }

  console.log(chalk.cyan.bold('📊 CORRECTIONS NEEDED:\n'));
  console.log(chalk.yellow(`   🔤 Telugu titles: ${corrections.teluguTitle}`));
  console.log(chalk.yellow(`   📝 English titles: ${corrections.englishTitle}`));
  console.log(chalk.yellow(`   👤 Hero corrections: ${corrections.hero}`));
  console.log(chalk.yellow(`   👤 Heroine corrections: ${corrections.heroine}`));
  console.log(chalk.yellow(`   🎬 Director corrections: ${corrections.director}`));
  console.log(chalk.yellow(`   📅 Release year corrections: ${corrections.releaseYear}`));
  console.log(chalk.magenta(`   🔀 Multiple corrections: ${corrections.multiple}\n`));
  
  console.log(chalk.cyan.bold('📊 SUMMARY:\n'));
  console.log(chalk.green(`   ✅ Already perfect: ${alreadyPerfect}`));
  console.log(chalk.yellow(`   🔄 Need corrections: ${updates.length}`));
  console.log(chalk.gray(`   ℹ️  Not in database: ${notInDb}\n`));

  if (updates.length === 0) {
    console.log(chalk.green.bold('✅ All database movies are already up to date!\n'));
    return;
  }

  console.log(chalk.yellow(`📋 Step 4: Applying ${updates.length} corrections...\n`));

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{slug: string, error: string}> = [];

  for (let i = 0; i < updates.length; i++) {
    const { slug, data, changes, csvTitle } = updates[i];
    
    const { error: updateError } = await supabase
      .from('movies')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug);

    if (updateError) {
      errorCount++;
      errors.push({ slug, error: updateError.message });
      console.log(chalk.red(`   ❌ ${csvTitle} (${slug})`));
      console.log(chalk.gray(`      Error: ${updateError.message}`));
    } else {
      successCount++;
      console.log(chalk.green(`   ✓ ${csvTitle}`));
      console.log(chalk.cyan(`      Updated: ${changes.join(', ')}`));
    }

    if ((i + 1) % 50 === 0 || i === updates.length - 1) {
      const progress = i + 1;
      const percent = Math.round((progress / updates.length) * 100);
      console.log(chalk.cyan(`\n   Progress: ${progress}/${updates.length} (${percent}%)\n`));
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('                   COMPREHENSIVE SYNC COMPLETE                         '));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));

  console.log(chalk.green(`✅ Successfully updated: ${successCount}/${updates.length}`));
  console.log(chalk.red(`❌ Errors: ${errorCount}`));
  console.log(chalk.gray(`ℹ️  Already perfect: ${alreadyPerfect}`));
  console.log(chalk.gray(`ℹ️  Not in database: ${notInDb}\n`));

  console.log(chalk.magenta.bold('📊 CORRECTIONS APPLIED:\n'));
  console.log(chalk.green(`   ✅ Telugu titles added: ${corrections.teluguTitle}`));
  console.log(chalk.green(`   ✅ English titles fixed: ${corrections.englishTitle}`));
  console.log(chalk.green(`   ✅ Hero info added: ${corrections.hero}`));
  console.log(chalk.green(`   ✅ Heroine info added: ${corrections.heroine}`));
  console.log(chalk.green(`   ✅ Director info added: ${corrections.director}`));
  console.log(chalk.green(`   ✅ Release years added: ${corrections.releaseYear}`));
  console.log(chalk.green(`   ✅ Movies with multiple fixes: ${corrections.multiple}\n`));

  if (errors.length > 0) {
    console.log(chalk.red(`⚠️  Errors during sync:\n`));
    errors.slice(0, 10).forEach(e => {
      console.log(chalk.red(`   • ${e.slug}: ${e.error}`));
    });
    if (errors.length > 10) {
      console.log(chalk.gray(`   ... and ${errors.length - 10} more errors\n`));
    }
    console.log('');
  }

  console.log(chalk.yellow('📋 Step 5: Verifying final database health...\n'));

  const { data: finalCheck, error: finalError } = await supabase
    .from('movies')
    .select('slug, title_te, title_en, hero, heroine, director, release_year')
    .eq('language', 'Telugu');

  if (finalError) {
    console.error(chalk.red('❌ Error verifying:'), finalError);
    return;
  }

  const stats = {
    total: finalCheck?.length || 0,
    withTeluguTitle: finalCheck?.filter(m => m.title_te && m.title_te.trim().length > 0).length || 0,
    withEnglishTitle: finalCheck?.filter(m => m.title_en && m.title_en.trim().length > 0).length || 0,
    withHero: finalCheck?.filter(m => m.hero && m.hero.trim().length > 0).length || 0,
    withHeroine: finalCheck?.filter(m => m.heroine && m.heroine.trim().length > 0).length || 0,
    withDirector: finalCheck?.filter(m => m.director && m.director.trim().length > 0).length || 0,
    withYear: finalCheck?.filter(m => m.release_year).length || 0
  };

  console.log(chalk.cyan.bold('📊 FINAL DATABASE STATE:\n'));
  console.log(chalk.white(`   Total movies: ${stats.total}\n`));
  console.log(chalk.green(`   ✅ Telugu titles: ${stats.withTeluguTitle}/${stats.total} (${Math.round(stats.withTeluguTitle/stats.total*100)}%)`));
  console.log(chalk.green(`   ✅ English titles: ${stats.withEnglishTitle}/${stats.total} (${Math.round(stats.withEnglishTitle/stats.total*100)}%)`));
  console.log(chalk.green(`   ✅ Hero: ${stats.withHero}/${stats.total} (${Math.round(stats.withHero/stats.total*100)}%)`));
  console.log(chalk.green(`   ✅ Heroine: ${stats.withHeroine}/${stats.total} (${Math.round(stats.withHeroine/stats.total*100)}%)`));
  console.log(chalk.green(`   ✅ Director: ${stats.withDirector}/${stats.total} (${Math.round(stats.withDirector/stats.total*100)}%)`));
  console.log(chalk.green(`   ✅ Release year: ${stats.withYear}/${stats.total} (${Math.round(stats.withYear/stats.total*100)}%)\n`));

  const avgCompletion = Math.round(
    ((stats.withTeluguTitle/stats.total) * 30 +
     (stats.withHero/stats.total) * 15 +
     (stats.withHeroine/stats.total) * 10 +
     (stats.withDirector/stats.total) * 15 +
     (stats.withYear/stats.total) * 10 +
     (stats.withEnglishTitle/stats.total) * 20) * 100
  );

  console.log(chalk.magenta.bold(`🏥 ESTIMATED NEW HEALTH SCORE: ${avgCompletion}/100\n`));
  console.log(chalk.white(`   Previous: 67/100`));
  console.log(chalk.green.bold(`   New: ${avgCompletion}/100`));
  console.log(chalk.green.bold(`   Improvement: +${avgCompletion - 67} points\n`));

  if (avgCompletion >= 90) {
    console.log(chalk.green.bold('╔═══════════════════════════════════════════════════════════╗'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('║        🎉 A+ GRADE ACHIEVED! 🎉                            ║'));
    console.log(chalk.green.bold('║                                                           ║'));
    console.log(chalk.green.bold('╚═══════════════════════════════════════════════════════════╝\n'));
  } else if (avgCompletion >= 85) {
    console.log(chalk.yellow.bold(`🎊 Excellent! B+ Grade (${avgCompletion}/100)\n`));
  } else if (avgCompletion >= 75) {
    console.log(chalk.yellow.bold(`🎊 Good progress! C+ Grade (${avgCompletion}/100)\n`));
  }

  // Save comprehensive log
  const logLines: string[] = [];
  logLines.push('# COMPREHENSIVE CORRECTIONS SYNC LOG');
  logLines.push(`**Date:** ${new Date().toISOString()}\n`);
  logLines.push('## Summary\n');
  logLines.push(`- CSV movies: ${csvMovies.length}`);
  logLines.push(`- Already perfect: ${alreadyPerfect}`);
  logLines.push(`- Corrections applied: ${successCount}/${updates.length}`);
  logLines.push(`- Errors: ${errorCount}`);
  logLines.push(`- Not in database: ${notInDb}\n`);
  
  logLines.push('## Corrections Breakdown\n');
  logLines.push(`- Telugu titles: ${corrections.teluguTitle}`);
  logLines.push(`- English titles: ${corrections.englishTitle}`);
  logLines.push(`- Hero: ${corrections.hero}`);
  logLines.push(`- Heroine: ${corrections.heroine}`);
  logLines.push(`- Director: ${corrections.director}`);
  logLines.push(`- Release year: ${corrections.releaseYear}`);
  logLines.push(`- Multiple corrections: ${corrections.multiple}\n`);
  
  logLines.push('## Final Database State\n');
  logLines.push(`- Total movies: ${stats.total}`);
  logLines.push(`- Telugu titles: ${stats.withTeluguTitle} (${Math.round(stats.withTeluguTitle/stats.total*100)}%)`);
  logLines.push(`- English titles: ${stats.withEnglishTitle} (${Math.round(stats.withEnglishTitle/stats.total*100)}%)`);
  logLines.push(`- Hero: ${stats.withHero} (${Math.round(stats.withHero/stats.total*100)}%)`);
  logLines.push(`- Heroine: ${stats.withHeroine} (${Math.round(stats.withHeroine/stats.total*100)}%)`);
  logLines.push(`- Director: ${stats.withDirector} (${Math.round(stats.withDirector/stats.total*100)}%)`);
  logLines.push(`- Release year: ${stats.withYear} (${Math.round(stats.withYear/stats.total*100)}%)\n`);
  
  logLines.push('## Health Score\n');
  logLines.push(`- Previous: 67/100`);
  logLines.push(`- New: ${avgCompletion}/100`);
  logLines.push(`- Improvement: +${avgCompletion - 67} points\n`);

  if (errors.length > 0) {
    logLines.push('## Errors\n');
    errors.forEach(e => {
      logLines.push(`- \`${e.slug}\`: ${e.error}`);
    });
    logLines.push('\n');
  }

  const logFile = 'COMPREHENSIVE-CORRECTIONS-SYNC-2026-01-15.md';
  writeFileSync(logFile, logLines.join('\n'));
  console.log(chalk.green(`✅ Comprehensive log saved: ${logFile}\n`));

  console.log(chalk.magenta.bold('🎊 ALL CORRECTIONS SYNCED TO DATABASE! 🎊\n'));
  console.log(chalk.cyan('🚀 Run health audit to confirm the improvements!\n'));
}

syncAllCorrections().catch(console.error);
