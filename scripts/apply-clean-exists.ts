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
  | 'hero'
  | 'heroine'
  | 'cast_members'
  | 'supporting_cast'
  | 'cameo'
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

interface Attribution {
  actor: string;
  movieId: string;
  movieTitle: string;
  role: string;
  castType: string;
  suggestedField: CrewRoleType;
}

// Parse verification CSV and extract movies that need attribution
function parseVerificationCsv(csvPath: string): Attribution[] {
  const attributions: Attribution[] = [];
  
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Only process movies that exist (not truly missing)
    if (!(line.includes('✓ EXISTS') || line.includes('⚠️ EXISTS'))) {
      continue;
    }
    
    const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
    
    // CSV Format: Actor, WikiTitle, WikiYear, Role, VerificationStatus, DBTitle, DBTitleTE, DBYear, MatchScore, DBMovieID, ActionRequired
    const actor = parts[0];
    const role = parts[3];
    const movieId = parts[9];
    const movieTitle = parts[5];
    
    if (!movieId || movieId.length < 10) continue;
    
    // Determine cast type and suggested field based on role
    const roleLower = role.toLowerCase();
    let castType = '';
    let suggestedField: CrewRoleType = 'cast_members';
    
    // Parse cast type if present
    const castTypeMatch = role.match(/\((Lead|Supporting|Cameo)\)/i);
    if (castTypeMatch) {
      castType = castTypeMatch[1];
    }
    
    // Determine field based on role
    if (roleLower.includes('director') && !roleLower.includes('music') && !roleLower.includes('art')) {
      suggestedField = 'director';
    } else if (roleLower.includes('music')) {
      suggestedField = 'music_director';
    } else if (roleLower.includes('cinematographer')) {
      suggestedField = 'cinematographer';
    } else if (roleLower.includes('editor')) {
      suggestedField = 'editor';
    } else if (roleLower.includes('writer') || roleLower.includes('screenplay')) {
      suggestedField = 'writer';
    } else if (roleLower.includes('lyricist')) {
      suggestedField = 'lyricist';
    } else if (roleLower.includes('choreographer')) {
      suggestedField = 'choreographer';
    } else if (roleLower.includes('art director')) {
      suggestedField = 'art_director';
    } else if (roleLower.includes('costume')) {
      suggestedField = 'costume_designer';
    } else if (roleLower.includes('producer')) {
      suggestedField = 'producer';
    } else if (roleLower.includes('cameo') || castType.toLowerCase() === 'cameo') {
      suggestedField = 'cameo';
    } else if (roleLower.includes('supporting') || castType.toLowerCase() === 'supporting') {
      suggestedField = 'supporting_cast';
    } else if (roleLower.includes('hero') || roleLower.includes('lead')) {
      suggestedField = 'hero'; // Or 'heroine' based on gender, but we'll use cast_members for safety
    } else {
      suggestedField = 'cast_members';
    }
    
    attributions.push({
      actor,
      movieId,
      movieTitle,
      role,
      castType,
      suggestedField
    });
  }
  
  return attributions;
}

// Check if field requires special handling
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

function isSupportingCastField(fieldName: CrewRoleType): boolean {
  return fieldName === 'supporting_cast' || fieldName === 'cameo';
}

// Apply attribution to a single movie
async function applyAttribution(attr: Attribution, dryRun: boolean): Promise<boolean> {
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, cast_members, supporting_cast, hero, heroine, director, producer, music_director, cinematographer, crew')
    .eq('id', attr.movieId)
    .single();
  
  if (!movie || fetchError) {
    console.log(chalk.red(`  ✗ Movie not found: ${attr.movieId}`));
    if (fetchError) console.log(chalk.red(`     Error: ${fetchError.message}`));
    return false;
  }
  
  const fieldName = attr.suggestedField;
  const isInCrew = isCrewField(fieldName);
  const isSupportingCast = isSupportingCastField(fieldName);
  
  // Check if already attributed
  let alreadyExists = false;
  const actorLower = attr.actor.toLowerCase();
  
  // Helper to check if actor exists in a field (handles both string and array)
  const checkExists = (value: any): boolean => {
    if (!value) return false;
    if (typeof value === 'string') {
      return value.toLowerCase().includes(actorLower);
    }
    if (Array.isArray(value)) {
      return value.some(item => 
        (typeof item === 'string' && item.toLowerCase().includes(actorLower)) ||
        (item && item.name && item.name.toLowerCase().includes(actorLower))
      );
    }
    return false;
  };
  
  if (isSupportingCast) {
    alreadyExists = checkExists(movie.supporting_cast);
  } else if (isInCrew) {
    const crew = movie.crew as any || {};
    alreadyExists = checkExists(crew[fieldName]);
  } else {
    alreadyExists = checkExists((movie as any)[fieldName]);
  }
  
  if (alreadyExists) {
    console.log(chalk.gray(`  ○ Already attributed: ${movie.title_en}`));
    return true;
  }
  
  // Prepare new value
  const updateData: any = {};
  
  if (isSupportingCast) {
    const supportingCast = (movie.supporting_cast as any) || [];
    const nextOrder = Array.isArray(supportingCast) ? supportingCast.length + 1 : 1;
    const castType = fieldName === 'cameo' ? 'cameo' : 'supporting';
    
    const newEntry = {
      name: attr.actor,
      role: attr.role.replace(/\s*\(.*?\)\s*/g, '').trim(), // Remove (Supporting) etc
      order: nextOrder,
      type: castType
    };
    
    const newValue = Array.isArray(supportingCast) 
      ? [...supportingCast, newEntry]
      : [newEntry];
    
    updateData.supporting_cast = newValue;
    
    if (dryRun) {
      console.log(chalk.yellow(`  → Would add "${attr.actor}" as ${attr.role} to: ${movie.title_en}`));
      console.log(chalk.gray(`    Field: supporting_cast (JSONB)`));
      console.log(chalk.gray(`    Entry: ${JSON.stringify(newEntry)}`));
      return true;
    }
  } else if (isInCrew) {
    const crew = movie.crew as any || {};
    const currentValue = crew[fieldName] || '';
    const newValue = currentValue 
      ? `${currentValue}, ${attr.actor}` 
      : attr.actor;
    
    crew[fieldName] = newValue;
    updateData.crew = crew;
    
    if (dryRun) {
      console.log(chalk.yellow(`  → Would add "${attr.actor}" as ${attr.role} to: ${movie.title_en}`));
      console.log(chalk.gray(`    Field: crew.${fieldName}`));
      console.log(chalk.gray(`    Current: ${currentValue || '(empty)'}`));
      console.log(chalk.gray(`    New: ${newValue}`));
      return true;
    }
  } else {
    const currentValue = (movie as any)[fieldName];
    let newValue: any;
    
    // Handle array fields (cast_members is an array)
    if (Array.isArray(currentValue)) {
      newValue = [...currentValue, attr.actor];
      
      if (dryRun) {
        console.log(chalk.yellow(`  → Would add "${attr.actor}" as ${attr.role} to: ${movie.title_en}`));
        console.log(chalk.gray(`    Field: ${fieldName} (array)`));
        console.log(chalk.gray(`    Current: ${JSON.stringify(currentValue)}`));
        console.log(chalk.gray(`    New: ${JSON.stringify(newValue)}`));
        return true;
      }
    } else {
      // Handle string fields
      const strValue = currentValue || '';
      newValue = strValue 
        ? `${strValue}, ${attr.actor}` 
        : attr.actor;
      
      if (dryRun) {
        console.log(chalk.yellow(`  → Would add "${attr.actor}" as ${attr.role} to: ${movie.title_en}`));
        console.log(chalk.gray(`    Field: ${fieldName}`));
        console.log(chalk.gray(`    Current: ${strValue || '(empty)'}`));
        console.log(chalk.gray(`    New: ${newValue}`));
        return true;
      }
    }
    
    updateData[fieldName] = newValue;
  }
  
  // Apply update
  const { error } = await supabase
    .from('movies')
    .update(updateData)
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
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
  
  if (dryRun) {
    console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.gray('Use --execute to apply changes\n'));
  } else {
    console.log(chalk.red('\n⚠️  EXECUTE MODE - Changes will be applied!\n'));
  }
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  APPLY VERIFIED ATTRIBUTIONS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  const csvPath = path.join(process.cwd(), 'CLEAN-EXISTS-ONLY.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log(chalk.red('✗ Verification CSV not found. Run verify-missing-movies.ts first.'));
    process.exit(1);
  }
  
  console.log(chalk.cyan('📖 Reading verification CSV...\n'));
  const attributions = parseVerificationCsv(csvPath);
  
  console.log(chalk.green(`✓ Found ${attributions.length} movies that need attribution\n`));
  
  if (limit) {
    console.log(chalk.yellow(`⚠️  Limiting to first ${limit} movies\n`));
    attributions.splice(limit);
  }
  
  // Group by actor for better logging
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
}

main();
