#!/usr/bin/env npx tsx
/**
 * APPLY ATTRIBUTION FIXES
 * 
 * Reads attribution audit CSVs and applies fixes to database.
 * For each "needs attribution" movie:
 * 1. Reads the DB movie record
 * 2. Adds the actor to appropriate field (cast_members)
 * 3. Updates the database
 * 
 * Usage:
 *   npx tsx scripts/apply-attribution-fixes.ts --actor=satyanarayana
 *   npx tsx scripts/apply-attribution-fixes.ts --all --dry-run
 *   npx tsx scripts/apply-attribution-fixes.ts --all --execute
 */

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

type CrewRoleType = 
  | 'hero'              // Main lead (male)
  | 'heroine'           // Main lead (female)
  | 'cast_members'      // General cast
  | 'supporting_cast'   // Supporting actors
  | 'cameo'             // Cameo appearances
  | 'director' 
  | 'producer' 
  | 'music_director'
  | 'cinematographer'
  | 'editor'
  | 'writer'
  | 'choreographer'
  | 'art_director'
  | 'lyricist'
  | 'costume_designer'
  | 'production_designer';

interface Fix {
  movieId: string;
  movieTitle: string;
  actorName: string;
  currentAttribution: string;
  suggestedField: CrewRoleType;
  role: string;
}

// Parse CSV and extract fixes needed
function parseAuditCsv(csvPath: string, actorName: string): Fix[] {
  const fixes: Fix[] = [];
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
    
    // Check if status is "needs attribution"
    if (parts[0] && parts[0].includes('EXISTS_NOT_ATTRIBUTED')) {
      // New format: Status, WikiTitle, WikiYear, Role, CastType, DBMovieID, DBTitle, DBYear, CurrentAttr, Match%, SuggestedField, Action
      const role = parts[3] || 'Actor';
      const castType = parts[4] || '';
      const movieId = parts[5];
      const movieTitle = parts[6];
      const currentAttribution = parts[8];
      const suggestedField = parts[10] || 'cast_members';
      
      if (movieId && movieId.length > 10) {
        fixes.push({
          movieId,
          movieTitle,
          actorName,
          currentAttribution,
          suggestedField: suggestedField as any,
          role: castType ? `${role} (${castType})` : role
        });
      }
    }
  }
  
  return fixes;
}

// Determine if field is in crew JSONB or top-level
function isCrewField(fieldName: CrewRoleType): boolean {
  const crewJsonbFields: CrewRoleType[] = [
    'editor',
    'lyricist',
    'choreographer',
    'art_director',
    'costume_designer',
    'production_designer'
  ];
  return crewJsonbFields.includes(fieldName);
}

// Check if field requires special handling for supporting cast JSONB
function isSupportingCastField(fieldName: CrewRoleType): boolean {
  return fieldName === 'supporting_cast' || fieldName === 'cameo';
}

// Apply fix to a single movie
async function applyFix(fix: Fix, dryRun: boolean): Promise<boolean> {
  // Fetch current movie data (including crew JSONB)
  const { data: movie } = await supabase
    .from('movies')
    .select('id, title_en, cast_members, supporting_cast, director, directors, producer, producers, music_director, cinematographer, writer, writers, crew')
    .eq('id', fix.movieId)
    .single();
  
  if (!movie) {
    console.log(chalk.red(`  ✗ Movie not found: ${fix.movieId}`));
    return false;
  }
  
  const fieldName = fix.suggestedField;
  const isInCrew = isCrewField(fieldName);
  const isSupportingCast = isSupportingCastField(fieldName);
  
  // Get current value (either from top-level, crew JSONB, or supporting_cast array)
  let currentValue: any = '';
  let alreadyExists = false;
  
  if (isSupportingCast) {
    // Handle supporting_cast JSONB array
    const supportingCast = (movie.supporting_cast as any) || [];
    currentValue = supportingCast;
    
    // Check if actor already exists in supporting cast
    alreadyExists = Array.isArray(supportingCast) && supportingCast.some((entry: any) => 
      entry.name && entry.name.toLowerCase().includes(fix.actorName.toLowerCase())
    );
  } else if (isInCrew) {
    const crew = movie.crew as any || {};
    currentValue = crew[fieldName] || '';
    alreadyExists = typeof currentValue === 'string' && currentValue.toLowerCase().includes(fix.actorName.toLowerCase());
  } else {
    currentValue = (movie as any)[fieldName] || '';
    alreadyExists = typeof currentValue === 'string' && currentValue.toLowerCase().includes(fix.actorName.toLowerCase());
  }
  
  if (alreadyExists) {
    console.log(chalk.gray(`  ○ Already attributed: ${movie.title_en} (${fix.role})`));
    return true;
  }
  
  // Prepare new value based on field type
  let newValue: any;
  let displayNew: string;
  
  if (isSupportingCast) {
    // Add to supporting_cast JSONB array
    const castType = fieldName === 'cameo' ? 'cameo' : 'supporting';
    const nextOrder = Array.isArray(currentValue) ? currentValue.length + 1 : 1;
    
    const newEntry = {
      name: fix.actorName,
      role: fix.role,
      order: nextOrder,
      type: castType
    };
    
    newValue = Array.isArray(currentValue) 
      ? [...currentValue, newEntry]
      : [newEntry];
      
    displayNew = JSON.stringify(newEntry);
  } else {
    // String field (comma-separated)
    newValue = currentValue 
      ? `${currentValue}, ${fix.actorName}` 
      : fix.actorName;
    displayNew = newValue;
  }
  
  if (dryRun) {
    console.log(chalk.yellow(`  → Would add "${fix.actorName}" as ${fix.role} to: ${movie.title_en}`));
    console.log(chalk.gray(`    Field:   ${isInCrew ? `crew.${fieldName}` : fieldName}`));
    console.log(chalk.gray(`    Current: ${typeof currentValue === 'string' ? currentValue || '(empty)' : JSON.stringify(currentValue)}`));
    console.log(chalk.gray(`    New:     ${displayNew}`));
    return true;
  }
  
  // Prepare update data
  const updateData: any = {};
  
  if (isInCrew) {
    // Update crew JSONB object
    const crew = movie.crew as any || {};
    crew[fieldName] = newValue;
    updateData.crew = crew;
  } else if (isSupportingCast) {
    // Update supporting_cast JSONB array
    updateData.supporting_cast = newValue;
  } else {
    // Update top-level field
    updateData[fieldName] = newValue;
  }
  
  // Apply update
  const { error } = await supabase
    .from('movies')
    .update(updateData)
    .eq('id', fix.movieId);
  
  if (error) {
    console.log(chalk.red(`  ✗ Failed to update: ${movie.title_en}`));
    console.log(chalk.red(`    Error: ${error.message}`));
    return false;
  }
  
  console.log(chalk.green(`  ✓ Updated: ${movie.title_en} (added as ${fix.role})`));
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const actorArg = args.find(a => a.startsWith('--actor='));
  const allActors = args.includes('--all');
  const dryRun = !args.includes('--execute');
  
  if (dryRun) {
    console.log(chalk.yellow.bold('\n⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('Use --execute to apply changes\n'));
  }
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  APPLY ATTRIBUTION FIXES'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  const auditsDir = path.join(process.cwd(), 'attribution-audits');
  
  if (!fs.existsSync(auditsDir)) {
    console.log(chalk.red('Error: attribution-audits/ directory not found'));
    console.log(chalk.gray('Run automated-attribution-audit.ts first\n'));
    process.exit(1);
  }
  
  // Get list of audit files
  const auditFiles = fs.readdirSync(auditsDir).filter(f => f.endsWith('-attribution.csv'));
  
  if (auditFiles.length === 0) {
    console.log(chalk.yellow('No attribution audit files found\n'));
    process.exit(0);
  }
  
  console.log(chalk.cyan(`Found ${auditFiles.length} audit files\n`));
  
  let totalFixed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  
  for (const auditFile of auditFiles) {
    const actorSlug = auditFile.replace('-attribution.csv', '');
    const actorName = actorSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    // If specific actor requested, skip others
    if (actorArg && !auditFile.includes(actorArg.split('=')[1].toLowerCase().replace(/ /g, '-'))) {
      continue;
    }
    
    console.log(chalk.blue(`\n[${actorName}]`));
    
    const csvPath = path.join(auditsDir, auditFile);
    const fixes = parseAuditCsv(csvPath, actorName);
    
    console.log(chalk.cyan(`  Found ${fixes.length} movies needing attribution`));
    
    if (fixes.length === 0) {
      continue;
    }
    
    for (const fix of fixes) {
      const success = await applyFix(fix, dryRun);
      
      if (success) {
        totalFixed++;
      } else {
        totalFailed++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  SUMMARY'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  if (dryRun) {
    console.log(chalk.yellow(`Would fix:              ${totalFixed} attributions`));
  } else {
    console.log(chalk.green(`✓ Fixed:                ${totalFixed} attributions`));
    console.log(chalk.red(`✗ Failed:               ${totalFailed} attributions`));
  }
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════\n'));
  
  if (dryRun && totalFixed > 0) {
    console.log(chalk.yellow.bold('To apply these changes, run with --execute flag:\n'));
    console.log(chalk.gray('  npx tsx scripts/apply-attribution-fixes.ts --all --execute\n'));
  }
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
