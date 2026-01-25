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

interface Attribution {
  movieId: string;
  actor: string;
  movieTitle: string;
  wikiYear: number;
  dbYear: number;
  role: string;
}

function parseAutoApprovedCsv(csvPath: string): Attribution[] {
  const attributions: Attribution[] = [];
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Only process AUTO-APPROVE rows
    if (!line.includes('✅ AUTO-APPROVE')) continue;
    
    const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
    
    // CSV: DB Movie ID, Actor, Wikipedia Title, DB Title, Wikipedia Year, DB Year, Year Diff, Match Score, Category, Suggested Decision, Notes, Final Decision, Reviewer Notes
    const finalDecision = parts[11] || '';
    
    // Skip if manually changed to REJECT
    if (finalDecision.toUpperCase().includes('REJECT')) continue;
    
    attributions.push({
      movieId: parts[0],
      actor: parts[1],
      movieTitle: parts[3], // Use DB title
      wikiYear: parseInt(parts[4]) || 0,
      dbYear: parseInt(parts[5]) || 0,
      role: 'Actor (Supporting)' // Default for mismatches
    });
  }
  
  return attributions;
}

async function applyAttribution(attr: Attribution, dryRun: boolean): Promise<boolean> {
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, cast_members, supporting_cast')
    .eq('id', attr.movieId)
    .single();
  
  if (!movie || fetchError) {
    console.log(chalk.red(`  ✗ Movie not found: ${attr.movieTitle}`));
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
  console.log(chalk.bold('  APPLY AUTO-APPROVED YEAR/TITLE MISMATCHES'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  const csvPath = path.join(process.cwd(), 'MISMATCH-DECISIONS.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log(chalk.red('✗ MISMATCH-DECISIONS.csv not found'));
    process.exit(1);
  }
  
  console.log(chalk.cyan('📖 Reading auto-approved cases...\n'));
  const attributions = parseAutoApprovedCsv(csvPath);
  
  console.log(chalk.green(`✓ Found ${attributions.length} auto-approved movies\n`));
  
  // Group by actor
  const byActor = attributions.reduce((acc, attr) => {
    if (!acc[attr.actor]) acc[attr.actor] = [];
    acc[attr.actor].push(attr);
    return acc;
  }, {} as Record<string, Attribution[]>);
  
  let totalFixed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
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
  
  if (dryRun) {
    console.log(chalk.yellow(`Would fix:              ${totalFixed} attributions`));
  } else {
    console.log(chalk.green(`✓ Fixed:                ${totalFixed} attributions`));
    console.log(chalk.red(`✗ Failed:               ${totalFailed} attributions`));
  }
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════\n'));
  
  if (!dryRun) {
    console.log(chalk.green('✅ Phase 2A Complete!'));
    console.log(chalk.cyan('\nNext: Review the 30 manual cases in MISMATCH-DECISIONS.csv\n'));
  }
}

main();
