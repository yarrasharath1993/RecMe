#!/usr/bin/env npx tsx
/**
 * Import Telugu Titles from CSV
 * Reads CSV files and updates movies with Telugu titles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function parseCSV(content: string): Array<Record<string, string>> {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Array<Record<string, string>> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

async function importFromCSV(filePath: string, dryRun: boolean) {
  console.log(chalk.yellow(`\n📁 Processing ${filePath}...`));
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.red(`   File not found: ${filePath}`));
    return { processed: 0, updated: 0, skipped: 0 };
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  
  for (const row of rows) {
    const slug = row.slug;
    const titleTe = row.title_te;
    
    if (!slug) continue;
    processed++;
    
    // Skip if no Telugu title provided
    if (!titleTe || titleTe.trim() === '') {
      skipped++;
      continue;
    }
    
    // Validate it contains Telugu characters
    if (!/[\u0C00-\u0C7F]/.test(titleTe)) {
      console.log(chalk.gray(`   ⚠ ${row.title_en} - title_te doesn't contain Telugu chars, skipping`));
      skipped++;
      continue;
    }
    
    console.log(`   ✓ ${row.title_en} → ${titleTe}`);
    
    if (!dryRun) {
      const { error } = await supabase
        .from('movies')
        .update({ title_te: titleTe.trim() })
        .eq('slug', slug);
      
      if (!error) updated++;
    } else {
      updated++;
    }
  }
  
  return { processed, updated, skipped };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const fileArg = args.find(a => a.startsWith('--file='));
  
  // Default files to process
  const files = fileArg 
    ? [fileArg.split('=')[1]]
    : [
        'telugu-needed-2020s.csv',
        'telugu-needed-2010s.csv',
        'telugu-needed-2000s.csv',
        'telugu-needed-pre2000.csv',
      ];
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║        IMPORT TELUGU TITLES FROM CSV                             ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? chalk.yellow('DRY RUN (use --execute to apply)') : chalk.green('EXECUTING')}
Files: ${files.join(', ')}
`));

  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  for (const file of files) {
    const result = await importFromCSV(file, dryRun);
    totalProcessed += result.processed;
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
  }
  
  console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
                          SUMMARY                                  
═══════════════════════════════════════════════════════════════════

  Total rows: ${totalProcessed}
  With Telugu title: ${totalUpdated}
  Skipped (empty): ${totalSkipped}
  
  ${dryRun ? chalk.yellow('Run with --execute to apply changes') : chalk.green('✅ Changes applied!')}
`));
}

main().catch(console.error);
