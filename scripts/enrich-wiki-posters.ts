/**
 * Enhanced Wikipedia Poster Fetcher
 * 
 * Extracts poster images from Wikipedia articles using the MediaWiki API
 * Specifically targets the infobox poster images that exist for Telugu films
 * 
 * Example: https://en.wikipedia.org/wiki/Mantra_Dandam#/media/File:Mantra_Dandam.jpg
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WikiSearchResult {
  title: string;
  pageid: number;
}

interface WikiImageInfo {
  url: string;
  descriptionurl: string;
  width: number;
  height: number;
}

interface MovieToEnrich {
  id: string;
  title_en: string;
  release_year: number;
}

// Wikipedia domains to search (Telugu Wikipedia first for better coverage)
const WIKI_DOMAINS = [
  { domain: 'te.wikipedia.org', lang: 'Telugu' },
  { domain: 'en.wikipedia.org', lang: 'English' },
];

// Search Wikipedia for Telugu film article (both Telugu and English Wikipedia)
async function searchWikipedia(title: string, year: number): Promise<{ result: WikiSearchResult; domain: string } | null> {
  for (const wiki of WIKI_DOMAINS) {
    const searchQueries = wiki.lang === 'Telugu' 
      ? [title, `${title} (సినిమా)`, `${title} ${year}`]
      : [`${title} ${year} Telugu film`, `${title} ${year} film`, `${title} Telugu film`];

    for (const query of searchQueries) {
      try {
        const url = new URL(`https://${wiki.domain}/w/api.php`);
        url.searchParams.set('action', 'query');
        url.searchParams.set('list', 'search');
        url.searchParams.set('srsearch', query);
        url.searchParams.set('srlimit', '5');
        url.searchParams.set('format', 'json');
        url.searchParams.set('origin', '*');

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.query?.search?.length > 0) {
          // Filter to likely matches
          const matches = data.query.search.filter((r: WikiSearchResult) => {
            const t = r.title.toLowerCase();
            // For Telugu wiki, be more lenient
            if (wiki.lang === 'Telugu') {
              return !t.includes('జాబితా'); // Exclude list pages
            }
            return t.includes('film') || t.includes(year.toString()) || 
                   t.includes(title.toLowerCase());
          });
          
          if (matches.length > 0) {
            return { result: matches[0], domain: wiki.domain };
          }
        }
      } catch (error) {
        // Continue to next query
      }
    }
  }
  return null;
}

// Get images from Wikipedia article (poster from infobox)
async function getWikipediaImages(pageTitle: string, domain: string = 'en.wikipedia.org'): Promise<string | null> {
  try {
    // Method 1: Get images from page
    const url = new URL(`https://${domain}/w/api.php`);
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', pageTitle);
    url.searchParams.set('prop', 'images|pageimages');
    url.searchParams.set('piprop', 'original');
    url.searchParams.set('imlimit', '20');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const response = await fetch(url.toString());
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    
    // First try: pageimages (usually the main poster)
    if (page.original?.source) {
      const imgUrl = page.original.source;
      if (isValidPosterImage(imgUrl)) {
        return imgUrl;
      }
    }

    // Second try: Look through all images for poster-like ones
    const images = page.images || [];
    const posterCandidates = images.filter((img: any) => {
      const name = img.title.toLowerCase();
      // Filter to likely poster images
      return !name.includes('logo') && 
             !name.includes('icon') && 
             !name.includes('flag') &&
             !name.includes('map') &&
             !name.includes('commons-logo') &&
             !name.includes('wiki') &&
             (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png'));
    });

    // Get actual URLs for candidate images
    for (const img of posterCandidates.slice(0, 5)) {
      const imageUrl = await getImageUrl(img.title);
      if (imageUrl && isValidPosterImage(imageUrl)) {
        return imageUrl;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

// Get actual image URL from file title
async function getImageUrl(fileTitle: string): Promise<string | null> {
  try {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', fileTitle);
    url.searchParams.set('prop', 'imageinfo');
    url.searchParams.set('iiprop', 'url|size');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const response = await fetch(url.toString());
    const data = await response.json();

    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    const imageInfo = page.imageinfo?.[0];
    
    if (imageInfo?.url) {
      return imageInfo.url;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Check if image URL looks like a valid poster
function isValidPosterImage(url: string): boolean {
  const lower = url.toLowerCase();
  return !lower.includes('logo') &&
         !lower.includes('icon') &&
         !lower.includes('flag') &&
         !lower.includes('commons-logo') &&
         (lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png'));
}

// Main enrichment function
async function enrichMovieFromWikipedia(movie: MovieToEnrich): Promise<{
  success: boolean;
  posterUrl?: string;
  wikiTitle?: string;
  source?: string;
}> {
  // Search for Wikipedia article (both Telugu and English)
  const wikiResult = await searchWikipedia(movie.title_en, movie.release_year);
  if (!wikiResult) {
    return { success: false };
  }

  // Get poster image from article
  const posterUrl = await getWikipediaImages(wikiResult.result.title, wikiResult.domain);
  if (!posterUrl) {
    return { success: false, wikiTitle: wikiResult.result.title };
  }

  const source = wikiResult.domain === 'te.wikipedia.org' ? 'Telugu Wiki' : 'English Wiki';
  return {
    success: true,
    posterUrl,
    wikiTitle: wikiResult.result.title,
    source
  };
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 100;

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         WIKIPEDIA POSTER ENRICHMENT (te + en)                ║');
  console.log('║    Telugu Wikipedia → English Wikipedia cascade              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Limit: ${limit} movies\n`);

  // Get movies missing posters
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .is('poster_url', null)
    .order('release_year', { ascending: true })
    .limit(limit);

  if (error || !movies) {
    console.error('Failed to fetch movies:', error);
    process.exit(1);
  }

  console.log(`  Found ${movies.length} movies to process\n`);

  let enriched = 0;
  let failed = 0;
  const updates: { id: string; poster_url: string }[] = [];

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const progress = `[${i + 1}/${movies.length}]`;
    
    process.stdout.write(`  ${progress} ${movie.title_en} (${movie.release_year})... `);

    const result = await enrichMovieFromWikipedia(movie);
    
    if (result.success && result.posterUrl) {
      console.log(`✓ [${result.source}] ${result.wikiTitle}`);
      updates.push({ id: movie.id, poster_url: result.posterUrl });
      enriched++;
    } else if (result.wikiTitle) {
      console.log(`✗ Article found (${result.wikiTitle}) but no poster`);
      failed++;
    } else {
      console.log(`✗ No Wikipedia article found`);
      failed++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  // Apply updates
  if (!dryRun && updates.length > 0) {
    console.log(`\n  Applying ${updates.length} updates...`);
    for (const update of updates) {
      await supabase
        .from('movies')
        .update({ poster_url: update.poster_url })
        .eq('id', update.id);
    }
    console.log('  ✓ Updates applied');
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`  Processed: ${movies.length}`);
  console.log(`  Enriched:  ${enriched} (${((enriched/movies.length)*100).toFixed(1)}%)`);
  console.log(`  Failed:    ${failed}`);
  if (dryRun) {
    console.log('\n  Run with --execute to apply changes');
  }
  console.log('');
}

main().catch(console.error);

