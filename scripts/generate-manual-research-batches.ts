/**
 * Generate Manual Research Batches
 * 
 * Creates TSV templates for:
 * - Awards Batch 6-10 (Top 100 legends without awards)
 * - Social Media Batch 2-5 (Active stars)
 * - Family Trees Batch 1-3 (Major stars and dynasties)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Celebrity {
  id: string;
  name_en: string;
  slug: string;
  occupation?: string[];
  wikipedia_url?: string;
  imdb_id?: string;
  awards?: any[];
  social_links?: any;
  family_relationships?: any;
}

async function generateAwardsBatches() {
  console.log(chalk.cyan.bold('\n🏆 Generating Awards Research Batches...\n'));

  // Get all celebrities
  const { data: allCelebs, error: celebError } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, occupation, wikipedia_url, imdb_id')
    .order('name_en');

  if (celebError || !allCelebs) {
    console.error(chalk.red('Error loading celebrities:'), celebError);
    return;
  }

  // Get celebrities with awards
  const { data: awardsData, error: awardsError } = await supabase
    .from('celebrity_awards')
    .select('celebrity_id');

  const celebsWithAwards = new Set(awardsData?.map(a => a.celebrity_id) || []);

  // Filter to celebrities without awards
  const celebrities = allCelebs.filter(c => !celebsWithAwards.has(c.id));

  // Prioritize actors/actresses first, then directors
  const prioritized = celebrities.sort((a, b) => {
    const aIsActor = a.occupation?.some(o => ['actor', 'actress'].includes(o.toLowerCase()));
    const bIsActor = b.occupation?.some(o => ['actor', 'actress'].includes(o.toLowerCase()));
    
    if (aIsActor && !bIsActor) return -1;
    if (!aIsActor && bIsActor) return 1;
    return a.name_en.localeCompare(b.name_en);
  });

  console.log(chalk.white(`  Found ${prioritized.length} celebrities without awards\n`));

  // Generate 5 batches of 20 each (Batches 6-10)
  const batchSize = 20;
  const numBatches = 5;

  for (let i = 0; i < numBatches; i++) {
    const batchNum = i + 6; // Start from Batch 6
    const start = i * batchSize;
    const end = start + batchSize;
    const batch = prioritized.slice(start, end);

    if (batch.length === 0) break;

    const tsvContent = [
      'slug\tname_en\toccupation\twikipedia_url\timdb_id\tawards_found\tstatus\tnotes'
    ];

    batch.forEach(celeb => {
      const occupation = (celeb.occupation || ['unknown']).join(', ');
      const wikipedia = celeb.wikipedia_url || 'N/A';
      const imdb = celeb.imdb_id || 'N/A';
      
      tsvContent.push(
        `${celeb.slug}\t${celeb.name_en}\t${occupation}\t${wikipedia}\t${imdb}\t\tTODO\t`
      );
    });

    const filename = `docs/manual-review/AWARDS-RESEARCH-BATCH-${batchNum}.tsv`;
    fs.writeFileSync(filename, tsvContent.join('\n'));
    
    console.log(chalk.green(`  ✓ Created ${filename}`));
  }
}

async function generateSocialMediaBatches() {
  console.log(chalk.cyan.bold('\n📱 Generating Social Media Research Batches...\n'));

  // Get all celebrities - filter for those without social media
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, occupation, wikipedia_url, imdb_id, twitter_url, instagram_url, facebook_url')
    .order('name_en');

  if (error || !celebrities) {
    console.error(chalk.red('Error loading celebrities:'), error);
    return;
  }

  // Filter to those without ANY social media
  const filtered = celebrities.filter(c => 
    !c.twitter_url && !c.instagram_url && !c.facebook_url
  );

  // Prioritize active actors/actresses (more likely to have social media)
  const prioritized = filtered.sort((a, b) => {
    const aIsActor = a.occupation?.some(o => ['actor', 'actress'].includes(o.toLowerCase()));
    const bIsActor = b.occupation?.some(o => ['actor', 'actress'].includes(o.toLowerCase()));
    
    if (aIsActor && !bIsActor) return -1;
    if (!aIsActor && bIsActor) return 1;
    return a.name_en.localeCompare(b.name_en);
  });

  console.log(chalk.white(`  Found ${prioritized.length} celebrities without social links\n`));

  // Generate 4 batches of 50 each (Batches 2-5)
  const batchSize = 50;
  const numBatches = 4;

  for (let i = 0; i < numBatches; i++) {
    const batchNum = i + 2; // Start from Batch 2
    const start = i * batchSize;
    const end = start + batchSize;
    const batch = prioritized.slice(start, end);

    if (batch.length === 0) break;

    const tsvContent = [
      'slug\tname_en\toccupation\twikipedia_url\ttwitter\tinstagram\tfacebook\tofficial_website\tstatus\tnotes'
    ];

    batch.forEach(celeb => {
      const occupation = (celeb.occupation || ['unknown']).join(', ');
      const wikipedia = celeb.wikipedia_url || 'N/A';
      
      tsvContent.push(
        `${celeb.slug}\t${celeb.name_en}\t${occupation}\t${wikipedia}\t\t\t\t\tTODO\t`
      );
    });

    const filename = `docs/manual-review/SOCIAL-MEDIA-BATCH-${batchNum}.tsv`;
    fs.writeFileSync(filename, tsvContent.join('\n'));
    
    console.log(chalk.green(`  ✓ Created ${filename}`));
  }
}

async function generateFamilyTreeBatches() {
  console.log(chalk.cyan.bold('\n👨‍👩‍👧‍👦 Generating Family Tree Research Batches...\n'));

  // Get celebrities without family relationships
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, occupation, wikipedia_url, family_relationships')
    .or('family_relationships.is.null,family_relationships.eq.{}')
    .order('name_en');

  if (error || !celebrities) {
    console.error(chalk.red('Error loading celebrities:'), error);
    return;
  }

  // Prioritize actors/actresses (more likely to have documented families)
  const prioritized = celebrities.sort((a, b) => {
    const aIsActor = a.occupation?.some(o => ['actor', 'actress'].includes(o.toLowerCase()));
    const bIsActor = b.occupation?.some(o => ['actor', 'actress'].includes(o.toLowerCase()));
    
    if (aIsActor && !bIsActor) return -1;
    if (!aIsActor && bIsActor) return 1;
    return a.name_en.localeCompare(b.name_en);
  });

  console.log(chalk.white(`  Found ${prioritized.length} celebrities without family data\n`));

  // Generate 3 batches of 30 each (Batches 1-3)
  const batchSize = 30;
  const numBatches = 3;

  for (let i = 0; i < numBatches; i++) {
    const batchNum = i + 1;
    const start = i * batchSize;
    const end = start + batchSize;
    const batch = prioritized.slice(start, end);

    if (batch.length === 0) break;

    const tsvContent = [
      'slug\tname_en\toccupation\twikipedia_url\tparents\tspouse\tchildren\tsiblings\trelatives\tstatus\tnotes'
    ];

    batch.forEach(celeb => {
      const occupation = (celeb.occupation || ['unknown']).join(', ');
      const wikipedia = celeb.wikipedia_url || 'N/A';
      
      tsvContent.push(
        `${celeb.slug}\t${celeb.name_en}\t${occupation}\t${wikipedia}\t\t\t\t\t\tTODO\t`
      );
    });

    const filename = `docs/manual-review/FAMILY-TREES-BATCH-${batchNum}.tsv`;
    fs.writeFileSync(filename, tsvContent.join('\n'));
    
    console.log(chalk.green(`  ✓ Created ${filename}`));
  }
}

async function main() {
  console.log(chalk.cyan.bold('╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║           GENERATE MANUAL RESEARCH BATCHES                            ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝'));

  await generateAwardsBatches();
  await generateSocialMediaBatches();
  await generateFamilyTreeBatches();

  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║                        SUMMARY                                         ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.green('  ✅ Awards Research Batches: 6-10 (100 profiles)'));
  console.log(chalk.green('  ✅ Social Media Batches: 2-5 (200 profiles)'));
  console.log(chalk.green('  ✅ Family Tree Batches: 1-3 (90 profiles)\n'));

  console.log(chalk.white('  📁 All files created in: docs/manual-review/\n'));

  console.log(chalk.yellow('  🚀 NEXT STEPS:\n'));
  console.log(chalk.white('  1. Start with AWARDS-RESEARCH-BATCH-6.tsv (20 profiles)'));
  console.log(chalk.white('  2. Research awards on Wikipedia for each celebrity'));
  console.log(chalk.white('  3. Fill in the awards_found column'));
  console.log(chalk.white('  4. Change status from TODO to DONE'));
  console.log(chalk.white('  5. Run: npx tsx scripts/import-awards-batch-6.ts\n'));
}

main();
