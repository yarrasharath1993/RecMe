#!/usr/bin/env npx tsx
/**
 * MUSIC DIRECTOR ENRICHMENT
 * 
 * Fetches music director information from Wikipedia for movies missing this data.
 * Uses Telugu Wikipedia first, then English Wikipedia as fallback.
 * 
 * Usage:
 *   npx tsx scripts/enrich-music-directors.ts --dry-run
 *   npx tsx scripts/enrich-music-directors.ts --execute
 *   npx tsx scripts/enrich-music-directors.ts --execute --limit=500
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CLI Args
const args = process.argv.slice(2);
const EXECUTE = args.includes('--execute');
const DRY_RUN = !EXECUTE;
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '1000');
const VERBOSE = args.includes('--verbose') || args.includes('-v');

// Wikipedia APIs
const TE_WIKI_API = 'https://te.wikipedia.org/w/api.php';
const EN_WIKI_API = 'https://en.wikipedia.org/w/api.php';

// Known music director mappings by era/director collaboration
const KNOWN_COLLABORATIONS: Record<string, Record<string, string>> = {
  // Director -> Music Director common pairings
  'Bapu': { default: 'K. V. Mahadevan' },
  'K. Viswanath': { default: 'K. V. Mahadevan', '1990s': 'M. M. Keeravani' },
  'K. Raghavendra Rao': { default: 'K. V. Mahadevan', '1980s': 'Chakravarthy', '1990s': 'M. M. Keeravani', '2000s': 'M. M. Keeravani' },
  'Singeetam Srinivasa Rao': { default: 'Ilaiyaraaja' },
  'Mani Ratnam': { default: 'Ilaiyaraaja', '1990s': 'A. R. Rahman', '2000s': 'A. R. Rahman' },
  'S. S. Rajamouli': { default: 'M. M. Keeravani' },
  'Trivikram Srinivas': { default: 'Devi Sri Prasad', '2020s': 'S. Thaman' },
  'Sukumar': { default: 'Devi Sri Prasad' },
  'Koratala Siva': { default: 'Devi Sri Prasad' },
  'Boyapati Srinu': { default: 'S. Thaman' },
  'Harish Shankar': { default: 'Devi Sri Prasad' },
  'Anil Ravipudi': { default: 'S. Thaman', '2020s': 'Devi Sri Prasad' },
};

// Era-based common composers
const ERA_COMPOSERS: Record<string, string[]> = {
  '1940s': ['Ghantasala', 'Saluri Rajeswara Rao'],
  '1950s': ['Ghantasala', 'Pendyala Nageswara Rao', 'T. Chalapathi Rao', 'S. Rajeswara Rao'],
  '1960s': ['Ghantasala', 'T. V. Raju', 'Pendyala Nageswara Rao', 'K. V. Mahadevan', 'T. Chalapathi Rao'],
  '1970s': ['K. V. Mahadevan', 'Chakravarthy', 'Satyam', 'J. V. Raghavulu', 'Sathyam'],
  '1980s': ['Chakravarthy', 'K. V. Mahadevan', 'Ramesh Naidu', 'Ilaiyaraaja', 'J. V. Raghavulu'],
  '1990s': ['Koti', 'M. M. Keeravani', 'Raj-Koti', 'Vandemataram Srinivas', 'S. A. Rajkumar'],
  '2000s': ['M. M. Keeravani', 'Devi Sri Prasad', 'Mani Sharma', 'R. P. Patnaik', 'Chakri'],
  '2010s': ['Devi Sri Prasad', 'S. Thaman', 'Mickey J Meyer', 'Anup Rubens', 'Gopi Sundar'],
  '2020s': ['S. Thaman', 'Devi Sri Prasad', 'Anirudh Ravichander', 'Sai Abhyankkar', 'Rockstar DSP'],
};

// Stats
let stats = {
  processed: 0,
  updated: 0,
  fromWiki: 0,
  fromCollaboration: 0,
  notFound: 0,
  errors: 0,
};

// ============================================================
// WIKIPEDIA FUNCTIONS
// ============================================================

async function fetchMusicDirectorFromTeluguWiki(title: string, year: number): Promise<string | null> {
  try {
    const searchPatterns = [
      `${title} (${year} సినిమా)`,
      `${title} సినిమా`,
      title,
    ];
    
    for (const pattern of searchPatterns) {
      const searchUrl = `${TE_WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(pattern)}&srlimit=3&format=json&origin=*`;
      
      const searchResp = await fetch(searchUrl, {
        headers: { 'User-Agent': 'TeluguPortal/1.0' }
      });
      
      if (!searchResp.ok) continue;
      const searchData = await searchResp.json();
      const results = searchData?.query?.search || [];
      
      for (const result of results) {
        // Check if it's a film article
        if (result.snippet?.includes('సినిమా') || result.snippet?.includes('చిత్రం')) {
          // Get the full page content
          const contentUrl = `${TE_WIKI_API}?action=query&titles=${encodeURIComponent(result.title)}&prop=revisions&rvprop=content&format=json&origin=*`;
          
          const contentResp = await fetch(contentUrl, {
            headers: { 'User-Agent': 'TeluguPortal/1.0' }
          });
          
          if (!contentResp.ok) continue;
          const contentData = await contentResp.json();
          const pages = contentData?.query?.pages;
          if (!pages) continue;
          
          const page = Object.values(pages)[0] as any;
          const content = page?.revisions?.[0]?.['*'] || '';
          
          // Extract music director from infobox
          // సంగీతం = Music in Telugu
          const musicPatterns = [
            /సంగీతం\s*=\s*\[\[([^\]|]+)/i,
            /సంగీతం\s*=\s*([^\n|]+)/i,
            /music\s*=\s*\[\[([^\]|]+)/i,
            /music_director\s*=\s*\[\[([^\]|]+)/i,
            /music\s*=\s*([^\n|<]+)/i,
          ];
          
          for (const pattern of musicPatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
              const musicDirector = match[1].replace(/\[\[|\]\]/g, '').trim();
              if (musicDirector && musicDirector.length > 2 && !musicDirector.includes('|')) {
                return musicDirector;
              }
            }
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 150));
    }
  } catch (e) {
    // Silent fail
  }
  
  return null;
}

async function fetchMusicDirectorFromEnglishWiki(title: string, year: number): Promise<string | null> {
  try {
    const searchPatterns = [
      `${title} ${year} Telugu film`,
      `${title} ${year} film`,
      `${title} Telugu film`,
    ];
    
    for (const pattern of searchPatterns) {
      const searchUrl = `${EN_WIKI_API}?action=query&list=search&srsearch=${encodeURIComponent(pattern)}&srlimit=3&format=json&origin=*`;
      
      const searchResp = await fetch(searchUrl);
      if (!searchResp.ok) continue;
      
      const searchData = await searchResp.json();
      const results = searchData?.query?.search || [];
      
      for (const result of results) {
        if (result.snippet?.toLowerCase().includes('film')) {
          // Get the full page content
          const contentUrl = `${EN_WIKI_API}?action=query&titles=${encodeURIComponent(result.title)}&prop=revisions&rvprop=content&format=json&origin=*`;
          
          const contentResp = await fetch(contentUrl);
          if (!contentResp.ok) continue;
          
          const contentData = await contentResp.json();
          const pages = contentData?.query?.pages;
          if (!pages) continue;
          
          const page = Object.values(pages)[0] as any;
          const content = page?.revisions?.[0]?.['*'] || '';
          
          // Extract music director from infobox
          const musicPatterns = [
            /\|\s*music\s*=\s*\[\[([^\]|]+)/i,
            /\|\s*music_director\s*=\s*\[\[([^\]|]+)/i,
            /\|\s*score\s*=\s*\[\[([^\]|]+)/i,
            /\|\s*music\s*=\s*([^\n|<\[]+)/i,
          ];
          
          for (const pattern of musicPatterns) {
            const match = content.match(pattern);
            if (match && match[1]) {
              const musicDirector = match[1].trim();
              if (musicDirector && musicDirector.length > 2 && !musicDirector.includes('{{')) {
                return musicDirector;
              }
            }
          }
        }
      }
      
      await new Promise(r => setTimeout(r, 150));
    }
  } catch (e) {
    // Silent fail
  }
  
  return null;
}

function getMusicDirectorFromCollaboration(director: string | null, year: number): string | null {
  if (!director) return null;
  
  // Check known collaborations
  for (const [knownDirector, composers] of Object.entries(KNOWN_COLLABORATIONS)) {
    if (director.includes(knownDirector)) {
      const decade = `${Math.floor(year / 10) * 10}s`;
      return composers[decade] || composers.default;
    }
  }
  
  return null;
}

function getEraComposer(year: number): string | null {
  const decade = `${Math.floor(year / 10) * 10}s`;
  const composers = ERA_COMPOSERS[decade];
  if (composers && composers.length > 0) {
    // Return the most common composer for the era
    return composers[0];
  }
  return null;
}

// ============================================================
// MAIN PROCESSING
// ============================================================

async function enrichMusicDirectors() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║           MUSIC DIRECTOR ENRICHMENT                          ║
╚══════════════════════════════════════════════════════════════╝
`));

  console.log(`Mode: ${DRY_RUN ? chalk.yellow('DRY RUN') : chalk.green('EXECUTE')}`);
  console.log(`Limit: ${LIMIT}`);
  console.log(`Verbose: ${VERBOSE}\n`);

  // Fetch movies without music director, prioritized by rating
  console.log(chalk.cyan('📋 Fetching movies without music director...'));
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, director, hero, our_rating')
    .is('music_director', null)
    .eq('is_published', true)
    .not('our_rating', 'is', null)
    .order('our_rating', { ascending: false, nullsFirst: false })
    .limit(LIMIT);

  if (error || !movies) {
    console.error(chalk.red('Error fetching movies:'), error?.message);
    return;
  }

  console.log(chalk.green(`  Found ${movies.length} movies without music director\n`));

  // Process each movie
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    stats.processed++;
    
    if (VERBOSE) {
      console.log(chalk.cyan(`[${i + 1}/${movies.length}] ${movie.title_en} (${movie.release_year})`));
    }

    let musicDirector: string | null = null;
    let source = '';

    // Strategy 1: Try Telugu Wikipedia
    musicDirector = await fetchMusicDirectorFromTeluguWiki(movie.title_en, movie.release_year);
    if (musicDirector) {
      source = 'te-wiki';
      stats.fromWiki++;
    }

    // Strategy 2: Try English Wikipedia
    if (!musicDirector) {
      musicDirector = await fetchMusicDirectorFromEnglishWiki(movie.title_en, movie.release_year);
      if (musicDirector) {
        source = 'en-wiki';
        stats.fromWiki++;
      }
    }

    // Strategy 3: Check known director collaborations
    if (!musicDirector) {
      musicDirector = getMusicDirectorFromCollaboration(movie.director, movie.release_year);
      if (musicDirector) {
        source = 'collaboration';
        stats.fromCollaboration++;
      }
    }

    // If found, update the database
    if (musicDirector) {
      if (VERBOSE) {
        console.log(chalk.green(`  → Found: ${musicDirector} (${source})`));
      }

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({ music_director: musicDirector })
          .eq('id', movie.id);

        if (updateError) {
          stats.errors++;
          if (VERBOSE) console.log(chalk.red(`  → Error: ${updateError.message}`));
        } else {
          stats.updated++;
        }
      } else {
        stats.updated++;
      }
    } else {
      stats.notFound++;
      if (VERBOSE) {
        console.log(chalk.gray(`  → Not found`));
      }
    }

    // Progress indicator
    if (!VERBOSE && i > 0 && i % 50 === 0) {
      console.log(`  Progress: ${i}/${movies.length} (${stats.updated} updated)`);
    }

    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }

  // Summary
  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 MUSIC DIRECTOR ENRICHMENT SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════\n'));

  console.log(`  Movies processed:      ${stats.processed}`);
  console.log(`  Music directors found: ${chalk.green(stats.updated)}`);
  console.log(`    From Wikipedia:      ${stats.fromWiki}`);
  console.log(`    From collaborations: ${stats.fromCollaboration}`);
  console.log(`  Not found:             ${chalk.yellow(stats.notFound)}`);
  console.log(`  Errors:                ${chalk.red(stats.errors)}`);

  if (DRY_RUN) {
    console.log(chalk.yellow('\n💡 This was a DRY RUN. Use --execute to apply changes.\n'));
  } else {
    console.log(chalk.green('\n✅ Music director enrichment complete!\n'));
  }
}

enrichMusicDirectors().catch(console.error);
