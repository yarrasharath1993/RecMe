/**
 * APPLY ATTRIBUTION FIXES FROM AUDIT
 * 
 * Reads attribution audit CSV files and applies fixes for movies that
 * exist in DB but need re-attribution.
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
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AttributionFix {
  movieId: string;
  movieTitle: string;
  celebrityName: string;
  suggestedField: string;
  role: string;
  castType: string;
}

/**
 * Parse a CSV file and extract attribution fixes
 */
function parseAuditCSV(filePath: string): AttributionFix[] {
  const fixes: AttributionFix[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header
  
  // Extract celebrity name from filename
  const filename = path.basename(filePath, '-attribution.csv');
  const celebrityName = filename
    .replace(/^celeb-/, '')
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const matches = line.match(/(".*?"|[^,]+)/g);
    if (!matches || matches.length < 12) continue;
    
    const cells = matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    const status = cells[0];
    const movieId = cells[5];
    const movieTitle = cells[6];
    const role = cells[3];
    const castType = cells[4];
    const suggestedField = cells[10];
    
    // Only process movies that need attribution
    if (status.includes('EXISTS_NOT_ATTRIBUTED') && movieId && suggestedField) {
      fixes.push({
        movieId,
        movieTitle,
        celebrityName,
        suggestedField,
        role,
        castType
      });
    }
  }
  
  return fixes;
}

/**
 * Apply a single attribution fix to the database
 */
async function applyFix(fix: AttributionFix): Promise<boolean> {
  try {
    let field = fix.suggestedField.toLowerCase();
    
    // Map invalid field names to valid ones
    if (field === 'cast') field = 'cast_members';
    if (field === 'actor') field = 'cast_members';
    if (field === 'actress') field = 'cast_members';
    
    // Skip if no valid field
    if (!field || field === 'undefined' || field === 'null') {
      return true; // Skip silently
    }
    
    // Determine update based on field type
    let updateData: any = {};
    
    // JSONB array fields (supporting_cast, crew, cast_members)
    if (field === 'supporting_cast' || field === 'cameo' || field === 'cast_members') {
      // Determine which field to use
      const targetField = (field === 'cameo' || field === 'supporting_cast') ? 'supporting_cast' : 'cast_members';
      
      // Get current array
      const { data: movie } = await supabase
        .from('movies')
        .select(targetField)
        .eq('id', fix.movieId)
        .single();
      
      const current = movie?.[targetField] || [];
      const newEntry = {
        name: fix.celebrityName,
        role: fix.role || (targetField === 'supporting_cast' ? 'Supporting' : 'Actor'),
        type: fix.castType || (targetField === 'supporting_cast' ? 'Supporting' : 'General')
      };
      
      // Add if not already present
      const exists = current.some((c: any) => 
        c.name?.toLowerCase() === fix.celebrityName.toLowerCase()
      );
      
      if (!exists) {
        updateData[targetField] = [...current, newEntry];
      } else {
        return true; // Already attributed
      }
      
    } else if (false) { // Removed duplicate cast_members handling
      // Get current cast_members
      const { data: movie } = await supabase
        .from('movies')
        .select('cast_members')
        .eq('id', fix.movieId)
        .single();
      
      const current = movie?.cast_members || [];
      const newEntry = {
        name: fix.celebrityName,
        role: fix.role || 'Actor',
        type: fix.castType || 'General'
      };
      
      const exists = current.some((c: any) => 
        c.name?.toLowerCase() === fix.celebrityName.toLowerCase()
      );
      
      if (!exists) {
        updateData.cast_members = [...current, newEntry];
      } else {
        return true;
      }
      
    } else if (field.includes('crew')) {
      // Crew JSONB field
      const { data: movie } = await supabase
        .from('movies')
        .select('crew')
        .eq('id', fix.movieId)
        .single();
      
      const current = movie?.crew || {};
      const crewRole = field.replace('crew_', '');
      
      // Add to crew object
      updateData.crew = {
        ...current,
        [crewRole]: fix.celebrityName
      };
      
    } else {
      // Simple string fields (hero, heroine, director, producer, etc.)
      const { data: movie } = await supabase
        .from('movies')
        .select(field)
        .eq('id', fix.movieId)
        .single();
      
      // Only update if field is empty
      if (!movie?.[field]) {
        updateData[field] = fix.celebrityName;
      } else {
        return true; // Already has value
      }
    }
    
    // Apply update if we have changes
    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', fix.movieId);
      
      if (error) {
        console.error(chalk.red(`    Error: ${error.message}`));
        return false;
      }
      
      return true;
    }
    
    return true;
    
  } catch (error: any) {
    console.error(chalk.red(`    Exception: ${error.message}`));
    return false;
  }
}

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  APPLY ATTRIBUTION FIXES FROM AUDIT'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Read all CSV files
  const auditDir = path.join(process.cwd(), 'attribution-audits');
  
  if (!fs.existsSync(auditDir)) {
    console.error(chalk.red('❌ No attribution-audits directory found!'));
    console.error(chalk.yellow('   Run automated-attribution-audit.ts first.'));
    process.exit(1);
  }
  
  const csvFiles = fs.readdirSync(auditDir)
    .filter(f => f.endsWith('.csv'))
    .map(f => path.join(auditDir, f));
  
  if (csvFiles.length === 0) {
    console.error(chalk.red('❌ No CSV files found in attribution-audits/'));
    process.exit(1);
  }
  
  console.log(chalk.yellow(`📁 Found ${csvFiles.length} audit CSV files\n`));
  
  // Parse all fixes
  let allFixes: AttributionFix[] = [];
  
  for (const csvFile of csvFiles) {
    const fixes = parseAuditCSV(csvFile);
    allFixes = [...allFixes, ...fixes];
  }
  
  console.log(chalk.yellow(`📋 Total attribution fixes to apply: ${allFixes.length}\n`));
  
  if (allFixes.length === 0) {
    console.log(chalk.green('✓ No fixes needed!'));
    process.exit(0);
  }
  
  // Group by celebrity for better logging
  const fixesByCelebrity = new Map<string, AttributionFix[]>();
  
  for (const fix of allFixes) {
    const fixes = fixesByCelebrity.get(fix.celebrityName) || [];
    fixes.push(fix);
    fixesByCelebrity.set(fix.celebrityName, fixes);
  }
  
  console.log(chalk.cyan(`Processing ${fixesByCelebrity.size} celebrities...\n`));
  
  let applied = 0;
  let skipped = 0;
  let failed = 0;
  let processedCelebs = 0;
  
  for (const [celebrity, fixes] of fixesByCelebrity.entries()) {
    processedCelebs++;
    console.log(chalk.cyan(`[${processedCelebs}/${fixesByCelebrity.size}] ${celebrity} (${fixes.length} movies)`));
    
    for (const fix of fixes) {
      const result = await applyFix(fix);
      
      if (result) {
        console.log(chalk.green(`  ✓ ${fix.movieTitle} → ${fix.suggestedField}`));
        applied++;
      } else {
        console.log(chalk.red(`  ✗ ${fix.movieTitle} (failed)`));
        failed++;
      }
    }
    
    // Progress update every 10 celebrities
    if (processedCelebs % 10 === 0) {
      console.log(chalk.blue(`\n📊 Progress: ${processedCelebs}/${fixesByCelebrity.size} celebrities (${applied} applied, ${failed} failed)\n`));
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ ATTRIBUTION FIXES COMPLETE'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Total fixes attempted: ${allFixes.length}`));
  console.log(chalk.white(`  • Successfully applied: ${applied}`));
  console.log(chalk.white(`  • Skipped (already set): ${skipped}`));
  console.log(chalk.white(`  • Failed: ${failed}`));
  console.log(chalk.white(`  • Success rate: ${((applied / allFixes.length) * 100).toFixed(1)}%`));
  
  console.log(chalk.yellow('\n📊 Verify in Supabase:'));
  console.log(chalk.gray('  SELECT COUNT(*) FROM movies WHERE hero IS NOT NULL;'));
  console.log(chalk.gray('  SELECT COUNT(*) FROM movies WHERE supporting_cast IS NOT NULL;'));
  console.log();
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
