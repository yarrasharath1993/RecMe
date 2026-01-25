import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Celebrity {
  id: string;
  name_en: string;
  name_te?: string;
  occupation?: string[];
  popularity_score?: number;
  birth_date?: string;
  death_date?: string;
  is_active?: boolean;
  slug?: string;
}

interface AuditResult {
  celebrity: Celebrity;
  movieCount: number;
  wikiUrl: string;
  filmographyUrl: string;
  status: 'found' | 'not_found' | 'disambig_needed' | 'manual_review';
  notes: string;
}

// Helper to clean and format celebrity name for Wikipedia
function formatNameForWiki(nameEn: string): string {
  // Remove any parenthetical disambiguations from DB
  const cleaned = nameEn.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Handle common patterns
  const patterns: Record<string, string> = {
    'N.T. Rama Rao Jr.': 'N._T._Rama_Rao_Jr.',
    'N.T. Rama Rao': 'N._T._Rama_Rao',
    'N. T. Rama Rao': 'N._T._Rama_Rao',
    'K. Viswanath': 'K._Viswanath',
    'K. Balachander': 'K._Balachander',
  };
  
  if (patterns[cleaned]) return patterns[cleaned];
  
  // Default: replace spaces with underscores
  return cleaned.replace(/\s+/g, '_');
}

// Get short name for matching against movies
function getShortName(fullName: string): string {
  const nameLower = fullName.toLowerCase();
  
  // Common patterns
  if (nameLower.includes('akkineni nagarjuna')) return 'Nagarjuna';
  if (nameLower.includes('n.t. rama rao jr')) return 'Jr NTR';
  if (nameLower.includes('nandamuri balakrishna')) return 'Balakrishna';
  if (nameLower.includes('daggubati venkatesh')) return 'Venkatesh';
  if (nameLower.includes('konidela ram charan')) return 'Ram Charan';
  if (nameLower.includes('mahesh babu')) return 'Mahesh Babu';
  if (nameLower.includes('pawan kalyan')) return 'Pawan Kalyan';
  
  // Default: last word
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1];
}

async function getAllCelebrities(): Promise<Celebrity[]> {
  console.log(chalk.cyan('📊 Fetching ALL celebrities from database...\n'));
  
  const { data, error} = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, occupation, popularity_score, birth_date, death_date, is_active, slug')
    .order('popularity_score', { ascending: false, nullsFirst: false });
  
  if (error) {
    throw new Error(`Failed to fetch celebrities: ${error.message}`);
  }
  
  console.log(chalk.green(`✓ Found ${data.length} celebrities\n`));
  return data as Celebrity[];
}

async function countCelebrityMovies(celebrity: Celebrity): Promise<number> {
  const shortName = getShortName(celebrity.name_en);
  const fullName = celebrity.name_en;
  
  // Search in multiple fields
  const { data, error } = await supabase
    .from('movies')
    .select('id', { count: 'exact', head: true })
    .or(`hero.ilike.%${shortName}%,heroine.ilike.%${shortName}%,director.ilike.%${fullName}%,music_director.ilike.%${fullName}%,producer::text.ilike.%${fullName}%`);
  
  if (error) {
    console.error(chalk.red(`Error counting movies for ${celebrity.name_en}: ${error.message}`));
    return 0;
  }
  
  return data?.length || 0;
}

async function checkWikipediaPage(celebrity: Celebrity): Promise<AuditResult> {
  const wikiName = formatNameForWiki(celebrity.name_en);
  const wikiUrl = `https://en.wikipedia.org/wiki/${wikiName}`;
  
  // Common filmography patterns
  const filmographyUrls = [
    `https://en.wikipedia.org/wiki/${wikiName}_filmography`,
    `https://en.wikipedia.org/wiki/${wikiName}#Filmography`,
    wikiUrl, // Main page often has filmography section
  ];
  
  // Try to fetch the main page
  try {
    const response = await fetch(wikiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FilmographyAudit/1.0)',
      },
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Check if it's a disambiguation page
      if (html.includes('may refer to:') || html.includes('disambiguation')) {
        return {
          celebrity,
          movieCount: await countCelebrityMovies(celebrity),
          wikiUrl,
          filmographyUrl: filmographyUrls[0],
          status: 'disambig_needed',
          notes: 'Disambiguation page - needs (actor)/(actress)/(director) suffix',
        };
      }
      
      // Check if filmography section exists
      const hasFilmography = html.includes('Filmography') || html.includes('filmography');
      
      return {
        celebrity,
        movieCount: await countCelebrityMovies(celebrity),
        wikiUrl,
        filmographyUrl: hasFilmography ? `${wikiUrl}#Filmography` : filmographyUrls[0],
        status: 'found',
        notes: hasFilmography ? 'Has filmography section' : 'Check for standalone filmography page',
      };
    } else if (response.status === 404) {
      return {
        celebrity,
        movieCount: await countCelebrityMovies(celebrity),
        wikiUrl,
        filmographyUrl: '',
        status: 'not_found',
        notes: 'Wikipedia page not found - may need alternate name/spelling',
      };
    } else {
      return {
        celebrity,
        movieCount: await countCelebrityMovies(celebrity),
        wikiUrl,
        filmographyUrl: filmographyUrls[0],
        status: 'manual_review',
        notes: `HTTP ${response.status} - needs manual check`,
      };
    }
  } catch (error: any) {
    return {
      celebrity,
      movieCount: await countCelebrityMovies(celebrity),
      wikiUrl,
      filmographyUrl: filmographyUrls[0],
      status: 'manual_review',
      notes: `Error: ${error.message}`,
    };
  }
}

async function main() {
  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  FULL CELEBRITY DATABASE AUDIT - 100% COVERAGE'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  // Get all celebrities
  const celebrities = await getAllCelebrities();
  
  console.log(chalk.cyan(`Starting audit of ${celebrities.length} celebrities...\n`));
  
  const results: AuditResult[] = [];
  let processed = 0;
  
  // Process in batches to show progress
  const batchSize = 10;
  for (let i = 0; i < celebrities.length; i += batchSize) {
    const batch = celebrities.slice(i, i + batchSize);
    
    for (const celebrity of batch) {
      const result = await checkWikipediaPage(celebrity);
      results.push(result);
      processed++;
      
      // Show progress
      if (processed % 50 === 0) {
        console.log(chalk.gray(`Progress: ${processed}/${celebrities.length} (${Math.round(processed/celebrities.length*100)}%)`));
      }
      
      // Rate limit: small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(chalk.green(`\n✓ Completed audit of ${processed} celebrities\n`));
  
  // Generate statistics
  const stats = {
    total: results.length,
    found: results.filter(r => r.status === 'found').length,
    notFound: results.filter(r => r.status === 'not_found').length,
    disambig: results.filter(r => r.status === 'disambig_needed').length,
    manualReview: results.filter(r => r.status === 'manual_review').length,
    withMovies: results.filter(r => r.movieCount > 0).length,
    withoutMovies: results.filter(r => r.movieCount === 0).length,
  };
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  AUDIT STATISTICS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.cyan('Wikipedia Status:'));
  console.log(chalk.green(`  ✓ Found:              ${stats.found} (${Math.round(stats.found/stats.total*100)}%)`));
  console.log(chalk.yellow(`  ⚠ Disambiguation:     ${stats.disambig}`));
  console.log(chalk.red(`  ✗ Not Found:          ${stats.notFound}`));
  console.log(chalk.gray(`  ? Manual Review:      ${stats.manualReview}`));
  
  console.log(chalk.cyan('\nMovie Attribution:'));
  console.log(chalk.green(`  With Movies:          ${stats.withMovies}`));
  console.log(chalk.yellow(`  Without Movies:       ${stats.withoutMovies}`));
  
  // Generate CSV files
  const timestamp = new Date().toISOString().split('T')[0];
  
  // 1. Complete audit results
  const allResultsCsv = [
    'Celebrity ID,Name,Telugu Name,Occupation,Popularity,Movie Count,Status,Wikipedia URL,Filmography URL,Notes',
    ...results.map(r => 
      `"${r.celebrity.id}","${r.celebrity.name_en}","${r.celebrity.name_te || ''}","${r.celebrity.occupation?.join(', ') || ''}",${r.celebrity.popularity_score || 0},${r.movieCount},"${r.status}","${r.wikiUrl}","${r.filmographyUrl}","${r.notes}"`
    )
  ].join('\n');
  
  fs.writeFileSync(`FULL-CELEBRITY-AUDIT-${timestamp}.csv`, allResultsCsv);
  console.log(chalk.green(`\n✓ Created: FULL-CELEBRITY-AUDIT-${timestamp}.csv`));
  
  // 2. Priority: Needs manual review
  const needsReview = results.filter(r => 
    r.status === 'not_found' || 
    r.status === 'disambig_needed' || 
    r.status === 'manual_review'
  ).sort((a, b) => (b.movieCount || 0) - (a.movieCount || 0));
  
  const reviewCsv = [
    'Priority,Celebrity ID,Name,Movie Count,Status,Issue,Suggested Wikipedia URL,Action Required',
    ...needsReview.map((r, i) => {
      const priority = r.movieCount > 10 ? 'HIGH' : r.movieCount > 5 ? 'MEDIUM' : 'LOW';
      const action = r.status === 'disambig_needed' 
        ? 'Add (actor)/(actress)/(director) to URL'
        : r.status === 'not_found'
        ? 'Find correct Wikipedia name/spelling'
        : 'Manual verification needed';
      
      return `"${priority}","${r.celebrity.id}","${r.celebrity.name_en}",${r.movieCount},"${r.status}","${r.notes}","${r.wikiUrl}","${action}"`;
    })
  ].join('\n');
  
  fs.writeFileSync(`MANUAL-REVIEW-REQUIRED-${timestamp}.csv`, reviewCsv);
  console.log(chalk.yellow(`✓ Created: MANUAL-REVIEW-REQUIRED-${timestamp}.csv (${needsReview.length} celebrities)`));
  
  // 3. Ready for attribution audit (found + has filmography)
  const readyForAudit = results.filter(r => 
    r.status === 'found' && 
    r.notes.includes('filmography')
  ).sort((a, b) => (b.movieCount || 0) - (a.movieCount || 0));
  
  const readyCsv = [
    'Priority,Celebrity ID,Name,Movie Count,Wikipedia URL,Filmography URL',
    ...readyForAudit.map(r => {
      const priority = r.movieCount > 10 ? 'HIGH' : r.movieCount > 5 ? 'MEDIUM' : 'LOW';
      return `"${priority}","${r.celebrity.id}","${r.celebrity.name_en}",${r.movieCount},"${r.wikiUrl}","${r.filmographyUrl}"`;
    })
  ].join('\n');
  
  fs.writeFileSync(`READY-FOR-ATTRIBUTION-AUDIT-${timestamp}.csv`, readyCsv);
  console.log(chalk.green(`✓ Created: READY-FOR-ATTRIBUTION-AUDIT-${timestamp}.csv (${readyForAudit.length} celebrities)`));
  
  // 4. No movies attributed (potential data gap)
  const noMovies = results.filter(r => r.movieCount === 0)
    .sort((a, b) => (b.celebrity.popularity_score || 0) - (a.celebrity.popularity_score || 0));
  
  const noMoviesCsv = [
    'Celebrity ID,Name,Occupation,Popularity,Status,Wikipedia URL,Notes',
    ...noMovies.map(r => 
      `"${r.celebrity.id}","${r.celebrity.name_en}","${r.celebrity.occupation?.join(', ') || ''}",${r.celebrity.popularity_score || 0},"${r.status}","${r.wikiUrl}","${r.notes}"`
    )
  ].join('\n');
  
  fs.writeFileSync(`NO-MOVIES-ATTRIBUTED-${timestamp}.csv`, noMoviesCsv);
  console.log(chalk.gray(`✓ Created: NO-MOVIES-ATTRIBUTED-${timestamp}.csv (${noMovies.length} celebrities)`));
  
  // Generate summary markdown
  const summary = `# Full Celebrity Database Audit Summary

**Date**: ${new Date().toLocaleDateString()}
**Status**: Complete

## Overview

- **Total Celebrities**: ${stats.total}
- **Audit Coverage**: 100%

## Wikipedia Status

| Status | Count | Percentage |
|--------|-------|------------|
| ✓ Found | ${stats.found} | ${Math.round(stats.found/stats.total*100)}% |
| ⚠ Disambiguation | ${stats.disambig} | ${Math.round(stats.disambig/stats.total*100)}% |
| ✗ Not Found | ${stats.notFound} | ${Math.round(stats.notFound/stats.total*100)}% |
| ? Manual Review | ${stats.manualReview} | ${Math.round(stats.manualReview/stats.total*100)}% |

## Movie Attribution

- **With Movies**: ${stats.withMovies} celebrities (${Math.round(stats.withMovies/stats.total*100)}%)
- **Without Movies**: ${stats.withoutMovies} celebrities (${Math.round(stats.withoutMovies/stats.total*100)}%)

## Action Required

### High Priority (${needsReview.filter(r => r.movieCount > 10).length} celebrities)
Celebrities with >10 movies but Wikipedia issues - needs immediate review

### Medium Priority (${needsReview.filter(r => r.movieCount >= 5 && r.movieCount <= 10).length} celebrities)
Celebrities with 5-10 movies - review when possible

### Low Priority (${needsReview.filter(r => r.movieCount < 5).length} celebrities)
Celebrities with <5 movies - review as time permits

## Files Generated

1. **FULL-CELEBRITY-AUDIT-${timestamp}.csv**
   - Complete audit results for all ${stats.total} celebrities
   - Includes Wikipedia status, movie counts, and notes

2. **MANUAL-REVIEW-REQUIRED-${timestamp}.csv**
   - ${needsReview.length} celebrities needing manual review
   - Prioritized by movie count
   - Includes suggested actions

3. **READY-FOR-ATTRIBUTION-AUDIT-${timestamp}.csv**
   - ${readyForAudit.length} celebrities ready for filmography audit
   - Wikipedia page found with filmography section
   - Can proceed with automated attribution audit

4. **NO-MOVIES-ATTRIBUTED-${timestamp}.csv**
   - ${noMovies.length} celebrities with zero movie attributions
   - Potential data gaps or non-film celebrities

## Next Steps

1. **Review MANUAL-REVIEW-REQUIRED-${timestamp}.csv**
   - Fix Wikipedia URLs for disambiguation pages
   - Find correct spellings for "not found" celebrities
   - Verify manual review cases

2. **Run Attribution Audit**
   - Use READY-FOR-ATTRIBUTION-AUDIT-${timestamp}.csv
   - Run automated-attribution-audit.ts for each celebrity
   - Generate per-celebrity filmography CSVs

3. **Address No-Movies Cases**
   - Review NO-MOVIES-ATTRIBUTED-${timestamp}.csv
   - Determine if data missing or non-film professional
   - Add missing filmographies

## Success Metrics

- **Wikipedia Coverage**: ${Math.round((stats.found + stats.disambig)/stats.total*100)}% (found + fixable)
- **Ready for Automation**: ${readyForAudit.length} celebrities
- **Needs Human Review**: ${needsReview.length} celebrities

---

**Generated**: ${new Date().toISOString()}
`;
  
  fs.writeFileSync(`FULL-AUDIT-SUMMARY-${timestamp}.md`, summary);
  console.log(chalk.cyan(`✓ Created: FULL-AUDIT-SUMMARY-${timestamp}.md\n`));
  
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  AUDIT COMPLETE'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(chalk.green('✅ 100% Coverage Achieved!\n'));
  console.log(chalk.cyan('Next Steps:'));
  console.log(chalk.gray(`  1. Review MANUAL-REVIEW-REQUIRED-${timestamp}.csv`));
  console.log(chalk.gray(`  2. Fix Wikipedia URLs for ${needsReview.length} celebrities`));
  console.log(chalk.gray(`  3. Run attribution audit on ${readyForAudit.length} ready celebrities\n`));
}

main().catch(console.error);
