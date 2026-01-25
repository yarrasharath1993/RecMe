#!/usr/bin/env npx tsx
/**
 * TEST MULTI-SOURCE VALIDATION
 * 
 * Demonstrates the new multi-source image validation system.
 * Shows before/after audit records with source trace and license trace.
 * 
 * Usage:
 *   npx tsx scripts/test-multi-source-validation.ts
 */

import { 
  IMAGE_SOURCE_REGISTRY, 
  getBaselineSource, 
  getValidateOnlySources,
  getIngestSources 
} from './lib/image-source-registry';
import { validateImageLicense } from './lib/license-validator';
import { 
  compareAgainstValidateSources,
  calculateMultiSourceConfidence 
} from './lib/image-comparator';
import { createAuditRecord } from './lib/audit-logger';

console.log('\n='.repeat(70));
console.log('MULTI-SOURCE IMAGE VALIDATION TEST');
console.log('='.repeat(70));
console.log('');

// 1. Show source registry
console.log('📚 Source Registry:');
console.log('');
const baseline = getBaselineSource();
console.log(`Baseline: ${baseline?.name} (trust: ${baseline?.trust_weight})`);
console.log('');

const validateOnly = getValidateOnlySources();
console.log(`Validate-Only Sources (${validateOnly.length}):`);
validateOnly.forEach(src => {
  console.log(`  - ${src.name} (trust: ${src.trust_weight}, storage: ${src.storage_allowed ? 'YES' : 'NO'})`);
});
console.log('');

const ingest = getIngestSources();
console.log(`Ingest Sources (${ingest.length}):`);
ingest.forEach(src => {
  console.log(`  - ${src.name} (trust: ${src.trust_weight}, license required: ${src.license_required ? 'YES' : 'NO'})`);
});
console.log('');

// 2. Demonstrate execution flow
console.log('='.repeat(70));
console.log('EXECUTION FLOW EXAMPLE');
console.log('='.repeat(70));
console.log('');

console.log('Movie: "Mayabazar" (1957)');
console.log('');

console.log('Phase 1: Baseline (TMDB)');
console.log('  ✓ TMDB found poster: https://image.tmdb.org/t/p/w500/abc123.jpg');
console.log('  Confidence: 0.95');
console.log('');

console.log('Phase 2: Validate-Only (Parallel)');
console.log('  → Fetching IMPAwards...');
console.log('  → Fetching Letterboxd...');
console.log('  ✓ IMPAwards confirmed (same poster) - NOT stored');
console.log('  ✓ Letterboxd confirmed (same poster) - NOT stored');
console.log('');

console.log('Phase 3: Ingest/Enrich (With license validation)');
console.log('  → Checking Openverse...');
console.log('  → Checking Wikimedia...');
console.log('  ⚠️  No additional sources found');
console.log('');

// 3. Show confidence calculation
console.log('='.repeat(70));
console.log('CONFIDENCE CALCULATION');
console.log('='.repeat(70));
console.log('');

const baselineUrl = 'https://image.tmdb.org/t/p/w500/abc123.jpg';
const validateOnlyImages = [
  { url: 'https://impawards.com/1957/mayabazar.jpg', source: 'impawards' },
  { url: 'https://letterboxd.com/film/mayabazar/image/poster.jpg', source: 'letterboxd' },
];

const comparison = compareAgainstValidateSources(
  baselineUrl,
  'tmdb',
  validateOnlyImages
);

console.log(`Base confidence: 0.95`);
console.log(`Validate-only boost: +${comparison.total_confidence_boost.toFixed(2)}`);
console.log(`Confirmed by: ${comparison.confirmed_by.join(', ')}`);
console.log(`Final confidence: ${(0.95 + comparison.total_confidence_boost).toFixed(2)}`);
console.log('');

// 4. Show before/after audit record
console.log('='.repeat(70));
console.log('BEFORE/AFTER AUDIT RECORD');
console.log('='.repeat(70));
console.log('');

console.log('BEFORE (Current System):');
console.log(JSON.stringify({
  movie_id: 'abc-123',
  poster_url: 'https://image.tmdb.org/t/p/w500/abc123.jpg',
  poster_confidence: 0.95,
  archival_source: {
    source_name: 'tmdb',
    acquisition_date: '2026-01-15',
  },
}, null, 2));
console.log('');

console.log('AFTER (Multi-Source System):');
const newRecord = createAuditRecord(
  'abc-123',
  'Mayabazar',
  1957,
  'https://image.tmdb.org/t/p/w500/abc123.jpg',
  'tmdb',
  0.95,
  ['impawards', 'letterboxd'],
  ['impawards', 'letterboxd'],
  ['openverse', 'wikimedia'],
  null,
  2,
  'attribution',
  true,
  null,
  true,
  0.95,
  0.05,
  0.00,
  1.00,
  false,
  true,
  'TMDB baseline with validate-only confirmation',
  false
);

console.log(JSON.stringify({
  movie_id: newRecord.movie_id,
  poster_url: newRecord.image_url,
  poster_confidence: newRecord.confidence_breakdown.final_score,
  archival_source: {
    source_name: newRecord.source_trace.baseline,
    source_type: 'database',
    license_type: newRecord.license_trace.license_type,
    acquisition_date: newRecord.timestamp,
    validate_only_confirmed_by: newRecord.source_trace.validate_only_confirmed,
    multi_source_agreement: newRecord.source_trace.agreement_count,
    license_verified: newRecord.license_trace.license_verified,
  },
  license_warning: newRecord.license_trace.license_warning,
}, null, 2));
console.log('');

// 5. Show key differences
console.log('='.repeat(70));
console.log('KEY IMPROVEMENTS');
console.log('='.repeat(70));
console.log('');

console.log('✅ Validate-only sources confirm without storage');
console.log('✅ Multi-source agreement boosts confidence');
console.log('✅ License validation with permissive warnings');
console.log('✅ Full source trace for audit trail');
console.log('✅ AI-generated content detection and capping');
console.log('');

console.log('='.repeat(70));
console.log('USAGE');
console.log('='.repeat(70));
console.log('');
console.log('Run the refactored waterfall script:');
console.log('  npx tsx scripts/enrich-waterfall.ts --limit=10');
console.log('  npx tsx scripts/enrich-waterfall.ts --limit=10 --execute');
console.log('');
console.log('The script now implements:');
console.log('  1. Phase 1: TMDB baseline');
console.log('  2. Phase 2: Validate-only sources (parallel)');
console.log('  3. Phase 3: Ingest/enrich with license validation');
console.log('  4. Multi-source confidence calculation');
console.log('  5. Enhanced audit logging');
console.log('');
