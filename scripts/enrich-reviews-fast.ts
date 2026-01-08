#!/usr/bin/env npx tsx
/**
 * FAST BATCH REVIEW ENRICHMENT
 * 
 * Uses existing template systems and multi-source data for fast, cost-effective enrichment.
 * NO unnecessary AI calls - leverages factual sources first.
 * 
 * Strategy:
 * 1. Multi-source data: Wikipedia synopsis, OMDB ratings (FREE)
 * 2. Template-based reviews: Genre-specific Telugu templates (FREE)
 * 3. Smart derivation: Why watch/skip, mood, content warnings (FREE)
 * 4. AI only when needed: For synopsis generation when no data exists
 * 
 * Usage:
 *   npx tsx scripts/enrich-reviews-fast.ts --limit=100
 *   npx tsx scripts/enrich-reviews-fast.ts --limit=500 --execute
 *   npx tsx scripts/enrich-reviews-fast.ts --synopsis-only --limit=200 --execute
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { ExecutionController } from '../lib/pipeline/execution-controller';
import { generateTemplateReview, generateEnhancedTemplateReview } from '../lib/reviews/template-reviews';
import { deriveSmartReviewFields, getFieldsNeedingReview } from '../lib/reviews/smart-review-derivation';
import { gatherMultiSourceData } from '../lib/reviews/multi-source-data';

// ============================================================
// CONFIG
// ============================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', '200'));
const CONCURRENCY = parseInt(getArg('concurrency', '15'));
const EXECUTE = hasFlag('execute');
const SYNOPSIS_ONLY = hasFlag('synopsis-only');
const SMART_REVIEWS_ONLY = hasFlag('smart-reviews-only');
const FORCE = hasFlag('force');

interface Movie {
  id: string;
  title_en: string;
  title_te?: string;
  release_year?: number;
  genres?: string[];
  hero?: string;
  heroine?: string;
  director?: string;
  music_director?: string;
  synopsis?: string;
  synopsis_te?: string;
  avg_rating?: number;
  our_rating?: number;
  is_blockbuster?: boolean;
  is_classic?: boolean;
  is_underrated?: boolean;
  verdict?: string;
  certification?: string;
  tags?: string[];
  tmdb_id?: number;
}

interface EnrichmentResult {
  movieId: string;
  title: string;
  synopsisSource?: 'wikipedia' | 'tmdb' | 'template' | 'existing';
  synopsisAdded: boolean;
  smartReviewAdded: boolean;
  templateReviewAdded: boolean;
  error?: string;
}

// ============================================================
// SYNOPSIS ENRICHMENT (Multi-source first, template fallback)
// ============================================================

async function enrichSynopsis(movie: Movie): Promise<{
  synopsis?: string;
  synopsis_te?: string;
  source: 'wikipedia' | 'tmdb' | 'template' | 'existing';
}> {
  // Skip if already has synopsis
  if (movie.synopsis && movie.synopsis.length > 50 && !FORCE) {
    return { source: 'existing' };
  }

  // Try multi-source data first (Wikipedia)
  try {
    const multiSource = await gatherMultiSourceData(movie.id);
    if (multiSource?.synopsis?.text && multiSource.synopsis.wordCount >= 80) {
      return {
        synopsis: multiSource.synopsis.text,
        source: 'wikipedia',
      };
    }
  } catch (e) {
    // Multi-source failed, continue to template
  }

  // Template-based synopsis (genre-specific)
  const synopsis = generateTemplateSynopsis(movie);
  return {
    synopsis: synopsis.en,
    synopsis_te: synopsis.te,
    source: 'template',
  };
}

function generateTemplateSynopsis(movie: Movie): { en: string; te: string } {
  const genres = movie.genres || ['Drama'];
  const primaryGenre = genres[0] || 'Drama';
  const year = movie.release_year || '';
  const hero = movie.hero || 'the lead actor';
  const heroine = movie.heroine || 'the lead actress';
  const director = movie.director || 'a talented filmmaker';

  // Genre-specific templates in TeluguVibes style
  const templates: Record<string, { en: string; te: string }> = {
    Action: {
      en: `${movie.title_en} is a high-octane action entertainer directed by ${director}. ${hero} plays the lead role, delivering powerful action sequences and mass moments. The film features ${heroine} as the female lead. With its gripping screenplay and adrenaline-pumping scenes, this ${year} release promises to keep audiences on the edge of their seats.`,
      te: `${movie.title_te || movie.title_en} ఒక యాక్షన్ ఎంటర్‌టైనర్. ${director} దర్శకత్వం వహించిన ఈ చిత్రంలో ${hero} ప్రధాన పాత్రలో నటించారు. ${heroine} ఫీమేల్ లీడ్‌గా నటించారు. మాస్ మూమెంట్స్ మరియు పవర్‌ఫుల్ యాక్షన్ సీక్వెన్సులతో ప్రేక్షకులను అలరిస్తుంది.`,
    },
    Drama: {
      en: `${movie.title_en} is an emotional drama that explores the depths of human relationships. Directed by ${director}, the film stars ${hero} and ${heroine} in lead roles. This ${year} release weaves a compelling narrative about life, love, and the bonds that hold families together.`,
      te: `${movie.title_te || movie.title_en} ఒక భావోద్వేగ డ్రామా. ${director} దర్శకత్వం వహించిన ఈ చిత్రంలో ${hero}, ${heroine} ప్రధాన పాత్రల్లో నటించారు. కుటుంబ బంధాలు, ప్రేమ గురించి హృద్యమైన కథను చెబుతుంది.`,
    },
    Romance: {
      en: `${movie.title_en} is a heartwarming romantic tale directed by ${director}. ${hero} and ${heroine} share incredible chemistry as they navigate the journey of love. This ${year} release captures the essence of Telugu romance with beautiful songs and emotional moments.`,
      te: `${movie.title_te || movie.title_en} ఒక రొమాంటిక్ కథ. ${director} దర్శకత్వంలో ${hero}, ${heroine} మధ్య అందమైన ప్రేమ కథ నడుస్తుంది. మధురమైన పాటలు మరియు ఎమోషనల్ మూమెంట్స్‌తో ఈ చిత్రం ప్రేక్షకులను అలరిస్తుంది.`,
    },
    Comedy: {
      en: `${movie.title_en} is a fun-filled comedy entertainer directed by ${director}. ${hero} takes the lead with impeccable comic timing, supported by ${heroine} and a talented ensemble cast. This ${year} release guarantees laughter and entertainment for the whole family.`,
      te: `${movie.title_te || movie.title_en} ఒక కామెడీ ఎంటర్‌టైనర్. ${director} దర్శకత్వంలో ${hero} తన కామెడీ టైమింగ్‌తో నవ్వులు పంచుతారు. ${heroine} మరియు ఇతర నటులతో కలిసి ఫ్యామిలీ ఎంటర్‌టైన్‌మెంట్ అందిస్తుంది.`,
    },
    Thriller: {
      en: `${movie.title_en} is a gripping thriller that keeps viewers guessing until the end. Directed by ${director}, the film features ${hero} in a powerful role with ${heroine} as the female lead. This ${year} release delivers suspense, twists, and edge-of-seat moments.`,
      te: `${movie.title_te || movie.title_en} ఒక థ్రిల్లింగ్ సస్పెన్స్ చిత్రం. ${director} దర్శకత్వంలో ${hero} పవర్‌ఫుల్ పాత్రలో నటించారు. ట్విస్ట్‌లు మరియు సస్పెన్స్‌తో ప్రేక్షకులను థ్రిల్ చేస్తుంది.`,
    },
    Horror: {
      en: `${movie.title_en} is a spine-chilling horror film directed by ${director}. ${hero} and ${heroine} navigate through terrifying supernatural events. This ${year} release brings genuine scares and atmospheric tension to Telugu cinema.`,
      te: `${movie.title_te || movie.title_en} ఒక హారర్ చిత్రం. ${director} దర్శకత్వంలో ${hero}, ${heroine} నటించారు. భయానక సీన్లు మరియు సస్పెన్స్‌తో ప్రేక్షకులను భయపెడతుంది.`,
    },
    Fantasy: {
      en: `${movie.title_en} is a visual spectacle blending fantasy and drama. Directed by ${director}, the film stars ${hero} and ${heroine} in an imaginative world. This ${year} release showcases stunning VFX and creative storytelling.`,
      te: `${movie.title_te || movie.title_en} ఒక ఫాంటసీ చిత్రం. ${director} దర్శకత్వంలో ${hero}, ${heroine} నటించారు. అద్భుతమైన VFX మరియు ఇమాజినేటివ్ కథతో ప్రేక్షకులను అలరిస్తుంది.`,
    },
    Family: {
      en: `${movie.title_en} is a heartfelt family entertainer directed by ${director}. ${hero} and ${heroine} bring warmth to this story about relationships and values. This ${year} release is perfect for family viewing with its wholesome entertainment.`,
      te: `${movie.title_te || movie.title_en} ఒక ఫ్యామిలీ ఎంటర్‌టైనర్. ${director} దర్శకత్వంలో ${hero}, ${heroine} నటించారు. కుటుంబ విలువలు మరియు బంధాల గురించి హృద్యమైన కథ చెబుతుంది.`,
    },
  };

  return templates[primaryGenre] || templates.Drama;
}

// ============================================================
// SMART REVIEW DERIVATION
// ============================================================

async function enrichSmartReview(movie: Movie): Promise<{
  smartReview: any;
  needsHumanReview: boolean;
} | null> {
  try {
    const input = {
      movie: {
        id: movie.id,
        title_en: movie.title_en,
        release_year: movie.release_year,
        genres: movie.genres,
        hero: movie.hero,
        heroine: movie.heroine,
        director: movie.director,
        music_director: movie.music_director,
        certification: movie.certification,
        is_blockbuster: movie.is_blockbuster,
        is_classic: movie.is_classic,
        is_underrated: movie.is_underrated,
        avg_rating: movie.avg_rating || movie.our_rating,
        verdict: movie.verdict,
        tags: movie.tags,
      },
      review: null, // We'll derive from movie data
    };

    const smartReview = deriveSmartReviewFields(input);
    const fieldsNeedingReview = getFieldsNeedingReview(smartReview);

    return {
      smartReview,
      needsHumanReview: fieldsNeedingReview.length > 0,
    };
  } catch (e) {
    return null;
  }
}

// ============================================================
// MAIN ENRICHMENT
// ============================================================

async function enrichMovie(movie: Movie): Promise<EnrichmentResult> {
  const result: EnrichmentResult = {
    movieId: movie.id,
    title: movie.title_en,
    synopsisAdded: false,
    smartReviewAdded: false,
    templateReviewAdded: false,
  };

  try {
    // 1. Synopsis enrichment
    if (!SMART_REVIEWS_ONLY) {
      const synopsisResult = await enrichSynopsis(movie);
      result.synopsisSource = synopsisResult.source;

      if (synopsisResult.source !== 'existing' && synopsisResult.synopsis) {
        if (EXECUTE) {
          const updateData: any = { synopsis: synopsisResult.synopsis };
          if (synopsisResult.synopsis_te) {
            updateData.synopsis_te = synopsisResult.synopsis_te;
          }
          
          const { error } = await supabase
            .from('movies')
            .update(updateData)
            .eq('id', movie.id);

          if (!error) {
            result.synopsisAdded = true;
          }
        } else {
          result.synopsisAdded = true; // Would have been added
        }
      }
    }

    // 2. Smart review derivation
    if (!SYNOPSIS_ONLY) {
      const smartResult = await enrichSmartReview(movie);
      
      if (smartResult) {
        // Check if movie has a review record
        const { data: existingReview } = await supabase
          .from('movie_reviews')
          .select('id, smart_review')
          .eq('movie_id', movie.id)
          .single();

        if (existingReview) {
          // Update existing review with smart fields
          if (EXECUTE && (!existingReview.smart_review || FORCE)) {
            const { error } = await supabase
              .from('movie_reviews')
              .update({
                smart_review: smartResult.smartReview,
                smart_review_derived_at: new Date().toISOString(),
                needs_human_review: smartResult.needsHumanReview,
              })
              .eq('id', existingReview.id);

            if (!error) {
              result.smartReviewAdded = true;
            }
          } else if (!existingReview.smart_review || FORCE) {
            result.smartReviewAdded = true;
          }
        }
      }
    }

    return result;
  } catch (e: any) {
    result.error = e.message;
    return result;
  }
}

// ============================================================
// MAIN
// ============================================================

async function main(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║           FAST BATCH REVIEW ENRICHMENT                               ║');
  console.log('║     Template-based + Multi-source (Cost-effective)                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n');

  console.log(`Mode: ${EXECUTE ? '🔴 EXECUTE' : '🟡 DRY RUN'}`);
  console.log(`Limit: ${LIMIT} movies`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Synopsis Only: ${SYNOPSIS_ONLY}`);
  console.log(`Smart Reviews Only: ${SMART_REVIEWS_ONLY}`);
  console.log(`Force Regenerate: ${FORCE}\n`);

  // Fetch movies to process
  let query = supabase
    .from('movies')
    .select('id, title_en, title_te, release_year, genres, hero, heroine, director, music_director, synopsis, synopsis_te, avg_rating, our_rating, is_blockbuster, is_classic, is_underrated, verdict, certification, tags, tmdb_id')
    .eq('language', 'Telugu');

  if (!FORCE && !SMART_REVIEWS_ONLY) {
    // Get movies missing synopsis
    query = query.or('synopsis.is.null,synopsis.eq.');
  }

  query = query.order('release_year', { ascending: false }).limit(LIMIT);

  const { data: movies, error } = await query;

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  console.log(`Found ${movies?.length || 0} movies to process\n`);

  if (!movies || movies.length === 0) {
    console.log('✅ No movies need enrichment!');
    return;
  }

  // Process in parallel
  const controller = new ExecutionController({ concurrency: CONCURRENCY });
  const results: EnrichmentResult[] = [];
  let processed = 0;

  const batchResult = await controller.batchProcess(
    movies as Movie[],
    async (movie: Movie) => {
      const result = await enrichMovie(movie);
      results.push(result);
      processed++;

      // Progress indicator
      if (processed % 50 === 0 || processed === movies.length) {
        const synopsisAdded = results.filter(r => r.synopsisAdded).length;
        const smartAdded = results.filter(r => r.smartReviewAdded).length;
        console.log(`  [${processed}/${movies.length}] Synopsis: ${synopsisAdded}, Smart Reviews: ${smartAdded}`);
      }
      
      return result;
    }
  );

  // Summary
  const synopsisFromWiki = results.filter(r => r.synopsisSource === 'wikipedia').length;
  const synopsisFromTemplate = results.filter(r => r.synopsisSource === 'template').length;
  const synopsisExisting = results.filter(r => r.synopsisSource === 'existing').length;
  const synopsisAdded = results.filter(r => r.synopsisAdded).length;
  const smartAdded = results.filter(r => r.smartReviewAdded).length;
  const errors = results.filter(r => r.error).length;

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('📊 ENRICHMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log(`  Processed:         ${movies.length} movies`);
  console.log(`  Synopsis Added:    ${synopsisAdded}`);
  console.log(`    - From Wikipedia: ${synopsisFromWiki}`);
  console.log(`    - From Templates: ${synopsisFromTemplate}`);
  console.log(`    - Already Had:    ${synopsisExisting}`);
  console.log(`  Smart Reviews:     ${smartAdded}`);
  console.log(`  Errors:            ${errors}`);

  if (!EXECUTE && synopsisAdded > 0) {
    console.log('\n⚠️  DRY RUN - No changes made. Use --execute to apply.');
  } else if (EXECUTE && synopsisAdded > 0) {
    console.log('\n✅ Enrichment applied to database!');
  }

  // Show sample results
  console.log('\n📝 Sample Enriched Movies:');
  const samples = results.filter(r => r.synopsisAdded || r.smartReviewAdded).slice(0, 5);
  for (const sample of samples) {
    console.log(`  - ${sample.title} (Synopsis: ${sample.synopsisSource || 'N/A'})`);
  }
}

main().catch(console.error);

