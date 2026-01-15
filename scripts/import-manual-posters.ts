#!/usr/bin/env npx tsx
/**
 * IMPORT MANUAL POSTER RESEARCH
 * 
 * Reads CSV with manually researched posters and imports them
 * Validates URLs, updates database, tracks results
 * 
 * Usage:
 *   npx tsx scripts/import-manual-posters.ts MANUAL-POSTER-RESEARCH-678.csv
 *   npx tsx scripts/import-manual-posters.ts MANUAL-POSTER-RESEARCH-678.csv --execute
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFile } from 'fs/promises';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PosterRecord {
  slug: string;
  year: number;
  title: string;
  posterUrl: string;
  source: string;
  notes: string;
}

async function validateUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok && response.headers.get('content-type')?.includes('image');
  } catch {
    return false;
  }
}

async function parseCSV(filepath: string): Promise<PosterRecord[]> {
  const content = await readFile(filepath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const records: PosterRecord[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Parse CSV (handle quoted fields)
    const match = line.match(/^([^,]*),(\d+),"([^"]*)","([^"]*)","([^"]*)",([^,]*),([^,]*),([^,]*),([^,]*),(.*)$/);
    
    if (!match) continue;
    
    const [, decade, year, title, hero, director, tmdbId, slug, posterUrl, source, notes] = match;
    
    // Only process records with poster URLs
    if (!posterUrl || !posterUrl.trim() || posterUrl === ',') continue;
    
    records.push({
      slug: slug.trim(),
      year: parseInt(year),
      title: title.trim(),
      posterUrl: posterUrl.trim(),
      source: source.trim() || 'manual_research',
      notes: notes.trim(),
    });
  }
  
  return records;
}

async function importPosters(records: PosterRecord[], dryRun: boolean) {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║         MANUAL POSTER IMPORT                                  ║
╚══════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${dryRun ? chalk.yellow('DRY RUN') : chalk.green('LIVE')}`);
  console.log(`  Records to import: ${records.length}\n`);
  
  const stats = {
    validated: 0,
    invalid: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
  };
  
  const invalidUrls: string[] = [];
  const notFoundSlugs: string[] = [];
  const errors: Array<{ slug: string; error: string }> = [];
  
  console.log('  Validating and importing...\n');
  
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const progress = ((i + 1) / records.length * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(parseInt(progress) / 5)) + '░'.repeat(20 - Math.floor(parseInt(progress) / 5));
    
    process.stdout.write(`\r  [${bar}] ${progress}% | Valid: ${stats.validated} | Invalid: ${stats.invalid}`);
    
    // Validate URL
    const isValid = await validateUrl(record.posterUrl);
    
    if (!isValid) {
      stats.invalid++;
      invalidUrls.push(`${record.title} (${record.year}): ${record.posterUrl}`);
      continue;
    }
    
    stats.validated++;
    
    if (dryRun) continue;
    
    // Update database
    try {
      const { data: existing } = await supabase
        .from('movies')
        .select('id')
        .eq('slug', record.slug)
        .single();
      
      if (!existing) {
        stats.notFound++;
        notFoundSlugs.push(record.slug);
        continue;
      }
      
      const { error } = await supabase
        .from('movies')
        .update({
          poster_url: record.posterUrl,
          poster_confidence: 0.70, // Manual research confidence
          archival_source: {
            source_name: record.source,
            source_type: 'manual',
            license_type: 'attribution',
            acquisition_date: new Date().toISOString(),
            image_url: record.posterUrl,
            license_verified: false,
            researcher_notes: record.notes,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('slug', record.slug);
      
      if (error) {
        stats.errors++;
        errors.push({ slug: record.slug, error: error.message });
      } else {
        stats.updated++;
      }
    } catch (err) {
      stats.errors++;
      errors.push({ slug: record.slug, error: (err as Error).message });
    }
  }
  
  console.log('\n');
  
  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('  SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(`  Total records:     ${records.length}`);
  console.log(`  ${chalk.green('✓')} Validated:        ${stats.validated}`);
  console.log(`  ${chalk.red('✗')} Invalid URLs:     ${stats.invalid}`);
  
  if (!dryRun) {
    console.log(`  ${chalk.green('✓')} Updated:          ${stats.updated}`);
    console.log(`  ${chalk.yellow('⚠')} Not found:        ${stats.notFound}`);
    console.log(`  ${chalk.red('✗')} Errors:           ${stats.errors}`);
  }
  
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════\n'));
  
  // Show invalid URLs
  if (invalidUrls.length > 0) {
    console.log(chalk.red.bold('\n❌ Invalid URLs (not accessible):\n'));
    invalidUrls.slice(0, 20).forEach(url => {
      console.log(`  • ${url}`);
    });
    if (invalidUrls.length > 20) {
      console.log(`  ... and ${invalidUrls.length - 20} more`);
    }
  }
  
  // Show not found slugs
  if (!dryRun && notFoundSlugs.length > 0) {
    console.log(chalk.yellow.bold('\n⚠️  Movies not found in database:\n'));
    notFoundSlugs.slice(0, 10).forEach(slug => {
      console.log(`  • ${slug}`);
    });
    if (notFoundSlugs.length > 10) {
      console.log(`  ... and ${notFoundSlugs.length - 10} more`);
    }
  }
  
  // Show errors
  if (!dryRun && errors.length > 0) {
    console.log(chalk.red.bold('\n❌ Errors during import:\n'));
    errors.slice(0, 10).forEach(({ slug, error }) => {
      console.log(`  • ${slug}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`  ... and ${errors.length - 10} more`);
    }
  }
  
  if (dryRun) {
    console.log(chalk.yellow('\n💡 This was a DRY RUN. Add --execute to actually import.\n'));
  } else {
    console.log(chalk.green(`\n✅ Import complete! ${stats.updated} posters added to database.\n`));
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error(chalk.red('\n❌ Error: No CSV file specified\n'));
    console.log('Usage:');
    console.log('  npx tsx scripts/import-manual-posters.ts <csv-file>');
    console.log('  npx tsx scripts/import-manual-posters.ts MANUAL-POSTER-RESEARCH-678.csv');
    console.log('  npx tsx scripts/import-manual-posters.ts MANUAL-POSTER-RESEARCH-678.csv --execute\n');
    process.exit(1);
  }
  
  const csvFile = args[0];
  const dryRun = !args.includes('--execute');
  
  try {
    console.log(`\n  Reading ${csvFile}...`);
    const records = await parseCSV(csvFile);
    
    if (records.length === 0) {
      console.log(chalk.yellow('\n⚠️  No poster URLs found in CSV. Make sure to fill the poster_url_found column.\n'));
      process.exit(0);
    }
    
    await importPosters(records, dryRun);
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

main();
