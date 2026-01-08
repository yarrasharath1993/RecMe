/**
 * REVIEWS SECTIONS API
 * 
 * Returns auto-generated sections for the Reviews landing page.
 * All sections are data-driven - ZERO manual curation.
 * 
 * Modes:
 * - initial: Returns first 3 sections + spotlights (fast load)
 * - lazy: Returns remaining sections (loaded on scroll)
 * - all: Returns all sections (legacy, slower)
 * - category: Returns movies for a specific category (blockbusters, classics, hidden-gems)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllReviewSections, 
  getInitialSections,
  getLazySections,
  unifiedSearch,
  getBlockbusters,
  getClassics,
  getHiddenGems,
  SectionConfig 
} from '@/lib/reviews/section-intelligence';

// Cache for 5 minutes
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Search mode
  const search = searchParams.get('search');
  if (search) {
    const results = await unifiedSearch(search, 10);
    return NextResponse.json({ results }, { headers: CACHE_HEADERS });
  }

  // Config overrides (for admin tuning)
  const config: Partial<SectionConfig> = {};
  
  if (searchParams.get('recentDays')) {
    config.recentDays = parseInt(searchParams.get('recentDays')!);
  }
  if (searchParams.get('classicYearThreshold')) {
    config.classicYearThreshold = parseInt(searchParams.get('classicYearThreshold')!);
  }
  if (searchParams.get('language')) {
    config.language = searchParams.get('language')!;
  }

  // Mode: initial (fast), lazy (remaining), all (legacy), category (specific category)
  const mode = searchParams.get('mode') || 'all';
  const category = searchParams.get('category');

  try {
    let response;

    // Category mode - return movies for a specific category
    if (mode === 'category' && category) {
      let section;
      
      switch (category) {
        case 'blockbusters':
          section = await getBlockbusters(config as SectionConfig);
          break;
        case 'classics':
          section = await getClassics(config as SectionConfig);
          break;
        case 'hidden-gems':
          section = await getHiddenGems(config as SectionConfig);
          break;
        default:
          return NextResponse.json(
            { success: false, error: `Invalid category: ${category}` },
            { status: 400 }
          );
      }

      response = {
        success: true,
        category,
        movies: section.movies,
        title: section.title,
        mode: 'category',
        generatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json(response, { headers: CACHE_HEADERS });
    }

    if (mode === 'initial') {
      // Fast initial load - only 3 sections + spotlights
      const { sections, spotlights, hasMore, totalSections } = await getInitialSections(config);
      response = {
        success: true,
        sections,
        spotlights,
        hasMore,
        totalSections,
        mode: 'initial',
        config: {
          recentDays: config.recentDays || 60,
          classicYearThreshold: config.classicYearThreshold || 2000,
          language: config.language || 'Telugu',
        },
        generatedAt: new Date().toISOString(),
      };
    } else if (mode === 'lazy') {
      // Lazy load remaining sections + spotlights
      const { sections, spotlights } = await getLazySections(config);
      response = {
        success: true,
        sections,
        spotlights,
        mode: 'lazy',
        generatedAt: new Date().toISOString(),
      };
    } else {
      // Legacy: all sections at once
      const { sections, spotlights } = await getAllReviewSections(config);
      response = {
        success: true,
        sections,
        spotlights,
        mode: 'all',
        config: {
          recentDays: config.recentDays || 60,
          classicYearThreshold: config.classicYearThreshold || 2000,
          language: config.language || 'Telugu',
        },
        generatedAt: new Date().toISOString(),
      };
    }

    return NextResponse.json(response, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Error generating review sections:', error);
    return NextResponse.json(
      { error: 'Failed to generate sections' },
      { status: 500 }
    );
  }
}

