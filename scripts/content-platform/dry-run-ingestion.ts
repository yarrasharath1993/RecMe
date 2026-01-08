#!/usr/bin/env npx tsx
/**
 * DRY-RUN CONTENT INGESTION
 * 
 * Safely ingests real, publicly available content as drafts.
 * - Reads article data from dry-run-articles.json
 * - Normalizes to database schema
 * - Runs safety and compliance checks
 * - Inserts as drafts with verification_status = "pending"
 * 
 * Usage:
 *   npx tsx scripts/content-platform/dry-run-ingestion.ts --preview
 *   npx tsx scripts/content-platform/dry-run-ingestion.ts --execute
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// TYPES
// ============================================================

interface SourceRef {
  source: string;
  url: string | null;
  trustLevel: number;
  claimType: 'fact' | 'opinion' | 'quote';
}

interface DryRunArticle {
  id: string;
  sourceType: string;
  sourceUrl: string | null;
  title: string;
  title_te: string;
  summary: string;
  summary_te: string;
  contentSector: string;
  contentSubsector: string;
  contentType: string;
  audienceProfile: 'kids' | 'family' | 'general' | 'adult';
  sensitivityLevel: 'none' | 'mild' | 'moderate' | 'high' | 'extreme';
  factConfidenceScore: number;
  sourceRefs: SourceRef[];
  fictionalLabel: boolean;
  historicalPeriod?: string;
  geoContext?: string;
  ageGroup?: string;
  requiresDisclaimer?: boolean;
  disclaimerType?: string;
  disclaimerText?: string;
  keywords?: string[];
}

interface ArticleDataFile {
  version: string;
  generatedAt: string;
  description: string;
  complianceNotes: {
    scraping: string;
    copyright: string;
    sources: string;
  };
  articles: DryRunArticle[];
}

interface SafetyCheckResult {
  passed: boolean;
  warnings: string[];
  errors: string[];
}

// ============================================================
// SAFETY CHECKS
// ============================================================

function runSafetyChecks(article: DryRunArticle): SafetyCheckResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check 1: Kids content must have none sensitivity
  if (article.audienceProfile === 'kids' && article.sensitivityLevel !== 'none') {
    errors.push('Kids content cannot have sensitivity level other than "none"');
  }

  // Check 2: Fiction must be labeled
  if (article.contentSector === 'what_if_fiction' && !article.fictionalLabel) {
    errors.push('What-if/fiction content MUST have fictionalLabel = true');
  }

  // Check 3: Medical content needs disclaimer
  if (article.contentSector === 'pregnancy_wellness' && !article.requiresDisclaimer) {
    warnings.push('Pregnancy/wellness content should have a medical disclaimer');
  }

  // Check 4: Legal content needs disclaimer
  if (article.contentSector === 'crime_courts' && !article.requiresDisclaimer) {
    warnings.push('Court/legal content should have a legal disclaimer');
  }

  // Check 5: Source verification
  if (article.sourceRefs.length === 0) {
    errors.push('Content must have at least one source reference');
  }

  // Check 6: Confidence score validation
  if (article.fictionalLabel && article.factConfidenceScore > 0) {
    warnings.push('Fictional content should have confidence score of 0');
  }

  // Check 7: Adult content isolation
  if (article.sensitivityLevel === 'extreme' && article.audienceProfile !== 'adult') {
    errors.push('Extreme sensitivity content must be marked as adult-only');
  }

  // Check 8: Summary length (no long copied text)
  if (article.summary.length > 2000) {
    warnings.push('Summary is longer than recommended (>2000 chars) - ensure it is original');
  }

  return {
    passed: errors.length === 0,
    warnings,
    errors,
  };
}

// ============================================================
// CONFIDENCE SCORE CALCULATION
// ============================================================

function calculateConfidenceScore(article: DryRunArticle): number {
  if (article.fictionalLabel) {
    return 0;
  }

  // Base score from source trust levels
  const avgTrust = article.sourceRefs.reduce((sum, ref) => sum + ref.trustLevel, 0) / 
                   article.sourceRefs.length;
  let baseScore = Math.round(avgTrust * 100);

  // Source bonus (up to 20 points for multiple sources)
  const sourceBonus = Math.min(article.sourceRefs.length * 5, 20);

  // Type-based adjustments
  const factSources = article.sourceRefs.filter(r => r.claimType === 'fact').length;
  const factBonus = factSources >= 2 ? 5 : 0;

  const finalScore = Math.min(baseScore + sourceBonus + factBonus, 100);
  return finalScore;
}

// ============================================================
// SLUG GENERATION
// ============================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

// ============================================================
// NORMALIZE TO DB SCHEMA
// ============================================================

function normalizeArticle(article: DryRunArticle) {
  const calculatedConfidence = calculateConfidenceScore(article);
  
  return {
    title: article.title,
    title_te: article.title_te,
    slug: generateSlug(article.title),
    telugu_body: article.summary_te,
    category: 'entertainment', // Default category for posts
    image_url: null,
    status: 'draft',
    content_sector: article.contentSector,
    content_subsector: article.contentSubsector,
    content_type: article.contentType,
    audience_profile: article.audienceProfile,
    sensitivity_level: article.sensitivityLevel,
    fact_confidence_score: calculatedConfidence,
    source_count: article.sourceRefs.length,
    source_refs: JSON.stringify(article.sourceRefs.map(ref => ({
      id: uuidv4(),
      sourceType: article.sourceType,
      sourceName: ref.source,
      sourceUrl: ref.url,
      trustLevel: ref.trustLevel,
      claimType: ref.claimType,
      isVerified: false,
      fetchedAt: new Date().toISOString(),
    }))),
    verification_status: 'pending',
    fictional_label: article.fictionalLabel,
    historical_period: article.historicalPeriod || null,
    geo_context: article.geoContext || null,
    age_group: article.ageGroup || null,
    publish_batch_id: null,
    published_at: null,
  };
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const isPreview = args.includes('--preview');
  const isExecute = args.includes('--execute');

  if (!isPreview && !isExecute) {
    console.log('Usage:');
    console.log('  npx tsx scripts/content-platform/dry-run-ingestion.ts --preview');
    console.log('  npx tsx scripts/content-platform/dry-run-ingestion.ts --execute');
    console.log('');
    console.log('Options:');
    console.log('  --preview  Show what would be ingested (no DB changes)');
    console.log('  --execute  Actually insert drafts into database');
    process.exit(0);
  }

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  DRY-RUN CONTENT INGESTION');
  console.log('  Mode:', isPreview ? 'PREVIEW (no DB changes)' : 'EXECUTE (will insert drafts)');
  console.log('════════════════════════════════════════════════════════════════\n');

  // Load article data
  const dataPath = resolve(__dirname, 'data/dry-run-articles.json');
  let articleData: ArticleDataFile;
  
  try {
    const fileContent = readFileSync(dataPath, 'utf-8');
    articleData = JSON.parse(fileContent);
  } catch (error) {
    console.error('❌ Failed to load article data:', error);
    process.exit(1);
  }

  console.log(`📄 Loaded ${articleData.articles.length} articles from dry-run-articles.json`);
  console.log(`📝 Version: ${articleData.version}`);
  console.log('');

  // Compliance notes
  console.log('📋 COMPLIANCE NOTES:');
  console.log(`   • Scraping: ${articleData.complianceNotes.scraping}`);
  console.log(`   • Copyright: ${articleData.complianceNotes.copyright}`);
  console.log(`   • Sources: ${articleData.complianceNotes.sources}`);
  console.log('');

  // Process each article
  const results: { 
    success: DryRunArticle[]; 
    failed: { article: DryRunArticle; reason: string }[] 
  } = { success: [], failed: [] };

  console.log('════════════════════════════════════════════════════════════════');
  console.log('  PROCESSING ARTICLES');
  console.log('════════════════════════════════════════════════════════════════\n');

  for (const article of articleData.articles) {
    console.log(`\n┌─────────────────────────────────────────────────────────────────`);
    console.log(`│ ${article.id}: ${article.title.slice(0, 50)}...`);
    console.log(`├─────────────────────────────────────────────────────────────────`);
    console.log(`│ Sector: ${article.contentSector} → ${article.contentSubsector}`);
    console.log(`│ Type: ${article.contentType}`);
    console.log(`│ Audience: ${article.audienceProfile}`);
    console.log(`│ Sensitivity: ${article.sensitivityLevel}`);
    console.log(`│ Sources: ${article.sourceRefs.length}`);
    console.log(`│ Fictional: ${article.fictionalLabel}`);

    // Run safety checks
    const safetyResult = runSafetyChecks(article);
    
    if (safetyResult.warnings.length > 0) {
      console.log(`│ ⚠️  Warnings:`);
      safetyResult.warnings.forEach(w => console.log(`│    - ${w}`));
    }

    if (!safetyResult.passed) {
      console.log(`│ ❌ FAILED SAFETY CHECKS:`);
      safetyResult.errors.forEach(e => console.log(`│    - ${e}`));
      results.failed.push({ article, reason: safetyResult.errors.join('; ') });
      console.log(`└─────────────────────────────────────────────────────────────────`);
      continue;
    }

    // Normalize for DB
    const normalized = normalizeArticle(article);
    const calculatedScore = calculateConfidenceScore(article);
    
    console.log(`│ ✅ Passed safety checks`);
    console.log(`│ 📊 Calculated confidence: ${calculatedScore}`);
    console.log(`│ 🔗 Slug: ${normalized.slug}`);

    if (isPreview) {
      console.log(`│`);
      console.log(`│ 📋 NORMALIZED RECORD (preview):`);
      console.log(`│ ${JSON.stringify(normalized, null, 2).split('\n').join('\n│ ')}`);
      results.success.push(article);
    } else {
      // Execute insert
      try {
        const { data, error } = await supabase
          .from('posts')
          .insert(normalized)
          .select('id, slug')
          .single();

        if (error) {
          console.log(`│ ❌ DB Error: ${error.message}`);
          results.failed.push({ article, reason: error.message });
        } else {
          console.log(`│ ✅ Inserted as draft - ID: ${data.id}`);
          results.success.push(article);
        }
      } catch (err) {
        console.log(`│ ❌ Error: ${err}`);
        results.failed.push({ article, reason: String(err) });
      }
    }

    console.log(`└─────────────────────────────────────────────────────────────────`);
  }

  // Summary
  console.log('\n');
  console.log('════════════════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('════════════════════════════════════════════════════════════════');
  console.log(`  Total articles:  ${articleData.articles.length}`);
  console.log(`  ✅ Successful:   ${results.success.length}`);
  console.log(`  ❌ Failed:       ${results.failed.length}`);
  console.log('');

  if (isPreview) {
    console.log('  📋 This was a PREVIEW run - no changes were made to the database.');
    console.log('  Run with --execute to insert drafts.');
  } else {
    console.log('  📝 Drafts have been inserted with verification_status = "pending"');
    console.log('  View them at: /admin/posts or /admin/drafts');
  }

  console.log('');
  console.log('  SECTORS COVERED:');
  const sectors = [...new Set(results.success.map(a => a.contentSector))];
  sectors.forEach(s => {
    const count = results.success.filter(a => a.contentSector === s).length;
    console.log(`    • ${s}: ${count} article(s)`);
  });

  console.log('════════════════════════════════════════════════════════════════\n');

  if (results.failed.length > 0) {
    console.log('FAILED ARTICLES:');
    results.failed.forEach(f => {
      console.log(`  - ${f.article.title}: ${f.reason}`);
    });
  }
}

main().catch(console.error);

