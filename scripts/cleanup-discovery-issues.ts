#!/usr/bin/env npx tsx
/**
 * CLEANUP DISCOVERY ISSUES
 * 
 * Fixes issues from batch film discovery:
 * 1. Delete award entries (non-films)
 * 2. Merge duplicate entries
 * 3. Fix specific known duplicates
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse arguments
const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

interface CleanupResult {
  deletedAwards: string[];
  mergedDuplicates: Array<{ kept: string; deleted: string }>;
  errors: string[];
}

/**
 * Delete award entries (not actual films)
 */
async function deleteAwardEntries(): Promise<string[]> {
  const awardPatterns = [
    'Nandi Awards',
    'Santosham Film Awards',
    'Raghupathi Venkaiah Award',
    'Best Actor –',
    'Best Actor (',
    'Lifetime Achievement Award',
    'Special Award –',
  ];
  
  const deleted: string[] = [];
  
  for (const pattern of awardPatterns) {
    const { data: awards } = await supabase
      .from('movies')
      .select('id, title_en, release_year')
      .eq('language', 'Telugu')
      .ilike('title_en', `%${pattern}%`);
    
    if (awards && awards.length > 0) {
      console.log(chalk.yellow(`\n  Found ${awards.length} award entries matching "${pattern}":`));
      
      for (const award of awards) {
        console.log(chalk.gray(`    - ${award.title_en} (${award.release_year})`));
        
        if (EXECUTE) {
          const { error } = await supabase
            .from('movies')
            .delete()
            .eq('id', award.id);
          
          if (!error) {
            deleted.push(`${award.title_en} (${award.release_year})`);
          }
        }
      }
    }
  }
  
  return deleted;
}

/**
 * Find and merge duplicate entries
 */
async function mergeDuplicates(): Promise<Array<{ kept: string; deleted: string }>> {
  const merged: Array<{ kept: string; deleted: string }> = [];
  
  // Known duplicates to fix
  const knownDuplicates = [
    // Nagarjuna
    { title1: 'Captain Nagarjun', title2: 'Captain Nagarjuna', year: 1986 },
    { title1: 'Antam', title2: 'Antham', year: 1992 },
    // Vijayashanti
    { title1: 'Kallukul Eeram', title2: 'Kallukkul Eeram', year: 1980 },
    { title1: 'Kallu Kondoru Pennu', title2: 'Kallukondoru Pennu', year: 1998 },
    // Chiranjeevi (from earlier batch)
    { title1: 'Mana ShankaraVaraPrasad Garu', title2: 'Mana Shankara Vara Prasad Garu', year: 2026 },
  ];
  
  for (const dup of knownDuplicates) {
    console.log(chalk.cyan(`\n  Checking: "${dup.title1}" ↔ "${dup.title2}" (${dup.year})`));
    
    const { data: films } = await supabase
      .from('movies')
      .select('id, title_en, release_year, tmdb_id, hero, director, is_published')
      .eq('language', 'Telugu')
      .eq('release_year', dup.year)
      .or(`title_en.eq.${dup.title1},title_en.eq.${dup.title2}`);
    
    if (films && films.length === 2) {
      // Keep the one with more data (tmdb_id, is_published)
      const [film1, film2] = films;
      
      const score1 = (film1.tmdb_id ? 10 : 0) + 
                     (film1.is_published ? 5 : 0) + 
                     (film1.hero ? 3 : 0) + 
                     (film1.director ? 2 : 0);
      const score2 = (film2.tmdb_id ? 10 : 0) + 
                     (film2.is_published ? 5 : 0) + 
                     (film2.hero ? 3 : 0) + 
                     (film2.director ? 2 : 0);
      
      const keep = score1 >= score2 ? film1 : film2;
      const remove = score1 >= score2 ? film2 : film1;
      
      console.log(chalk.green(`    ✓ Keeping: ${keep.title_en} (score: ${score1 >= score2 ? score1 : score2})`));
      console.log(chalk.red(`    ✗ Deleting: ${remove.title_en} (score: ${score1 >= score2 ? score2 : score1})`));
      
      if (EXECUTE) {
        // First, update any foreign key references
        // (None for now, but would go here)
        
        // Delete the duplicate
        const { error } = await supabase
          .from('movies')
          .delete()
          .eq('id', remove.id);
        
        if (!error) {
          merged.push({
            kept: `${keep.title_en} (${keep.release_year})`,
            deleted: `${remove.title_en} (${remove.release_year})`,
          });
        }
      }
    } else {
      console.log(chalk.yellow(`    ⚠️  Found ${films?.length || 0} matches (expected 2)`));
    }
  }
  
  return merged;
}

/**
 * Find potential duplicates using fuzzy matching
 */
async function findPotentialDuplicates(): Promise<void> {
  console.log(chalk.cyan(`\n  Scanning for potential duplicates...`));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, hero')
    .eq('language', 'Telugu')
    .order('release_year', { ascending: false })
    .limit(500);
  
  if (!movies) return;
  
  const potentialDups: Array<{ film1: any; film2: any; similarity: number }> = [];
  
  // Simple similarity check
  for (let i = 0; i < movies.length; i++) {
    for (let j = i + 1; j < movies.length; j++) {
      const film1 = movies[i];
      const film2 = movies[j];
      
      // Same year
      if (film1.release_year !== film2.release_year) continue;
      
      // Similar titles
      const title1 = film1.title_en.toLowerCase().replace(/[^a-z0-9]/g, '');
      const title2 = film2.title_en.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (title1 === title2) {
        potentialDups.push({ film1, film2, similarity: 100 });
      } else {
        // Calculate similarity (simple char overlap)
        const overlap = [...title1].filter(c => title2.includes(c)).length;
        const similarity = (overlap / Math.max(title1.length, title2.length)) * 100;
        
        if (similarity > 80) {
          potentialDups.push({ film1, film2, similarity });
        }
      }
    }
  }
  
  if (potentialDups.length > 0) {
    console.log(chalk.yellow(`\n  Found ${potentialDups.length} potential duplicates (>80% similarity):\n`));
    
    potentialDups.slice(0, 20).forEach(({ film1, film2, similarity }) => {
      console.log(chalk.gray(`    • "${film1.title_en}" ↔ "${film2.title_en}" (${film1.release_year}) [${Math.round(similarity)}%]`));
    });
    
    if (potentialDups.length > 20) {
      console.log(chalk.gray(`    ... and ${potentialDups.length - 20} more`));
    }
    
    console.log(chalk.yellow(`\n  💡 These need manual review. Add them to knownDuplicates array if confirmed.`));
  }
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║              CLEANUP DISCOVERY ISSUES                                ║
║              (Awards, Duplicates, Data Quality)                      ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}\n`);
  
  const result: CleanupResult = {
    deletedAwards: [],
    mergedDuplicates: [],
    errors: [],
  };
  
  // Step 1: Delete award entries
  console.log(chalk.magenta.bold(`\n[1/3] Deleting Award Entries...`));
  result.deletedAwards = await deleteAwardEntries();
  
  // Step 2: Merge known duplicates
  console.log(chalk.magenta.bold(`\n[2/3] Merging Known Duplicates...`));
  result.mergedDuplicates = await mergeDuplicates();
  
  // Step 3: Find potential duplicates for manual review
  console.log(chalk.magenta.bold(`\n[3/3] Scanning for Potential Duplicates...`));
  await findPotentialDuplicates();
  
  // Summary
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║                       CLEANUP SUMMARY                                ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Award entries deleted: ${result.deletedAwards.length}`);
  if (result.deletedAwards.length > 0) {
    result.deletedAwards.forEach(award => {
      console.log(chalk.gray(`    • ${award}`));
    });
  }
  
  console.log(`\n  Duplicates merged: ${result.mergedDuplicates.length}`);
  if (result.mergedDuplicates.length > 0) {
    result.mergedDuplicates.forEach(dup => {
      console.log(chalk.gray(`    • Kept: ${dup.kept}`));
      console.log(chalk.gray(`      Deleted: ${dup.deleted}`));
    });
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  ⚠️  DRY RUN - No changes were made.`));
    console.log(chalk.yellow(`  Run with --execute to apply changes.`));
  } else {
    console.log(chalk.green(`\n  ✅ Cleanup complete!`));
  }
}

main().catch(console.error);
