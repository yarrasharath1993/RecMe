#!/usr/bin/env npx tsx
/**
 * VERIFY MULTI-SOURCE IMPLEMENTATION
 * 
 * Comprehensive verification that all components are integrated correctly.
 * Runs checks on registry, validators, comparators, and audit logger.
 * 
 * Usage:
 *   npx tsx scripts/verify-multi-source-implementation.ts
 */

import chalk from 'chalk';

async function main() {
  console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
  console.log(chalk.cyan.bold('MULTI-SOURCE VALIDATION - IMPLEMENTATION VERIFICATION'));
  console.log(chalk.cyan.bold('='.repeat(70) + '\n'));

  let allPassed = true;

// ============================================================
// TEST 1: Source Registry
// ============================================================
console.log(chalk.yellow('Test 1: Source Registry Configuration'));
try {
  const { 
    IMAGE_SOURCE_REGISTRY, 
    getBaselineSource, 
    getValidateOnlySources,
    getIngestSources,
    canStoreFromSource 
  } = await import('./lib/image-source-registry');
  
  const baseline = getBaselineSource();
  const validateOnly = getValidateOnlySources();
  const ingest = getIngestSources();
  
  console.log(chalk.green('  ✓ Registry loads correctly'));
  console.log(chalk.gray(`    Baseline: ${baseline?.name} (${baseline?.trust_weight})`));
  console.log(chalk.gray(`    Validate-only: ${validateOnly.length} sources`));
  console.log(chalk.gray(`    Ingest: ${ingest.length} sources`));
  
  // Verify validate-only sources cannot store
  const impawardsCanStore = canStoreFromSource('impawards');
  const letterboxdCanStore = canStoreFromSource('letterboxd');
  
  if (impawardsCanStore || letterboxdCanStore) {
    console.log(chalk.red('  ✗ ERROR: Validate-only sources allow storage!'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ Validate-only sources correctly configured (storage: false)'));
  }
  
  // Verify TMDB is baseline
  if (baseline?.id !== 'tmdb') {
    console.log(chalk.red('  ✗ ERROR: TMDB is not baseline!'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ TMDB correctly configured as baseline'));
  }
  
  console.log('');
} catch (error) {
  console.log(chalk.red(`  ✗ FAILED: ${error}`));
  allPassed = false;
}

// ============================================================
// TEST 2: License Validator
// ============================================================
console.log(chalk.yellow('Test 2: License Validator'));
try {
  const { validateImageLicense } = await import('./lib/license-validator');
  
  // Test TMDB license
  const tmdbResult = await validateImageLicense(
    'https://image.tmdb.org/t/p/w500/test.jpg',
    'tmdb'
  );
  
  console.log(chalk.green('  ✓ License validator loads correctly'));
  console.log(chalk.gray(`    TMDB license: ${tmdbResult.license_type} (verified: ${tmdbResult.license_verified})`));
  
  if (tmdbResult.license_type !== 'attribution') {
    console.log(chalk.red('  ✗ ERROR: TMDB license type incorrect'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ TMDB license correctly identified as attribution'));
  }
  
  // Test validate-only source (should block storage)
  const impawardsResult = await validateImageLicense(
    'https://impawards.com/test.jpg',
    'impawards'
  );
  
  if (impawardsResult.is_valid) {
    console.log(chalk.red('  ✗ ERROR: IMPAwards shows as valid (should be invalid for storage)'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ IMPAwards correctly blocked from storage'));
  }
  
  console.log('');
} catch (error) {
  console.log(chalk.red(`  ✗ FAILED: ${error}`));
  allPassed = false;
}

// ============================================================
// TEST 3: Image Comparator
// ============================================================
console.log(chalk.yellow('Test 3: Image Comparator'));
try {
  const { 
    compareImageUrls, 
    calculateMultiSourceConfidence 
  } = await import('./lib/image-comparator');
  
  console.log(chalk.green('  ✓ Image comparator loads correctly'));
  
  // Test exact URL match
  const exactMatch = compareImageUrls(
    'https://image.tmdb.org/t/p/w500/abc123.jpg',
    'https://image.tmdb.org/t/p/w500/abc123.jpg',
    'tmdb',
    'impawards'
  );
  
  if (exactMatch.match_type !== 'exact_url') {
    console.log(chalk.red('  ✗ ERROR: Exact URL match failed'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ Exact URL match works correctly'));
  }
  
  // Test confidence calculation
  const confidence = calculateMultiSourceConfidence(
    'https://image.tmdb.org/t/p/w500/test.jpg',
    'tmdb',
    0.95,
    [
      { url: 'https://impawards.com/test.jpg', source: 'impawards' },
      { url: 'https://letterboxd.com/test.jpg', source: 'letterboxd' },
    ],
    []
  );
  
  console.log(chalk.gray(`    Base: 0.95, Final: ${confidence.final_confidence.toFixed(2)}, Boost: +${confidence.validate_only_boost.toFixed(2)}`));
  
  if (confidence.final_confidence <= 0.95) {
    console.log(chalk.red('  ✗ ERROR: No confidence boost applied'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ Confidence boost works correctly'));
  }
  
  console.log('');
} catch (error) {
  console.log(chalk.red(`  ✗ FAILED: ${error}`));
  allPassed = false;
}

// ============================================================
// TEST 4: Audit Logger
// ============================================================
console.log(chalk.yellow('Test 4: Audit Logger'));
try {
  const { createAuditRecord } = await import('./lib/audit-logger');
  
  const record = createAuditRecord(
    'test-id',
    'Test Movie',
    2020,
    'https://image.tmdb.org/test.jpg',
    'tmdb',
    0.95,
    ['impawards', 'letterboxd'],
    ['impawards'],
    ['wikimedia', 'openverse'],
    'tmdb',
    1,
    'attribution',
    true,
    null,
    true,
    0.95,
    0.025,
    0.00,
    0.975,
    false,
    true,
    'Test record',
    true
  );
  
  console.log(chalk.green('  ✓ Audit logger loads correctly'));
  console.log(chalk.gray(`    Record created with ${record.source_trace.validate_only_confirmed.length} confirmations`));
  
  if (!record.source_trace || !record.license_trace || !record.confidence_breakdown) {
    console.log(chalk.red('  ✗ ERROR: Audit record missing required fields'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ Audit record structure is complete'));
  }
  
  console.log('');
} catch (error) {
  console.log(chalk.red(`  ✗ FAILED: ${error}`));
  allPassed = false;
}

// ============================================================
// TEST 5: Integration Check
// ============================================================
console.log(chalk.yellow('Test 5: Integration Check'));
try {
  // Verify all imports work together
  const registry = await import('./lib/image-source-registry');
  const validator = await import('./lib/license-validator');
  const comparator = await import('./lib/image-comparator');
  const logger = await import('./lib/audit-logger');
  
  console.log(chalk.green('  ✓ All modules load without conflicts'));
  
  // Verify waterfall script imports are valid
  console.log(chalk.gray('    Checking waterfall script integration...'));
  
  // Read waterfall script to check imports
  const { readFile } = await import('fs/promises');
  const waterfallContent = await readFile('./scripts/enrich-waterfall.ts', 'utf-8');
  
  const hasRegistryImport = waterfallContent.includes('image-source-registry');
  const hasValidatorImport = waterfallContent.includes('license-validator');
  const hasComparatorImport = waterfallContent.includes('image-comparator');
  
  if (!hasRegistryImport || !hasValidatorImport || !hasComparatorImport) {
    console.log(chalk.red('  ✗ ERROR: Waterfall script missing imports'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ Waterfall script has all required imports'));
  }
  
  // Check for 3-phase structure
  const hasPhase1 = waterfallContent.includes('Phase 1: Baseline');
  const hasPhase2 = waterfallContent.includes('Phase 2: Validate-Only');
  const hasPhase3 = waterfallContent.includes('Phase 3: Ingest/Enrich');
  
  if (!hasPhase1 || !hasPhase2 || !hasPhase3) {
    console.log(chalk.red('  ✗ ERROR: Waterfall script missing 3-phase structure'));
    allPassed = false;
  } else {
    console.log(chalk.green('  ✓ Waterfall script has 3-phase execution structure'));
  }
  
  console.log('');
} catch (error) {
  console.log(chalk.red(`  ✗ FAILED: ${error}`));
  allPassed = false;
}

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log(chalk.cyan.bold('='.repeat(70)));
  console.log(chalk.cyan.bold('VERIFICATION SUMMARY'));
  console.log(chalk.cyan.bold('='.repeat(70) + '\n'));

  if (allPassed) {
    console.log(chalk.green.bold('✅ ALL TESTS PASSED'));
    console.log(chalk.green('\nThe multi-source validation system is ready for production use.\n'));
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray('  1. Run migration: npx tsx scripts/run-migrations.ts'));
    console.log(chalk.gray('  2. Test on sample: npx tsx scripts/enrich-waterfall.ts --limit=5'));
    console.log(chalk.gray('  3. Execute batch: npx tsx scripts/enrich-waterfall.ts --limit=100 --execute'));
  } else {
    console.log(chalk.red.bold('❌ SOME TESTS FAILED'));
    console.log(chalk.red('\nPlease review the errors above and fix before using in production.\n'));
  }

  console.log('');
}

main().catch(console.error);
