/**
 * Import Family Trees Batch 1
 * 
 * Imports manually researched family relationships from FAMILY-TREES-BATCH-1.tsv
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FamilyEntry {
  slug: string;
  name_en: string;
  parents: string;
  spouse: string;
  children: string;
  siblings: string;
  relatives: string;
  status: string;
}

function parseRelationships(input: string): any {
  if (!input || input.trim() === '' || input === 'N/A') {
    return null;
  }

  // Simple parsing - split by commas
  // For more complex parsing, you might want to handle relationships in parentheses
  return input.split(',').map(s => s.trim()).filter(s => s);
}

async function importBatch() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           IMPORT FAMILY TREES BATCH 1                                 ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  const filename = 'docs/manual-review/FAMILY-TREES-BATCH-1.tsv';

  if (!fs.existsSync(filename)) {
    console.error(chalk.red(`Error: ${filename} not found`));
    return;
  }

  const content = fs.readFileSync(filename, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());

  // Skip header
  const dataLines = lines.slice(1);

  console.log(chalk.white(`  Found ${dataLines.length} profiles to import\n`));

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < dataLines.length; i++) {
    const parts = dataLines[i].split('\t');
    
    if (parts.length < 10) {
      console.log(chalk.yellow(`  [${i + 1}/${dataLines.length}] Skipping malformed line`));
      skipped++;
      continue;
    }

    const entry: FamilyEntry = {
      slug: parts[0].trim(),
      name_en: parts[1].trim(),
      parents: parts[4].trim(),
      spouse: parts[5].trim(),
      children: parts[6].trim(),
      siblings: parts[7].trim(),
      relatives: parts[8].trim(),
      status: parts[9].trim()
    };

    // Only process DONE entries
    if (entry.status !== 'DONE') {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.gray('⊘ not done'));
      skipped++;
      continue;
    }

    // Build family relationships object
    const familyData: any = {};
    
    if (entry.parents && entry.parents !== 'N/A') {
      familyData.parents = parseRelationships(entry.parents);
    }
    
    if (entry.spouse && entry.spouse !== 'N/A') {
      familyData.spouse = entry.spouse;
    }
    
    if (entry.children && entry.children !== 'N/A') {
      familyData.children = parseRelationships(entry.children);
    }
    
    if (entry.siblings && entry.siblings !== 'N/A') {
      familyData.siblings = parseRelationships(entry.siblings);
    }
    
    if (entry.relatives && entry.relatives !== 'N/A') {
      familyData.relatives = parseRelationships(entry.relatives);
    }

    // Check if any data was provided
    if (Object.keys(familyData).length === 0) {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.yellow('⊘ no data'));
      skipped++;
      continue;
    }

    // Update celebrity
    const { error } = await supabase
      .from('celebrities')
      .update({ family_relationships: familyData })
      .eq('slug', entry.slug);

    if (error) {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.red('✗ error'));
      console.error('  ', error);
      errors++;
      continue;
    }

    const fieldsCount = Object.keys(familyData).length;
    console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.green(`✓ ${fieldsCount} fields`));
    imported++;
  }

  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                        SUMMARY                                         ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green(`  ✅ Imported: ${imported} profiles`));
  console.log(chalk.yellow(`  ⊘ Skipped: ${skipped}`));
  console.log(chalk.red(`  ✗ Errors: ${errors}\n`));
}

importBatch();
