#!/usr/bin/env npx tsx
/**
 * Fix Nandamuri Balakrishna Filmography
 * 
 * This script:
 * 1. Adds 18 missing films identified from TMDB
 * 2. Fixes ghost entries with wrong TMDB IDs (Lion 2015, Legend 2014)
 * 3. Publishes the 6 unpublished Balakrishna films
 * 
 * Usage:
 *   npx tsx scripts/fix-balakrishna-filmography.ts --dry-run    # Preview changes
 *   npx tsx scripts/fix-balakrishna-filmography.ts --execute    # Apply changes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

// ============================================================
// MISSING FILMS (from TMDB validation)
// ============================================================

interface MissingFilm {
  tmdbId: number;
  title: string;
  year: number;
  character: string;
  isChildRole?: boolean;
  isSupportingRole?: boolean;
}

const MISSING_FILMS: MissingFilm[] = [
  // Early/Child Artist Roles
  { tmdbId: 1265526, title: 'Thathamma Kala', year: 1974, character: 'Balakrishna', isChildRole: true },
  { tmdbId: 1081201, title: 'Akbar Saleem Anarkali', year: 1978, character: 'Saleem', isChildRole: true },
  { tmdbId: 988196, title: 'Kaliyuga Sthree', year: 1978, character: '', isChildRole: true },
  { tmdbId: 322393, title: 'Sri Tirupati Venkateswara Kalyanam', year: 1979, character: 'Narada Maharshi', isSupportingRole: true },
  { tmdbId: 1094501, title: 'Srimadhvirata Parvamu', year: 1979, character: 'Abhimanyudu', isChildRole: true },
  { tmdbId: 1093915, title: 'Rowdy Ramudu Konte Krishnudu', year: 1980, character: 'Balakrishna' },
  
  // 1980s Films
  { tmdbId: 1093968, title: 'Simham Navvindi!', year: 1983, character: 'Balakrishna' },
  { tmdbId: 697410, title: 'Kathanayakudu', year: 1984, character: 'Ravi' },
  { tmdbId: 706757, title: 'Srimadvirat Veerabrahmendra Swami Charitra', year: 1984, character: 'Sayyad / Siddayya', isSupportingRole: true },
  { tmdbId: 695925, title: 'Bharyabhartala Bandham', year: 1985, character: 'Radha' },
  { tmdbId: 1093415, title: 'Pattabhishekham', year: 1985, character: 'Balu' },
  
  // 1990s Films
  { tmdbId: 724073, title: 'Brahmarshi Vishwamitra', year: 1991, character: 'Satya Harichandra / Dushyanta' },
  { tmdbId: 308083, title: 'Muddula Mogudu', year: 1997, character: '' },
  { tmdbId: 280342, title: 'Sultan', year: 1999, character: 'Sultan / Prudhvi' },
  
  // 2000s Films
  { tmdbId: 280332, title: 'Bhalevadivi Basu', year: 2001, character: '' },
  { tmdbId: 280330, title: 'Seema Simham', year: 2002, character: '' },
  { tmdbId: 280326, title: 'Allari Pidugu', year: 2005, character: 'Ranjith' },
  
  // 2010s Films
  { tmdbId: 250649, title: 'Uu Kodathara Ulikki Padathara', year: 2012, character: 'Rudramaneni Narasimha Rayudu' },
];

// ============================================================
// GHOST ENTRIES (Wrong TMDB IDs)
// These have TMDB IDs pointing to non-Telugu movies
// ============================================================

interface GhostEntry {
  slug: string;
  wrongTmdbId: number;
  correctTmdbId: number | null;  // null means no TMDB entry exists
  actualTitle: string;
}

const GHOST_ENTRIES: GhostEntry[] = [
  { 
    slug: 'lion-2015', 
    wrongTmdbId: 335897,  // Points to "Lion" (2016) - Dev Patel movie
    correctTmdbId: 332648, // Telugu Lion 2015
    actualTitle: 'Lion'
  },
  { 
    slug: 'legend-2014', 
    wrongTmdbId: 42265,   // Points to "Legends of the Fall" (1994) - Brad Pitt
    correctTmdbId: 289931, // Telugu Legend 2014
    actualTitle: 'Legend'
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function fetchTMDB(endpoint: string): Promise<any> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }
  
  try {
    const url = `${TMDB_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${TMDB_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function generateSlug(title: string, year: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}-${year}`;
}

async function getMovieDetails(tmdbId: number): Promise<any> {
  const movie = await fetchTMDB(`/movie/${tmdbId}?append_to_response=credits`);
  return movie;
}

// ============================================================
// ADD MISSING FILMS
// ============================================================

async function addMissingFilms(execute: boolean): Promise<number> {
  console.log(chalk.cyan.bold('\n📥 ADDING MISSING FILMS'));
  console.log(chalk.gray('─'.repeat(60)));
  
  let added = 0;
  
  for (const film of MISSING_FILMS) {
    const slug = generateSlug(film.title, film.year);
    
    // Check if already exists
    const { data: existing } = await supabase
      .from('movies')
      .select('id, title_en')
      .eq('slug', slug)
      .single();
    
    if (existing) {
      console.log(chalk.gray(`   ⏭  ${film.title} (${film.year}) - already exists`));
      continue;
    }
    
    // Check by tmdb_id
    const { data: existingByTmdb } = await supabase
      .from('movies')
      .select('id, title_en, slug')
      .eq('tmdb_id', film.tmdbId)
      .single();
    
    if (existingByTmdb) {
      console.log(chalk.gray(`   ⏭  ${film.title} (${film.year}) - TMDB ID exists at ${existingByTmdb.slug}`));
      continue;
    }
    
    // Fetch additional details from TMDB
    const tmdbDetails = await getMovieDetails(film.tmdbId);
    
    const movieData: Record<string, any> = {
      title_en: film.title,
      title_te: tmdbDetails?.original_title || null,
      slug,
      release_year: film.year,
      language: 'Telugu',
      tmdb_id: film.tmdbId,
      is_published: false,  // Start unpublished, needs review
      content_type: 'speculative',
    };
    
    // Set hero or supporting cast based on role type
    if (film.isChildRole) {
      movieData.supporting_cast = ['Nandamuri Balakrishna'];
      movieData.notes = 'Child artist role';
    } else if (film.isSupportingRole) {
      movieData.supporting_cast = ['Nandamuri Balakrishna'];
      movieData.notes = 'Supporting role';
    } else {
      movieData.hero = 'Nandamuri Balakrishna';
    }
    
    // Add TMDB data if available
    if (tmdbDetails) {
      movieData.synopsis = tmdbDetails.overview || null;
      movieData.poster_url = tmdbDetails.poster_path 
        ? `https://image.tmdb.org/t/p/w500${tmdbDetails.poster_path}` 
        : null;
      movieData.backdrop_url = tmdbDetails.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${tmdbDetails.backdrop_path}`
        : null;
      
      // Get director from credits
      if (tmdbDetails.credits?.crew) {
        const director = tmdbDetails.credits.crew.find((c: any) => c.job === 'Director');
        if (director) {
          movieData.director = director.name;
        }
      }
    }
    
    if (execute) {
      const { error } = await supabase.from('movies').insert(movieData);
      
      if (error) {
        console.log(chalk.red(`   ✗ Failed to add ${film.title}: ${error.message}`));
      } else {
        console.log(chalk.green(`   ✓ Added ${film.title} (${film.year})`));
        added++;
      }
    } else {
      console.log(chalk.yellow(`   → Would add: ${film.title} (${film.year}) [${film.isChildRole ? 'child role' : film.isSupportingRole ? 'supporting' : 'lead'}]`));
      added++;
    }
    
    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }
  
  return added;
}

// ============================================================
// FIX GHOST ENTRIES
// ============================================================

async function fixGhostEntries(execute: boolean): Promise<number> {
  console.log(chalk.cyan.bold('\n🔧 FIXING GHOST ENTRIES (Wrong TMDB IDs)'));
  console.log(chalk.gray('─'.repeat(60)));
  
  let fixed = 0;
  
  for (const ghost of GHOST_ENTRIES) {
    // Find the movie
    const { data: movie } = await supabase
      .from('movies')
      .select('id, title_en, tmdb_id')
      .eq('slug', ghost.slug)
      .single();
    
    if (!movie) {
      console.log(chalk.gray(`   ⏭  ${ghost.slug} - not found in database`));
      continue;
    }
    
    if (movie.tmdb_id !== ghost.wrongTmdbId && movie.tmdb_id === ghost.correctTmdbId) {
      console.log(chalk.gray(`   ⏭  ${ghost.actualTitle} - already has correct TMDB ID`));
      continue;
    }
    
    if (execute) {
      const updateData: Record<string, any> = {};
      
      if (ghost.correctTmdbId) {
        updateData.tmdb_id = ghost.correctTmdbId;
        
        // Fetch new poster from correct TMDB ID
        const tmdbDetails = await getMovieDetails(ghost.correctTmdbId);
        if (tmdbDetails?.poster_path) {
          updateData.poster_url = `https://image.tmdb.org/t/p/w500${tmdbDetails.poster_path}`;
        }
        if (tmdbDetails?.backdrop_path) {
          updateData.backdrop_url = `https://image.tmdb.org/t/p/w1280${tmdbDetails.backdrop_path}`;
        }
      } else {
        updateData.tmdb_id = null;  // Clear invalid TMDB ID
      }
      
      const { error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movie.id);
      
      if (error) {
        console.log(chalk.red(`   ✗ Failed to fix ${ghost.actualTitle}: ${error.message}`));
      } else {
        console.log(chalk.green(`   ✓ Fixed ${ghost.actualTitle}: ${ghost.wrongTmdbId} → ${ghost.correctTmdbId || 'null'}`));
        fixed++;
      }
    } else {
      console.log(chalk.yellow(`   → Would fix: ${ghost.actualTitle} - ${ghost.wrongTmdbId} → ${ghost.correctTmdbId || 'null'}`));
      fixed++;
    }
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  return fixed;
}

// ============================================================
// PUBLISH UNPUBLISHED FILMS
// ============================================================

async function publishUnpublishedFilms(execute: boolean): Promise<number> {
  console.log(chalk.cyan.bold('\n📢 PUBLISHING UNPUBLISHED FILMS'));
  console.log(chalk.gray('─'.repeat(60)));
  
  // Get all unpublished Balakrishna films
  const { data: unpublished, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, is_published, poster_url')
    .ilike('hero', '%Nandamuri Balakrishna%')
    .eq('is_published', false);
  
  if (error) {
    console.log(chalk.red(`   ✗ Failed to fetch unpublished films: ${error.message}`));
    return 0;
  }
  
  if (!unpublished || unpublished.length === 0) {
    console.log(chalk.gray('   No unpublished films found'));
    return 0;
  }
  
  console.log(chalk.gray(`   Found ${unpublished.length} unpublished films`));
  
  let published = 0;
  
  for (const movie of unpublished) {
    // Only publish if we have minimum required data
    const hasMinimumData = movie.poster_url && !movie.poster_url.includes('placeholder');
    
    if (!hasMinimumData) {
      console.log(chalk.gray(`   ⏭  ${movie.title_en} (${movie.release_year}) - needs poster`));
      continue;
    }
    
    if (execute) {
      const { error: updateError } = await supabase
        .from('movies')
        .update({ is_published: true })
        .eq('id', movie.id);
      
      if (updateError) {
        console.log(chalk.red(`   ✗ Failed to publish ${movie.title_en}: ${updateError.message}`));
      } else {
        console.log(chalk.green(`   ✓ Published ${movie.title_en} (${movie.release_year})`));
        published++;
      }
    } else {
      console.log(chalk.yellow(`   → Would publish: ${movie.title_en} (${movie.release_year})`));
      published++;
    }
  }
  
  return published;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const dryRun = args.includes('--dry-run') || !execute;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║        FIX NANDAMURI BALAKRISHNA FILMOGRAPHY                         ║
╚══════════════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${execute ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
  
  // Get current stats
  const { count: totalCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Nandamuri Balakrishna%');
  
  const { count: publishedCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .ilike('hero', '%Nandamuri Balakrishna%')
    .eq('is_published', true);
  
  console.log(chalk.gray(`\n  Current stats:`));
  console.log(chalk.gray(`    Total films: ${totalCount}`));
  console.log(chalk.gray(`    Published: ${publishedCount}`));
  console.log(chalk.gray(`    Unpublished: ${(totalCount || 0) - (publishedCount || 0)}`));
  
  // Add missing films
  const added = await addMissingFilms(execute);
  
  // Fix ghost entries
  const fixed = await fixGhostEntries(execute);
  
  // Publish unpublished films
  const published = await publishUnpublishedFilms(execute);
  
  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════════════'));
  console.log(chalk.cyan.bold('📊 SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════════════\n'));
  
  console.log(`  ${execute ? 'Applied' : 'Would apply'} changes:`);
  console.log(`    Films added: ${chalk.green(added)}`);
  console.log(`    Ghost entries fixed: ${chalk.yellow(fixed)}`);
  console.log(`    Films published: ${chalk.blue(published)}`);
  
  if (!execute) {
    console.log(chalk.yellow('\n  💡 Run with --execute to apply these changes'));
  } else {
    // Get new stats
    const { count: newTotal } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .ilike('hero', '%Nandamuri Balakrishna%');
    
    const { count: newPublished } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .ilike('hero', '%Nandamuri Balakrishna%')
      .eq('is_published', true);
    
    console.log(chalk.green(`\n  New stats:`));
    console.log(chalk.green(`    Total films: ${newTotal}`));
    console.log(chalk.green(`    Published: ${newPublished}`));
  }
}

main().catch(console.error);
