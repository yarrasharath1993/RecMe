import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WikiCorrection {
  celebId: string;
  name: string;
  currentIssue: string;
  correctedUrl: string;
  status: string;
  notes: string;
}

function parseCSV(content: string): WikiCorrection[] {
  const lines = content.split('\n').filter(line => line.trim());
  const records: WikiCorrection[] = [];
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Simple CSV parser for quoted fields
    const matches = line.match(/"([^"]*)"/g);
    if (matches && matches.length >= 6) {
      records.push({
        celebId: matches[0].replace(/"/g, ''),
        name: matches[1].replace(/"/g, ''),
        currentIssue: matches[2].replace(/"/g, ''),
        correctedUrl: matches[3].replace(/"/g, ''),
        status: matches[4].replace(/"/g, ''),
        notes: matches[5].replace(/"/g, ''),
      });
    }
  }
  
  return records;
}

async function updateWikipediaUrls(dryRun: boolean) {
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  UPDATE WIKIPEDIA URLs'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Read corrections CSV (try auto-completed first, fallback to original)
  let csvPath = 'WIKIPEDIA-URL-AUTO-COMPLETED.csv';
  if (!fs.existsSync(csvPath)) {
    csvPath = 'WIKIPEDIA-URL-CORRECTIONS.csv';
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCSV(csvContent);
  
  // Filter READY and AUTO_COMPLETED ones
  const readyCorrections = records.filter(r => r.status === 'READY' || r.status === 'AUTO_COMPLETED');
  
  console.log(chalk.cyan(`Found ${readyCorrections.length} celebrities ready for update\n`));
  
  if (dryRun) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made\n'));
  } else {
    console.log(chalk.red('⚠️  EXECUTE MODE - Database will be updated!\n'));
  }
  
  let updated = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const correction of readyCorrections) {
    const celebId = correction.celebId;
    const name = correction.name;
    const url = correction.correctedUrl;
    
    if (!url || url === 'NEEDS_RESEARCH') {
      console.log(chalk.gray(`  ○ Skipped: ${name} (needs research)`));
      skipped++;
      continue;
    }
    
    if (dryRun) {
      console.log(chalk.green(`  → Would update: ${name}`));
      console.log(chalk.gray(`    URL: ${url}`));
      updated++;
    } else {
      try {
        const { error } = await supabase
          .from('celebrities')
          .update({ wikipedia_url: url })
          .eq('id', celebId);
        
        if (error) {
          console.log(chalk.red(`  ✗ Failed: ${name} - ${error.message}`));
          failed++;
        } else {
          console.log(chalk.green(`  ✓ Updated: ${name}`));
          console.log(chalk.gray(`    URL: ${url}`));
          updated++;
        }
      } catch (error: any) {
        console.log(chalk.red(`  ✗ Error: ${name} - ${error.message}`));
        failed++;
      }
    }
  }
  
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  SUMMARY'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan('Total Ready:           '), readyCorrections.length);
  if (dryRun) {
    console.log(chalk.green('Would Update:          '), updated);
  } else {
    console.log(chalk.green('✓ Updated:             '), updated);
    console.log(chalk.red('✗ Failed:              '), failed);
  }
  console.log(chalk.gray('○ Skipped:             '), skipped);
  
  if (dryRun) {
    console.log(chalk.yellow('\n💡 Run with --execute to apply changes'));
  } else if (updated > 0) {
    console.log(chalk.green(`\n✅ Successfully updated ${updated} Wikipedia URLs!`));
  }
}

// Main
const args = process.argv.slice(2);
const dryRun = !args.includes('--execute');

updateWikipediaUrls(dryRun).catch(console.error);
