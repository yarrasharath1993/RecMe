#!/usr/bin/env npx tsx
/**
 * MERGE DUPLICATE MOVIES
 * 
 * Handles Q-title duplicates by:
 * 1. Comparing both versions
 * 2. Keeping the better one (more data)
 * 3. Unpublishing/deleting the other
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DUPLICATES = [
  {
    qTitle: 'Q12985478',
    qId: 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e',
    qSlug: 'q12985478-1979',
    realTitle: 'Kothala Raayudu',
    realYear: 1979,
    realSlug: 'kothala-raayudu-1979',
  },
  {
    qTitle: 'Q16311395',
    qId: '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31',
    qSlug: 'q16311395-1978',
    realTitle: 'Karunamayudu',
    realYear: 1978,
    realSlug: 'karunamayudu-1978',
  },
  {
    qTitle: 'Q12982331',
    qId: 'f0b669a6-227e-46c8-bdca-8778aef704d8',
    qSlug: 'q12982331-1977',
    realTitle: 'Bangaru Bommalu',
    realYear: 1977,
    realSlug: 'bangaru-bommalu-1977',
  },
];

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

async function analyzeDuplicates() {
  console.log(chalk.blue.bold('\n🔍 ANALYZE DUPLICATE MOVIES\n'));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  ANALYSIS MODE'));
    console.log(chalk.yellow('    Use --execute to merge duplicates\n'));
  }
  
  const stats = {
    total: DUPLICATES.length,
    analyzed: 0,
    keepQ: 0,
    keepReal: 0,
    bothSame: 0,
    merged: 0,
    failed: 0,
  };
  
  for (const dup of DUPLICATES) {
    stats.analyzed++;
    
    console.log(chalk.cyan(`\n[${stats.analyzed}/${stats.total}] ${dup.realTitle} (${dup.realYear})`));
    console.log(chalk.gray('━'.repeat(60)));
    
    // Fetch both versions
    const { data: qMovie } = await supabase
      .from('movies')
      .select('*')
      .eq('id', dup.qId)
      .single();
    
    const { data: realMovie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', dup.realSlug)
      .single();
    
    if (!qMovie || !realMovie) {
      console.log(chalk.red('  ✗ Could not fetch both versions'));
      stats.failed++;
      continue;
    }
    
    // Compare versions
    console.log(chalk.white('\n  Q-TITLE VERSION:'));
    console.log(chalk.gray(`    Title: ${qMovie.title_en}`));
    console.log(chalk.gray(`    Slug: ${qMovie.slug}`));
    console.log(chalk.gray(`    Published: ${qMovie.is_published ? 'YES' : 'NO'}`));
    console.log(chalk.gray(`    Poster: ${qMovie.poster_url ? '✓' : '✗'}`));
    console.log(chalk.gray(`    Rating: ${qMovie.our_rating || '✗'}`));
    console.log(chalk.gray(`    Hero: ${qMovie.hero || '✗'}`));
    console.log(chalk.gray(`    Director: ${qMovie.director || '✗'}`));
    console.log(chalk.gray(`    TMDB: ${qMovie.tmdb_id || '✗'}`));
    
    console.log(chalk.white('\n  REAL TITLE VERSION:'));
    console.log(chalk.gray(`    Title: ${realMovie.title_en}`));
    console.log(chalk.gray(`    Slug: ${realMovie.slug}`));
    console.log(chalk.gray(`    Published: ${realMovie.is_published ? 'YES' : 'NO'}`));
    console.log(chalk.gray(`    Poster: ${realMovie.poster_url ? '✓' : '✗'}`));
    console.log(chalk.gray(`    Rating: ${realMovie.our_rating || '✗'}`));
    console.log(chalk.gray(`    Hero: ${realMovie.hero || '✗'}`));
    console.log(chalk.gray(`    Director: ${realMovie.director || '✗'}`));
    console.log(chalk.gray(`    TMDB: ${realMovie.tmdb_id || '✗'}`));
    
    // Score each version
    const qScore = (qMovie.poster_url ? 1 : 0) + 
                   (qMovie.our_rating ? 1 : 0) + 
                   (qMovie.hero ? 1 : 0) + 
                   (qMovie.director ? 1 : 0) + 
                   (qMovie.tmdb_id ? 1 : 0);
    
    const realScore = (realMovie.poster_url ? 1 : 0) + 
                      (realMovie.our_rating ? 1 : 0) + 
                      (realMovie.hero ? 1 : 0) + 
                      (realMovie.director ? 1 : 0) + 
                      (realMovie.tmdb_id ? 1 : 0);
    
    console.log(chalk.white('\n  QUALITY SCORES:'));
    console.log(chalk.gray(`    Q-title: ${qScore}/5`));
    console.log(chalk.gray(`    Real title: ${realScore}/5`));
    
    // Determine which to keep
    let keepWhich = '';
    let keepId = '';
    let deleteId = '';
    
    if (qScore > realScore) {
      keepWhich = 'Q-TITLE';
      keepId = qMovie.id;
      deleteId = realMovie.id;
      stats.keepQ++;
    } else if (realScore > qScore) {
      keepWhich = 'REAL TITLE';
      keepId = realMovie.id;
      deleteId = qMovie.id;
      stats.keepReal++;
    } else {
      keepWhich = 'BOTH SAME';
      keepId = realMovie.id; // Prefer real title when equal
      deleteId = qMovie.id;
      stats.bothSame++;
    }
    
    console.log(chalk.yellow(`\n  📊 RECOMMENDATION: Keep ${keepWhich}`));
    console.log(chalk.gray(`     Keep ID: ${keepId.substring(0, 8)}...`));
    console.log(chalk.gray(`     Delete ID: ${deleteId.substring(0, 8)}...`));
    
    if (EXECUTE) {
      // Merge data from Q-title to real title if needed
      if (keepWhich === 'Q-TITLE') {
        // Update real title with Q-title data
        console.log(chalk.cyan(`\n  🔄 Merging Q-title data into real title...`));
        
        const updates: any = {
          updated_at: new Date().toISOString(),
        };
        
        if (qMovie.poster_url && !realMovie.poster_url) {
          updates.poster_url = qMovie.poster_url;
          updates.poster_confidence = qMovie.poster_confidence;
        }
        if (qMovie.our_rating && !realMovie.our_rating) {
          updates.our_rating = qMovie.our_rating;
        }
        if (qMovie.tmdb_id && !realMovie.tmdb_id) {
          updates.tmdb_id = qMovie.tmdb_id;
        }
        
        if (Object.keys(updates).length > 1) {
          const { error: updateError } = await supabase
            .from('movies')
            .update(updates)
            .eq('id', realMovie.id);
          
          if (updateError) {
            console.log(chalk.red(`    ✗ Merge failed: ${updateError.message}`));
            stats.failed++;
            continue;
          } else {
            console.log(chalk.green(`    ✓ Data merged successfully`));
          }
        }
      }
      
      // Unpublish the duplicate
      console.log(chalk.cyan(`\n  🗑️  Unpublishing duplicate (${deleteId.substring(0, 8)}...)...`));
      
      const { error: unpublishError } = await supabase
        .from('movies')
        .update({ 
          is_published: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', deleteId);
      
      if (unpublishError) {
        console.log(chalk.red(`    ✗ Unpublish failed: ${unpublishError.message}`));
        stats.failed++;
      } else {
        console.log(chalk.green(`    ✓ Duplicate unpublished`));
        stats.merged++;
      }
    }
  }
  
  // Summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('DUPLICATE ANALYSIS SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Duplicates:      ${stats.total}`));
  console.log(chalk.white(`Analyzed:              ${stats.analyzed}`));
  console.log(chalk.cyan(`Keep Q-Title:          ${stats.keepQ}`));
  console.log(chalk.cyan(`Keep Real Title:       ${stats.keepReal}`));
  console.log(chalk.gray(`Both Same Quality:     ${stats.bothSame}`));
  
  if (EXECUTE) {
    console.log(chalk.green(`Merged Successfully:   ${stats.merged}`));
    console.log(chalk.red(`Failed:                ${stats.failed}`));
  }
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  ANALYSIS ONLY - No changes made'));
    console.log(chalk.yellow('   Run with --execute to merge duplicates'));
  } else if (stats.merged > 0) {
    console.log(chalk.green(`\n✓ Merged ${stats.merged} duplicates!`));
    console.log(chalk.cyan('\n📤 Next: Verify published movies'));
    console.log(chalk.gray('   Check /movies pages to ensure correct versions are showing'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

analyzeDuplicates()
  .then(() => {
    console.log(chalk.green('✓ Duplicate analysis completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Analysis failed:'), error);
    process.exit(1);
  });
