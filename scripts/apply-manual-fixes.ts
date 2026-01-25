#!/usr/bin/env npx tsx
/**
 * APPLY MANUAL FIXES
 * 
 * Reads manual-fix-template.csv and applies poster URLs and ratings
 * to movies that couldn't be auto-enriched
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');
const CSV_FILE = args.find(arg => !arg.startsWith('--')) || 'manual-fix-template.csv';

interface ManualFix {
  id: string;
  title: string;
  year: string;
  hero: string;
  director: string;
  currentPoster: string;
  currentRating: string;
  newPosterUrl: string;
  newRating: string;
  notes: string;
}

function parseCSV(content: string): ManualFix[] {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  const fixes: ManualFix[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    
    if (values.length < 10) continue;
    
    const fix: ManualFix = {
      id: values[0].trim(),
      title: values[1].trim(),
      year: values[2].trim(),
      hero: values[3].trim(),
      director: values[4].trim(),
      currentPoster: values[5].trim(),
      currentRating: values[6].trim(),
      newPosterUrl: values[7].trim(),
      newRating: values[8].trim(),
      notes: values[9].trim(),
    };
    
    // Only include if either poster or rating is provided
    if (fix.newPosterUrl || fix.newRating) {
      fixes.push(fix);
    }
  }
  
  return fixes;
}

async function applyManualFixes() {
  console.log(chalk.blue.bold('\n🔧 APPLY MANUAL FIXES\n'));
  
  // Check if CSV exists
  if (!fs.existsSync(CSV_FILE)) {
    console.log(chalk.red(`✗ CSV file not found: ${CSV_FILE}`));
    console.log(chalk.yellow('\nUsage: npx tsx scripts/apply-manual-fixes.ts [csv-file] --execute'));
    console.log(chalk.yellow('Example: npx tsx scripts/apply-manual-fixes.ts manual-fix-template.csv --execute'));
    return;
  }
  
  // Read CSV
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const fixes = parseCSV(csvContent);
  
  if (fixes.length === 0) {
    console.log(chalk.yellow('⚠️  No fixes found in CSV'));
    console.log(chalk.yellow('   Make sure to fill in New_Poster_URL and/or New_Rating columns'));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${fixes.length} manual fixes in CSV\n`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  const stats = {
    total: fixes.length,
    processed: 0,
    posterAdded: 0,
    ratingAdded: 0,
    both: 0,
    failed: 0,
    skipped: 0,
  };
  
  for (const fix of fixes) {
    stats.processed++;
    
    console.log(chalk.cyan(`\n[${stats.processed}/${stats.total}] ${fix.title} (${fix.year})`));
    console.log(chalk.gray(`  Hero: ${fix.hero}, Director: ${fix.director}`));
    
    // Verify movie exists
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, poster_url, our_rating')
      .eq('id', fix.id)
      .single();
    
    if (fetchError || !movie) {
      console.log(chalk.red(`  ✗ Movie not found in database`));
      stats.failed++;
      continue;
    }
    
    const updates: any = {};
    const changes: string[] = [];
    
    // Add poster if provided
    if (fix.newPosterUrl && fix.newPosterUrl !== 'NULL' && fix.newPosterUrl !== '') {
      if (movie.poster_url) {
        console.log(chalk.yellow(`  ⚠️  Movie already has poster, will overwrite`));
      }
      updates.poster_url = fix.newPosterUrl;
      updates.poster_confidence = 1.0; // Manual = highest confidence
      changes.push('Poster');
      stats.posterAdded++;
    }
    
    // Add rating if provided
    if (fix.newRating && fix.newRating !== 'NULL' && fix.newRating !== '') {
      const rating = parseFloat(fix.newRating);
      if (isNaN(rating) || rating < 0 || rating > 10) {
        console.log(chalk.red(`  ✗ Invalid rating: ${fix.newRating} (must be 0-10)`));
        stats.failed++;
        continue;
      }
      
      if (movie.our_rating) {
        console.log(chalk.yellow(`  ⚠️  Movie already has rating (${movie.our_rating}), will overwrite with ${rating}`));
      }
      
      updates.our_rating = rating;
      changes.push('Rating');
      stats.ratingAdded++;
    }
    
    if (changes.length === 0) {
      console.log(chalk.gray(`  → No changes to apply`));
      stats.skipped++;
      continue;
    }
    
    if (changes.length === 2) {
      stats.both++;
    }
    
    if (EXECUTE) {
      updates.updated_at = new Date().toISOString();
      updates.data_sources = movie.data_sources || [];
      if (!updates.data_sources.includes('manual')) {
        updates.data_sources.push('manual');
      }
      
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', fix.id);
      
      if (updateError) {
        console.log(chalk.red(`  ✗ Update failed: ${updateError.message}`));
        stats.failed++;
      } else {
        console.log(chalk.green(`  ✓ Updated: ${changes.join(' + ')}`));
        if (fix.notes) {
          console.log(chalk.gray(`    Note: ${fix.notes}`));
        }
      }
    } else {
      console.log(chalk.yellow(`  ⊳ Would add: ${changes.join(' + ')}`));
      if (fix.notes) {
        console.log(chalk.gray(`    Note: ${fix.notes}`));
      }
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('MANUAL FIX SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Fixes in CSV:    ${stats.total}`));
  console.log(chalk.white(`Processed:             ${stats.processed}`));
  console.log(chalk.green(`Posters Added:         ${stats.posterAdded}`));
  console.log(chalk.green(`Ratings Added:         ${stats.ratingAdded}`));
  console.log(chalk.cyan(`Both Added:            ${stats.both}`));
  console.log(chalk.gray(`Skipped (no data):     ${stats.skipped}`));
  console.log(chalk.red(`Failed:                ${stats.failed}`));
  
  const successRate = stats.processed > 0 ? 
    Math.round(((stats.posterAdded + stats.ratingAdded) / (stats.processed * 2)) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:          ${successRate}%`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes made'));
    console.log(chalk.yellow('   Run with --execute to apply'));
  } else {
    console.log(chalk.green('\n✓ Manual fixes applied!'));
    
    // Check how many are now ready to publish
    const readyCount = stats.posterAdded > 0 && stats.ratingAdded > 0 ? stats.both : 0;
    if (readyCount > 0) {
      console.log(chalk.cyan(`\n📤 ${readyCount} movies now have both poster and rating!`));
      console.log(chalk.cyan('   Run publish script to publish them'));
    }
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

applyManualFixes()
  .then(() => {
    console.log(chalk.green('✓ Manual fix application completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Manual fix failed:'), error);
    process.exit(1);
  });
