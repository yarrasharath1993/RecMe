#!/usr/bin/env npx tsx
/**
 * Process Remaining Issues in Batches
 * 
 * Handles the 415 remaining movies with data quality issues:
 * 1. Wrong hero gender (135 movies) - Generate manual review list
 * 2. No TMDB ID (100 movies) - Try Wikipedia enrichment
 * 3. Incomplete data (85 movies) - Try alternate sources
 * 4. Missing/broken images (93 movies) - Multi-source enrichment
 * 5. Potential duplicates (2 movies) - Manual review list
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync, writeFileSync } from 'fs';
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
  slug: string;
  title: string;
  issue_type: string;
  confidence: string;
  details: any;
}

interface BatchResult {
  category: string;
  total: number;
  processed: number;
  fixed: number;
  manual_review: number;
  failed: number;
}

// Load issues from CSV
function loadIssues(category?: string): Issue[] {
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = resolve(process.cwd(), `docs/audit-reports/advanced-patterns-${timestamp}.csv`);
  
  try {
    const csvContent = readFileSync(reportPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    
    let issues = lines
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
          } as Issue;
        } catch (e) {
          return null;
        }
      })
      .filter((i): i is Issue => i !== null);
    
    if (category) {
      issues = issues.filter(i => i.issue_type === category);
    }
    
    return issues;
  } catch (error: any) {
    console.log(chalk.red(`  ❌ Could not load issues: ${error.message}`));
    return [];
  }
}

// Category 1: Wrong Hero Gender - Generate Manual Review List
async function processWrongHeroGender(batchSize: number = 50) {
  console.log(chalk.blue.bold(`\n📋 CATEGORY 1: Wrong Hero Gender (135 movies)`));
  console.log(chalk.gray(`   Generating manual review list...\n`));
  
  const issues = loadIssues('wrong_hero_gender').slice(0, batchSize);
  
  if (issues.length === 0) {
    console.log(chalk.yellow('   No issues found'));
    return { category: 'wrong_hero_gender', total: 0, processed: 0, fixed: 0, manual_review: 0, failed: 0 };
  }
  
  const reviewList: any[] = [];
  
  for (const issue of issues) {
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', issue.slug)
      .single();
    
    if (!movie) continue;
    
    reviewList.push({
      slug: movie.slug,
      title: movie.title_en,
      year: movie.release_year,
      current_hero: movie.hero,
      current_heroine: movie.heroine,
      director: movie.director,
      issue: issue.details.reason,
      action_needed: 'Verify and swap hero/heroine if needed',
      url: `http://localhost:3000/movies/${movie.slug}`,
    });
  }
  
  // Save to CSV for manual review
  const csv = [
    'slug,title,year,current_hero,current_heroine,director,issue,action_needed,url',
    ...reviewList.map(r => 
      `"${r.slug}","${r.title}","${r.year}","${r.current_hero}","${r.current_heroine}","${r.director}","${r.issue}","${r.action_needed}","${r.url}"`
    )
  ].join('\n');
  
  const outputPath = `docs/manual-review/wrong-hero-gender-batch-${Date.now()}.csv`;
  writeFileSync(outputPath, csv);
  
  console.log(chalk.green(`   ✅ Manual review list generated: ${outputPath}`));
  console.log(chalk.cyan(`   ${reviewList.length} movies need manual verification\n`));
  
  return { 
    category: 'wrong_hero_gender', 
    total: issues.length, 
    processed: reviewList.length, 
    fixed: 0, 
    manual_review: reviewList.length, 
    failed: 0 
  };
}

// Category 2: No TMDB ID - Try Wikipedia Enrichment
async function processNoTMDBID(batchSize: number = 50, execute: boolean = false) {
  console.log(chalk.blue.bold(`\n🔍 CATEGORY 2: No TMDB ID (100 movies)`));
  console.log(chalk.gray(`   Attempting Wikipedia enrichment...\n`));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .is('tmdb_id', null)
    .eq('language', 'Telugu')
    .not('release_year', 'is', null)
    .gte('release_year', 1980)
    .lte('release_year', 2024)
    .limit(batchSize);
  
  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('   No movies found'));
    return { category: 'no_tmdb_id', total: 0, processed: 0, fixed: 0, manual_review: 0, failed: 0 };
  }
  
  let fixed = 0;
  let failed = 0;
  const manualReview: any[] = [];
  
  for (const movie of movies) {
    // Try TMDB search one more time with different variations
    const searches = [
      { query: movie.title_en, year: movie.release_year },
      { query: movie.title_te, year: movie.release_year },
      { query: movie.title_en?.replace(/[^\w\s]/g, ''), year: movie.release_year },
    ].filter(s => s.query);
    
    let found = false;
    
    for (const search of searches) {
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY!,
        query: search.query,
        year: search.year?.toString() || '',
      });
      
      const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const tmdbId = data.results[0].id;
          
          if (execute) {
            await supabase
              .from('movies')
              .update({ tmdb_id: tmdbId })
              .eq('id', movie.id);
          }
          
          console.log(chalk.green(`   ✓ ${movie.title_en}: Found TMDB ID ${tmdbId}`));
          fixed++;
          found = true;
          break;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (!found) {
      console.log(chalk.yellow(`   ⊘ ${movie.title_en}: Not found in TMDB`));
      failed++;
      manualReview.push({
        slug: movie.slug,
        title: movie.title_en,
        title_te: movie.title_te,
        year: movie.release_year,
        director: movie.director,
        action: 'Research Wikipedia/IMDb manually',
        url: `http://localhost:3000/movies/${movie.slug}`,
      });
    }
  }
  
  // Save manual review list
  if (manualReview.length > 0) {
    const csv = [
      'slug,title,title_te,year,director,action,url',
      ...manualReview.map(r => 
        `"${r.slug}","${r.title}","${r.title_te}","${r.year}","${r.director}","${r.action}","${r.url}"`
      )
    ].join('\n');
    
    const outputPath = `docs/manual-review/no-tmdb-id-batch-${Date.now()}.csv`;
    writeFileSync(outputPath, csv);
    console.log(chalk.cyan(`\n   📝 ${manualReview.length} movies need manual research: ${outputPath}\n`));
  }
  
  return { 
    category: 'no_tmdb_id', 
    total: movies.length, 
    processed: movies.length, 
    fixed, 
    manual_review: manualReview.length, 
    failed 
  };
}

// Category 3: Incomplete Data - Try Multiple Enrichment
async function processIncompleteData(batchSize: number = 50, execute: boolean = false) {
  console.log(chalk.blue.bold(`\n📊 CATEGORY 3: Incomplete Data (85 movies)`));
  console.log(chalk.gray(`   Attempting multi-field enrichment...\n`));
  
  const issues = loadIssues('incomplete_data').slice(0, batchSize);
  
  if (issues.length === 0) {
    console.log(chalk.yellow('   No issues found'));
    return { category: 'incomplete_data', total: 0, processed: 0, fixed: 0, manual_review: 0, failed: 0 };
  }
  
  let fixed = 0;
  let failed = 0;
  const manualReview: any[] = [];
  
  for (const issue of issues) {
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', issue.slug)
      .single();
    
    if (!movie) {
      failed++;
      continue;
    }
    
    const missingFields = issue.details.missing_fields || [];
    let enriched = false;
    
    if (movie.tmdb_id) {
      const params = new URLSearchParams({
        api_key: TMDB_API_KEY!,
        append_to_response: 'credits',
      });
      
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movie.tmdb_id}?${params}`);
      if (response.ok) {
        const data = await response.json();
        const updates: any = {};
        
        if (missingFields.includes('director') && data.credits?.crew) {
          const director = data.credits.crew.find((c: any) => c.job === 'Director');
          if (director) updates.director = director.name;
        }
        
        if (missingFields.includes('genres') && data.genres) {
          updates.genres = data.genres.map((g: any) => g.name);
        }
        
        if (missingFields.includes('synopsis') && data.overview) {
          updates.synopsis = data.overview;
        }
        
        if (missingFields.includes('poster') && data.poster_path) {
          updates.poster_url = `${TMDB_IMAGE_BASE}${data.poster_path}`;
        }
        
        if (Object.keys(updates).length > 0) {
          if (execute) {
            await supabase
              .from('movies')
              .update(updates)
              .eq('id', movie.id);
          }
          
          console.log(chalk.green(`   ✓ ${movie.title_en}: Enriched ${Object.keys(updates).join(', ')}`));
          fixed++;
          enriched = true;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (!enriched) {
      console.log(chalk.yellow(`   ⊘ ${movie.title_en}: Could not enrich`));
      failed++;
      manualReview.push({
        slug: movie.slug,
        title: movie.title_en,
        year: movie.release_year,
        missing_fields: missingFields.join(', '),
        tmdb_id: movie.tmdb_id || 'N/A',
        action: 'Manual research needed',
        url: `http://localhost:3000/movies/${movie.slug}`,
      });
    }
  }
  
  // Save manual review list
  if (manualReview.length > 0) {
    const csv = [
      'slug,title,year,missing_fields,tmdb_id,action,url',
      ...manualReview.map(r => 
        `"${r.slug}","${r.title}","${r.year}","${r.missing_fields}","${r.tmdb_id}","${r.action}","${r.url}"`
      )
    ].join('\n');
    
    const outputPath = `docs/manual-review/incomplete-data-batch-${Date.now()}.csv`;
    writeFileSync(outputPath, csv);
    console.log(chalk.cyan(`\n   📝 ${manualReview.length} movies need manual enrichment: ${outputPath}\n`));
  }
  
  return { 
    category: 'incomplete_data', 
    total: issues.length, 
    processed: issues.length, 
    fixed, 
    manual_review: manualReview.length, 
    failed 
  };
}

// Category 4: Missing/Broken Images - Multi-source Enrichment
async function processMissingImages(batchSize: number = 50, execute: boolean = false) {
  console.log(chalk.blue.bold(`\n🖼️  CATEGORY 4: Missing/Broken Images (93 movies)`));
  console.log(chalk.gray(`   Attempting multi-source image enrichment...\n`));
  
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .or('poster_url.is.null,poster_url.eq.')
    .eq('language', 'Telugu')
    .limit(batchSize);
  
  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('   No movies found'));
    return { category: 'missing_images', total: 0, processed: 0, fixed: 0, manual_review: 0, failed: 0 };
  }
  
  let fixed = 0;
  let failed = 0;
  const manualReview: any[] = [];
  
  for (const movie of movies) {
    let imageUrl: string | null = null;
    
    // Try TMDB first
    if (movie.tmdb_id) {
      const params = new URLSearchParams({ api_key: TMDB_API_KEY! });
      const response = await fetch(`${TMDB_BASE_URL}/movie/${movie.tmdb_id}?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.poster_path) {
          imageUrl = `${TMDB_IMAGE_BASE}${data.poster_path}`;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    if (imageUrl) {
      if (execute) {
        await supabase
          .from('movies')
          .update({ poster_url: imageUrl })
          .eq('id', movie.id);
      }
      
      console.log(chalk.green(`   ✓ ${movie.title_en}: Image found`));
      fixed++;
    } else {
      console.log(chalk.yellow(`   ⊘ ${movie.title_en}: No image found`));
      failed++;
      manualReview.push({
        slug: movie.slug,
        title: movie.title_en,
        year: movie.release_year,
        tmdb_id: movie.tmdb_id || 'N/A',
        action: 'Manual image search needed',
        url: `http://localhost:3000/movies/${movie.slug}`,
      });
    }
  }
  
  // Save manual review list
  if (manualReview.length > 0) {
    const csv = [
      'slug,title,year,tmdb_id,action,url',
      ...manualReview.map(r => 
        `"${r.slug}","${r.title}","${r.year}","${r.tmdb_id}","${r.action}","${r.url}"`
      )
    ].join('\n');
    
    const outputPath = `docs/manual-review/missing-images-batch-${Date.now()}.csv`;
    writeFileSync(outputPath, csv);
    console.log(chalk.cyan(`\n   📝 ${manualReview.length} movies need manual image search: ${outputPath}\n`));
  }
  
  return { 
    category: 'missing_images', 
    total: movies.length, 
    processed: movies.length, 
    fixed, 
    manual_review: manualReview.length, 
    failed 
  };
}

// Category 5: Potential Duplicates - Manual Review
async function processPotentialDuplicates() {
  console.log(chalk.blue.bold(`\n🔄 CATEGORY 5: Potential Duplicates (2 movies)`));
  console.log(chalk.gray(`   Generating comparison list...\n`));
  
  const issues = loadIssues('potential_duplicate');
  
  if (issues.length === 0) {
    console.log(chalk.yellow('   No duplicates found'));
    return { category: 'potential_duplicates', total: 0, processed: 0, fixed: 0, manual_review: 0, failed: 0 };
  }
  
  const reviewList: any[] = [];
  
  for (const issue of issues) {
    const { data: movie } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', issue.slug)
      .single();
    
    if (!movie) continue;
    
    const { data: duplicate } = await supabase
      .from('movies')
      .select('*')
      .eq('slug', issue.details.duplicate_of)
      .single();
    
    reviewList.push({
      movie1_slug: issue.details.duplicate_of,
      movie1_title: issue.details.duplicate_title,
      movie2_slug: movie.slug,
      movie2_title: movie.title_en,
      year: movie.release_year,
      movie1_director: duplicate?.director,
      movie2_director: movie.director,
      action: 'Compare and decide: keep, merge, or both valid',
      url1: `http://localhost:3000/movies/${issue.details.duplicate_of}`,
      url2: `http://localhost:3000/movies/${movie.slug}`,
    });
  }
  
  // Save to CSV for manual review
  const csv = [
    'movie1_slug,movie1_title,movie2_slug,movie2_title,year,movie1_director,movie2_director,action,url1,url2',
    ...reviewList.map(r => 
      `"${r.movie1_slug}","${r.movie1_title}","${r.movie2_slug}","${r.movie2_title}","${r.year}","${r.movie1_director}","${r.movie2_director}","${r.action}","${r.url1}","${r.url2}"`
    )
  ].join('\n');
  
  const outputPath = `docs/manual-review/potential-duplicates-batch-${Date.now()}.csv`;
  writeFileSync(outputPath, csv);
  
  console.log(chalk.green(`   ✅ Comparison list generated: ${outputPath}`));
  console.log(chalk.cyan(`   ${reviewList.length} pairs need manual decision\n`));
  
  return { 
    category: 'potential_duplicates', 
    total: issues.length, 
    processed: reviewList.length, 
    fixed: 0, 
    manual_review: reviewList.length, 
    failed: 0 
  };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const category = args.find(a => a.startsWith('--category='))?.split('=')[1];
  const batchSize = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '50');

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         PROCESS REMAINING ISSUES - BATCH PROCESSOR                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Category: ${category || 'ALL'}`);
  console.log(`  Batch Size: ${batchSize}\n`);

  const results: BatchResult[] = [];

  if (!category || category === 'wrong_hero_gender') {
    results.push(await processWrongHeroGender(batchSize));
  }

  if (!category || category === 'no_tmdb_id') {
    results.push(await processNoTMDBID(batchSize, execute));
  }

  if (!category || category === 'incomplete_data') {
    results.push(await processIncompleteData(batchSize, execute));
  }

  if (!category || category === 'missing_images') {
    results.push(await processMissingImages(batchSize, execute));
  }

  if (!category || category === 'potential_duplicates') {
    results.push(await processPotentialDuplicates());
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            BATCH SUMMARY                                             ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  for (const result of results) {
    console.log(chalk.cyan(`\n  ${result.category}:`));
    console.log(`    Total: ${result.total}`);
    console.log(chalk.green(`    Fixed: ${result.fixed}`));
    console.log(chalk.yellow(`    Manual Review: ${result.manual_review}`));
    console.log(chalk.red(`    Failed: ${result.failed}`));
  }

  const totalFixed = results.reduce((sum, r) => sum + r.fixed, 0);
  const totalManualReview = results.reduce((sum, r) => sum + r.manual_review, 0);

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            OVERALL SUMMARY                                           ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.green(`  Total Fixed: ${totalFixed}`));
  console.log(chalk.yellow(`  Total Needing Manual Review: ${totalManualReview}`));
  console.log(chalk.gray(`\n  Manual review files saved in: docs/manual-review/\n`));

  if (!execute) {
    console.log(chalk.yellow(`  Run with --execute to apply fixes`));
    console.log(chalk.gray(`  Options:`));
    console.log(chalk.gray(`    --category=<name>  Process specific category`));
    console.log(chalk.gray(`    --batch=<number>   Batch size (default: 50)`));
    console.log(chalk.gray(`\n  Categories:`));
    console.log(chalk.gray(`    wrong_hero_gender, no_tmdb_id, incomplete_data, missing_images, potential_duplicates\n`));
  }
}

main().catch(console.error);
