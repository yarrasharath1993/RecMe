/**
 * MULTI-SOURCE ENRICHMENT WATERFALL
 * 
 * Cascading enrichment with fallbacks (9 sources):
 * 1. TMDB - Best source (gender-based cast, posters)
 * 2. Wikimedia Commons - Archival images (CC licensed)
 * 3. Internet Archive - Public domain materials
 * 4. OMDB - Requires IMDB ID (director, actors, poster)
 * 5. Wikidata - Structured data (director, cast with gender)
 * 6. Letterboxd - Community posters and director info
 * 7. Cinemaazi - Indian film archive
 * 8. Google KG - General info (description, image)
 * 9. AI Inference - Last resort for metadata (Groq)
 * 
 * Usage:
 *   npx tsx scripts/enrich-waterfall.ts --limit=20
 *   npx tsx scripts/enrich-waterfall.ts --ids=id1,id2,id3
 *   npx tsx scripts/enrich-waterfall.ts --execute
 *   npx tsx scripts/enrich-waterfall.ts --execute --propagate
 *   npx tsx scripts/enrich-waterfall.ts --execute --propagate --audit
 *   npx tsx scripts/enrich-waterfall.ts --actor=Krishna --execute  # Actor filmography
 * 
 * Advanced Options:
 *   npx tsx scripts/enrich-waterfall.ts --placeholders-only --execute
 *   npx tsx scripts/enrich-waterfall.ts --sources=wikimedia,internet_archive --limit=100
 *   npx tsx scripts/enrich-waterfall.ts --batch --limit=100 --auto-approve-above=0.8 --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { updatePerformanceNames } from '../lib/reviews/editorial-review-generator';
import { logChange } from './cast-change-audit';
import { getActorIdentifier } from './lib/actor-identifier';
import { 
  IMAGE_SOURCE_REGISTRY, 
  getBaselineSource, 
  getValidateOnlySources,
  getIngestSources,
  getEnrichSources,
  canStoreFromSource,
  requiresLicenseValidation 
} from './lib/image-source-registry';
import { validateImageLicense } from './lib/license-validator';
import { 
  compareAgainstValidateSources,
  compareIngestSources,
  calculateMultiSourceConfidence,
  detectAIGenerated 
} from './lib/image-comparator';

dotenv.config({ path: '.env.local' });

// Cross-validation helper - verifies hero attribution using TMDB Person ID
async function validateHeroAttribution(
  hero: string,
  tmdbId: number | null
): Promise<{ valid: boolean; suggestedHero?: string }> {
  if (!tmdbId) return { valid: true }; // Can't validate without TMDB ID
  
  const identifier = getActorIdentifier();
  const result = await identifier.verifyActorInMovie(hero, tmdbId);
  
  if (result.found) {
    return { valid: true };
  }
  
  // Actor not in cast - suggest the lead
  const topCast = await identifier.getMovieCast(tmdbId, 1);
  return { 
    valid: false, 
    suggestedHero: topCast[0]?.name 
  };
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;
const GOOGLE_KG_API_KEY = process.env.GOOGLE_KG_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_UNLIMITED;

// Wikidata SPARQL endpoint
const WIKIDATA_SPARQL = 'https://query.wikidata.org/sparql';

interface EnrichmentData {
  hero?: string;
  heroine?: string;
  director?: string;
  poster_url?: string;
  backdrop_url?: string;
  tmdb_id?: number;
  imdb_id?: string;
}

type EnrichmentSource = 'tmdb' | 'wikimedia' | 'internet_archive' | 'omdb' | 'wikidata' | 'google' | 'letterboxd' | 'cinemaazi' | 'ai' | 'none';

interface EnrichmentResult {
  movieId: string;
  title: string;
  year: number;
  source: EnrichmentSource;
  data: EnrichmentData;
  fieldsUpdated: string[];
}

// Source confidence scores for visual intelligence integration
const SOURCE_CONFIDENCE: Record<EnrichmentSource, number> = {
  tmdb: 0.95,
  wikimedia: 0.85,
  internet_archive: 0.75,
  omdb: 0.80,
  wikidata: 0.80,
  google: 0.70,
  letterboxd: 0.65,
  cinemaazi: 0.60,
  ai: 0.50,
  none: 0,
};

// Source types for archival tracking
const SOURCE_TYPES: Record<EnrichmentSource, string> = {
  tmdb: 'database',
  wikimedia: 'archive',
  internet_archive: 'archive',
  omdb: 'database',
  wikidata: 'database',
  google: 'search',
  letterboxd: 'community',
  cinemaazi: 'archive',
  ai: 'inference',
  none: 'none',
};

const SOURCE_LICENSES: Record<EnrichmentSource, string> = {
  tmdb: 'attribution',
  wikimedia: 'cc-by-sa',
  internet_archive: 'public_domain',
  omdb: 'attribution',
  wikidata: 'cc0',
  google: 'fair_use',
  letterboxd: 'fair_use',
  cinemaazi: 'editorial',
  ai: 'none',
  none: 'none',
};

// ============================================================
// SOURCE 1: TMDB
// ============================================================

async function tryTMDB(title: string, year: number): Promise<EnrichmentData | null> {
  if (!TMDB_API_KEY) return null;

  try {
    // Search for movie
    const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) return null;

    // Prefer Telugu movies
    const movie = searchData.results.find((m: any) => m.original_language === 'te') || searchData.results[0];
    
    const result: EnrichmentData = {
      tmdb_id: movie.id,
      poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
      backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
    };

    // Get credits
    const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_API_KEY}`;
    const creditsRes = await fetch(creditsUrl);
    const credits = await creditsRes.json();

    // Director
    const director = credits.crew?.find((c: any) => c.job === 'Director');
    if (director) result.director = director.name;

    // Hero (first male actor)
    const males = credits.cast?.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order) || [];
    if (males[0]) result.hero = males[0].name;

    // Heroine (first female actress)
    const females = credits.cast?.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order) || [];
    if (females[0]) result.heroine = females[0].name;

    // Only return if we got useful data
    if (result.director || result.hero || result.poster_url) {
      return result;
    }
    return null;
  } catch (e) {
    console.log('    TMDB error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// VALIDATE-ONLY SOURCES (Confirmation, no storage)
// ============================================================

async function tryIMPAwards(title: string, year: number): Promise<{ poster_url: string | null }> {
  try {
    // IMPAwards URL pattern: https://impawards.com/YEAR/movie_title.html
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const url = `https://www.impawards.com/${year}/${slug}.html`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TeluguPortal/1.0)' }
    });
    
    if (!res.ok) return { poster_url: null };
    
    const html = await res.text();
    
    // Extract poster from og:image or main poster div
    const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogMatch) {
      let posterUrl = ogMatch[1];
      if (!posterUrl.startsWith('http')) {
        posterUrl = `https://www.impawards.com${posterUrl}`;
      }
      console.log(`    IMPAwards: found poster (validate-only)`);
      return { poster_url: posterUrl };
    }
    
    return { poster_url: null };
  } catch (e) {
    console.log('    IMPAwards error:', (e as Error).message);
    return { poster_url: null };
  }
}

async function tryOpenverse(title: string, year: number): Promise<{ poster_url: string | null }> {
  try {
    // Openverse API search
    const query = `${title} ${year} poster`;
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&license=cc0,pdm,cc-by,cc-by-sa&mature=false`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!res.ok) return { poster_url: null };
    
    const data = await res.json();
    const results = data.results || [];
    
    if (results.length > 0 && results[0].url) {
      console.log(`    Openverse: found CC-licensed image`);
      return { poster_url: results[0].url };
    }
    
    return { poster_url: null };
  } catch (e) {
    console.log('    Openverse error:', (e as Error).message);
    return { poster_url: null };
  }
}

// ============================================================
// SOURCE 2: WIKIMEDIA COMMONS (NEW)
// ============================================================

async function tryWikimediaCommons(title: string, year: number): Promise<EnrichmentData | null> {
  try {
    // Search Wikimedia Commons for Telugu film images
    const searchTerms = [
      `${title} ${year} Telugu film`,
      `${title} Telugu movie poster`,
      `${title} ${year} Indian film`,
    ];

    for (const searchTerm of searchTerms) {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&origin=*`;
      
      const res = await fetch(url, {
        headers: { 'User-Agent': 'TeluguPortal/1.0 (movie-archive; contact@example.com)' }
      });
      
      if (!res.ok) continue;
      
      const data = await res.json();
      const results = data.query?.search || [];
      
      if (results.length === 0) continue;
      
      // Find relevant image files (posters, stills, etc.)
      for (const result of results.slice(0, 5)) {
        const fileTitle = result.title;
        
        // Skip non-image files
        if (!fileTitle.match(/\.(jpg|jpeg|png|gif|svg)$/i)) continue;
        
        // Get actual image URL
        const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;
        
        const infoRes = await fetch(imageInfoUrl, {
          headers: { 'User-Agent': 'TeluguPortal/1.0' }
        });
        
        if (!infoRes.ok) continue;
        
        const infoData = await infoRes.json();
        const pages = infoData.query?.pages;
        
        if (!pages) continue;
        
        const page = Object.values(pages)[0] as any;
        const imageInfo = page?.imageinfo?.[0];
        
        if (imageInfo?.url) {
          // Validate it's a reasonable image size
          const metadata = imageInfo.extmetadata || {};
          const license = metadata.LicenseShortName?.value || 'Unknown';
          
          // Prefer Creative Commons or Public Domain
          const isUsable = license.includes('CC') || 
                          license.includes('Public domain') ||
                          license.includes('PD');
          
          if (isUsable) {
            console.log(`    Found Wikimedia image: ${fileTitle} (${license})`);
            return {
              poster_url: imageInfo.url
            };
          }
        }
      }
    }
    
    return null;
  } catch (e) {
    console.log('    Wikimedia error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// SOURCE 3: INTERNET ARCHIVE (NEW)
// ============================================================

async function tryInternetArchive(title: string, year: number): Promise<EnrichmentData | null> {
  try {
    // Search Internet Archive for Telugu film materials
    const query = `${title} Telugu ${year}`;
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&fl[]=identifier,title,mediatype,description&rows=10&output=json`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const docs = data.response?.docs || [];
    
    if (docs.length === 0) return null;
    
    // Look for image collections or movie items
    for (const doc of docs) {
      // Skip non-relevant items
      if (!doc.title?.toLowerCase().includes(title.toLowerCase())) continue;
      
      // Try to get item metadata for images
      const metaUrl = `https://archive.org/metadata/${doc.identifier}`;
      
      const metaRes = await fetch(metaUrl, {
        headers: { 'User-Agent': 'TeluguPortal/1.0' }
      });
      
      if (!metaRes.ok) continue;
      
      const meta = await metaRes.json();
      const files = meta.files || [];
      
      // Find image files
      const imageFile = files.find((f: any) => 
        f.format?.includes('JPEG') || 
        f.format?.includes('PNG') ||
        f.name?.match(/\.(jpg|jpeg|png|gif)$/i)
      );
      
      if (imageFile) {
        const imageUrl = `https://archive.org/download/${doc.identifier}/${imageFile.name}`;
        console.log(`    Found Internet Archive image: ${doc.identifier}`);
        return {
          poster_url: imageUrl
        };
      }
    }
    
    return null;
  } catch (e) {
    console.log('    Internet Archive error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// SOURCE 4: OMDB
// ============================================================

async function tryOMDB(imdbId: string): Promise<EnrichmentData | null> {
  if (!OMDB_API_KEY || !imdbId) return null;

  try {
    const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=short`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Response === 'False') return null;

    const result: EnrichmentData = {};

    if (data.Director && data.Director !== 'N/A') {
      result.director = data.Director.split(',')[0].trim();
    }

    if (data.Actors && data.Actors !== 'N/A') {
      const actors = data.Actors.split(',').map((a: string) => a.trim());
      if (actors[0]) result.hero = actors[0];
      // Note: OMDB doesn't provide gender, so heroine detection is unreliable
    }

    if (data.Poster && data.Poster !== 'N/A') {
      result.poster_url = data.Poster;
    }

    if (result.director || result.hero || result.poster_url) {
      return result;
    }
    return null;
  } catch (e) {
    console.log('    OMDB error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// SOURCE 3: WIKIDATA
// ============================================================

async function tryWikidata(title: string, year: number): Promise<EnrichmentData | null> {
  try {
    // SPARQL query to find Telugu film with director and cast
    const query = `
      SELECT ?film ?filmLabel ?directorLabel ?castLabel ?castGenderLabel WHERE {
        ?film wdt:P31 wd:Q11424.
        ?film rdfs:label ?filmLabel.
        ?film wdt:P364 wd:Q8097.
        OPTIONAL { ?film wdt:P577 ?date. }
        OPTIONAL { ?film wdt:P57 ?director. }
        OPTIONAL { 
          ?film wdt:P161 ?cast. 
          ?cast wdt:P21 ?castGender.
        }
        FILTER(LANG(?filmLabel) = "en")
        FILTER(CONTAINS(LCASE(?filmLabel), "${title.toLowerCase()}"))
        ${year ? `FILTER(YEAR(?date) = ${year})` : ''}
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 20
    `;

    const url = `${WIKIDATA_SPARQL}?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!res.ok) return null;
    
    const data = await res.json();
    const bindings = data.results?.bindings;

    if (!bindings || bindings.length === 0) return null;

    const result: EnrichmentData = {};

    // Get director (first result with director)
    const directorBinding = bindings.find((b: any) => b.directorLabel?.value);
    if (directorBinding) {
      result.director = directorBinding.directorLabel.value;
    }

    // Get hero (male cast member)
    const maleBinding = bindings.find((b: any) => 
      b.castLabel?.value && b.castGenderLabel?.value === 'male'
    );
    if (maleBinding) {
      result.hero = maleBinding.castLabel.value;
    }

    // Get heroine (female cast member)
    const femaleBinding = bindings.find((b: any) => 
      b.castLabel?.value && b.castGenderLabel?.value === 'female'
    );
    if (femaleBinding) {
      result.heroine = femaleBinding.castLabel.value;
    }

    if (result.director || result.hero || result.heroine) {
      return result;
    }
    return null;
  } catch (e) {
    console.log('    Wikidata error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// SOURCE 4: GOOGLE KNOWLEDGE GRAPH
// ============================================================

async function tryGoogleKG(title: string, year: number): Promise<EnrichmentData | null> {
  if (!GOOGLE_KG_API_KEY) return null;

  try {
    const query = `${title} ${year} Telugu film`;
    const url = `https://kgsearch.googleapis.com/v1/entities:search?key=${GOOGLE_KG_API_KEY}&query=${encodeURIComponent(query)}&types=Movie&limit=5&languages=en`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (!data.itemListElement || data.itemListElement.length === 0) return null;

    // Find best match
    const entity = data.itemListElement.find((item: any) => {
      const name = item.result?.name?.toLowerCase() || '';
      const desc = item.result?.description?.toLowerCase() || '';
      return name.includes(title.toLowerCase()) && 
             (desc.includes('telugu') || desc.includes('indian'));
    });

    if (!entity?.result) return null;

    const result: EnrichmentData = {};

    // Get image if available
    if (entity.result.image?.contentUrl) {
      result.poster_url = entity.result.image.contentUrl;
    }

    // Parse description for director/cast (limited)
    const desc = entity.result.detailedDescription?.articleBody || '';
    const dirMatch = desc.match(/directed by ([A-Z][a-z]+ [A-Z][a-z]+)/i);
    if (dirMatch) {
      result.director = dirMatch[1];
    }

    if (result.poster_url || result.director) {
      return result;
    }
    return null;
  } catch (e) {
    console.log('    Google KG error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// SOURCE 8: LETTERBOXD (SCRAPER)
// ============================================================

async function tryLetterboxd(title: string, year: number): Promise<EnrichmentData | null> {
  try {
    // Create URL-friendly slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Try direct film page
    const url = `https://letterboxd.com/film/${slug}-${year}/`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TeluguPortal/1.0)',
        'Accept': 'text/html',
      }
    });
    
    if (!res.ok) {
      // Try without year
      const altUrl = `https://letterboxd.com/film/${slug}/`;
      const altRes = await fetch(altUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TeluguPortal/1.0)',
          'Accept': 'text/html',
        }
      });
      
      if (!altRes.ok) return null;
      
      const html = await altRes.text();
      return parseLetterboxdHtml(html, title);
    }
    
    const html = await res.text();
    return parseLetterboxdHtml(html, title);
  } catch (e) {
    console.log('    Letterboxd error:', (e as Error).message);
    return null;
  }
}

function parseLetterboxdHtml(html: string, title: string): EnrichmentData | null {
  try {
    const result: EnrichmentData = {};
    
    // Extract poster image from og:image meta tag
    const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogImageMatch) {
      let posterUrl = ogImageMatch[1];
      // Convert to higher resolution if possible
      posterUrl = posterUrl.replace(/-0-\d+-\d+-crop\.jpg/, '-0-500-0-750-crop.jpg');
      result.poster_url = posterUrl;
      console.log(`    Found Letterboxd poster for ${title}`);
    }
    
    // Extract director from crew section
    const directorMatch = html.match(/Director<\/span>.*?<a[^>]+>([^<]+)<\/a>/s);
    if (directorMatch) {
      result.director = directorMatch[1].trim();
    }
    
    if (result.poster_url || result.director) {
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// SOURCE 9: CINEMAAZI (INDIAN FILM ARCHIVE)
// ============================================================

async function tryCinemaazi(title: string, year: number): Promise<EnrichmentData | null> {
  try {
    // Search Cinemaazi for Telugu films
    const searchUrl = `https://www.cinemaazi.com/search?q=${encodeURIComponent(title + ' ' + year)}`;
    
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TeluguPortal/1.0)',
        'Accept': 'text/html',
      }
    });
    
    if (!res.ok) return null;
    
    const html = await res.text();
    
    // Look for movie cards with poster images
    // Cinemaazi typically has format: /movies/movie-name-year
    const movieLinkMatch = html.match(new RegExp(`/movies/[^"]*${title.toLowerCase().replace(/\s+/g, '-')}[^"]*`, 'i'));
    
    if (!movieLinkMatch) return null;
    
    // Fetch the movie page
    const movieUrl = `https://www.cinemaazi.com${movieLinkMatch[0]}`;
    const movieRes = await fetch(movieUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TeluguPortal/1.0)',
        'Accept': 'text/html',
      }
    });
    
    if (!movieRes.ok) return null;
    
    const movieHtml = await movieRes.text();
    const result: EnrichmentData = {};
    
    // Extract poster from img tag
    const posterMatch = movieHtml.match(/<img[^>]+src="([^"]*poster[^"]*)"/i) ||
                       movieHtml.match(/<img[^>]+class="[^"]*poster[^"]*"[^>]+src="([^"]+)"/i);
    
    if (posterMatch) {
      let posterUrl = posterMatch[1];
      if (!posterUrl.startsWith('http')) {
        posterUrl = `https://www.cinemaazi.com${posterUrl}`;
      }
      result.poster_url = posterUrl;
      console.log(`    Found Cinemaazi image for ${title}`);
    }
    
    // Extract director
    const directorMatch = movieHtml.match(/Director[:\s]*<[^>]+>([^<]+)</i);
    if (directorMatch) {
      result.director = directorMatch[1].trim();
    }
    
    if (result.poster_url || result.director) {
      return result;
    }
    return null;
  } catch (e) {
    console.log('    Cinemaazi error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// SOURCE 10: AI INFERENCE (GROQ)
// ============================================================

async function tryAIInference(title: string, year: number): Promise<EnrichmentData | null> {
  if (!GROQ_API_KEY) return null;

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const prompt = `You are a Telugu cinema historian. For the Telugu movie "${title}" (${year}):

Provide ONLY if you are 95%+ confident:
1. Director name
2. Lead male actor (hero)
3. Lead female actress (heroine)

If you're not confident about any field, respond with "Unknown" for that field.

Respond in JSON format ONLY:
{
  "director": "Name or Unknown",
  "hero": "Name or Unknown", 
  "heroine": "Name or Unknown",
  "confidence": "high" or "low"
}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Only use if high confidence
    if (parsed.confidence !== 'high') return null;

    const result: EnrichmentData = {};
    
    if (parsed.director && parsed.director !== 'Unknown') {
      result.director = parsed.director;
    }
    if (parsed.hero && parsed.hero !== 'Unknown') {
      result.hero = parsed.hero;
    }
    if (parsed.heroine && parsed.heroine !== 'Unknown') {
      result.heroine = parsed.heroine;
    }

    if (result.director || result.hero || result.heroine) {
      return result;
    }
    return null;
  } catch (e) {
    console.log('    AI error:', (e as Error).message);
    return null;
  }
}

// ============================================================
// MAIN ENRICHMENT FUNCTION (3-PHASE EXECUTION)
// ============================================================

async function enrichMovie(movie: any, dryRun: boolean): Promise<EnrichmentResult> {
  const title = movie.title_en;
  const year = movie.release_year;
  const result: EnrichmentResult = {
    movieId: movie.id,
    title,
    year,
    source: 'none',
    data: {},
    fieldsUpdated: [],
  };

  console.log(`\n[${title}] (${year})`);
  console.log(`  Current: hero=${movie.hero || 'null'}, director=${movie.director || 'null'}, heroine=${movie.heroine || 'null'}`);

  // Determine what fields we need
  const needsHero = !movie.hero;
  const needsHeroine = !movie.heroine;
  const needsDirector = !movie.director;
  const needsPoster = !movie.poster_url || movie.poster_url.includes('placeholder');

  if (!needsHero && !needsHeroine && !needsDirector && !needsPoster) {
    console.log('  ⏭️  Already complete, skipping');
    return result;
  }

  // ============================================================
  // PHASE 1: BASELINE (TMDB)
  // ============================================================
  console.log('  Phase 1: Baseline (TMDB)...');
  let data: EnrichmentData | null = null;
  data = await tryTMDB(title, year);
  if (data && (data.hero || data.director || data.poster_url)) {
    result.source = 'tmdb';
    result.data = data;
    console.log(`  ✓ TMDB: ${JSON.stringify(data)}`);
  }

  // ============================================================
  // PHASE 2: VALIDATE-ONLY (Parallel confirmation, no storage)
  // ============================================================
  const validateOnlyImages: Array<{ url: string; source: string }> = [];
  
  if (needsPoster && data?.poster_url) {
    console.log('  Phase 2: Validate-Only sources (parallel)...');
    
    const [impawardsResult, letterboxdResult] = await Promise.all([
      tryIMPAwards(title, year),
      tryLetterboxd(title, year),
    ]);
    
    if (impawardsResult?.poster_url) {
      validateOnlyImages.push({ url: impawardsResult.poster_url, source: 'impawards' });
      console.log(`    ✓ IMPAwards: confirmed (not stored)`);
    }
    
    if (letterboxdResult?.poster_url) {
      validateOnlyImages.push({ url: letterboxdResult.poster_url, source: 'letterboxd' });
      console.log(`    ✓ Letterboxd: confirmed (not stored)`);
    }
  }

  // ============================================================
  // PHASE 3: INGEST/ENRICH (With license validation)
  // ============================================================
  const ingestImages: Array<{ url: string; source: string; confidence: number }> = [];
  
  if (!data || (needsPoster && !data.poster_url)) {
    console.log('  Phase 3: Ingest/Enrich sources (with license validation)...');
    
    // Try Openverse (CC-licensed)
    const openverseResult = await tryOpenverse(title, year);
    if (openverseResult?.poster_url) {
      const licenseResult = await validateImageLicense(openverseResult.poster_url, 'openverse');
      if (licenseResult.is_valid && licenseResult.license_verified) {
        if (!data) {
          data = { poster_url: openverseResult.poster_url };
          result.source = 'openverse';
        } else if (!data.poster_url) {
          data.poster_url = openverseResult.poster_url;
          result.source = 'openverse';
        }
        ingestImages.push({ url: openverseResult.poster_url, source: 'openverse', confidence: 0.85 });
        console.log(`  ✓ Openverse: CC-licensed image (${licenseResult.license_type})`);
      } else if (licenseResult.warning) {
        console.log(`  ⚠️  Openverse: ${licenseResult.warning}`);
      }
    }
    
    // Try Wikimedia Commons if still need poster
    const wikimediaData = await tryWikimediaCommons(title, year);
    if (wikimediaData?.poster_url) {
      const licenseResult = await validateImageLicense(wikimediaData.poster_url, 'wikimedia');
      if (licenseResult.is_valid) {
        if (!data) {
          data = wikimediaData;
          result.source = 'wikimedia';
        } else if (!data.poster_url) {
          data.poster_url = wikimediaData.poster_url;
          result.source = 'wikimedia';
        }
        ingestImages.push({ url: wikimediaData.poster_url, source: 'wikimedia', confidence: 0.85 });
        console.log(`  ✓ Wikimedia: ${licenseResult.license_verified ? 'verified' : 'permissive'} (${licenseResult.license_type})`);
        if (licenseResult.warning) {
          console.log(`  ⚠️  ${licenseResult.warning}`);
        }
      }
    }

    // Try Internet Archive (public domain)
    const iaData = await tryInternetArchive(title, year);
    if (iaData?.poster_url) {
      if (!data) {
        data = iaData;
        result.source = 'internet_archive';
      } else if (!data.poster_url) {
        data.poster_url = iaData.poster_url;
        result.source = 'internet_archive';
      }
      ingestImages.push({ url: iaData.poster_url, source: 'internet_archive', confidence: 0.75 });
      console.log(`  ✓ Internet Archive: public domain`);
    }

    // Try other enrich sources if still needed
    if (!data && movie.imdb_id) {
      const omdbData = await tryOMDB(movie.imdb_id);
      if (omdbData) {
        data = omdbData;
        result.source = 'omdb';
        console.log(`  ✓ OMDB: ${JSON.stringify(omdbData)}`);
      }
    }

    if (!data) {
      const wikidataData = await tryWikidata(title, year);
      if (wikidataData) {
        data = wikidataData;
        result.source = 'wikidata';
        console.log(`  ✓ Wikidata: ${JSON.stringify(wikidataData)}`);
      }
    }

    if (!data) {
      const cinemaaziData = await tryCinemaazi(title, year);
      if (cinemaaziData) {
        data = cinemaaziData;
        result.source = 'cinemaazi';
        console.log(`  ✓ Cinemaazi: data found`);
      }
    }

    // AI as last resort (metadata only, capped confidence)
    if (!data) {
      const aiData = await tryAIInference(title, year);
      if (aiData) {
        data = aiData;
        result.source = 'ai';
        console.log(`  ✓ AI: ${JSON.stringify(aiData)} (confidence capped at 0.50)`);
      }
    }
  }

  // ============================================================
  // CONFIDENCE CALCULATION (Multi-source validation)
  // ============================================================
  let finalConfidence = SOURCE_CONFIDENCE[result.source] || 0.50;
  let validateOnlyBoost = 0;
  let multiSourceBoost = 0;
  let confirmedBy: string[] = [];
  let agreementSources: string[] = [];
  let licenseWarning: string | null = null;

  if (data?.poster_url && needsPoster) {
    // Calculate multi-source confidence
    const confidenceResult = calculateMultiSourceConfidence(
      data.poster_url,
      result.source,
      finalConfidence,
      validateOnlyImages,
      ingestImages
    );

    finalConfidence = confidenceResult.final_confidence;
    validateOnlyBoost = confidenceResult.validate_only_boost;
    multiSourceBoost = confidenceResult.multi_source_boost;
    confirmedBy = confidenceResult.confirmed_by;
    agreementSources = confidenceResult.agreement_sources;

    // Check for AI-generated content (cap at 0.50)
    const aiCheck = detectAIGenerated(data.poster_url, result.source);
    if (aiCheck.is_ai_generated) {
      finalConfidence = Math.min(finalConfidence, 0.50);
      console.log(`  ⚠️  AI-generated content detected - confidence capped at 0.50`);
    }

    // License validation for the chosen source
    const licenseResult = await validateImageLicense(data.poster_url, result.source);
    if (!licenseResult.license_verified) {
      licenseWarning = licenseResult.warning;
    }

    console.log(`  📊 Confidence: ${finalConfidence.toFixed(2)} (base: ${SOURCE_CONFIDENCE[result.source]}, validate: +${validateOnlyBoost.toFixed(2)}, multi-source: +${multiSourceBoost.toFixed(2)})`);
    if (confirmedBy.length > 0) {
      console.log(`  ✓ Confirmed by: ${confirmedBy.join(', ')}`);
    }
    if (agreementSources.length > 0) {
      console.log(`  ✓ Agreement with: ${agreementSources.join(', ')}`);
    }
  }

  // Apply updates
  if (data) {
    const updates: Record<string, any> = {};

    // CROSS-VALIDATION: Verify hero attribution using TMDB cast data
    if (needsHero && data.hero && data.tmdb_id) {
      const validation = await validateHeroAttribution(data.hero, data.tmdb_id);
      if (validation.valid) {
        updates.hero = data.hero;
        result.fieldsUpdated.push('hero');
      } else {
        console.log(`  ⚠️  Cross-validation failed: "${data.hero}" not in TMDB cast`);
        if (validation.suggestedHero) {
          console.log(`      Suggested hero: ${validation.suggestedHero}`);
          updates.hero = validation.suggestedHero;
          result.fieldsUpdated.push('hero (corrected)');
        }
      }
    } else if (needsHero && data.hero) {
      updates.hero = data.hero;
      result.fieldsUpdated.push('hero');
    }
    if (needsHeroine && data.heroine) {
      updates.heroine = data.heroine;
      result.fieldsUpdated.push('heroine');
    }
    if (needsDirector && data.director) {
      updates.director = data.director;
      result.fieldsUpdated.push('director');
    }
    if (needsPoster && data.poster_url) {
      updates.poster_url = data.poster_url;
      result.fieldsUpdated.push('poster_url');
      
      // Multi-source validation metadata
      updates.poster_confidence = finalConfidence;
      updates.poster_visual_type = 'original_poster';
      updates.visual_verified_at = new Date().toISOString();
      updates.archival_source = {
        source_name: result.source,
        source_type: SOURCE_TYPES[result.source],
        license_type: SOURCE_LICENSES[result.source],
        acquisition_date: new Date().toISOString(),
        image_url: data.poster_url,
        validate_only_confirmed_by: confirmedBy,
        multi_source_agreement: confirmedBy.length + agreementSources.length,
        license_verified: licenseWarning === null,
      };
      
      // Add license warning if needed
      if (licenseWarning) {
        updates.license_warning = licenseWarning;
      }
      
      result.fieldsUpdated.push('visual_confidence');
    }
    if (data.tmdb_id && !movie.tmdb_id) {
      // CROSS-VALIDATION: Verify TMDB ID is for a Telugu movie
      try {
        const tmdbCheck = await fetch(
          `https://api.themoviedb.org/3/movie/${data.tmdb_id}?api_key=${TMDB_API_KEY}`
        );
        const tmdbData = await tmdbCheck.json();
        
        if (tmdbData.original_language === 'te') {
          updates.tmdb_id = data.tmdb_id;
          result.fieldsUpdated.push('tmdb_id');
        } else {
          console.log(`  ⚠️  TMDB ID ${data.tmdb_id} is ${tmdbData.original_language}, not Telugu - skipping`);
        }
      } catch {
        // If validation fails, still save the ID but log warning
        updates.tmdb_id = data.tmdb_id;
        result.fieldsUpdated.push('tmdb_id (unverified)');
      }
    }

    if (Object.keys(updates).length > 0) {
      if (!dryRun) {
        const { error } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movie.id);

        if (error) {
          console.log(`  ✗ Update error: ${error.message}`);
        } else {
          console.log(`  ✓ Updated: ${result.fieldsUpdated.join(', ')}`);
          if (updates.poster_confidence) {
            console.log(`    Visual confidence: ${updates.poster_confidence} (${result.source})`);
          }
        }
      } else {
        console.log(`  Would update: ${result.fieldsUpdated.join(', ')}`);
        if (updates.poster_confidence) {
          console.log(`    Would set visual confidence: ${updates.poster_confidence} (${result.source})`);
        }
      }
    }
  } else {
    console.log('  ✗ No data found from any source');
  }

  // Small delay to respect rate limits
  await new Promise(r => setTimeout(r, 300));

  return result;
}

// ============================================================
// MAIN EXECUTION
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  
  // Basic flags
  const dryRun = !args.includes('--execute');
  const propagate = args.includes('--propagate');
  const audit = args.includes('--audit');
  
  // NEW: Placeholder-only mode (focus on movies with placeholder images)
  const placeholdersOnly = args.includes('--placeholders-only');
  
  // NEW: Batch mode (quiet output, suitable for cron jobs)
  const batchMode = args.includes('--batch');
  
  // NEW: Specific sources to try
  const sourcesArg = args.find(a => a.startsWith('--sources='));
  const enabledSources = sourcesArg 
    ? sourcesArg.split('=')[1].split(',') as EnrichmentSource[]
    : null; // null means all sources
  
  // NEW: Auto-approve threshold (images above this confidence are saved directly)
  const autoApproveArg = args.find(a => a.startsWith('--auto-approve-above='));
  const autoApproveThreshold = autoApproveArg 
    ? parseFloat(autoApproveArg.split('=')[1]) 
    : 0.7; // Default: auto-approve above 0.7
  
  // NEW: Queue threshold (images below this are flagged for review)
  const queueBelowArg = args.find(a => a.startsWith('--queue-below='));
  const queueThreshold = queueBelowArg 
    ? parseFloat(queueBelowArg.split('=')[1]) 
    : 0.5; // Default: queue for review below 0.5
  
  // Existing args
  const limitArg = args.find(a => a.startsWith('--limit='));
  const idsArg = args.find(a => a.startsWith('--ids='));
  const actorArg = args.find(a => a.startsWith('--actor='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 20;
  const actor = actorArg ? actorArg.split('=')[1] : '';

  if (!batchMode) {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`MULTI-SOURCE ENRICHMENT WATERFALL ${dryRun ? '(DRY RUN)' : '(LIVE)'}`);
    console.log(`${'═'.repeat(70)}`);
    console.log(`Sources: TMDB → Wikimedia → IA → OMDB → Wikidata → Letterboxd → Cinemaazi → Google → AI`);
    if (actor) console.log(`Actor filter: ${actor} (processing filmography only)`);
    if (placeholdersOnly) console.log(`Mode: PLACEHOLDERS ONLY (focusing on missing images)`);
    if (enabledSources) console.log(`Enabled Sources: ${enabledSources.join(', ')}`);
    console.log(`Auto-approve above: ${autoApproveThreshold}, Queue below: ${queueThreshold}`);
    if (propagate) console.log(`Propagation: ENABLED (will update reviews)`);
    if (audit) console.log(`Audit: ENABLED (changes will be logged)`);
    console.log('');
  }

  let movies: any[];

  if (idsArg) {
    // Specific movie IDs
    const ids = idsArg.split('=')[1].split(',');
    let query = supabase
      .from('movies')
      .select('*')
      .in('id', ids);
    if (actor) query = query.eq('hero', actor);
    const { data } = await query;
    movies = data || [];
  } else if (actor) {
    // Actor-specific filmography enrichment
    let query = supabase
      .from('movies')
      .select('*')
      .eq('language', 'Telugu')
      .eq('hero', actor);
    
    if (placeholdersOnly) {
      query = query.or('poster_url.is.null,poster_url.ilike.%placeholder%');
    } else {
      query = query.or('hero.is.null,heroine.is.null,director.is.null,poster_url.is.null');
    }
    
    const { data } = await query.limit(limit);
    movies = data || [];
  } else if (placeholdersOnly) {
    // NEW: Get only movies with placeholder images
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('language', 'Telugu')
      .or('poster_url.is.null,poster_url.ilike.%placeholder%')
      .limit(limit);
    movies = data || [];
  } else {
    // Get movies needing enrichment (missing hero, heroine, or director)
    const { data } = await supabase
      .from('movies')
      .select('*')
      .eq('language', 'Telugu')
      .not('our_rating', 'is', null)
      .or('hero.is.null,heroine.is.null,director.is.null')
      .limit(limit);
    movies = data || [];
  }

  console.log(`Found ${movies.length} movies to process\n`);

  const stats = {
    processed: 0,
    enriched: 0,
    propagated: 0,
    bySource: { 
      tmdb: 0, 
      wikimedia: 0, 
      internet_archive: 0, 
      omdb: 0, 
      wikidata: 0, 
      letterboxd: 0, 
      cinemaazi: 0, 
      google: 0, 
      ai: 0, 
      none: 0 
    },
    fieldsUpdated: { hero: 0, heroine: 0, director: 0, poster_url: 0 },
  };

  for (const movie of movies) {
    stats.processed++;
    const result = await enrichMovie(movie, dryRun);
    
    if (result.source !== 'none') {
      stats.enriched++;
    }
    stats.bySource[result.source]++;
    
    for (const field of result.fieldsUpdated) {
      stats.fieldsUpdated[field as keyof typeof stats.fieldsUpdated]++;
    }

    // Propagate changes to reviews if flag is set
    if (propagate && !dryRun && result.fieldsUpdated.length > 0) {
      const changes = result.fieldsUpdated
        .filter(f => f === 'hero' || f === 'heroine' || f === 'director')
        .map(field => ({
          field: field as 'hero' | 'heroine' | 'director',
          oldValue: movie[field] || null,
          newValue: result.data[field as keyof EnrichmentData] as string
        }));

      if (changes.length > 0) {
        try {
          const propResult = await updatePerformanceNames(movie.id, changes, { dryRun });
          if (propResult.updated) {
            stats.propagated++;
            console.log(`    ✓ Propagated to review: ${propResult.fieldsChanged.join(', ')}`);
          }

          // Log to audit if enabled
          if (audit) {
            logChange({
              timestamp: new Date().toISOString(),
              movieId: movie.id,
              title: movie.title_en,
              year: movie.release_year,
              changes,
              propagatedTo: propResult.fieldsChanged,
              validated: false,
              source: result.source
            });
          }
        } catch (err) {
          console.log(`    ⚠️  Propagation failed: ${(err as Error).message}`);
        }
      }
    }
  }

  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`SUMMARY ${dryRun ? '(DRY RUN)' : ''}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`  Processed:    ${stats.processed}`);
  console.log(`  Enriched:     ${stats.enriched}`);
  if (propagate) {
    console.log(`  Propagated:   ${stats.propagated}`);
  }
  console.log(`\n  By Source:`);
  console.log(`    TMDB:             ${stats.bySource.tmdb}`);
  console.log(`    Wikimedia:        ${stats.bySource.wikimedia}`);
  console.log(`    Internet Archive: ${stats.bySource.internet_archive}`);
  console.log(`    OMDB:             ${stats.bySource.omdb}`);
  console.log(`    Wikidata:         ${stats.bySource.wikidata}`);
  console.log(`    Letterboxd:       ${stats.bySource.letterboxd}`);
  console.log(`    Cinemaazi:        ${stats.bySource.cinemaazi}`);
  console.log(`    Google KG:        ${stats.bySource.google}`);
  console.log(`    AI:               ${stats.bySource.ai}`);
  console.log(`    None:             ${stats.bySource.none}`);
  console.log(`\n  Fields Updated:`);
  console.log(`    Hero:       ${stats.fieldsUpdated.hero}`);
  console.log(`    Heroine:    ${stats.fieldsUpdated.heroine}`);
  console.log(`    Director:   ${stats.fieldsUpdated.director}`);
  console.log(`    Poster:     ${stats.fieldsUpdated.poster_url}`);

  if (dryRun && !batchMode) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`USAGE:`);
    console.log(`  npx tsx scripts/enrich-waterfall.ts [OPTIONS]`);
    console.log(`\nBASIC OPTIONS:`);
    console.log(`  --execute              Apply changes (default: dry run)`);
    console.log(`  --limit=N              Process N movies (default: 20)`);
    console.log(`  --ids=id1,id2,...      Process specific movie IDs`);
    console.log(`  --actor=NAME           Filter by actor's filmography (e.g., --actor=Krishna)`);
    console.log(`  --propagate            Also update reviews with cast changes`);
    console.log(`  --audit                Log changes for rollback`);
    console.log(`\nADVANCED OPTIONS:`);
    console.log(`  --placeholders-only    Focus on movies with placeholder images`);
    console.log(`  --batch                Quiet mode for cron jobs`);
    console.log(`  --sources=s1,s2,...    Only try specific sources`);
    console.log(`                         (tmdb,wikimedia,internet_archive,omdb,wikidata,letterboxd,cinemaazi,google,ai)`);
    console.log(`  --auto-approve-above=N Auto-save images above confidence N (default: 0.7)`);
    console.log(`  --queue-below=N        Flag for review below confidence N (default: 0.5)`);
    console.log(`\nEXAMPLES:`);
    console.log(`  npx tsx scripts/enrich-waterfall.ts --actor=Krishna --execute`);
    console.log(`  npx tsx scripts/enrich-waterfall.ts --placeholders-only --execute`);
    console.log(`  npx tsx scripts/enrich-waterfall.ts --sources=wikimedia,internet_archive --limit=100`);
    console.log(`  npx tsx scripts/enrich-waterfall.ts --batch --limit=100 --auto-approve-above=0.8 --execute`);
  }
}

main().catch(console.error);

