/**
 * GENERATE ATTRIBUTION CHANGES REPORT
 * 
 * Creates a comprehensive CSV report of all attribution changes applied.
 * Shows before/after state for manual review.
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

interface AttributionChange {
  movieId: string;
  movieTitle: string;
  movieTitleTe: string;
  movieYear: number;
  movieSlug: string;
  celebrityName: string;
  fieldUpdated: string;
  roleType: string;
  castType: string;
  attributionAdded: string;
  currentValue: string;
  changeSource: string;
}

/**
 * Parse audit CSV to get the fixes that were attempted
 */
function parseAuditCSV(filePath: string): any[] {
  const fixes: any[] = [];
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
    
    const matches = line.match(/(".*?"|[^,]+)/g);
    if (!matches || matches.length < 12) continue;
    
    const cells = matches.map(m => m.replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    const status = cells[0];
    const wikiTitle = cells[1];
    const wikiYear = cells[2];
    const role = cells[3];
    const castType = cells[4];
    const movieId = cells[5];
    const dbTitle = cells[6];
    const dbYear = cells[7];
    const suggestedField = cells[10];
    
    if (status.includes('EXISTS_NOT_ATTRIBUTED') && movieId) {
      fixes.push({
        celebrityName,
        movieId,
        dbTitle,
        dbYear,
        wikiTitle,
        wikiYear,
        role,
        castType,
        suggestedField
      });
    }
  }
  
  return fixes;
}

/**
 * Get current movie data from database
 */
async function getMovieData(movieId: string): Promise<any> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, slug, hero, heroine, director, producer, music_director, cinematographer, writer, cast_members, supporting_cast, crew')
    .eq('id', movieId)
    .single();
  
  if (error) return null;
  return data;
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any): string {
  if (!value) return 'NULL';
  
  if (Array.isArray(value)) {
    return value.map(v => {
      if (typeof v === 'object') {
        return v.name || JSON.stringify(v);
      }
      return v;
    }).join('; ');
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Extract what was added to a field
 */
function extractAddedValue(currentValue: any, celebrityName: string): string {
  if (!currentValue) return 'Not found';
  
  const nameLower = celebrityName.toLowerCase();
  
  if (Array.isArray(currentValue)) {
    const match = currentValue.find((v: any) => {
      const name = v.name || v;
      return String(name).toLowerCase().includes(nameLower);
    });
    
    if (match) {
      if (typeof match === 'object') {
        return `${match.name} (${match.role || match.type || 'N/A'})`;
      }
      return String(match);
    }
  }
  
  if (typeof currentValue === 'string' && currentValue.toLowerCase().includes(nameLower)) {
    return currentValue;
  }
  
  if (typeof currentValue === 'object') {
    const json = JSON.stringify(currentValue).toLowerCase();
    if (json.includes(nameLower)) {
      return JSON.stringify(currentValue);
    }
  }
  
  return 'Not found (may have been skipped)';
}

async function main() {
  console.log(chalk.blue.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.blue.bold('  GENERATE ATTRIBUTION CHANGES REPORT'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Read all audit CSV files
  const auditDir = path.join(process.cwd(), 'attribution-audits');
  
  if (!fs.existsSync(auditDir)) {
    console.error(chalk.red('❌ No attribution-audits directory found!'));
    process.exit(1);
  }
  
  const csvFiles = fs.readdirSync(auditDir)
    .filter(f => f.endsWith('.csv'))
    .map(f => path.join(auditDir, f));
  
  console.log(chalk.yellow(`📁 Found ${csvFiles.length} audit CSV files`));
  console.log(chalk.gray('   Parsing fixes that were attempted...\n'));
  
  // Parse all fixes
  let allFixes: any[] = [];
  
  for (const csvFile of csvFiles) {
    const fixes = parseAuditCSV(csvFile);
    allFixes = [...allFixes, ...fixes];
  }
  
  console.log(chalk.yellow(`📋 Total fixes found: ${allFixes.length}`));
  console.log(chalk.gray('   Querying database for current state...\n'));
  
  // Generate report
  const changes: AttributionChange[] = [];
  const uniqueMovieIds = [...new Set(allFixes.map(f => f.movieId))];
  
  console.log(chalk.cyan(`🔍 Checking ${uniqueMovieIds.length} unique movies...\n`));
  
  let processed = 0;
  
  for (const fix of allFixes) {
    processed++;
    
    if (processed % 100 === 0) {
      console.log(chalk.blue(`   Progress: ${processed}/${allFixes.length} (${Math.round(processed/allFixes.length*100)}%)`));
    }
    
    const movie = await getMovieData(fix.movieId);
    
    if (!movie) continue;
    
    // Determine which field to check
    let field = fix.suggestedField?.toLowerCase() || '';
    if (field === 'cast' || field === 'actor' || field === 'actress') field = 'cast_members';
    if (field === 'cameo') field = 'supporting_cast';
    
    // Get current field value
    let currentValue = null;
    let fieldName = field;
    
    if (field === 'cast_members') {
      currentValue = movie.cast_members;
      fieldName = 'cast_members';
    } else if (field === 'supporting_cast') {
      currentValue = movie.supporting_cast;
      fieldName = 'supporting_cast';
    } else if (field === 'hero') {
      currentValue = movie.hero;
      fieldName = 'hero';
    } else if (field === 'heroine') {
      currentValue = movie.heroine;
      fieldName = 'heroine';
    } else if (field === 'director') {
      currentValue = movie.director;
      fieldName = 'director';
    } else if (field === 'producer') {
      currentValue = movie.producer;
      fieldName = 'producer';
    } else if (field === 'music_director') {
      currentValue = movie.music_director;
      fieldName = 'music_director';
    } else if (field === 'cinematographer') {
      currentValue = movie.cinematographer;
      fieldName = 'cinematographer';
    } else if (field === 'writer') {
      currentValue = movie.writer;
      fieldName = 'writer';
    } else if (field.startsWith('crew')) {
      currentValue = movie.crew;
      fieldName = 'crew';
    }
    
    const attributionAdded = extractAddedValue(currentValue, fix.celebrityName);
    
    changes.push({
      movieId: movie.id,
      movieTitle: movie.title_en,
      movieTitleTe: movie.title_te || '',
      movieYear: movie.release_year,
      movieSlug: movie.slug,
      celebrityName: fix.celebrityName,
      fieldUpdated: fieldName,
      roleType: fix.role || '',
      castType: fix.castType || '',
      attributionAdded,
      currentValue: formatFieldValue(currentValue),
      changeSource: 'Wikipedia Audit'
    });
    
    // Rate limiting
    if (processed % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(chalk.green(`\n✓ Processed ${changes.length} attribution changes\n`));
  
  // Generate CSV
  const headers = [
    'Movie ID',
    'Movie Title (EN)',
    'Movie Title (TE)',
    'Year',
    'Slug',
    'Celebrity Name',
    'Field Updated',
    'Role Type',
    'Cast Type',
    'Attribution Added',
    'Current Field Value',
    'Change Source',
    'Review Status',
    'Review Notes'
  ];
  
  const rows: string[][] = [headers];
  
  // Sort by movie title
  changes.sort((a, b) => a.movieTitle.localeCompare(b.movieTitle));
  
  for (const change of changes) {
    rows.push([
      change.movieId,
      change.movieTitle,
      change.movieTitleTe,
      change.movieYear.toString(),
      change.movieSlug,
      change.celebrityName,
      change.fieldUpdated,
      change.roleType,
      change.castType,
      change.attributionAdded,
      change.currentValue.substring(0, 200), // Truncate long values
      change.changeSource,
      '', // Review Status (for manual filling)
      ''  // Review Notes (for manual filling)
    ]);
  }
  
  const csv = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  
  const outputFile = path.join(process.cwd(), 'ATTRIBUTION-CHANGES-REVIEW.csv');
  fs.writeFileSync(outputFile, csv);
  
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.green.bold('  ✓ REPORT GENERATED'));
  console.log(chalk.blue.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.yellow('Summary:'));
  console.log(chalk.white(`  • Total changes documented: ${changes.length}`));
  console.log(chalk.white(`  • Unique movies affected: ${uniqueMovieIds.length}`));
  console.log(chalk.white(`  • Unique celebrities: ${[...new Set(changes.map(c => c.celebrityName))].length}`));
  
  // Breakdown by field
  const byField = new Map<string, number>();
  changes.forEach(c => {
    byField.set(c.fieldUpdated, (byField.get(c.fieldUpdated) || 0) + 1);
  });
  
  console.log(chalk.yellow('\nBreakdown by field:'));
  for (const [field, count] of [...byField.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(chalk.white(`  • ${field}: ${count}`));
  }
  
  console.log(chalk.cyan(`\n📄 Report saved: ${outputFile}`));
  console.log(chalk.gray('\nOpen in Excel/Numbers for manual review'));
  console.log(chalk.gray('Columns "Review Status" and "Review Notes" are blank for your input\n'));
}

main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
