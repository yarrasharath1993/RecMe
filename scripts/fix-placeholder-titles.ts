#!/usr/bin/env npx tsx
/**
 * FIX PLACEHOLDER TITLES
 * 
 * Updates Q-IDs to actual movie titles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import slugify from 'slugify';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TITLE_FIXES = [
  {
    id: 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e',
    oldTitle: 'Q12985478',
    newTitle: 'Kothala Raayudu',
    year: 1979,
  },
  {
    id: '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31',
    oldTitle: 'Q16311395',
    newTitle: 'Karunamayudu',
    year: 1978,
  },
  {
    id: 'f0b669a6-227e-46c8-bdca-8778aef704d8',
    oldTitle: 'Q12982331',
    newTitle: 'Bangaru Bommalu',
    year: 1977,
  },
];

async function fixPlaceholderTitles() {
  console.log(chalk.blue.bold('\n🔧 FIX PLACEHOLDER TITLES\n'));
  
  const stats = {
    total: TITLE_FIXES.length,
    fixed: 0,
    failed: 0,
  };
  
  for (const fix of TITLE_FIXES) {
    const newSlug = slugify(fix.newTitle, { lower: true, strict: true }) + `-${fix.year}`;
    
    console.log(chalk.cyan(`\nFixing: ${fix.oldTitle} → ${fix.newTitle}`));
    console.log(chalk.gray(`  New slug: ${newSlug}`));
    
    const { error } = await supabase
      .from('movies')
      .update({
        title_en: fix.newTitle,
        slug: newSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', fix.id);
    
    if (error) {
      console.log(chalk.red(`  ✗ Failed: ${error.message}`));
      stats.failed++;
    } else {
      console.log(chalk.green(`  ✓ Fixed successfully`));
      stats.fixed++;
    }
  }
  
  // Verify
  console.log(chalk.cyan('\n📋 Verification:\n'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, poster_url, our_rating, is_published')
    .in('id', TITLE_FIXES.map(f => f.id));
  
  if (movies) {
    for (const movie of movies) {
      console.log(chalk.white(`${movie.title_en} (${movie.release_year})`));
      console.log(chalk.gray(`  Slug: ${movie.slug}`));
      console.log(chalk.gray(`  Poster: ${movie.poster_url ? '✓' : '✗'}`));
      console.log(chalk.gray(`  Rating: ${movie.our_rating || '✗'}`));
      console.log(chalk.gray(`  Published: ${movie.is_published ? '✓' : '✗'}`));
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('TITLE FIX SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Titles:          ${stats.total}`));
  console.log(chalk.green(`Fixed Successfully:    ${stats.fixed}`));
  console.log(chalk.red(`Failed:                ${stats.failed}`));
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

fixPlaceholderTitles()
  .then(() => {
    console.log(chalk.green('✓ Title fix completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Title fix failed:'), error);
    process.exit(1);
  });
