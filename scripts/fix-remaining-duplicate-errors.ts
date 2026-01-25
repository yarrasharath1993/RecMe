#!/usr/bin/env npx tsx
/**
 * Fix Remaining Duplicate Errors
 * 
 * Handles movies that couldn't be deleted due to foreign key constraints
 * by updating all references and then deleting/unpublishing
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DuplicateRecord {
  type: string;
  category: string;
  id1: string;
  id2: string;
  slug1: string;
  slug2: string;
  name1: string;
  name2: string;
  year1?: number | null;
  year2?: number | null;
  match_type: string;
  confidence: number;
  reason: string;
  action: string;
  data_completeness1: string;
  data_completeness2: string;
}

// Simple CSV parser
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function calculateDataScore(movie: any): number {
  let score = 0;
  if (movie.title_en) score += 20;
  if (movie.title_te) score += 10;
  if (movie.slug) score += 20;
  if (movie.release_year) score += 20;
  if (movie.director) score += 10;
  if (movie.hero || movie.heroine) score += 10;
  if (movie.tmdb_id) score += 15;
  if (movie.imdb_id) score += 10;
  if (movie.poster_url && !movie.poster_url.includes('placeholder')) score += 10;
  if (movie.synopsis) score += 5;
  if (movie.producer) score += 5;
  if (movie.music_director) score += 5;
  return score;
}

async function fetchMovie(id: string) {
  const { data, error } = await supabase
    .from('movies')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !data) {
    return null;
  }
  return data;
}

async function updateAllReferences(deleteId: string, keepId: string): Promise<number> {
  let totalUpdated = 0;
  
  // List of tables that might reference movies
  const tables = [
    { name: 'career_milestones', column: 'movie_id' },
    { name: 'movie_reviews', column: 'movie_id' },
    { name: 'user_ratings', column: 'movie_id' },
    { name: 'movie_ratings', column: 'movie_id' },
    { name: 'movie_awards', column: 'movie_id' },
    { name: 'movie_genres', column: 'movie_id' },
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .update({ [table.column]: keepId })
        .eq(table.column, deleteId)
        .select();
      
      if (!error && data && data.length > 0) {
        totalUpdated += data.length;
      }
    } catch (e) {
      // Table or column might not exist, skip
    }
  }
  
  return totalUpdated;
}

async function forceDeleteMovie(id: string, keepId: string): Promise<boolean> {
  // First, update all references
  const refsUpdated = await updateAllReferences(id, keepId);
  if (refsUpdated > 0) {
    console.log(chalk.gray(`    ✓ Updated ${refsUpdated} references`));
  }
  
  // Try to delete
  const { error: deleteError } = await supabase
    .from('movies')
    .delete()
    .eq('id', id);
  
  if (deleteError) {
    // If still fails, unpublish
    if (deleteError.message.includes('foreign key constraint')) {
      console.log(chalk.yellow(`    ⚠️  Still has references, unpublishing instead...`));
      const { error: unpublishError } = await supabase
        .from('movies')
        .update({ is_published: false })
        .eq('id', id);
      
      if (!unpublishError) {
        console.log(chalk.yellow(`    ✓ Unpublished (has remaining references)`));
        return true;
      }
    }
    console.log(chalk.red(`    ❌ Failed: ${deleteError.message}`));
    return false;
  }
  
  return true;
}

async function processRemainingErrors() {
  console.log(chalk.bold('\n🔧 FIXING REMAINING DUPLICATE ERRORS\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');
  
  const csvPath = resolve(process.cwd(), 'DUPLICATES-AUDIT-RESULTS.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = parseCSVLine(lines[0]);
  const records: DuplicateRecord[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const record: any = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || '';
      value = value.replace(/^"|"$/g, '');
      record[header.trim()] = value;
    });
    
    if (record.year1) {
      const year = parseInt(record.year1);
      record.year1 = isNaN(year) ? null : year;
    }
    if (record.year2) {
      const year = parseInt(record.year2);
      record.year2 = isNaN(year) ? null : year;
    }
    
    records.push(record as DuplicateRecord);
  }
  
  const execute = process.argv.includes('--execute');
  
  if (!execute) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made\n'));
  }
  
  let fixed = 0;
  let notFound = 0;
  let errors = 0;
  const errorDetails: Array<{ id: string; slug: string; error: string }> = [];
  
  for (const record of records) {
    if (record.type !== 'movie') continue;
    
    // Skip rejected pairs
    const rejectedPairs = [
      'madonna-the-confessions-tour-2006|sundaraniki-thondarekkuva-2006',
      'the-king-of-kings-2025|andhra-king-taluka-2025',
      'radha-krishna-2021|krish-2021',
      'arjun-reddy-2017|dwaraka-2017',
      'ranasthalam-2019|abhinetri-2016',
      'dhruva-2016|dhuruvangal-pathinaaru-2016',
      'mental-madhilo-2017|appatlo-okadundevadu-2016',
      'ooriki-uttharana-2021|utthara-2020',
    ];
    
    const pairKey = `${record.slug1}|${record.slug2}`;
    if (rejectedPairs.some(rp => pairKey.includes(rp.split('|')[0]) || pairKey.includes(rp.split('|')[1]))) {
      continue;
    }
    
    const movie1 = await fetchMovie(record.id1);
    const movie2 = await fetchMovie(record.id2);
    
    if (!movie1 && !movie2) {
      notFound++;
      continue;
    }
    
    if (!movie1 || !movie2) {
      // One already deleted, skip
      continue;
    }
    
    // Determine which to keep
    const score1 = calculateDataScore(movie1);
    const score2 = calculateDataScore(movie2);
    
    let keepId: string;
    let deleteId: string;
    let keepMovie: any;
    let deleteMovie: any;
    
    if (score1 > score2) {
      keepId = record.id1;
      deleteId = record.id2;
      keepMovie = movie1;
      deleteMovie = movie2;
    } else if (score2 > score1) {
      keepId = record.id2;
      deleteId = record.id1;
      keepMovie = movie2;
      deleteMovie = movie1;
    } else {
      keepId = record.id1;
      deleteId = record.id2;
      keepMovie = movie1;
      deleteMovie = movie2;
    }
    
    console.log(chalk.yellow(`\n  ${deleteMovie.title_en} (${deleteMovie.release_year})`));
    console.log(chalk.gray(`    → Merging into: ${keepMovie.title_en} (${keepMovie.release_year})`));
    
    if (!execute) {
      console.log(chalk.yellow(`    (Dry run - no changes)`));
      continue;
    }
    
    // Merge data
    const updates: any = {};
    const fieldsToMerge = [
      'title_te', 'director', 'hero', 'heroine', 'producer', 'music_director',
      'tmdb_id', 'imdb_id', 'poster_url', 'synopsis', 'genres', 'runtime_minutes',
      'language', 'avg_rating', 'total_reviews'
    ];
    
    for (const field of fieldsToMerge) {
      if (!keepMovie[field] && deleteMovie[field]) {
        updates[field] = deleteMovie[field];
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('movies')
        .update(updates)
        .eq('id', keepId);
    }
    
    // Force delete
    const success = await forceDeleteMovie(deleteId, keepId);
    if (success) {
      fixed++;
      console.log(chalk.green(`    ✅ Fixed`));
    } else {
      errors++;
      errorDetails.push({
        id: deleteId,
        slug: deleteMovie.slug,
        error: 'Could not delete or unpublish',
      });
      console.log(chalk.red(`    ❌ Failed`));
    }
  }
  
  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Fixed: ${chalk.green(fixed)}`);
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
  
  if (errorDetails.length > 0) {
    console.log(chalk.red(`\n⚠️  Movies that couldn't be deleted:\n`));
    errorDetails.forEach(detail => {
      console.log(chalk.red(`  - ${detail.slug} (${detail.id})`));
    });
  }
}

processRemainingErrors().catch(console.error);
