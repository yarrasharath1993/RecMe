import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Manual decisions from user review
const APPROVED_MOVIE_NUMBERS = [2, 3, 6, 9, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
const REJECTED_MOVIE_NUMBERS = [1, 4, 5, 7, 8, 13, 15];

interface Attribution {
  movieNumber: number;
  movieId: string;
  actor: string;
  wikiTitle: string;
  dbTitle: string;
  wikiYear: number;
  dbYear: number;
  decision: string;
}

function parseManualReviewCsv(csvPath: string): Attribution[] {
  const attributions: Attribution[] = [];
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split(',');
    const movieNumber = parseInt(parts[0]);
    
    // Only process approved movies
    if (!APPROVED_MOVIE_NUMBERS.includes(movieNumber)) continue;
    
    // Get actor (with quotes removed)
    const actor = parts[1].replace(/"/g, '');
    const wikiTitle = parts[2].replace(/"/g, '');
    const dbTitle = parts[3].replace(/"/g, '');
    const wikiYear = parseInt(parts[4]) || 0;
    const dbYear = parseInt(parts[5]) || 0;
    
    // Need to get movie ID from MISMATCH-DECISIONS.csv
    attributions.push({
      movieNumber,
      movieId: '', // Will fill from other CSV
      actor,
      wikiTitle,
      dbTitle,
      wikiYear,
      dbYear,
      decision: 'APPROVE'
    });
  }
  
  return attributions;
}

function enrichWithMovieIds(attributions: Attribution[]): Attribution[] {
  const mismatchContent = fs.readFileSync('MISMATCH-DECISIONS.csv', 'utf-8');
  const lines = mismatchContent.split('\n');
  
  const enriched: Attribution[] = [];
  
  for (const attr of attributions) {
    // Find matching line in mismatch decisions
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
      const actor = parts[1];
      const wikiTitle = parts[2];
      const dbTitle = parts[3];
      const wikiYear = parts[4];
      const dbYear = parts[5];
      
      if (actor === attr.actor && 
          wikiTitle === attr.wikiTitle && 
          dbTitle === attr.dbTitle &&
          wikiYear === attr.wikiYear.toString() &&
          dbYear === attr.dbYear.toString()) {
        
        enriched.push({
          ...attr,
          movieId: parts[0]
        });
        break;
      }
    }
  }
  
  return enriched;
}

async function applyAttribution(attr: Attribution, dryRun: boolean): Promise<boolean> {
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, cast_members, supporting_cast')
    .eq('id', attr.movieId)
    .single();
  
  if (!movie || fetchError) {
    console.log(chalk.red(`  ✗ Movie not found: ${attr.dbTitle} (ID: ${attr.movieId})`));
    if (fetchError) console.log(chalk.red(`     Error: ${fetchError.message}`));
    return false;
  }
  
  // Check if already attributed
  const actorLower = attr.actor.toLowerCase();
  const supportingCast = (movie.supporting_cast as any) || [];
  const castMembers = movie.cast_members || [];
  
  const alreadyInSupporting = Array.isArray(supportingCast) && supportingCast.some((entry: any) => 
    entry.name && entry.name.toLowerCase().includes(actorLower)
  );
  
  const alreadyInCast = Array.isArray(castMembers) && castMembers.some((entry: any) => {
    if (typeof entry === 'string') return entry.toLowerCase().includes(actorLower);
    if (entry && entry.name) return entry.name.toLowerCase().includes(actorLower);
    return false;
  });
  
  if (alreadyInSupporting || alreadyInCast) {
    console.log(chalk.gray(`  ○ Already attributed: ${movie.title_en}`));
    return true;
  }
  
  // Add to supporting_cast
  const nextOrder = Array.isArray(supportingCast) ? supportingCast.length + 1 : 1;
  const newEntry = {
    name: attr.actor,
    role: 'Actor',
    order: nextOrder,
    type: 'supporting'
  };
  
  const newValue = Array.isArray(supportingCast) 
    ? [...supportingCast, newEntry]
    : [newEntry];
  
  if (dryRun) {
    console.log(chalk.yellow(`  → Would add "${attr.actor}" to: ${movie.title_en} (Wiki: ${attr.wikiYear}, DB: ${attr.dbYear})`));
    return true;
  }
  
  // Apply update
  const { error } = await supabase
    .from('movies')
    .update({ supporting_cast: newValue })
    .eq('id', attr.movieId);
  
  if (error) {
    console.log(chalk.red(`  ✗ Failed: ${movie.title_en}`));
    console.log(chalk.red(`    Error: ${error.message}`));
    return false;
  }
  
  console.log(chalk.green(`  ✓ Updated: ${movie.title_en} (added ${attr.actor})`));
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  if (dryRun) {
    console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.gray('Use --execute to apply changes\n'));
  } else {
    console.log(chalk.red('\n⚠️  EXECUTE MODE - Changes will be applied!\n'));
  }
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  APPLY MANUAL REVIEW DECISIONS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan('📖 Reading manual review decisions...\n'));
  
  const csvPath = path.join(process.cwd(), 'MANUAL-REVIEW-SIMPLE.csv');
  let attributions = parseManualReviewCsv(csvPath);
  
  console.log(chalk.green(`✓ Found ${attributions.length} approved movies\n`));
  console.log(chalk.red(`✗ Rejected ${REJECTED_MOVIE_NUMBERS.length} movies (different films)\n`));
  
  // Enrich with movie IDs
  attributions = enrichWithMovieIds(attributions);
  
  console.log(chalk.cyan(`📊 Matched ${attributions.length} movies with database IDs\n`));
  
  // Group by actor
  const byActor = attributions.reduce((acc, attr) => {
    if (!acc[attr.actor]) acc[attr.actor] = [];
    acc[attr.actor].push(attr);
    return acc;
  }, {} as Record<string, Attribution[]>);
  
  let totalFixed = 0;
  let totalFailed = 0;
  
  for (const [actor, attrs] of Object.entries(byActor)) {
    console.log(chalk.blue(`\n[${actor}] - ${attrs.length} movies`));
    
    for (const attr of attrs) {
      const success = await applyAttribution(attr, dryRun);
      
      if (success) {
        totalFixed++;
      } else {
        totalFailed++;
      }
    }
  }
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  SUMMARY'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.green(`✓ Approved:             ${APPROVED_MOVIE_NUMBERS.length} movies`));
  console.log(chalk.red(`✗ Rejected:             ${REJECTED_MOVIE_NUMBERS.length} movies (correctly identified as different films)`));
  
  if (dryRun) {
    console.log(chalk.yellow(`\nWould fix:              ${totalFixed} attributions`));
  } else {
    console.log(chalk.green(`\n✓ Fixed:                ${totalFixed} attributions`));
    console.log(chalk.red(`✗ Failed:               ${totalFailed} attributions`));
  }
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════\n'));
  
  if (!dryRun && totalFixed > 0) {
    console.log(chalk.green('✅ Phase 2B Complete!'));
    console.log(chalk.cyan(`\nNew Total: ${734 + totalFixed} movies attributed`));
    console.log(chalk.cyan('\nNext: Focus on 474 truly missing movies\n'));
  }
}

main();
