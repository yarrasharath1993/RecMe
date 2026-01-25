#!/usr/bin/env npx tsx
/**
 * APPLY VERIFIED CORRECTIONS
 * 
 * Updates movie titles, years, and hero based on verified data
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

const CORRECTIONS = [
  {
    id: 'd20403fb-8432-4565-85c4-961d128206cb',
    oldTitle: 'Well, If You Know Me',
    newTitle: 'Yennai Arindhaal',
    year: 2015,
    hero: 'Ajith Kumar',
    director: 'Gautham Vasudev Menon',
    note: 'Tamil blockbuster - international/archival title',
  },
  {
    id: '6212f700-84e3-4c84-bedc-570a48747a3d',
    oldTitle: 'Nizhal Thedum Nenjangal',
    newTitle: 'Nizhalgal',
    year: 1980, // Corrected from 1982
    hero: 'Rajinikanth',
    director: 'Bharathiraja',
    note: 'Tamil classic - corrected year from 1982 to 1980',
  },
  {
    id: 'f0b669a6-227e-46c8-bdca-8778aef704d8',
    oldTitle: 'Q12982331',
    newTitle: 'Bangaru Bommalu',
    year: 1977,
    hero: 'Akkineni Nageswara Rao',
    director: 'V. B. Rajendra Prasad',
    note: 'ANR classic - confirmed mapping from Q-ID',
  },
];

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

async function applyCorrections() {
  console.log(chalk.blue.bold('\n📝 APPLY VERIFIED CORRECTIONS\n'));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  const stats = {
    total: CORRECTIONS.length,
    applied: 0,
    skipped: 0,
    failed: 0,
  };
  
  for (const correction of CORRECTIONS) {
    console.log(chalk.cyan(`\n${correction.oldTitle} → ${correction.newTitle}`));
    console.log(chalk.gray(`  Year: ${correction.year}, Hero: ${correction.hero}`));
    console.log(chalk.gray(`  Note: ${correction.note}`));
    
    // Fetch current data
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, slug, hero, director')
      .eq('id', correction.id)
      .single();
    
    if (fetchError || !movie) {
      console.log(chalk.red(`  ✗ Movie not found`));
      stats.failed++;
      continue;
    }
    
    console.log(chalk.gray(`\n  Current: ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`  Current Hero: ${movie.hero}, Director: ${movie.director}`));
    
    // Check if already correct
    if (movie.title_en === correction.newTitle && 
        movie.release_year === correction.year &&
        movie.hero === correction.hero) {
      console.log(chalk.yellow(`  ⊳ Already correct`));
      stats.skipped++;
      continue;
    }
    
    if (EXECUTE) {
      const newSlug = slugify(correction.newTitle, { lower: true, strict: true }) + `-${correction.year}`;
      
      // Check if slug exists
      const { data: existingSlug } = await supabase
        .from('movies')
        .select('id, title_en')
        .eq('slug', newSlug)
        .neq('id', correction.id)
        .single();
      
      if (existingSlug) {
        console.log(chalk.red(`  ✗ Slug conflict: ${newSlug} already exists`));
        console.log(chalk.red(`    Other movie: ${existingSlug.title_en}`));
        stats.failed++;
        continue;
      }
      
      // Apply correction
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          title_en: correction.newTitle,
          release_year: correction.year,
          slug: newSlug,
          hero: correction.hero,
          director: correction.director,
          updated_at: new Date().toISOString(),
        })
        .eq('id', correction.id);
      
      if (updateError) {
        console.log(chalk.red(`  ✗ Update failed: ${updateError.message}`));
        stats.failed++;
      } else {
        console.log(chalk.green(`  ✓ Corrected successfully`));
        console.log(chalk.green(`    New: ${correction.newTitle} (${correction.year})`));
        console.log(chalk.green(`    Slug: ${newSlug}`));
        stats.applied++;
      }
    } else {
      console.log(chalk.yellow(`  ⊳ Would update to: ${correction.newTitle} (${correction.year})`));
      stats.applied++;
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('CORRECTION SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Corrections:     ${stats.total}`));
  console.log(chalk.green(`Applied:               ${stats.applied}`));
  console.log(chalk.yellow(`Skipped (already ok):  ${stats.skipped}`));
  console.log(chalk.red(`Failed:                ${stats.failed}`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes made'));
    console.log(chalk.yellow('   Run with --execute to apply'));
  } else if (stats.applied > 0) {
    console.log(chalk.green(`\n✓ Applied ${stats.applied} corrections!`));
    console.log(chalk.cyan('\n📤 Next steps:'));
    console.log(chalk.gray('   1. Fetch posters from verified sources'));
    console.log(chalk.gray('   2. Apply posters'));
    console.log(chalk.gray('   3. Publish movies'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

applyCorrections()
  .then(() => {
    console.log(chalk.green('✓ Corrections completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Corrections failed:'), error);
    process.exit(1);
  });
