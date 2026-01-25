/**
 * Import Awards Research Batch 6
 * 
 * Imports manually researched awards from AWARDS-RESEARCH-BATCH-6.tsv
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

interface AwardEntry {
  slug: string;
  name_en: string;
  awards_found: string;
  status: string;
}

function parseAwardsString(awardsString: string): any[] {
  if (!awardsString || awardsString.trim() === '' || awardsString === 'N/A') {
    return [];
  }

  const awards: any[] = [];
  
  // Split by semicolon for multiple awards
  const awardParts = awardsString.split(';').map(s => s.trim());

  for (const part of awardParts) {
    // Extract award name, year(s), and optionally film name
    // Format: "Award Name (Year(s)) - Film Name" or "Award Name (Year(s))"
    
    const match = part.match(/^(.+?)\s*\((.+?)\)(?:\s*-\s*(.+))?$/);
    
    if (match) {
      const [, awardName, years, filmName] = match;
      
      // Handle multiple years like "1998, 2001, 2005"
      const yearList = years.split(',').map(y => y.trim());
      
      for (const year of yearList) {
        awards.push({
          award_name: awardName.trim(),
          year: parseInt(year),
          film_name: filmName ? filmName.trim() : null
        });
      }
    } else {
      // Fallback for simpler formats
      awards.push({
        award_name: part,
        year: null,
        film_name: null
      });
    }
  }

  return awards;
}

async function importBatch() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           IMPORT AWARDS RESEARCH BATCH 6                              ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  const filename = 'docs/manual-review/AWARDS-RESEARCH-BATCH-6-COMPLETED.tsv';

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
    
    if (parts.length < 7) {
      console.log(chalk.yellow(`  [${i + 1}/${dataLines.length}] Skipping malformed line`));
      skipped++;
      continue;
    }

    const entry: AwardEntry = {
      slug: parts[0].trim(),
      name_en: parts[1].trim(),
      awards_found: parts[5].trim(),
      status: parts[6].trim()
    };

    // Only process DONE entries
    if (entry.status !== 'DONE') {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.gray('⊘ not done'));
      skipped++;
      continue;
    }

    // Get celebrity ID
    const { data: celeb, error: celebError } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', entry.slug)
      .single();

    if (celebError || !celeb) {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.red('✗ not found'));
      errors++;
      continue;
    }

    // Parse awards
    const awards = parseAwardsString(entry.awards_found);

    if (awards.length === 0) {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.yellow('⊘ no awards'));
      skipped++;
      continue;
    }

    // Insert awards
    for (const award of awards) {
      // Check if award already exists
      const { data: existing } = await supabase
        .from('celebrity_awards')
        .select('id')
        .eq('celebrity_id', celeb.id)
        .eq('award_name', award.award_name)
        .eq('year', award.year);

      if (existing && existing.length > 0) {
        continue; // Skip existing
      }

      const { error: insertError } = await supabase
        .from('celebrity_awards')
        .insert({
          celebrity_id: celeb.id,
          award_name: award.award_name,
          year: award.year,
          film_name: award.film_name,
          category: null,
          source: 'manual_research'
        });

      if (insertError) {
        console.error(`Error inserting award for ${entry.name_en}:`, insertError);
      }
    }

    console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.green(`✓ ${awards.length} awards`));
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
