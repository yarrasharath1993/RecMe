/**
 * CELEBRITY ENRICHMENT WATERFALL SCRIPT
 * 
 * Multi-source enrichment with fallbacks:
 * 1. TMDB Person API - Bio, image, filmography
 * 2. Wikipedia - Full bio, education, family
 * 3. Wikidata SPARQL - Awards, structured data
 * 4. AI (Groq) - Trivia, nicknames, signature style
 * 
 * Usage:
 *   npx tsx scripts/enrich-celebrity-waterfall.ts --limit=20 --dry
 *   npx tsx scripts/enrich-celebrity-waterfall.ts --top=50
 *   npx tsx scripts/enrich-celebrity-waterfall.ts --slug=chiranjeevi
 *   npx tsx scripts/enrich-celebrity-waterfall.ts --pending
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

import { enrichCelebrity } from '../lib/celebrity/enrichment';
import { detectMilestones, calculateCareerStats, classifyEra } from '../lib/celebrity/milestone-detector';
import { fetchWikipediaAwards, calculateAwardsSummary } from '../lib/celebrity/awards-parser';
import type { CelebrityProfile, CelebrityAward, CelebrityTrivia, CelebrityMilestone } from '../lib/celebrity/types';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================
// FETCH CELEBRITIES
// ============================================================

async function fetchCelebrities(options: {
  limit?: number;
  top?: number;
  slug?: string;
  pending?: boolean;
}): Promise<CelebrityProfile[]> {
  let query = supabase
    .from('celebrities')
    .select('*')
    .eq('is_active', true);

  if (options.slug) {
    query = query.eq('slug', options.slug);
  } else if (options.pending) {
    query = query.or('enrichment_status.is.null,enrichment_status.eq.pending');
  }

  if (options.top) {
    query = query.order('popularity_score', { ascending: false }).limit(options.top);
  } else if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(chalk.red('Error fetching celebrities:'), error.message);
    return [];
  }

  return data || [];
}

// ============================================================
// FETCH CELEBRITY'S MOVIES
// ============================================================

async function fetchCelebrityMovies(celebrityName: string): Promise<any[]> {
  // Search for movies where this celebrity is hero, heroine, or director
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, our_rating, verdict, box_office_category, is_blockbuster, genres, slug')
    .or(`hero.ilike.%${celebrityName}%,heroine.ilike.%${celebrityName}%,director.ilike.%${celebrityName}%`)
    .eq('is_published', true)
    .order('release_year', { ascending: true });

  if (error) {
    console.error(chalk.yellow(`  Error fetching movies for ${celebrityName}:`), error.message);
    return [];
  }

  return data || [];
}

// ============================================================
// SAVE ENRICHMENT DATA
// ============================================================

async function saveEnrichmentData(
  celebrity: CelebrityProfile,
  enrichmentData: any,
  awards: CelebrityAward[],
  trivia: CelebrityTrivia[],
  milestones: CelebrityMilestone[],
  stats: ReturnType<typeof calculateCareerStats>,
  dryRun: boolean
): Promise<boolean> {
  if (dryRun) {
    console.log(chalk.gray(`  [DRY RUN] Would update celebrity and related data`));
    return true;
  }

  try {
    // 1. Update celebrity profile
    const updateData: Record<string, any> = {
      enrichment_status: 'complete',
      last_enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Merge enrichment data, preferring existing values
    if (enrichmentData.short_bio && !celebrity.short_bio) updateData.short_bio = enrichmentData.short_bio;
    if (enrichmentData.full_bio && !celebrity.full_bio) updateData.full_bio = enrichmentData.full_bio;
    if (enrichmentData.birth_date && !celebrity.birth_date) updateData.birth_date = enrichmentData.birth_date;
    if (enrichmentData.birth_place && !celebrity.birth_place) updateData.birth_place = enrichmentData.birth_place;
    if (enrichmentData.profile_image && !celebrity.profile_image) updateData.profile_image = enrichmentData.profile_image;
    if (enrichmentData.tmdb_id && !celebrity.tmdb_id) updateData.tmdb_id = enrichmentData.tmdb_id;
    if (enrichmentData.imdb_id && !celebrity.imdb_id) updateData.imdb_id = enrichmentData.imdb_id;
    if (enrichmentData.wikidata_id && !celebrity.wikidata_id) updateData.wikidata_id = enrichmentData.wikidata_id;
    if (enrichmentData.wikipedia_url && !celebrity.wikipedia_url) updateData.wikipedia_url = enrichmentData.wikipedia_url;
    if (enrichmentData.spouse && !celebrity.spouse) updateData.spouse = enrichmentData.spouse;
    if (enrichmentData.education && !celebrity.education) updateData.education = enrichmentData.education;
    if (enrichmentData.nicknames?.length) updateData.nicknames = enrichmentData.nicknames;
    if (enrichmentData.known_for?.length) updateData.known_for = enrichmentData.known_for;
    if (enrichmentData.signature_style) updateData.signature_style = enrichmentData.signature_style;

    // Update stats
    updateData.total_movies = stats.total;
    updateData.hits_count = stats.hits;
    updateData.flops_count = stats.flops;
    updateData.hit_rate = stats.hitRate;
    updateData.awards_count = awards.filter(a => a.is_won).length;

    // Find debut and peak
    const debutMilestone = milestones.find(m => m.milestone_type === 'debut');
    const peakMilestone = milestones.find(m => m.milestone_type === 'peak');
    const breakthroughMilestone = milestones.find(m => m.milestone_type === 'breakthrough');

    if (debutMilestone?.movie_title) updateData.debut_movie = debutMilestone.movie_title;
    if (breakthroughMilestone?.movie_title) updateData.breakthrough_movie = breakthroughMilestone.movie_title;
    if (peakMilestone?.year) updateData.peak_year = peakMilestone.year;

    // Classify era
    updateData.era = classifyEra(debutMilestone?.year);

    const { error: updateError } = await supabase
      .from('celebrities')
      .update(updateData)
      .eq('id', celebrity.id);

    if (updateError) {
      console.error(chalk.red(`  Error updating celebrity:`), updateError.message);
      return false;
    }

    // 2. Insert awards
    if (awards.length > 0) {
      // First, delete existing awards to avoid duplicates
      await supabase
        .from('celebrity_awards')
        .delete()
        .eq('celebrity_id', celebrity.id);

      const { error: awardsError } = await supabase
        .from('celebrity_awards')
        .insert(awards.map(a => ({ ...a, celebrity_id: celebrity.id })));

      if (awardsError) {
        console.error(chalk.yellow(`  Warning: Could not insert awards:`), awardsError.message);
      }
    }

    // 3. Insert trivia
    if (trivia.length > 0) {
      // Delete existing trivia
      await supabase
        .from('celebrity_trivia')
        .delete()
        .eq('celebrity_id', celebrity.id);

      const { error: triviaError } = await supabase
        .from('celebrity_trivia')
        .insert(trivia.map(t => ({ ...t, celebrity_id: celebrity.id })));

      if (triviaError) {
        console.error(chalk.yellow(`  Warning: Could not insert trivia:`), triviaError.message);
      }
    }

    // 4. Insert milestones
    if (milestones.length > 0) {
      // Delete existing milestones
      await supabase
        .from('celebrity_milestones')
        .delete()
        .eq('celebrity_id', celebrity.id);

      const { error: milestonesError } = await supabase
        .from('celebrity_milestones')
        .insert(milestones);

      if (milestonesError) {
        console.error(chalk.yellow(`  Warning: Could not insert milestones:`), milestonesError.message);
      }
    }

    return true;
  } catch (error) {
    console.error(chalk.red(`  Error saving enrichment data:`), error);
    return false;
  }
}

// ============================================================
// MAIN FUNCTION
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0');
  const top = parseInt(args.find(a => a.startsWith('--top='))?.split('=')[1] || '0');
  const slug = args.find(a => a.startsWith('--slug='))?.split('=')[1];
  const pending = args.includes('--pending');

  console.log(chalk.blue('\n╔══════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue('║         CELEBRITY WATERFALL ENRICHMENT                           ║'));
  console.log(chalk.blue('╚══════════════════════════════════════════════════════════════════╝\n'));

  if (dryRun) {
    console.log(chalk.yellow('🔍 DRY RUN MODE - No changes will be made\n'));
  }

  // Fetch celebrities
  console.log(chalk.blue('Fetching celebrities...'));
  const celebrities = await fetchCelebrities({ limit, top, slug, pending });
  console.log(chalk.green(`  Found ${celebrities.length} celebrities to process\n`));

  if (celebrities.length === 0) {
    console.log(chalk.yellow('No celebrities found to process.'));
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < celebrities.length; i++) {
    const celebrity = celebrities[i];
    console.log(chalk.blue(`\n[${i + 1}/${celebrities.length}] Processing: ${celebrity.name_en}`));
    console.log(chalk.gray(`  Slug: ${celebrity.slug}, Current status: ${celebrity.enrichment_status || 'pending'}`));

    try {
      // 1. Enrich from external sources
      const enrichResult = await enrichCelebrity(celebrity as CelebrityProfile);

      // 2. Fetch movies for this celebrity
      console.log('  Fetching filmography...');
      const movies = await fetchCelebrityMovies(celebrity.name_en);
      console.log(`  ✓ Found ${movies.length} movies`);

      // 3. Detect career milestones
      console.log('  Detecting milestones...');
      const milestones = detectMilestones(celebrity as CelebrityProfile, movies);
      console.log(`  ✓ Detected ${milestones.length} milestones`);

      // 4. Calculate career stats
      const stats = calculateCareerStats(movies);
      console.log(`  ✓ Stats: ${stats.total} movies, ${stats.hits} hits, ${stats.hitRate}% hit rate`);

      // 5. Fetch Wikipedia awards
      console.log('  Fetching Wikipedia awards...');
      await delay(300);
      const wikiAwards = await fetchWikipediaAwards(celebrity.name_en, celebrity.id);
      
      // Merge with enrichment awards
      const allAwards = [...(enrichResult.data.awards || []), ...wikiAwards];
      const uniqueAwards = allAwards.filter((award, index, self) =>
        index === self.findIndex(a => 
          a.award_type === award.award_type && 
          a.category === award.category && 
          a.year === award.year
        )
      );
      console.log(`  ✓ Found ${uniqueAwards.length} awards`);

      // 6. Collect trivia
      const trivia = enrichResult.data.trivia || [];

      // 7. Save all data
      console.log('  Saving enrichment data...');
      const saved = await saveEnrichmentData(
        celebrity as CelebrityProfile,
        enrichResult.data,
        uniqueAwards,
        trivia,
        milestones,
        stats,
        dryRun
      );

      if (saved) {
        successCount++;
        console.log(chalk.green(`  ✓ Successfully enriched ${celebrity.name_en}`));
      } else {
        errorCount++;
      }

      // Rate limiting between celebrities
      await delay(500);
    } catch (error) {
      console.error(chalk.red(`  ✗ Error processing ${celebrity.name_en}:`), error);
      errorCount++;
    }
  }

  // Summary
  console.log(chalk.blue('\n══════════════════════════════════════════════════════════════════'));
  console.log(chalk.blue('SUMMARY'));
  console.log(chalk.blue('══════════════════════════════════════════════════════════════════\n'));
  console.log(`  Total processed: ${celebrities.length}`);
  console.log(chalk.green(`  Successful: ${successCount}`));
  console.log(chalk.red(`  Errors: ${errorCount}`));
  console.log(chalk.yellow(`  Skipped: ${skipCount}`));
  console.log(chalk.green('\n✅ Celebrity enrichment complete!\n'));
}

main().catch(console.error);


