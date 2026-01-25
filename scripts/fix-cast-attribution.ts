#!/usr/bin/env npx tsx
/**
 * FIX CAST ATTRIBUTION ISSUES
 * 
 * Automatically fixes impossible pairings where the same person
 * is listed as both hero AND heroine (clear data entry error)
 * 
 * Usage:
 *   npx tsx scripts/fix-cast-attribution.ts
 *   npx tsx scripts/fix-cast-attribution.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import * as fs from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CastIssue {
  movieId: string;
  title: string;
  year: string;
  actor: string;
  role: string;
  issue: string;
}

interface FixResult {
  movieId: string;
  title: string;
  actor: string;
  oldHero: string | null;
  oldHeroine: string | null;
  newHero: string | null;
  newHeroine: string | null;
  success: boolean;
  error?: string;
}

/**
 * Parse the wrong-cast-attribution.csv file
 */
function parseCastIssuesCSV(filePath: string): CastIssue[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const issues: CastIssue[] = [];
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length >= 6) {
      issues.push({
        movieId: parts[0].trim(),
        title: parts[1].replace(/"/g, '').trim(),
        year: parts[2].trim(),
        actor: parts[3].replace(/"/g, '').trim(),
        role: parts[4].trim(),
        issue: parts[5].trim(),
      });
    }
  }
  
  return issues;
}

/**
 * Fix a single movie's cast attribution
 */
async function fixCastAttribution(issue: CastIssue, execute: boolean): Promise<FixResult> {
  console.log(chalk.blue(`\n  Processing: "${issue.title}" (${issue.year})`));
  console.log(chalk.gray(`    Issue: ${issue.actor} listed as both hero and heroine`));
  
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine')
    .eq('id', issue.movieId)
    .single();
  
  if (fetchError || !movie) {
    return {
      movieId: issue.movieId,
      title: issue.title,
      actor: issue.actor,
      oldHero: null,
      oldHeroine: null,
      newHero: null,
      newHeroine: null,
      success: false,
      error: `Failed to fetch movie: ${fetchError?.message}`,
    };
  }
  
  console.log(chalk.gray(`    Current: hero="${movie.hero}", heroine="${movie.heroine}"`));
  
  // Determine fix based on issue
  let newHero = movie.hero;
  let newHeroine = movie.heroine;
  
  if (issue.issue === 'impossible_pairing') {
    // Same person as both hero and heroine - they should only be heroine
    // Remove from hero field if present
    if (movie.hero === issue.actor) {
      newHero = null;
      console.log(chalk.yellow(`    → Fix: Remove "${issue.actor}" from hero field`));
    }
    
    // Ensure they're in heroine field
    if (movie.heroine !== issue.actor) {
      newHeroine = issue.actor;
      console.log(chalk.yellow(`    → Fix: Set "${issue.actor}" as heroine`));
    }
  }
  
  if (!execute) {
    console.log(chalk.yellow(`    (Dry run - no changes made)`));
    return {
      movieId: movie.id,
      title: issue.title,
      actor: issue.actor,
      oldHero: movie.hero,
      oldHeroine: movie.heroine,
      newHero,
      newHeroine,
      success: true,
    };
  }
  
  // Apply fix
  const { error: updateError } = await supabase
    .from('movies')
    .update({
      hero: newHero,
      heroine: newHeroine,
    })
    .eq('id', movie.id);
  
  if (updateError) {
    console.log(chalk.red(`    ❌ Failed to update: ${updateError.message}`));
    return {
      movieId: movie.id,
      title: issue.title,
      actor: issue.actor,
      oldHero: movie.hero,
      oldHeroine: movie.heroine,
      newHero,
      newHeroine,
      success: false,
      error: updateError.message,
    };
  }
  
  console.log(chalk.green(`    ✅ Fixed! New: hero="${newHero}", heroine="${newHeroine}"`));
  
  return {
    movieId: movie.id,
    title: issue.title,
    actor: issue.actor,
    oldHero: movie.hero,
    oldHeroine: movie.heroine,
    newHero,
    newHeroine,
    success: true,
  };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const hasFlag = (name: string): boolean => args.includes(`--${name}`);
  const EXECUTE = hasFlag('execute');
  
  const INPUT_FILE = 'docs/audit-reports/wrong-cast-attribution.csv';
  
  console.log(chalk.blue.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            FIX CAST ATTRIBUTION ISSUES                               ║'));
  console.log(chalk.blue.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  
  console.log(chalk.gray(`\n  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  if (!EXECUTE) {
    console.log(chalk.yellow('  (No changes will be made. Use --execute to apply fixes)'));
  }
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(chalk.red(`\n  ❌ Input file not found: ${INPUT_FILE}`));
    process.exit(1);
  }
  
  const issues = parseCastIssuesCSV(INPUT_FILE);
  console.log(chalk.blue(`\n  Found ${issues.length} cast attribution issues to fix`));
  
  const results: FixResult[] = [];
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    console.log(chalk.magenta(`\n[${i + 1}/${issues.length}]`));
    
    const result = await fixCastAttribution(issue, EXECUTE);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Save results
  if (EXECUTE) {
    const logPath = `docs/audit-reports/cast-fix-log-${Date.now()}.json`;
    fs.writeFileSync(logPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(chalk.cyan(`\n  📋 Fix log saved: ${logPath}`));
  }
  
  console.log(chalk.green.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.green.bold('║            FIX COMPLETE                                              ║'));
  console.log(chalk.green.bold('╚══════════════════════════════════════════════════════════════════════╝'));
  
  console.log(chalk.gray(`\n  Total issues: ${issues.length}`));
  console.log(chalk.green(`  Successfully fixed: ${successCount}`));
  if (failCount > 0) {
    console.log(chalk.red(`  Failed: ${failCount}`));
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow(`\n  💡 This was a dry run. Use --execute to apply fixes.`));
  } else {
    console.log(chalk.green(`\n  ✅ All fixes applied to database!`));
  }
}

main().catch(error => {
  console.error(chalk.red('\n❌ Script failed:'), error);
  process.exit(1);
});
