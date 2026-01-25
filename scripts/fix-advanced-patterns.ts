#!/usr/bin/env npx tsx
/**
 * Fix Advanced Pattern Issues
 * 
 * Fixes issues detected by detect-advanced-patterns.ts:
 * 1. Wrong hero attribution (swap hero/heroine if needed)
 * 2. Hero/heroine same (fetch correct from TMDB)
 * 3. Placeholder content (delete or mark for review)
 * 4. Incomplete data (enrich from TMDB)
 * 5. Potential duplicates (mark for review)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface Issue {
  id: string;
  slug: string;
  title: string;
  issue_type: string;
  details: any;
  confidence: string;
}

async function searchTMDB(title: string, year: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
    year: year?.toString() || '',
  });

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.results?.[0] || null;
}

async function getTMDBDetails(tmdbId: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    append_to_response: 'credits',
  });

  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?${params}`);
  if (!response.ok) return null;
  
  return response.json();
}

async function fixWrongHeroGender(issue: Issue, execute: boolean) {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', issue.id)
    .single();
  
  if (!movie) return { success: false, reason: 'not_found' };
  
  // If hero is female and heroine is male/null, swap them
  const updates: any = {};
  
  if (movie.hero && !movie.heroine) {
    // Move hero to heroine, fetch correct hero from TMDB
    updates.heroine = movie.hero;
    
    let tmdbId = movie.tmdb_id;
    if (!tmdbId) {
      const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
      if (tmdbMovie) tmdbId = tmdbMovie.id;
    }
    
    if (tmdbId) {
      const details = await getTMDBDetails(tmdbId);
      if (details?.credits?.cast) {
        const maleLeads = details.credits.cast
          .filter((c: any) => c.gender === 2)
          .sort((a: any, b: any) => a.order - b.order);
        
        if (maleLeads.length > 0) {
          updates.hero = maleLeads[0].name;
        }
      }
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return { success: false, reason: 'no_fix_available' };
  }
  
  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', issue.id);
    
    if (error) {
      return { success: false, reason: 'update_failed', error: error.message };
    }
  }
  
  return { success: true, updates, dryRun: !execute };
}

async function fixHeroHeroineSame(issue: Issue, execute: boolean) {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', issue.id)
    .single();
  
  if (!movie) return { success: false, reason: 'not_found' };
  
  let tmdbId = movie.tmdb_id;
  if (!tmdbId) {
    const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
    if (tmdbMovie) tmdbId = tmdbMovie.id;
  }
  
  if (!tmdbId) {
    return { success: false, reason: 'no_tmdb_id' };
  }
  
  const details = await getTMDBDetails(tmdbId);
  if (!details?.credits?.cast) {
    return { success: false, reason: 'no_cast_data' };
  }
  
  const cast = details.credits.cast;
  const maleLeads = cast.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order);
  const femaleLeads = cast.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order);
  
  const updates: any = {};
  
  if (maleLeads.length > 0) {
    updates.hero = maleLeads[0].name;
  }
  
  if (femaleLeads.length > 0) {
    updates.heroine = femaleLeads[0].name;
  }
  
  if (Object.keys(updates).length === 0) {
    return { success: false, reason: 'no_leads_found' };
  }
  
  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', issue.id);
    
    if (error) {
      return { success: false, reason: 'update_failed', error: error.message };
    }
  }
  
  return { success: true, updates, dryRun: !execute };
}

async function fixPlaceholderContent(issue: Issue, execute: boolean) {
  // For placeholder content, we'll mark it for review or delete if it's truly invalid
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', issue.id)
    .single();
  
  if (!movie) return { success: false, reason: 'not_found' };
  
  // If movie has very little data, delete it
  const hasMinimumData = movie.director || movie.hero || movie.heroine || movie.release_date;
  
  if (!hasMinimumData && execute) {
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', issue.id);
    
    if (error) {
      return { success: false, reason: 'delete_failed', error: error.message };
    }
    
    return { success: true, action: 'deleted', dryRun: !execute };
  }
  
  // Otherwise, clear the placeholder synopsis
  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update({ synopsis: null, synopsis_te: null })
      .eq('id', issue.id);
    
    if (error) {
      return { success: false, reason: 'update_failed', error: error.message };
    }
  }
  
  return { success: true, action: 'cleared_synopsis', dryRun: !execute };
}

async function fixIncompleteData(issue: Issue, execute: boolean) {
  const { data: movie } = await supabase
    .from('movies')
    .select('*')
    .eq('id', issue.id)
    .single();
  
  if (!movie) return { success: false, reason: 'not_found' };
  
  let tmdbId = movie.tmdb_id;
  if (!tmdbId) {
    const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
    if (tmdbMovie) tmdbId = tmdbMovie.id;
  }
  
  if (!tmdbId) {
    return { success: false, reason: 'no_tmdb_id' };
  }
  
  const details = await getTMDBDetails(tmdbId);
  if (!details) {
    return { success: false, reason: 'tmdb_fetch_failed' };
  }
  
  const updates: any = { tmdb_id: tmdbId };
  const fixed: string[] = [];
  
  if (!movie.director || movie.director === 'Unknown') {
    const director = details.credits?.crew?.find((c: any) => c.job === 'Director');
    if (director) {
      updates.director = director.name;
      fixed.push('director');
    }
  }
  
  if (!movie.hero && details.credits?.cast) {
    const maleLeads = details.credits.cast.filter((c: any) => c.gender === 2);
    if (maleLeads.length > 0) {
      updates.hero = maleLeads[0].name;
      fixed.push('hero');
    }
  }
  
  if (!movie.heroine && details.credits?.cast) {
    const femaleLeads = details.credits.cast.filter((c: any) => c.gender === 1);
    if (femaleLeads.length > 0) {
      updates.heroine = femaleLeads[0].name;
      fixed.push('heroine');
    }
  }
  
  if (!movie.genres || movie.genres.length === 0) {
    if (details.genres && details.genres.length > 0) {
      updates.genres = details.genres.map((g: any) => g.name);
      fixed.push('genres');
    }
  }
  
  if (!movie.synopsis && details.overview) {
    updates.synopsis = details.overview;
    fixed.push('synopsis');
  }
  
  if (!movie.poster_url && details.poster_path) {
    updates.poster_url = `${TMDB_IMAGE_BASE}${details.poster_path}`;
    fixed.push('poster');
  }
  
  if (fixed.length === 0) {
    return { success: false, reason: 'no_fixes_available' };
  }
  
  if (execute) {
    const { error } = await supabase
      .from('movies')
      .update(updates)
      .eq('id', issue.id);
    
    if (error) {
      return { success: false, reason: 'update_failed', error: error.message };
    }
  }
  
  return { success: true, fixed, dryRun: !execute };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const issueType = args.find(a => a.startsWith('--type='))?.split('=')[1];
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '50');

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            FIX ADVANCED PATTERN ISSUES                               ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Issue type: ${issueType || 'ALL'}`);
  console.log(`  Limit: ${limit}\n`);

  // Find latest report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = resolve(process.cwd(), `docs/audit-reports/advanced-patterns-${timestamp}.csv`);
  
  let issues: Issue[] = [];
  
  try {
    const csvContent = readFileSync(reportPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    issues = lines
      .filter(line => line.trim())
      .map(line => {
        const parts = line.match(/"([^"]*)"/g)?.map(p => p.replace(/"/g, '')) || [];
        if (parts.length < 5) return null;
        
        try {
          return {
            slug: parts[0],
            title: parts[1],
            issue_type: parts[2],
            confidence: parts[3],
            details: JSON.parse(parts[4].replace(/'/g, '"')),
            id: '', // Will be fetched
          } as Issue;
        } catch (e) {
          return null;
        }
      })
      .filter((i): i is Issue => i !== null);
    
    console.log(chalk.cyan(`  Loaded ${issues.length} issues from report\n`));
  } catch (error: any) {
    console.log(chalk.red(`  ❌ Could not load report: ${reportPath}`));
    console.log(chalk.yellow(`     Error: ${error.message}\n`));
    console.log(chalk.yellow(`     Run detect-advanced-patterns.ts first\n`));
    return;
  }

  // Filter by type if specified
  if (issueType) {
    issues = issues.filter(i => i.issue_type === issueType);
  }

  // Limit
  issues = issues.slice(0, limit);

  let fixed = 0;
  let failed = 0;

  for (const issue of issues) {
    // Get movie ID
    const { data: movie } = await supabase
      .from('movies')
      .select('id')
      .eq('slug', issue.slug)
      .single();
    
    if (!movie) {
      console.log(chalk.red(`  ❌ ${issue.title}: Movie not found`));
      failed++;
      continue;
    }
    
    issue.id = movie.id;
    
    let result: any;
    
    switch (issue.issue_type) {
      case 'wrong_hero_gender':
        result = await fixWrongHeroGender(issue, execute);
        break;
      case 'hero_heroine_same':
        result = await fixHeroHeroineSame(issue, execute);
        break;
      case 'placeholder_content':
        result = await fixPlaceholderContent(issue, execute);
        break;
      case 'incomplete_data':
        result = await fixIncompleteData(issue, execute);
        break;
      case 'potential_duplicate':
        // Skip duplicates for now (need manual review)
        console.log(chalk.yellow(`  ⊘ ${issue.title}: Duplicate - manual review needed`));
        failed++;
        continue;
      default:
        failed++;
        continue;
    }
    
    if (result.success) {
      console.log(chalk.green(`  ✓ ${issue.title}: Fixed`));
      fixed++;
    } else {
      console.log(chalk.yellow(`  ⊘ ${issue.title}: ${result.reason}`));
      failed++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Total processed: ${issues.length}`);
  console.log(chalk.green(`  Fixed: ${fixed}`));
  console.log(chalk.yellow(`  Failed: ${failed}`));
  console.log(`  Success rate: ${Math.round((fixed / issues.length) * 100)}%`);

  if (!execute) {
    console.log(chalk.yellow(`\n  Run with --execute to apply fixes`));
    console.log(chalk.gray(`  Options:`));
    console.log(chalk.gray(`    --type=<issue_type>  Fix specific issue type only`));
    console.log(chalk.gray(`    --limit=<number>     Limit number of fixes (default: 50)\n`));
  }
}

main().catch(console.error);
