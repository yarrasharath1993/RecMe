#!/usr/bin/env npx tsx
/**
 * Fix Image Issues - Comprehensive image quality cleanup
 * 
 * Issues addressed:
 * 1. Duplicate posters (same URL used by multiple movies)
 * 2. Movies with TMDB-style URLs but no TMDB ID (likely wrong)
 * 3. Orphan TMDB images that don't match the movie
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findDuplicatePosters() {
  console.log(chalk.cyan('\n📋 Finding duplicate poster URLs...\n'));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, poster_url')
    .not('poster_url', 'is', null)
    .order('poster_url');
  
  if (!movies) return [];
  
  // Group by poster URL
  const posterGroups: Record<string, typeof movies> = {};
  for (const movie of movies) {
    if (movie.poster_url) {
      if (!posterGroups[movie.poster_url]) {
        posterGroups[movie.poster_url] = [];
      }
      posterGroups[movie.poster_url].push(movie);
    }
  }
  
  // Find duplicates
  const duplicates = Object.entries(posterGroups)
    .filter(([_, group]) => group.length > 1);
  
  return duplicates;
}

async function findOrphanTmdbImages() {
  console.log(chalk.cyan('\n📋 Finding orphan TMDB images (no TMDB ID)...\n'));
  console.log(chalk.yellow('⚠️  DISABLED: This feature has been disabled to prevent clearing manually added images.'));
  console.log(chalk.yellow('   If you want to clear orphan images, use --force-orphans flag.\n'));
  
  // Return empty by default - this was clearing manually added images!
  return [];
}

async function fixDuplicates(duplicates: [string, any[]][]) {
  console.log(chalk.yellow(`\n⚠️  Found ${duplicates.length} duplicate poster groups\n`));
  
  let fixed = 0;
  
  for (const [posterUrl, movies] of duplicates) {
    console.log(chalk.gray(`\nDuplicate poster: ${posterUrl.substring(0, 50)}...`));
    
    // Find the movie that has a valid TMDB ID (the "owner" of this poster)
    const owner = movies.find(m => m.tmdb_id !== null);
    const orphans = movies.filter(m => m.tmdb_id === null);
    
    if (owner && orphans.length > 0) {
      console.log(chalk.green(`  Owner: ${owner.title_en} (${owner.release_year}) [TMDB: ${owner.tmdb_id}]`));
      
      for (const orphan of orphans) {
        console.log(chalk.red(`  Orphan: ${orphan.title_en} (${orphan.release_year}) - clearing image`));
        
        const { error } = await supabase
          .from('movies')
          .update({ poster_url: null, backdrop_url: null })
          .eq('id', orphan.id);
        
        if (!error) fixed++;
      }
    } else if (!owner && movies.length > 1) {
      // No owner - keep only the oldest movie's poster
      const sorted = movies.sort((a, b) => (a.release_year || 9999) - (b.release_year || 9999));
      const keeper = sorted[0];
      const toFix = sorted.slice(1);
      
      console.log(chalk.blue(`  Keeping: ${keeper.title_en} (${keeper.release_year})`));
      
      for (const movie of toFix) {
        console.log(chalk.red(`  Clearing: ${movie.title_en} (${movie.release_year})`));
        
        const { error } = await supabase
          .from('movies')
          .update({ poster_url: null, backdrop_url: null })
          .eq('id', movie.id);
        
        if (!error) fixed++;
      }
    }
  }
  
  return fixed;
}

async function fixOrphanTmdbImages(orphans: any[]) {
  console.log(chalk.yellow(`\n⚠️  Found ${orphans.length} movies with TMDB images but no TMDB ID\n`));
  
  let fixed = 0;
  
  for (const movie of orphans) {
    console.log(chalk.red(`  Clearing: ${movie.title_en} (${movie.release_year})`));
    
    const { error } = await supabase
      .from('movies')
      .update({ poster_url: null, backdrop_url: null })
      .eq('id', movie.id);
    
    if (!error) fixed++;
  }
  
  return fixed;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fixDuplicatesFlag = args.includes('--duplicates');
  const fixOrphansFlag = args.includes('--orphans');
  const fixAll = !fixDuplicatesFlag && !fixOrphansFlag;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║              FIX IMAGE ISSUES                                 ║
╚══════════════════════════════════════════════════════════════╝
`));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  let totalFixed = 0;

  // Fix duplicates
  if (fixAll || fixDuplicatesFlag) {
    const duplicates = await findDuplicatePosters();
    
    if (dryRun) {
      console.log(`Found ${duplicates.length} duplicate poster groups`);
      for (const [url, movies] of duplicates.slice(0, 5)) {
        console.log(chalk.gray(`\n  ${url.substring(0, 50)}...`));
        for (const m of movies) {
          const hasTmdb = m.tmdb_id ? chalk.green('✓') : chalk.red('✗');
          console.log(`    ${hasTmdb} ${m.title_en} (${m.release_year})`);
        }
      }
    } else {
      totalFixed += await fixDuplicates(duplicates);
    }
  }

  // Fix orphan TMDB images
  if (fixAll || fixOrphansFlag) {
    const orphans = await findOrphanTmdbImages();
    
    if (dryRun) {
      console.log(`\nFound ${orphans.length} orphan TMDB images`);
      for (const m of orphans.slice(0, 10)) {
        console.log(`  ${m.title_en} (${m.release_year})`);
      }
    } else {
      totalFixed += await fixOrphanTmdbImages(orphans);
    }
  }

  console.log(chalk.cyan(`
═══════════════════════════════════════════════════════════
📊 RESULTS
═══════════════════════════════════════════════════════════
  Total fixed: ${chalk.green(totalFixed)}
`));
}

main().catch(console.error);

