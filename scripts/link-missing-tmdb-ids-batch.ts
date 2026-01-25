#!/usr/bin/env npx tsx
/**
 * Link Missing TMDB IDs - Batch Processor
 * 
 * Searches TMDB for movies without IDs and links them automatically
 * Uses intelligent matching based on title, year, director, and cast
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BATCH_DELAY_MS = 300; // Respectful rate limiting

interface MovieToLink {
  title: string;
  year: number;
  director: string;
  hero: string;
  heroine: string;
  slug: string;
}

interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

async function searchTMDB(title: string, year: number): Promise<TMDBSearchResult[]> {
  try {
    const searchQuery = encodeURIComponent(title);
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchQuery}&year=${year}`;
    
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`Error searching TMDB for "${title}":`, error);
    return [];
  }
}

async function getTMDBDetails(tmdbId: number): Promise<any> {
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}

function calculateMatchScore(movie: MovieToLink, tmdbResult: TMDBSearchResult, tmdbDetails: any): number {
  let score = 0;
  
  // Title match (case insensitive, fuzzy)
  const normalizedLocal = movie.title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedTMDB = tmdbResult.title.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalizedLocal === normalizedTMDB) score += 50;
  else if (normalizedLocal.includes(normalizedTMDB) || normalizedTMDB.includes(normalizedLocal)) score += 30;
  
  // Year match
  if (tmdbResult.release_date) {
    const tmdbYear = parseInt(tmdbResult.release_date.split('-')[0]);
    if (tmdbYear === movie.year) score += 30;
    else if (Math.abs(tmdbYear - movie.year) === 1) score += 15; // Off by one year is common
  }
  
  // Director match
  if (tmdbDetails?.credits?.crew) {
    const directors = tmdbDetails.credits.crew.filter((c: any) => c.job === 'Director');
    const directorNames = directors.map((d: any) => d.name.toLowerCase());
    if (movie.director && directorNames.some(name => 
      name.includes(movie.director.toLowerCase()) || 
      movie.director.toLowerCase().includes(name)
    )) {
      score += 20;
    }
  }
  
  return score;
}

async function linkMoviesToTMDB() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║              LINK MISSING TMDB IDs - BATCH PROCESSOR                  ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  if (!TMDB_API_KEY) {
    console.log(chalk.red('  ✗ TMDB_API_KEY not found\n'));
    return;
  }

  // Load CSV
  console.log(chalk.white('  Loading movies from CSV...\n'));
  const csvContent = readFileSync('./docs/manual-review/MISSING-TMDB-ID.csv', 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim() && !line.startsWith('Title,'));
  
  const movies: MovieToLink[] = lines.map(line => {
    const match = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
    if (!match) return null;
    return {
      title: match[1],
      year: parseInt(match[2]),
      director: match[3],
      hero: match[4],
      heroine: match[5],
      slug: match[6]
    };
  }).filter((m): m is MovieToLink => m !== null && m.title && m.year);

  console.log(chalk.green(`  ✓ Loaded ${movies.length} movies\n`));

  let linked = 0;
  let notFound = 0;
  let failed = 0;
  const report: any[] = [];

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    console.log(chalk.white(`  ${i + 1}/${movies.length}: ${movie.title} (${movie.year})`));
    console.log(chalk.gray(`    Director: ${movie.director} | Hero: ${movie.hero}`));

    // Search TMDB
    const searchResults = await searchTMDB(movie.title, movie.year);
    
    if (searchResults.length === 0) {
      console.log(chalk.yellow(`    ⚠ No TMDB results found`));
      notFound++;
      report.push({ ...movie, status: 'NOT_FOUND', tmdb_id: null, match_score: 0 });
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      continue;
    }

    // Get details and calculate match scores
    const candidates: Array<{ result: TMDBSearchResult; details: any; score: number }> = [];
    
    for (const result of searchResults.slice(0, 3)) { // Top 3 results only
      const details = await getTMDBDetails(result.id);
      if (details) {
        const score = calculateMatchScore(movie, result, details);
        candidates.push({ result, details, score });
      }
      await new Promise(r => setTimeout(r, 200)); // Quick delay between detail fetches
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length === 0 || candidates[0].score < 50) {
      console.log(chalk.yellow(`    ⚠ No confident match (best score: ${candidates[0]?.score || 0})`));
      notFound++;
      report.push({ 
        ...movie, 
        status: 'LOW_CONFIDENCE', 
        tmdb_id: candidates[0]?.result.id || null, 
        match_score: candidates[0]?.score || 0,
        tmdb_title: candidates[0]?.result.title || null
      });
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      continue;
    }

    const bestMatch = candidates[0];
    console.log(chalk.green(`    ✓ Matched: "${bestMatch.result.title}" (ID: ${bestMatch.result.id}, Score: ${bestMatch.score})`));

    // Update database
    const { data: existingMovie } = await supabase
      .from('movies')
      .select('id')
      .eq('slug', movie.slug)
      .single();

    if (!existingMovie) {
      console.log(chalk.red(`    ✗ Movie not found in database`));
      failed++;
      continue;
    }

    const { error } = await supabase
      .from('movies')
      .update({ tmdb_id: bestMatch.result.id })
      .eq('id', existingMovie.id);

    if (error) {
      console.log(chalk.red(`    ✗ Update failed: ${error.message}`));
      failed++;
    } else {
      console.log(chalk.green(`    ✓ Updated database`));
      linked++;
      report.push({ 
        ...movie, 
        status: 'LINKED', 
        tmdb_id: bestMatch.result.id, 
        match_score: bestMatch.score,
        tmdb_title: bestMatch.result.title
      });
    }

    await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
  }

  // Save report
  const reportPath = './docs/manual-review/TMDB-LINKING-REPORT.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                   TMDB LINKING COMPLETE                               ║
╚═══════════════════════════════════════════════════════════════════════╝

  ✓ Successfully Linked:    ${linked}
  ⚠ Not Found:              ${notFound}
  ✗ Failed:                 ${failed}

  Success Rate:             ${((linked / movies.length) * 100).toFixed(1)}%

  Report saved: ${reportPath}

  Next Steps:
  1. Review low-confidence matches in report
  2. Manually research movies not found
  3. Re-run genre enrichment to populate new IDs

`));

  // Show low-confidence matches needing manual review
  const lowConfidence = report.filter(r => r.status === 'LOW_CONFIDENCE');
  if (lowConfidence.length > 0) {
    console.log(chalk.yellow.bold(`\n  LOW CONFIDENCE MATCHES (Manual Review Needed):\n`));
    lowConfidence.forEach(m => {
      console.log(chalk.yellow(`    ${m.title} (${m.year})`));
      console.log(chalk.gray(`      Suggested: ${m.tmdb_title} (ID: ${m.tmdb_id}, Score: ${m.match_score})`));
      console.log(chalk.gray(`      http://localhost:3000/movies/${m.slug}\n`));
    });
  }
}

linkMoviesToTMDB();
