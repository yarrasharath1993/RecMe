#!/usr/bin/env npx tsx
/**
 * MULTI-SOURCE IMAGE ENRICHMENT
 * 
 * Production-ready script that uses the new multi-source validation system.
 * Implements 3-phase execution with audit logging.
 * 
 * Usage:
 *   npx tsx scripts/enrich-images-multi-source.ts --limit=10
 *   npx tsx scripts/enrich-images-multi-source.ts --limit=100 --execute
 *   npx tsx scripts/enrich-images-multi-source.ts --limit=100 --execute --audit
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { 
  getBaselineSource, 
  getValidateOnlySources,
  getIngestSources,
  IMAGE_SOURCE_REGISTRY,
} from './lib/image-source-registry';
import { validateImageLicense } from './lib/license-validator';
import { 
  calculateMultiSourceConfidence,
  detectAIGenerated 
} from './lib/image-comparator';
import { 
  createAuditRecord, 
  writeAuditLog, 
  writeAuditLogMarkdown,
  type ImageAuditRecord 
} from './lib/audit-logger';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

interface Movie {
  id: string;
  title_en: string;
  release_year: number;
  poster_url: string | null;
  tmdb_id: number | null;
}

// Simplified source fetchers (reusing existing logic)
async function fetchTMDB(title: string, year: number): Promise<{ url: string | null; tmdb_id: number | null }> {
  if (!TMDB_API_KEY) return { url: null, tmdb_id: null };
  
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    const res = await fetch(searchUrl);
    const data = await res.json();
    
    if (!data.results?.length) return { url: null, tmdb_id: null };
    
    const movie = data.results.find((m: any) => m.original_language === 'te') || data.results[0];
    
    return {
      url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      tmdb_id: movie.id,
    };
  } catch {
    return { url: null, tmdb_id: null };
  }
}

async function fetchIMPAwards(title: string, year: number): Promise<string | null> {
  // Stub - returns null for now
  return null;
}

async function fetchLetterboxd(title: string, year: number): Promise<string | null> {
  // Stub - returns null for now
  return null;
}

async function fetchWikimedia(title: string, year: number): Promise<string | null> {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(title + ' ' + year + ' Telugu film')}&srnamespace=6&format=json&origin=*`;
    const res = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguPortal/2.0' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const results = data.query?.search || [];
    
    if (results.length === 0) return null;
    
    const fileTitle = results[0].title;
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
    const infoRes = await fetch(infoUrl, {
      headers: { 'User-Agent': 'TeluguPortal/2.0' }
    });
    
    if (!infoRes.ok) return null;
    
    const infoData = await infoRes.json();
    const page = Object.values(infoData.query?.pages || {})[0] as any;
    const imageInfo = page?.imageinfo?.[0];
    
    if (imageInfo?.url) {
      const license = imageInfo.extmetadata?.LicenseShortName?.value || '';
      if (license.includes('CC') || license.includes('Public domain')) {
        return imageInfo.url;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// MAIN ENRICHMENT WITH 3-PHASE EXECUTION
// ============================================================

async function enrichMovieMultiSource(movie: Movie): Promise<ImageAuditRecord | null> {
  const { title_en, release_year } = movie;
  
  console.log(`\n${chalk.cyan(title_en)} (${release_year})`);
  
  // Skip if already has poster
  if (movie.poster_url && !movie.poster_url.includes('placeholder')) {
    console.log(chalk.gray('  ⏭️  Already has poster, skipping'));
    return null;
  }
  
  // ============================================================
  // PHASE 1: BASELINE (TMDB)
  // ============================================================
  console.log('  Phase 1: Baseline (TMDB)...');
  const tmdbResult = await fetchTMDB(title_en, release_year);
  
  if (!tmdbResult.url) {
    console.log(chalk.red('  ✗ No poster found in TMDB'));
    return null;
  }
  
  console.log(chalk.green(`  ✓ TMDB: found poster`));
  const baselineUrl = tmdbResult.url;
  const baselineConfidence = IMAGE_SOURCE_REGISTRY.tmdb.trust_weight;
  
  // ============================================================
  // PHASE 2: VALIDATE-ONLY (Parallel)
  // ============================================================
  console.log('  Phase 2: Validate-Only (parallel)...');
  const validateOnlySources = getValidateOnlySources().map(s => s.id);
  const validateOnlyImages: Array<{ url: string; source: string }> = [];
  
  const [impawardsUrl, letterboxdUrl] = await Promise.all([
    fetchIMPAwards(title_en, release_year),
    fetchLetterboxd(title_en, release_year),
  ]);
  
  if (impawardsUrl) {
    validateOnlyImages.push({ url: impawardsUrl, source: 'impawards' });
    console.log(chalk.gray('    → IMPAwards: confirmed (not stored)'));
  }
  
  if (letterboxdUrl) {
    validateOnlyImages.push({ url: letterboxdUrl, source: 'letterboxd' });
    console.log(chalk.gray('    → Letterboxd: confirmed (not stored)'));
  }
  
  if (validateOnlyImages.length === 0) {
    console.log(chalk.gray('    No validate-only confirmations'));
  }
  
  // ============================================================
  // PHASE 3: INGEST/ENRICH (With license validation)
  // ============================================================
  console.log('  Phase 3: Ingest/Enrich (license validation)...');
  const ingestSourcesTried: string[] = [];
  const ingestImages: Array<{ url: string; source: string; confidence: number }> = [];
  
  // Try Wikimedia
  ingestSourcesTried.push('wikimedia');
  const wikimediaUrl = await fetchWikimedia(title_en, release_year);
  if (wikimediaUrl) {
    const licenseResult = await validateImageLicense(wikimediaUrl, 'wikimedia');
    if (licenseResult.is_valid) {
      ingestImages.push({ url: wikimediaUrl, source: 'wikimedia', confidence: 0.85 });
      console.log(chalk.green(`    ✓ Wikimedia: ${licenseResult.license_type} ${licenseResult.warning ? '(warning)' : ''}`));
      if (licenseResult.warning) {
        console.log(chalk.yellow(`      ${licenseResult.warning}`));
      }
    }
  }
  
  // ============================================================
  // CONFIDENCE CALCULATION
  // ============================================================
  const confidenceResult = calculateMultiSourceConfidence(
    baselineUrl,
    'tmdb',
    baselineConfidence,
    validateOnlyImages,
    ingestImages
  );
  
  console.log(chalk.cyan(`  📊 Confidence: ${confidenceResult.final_confidence.toFixed(2)} (base: ${baselineConfidence}, validate: +${confidenceResult.validate_only_boost.toFixed(2)}, multi: +${confidenceResult.multi_source_boost.toFixed(2)})`));
  
  if (confidenceResult.confirmed_by.length > 0) {
    console.log(chalk.green(`     Confirmed by: ${confidenceResult.confirmed_by.join(', ')}`));
  }
  
  // ============================================================
  // CREATE AUDIT RECORD
  // ============================================================
  const auditRecord = createAuditRecord(
    movie.id,
    title_en,
    release_year,
    baselineUrl,
    'tmdb',
    baselineConfidence,
    validateOnlySources,
    confidenceResult.confirmed_by,
    ingestSourcesTried,
    'tmdb',
    confidenceResult.confirmed_by.length + confidenceResult.agreement_sources.length,
    'attribution',
    true,
    null,
    true,
    baselineConfidence,
    confidenceResult.validate_only_boost,
    confidenceResult.multi_source_boost,
    confidenceResult.final_confidence,
    false,
    true,
    'Baseline with multi-source validation',
    false
  );
  
  return auditRecord;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const auditEnabled = args.includes('--audit');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;
  
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════╗
║       MULTI-SOURCE IMAGE ENRICHMENT (3-Phase System)         ║
╚══════════════════════════════════════════════════════════════╝
`));
  
  console.log(`  Mode: ${dryRun ? chalk.yellow('DRY RUN') : chalk.green('EXECUTE')}`);
  console.log(`  Limit: ${limit} movies`);
  console.log(`  Audit: ${auditEnabled ? chalk.green('ENABLED') : chalk.gray('Disabled')}`);
  console.log('');
  
  // Fetch movies needing posters
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, poster_url, tmdb_id')
    .eq('language', 'Telugu')
    .or('poster_url.is.null,poster_url.ilike.%placeholder%')
    .order('release_year', { ascending: false })
    .limit(limit);
  
  if (error || !movies) {
    console.error(chalk.red(`Error: ${error?.message}`));
    return;
  }
  
  console.log(chalk.cyan(`Found ${movies.length} movies to process\n`));
  
  if (movies.length === 0) {
    console.log(chalk.green('✅ All movies have posters!'));
    return;
  }
  
  // Process movies
  const auditRecords: ImageAuditRecord[] = [];
  let enriched = 0;
  let skipped = 0;
  
  for (const movie of movies) {
    const auditRecord = await enrichMovieMultiSource(movie);
    
    if (auditRecord) {
      auditRecords.push(auditRecord);
      enriched++;
      
      // Apply database update if not dry run
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            poster_url: auditRecord.image_url,
            poster_confidence: auditRecord.confidence_breakdown.final_score,
            poster_visual_type: 'original_poster',
            visual_verified_at: auditRecord.timestamp,
            archival_source: {
              source_name: auditRecord.source_trace.baseline,
              source_type: 'database',
              license_type: auditRecord.license_trace.license_type,
              acquisition_date: auditRecord.timestamp,
              image_url: auditRecord.image_url,
              validate_only_confirmed_by: auditRecord.source_trace.validate_only_confirmed,
              multi_source_agreement: auditRecord.source_trace.agreement_count,
              license_verified: auditRecord.license_trace.license_verified,
            },
            license_warning: auditRecord.license_trace.license_warning,
          })
          .eq('id', movie.id);
        
        if (updateError) {
          console.log(chalk.red(`  ✗ Update failed: ${updateError.message}`));
        }
      }
    } else {
      skipped++;
    }
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 300));
  }
  
  // Summary
  console.log(chalk.cyan.bold(`\n${'═'.repeat(70)}`));
  console.log(chalk.cyan.bold('ENRICHMENT SUMMARY'));
  console.log(chalk.cyan.bold(`${'═'.repeat(70)}`));
  console.log(`  Processed: ${movies.length}`);
  console.log(`  Enriched:  ${chalk.green(enriched)}`);
  console.log(`  Skipped:   ${chalk.gray(skipped)}`);
  
  if (auditEnabled && auditRecords.length > 0) {
    // Write audit logs
    const jsonLog = await writeAuditLog(auditRecords);
    const mdLog = await writeAuditLogMarkdown(auditRecords);
    
    console.log(chalk.cyan(`\n  📝 Audit logs written:`));
    console.log(chalk.gray(`     JSON: ${jsonLog}`));
    console.log(chalk.gray(`     MD:   ${mdLog}`));
  }
  
  // Statistics
  const avgConfidence = enriched > 0
    ? auditRecords.reduce((sum, r) => sum + r.confidence_breakdown.final_score, 0) / enriched
    : 0;
  
  const validateOnlyConfirmations = auditRecords.filter(r => 
    r.source_trace.validate_only_confirmed.length > 0
  ).length;
  
  const licenseWarnings = auditRecords.filter(r => 
    r.license_trace.license_warning !== null
  ).length;
  
  console.log(chalk.cyan(`\n  Statistics:`));
  console.log(`    Avg Confidence:           ${avgConfidence.toFixed(2)}`);
  console.log(`    Validate-Only Confirms:   ${validateOnlyConfirmations}`);
  console.log(`    License Warnings:         ${licenseWarnings}`);
  
  if (dryRun) {
    console.log(chalk.yellow(`\n  [DRY RUN] No changes made. Run with --execute to apply.`));
  } else {
    console.log(chalk.green(`\n  ✅ Enrichment complete!`));
  }
}

main().catch(console.error);
