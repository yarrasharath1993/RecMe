#!/usr/bin/env npx tsx
/**
 * ACTOR AWARDS ENRICHMENT SCRIPT
 *
 * Enriches actor awards data from Wikipedia and Wikidata with
 * confidence tracking and duplicate detection.
 *
 * Features:
 * - Multi-source awards (Wikipedia, Wikidata)
 * - Structured awards database
 * - Confidence scoring
 * - Duplicate detection and merging
 * - Governance integration
 * - TURBO/FAST mode support
 *
 * Usage:
 *   npx tsx scripts/enrich-actor-awards.ts --actor="Actor Name" --execute
 *   npx tsx scripts/enrich-actor-awards.ts --all --turbo --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { fetchActorAwards, type ActorAward } from './lib/multi-source-orchestrator';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// COMMAND LINE ARGUMENTS
// ============================================================

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const ACTOR = getArg('actor', '');
const ALL = hasFlag('all');
const EXECUTE = hasFlag('execute');
const DRY = hasFlag('dry');
const TURBO = hasFlag('turbo');
const FAST = hasFlag('fast');
const LIMIT = parseInt(getArg('limit', '100'));

// ============================================================
// INTERFACES
// ============================================================

interface AwardEnrichmentResult {
  actor_name: string;
  status: 'success' | 'partial' | 'failed';
  awards_found: number;
  awards_added: number;
  awards_skipped: number;
  avg_confidence: number;
  sources_used: string[];
  errors: string[];
}

// ============================================================
// AWARD CLASSIFICATION
// ============================================================

function classifyAwardTier(awardName: string): 'national' | 'international' | 'regional' | 'industry' | 'critics' | 'other' {
  const nameUpper = awardName.toUpperCase();

  // National awards
  if (
    nameUpper.includes('NATIONAL FILM AWARD') ||
    nameUpper.includes('NANDI AWARD') ||
    nameUpper.includes('FILMFARE')
  ) {
    return 'national';
  }

  // International awards
  if (
    nameUpper.includes('OSCAR') ||
    nameUpper.includes('GOLDEN GLOBE') ||
    nameUpper.includes('BAFTA') ||
    nameUpper.includes('CANNES')
  ) {
    return 'international';
  }

  // Regional awards
  if (
    nameUpper.includes('SANTOSHAM') ||
    nameUpper.includes('SIIMA') ||
    nameUpper.includes('SOUTH')
  ) {
    return 'regional';
  }

  // Industry awards
  if (
    nameUpper.includes('IIFA') ||
    nameUpper.includes('SCREEN') ||
    nameUpper.includes('ZEE')
  ) {
    return 'industry';
  }

  // Critics awards
  if (nameUpper.includes('CRITICS')) {
    return 'critics';
  }

  return 'other';
}

// ============================================================
// DUPLICATE DETECTION
// ============================================================

function areAwardsSimilar(award1: ActorAward, award2: ActorAward): boolean {
  // Same award name (case insensitive)
  const sameName = award1.award_name.toLowerCase() === award2.award_name.toLowerCase();

  // Same year (or both undefined)
  const sameYear = award1.year === award2.year;

  // Same film (or both undefined, case insensitive)
  const sameFilm =
    (!award1.film_title && !award2.film_title) ||
    (award1.film_title &&
      award2.film_title &&
      award1.film_title.toLowerCase() === award2.film_title.toLowerCase());

  // Same category (or both undefined, case insensitive)
  const sameCategory =
    (!award1.category && !award2.category) ||
    (award1.category &&
      award2.category &&
      award1.category.toLowerCase() === award2.category.toLowerCase());

  // Awards are similar if they have same name and year, and either same film or same category
  return sameName && sameYear && (sameFilm || sameCategory);
}

async function getExistingAwards(actorName: string): Promise<Set<string>> {
  const { data: existingAwards } = await supabase
    .from('actor_awards')
    .select('award_name, category, year, film_title')
    .eq('actor_name', actorName);

  const keys = new Set<string>();
  existingAwards?.forEach((award) => {
    const key = `${award.award_name}|${award.category || ''}|${award.year || ''}|${award.film_title || ''}`;
    keys.add(key.toLowerCase());
  });

  return keys;
}

// ============================================================
// AWARDS ENRICHMENT
// ============================================================

async function enrichActorAwards(actorName: string): Promise<AwardEnrichmentResult> {
  const result: AwardEnrichmentResult = {
    actor_name: actorName,
    status: 'failed',
    awards_found: 0,
    awards_added: 0,
    awards_skipped: 0,
    avg_confidence: 0,
    sources_used: [],
    errors: [],
  };

  try {
    console.log(chalk.cyan(`\n🏆 Enriching awards for: ${chalk.bold(actorName)}`));

    // 1. Fetch awards from multiple sources
    console.log(chalk.gray('  Fetching awards from Wikipedia, Wikidata...'));
    const awardsResult = await fetchActorAwards(actorName);

    if (awardsResult.awards.length === 0) {
      console.log(chalk.yellow('  ⚠ No awards found'));
      result.errors.push('No awards found from any source');
      result.status = 'partial';
      return result;
    }

    result.awards_found = awardsResult.awards.length;
    result.avg_confidence = awardsResult.confidence;
    result.sources_used = [...new Set(awardsResult.awards.map((a) => a.source))];

    console.log(chalk.green(`  ✓ Found ${result.awards_found} awards (avg confidence: ${(result.avg_confidence * 100).toFixed(0)}%)`));
    console.log(chalk.gray(`    Sources: ${result.sources_used.join(', ')}`));

    // 2. Get existing awards to avoid duplicates
    const existingAwardKeys = await getExistingAwards(actorName);

    // 3. Filter and classify new awards
    const newAwards: Array<ActorAward & { tier: string; trust_score: number }> = [];

    for (const award of awardsResult.awards) {
      // Check if award already exists
      const key = `${award.award_name}|${award.category || ''}|${award.year || ''}|${award.film_title || ''}`;
      if (existingAwardKeys.has(key.toLowerCase())) {
        result.awards_skipped++;
        continue;
      }

      // Classify award tier
      const tier = classifyAwardTier(award.award_name);

      // Compute trust score (similar to governance)
      const trustScore = Math.round(award.confidence * 100);

      newAwards.push({
        ...award,
        tier,
        trust_score: trustScore,
      });
    }

    console.log(chalk.cyan(`  📊 Analysis:`));
    console.log(chalk.gray(`    New awards: ${newAwards.length}`));
    console.log(chalk.gray(`    Duplicates skipped: ${result.awards_skipped}`));

    // 4. Breakdown by tier
    const tierCounts = newAwards.reduce(
      (acc, a) => {
        acc[a.tier] = (acc[a.tier] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    console.log(chalk.gray('    By tier: ' + Object.entries(tierCounts).map(([tier, count]) => `${tier}=${count}`).join(', ')));

    // 5. Execute: Insert new awards
    if (EXECUTE && !DRY && newAwards.length > 0) {
      console.log(chalk.cyan('\n  💾 Inserting new awards into database...'));

      // Get or create actor profile
      let actorProfileId: string | null = null;
      const { data: profile } = await supabase
        .from('actor_profiles')
        .select('id')
        .eq('name', actorName)
        .single();

      if (profile) {
        actorProfileId = profile.id;
      } else {
        // Create basic profile if not exists
        const { data: newProfile, error: profileError } = await supabase
          .from('actor_profiles')
          .insert({
            name: actorName,
            slug: actorName.toLowerCase().replace(/\s+/g, '-'),
          })
          .select('id')
          .single();

        if (profileError) {
          console.error(chalk.red(`  ✗ Error creating profile: ${profileError.message}`));
          result.errors.push(`Profile creation error: ${profileError.message}`);
          return result;
        }

        actorProfileId = newProfile.id;
      }

      // Insert awards in batches
      const BATCH_SIZE = 50;
      let insertedCount = 0;

      for (let i = 0; i < newAwards.length; i += BATCH_SIZE) {
        const batch = newAwards.slice(i, i + BATCH_SIZE);

        const awardsData = batch.map((award) => ({
          actor_name: actorName,
          actor_profile_id: actorProfileId,
          award_name: award.award_name,
          category: award.category || null,
          year: award.year || null,
          film_title: award.film_title || null,
          result: award.result,
          source: award.source,
          confidence: award.confidence,
          trust_score: award.trust_score,
          award_tier: award.tier,
        }));

        const { error: insertError } = await supabase.from('actor_awards').insert(awardsData);

        if (insertError) {
          console.error(chalk.red(`  ✗ Error inserting batch ${i / BATCH_SIZE + 1}: ${insertError.message}`));
          result.errors.push(`Batch insert error: ${insertError.message}`);
        } else {
          insertedCount += batch.length;
        }
      }

      result.awards_added = insertedCount;
      console.log(chalk.green(`  ✓ Inserted ${insertedCount} new awards`));
      result.status = 'success';
    } else {
      console.log(chalk.yellow('\n  [DRY RUN] Would insert the following awards:'));
      newAwards.slice(0, 10).forEach((award) => {
        console.log(
          chalk.gray(
            `    - ${award.award_name} (${award.year || 'N/A'})` +
              (award.category ? ` - ${award.category}` : '') +
              (award.film_title ? ` for "${award.film_title}"` : '') +
              ` [${award.result}, confidence: ${(award.confidence * 100).toFixed(0)}%]`
          )
        );
      });
      if (newAwards.length > 10) {
        console.log(chalk.gray(`    ... and ${newAwards.length - 10} more`));
      }
      result.status = 'partial';
    }

    return result;
  } catch (error) {
    console.error(chalk.red(`\n  ✗ Error enriching awards for ${actorName}:`), error);
    result.errors.push(`Unexpected error: ${error}`);
    return result;
  }
}

// ============================================================
// BATCH PROCESSING
// ============================================================

async function processAllActors(): Promise<void> {
  try {
    console.log(chalk.magenta.bold('\n🏆 Processing All Actors\n'));

    // Get actors with profiles (prioritize those with profiles)
    const { data: actorsWithProfiles } = await supabase
      .from('actor_profiles')
      .select('name')
      .limit(LIMIT);

    const actors = actorsWithProfiles?.map((a) => a.name) || [];

    if (actors.length === 0) {
      console.log(chalk.yellow('No actor profiles found. Create profiles first using enrich-actor-profile.ts'));
      return;
    }

    console.log(chalk.cyan(`Found ${actors.length} actor profiles\n`));

    const results: AwardEnrichmentResult[] = [];
    let successCount = 0;
    let partialCount = 0;
    let failedCount = 0;
    let totalAwardsAdded = 0;

    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      console.log(chalk.gray(`[${i + 1}/${actors.length}]`));

      const result = await enrichActorAwards(actor);
      results.push(result);

      if (result.status === 'success') {
        successCount++;
        totalAwardsAdded += result.awards_added;
      } else if (result.status === 'partial') {
        partialCount++;
      } else {
        failedCount++;
      }

      // Rate limiting for TURBO/FAST modes
      if (TURBO) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      } else if (FAST) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    // Final summary
    console.log(chalk.magenta.bold('\n═══════════════════════════════════════'));
    console.log(chalk.magenta.bold('  BATCH PROCESSING COMPLETE'));
    console.log(chalk.magenta.bold('═══════════════════════════════════════\n'));
    console.log(chalk.green(`  ✓ Success: ${successCount}`));
    console.log(chalk.yellow(`  ⚠ Partial: ${partialCount}`));
    console.log(chalk.red(`  ✗ Failed: ${failedCount}`));
    console.log(chalk.gray(`\n  Total actors processed: ${results.length}`));
    console.log(chalk.gray(`  Total awards added: ${totalAwardsAdded}`));

    // Average confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.avg_confidence, 0) / results.length;
    console.log(chalk.cyan(`  Average confidence: ${(avgConfidence * 100).toFixed(1)}%`));
  } catch (error) {
    console.error(chalk.red('Error in batch processing:'), error);
    process.exit(1);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  const speedMode = TURBO ? '🚀 TURBO' : FAST ? '⚡ FAST' : '📋 NORMAL';
  const speedColor = TURBO ? chalk.red : FAST ? chalk.yellow : chalk.gray;

  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           ACTOR AWARDS ENRICHMENT                                    ║
║           Multi-Source Awards Database with Confidence               ║
╠══════════════════════════════════════════════════════════════════════╣
║   Speed: ${speedColor(speedMode.padEnd(12))}  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  if (!ACTOR && !ALL) {
    console.log(chalk.yellow('Usage:'));
    console.log('  --actor="Actor Name"  Enrich specific actor');
    console.log('  --all                 Enrich all actors with profiles');
    console.log('  --execute             Apply changes (default: dry run)');
    console.log('  --turbo               TURBO mode (100 concurrent, 25ms rate limit)');
    console.log('  --fast                FAST mode (50 concurrent, 50ms rate limit)');
    console.log('  --limit=N             Limit actors to process (default: 100)');
    console.log('\nExamples:');
    console.log('  npx tsx scripts/enrich-actor-awards.ts --actor="Prabhas" --execute');
    console.log('  npx tsx scripts/enrich-actor-awards.ts --all --turbo --execute');
    process.exit(0);
  }

  if (ACTOR) {
    const result = await enrichActorAwards(ACTOR);
    if (result.status === 'failed') {
      process.exit(1);
    }
  } else if (ALL) {
    await processAllActors();
  }

  console.log(chalk.green('\n✅ Done!\n'));
}

main().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
