/**
 * MULTI-SOURCE DATA ORCHESTRATOR
 * 
 * Fetches data from all available sources in parallel and builds consensus.
 * Used for high-confidence validation and conflict detection.
 * 
 * Features:
 * - Parallel fetching from all sources (TMDB, IMDb, Wikipedia, Wikidata, OMDB)
 * - Consensus building algorithm
 * - Confidence scoring per field
 * - Conflict detection and reporting
 * - Source attribution tracking
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { scrapeLetterboxdCredits } from './letterboxd-scraper';
import { scrapeRottenTomatoesCredits } from './rottentomatoes-scraper';
import { scrapeIdlebrainCredits } from './idlebrain-scraper';
import { scrapeGreatAndhraCredits } from './greatandhra-scraper';
import { scrapeCineJoshCredits } from './cinejosh-scraper';
import { scrapeBookMyShowCredits } from './bookmyshow-scraper';
import { scrapeTupakiCredits } from './tupaki-scraper';
import { scrape123TeluguCredits } from './123telugu-scraper';
import { scrapeTeluguCinemaCredits } from './telugucinema-scraper';
import { scrapeFilmiBeatCredits } from './filmibeat-scraper';
import { scrapeM9NewsCredits } from './m9news-scraper';
import { scrapeEenaduCredits } from './eenadu-scraper';
import { scrapeSakshiCredits } from './sakshi-scraper';
import { scrapeGulteCredits } from './gulte-scraper';
import { scrapeTelugu360Credits } from './telugu360-scraper';

// ============================================================
// TYPES
// ============================================================

export type DataSourceId = 'tmdb' | 'imdb' | 'wikipedia' | 'wikidata' | 'omdb' | 'archive_org' | 'letterboxd' | 'rottentomatoes' | 'idlebrain' | 'greatandhra' | 'cinejosh' | 'bookmyshow' | 'tupaki' | '123telugu' | 'telugucinema' | 'filmibeat' | 'm9news' | 'eenadu' | 'sakshi' | 'gulte' | 'telugu360';

export interface DataSource {
  id: DataSourceId;
  priority: number;
  confidence: number;
  enabled: boolean;
}

export interface SourceValue {
  sourceId: DataSourceId;
  value: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface MultiSourceResult {
  field: string;
  sources: SourceValue[];
  consensus?: string;
  consensusConfidence: number;
  action: 'auto_apply' | 'flag_conflict' | 'manual_review';
  conflict?: {
    values: string[];
    sources: DataSourceId[];
  };
}

export interface MovieQuery {
  title_en: string;
  release_year: number;
  tmdb_id?: number;
  imdb_id?: string;
  hero?: string;
  director?: string;
}

export interface FieldSources {
  [field: string]: SourceValue[];
}

// ============================================================
// SOURCE CONFIGURATION
// ============================================================

export const DATA_SOURCES: Record<DataSourceId, DataSource> = {
  tmdb: { id: 'tmdb', priority: 21, confidence: 0.95, enabled: true },
  letterboxd: { id: 'letterboxd', priority: 20, confidence: 0.92, enabled: true },
  rottentomatoes: { id: 'rottentomatoes', priority: 19, confidence: 0.90, enabled: true }, // ✅ ENABLED
  imdb: { id: 'imdb', priority: 18, confidence: 0.90, enabled: true },
  idlebrain: { id: 'idlebrain', priority: 17, confidence: 0.88, enabled: true },
  bookmyshow: { id: 'bookmyshow', priority: 16, confidence: 0.88, enabled: true }, // ✅ ENABLED for enrichment
  eenadu: { id: 'eenadu', priority: 15, confidence: 0.86, enabled: true }, // ✅ ENABLED for enrichment
  sakshi: { id: 'sakshi', priority: 14, confidence: 0.84, enabled: true }, // ✅ ENABLED for enrichment
  tupaki: { id: 'tupaki', priority: 13, confidence: 0.83, enabled: true }, // ✅ ENABLED for enrichment
  gulte: { id: 'gulte', priority: 12, confidence: 0.82, enabled: true }, // ✅ ENABLED for enrichment
  '123telugu': { id: '123telugu', priority: 11, confidence: 0.81, enabled: true }, // ✅ ENABLED
  telugu360: { id: 'telugu360', priority: 10, confidence: 0.80, enabled: true },
  telugucinema: { id: 'telugucinema', priority: 9, confidence: 0.79, enabled: true }, // ✅ ENABLED
  filmibeat: { id: 'filmibeat', priority: 8, confidence: 0.77, enabled: true }, // ✅ ENABLED
  m9news: { id: 'm9news', priority: 7, confidence: 0.75, enabled: true }, // ✅ ENABLED
  wikipedia: { id: 'wikipedia', priority: 4, confidence: 0.85, enabled: true },
  greatandhra: { id: 'greatandhra', priority: 3, confidence: 0.85, enabled: true }, // ✅ ENABLED
  cinejosh: { id: 'cinejosh', priority: 2, confidence: 0.82, enabled: true }, // ✅ ENABLED
  wikidata: { id: 'wikidata', priority: 1, confidence: 0.80, enabled: true },
  omdb: { id: 'omdb', priority: 0, confidence: 0.75, enabled: true },
  archive_org: { id: 'archive_org', priority: -1, confidence: 0.70, enabled: false }, // Archives are for images only
};

// API Keys
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

// ============================================================
// SOURCE FETCHERS
// ============================================================

/**
 * Fetch from TMDB
 */
async function fetchFromTMDB(query: MovieQuery): Promise<FieldSources> {
  if (!TMDB_API_KEY || !DATA_SOURCES.tmdb.enabled) return {};

  try {
    let tmdbId = query.tmdb_id;

    // Search if no TMDB ID provided
    if (!tmdbId) {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query.title_en)}&year=${query.release_year}&language=en-US`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.results || searchData.results.length === 0) return {};

      // Prefer Telugu movies
      const movie = searchData.results.find((m: any) => m.original_language === 'te') || searchData.results[0];
      tmdbId = movie.id;
    }

    // Get credits
    const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    const creditsRes = await fetch(creditsUrl);
    const credits = await creditsRes.json();

    const result: FieldSources = {};

    // Director
    const director = credits.crew?.find((c: any) => c.job === 'Director');
    if (director) {
      result.director = [{
        sourceId: 'tmdb',
        value: director.name,
        confidence: DATA_SOURCES.tmdb.confidence,
        metadata: { tmdb_id: tmdbId, department: 'Directing' },
      }];
    }

    // Hero (first male actor)
    const males = credits.cast?.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order) || [];
    if (males[0]) {
      result.hero = [{
        sourceId: 'tmdb',
        value: males[0].name,
        confidence: DATA_SOURCES.tmdb.confidence,
        metadata: { tmdb_id: tmdbId, cast_order: males[0].order, character: males[0].character },
      }];
    }

    // Heroine (first female actress)
    const females = credits.cast?.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order) || [];
    if (females[0]) {
      result.heroine = [{
        sourceId: 'tmdb',
        value: females[0].name,
        confidence: DATA_SOURCES.tmdb.confidence,
        metadata: { tmdb_id: tmdbId, cast_order: females[0].order, character: females[0].character },
      }];
    }

    // Cinematographer
    const cinematographer = credits.crew?.find((c: any) => 
      c.job === 'Director of Photography' || c.department === 'Camera'
    );
    if (cinematographer) {
      result.cinematographer = [{
        sourceId: 'tmdb',
        value: cinematographer.name,
        confidence: DATA_SOURCES.tmdb.confidence * 0.9, // Slightly lower for crew
        metadata: { tmdb_id: tmdbId, job: cinematographer.job },
      }];
    }

    // Editor
    const editor = credits.crew?.find((c: any) => c.job === 'Editor' || c.department === 'Editing');
    if (editor) {
      result.editor = [{
        sourceId: 'tmdb',
        value: editor.name,
        confidence: DATA_SOURCES.tmdb.confidence * 0.9,
        metadata: { tmdb_id: tmdbId, job: editor.job },
      }];
    }

    // Writer
    const writer = credits.crew?.find((c: any) => 
      c.job === 'Writer' || c.job === 'Screenplay' || c.department === 'Writing'
    );
    if (writer) {
      result.writer = [{
        sourceId: 'tmdb',
        value: writer.name,
        confidence: DATA_SOURCES.tmdb.confidence * 0.9,
        metadata: { tmdb_id: tmdbId, job: writer.job },
      }];
    }

    return result;
  } catch (error) {
    console.error('TMDB fetch error:', error);
    return {};
  }
}

/**
 * Fetch from OMDB (requires IMDb ID)
 */
async function fetchFromOMDB(query: MovieQuery): Promise<FieldSources> {
  if (!OMDB_API_KEY || !DATA_SOURCES.omdb.enabled || !query.imdb_id) return {};

  try {
    const url = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${query.imdb_id}&plot=full`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.Response !== 'True') return {};

    const result: FieldSources = {};

    if (data.Director && data.Director !== 'N/A') {
      result.director = [{
        sourceId: 'omdb',
        value: data.Director,
        confidence: DATA_SOURCES.omdb.confidence,
        metadata: { imdb_id: query.imdb_id },
      }];
    }

    // OMDB provides actors list, try to extract hero/heroine
    if (data.Actors && data.Actors !== 'N/A') {
      const actors = data.Actors.split(',').map((a: string) => a.trim());
      if (actors.length > 0) {
        result.hero = [{
          sourceId: 'omdb',
          value: actors[0],
          confidence: DATA_SOURCES.omdb.confidence * 0.8, // Lower confidence for actor gender assumption
          metadata: { imdb_id: query.imdb_id },
        }];
      }
    }

    if (data.Writer && data.Writer !== 'N/A') {
      // OMDB provides multiple writers, take the first one
      const writers = data.Writer.split(',').map((w: string) => w.trim().replace(/\s*\([^)]*\)/g, ''));
      result.writer = [{
        sourceId: 'omdb',
        value: writers[0],
        confidence: DATA_SOURCES.omdb.confidence,
        metadata: { imdb_id: query.imdb_id },
      }];
    }

    return result;
  } catch (error) {
    console.error('OMDB fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Wikipedia (stub - will be enhanced by wikipedia-infobox-parser)
 */
async function fetchFromWikipedia(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.wikipedia.enabled) return {};

  try {
    // Search for Telugu Wikipedia article
    const searchUrl = `https://te.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query.title_en + ' ' + query.release_year)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguPortal/1.0 (film-database)' }
    });
    const searchData = await searchRes.json();

    if (!searchData.query?.search || searchData.query.search.length === 0) return {};

    const pageTitle = searchData.query.search[0].title;

    // Get page content
    const pageUrl = `https://te.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=revisions&rvprop=content&format=json&origin=*`;
    const pageRes = await fetch(pageUrl, {
      headers: { 'User-Agent': 'TeluguPortal/1.0 (film-database)' }
    });
    const pageData = await pageRes.json();

    const pages = pageData.query?.pages;
    if (!pages) return {};

    const page = Object.values(pages)[0] as any;
    const content = page.revisions?.[0]?.['*'] || '';

    // Basic infobox parsing (will be enhanced by wikipedia-infobox-parser)
    const result: FieldSources = {};

    // Extract director from infobox
    const directorMatch = content.match(/\|\s*దర్శకత్వం\s*=\s*\[\[(.*?)\]\]/);
    if (directorMatch) {
      result.director = [{
        sourceId: 'wikipedia',
        value: directorMatch[1].split('|')[0].trim(),
        confidence: DATA_SOURCES.wikipedia.confidence,
        metadata: { language: 'te', page: pageTitle },
      }];
    }

    return result;
  } catch (error) {
    console.error('Wikipedia fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Wikidata (structured data)
 */
async function fetchFromWikidata(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.wikidata.enabled) return {};

  try {
    // SPARQL query to find Telugu film
    const sparql = `
      SELECT ?film ?filmLabel ?directorLabel ?castLabel WHERE {
        ?film wdt:P31 wd:Q11424;
              wdt:P364 wd:Q8097;
              rdfs:label "${query.title_en}"@en.
        OPTIONAL { ?film wdt:P57 ?director. }
        OPTIONAL { ?film wdt:P161 ?cast. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 5
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0 (film-database)' }
    });
    const data = await res.json();

    const result: FieldSources = {};
    const bindings = data.results?.bindings || [];

    if (bindings.length > 0) {
      const film = bindings[0];

      if (film.directorLabel?.value) {
        result.director = [{
          sourceId: 'wikidata',
          value: film.directorLabel.value,
          confidence: DATA_SOURCES.wikidata.confidence,
          metadata: { wikidata_id: film.film?.value },
        }];
      }

      if (film.castLabel?.value) {
        result.hero = [{
          sourceId: 'wikidata',
          value: film.castLabel.value,
          confidence: DATA_SOURCES.wikidata.confidence * 0.8, // Lower for cast gender assumption
          metadata: { wikidata_id: film.film?.value },
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('Wikidata fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Letterboxd
 */
async function fetchFromLetterboxd(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.letterboxd.enabled) return {};

  try {
    const credits = await scrapeLetterboxdCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'letterboxd',
        value: credits.director[0],
        confidence: DATA_SOURCES.letterboxd.confidence,
        metadata: { source: 'letterboxd' },
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{
        sourceId: 'letterboxd',
        value: credits.cast[0].name,
        confidence: DATA_SOURCES.letterboxd.confidence,
        metadata: { role: credits.cast[0].role, order: credits.cast[0].order },
      }];

      if (credits.cast.length > 1) {
        result.heroine = [{
          sourceId: 'letterboxd',
          value: credits.cast[1].name,
          confidence: DATA_SOURCES.letterboxd.confidence,
          metadata: { role: credits.cast[1].role, order: credits.cast[1].order },
        }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer && credits.crew.cinematographer.length > 0) {
        result.cinematographer = [{
          sourceId: 'letterboxd',
          value: credits.crew.cinematographer[0],
          confidence: DATA_SOURCES.letterboxd.confidence,
        }];
      }

      if (credits.crew.editor && credits.crew.editor.length > 0) {
        result.editor = [{
          sourceId: 'letterboxd',
          value: credits.crew.editor[0],
          confidence: DATA_SOURCES.letterboxd.confidence,
        }];
      }

      if (credits.crew.writer && credits.crew.writer.length > 0) {
        result.writer = [{
          sourceId: 'letterboxd',
          value: credits.crew.writer[0],
          confidence: DATA_SOURCES.letterboxd.confidence,
        }];
      }

      if (credits.crew.musicDirector && credits.crew.musicDirector.length > 0) {
        result.music_director = [{
          sourceId: 'letterboxd',
          value: credits.crew.musicDirector[0],
          confidence: DATA_SOURCES.letterboxd.confidence,
        }];
      }

      if (credits.crew.producer && credits.crew.producer.length > 0) {
        result.producer = [{
          sourceId: 'letterboxd',
          value: credits.crew.producer[0],
          confidence: DATA_SOURCES.letterboxd.confidence,
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('Letterboxd fetch error:', error);
    return {};
  }
}

/**
 * Fetch from RottenTomatoes
 */
async function fetchFromRottenTomatoes(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.rottentomatoes.enabled) return {};

  try {
    const credits = await scrapeRottenTomatoesCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'rottentomatoes',
        value: credits.director[0],
        confidence: DATA_SOURCES.rottentomatoes.confidence,
        metadata: { source: 'rottentomatoes' },
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{
        sourceId: 'rottentomatoes',
        value: credits.cast[0].name,
        confidence: DATA_SOURCES.rottentomatoes.confidence,
        metadata: { role: credits.cast[0].role },
      }];

      if (credits.cast.length > 1) {
        result.heroine = [{
          sourceId: 'rottentomatoes',
          value: credits.cast[1].name,
          confidence: DATA_SOURCES.rottentomatoes.confidence,
          metadata: { role: credits.cast[1].role },
        }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer && credits.crew.cinematographer.length > 0) {
        result.cinematographer = [{
          sourceId: 'rottentomatoes',
          value: credits.crew.cinematographer[0],
          confidence: DATA_SOURCES.rottentomatoes.confidence,
        }];
      }

      if (credits.crew.editor && credits.crew.editor.length > 0) {
        result.editor = [{
          sourceId: 'rottentomatoes',
          value: credits.crew.editor[0],
          confidence: DATA_SOURCES.rottentomatoes.confidence,
        }];
      }

      if (credits.crew.writer && credits.crew.writer.length > 0) {
        result.writer = [{
          sourceId: 'rottentomatoes',
          value: credits.crew.writer[0],
          confidence: DATA_SOURCES.rottentomatoes.confidence,
        }];
      }

      if (credits.crew.musicDirector && credits.crew.musicDirector.length > 0) {
        result.music_director = [{
          sourceId: 'rottentomatoes',
          value: credits.crew.musicDirector[0],
          confidence: DATA_SOURCES.rottentomatoes.confidence,
        }];
      }

      if (credits.crew.producer && credits.crew.producer.length > 0) {
        result.producer = [{
          sourceId: 'rottentomatoes',
          value: credits.crew.producer[0],
          confidence: DATA_SOURCES.rottentomatoes.confidence,
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('RottenTomatoes fetch error:', error);
    return {};
  }
}

/**
 * Fetch from IdleBrain
 */
async function fetchFromIdlebrain(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.idlebrain.enabled) return {};

  try {
    const credits = await scrapeIdlebrainCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'idlebrain',
        value: credits.director[0],
        confidence: DATA_SOURCES.idlebrain.confidence,
        metadata: { source: 'idlebrain' },
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      const hero = credits.cast.find(c => c.role === 'Hero') || credits.cast[0];
      result.hero = [{
        sourceId: 'idlebrain',
        value: hero.name,
        confidence: DATA_SOURCES.idlebrain.confidence,
        metadata: { role: hero.role },
      }];

      const heroine = credits.cast.find(c => c.role === 'Heroine') || credits.cast[1];
      if (heroine) {
        result.heroine = [{
          sourceId: 'idlebrain',
          value: heroine.name,
          confidence: DATA_SOURCES.idlebrain.confidence,
          metadata: { role: heroine.role },
        }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer && credits.crew.cinematographer.length > 0) {
        result.cinematographer = [{
          sourceId: 'idlebrain',
          value: credits.crew.cinematographer[0],
          confidence: DATA_SOURCES.idlebrain.confidence,
        }];
      }

      if (credits.crew.editor && credits.crew.editor.length > 0) {
        result.editor = [{
          sourceId: 'idlebrain',
          value: credits.crew.editor[0],
          confidence: DATA_SOURCES.idlebrain.confidence,
        }];
      }

      if (credits.crew.writer && credits.crew.writer.length > 0) {
        result.writer = [{
          sourceId: 'idlebrain',
          value: credits.crew.writer[0],
          confidence: DATA_SOURCES.idlebrain.confidence,
        }];
      }

      if (credits.crew.musicDirector && credits.crew.musicDirector.length > 0) {
        result.music_director = [{
          sourceId: 'idlebrain',
          value: credits.crew.musicDirector[0],
          confidence: DATA_SOURCES.idlebrain.confidence,
        }];
      }

      if (credits.crew.producer && credits.crew.producer.length > 0) {
        result.producer = [{
          sourceId: 'idlebrain',
          value: credits.crew.producer[0],
          confidence: DATA_SOURCES.idlebrain.confidence,
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('IdleBrain fetch error:', error);
    return {};
  }
}

/**
 * Fetch from GreatAndhra
 */
async function fetchFromGreatAndhra(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.greatandhra.enabled) return {};

  try {
    const credits = await scrapeGreatAndhraCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'greatandhra',
        value: credits.director[0],
        confidence: DATA_SOURCES.greatandhra.confidence,
        metadata: { source: 'greatandhra' },
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      const hero = credits.cast.find(c => c.role === 'Hero') || credits.cast[0];
      result.hero = [{
        sourceId: 'greatandhra',
        value: hero.name,
        confidence: DATA_SOURCES.greatandhra.confidence,
        metadata: { role: hero.role },
      }];

      const heroine = credits.cast.find(c => c.role === 'Heroine') || credits.cast[1];
      if (heroine) {
        result.heroine = [{
          sourceId: 'greatandhra',
          value: heroine.name,
          confidence: DATA_SOURCES.greatandhra.confidence,
          metadata: { role: heroine.role },
        }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer && credits.crew.cinematographer.length > 0) {
        result.cinematographer = [{
          sourceId: 'greatandhra',
          value: credits.crew.cinematographer[0],
          confidence: DATA_SOURCES.greatandhra.confidence,
        }];
      }

      if (credits.crew.editor && credits.crew.editor.length > 0) {
        result.editor = [{
          sourceId: 'greatandhra',
          value: credits.crew.editor[0],
          confidence: DATA_SOURCES.greatandhra.confidence,
        }];
      }

      if (credits.crew.writer && credits.crew.writer.length > 0) {
        result.writer = [{
          sourceId: 'greatandhra',
          value: credits.crew.writer[0],
          confidence: DATA_SOURCES.greatandhra.confidence,
        }];
      }

      if (credits.crew.musicDirector && credits.crew.musicDirector.length > 0) {
        result.music_director = [{
          sourceId: 'greatandhra',
          value: credits.crew.musicDirector[0],
          confidence: DATA_SOURCES.greatandhra.confidence,
        }];
      }

      if (credits.crew.producer && credits.crew.producer.length > 0) {
        result.producer = [{
          sourceId: 'greatandhra',
          value: credits.crew.producer[0],
          confidence: DATA_SOURCES.greatandhra.confidence,
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('GreatAndhra fetch error:', error);
    return {};
  }
}

/**
 * Fetch from CineJosh
 */
async function fetchFromCineJosh(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.cinejosh.enabled) return {};

  try {
    const credits = await scrapeCineJoshCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'cinejosh',
        value: credits.director[0],
        confidence: DATA_SOURCES.cinejosh.confidence,
        metadata: { source: 'cinejosh' },
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      const hero = credits.cast.find(c => c.role === 'Hero') || credits.cast[0];
      result.hero = [{
        sourceId: 'cinejosh',
        value: hero.name,
        confidence: DATA_SOURCES.cinejosh.confidence,
        metadata: { role: hero.role },
      }];

      const heroine = credits.cast.find(c => c.role === 'Heroine') || credits.cast[1];
      if (heroine) {
        result.heroine = [{
          sourceId: 'cinejosh',
          value: heroine.name,
          confidence: DATA_SOURCES.cinejosh.confidence,
          metadata: { role: heroine.role },
        }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer && credits.crew.cinematographer.length > 0) {
        result.cinematographer = [{
          sourceId: 'cinejosh',
          value: credits.crew.cinematographer[0],
          confidence: DATA_SOURCES.cinejosh.confidence,
        }];
      }

      if (credits.crew.editor && credits.crew.editor.length > 0) {
        result.editor = [{
          sourceId: 'cinejosh',
          value: credits.crew.editor[0],
          confidence: DATA_SOURCES.cinejosh.confidence,
        }];
      }

      if (credits.crew.writer && credits.crew.writer.length > 0) {
        result.writer = [{
          sourceId: 'cinejosh',
          value: credits.crew.writer[0],
          confidence: DATA_SOURCES.cinejosh.confidence,
        }];
      }

      if (credits.crew.musicDirector && credits.crew.musicDirector.length > 0) {
        result.music_director = [{
          sourceId: 'cinejosh',
          value: credits.crew.musicDirector[0],
          confidence: DATA_SOURCES.cinejosh.confidence,
        }];
      }

      if (credits.crew.producer && credits.crew.producer.length > 0) {
        result.producer = [{
          sourceId: 'cinejosh',
          value: credits.crew.producer[0],
          confidence: DATA_SOURCES.cinejosh.confidence,
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('CineJosh fetch error:', error);
    return {};
  }
}

/**
 * Fetch from BookMyShow
 */
async function fetchFromBookMyShow(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.bookmyshow.enabled) return {};

  try {
    const credits = await scrapeBookMyShowCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'bookmyshow',
        value: credits.director[0],
        confidence: DATA_SOURCES.bookmyshow.confidence,
        metadata: { source: 'bookmyshow' },
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{
        sourceId: 'bookmyshow',
        value: credits.cast[0].name,
        confidence: DATA_SOURCES.bookmyshow.confidence,
        metadata: { role: credits.cast[0].role },
      }];

      if (credits.cast.length > 1) {
        result.heroine = [{
          sourceId: 'bookmyshow',
          value: credits.cast[1].name,
          confidence: DATA_SOURCES.bookmyshow.confidence,
          metadata: { role: credits.cast[1].role },
        }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer && credits.crew.cinematographer.length > 0) {
        result.cinematographer = [{
          sourceId: 'bookmyshow',
          value: credits.crew.cinematographer[0],
          confidence: DATA_SOURCES.bookmyshow.confidence,
        }];
      }

      if (credits.crew.editor && credits.crew.editor.length > 0) {
        result.editor = [{
          sourceId: 'bookmyshow',
          value: credits.crew.editor[0],
          confidence: DATA_SOURCES.bookmyshow.confidence,
        }];
      }

      if (credits.crew.writer && credits.crew.writer.length > 0) {
        result.writer = [{
          sourceId: 'bookmyshow',
          value: credits.crew.writer[0],
          confidence: DATA_SOURCES.bookmyshow.confidence,
        }];
      }

      if (credits.crew.musicDirector && credits.crew.musicDirector.length > 0) {
        result.music_director = [{
          sourceId: 'bookmyshow',
          value: credits.crew.musicDirector[0],
          confidence: DATA_SOURCES.bookmyshow.confidence,
        }];
      }

      if (credits.crew.producer && credits.crew.producer.length > 0) {
        result.producer = [{
          sourceId: 'bookmyshow',
          value: credits.crew.producer[0],
          confidence: DATA_SOURCES.bookmyshow.confidence,
        }];
      }
    }

    return result;
  } catch (error) {
    console.error('BookMyShow fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Tupaki
 */
async function fetchFromTupaki(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.tupaki.enabled) return {};

  try {
    const credits = await scrapeTupakiCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director && credits.director.length > 0) {
      result.director = [{
        sourceId: 'tupaki',
        value: credits.director[0],
        confidence: DATA_SOURCES.tupaki.confidence,
      }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'tupaki', value: credits.cast[0].name, confidence: DATA_SOURCES.tupaki.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'tupaki', value: credits.cast[1].name, confidence: DATA_SOURCES.tupaki.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'tupaki', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.tupaki.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'tupaki', value: credits.crew.editor[0], confidence: DATA_SOURCES.tupaki.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'tupaki', value: credits.crew.writer[0], confidence: DATA_SOURCES.tupaki.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'tupaki', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.tupaki.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'tupaki', value: credits.crew.producer[0], confidence: DATA_SOURCES.tupaki.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('Tupaki fetch error:', error);
    return {};
  }
}

/**
 * Fetch from 123Telugu
 */
async function fetchFrom123Telugu(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES['123telugu'].enabled) return {};

  try {
    const credits = await scrape123TeluguCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: '123telugu', value: credits.director[0], confidence: DATA_SOURCES['123telugu'].confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: '123telugu', value: credits.cast[0].name, confidence: DATA_SOURCES['123telugu'].confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: '123telugu', value: credits.cast[1].name, confidence: DATA_SOURCES['123telugu'].confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: '123telugu', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES['123telugu'].confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: '123telugu', value: credits.crew.editor[0], confidence: DATA_SOURCES['123telugu'].confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: '123telugu', value: credits.crew.writer[0], confidence: DATA_SOURCES['123telugu'].confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: '123telugu', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES['123telugu'].confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: '123telugu', value: credits.crew.producer[0], confidence: DATA_SOURCES['123telugu'].confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('123Telugu fetch error:', error);
    return {};
  }
}

/**
 * Fetch from TeluguCinema
 */
async function fetchFromTeluguCinema(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.telugucinema.enabled) return {};

  try {
    const credits = await scrapeTeluguCinemaCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'telugucinema', value: credits.director[0], confidence: DATA_SOURCES.telugucinema.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'telugucinema', value: credits.cast[0].name, confidence: DATA_SOURCES.telugucinema.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'telugucinema', value: credits.cast[1].name, confidence: DATA_SOURCES.telugucinema.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'telugucinema', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.telugucinema.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'telugucinema', value: credits.crew.editor[0], confidence: DATA_SOURCES.telugucinema.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'telugucinema', value: credits.crew.writer[0], confidence: DATA_SOURCES.telugucinema.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'telugucinema', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.telugucinema.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'telugucinema', value: credits.crew.producer[0], confidence: DATA_SOURCES.telugucinema.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('TeluguCinema fetch error:', error);
    return {};
  }
}

/**
 * Fetch from FilmiBeat
 */
async function fetchFromFilmiBeat(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.filmibeat.enabled) return {};

  try {
    const credits = await scrapeFilmiBeatCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'filmibeat', value: credits.director[0], confidence: DATA_SOURCES.filmibeat.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'filmibeat', value: credits.cast[0].name, confidence: DATA_SOURCES.filmibeat.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'filmibeat', value: credits.cast[1].name, confidence: DATA_SOURCES.filmibeat.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'filmibeat', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.filmibeat.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'filmibeat', value: credits.crew.editor[0], confidence: DATA_SOURCES.filmibeat.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'filmibeat', value: credits.crew.writer[0], confidence: DATA_SOURCES.filmibeat.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'filmibeat', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.filmibeat.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'filmibeat', value: credits.crew.producer[0], confidence: DATA_SOURCES.filmibeat.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('FilmiBeat fetch error:', error);
    return {};
  }
}

/**
 * Fetch from M9News
 */
async function fetchFromM9News(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.m9news.enabled) return {};

  try {
    const credits = await scrapeM9NewsCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'm9news', value: credits.director[0], confidence: DATA_SOURCES.m9news.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'm9news', value: credits.cast[0].name, confidence: DATA_SOURCES.m9news.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'm9news', value: credits.cast[1].name, confidence: DATA_SOURCES.m9news.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'm9news', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.m9news.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'm9news', value: credits.crew.editor[0], confidence: DATA_SOURCES.m9news.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'm9news', value: credits.crew.writer[0], confidence: DATA_SOURCES.m9news.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'm9news', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.m9news.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'm9news', value: credits.crew.producer[0], confidence: DATA_SOURCES.m9news.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('M9News fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Eenadu
 */
async function fetchFromEenadu(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.eenadu.enabled) return {};

  try {
    const credits = await scrapeEenaduCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'eenadu', value: credits.director[0], confidence: DATA_SOURCES.eenadu.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'eenadu', value: credits.cast[0].name, confidence: DATA_SOURCES.eenadu.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'eenadu', value: credits.cast[1].name, confidence: DATA_SOURCES.eenadu.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'eenadu', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.eenadu.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'eenadu', value: credits.crew.editor[0], confidence: DATA_SOURCES.eenadu.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'eenadu', value: credits.crew.writer[0], confidence: DATA_SOURCES.eenadu.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'eenadu', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.eenadu.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'eenadu', value: credits.crew.producer[0], confidence: DATA_SOURCES.eenadu.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('Eenadu fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Sakshi
 */
async function fetchFromSakshi(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.sakshi.enabled) return {};

  try {
    const credits = await scrapeSakshiCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'sakshi', value: credits.director[0], confidence: DATA_SOURCES.sakshi.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'sakshi', value: credits.cast[0].name, confidence: DATA_SOURCES.sakshi.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'sakshi', value: credits.cast[1].name, confidence: DATA_SOURCES.sakshi.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'sakshi', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.sakshi.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'sakshi', value: credits.crew.editor[0], confidence: DATA_SOURCES.sakshi.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'sakshi', value: credits.crew.writer[0], confidence: DATA_SOURCES.sakshi.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'sakshi', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.sakshi.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'sakshi', value: credits.crew.producer[0], confidence: DATA_SOURCES.sakshi.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('Sakshi fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Gulte
 */
async function fetchFromGulte(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.gulte.enabled) return {};

  try {
    const credits = await scrapeGulteCredits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'gulte', value: credits.director[0], confidence: DATA_SOURCES.gulte.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'gulte', value: credits.cast[0].name, confidence: DATA_SOURCES.gulte.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'gulte', value: credits.cast[1].name, confidence: DATA_SOURCES.gulte.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'gulte', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.gulte.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'gulte', value: credits.crew.editor[0], confidence: DATA_SOURCES.gulte.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'gulte', value: credits.crew.writer[0], confidence: DATA_SOURCES.gulte.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'gulte', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.gulte.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'gulte', value: credits.crew.producer[0], confidence: DATA_SOURCES.gulte.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('Gulte fetch error:', error);
    return {};
  }
}

/**
 * Fetch from Telugu360
 */
async function fetchFromTelugu360(query: MovieQuery): Promise<FieldSources> {
  if (!DATA_SOURCES.telugu360.enabled) return {};

  try {
    const credits = await scrapeTelugu360Credits(query.title_en, query.release_year);
    if (!credits) return {};

    const result: FieldSources = {};

    if (credits.director?.[0]) {
      result.director = [{ sourceId: 'telugu360', value: credits.director[0], confidence: DATA_SOURCES.telugu360.confidence }];
    }

    if (credits.cast && credits.cast.length > 0) {
      result.hero = [{ sourceId: 'telugu360', value: credits.cast[0].name, confidence: DATA_SOURCES.telugu360.confidence }];
      if (credits.cast.length > 1) {
        result.heroine = [{ sourceId: 'telugu360', value: credits.cast[1].name, confidence: DATA_SOURCES.telugu360.confidence }];
      }
    }

    if (credits.crew) {
      if (credits.crew.cinematographer?.[0]) {
        result.cinematographer = [{ sourceId: 'telugu360', value: credits.crew.cinematographer[0], confidence: DATA_SOURCES.telugu360.confidence }];
      }
      if (credits.crew.editor?.[0]) {
        result.editor = [{ sourceId: 'telugu360', value: credits.crew.editor[0], confidence: DATA_SOURCES.telugu360.confidence }];
      }
      if (credits.crew.writer?.[0]) {
        result.writer = [{ sourceId: 'telugu360', value: credits.crew.writer[0], confidence: DATA_SOURCES.telugu360.confidence }];
      }
      if (credits.crew.musicDirector?.[0]) {
        result.music_director = [{ sourceId: 'telugu360', value: credits.crew.musicDirector[0], confidence: DATA_SOURCES.telugu360.confidence }];
      }
      if (credits.crew.producer?.[0]) {
        result.producer = [{ sourceId: 'telugu360', value: credits.crew.producer[0], confidence: DATA_SOURCES.telugu360.confidence }];
      }
    }

    return result;
  } catch (error) {
    console.error('Telugu360 fetch error:', error);
    return {};
  }
}

// ============================================================
// CONSENSUS BUILDING
// ============================================================

/**
 * Normalize a value for comparison (lowercase, trim, remove special chars)
 */
function normalizeValue(value: string): string {
  return value.toLowerCase().trim().replace(/[^\w\s]/g, '');
}

/**
 * Check if two values are similar enough to be considered the same
 */
function valuesSimilar(value1: string, value2: string): boolean {
  const norm1 = normalizeValue(value1);
  const norm2 = normalizeValue(value2);

  // Exact match
  if (norm1 === norm2) return true;

  // One contains the other (handles "K. Raghavendra Rao" vs "Raghavendra Rao")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  // Levenshtein distance for typos (simplified)
  const longer = norm1.length > norm2.length ? norm1 : norm2;
  const shorter = norm1.length > norm2.length ? norm2 : norm1;
  const threshold = Math.floor(longer.length * 0.2); // 20% difference allowed

  let distance = 0;
  for (let i = 0; i < shorter.length; i++) {
    if (longer[i] !== shorter[i]) distance++;
  }
  distance += longer.length - shorter.length;

  return distance <= threshold;
}

/**
 * Build consensus from multiple source values
 */
function buildConsensus(sources: SourceValue[]): {
  consensus?: string;
  confidence: number;
  action: 'auto_apply' | 'flag_conflict' | 'manual_review';
  conflict?: { values: string[]; sources: DataSourceId[] };
} {
  if (sources.length === 0) {
    return { confidence: 0, action: 'manual_review' };
  }

  if (sources.length === 1) {
    return {
      consensus: sources[0].value,
      confidence: sources[0].confidence * 0.75, // Single source gets reduced confidence
      action: sources[0].confidence * 0.75 >= 0.75 ? 'auto_apply' : 'flag_conflict',
    };
  }

  // Group similar values
  const groups: Array<{ value: string; sources: SourceValue[] }> = [];

  for (const source of sources) {
    let addedToGroup = false;

    for (const group of groups) {
      if (valuesSimilar(group.value, source.value)) {
        group.sources.push(source);
        addedToGroup = true;
        break;
      }
    }

    if (!addedToGroup) {
      groups.push({ value: source.value, sources: [source] });
    }
  }

  // Sort groups by total confidence (sum of source confidences)
  groups.sort((a, b) => {
    const aConfidence = a.sources.reduce((sum, s) => sum + s.confidence, 0);
    const bConfidence = b.sources.reduce((sum, s) => sum + s.confidence, 0);
    return bConfidence - aConfidence;
  });

  const topGroup = groups[0];
  const topConfidence = topGroup.sources.reduce((sum, s) => sum + s.confidence, 0) / topGroup.sources.length;

  // Perfect consensus (all sources agree)
  if (groups.length === 1) {
    return {
      consensus: topGroup.value,
      confidence: Math.min(0.98, topConfidence * 1.1), // Boost confidence for consensus
      action: 'auto_apply',
    };
  }

  // Majority consensus (3+ sources agree)
  if (topGroup.sources.length >= 3) {
    return {
      consensus: topGroup.value,
      confidence: Math.min(0.90, topConfidence),
      action: 'auto_apply',
    };
  }

  // Weak consensus (2 sources agree)
  if (topGroup.sources.length === 2) {
    return {
      consensus: topGroup.value,
      confidence: Math.min(0.75, topConfidence * 0.9),
      action: 'flag_conflict',
    };
  }

  // Conflict (no agreement)
  return {
    confidence: 0.40,
    action: 'manual_review',
    conflict: {
      values: groups.map(g => g.value),
      sources: sources.map(s => s.sourceId),
    },
  };
}

// ============================================================
// MAIN ORCHESTRATOR
// ============================================================

/**
 * Fetch data from all enabled sources in parallel
 */
export async function fetchFromAllSources(
  query: MovieQuery,
  fields: string[]
): Promise<MultiSourceResult[]> {
  // Fetch from all sources in parallel (21 sources total)
  const [
    tmdbData,
    letterboxdData,
    rottenTomatoesData,
    idlebrainData,
    bookMyShowData,
    eenaduData,
    sakshiData,
    tupakiData,
    gulteData,
    telugu123Data,
    telugu360Data,
    telugucinemaData,
    filmibeatData,
    m9newsData,
    wikipediaData,
    greatAndhraData,
    cinejoshData,
    wikidataData,
    omdbData,
  ] = await Promise.all([
    fetchFromTMDB(query),
    fetchFromLetterboxd(query),
    fetchFromRottenTomatoes(query),
    fetchFromIdlebrain(query),
    fetchFromBookMyShow(query),
    fetchFromEenadu(query),
    fetchFromSakshi(query),
    fetchFromTupaki(query),
    fetchFromGulte(query),
    fetchFrom123Telugu(query),
    fetchFromTelugu360(query),
    fetchFromTeluguCinema(query),
    fetchFromFilmiBeat(query),
    fetchFromM9News(query),
    fetchFromWikipedia(query),
    fetchFromGreatAndhra(query),
    fetchFromCineJosh(query),
    fetchFromWikidata(query),
    fetchFromOMDB(query),
  ]);

  // Merge all source data
  const allData: Record<string, SourceValue[]> = {};

  for (const field of fields) {
    allData[field] = [
      ...(tmdbData[field] || []),
      ...(letterboxdData[field] || []),
      ...(rottenTomatoesData[field] || []),
      ...(idlebrainData[field] || []),
      ...(bookMyShowData[field] || []),
      ...(eenaduData[field] || []),
      ...(sakshiData[field] || []),
      ...(tupakiData[field] || []),
      ...(gulteData[field] || []),
      ...(telugu123Data[field] || []),
      ...(telugu360Data[field] || []),
      ...(telugucinemaData[field] || []),
      ...(filmibeatData[field] || []),
      ...(m9newsData[field] || []),
      ...(wikipediaData[field] || []),
      ...(greatAndhraData[field] || []),
      ...(cinejoshData[field] || []),
      ...(wikidataData[field] || []),
      ...(omdbData[field] || []),
    ];
  }

  // Build consensus for each field
  const results: MultiSourceResult[] = [];

  for (const field of fields) {
    const sources = allData[field] || [];
    const { consensus, confidence, action, conflict } = buildConsensus(sources);

    results.push({
      field,
      sources,
      consensus,
      consensusConfidence: confidence,
      action,
      conflict,
    });
  }

  return results;
}

// ============================================================
// PROFILE DATA FETCHERS (NEW)
// ============================================================

/**
 * Actor query interface for profile data
 */
export interface ActorQuery {
  name: string;
  birth_year?: number;
  debut_year?: number;
  tmdb_id?: number;
}

/**
 * Actor biography result
 */
export interface ActorBiography {
  sourceId: DataSourceId;
  biography_en?: string;
  biography_te?: string;
  birth_date?: string;
  birth_place?: string;
  confidence: number;
  metadata?: Record<string, any>;
}

/**
 * Actor award result
 */
export interface ActorAward {
  award_name: string;
  category?: string;
  year?: number;
  film_title?: string;
  result: 'won' | 'nominated';
  source: DataSourceId;
  confidence: number;
}

/**
 * Actor profile image result
 */
export interface ActorProfileImage {
  sourceId: DataSourceId;
  image_url: string;
  width?: number;
  height?: number;
  confidence: number;
}

/**
 * Fetch actor biography from TMDB
 */
async function fetchActorBiographyFromTMDB(actorName: string): Promise<ActorBiography | null> {
  if (!TMDB_API_KEY || !DATA_SOURCES.tmdb.enabled) return null;

  try {
    // Search for actor
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actorName)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) return null;

    const actor = searchData.results[0];
    const personId = actor.id;

    // Get actor details
    const detailsUrl = `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    return {
      sourceId: 'tmdb',
      biography_en: details.biography || undefined,
      birth_date: details.birthday || undefined,
      birth_place: details.place_of_birth || undefined,
      confidence: DATA_SOURCES.tmdb.confidence,
      metadata: {
        tmdb_id: personId,
        known_for_department: details.known_for_department,
        popularity: details.popularity,
      },
    };
  } catch (error) {
    console.error('TMDB actor biography fetch error:', error);
    return null;
  }
}

/**
 * Fetch actor biography from Wikipedia
 */
async function fetchActorBiographyFromWikipedia(actorName: string): Promise<ActorBiography | null> {
  if (!DATA_SOURCES.wikipedia.enabled) return null;

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(actorName)}&limit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData[3] || searchData[3].length === 0) return null;

    const pageUrl = searchData[3][0];
    const pageTitle = pageUrl.split('/').pop();

    // Get page content
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=${pageTitle}`;
    const contentRes = await fetch(contentUrl);
    const contentData = await contentRes.json();

    const pages = contentData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    const biography = page.extract;

    // Try to extract birth date from infobox
    const infoboxUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions&rvprop=content&rvsection=0&titles=${pageTitle}`;
    const infoboxRes = await fetch(infoboxUrl);
    const infoboxData = await infoboxRes.json();
    
    const infoboxPages = infoboxData.query?.pages;
    const infoboxPage = Object.values(infoboxPages || {})[0] as any;
    const wikitext = infoboxPage?.revisions?.[0]?.['*'] || '';

    // Extract birth date
    const birthMatch = wikitext.match(/\|\s*birth_date\s*=\s*(.+?)(?:\n|\|)/i);
    const birthDate = birthMatch ? birthMatch[1].trim() : undefined;

    // Extract birth place
    const placeMatch = wikitext.match(/\|\s*birth_place\s*=\s*(.+?)(?:\n|\|)/i);
    const birthPlace = placeMatch ? placeMatch[1].replace(/\[\[|\]\]/g, '').trim() : undefined;

    return {
      sourceId: 'wikipedia',
      biography_en: biography,
      birth_date: birthDate,
      birth_place: birthPlace,
      confidence: DATA_SOURCES.wikipedia.confidence,
      metadata: {
        page_title: pageTitle,
        page_url: pageUrl,
      },
    };
  } catch (error) {
    console.error('Wikipedia actor biography fetch error:', error);
    return null;
  }
}

/**
 * Fetch actor biography from Wikidata
 */
async function fetchActorBiographyFromWikidata(actorName: string): Promise<ActorBiography | null> {
  if (!DATA_SOURCES.wikidata.enabled) return null;

  try {
    // SPARQL query to find actor and get biographical data
    const query = `
      SELECT ?person ?description ?birthDate ?birthPlace ?birthPlaceLabel WHERE {
        ?person ?label "${actorName}"@en .
        ?person wdt:P31 wd:Q5 .  # Instance of human
        ?person wdt:P106 ?occupation .
        FILTER(?occupation IN (wd:Q33999, wd:Q10800557, wd:Q2259451)) # Actor/Film actor/Stage actor
        
        OPTIONAL { ?person schema:description ?description FILTER(LANG(?description) = "en") . }
        OPTIONAL { ?person wdt:P569 ?birthDate . }
        OPTIONAL { ?person wdt:P19 ?birthPlace . }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
      LIMIT 1
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const bindings = data.results?.bindings;

    if (!bindings || bindings.length === 0) return null;

    const result = bindings[0];

    return {
      sourceId: 'wikidata',
      biography_en: result.description?.value,
      birth_date: result.birthDate?.value,
      birth_place: result.birthPlaceLabel?.value,
      confidence: DATA_SOURCES.wikidata.confidence,
      metadata: {
        wikidata_id: result.person?.value.split('/').pop(),
      },
    };
  } catch (error) {
    console.error('Wikidata actor biography fetch error:', error);
    return null;
  }
}

/**
 * Fetch actor profile image from TMDB
 */
async function fetchActorProfileImageFromTMDB(actorName: string): Promise<ActorProfileImage | null> {
  if (!TMDB_API_KEY || !DATA_SOURCES.tmdb.enabled) return null;

  try {
    // Search for actor
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(actorName)}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) return null;

    const actor = searchData.results[0];
    
    if (!actor.profile_path) return null;

    return {
      sourceId: 'tmdb',
      image_url: `https://image.tmdb.org/t/p/w500${actor.profile_path}`,
      confidence: DATA_SOURCES.tmdb.confidence,
    };
  } catch (error) {
    console.error('TMDB actor profile image fetch error:', error);
    return null;
  }
}

/**
 * Fetch actor profile image from Wikipedia
 */
async function fetchActorProfileImageFromWikipedia(actorName: string): Promise<ActorProfileImage | null> {
  if (!DATA_SOURCES.wikipedia.enabled) return null;

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(actorName)}&limit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData[3] || searchData[3].length === 0) return null;

    const pageUrl = searchData[3][0];
    const pageTitle = pageUrl.split('/').pop();

    // Get page images
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&pithumbsize=500&titles=${pageTitle}`;
    const imageRes = await fetch(imageUrl);
    const imageData = await imageRes.json();

    const pages = imageData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as any;
    
    if (!page.thumbnail?.source) return null;

    return {
      sourceId: 'wikipedia',
      image_url: page.thumbnail.source,
      width: page.thumbnail.width,
      height: page.thumbnail.height,
      confidence: DATA_SOURCES.wikipedia.confidence,
    };
  } catch (error) {
    console.error('Wikipedia actor profile image fetch error:', error);
    return null;
  }
}

/**
 * Fetch actor awards from Wikipedia (parse awards tables)
 */
async function fetchActorAwardsFromWikipedia(actorName: string): Promise<ActorAward[]> {
  if (!DATA_SOURCES.wikipedia.enabled) return [];

  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(actorName)}&limit=1`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData[3] || searchData[3].length === 0) return [];

    const pageUrl = searchData[3][0];
    const pageTitle = pageUrl.split('/').pop();

    // Get full page content
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${pageTitle}&prop=text`;
    const contentRes = await fetch(contentUrl);
    const contentData = await contentRes.json();

    const html = contentData.parse?.text?.['*'];
    if (!html) return [];

    // Parse awards from tables and lists
    // This is a simplified extraction - a full parser would be more complex
    const awards: ActorAward[] = [];
    
    // Look for common award patterns in the HTML
    const awardPatterns = [
      /(?:won|received|awarded)\s+(?:the\s+)?([^,]+?)\s+(?:Award|award)\s+(?:for|in)\s+(\d{4})/gi,
      /(\d{4})\s*[-–]\s*([^,]+?)\s+(?:Award|award)/gi,
    ];

    for (const pattern of awardPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        awards.push({
          award_name: match[1] || match[2],
          year: parseInt(match[2] || match[1]),
          result: 'won',
          source: 'wikipedia',
          confidence: DATA_SOURCES.wikipedia.confidence * 0.7, // Lower confidence for parsed data
        });
      }
    }

    return awards;
  } catch (error) {
    console.error('Wikipedia actor awards fetch error:', error);
    return [];
  }
}

/**
 * Fetch actor awards from Wikidata (structured data)
 */
async function fetchActorAwardsFromWikidata(actorName: string): Promise<ActorAward[]> {
  if (!DATA_SOURCES.wikidata.enabled) return [];

  try {
    // SPARQL query to find actor and get awards
    const query = `
      SELECT ?awardLabel ?categoryLabel ?pointInTime ?workLabel WHERE {
        ?person ?label "${actorName}"@en .
        ?person wdt:P31 wd:Q5 .  # Instance of human
        ?person wdt:P166 ?award .
        
        OPTIONAL { ?award wdt:P585 ?pointInTime . }
        OPTIONAL { ?person p:P166 [ ps:P166 ?award; pq:P1686 ?work ] . }
        
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
      }
    `;

    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' },
    });

    if (!res.ok) return [];

    const data = await res.json();
    const bindings = data.results?.bindings || [];

    return bindings.map((binding: any) => ({
      award_name: binding.awardLabel?.value || 'Unknown Award',
      category: binding.categoryLabel?.value,
      year: binding.pointInTime?.value ? new Date(binding.pointInTime.value).getFullYear() : undefined,
      film_title: binding.workLabel?.value,
      result: 'won' as const,
      source: 'wikidata' as const,
      confidence: DATA_SOURCES.wikidata.confidence,
    }));
  } catch (error) {
    console.error('Wikidata actor awards fetch error:', error);
    return [];
  }
}

/**
 * Fetch actor biography from multiple sources and build consensus
 */
export async function fetchActorBiography(actorName: string): Promise<{
  biography_en?: string;
  biography_te?: string;
  birth_date?: string;
  birth_place?: string;
  confidence: number;
  sources: ActorBiography[];
}> {
  const [tmdbBio, wikipediaBio, wikidataBio] = await Promise.all([
    fetchActorBiographyFromTMDB(actorName),
    fetchActorBiographyFromWikipedia(actorName),
    fetchActorBiographyFromWikidata(actorName),
  ]);

  const sources = [tmdbBio, wikipediaBio, wikidataBio].filter((bio): bio is ActorBiography => bio !== null);

  if (sources.length === 0) {
    return { confidence: 0, sources: [] };
  }

  // Use consensus building for each field
  const biographies = sources.filter(s => s.biography_en).map(s => ({
    sourceId: s.sourceId,
    value: s.biography_en!,
    confidence: s.confidence,
  }));

  const birthDates = sources.filter(s => s.birth_date).map(s => ({
    sourceId: s.sourceId,
    value: s.birth_date!,
    confidence: s.confidence,
  }));

  const birthPlaces = sources.filter(s => s.birth_place).map(s => ({
    sourceId: s.sourceId,
    value: s.birth_place!,
    confidence: s.confidence,
  }));

  // Use the biography with highest confidence (usually Wikipedia for completeness)
  const bestBiography = biographies.sort((a, b) => {
    // Prefer longer biographies
    const lengthScore = (b.value.length - a.value.length) / 1000;
    return (b.confidence - a.confidence) + lengthScore;
  })[0];

  const birthDateConsensus = buildConsensus(birthDates);
  const birthPlaceConsensus = buildConsensus(birthPlaces);

  // Overall confidence is average of available fields
  const availableFields = [
    bestBiography ? 1 : 0,
    birthDateConsensus.consensus ? 1 : 0,
    birthPlaceConsensus.consensus ? 1 : 0,
  ];
  const filledFields = availableFields.filter(f => f === 1).length;
  const overallConfidence = filledFields > 0
    ? (bestBiography?.confidence || 0) * 0.6 +
      (birthDateConsensus.confidence || 0) * 0.2 +
      (birthPlaceConsensus.confidence || 0) * 0.2
    : 0;

  return {
    biography_en: bestBiography?.value,
    birth_date: birthDateConsensus.consensus,
    birth_place: birthPlaceConsensus.consensus,
    confidence: overallConfidence,
    sources,
  };
}

/**
 * Fetch actor profile image from multiple sources
 */
export async function fetchActorProfileImage(actorName: string): Promise<{
  image_url?: string;
  confidence: number;
  sources: ActorProfileImage[];
}> {
  const [tmdbImage, wikipediaImage] = await Promise.all([
    fetchActorProfileImageFromTMDB(actorName),
    fetchActorProfileImageFromWikipedia(actorName),
  ]);

  const sources = [tmdbImage, wikipediaImage].filter((img): img is ActorProfileImage => img !== null);

  if (sources.length === 0) {
    return { confidence: 0, sources: [] };
  }

  // Prefer TMDB for image quality, fallback to Wikipedia
  const bestImage = sources.sort((a, b) => b.confidence - a.confidence)[0];

  return {
    image_url: bestImage.image_url,
    confidence: bestImage.confidence,
    sources,
  };
}

/**
 * Fetch actor awards from multiple sources
 */
export async function fetchActorAwards(actorName: string): Promise<{
  awards: ActorAward[];
  confidence: number;
}> {
  const [wikipediaAwards, wikidataAwards] = await Promise.all([
    fetchActorAwardsFromWikipedia(actorName),
    fetchActorAwardsFromWikidata(actorName),
  ]);

  const allAwards = [...wikipediaAwards, ...wikidataAwards];

  if (allAwards.length === 0) {
    return { awards: [], confidence: 0 };
  }

  // Deduplicate awards by name and year
  const uniqueAwards = allAwards.reduce((acc, award) => {
    const key = `${award.award_name}-${award.year || 'unknown'}`;
    if (!acc.has(key) || award.confidence > acc.get(key)!.confidence) {
      acc.set(key, award);
    }
    return acc;
  }, new Map<string, ActorAward>());

  const awards = Array.from(uniqueAwards.values());
  const avgConfidence = awards.reduce((sum, a) => sum + a.confidence, 0) / awards.length;

  return {
    awards,
    confidence: avgConfidence,
  };
}

// ============================================================
// SOURCE CONFIGURATION
// ============================================================

/**
 * Enable/disable specific data sources
 */
export function configureSource(sourceId: DataSourceId, enabled: boolean): void {
  if (DATA_SOURCES[sourceId]) {
    DATA_SOURCES[sourceId].enabled = enabled;
  }
}

/**
 * Enable all data sources
 */
export function enableAllSources(): void {
  Object.keys(DATA_SOURCES).forEach(key => {
    DATA_SOURCES[key as DataSourceId].enabled = true;
  });
}

/**
 * Disable all data sources
 */
export function disableAllSources(): void {
  Object.keys(DATA_SOURCES).forEach(key => {
    DATA_SOURCES[key as DataSourceId].enabled = false;
  });
}
