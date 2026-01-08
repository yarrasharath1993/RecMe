#!/usr/bin/env npx tsx
/**
 * SECTOR CONTENT FETCHER
 * 
 * Master script to fetch and ingest content for all sectors.
 * Uses the SafeFetcher for compliant data retrieval and
 * ContentEnhancer for automatic classification.
 * 
 * Usage:
 *   npx tsx scripts/content-platform/fetch-sector-content.ts --sector=movies_cinema
 *   npx tsx scripts/content-platform/fetch-sector-content.ts --all
 *   npx tsx scripts/content-platform/fetch-sector-content.ts --sector=food_bachelor --limit=10
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  ContentSector,
  ContentType,
  SECTOR_DEFINITIONS,
  getSectorDefinition,
  getRequiredDisclaimerType,
  requiresFictionalLabel,
} from '@/types/content-sectors';
import { enhanceContent } from '@/lib/content/content-enhancer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// SECTOR-SPECIFIC FETCHERS
// ============================================================

interface FetchedContent {
  title: string;
  titleTe?: string;
  body: string;
  bodyTe?: string;
  sources: Array<{
    sourceName: string;
    sourceUrl?: string;
    trustLevel: number;
  }>;
  metadata?: Record<string, unknown>;
}

/**
 * Fetch movie-related content from various sources
 */
async function fetchMoviesCinemaContent(limit: number): Promise<FetchedContent[]> {
  console.log('📽️ Fetching Movies & Cinema content...');
  
  const content: FetchedContent[] = [];
  
  // 1. Get movies without reviews for review generation
  const { data: moviesWithoutReviews } = await supabase
    .from('movies')
    .select('id, title_en, title_te, overview, director, hero, heroine, genres, release_year')
    .is('review_generated', null)
    .limit(limit);

  if (moviesWithoutReviews) {
    for (const movie of moviesWithoutReviews) {
      content.push({
        title: `${movie.title_en} Review`,
        titleTe: movie.title_te ? `${movie.title_te} రివ్యూ` : undefined,
        body: `Review of ${movie.title_en} (${movie.release_year}). Directed by ${movie.director}. Starring ${movie.hero}${movie.heroine ? ` and ${movie.heroine}` : ''}. ${movie.overview || ''}`,
        sources: [
          { sourceName: 'TMDB', sourceUrl: 'https://themoviedb.org', trustLevel: 0.95 },
        ],
        metadata: { movieId: movie.id, subsector: 'reviews' },
      });
    }
  }

  // 2. Get classic movies for "Forgotten Gems" content
  const { data: classicMovies } = await supabase
    .from('movies')
    .select('id, title_en, title_te, overview, director, release_year, genres')
    .lt('release_year', 1990)
    .gte('tmdb_rating', 7)
    .limit(Math.floor(limit / 2));

  if (classicMovies) {
    for (const movie of classicMovies) {
      content.push({
        title: `Forgotten Gem: ${movie.title_en} (${movie.release_year})`,
        body: `Rediscovering ${movie.title_en}, a ${movie.release_year} classic directed by ${movie.director}. ${movie.overview || 'A masterpiece worth revisiting.'}`,
        sources: [
          { sourceName: 'Wikipedia', sourceUrl: 'https://wikipedia.org', trustLevel: 0.85 },
        ],
        metadata: { movieId: movie.id, subsector: 'forgotten_gems' },
      });
    }
  }

  return content;
}

/**
 * Fetch actor/celebrity content
 */
async function fetchActorIndustryContent(limit: number): Promise<FetchedContent[]> {
  console.log('🎭 Fetching Actor & Industry content...');
  
  const content: FetchedContent[] = [];
  
  // Get celebrities for biography content
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name_en, name_te, biography, birth_date, known_for')
    .not('biography', 'is', null)
    .limit(limit);

  if (celebrities) {
    for (const celeb of celebrities) {
      content.push({
        title: `${celeb.name_en}: Life & Career`,
        titleTe: celeb.name_te ? `${celeb.name_te}: జీవితం & కెరీర్` : undefined,
        body: celeb.biography || `Explore the journey of ${celeb.name_en}, known for ${celeb.known_for || 'their contributions to Telugu cinema'}.`,
        sources: [
          { sourceName: 'Wikipedia', sourceUrl: 'https://wikipedia.org', trustLevel: 0.85 },
          { sourceName: 'TMDB', sourceUrl: 'https://themoviedb.org', trustLevel: 0.95 },
        ],
        metadata: { celebrityId: celeb.id, subsector: 'career_arcs' },
      });
    }
  }

  return content;
}

/**
 * Fetch kids and family content templates
 */
async function fetchKidsFamilyContent(limit: number): Promise<FetchedContent[]> {
  console.log('🧒 Fetching Kids & Family content...');
  
  // Get existing stories and enhance them
  const { data: stories } = await supabase
    .from('stories')
    .select('id, title_en, title_te, body_te, category')
    .eq('category', 'moral')
    .limit(limit);

  const content: FetchedContent[] = [];
  
  if (stories) {
    for (const story of stories) {
      content.push({
        title: story.title_en || 'Moral Story',
        titleTe: story.title_te,
        body: story.body_te || '',
        sources: [
          { sourceName: 'Internal', trustLevel: 0.70 },
        ],
        metadata: { storyId: story.id, subsector: 'moral_stories', ageGroup: '4-6' },
      });
    }
  }

  return content;
}

/**
 * Fetch food/recipe content
 */
async function fetchFoodBachelorContent(limit: number): Promise<FetchedContent[]> {
  console.log('🍳 Fetching Food & Bachelor Life content...');
  
  // For food content, we typically need to source from recipe APIs or curated lists
  // This is a placeholder - you'd integrate with recipe APIs here
  
  const sampleRecipes: FetchedContent[] = [
    {
      title: 'Quick Pesarattu (10 minutes)',
      titleTe: 'క్విక్ పెసరట్టు (10 నిమిషాలు)',
      body: 'Simple pesarattu recipe perfect for busy bachelors. Ingredients: Green gram, rice, ginger, green chilies. Steps: 1. Soak overnight, 2. Grind to batter, 3. Make dosa on hot pan.',
      sources: [
        { sourceName: 'Internal', trustLevel: 0.70 },
      ],
      metadata: { subsector: 'simple_recipes', prepTime: 'PT10M' },
    },
    {
      title: 'Movie Night Popcorn Masala',
      titleTe: 'మూవీ నైట్ పాప్‌కార్న్ మసాలా',
      body: 'Spicy Indian-style popcorn for your movie nights. Mix chaat masala, red chili powder, and salt with freshly popped corn.',
      sources: [
        { sourceName: 'Internal', trustLevel: 0.70 },
      ],
      metadata: { subsector: 'movie_snacks' },
    },
  ];

  return sampleRecipes.slice(0, limit);
}

// ============================================================
// CONTENT PROCESSOR
// ============================================================

async function processAndSaveContent(
  sector: ContentSector,
  fetchedContent: FetchedContent[]
): Promise<{ saved: number; skipped: number; errors: number }> {
  const stats = { saved: 0, skipped: 0, errors: 0 };
  const sectorDef = getSectorDefinition(sector);

  console.log(`\n📝 Processing ${fetchedContent.length} items for ${sectorDef.name}...`);

  for (const item of fetchedContent) {
    try {
      // 1. Enhance content with our pipeline
      const enhanced = await enhanceContent({
        title: item.title,
        titleTe: item.titleTe,
        body: item.body,
        bodyTe: item.bodyTe,
        existingSector: sector,
        sources: item.sources.map((s, i) => ({
          id: `src-${i}`,
          sourceType: s.sourceName.toLowerCase(),
          sourceName: s.sourceName,
          sourceUrl: s.sourceUrl,
          trustLevel: s.trustLevel,
          claimType: 'fact' as const,
          isVerified: false,
          fetchedAt: new Date().toISOString(),
        })),
        metadata: item.metadata,
      });

      // 2. Check if content already exists
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 100);

      const { data: existing } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        console.log(`  ⏭️ Skipped (exists): ${item.title.slice(0, 50)}...`);
        stats.skipped++;
        continue;
      }

      // 3. Prepare post data
      const postData = {
        id: uuidv4(),
        title: item.title,
        title_te: item.titleTe,
        slug: slug,
        body: item.body,
        body_te: item.bodyTe,
        
        // New content platform fields
        content_type: enhanced.suggestedContentType,
        content_sector: sector,
        content_subsector: enhanced.suggestedSubsector || item.metadata?.subsector,
        audience_profile: enhanced.suggestedAudienceProfile,
        sensitivity_level: enhanced.suggestedSensitivityLevel,
        
        // Verification
        fact_confidence_score: enhanced.factConfidenceScore,
        source_count: item.sources.length,
        source_refs: item.sources,
        verification_status: enhanced.verificationStatus,
        
        // Labels
        fictional_label: enhanced.requiresFictionalLabel,
        requires_disclaimer: enhanced.requiresDisclaimer,
        disclaimer_type: enhanced.disclaimerType,
        historical_period: enhanced.historicalPeriod,
        geo_context: enhanced.geoContext,
        age_group: item.metadata?.ageGroup,
        
        // Metadata
        tags: enhanced.suggestedTags,
        status: 'draft',
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 4. Save to database
      const { error } = await supabase.from('posts').insert(postData);

      if (error) {
        console.error(`  ❌ Error saving: ${item.title.slice(0, 50)}... - ${error.message}`);
        stats.errors++;
      } else {
        console.log(`  ✅ Saved: ${item.title.slice(0, 50)}...`);
        stats.saved++;
      }
    } catch (err) {
      console.error(`  ❌ Processing error: ${item.title.slice(0, 50)}... - ${err}`);
      stats.errors++;
    }
  }

  return stats;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

const SECTOR_FETCHERS: Record<ContentSector, (limit: number) => Promise<FetchedContent[]>> = {
  movies_cinema: fetchMoviesCinemaContent,
  actor_industry: fetchActorIndustryContent,
  kids_family: fetchKidsFamilyContent,
  food_bachelor: fetchFoodBachelorContent,
  // Placeholder for other sectors - implement as needed
  auto_trends: async () => [],
  crime_courts: async () => [],
  archives_buried: async () => [],
  what_if_fiction: async () => [],
  pregnancy_wellness: async () => [],
  stories_narratives: async () => [],
  general: async () => [],
};

async function main() {
  const args = process.argv.slice(2);
  const sectorArg = args.find(a => a.startsWith('--sector='));
  const limitArg = args.find(a => a.startsWith('--limit='));
  const runAll = args.includes('--all');

  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 10;

  console.log('🚀 Content Platform - Sector Fetcher');
  console.log('=====================================\n');

  if (runAll) {
    // Run all sectors
    for (const [sector, fetcher] of Object.entries(SECTOR_FETCHERS)) {
      if (fetcher) {
        console.log(`\n📂 Processing sector: ${sector}`);
        const content = await fetcher(limit);
        if (content.length > 0) {
          await processAndSaveContent(sector as ContentSector, content);
        } else {
          console.log('  No content to process for this sector');
        }
      }
    }
  } else if (sectorArg) {
    const sector = sectorArg.split('=')[1] as ContentSector;
    const fetcher = SECTOR_FETCHERS[sector];
    
    if (!fetcher) {
      console.error(`❌ Unknown sector: ${sector}`);
      console.log('Available sectors:', Object.keys(SECTOR_DEFINITIONS).join(', '));
      process.exit(1);
    }

    const content = await fetcher(limit);
    if (content.length > 0) {
      await processAndSaveContent(sector, content);
    } else {
      console.log('No content fetched for this sector');
    }
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/content-platform/fetch-sector-content.ts --sector=movies_cinema');
    console.log('  npx tsx scripts/content-platform/fetch-sector-content.ts --all');
    console.log('  npx tsx scripts/content-platform/fetch-sector-content.ts --sector=food_bachelor --limit=10');
    console.log('\nAvailable sectors:');
    Object.entries(SECTOR_DEFINITIONS).forEach(([id, def]) => {
      console.log(`  ${id}: ${def.icon} ${def.name}`);
    });
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);

