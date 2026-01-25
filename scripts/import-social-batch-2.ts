/**
 * Import Social Media Batch 2
 * 
 * Imports manually researched social media links from SOCIAL-MEDIA-BATCH-2.tsv
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

interface SocialEntry {
  slug: string;
  name_en: string;
  twitter: string;
  instagram: string;
  facebook: string;
  official_website: string;
  status: string;
}

async function importBatch() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           IMPORT SOCIAL MEDIA BATCH 2                                 ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  const filename = 'docs/manual-review/SOCIAL-MEDIA-BATCH-2.tsv';

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
    
    if (parts.length < 9) {
      console.log(chalk.yellow(`  [${i + 1}/${dataLines.length}] Skipping malformed line`));
      skipped++;
      continue;
    }

    const entry: SocialEntry = {
      slug: parts[0].trim(),
      name_en: parts[1].trim(),
      twitter: parts[4].trim(),
      instagram: parts[5].trim(),
      facebook: parts[6].trim(),
      official_website: parts[7].trim(),
      status: parts[8].trim()
    };

    // Only process DONE entries
    if (entry.status !== 'DONE') {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.gray('⊘ not done'));
      skipped++;
      continue;
    }

    // Check if any social media was provided
    const hasData = entry.twitter || entry.instagram || entry.facebook || entry.official_website;
    
    if (!hasData || hasData === 'N/A') {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.yellow('⊘ no links'));
      skipped++;
      continue;
    }

    // Update celebrity
    const updates: any = {};
    if (entry.twitter && entry.twitter !== 'N/A') updates.twitter_url = entry.twitter;
    if (entry.instagram && entry.instagram !== 'N/A') updates.instagram_url = entry.instagram;
    if (entry.facebook && entry.facebook !== 'N/A') updates.facebook_url = entry.facebook;
    if (entry.official_website && entry.official_website !== 'N/A') updates.official_website = entry.official_website;

    const { error } = await supabase
      .from('celebrities')
      .update(updates)
      .eq('slug', entry.slug);

    if (error) {
      console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.red('✗ error'));
      console.error('  ', error);
      errors++;
      continue;
    }

    const linksCount = Object.keys(updates).length;
    console.log(`  [${i + 1}/${dataLines.length}] ${entry.name_en}`.padEnd(50) + chalk.green(`✓ ${linksCount} links`));
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
