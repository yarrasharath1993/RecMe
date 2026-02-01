#!/usr/bin/env npx tsx
/**
 * ADD CORRECT ACTORS TO REATTRIBUTED FILMS
 * 
 * Adds the correct actors to films where Chiranjeevi was removed.
 * 
 * Usage:
 *   npx tsx scripts/add-reattributed-actors.ts --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

interface ReattributionTask {
  title: string;
  year: number;
  movieId: string;
  actors: {
    hero?: string;
    heroine?: string;
    supporting?: string[];
  };
  specialNotes?: string;
}

const REATTRIBUTION_TASKS: ReattributionTask[] = [
  {
    title: 'Rojulu Marayi',
    year: 1984,
    movieId: '1e238a2f-0a89-4f4d-ad21-2e996c6de275',
    actors: {
      hero: 'Murali Mohan',
      heroine: 'Kavitha'
    }
  },
  {
    title: 'Chalaki Chellamma',
    year: 1982,
    movieId: 'b29ee1b0-1588-47ae-a0b5-4155e772ffef',
    actors: {
      hero: 'Karthik',
      heroine: 'Kavitha'
    }
  },
  {
    title: 'Rudra Tandava',
    year: 2015,
    movieId: '6e8cd683-3c1c-4c2f-8736-a53c35e9e2de',
    actors: {
      hero: 'Kishore',
      heroine: 'Radhika Kumaraswamy'
    }
  },
  {
    title: 'Okkadunnadu',
    year: 2007,
    movieId: '612c3546-294d-4b95-94f9-64fec0f04238',
    actors: {
      hero: 'Gopichand',
      supporting: ['Mahesh Manjrekar']
    }
  },
  {
    title: 'Aatagara',
    year: 2015,
    movieId: '110d9fdb-568d-4f26-aeff-60174356eb0f',
    actors: {
      hero: 'Chiranjeevi Sarja'
    },
    specialNotes: 'Update name to Chiranjeevi Sarja to prevent future cross-linking'
  }
];

async function addActorsToMovie(task: ReattributionTask): Promise<boolean> {
  // Fetch current movie data
  const { data: movie, error: fetchError } = await supabase
    .from('movies')
    .select('*')
    .eq('id', task.movieId)
    .single();
  
  if (fetchError || !movie) {
    console.error(chalk.red(`  ❌ Failed to fetch movie ${task.title}:`, fetchError?.message));
    return false;
  }
  
  const updates: any = {};
  
  // Add hero
  if (task.actors.hero) {
    if (movie.hero && movie.hero.trim() !== '') {
      // If hero already exists, don't overwrite (might be correct)
      if (VERBOSE) {
        console.log(chalk.yellow(`    ⚠️  Hero already set: ${movie.hero} (keeping existing)`));
      }
    } else {
      updates.hero = task.actors.hero;
    }
  }
  
  // Add heroine
  if (task.actors.heroine) {
    if (movie.heroine && movie.heroine.trim() !== '') {
      if (VERBOSE) {
        console.log(chalk.yellow(`    ⚠️  Heroine already set: ${movie.heroine} (keeping existing)`));
      }
    } else {
      updates.heroine = task.actors.heroine;
    }
  }
  
  // Add supporting cast
  if (task.actors.supporting && task.actors.supporting.length > 0) {
    const currentSupporting = Array.isArray(movie.supporting_cast) ? movie.supporting_cast : [];
    const existingNames = currentSupporting.map((cast: any) => cast.name?.toLowerCase() || '');
    
    for (const actorName of task.actors.supporting) {
      if (!existingNames.includes(actorName.toLowerCase())) {
        const nextOrder = currentSupporting.length + 1;
        currentSupporting.push({
          name: actorName,
          role: '',
          order: nextOrder,
          type: 'supporting'
        });
      } else if (VERBOSE) {
        console.log(chalk.yellow(`    ⚠️  ${actorName} already in supporting_cast`));
      }
    }
    
    updates.supporting_cast = currentSupporting;
  }
  
  // Handle special notes (e.g., name update for Aatagara)
  if (task.specialNotes && task.specialNotes.includes('Update name')) {
    // This is a note for manual handling - the movie title/name might need updating
    if (VERBOSE) {
      console.log(chalk.cyan(`    ℹ️  Special note: ${task.specialNotes}`));
    }
  }
  
  // Update movie
  if (Object.keys(updates).length === 0) {
    if (VERBOSE) {
      console.log(chalk.gray(`    ⏭️  No updates needed for ${task.title}`));
    }
    return true;
  }
  
  const { error } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', task.movieId);
  
  if (error) {
    console.error(chalk.red(`  ❌ Failed to update "${task.title}":`, error.message));
    return false;
  }
  
  const updateSummary = [];
  if (updates.hero) updateSummary.push(`hero: ${updates.hero}`);
  if (updates.heroine) updateSummary.push(`heroine: ${updates.heroine}`);
  if (updates.supporting_cast) {
    const newSupporting = updates.supporting_cast.filter((cast: any) => 
      task.actors.supporting?.includes(cast.name)
    );
    if (newSupporting.length > 0) {
      updateSummary.push(`supporting: ${newSupporting.map((c: any) => c.name).join(', ')}`);
    }
  }
  
  console.log(chalk.green(`  ✓ Updated: ${task.title} (${updateSummary.join(', ')})`));
  return true;
}

async function main(): Promise<void> {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         ADD CORRECT ACTORS TO REATTRIBUTED FILMS                     ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(chalk.cyan(`Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`));
  console.log(chalk.cyan(`Films to update: ${REATTRIBUTION_TASKS.length}\n`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made\n'));
    console.log(chalk.cyan('Planned updates:'));
    REATTRIBUTION_TASKS.forEach((task, idx) => {
      console.log(chalk.gray(`\n${idx + 1}. ${task.title} (${task.year})`));
      if (task.actors.hero) console.log(chalk.gray(`   → Hero: ${task.actors.hero}`));
      if (task.actors.heroine) console.log(chalk.gray(`   → Heroine: ${task.actors.heroine}`));
      if (task.actors.supporting) {
        console.log(chalk.gray(`   → Supporting: ${task.actors.supporting.join(', ')}`));
      }
      if (task.specialNotes) {
        console.log(chalk.yellow(`   ⚠️  Note: ${task.specialNotes}`));
      }
    });
    console.log(chalk.yellow('\nRun with --execute to apply changes'));
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const task of REATTRIBUTION_TASKS) {
    const success = await addActorsToMovie(task);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log(chalk.cyan.bold(`\n╔══════════════════════════════════════════════════════════════════════╗`));
  console.log(chalk.cyan.bold(`║                        SUMMARY                                        ║`));
  console.log(chalk.cyan.bold(`╚══════════════════════════════════════════════════════════════════════╝`));
  console.log(`  Successfully updated: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log(chalk.green(`\n✅ All reattributions completed successfully!`));
  }
}

main().catch(console.error);
