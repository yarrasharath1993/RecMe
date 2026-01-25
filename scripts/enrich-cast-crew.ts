#!/usr/bin/env npx tsx
/**
 * CAST & CREW ENRICHMENT SCRIPT (Enhanced v4.0)
 *
 * Enriches movies with complete cast and crew data from multiple sources
 * using parallel execution and the waterfall pattern.
 *
 * EXTENDED DATA (v4.0):
 * - Hero, Heroine, Director (existing)
 * - Music Director
 * - Producer
 * - Supporting Cast (5 actors with roles)
 * - Crew (cinematographer, editor, writer, choreographer)
 *
 * NEW in v4.0:
 * - IMDb full credits scraper (cinematographer, editor, writer)
 * - Enhanced Telugu Wikipedia infobox parser
 * - Multi-source confidence scoring
 *
 * Usage:
 *   npx tsx scripts/enrich-cast-crew.ts --limit=100 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --extended --limit=500 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --missing-music --limit=50 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --missing-producer --limit=50 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --actor="Chiranjeevi" --execute
 *   npx tsx scripts/enrich-cast-crew.ts --concurrency=25 --execute
 *
 * Sources (in priority order):
 *   1. TMDB Credits API (if tmdb_id exists) - Best for all fields (95%)
 *   2. IMDb Full Credits (if imdb_id exists) - Excellent for crew (90%)
 *   3. Telugu Wikipedia Infobox - Telugu-specific technical credits (85%)
 *   4. Wikidata SPARQL queries - Structured data (80%)
 *   5. MovieBuff (Telugu-specific) - Cast, crew, reviews (70%)
 *   6. JioSaavn - Music director specifically (65%)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

// Import new automation modules
import { scrapeIMDbCredits } from './lib/imdb-scraper';
import { parseTeluguWikipediaInfobox } from './lib/wikipedia-infobox-parser';
import { scrapeLetterboxdCredits } from './lib/letterboxd-scraper';
import { scrapeRottenTomatoesCredits } from './lib/rottentomatoes-scraper';
import { scrapeIdlebrainCredits } from './lib/idlebrain-scraper';
import { scrapeGreatAndhraCredits } from './lib/greatandhra-scraper';
import { scrapeCineJoshCredits } from './lib/cinejosh-scraper';
import { scrapeBookMyShowCredits } from './lib/bookmyshow-scraper';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const LIMIT = parseInt(getArg('limit', '100'));
const EXECUTE = hasFlag('execute');
const EXTENDED = hasFlag('extended');
const MISSING_HERO = hasFlag('missing-hero');
const MISSING_DIRECTOR = hasFlag('missing-director');
const MISSING_HEROINE = hasFlag('missing-heroine');
const MISSING_MUSIC = hasFlag('missing-music');
const MISSING_PRODUCER = hasFlag('missing-producer');
const CONCURRENCY = parseInt(getArg('concurrency', '20'));
const ACTOR = getArg('actor', '');
const DIRECTOR_FILTER = getArg('director', '');
const SLUG = getArg('slug', '');
const DISCOVER = hasFlag('discover'); // NEW: Discover missing films before enriching

// ============================================================================
// TYPES
// ============================================================================

interface SupportingCastMember {
    name: string;
    role?: string;
    order: number;
    type: 'supporting' | 'cameo' | 'special';
}

interface CrewData {
    cinematographer?: string;
    editor?: string;
    writer?: string;
    choreographer?: string;
    art_director?: string;
    lyricist?: string;
}

interface CastCrewResult {
    hero?: string;
    heroine?: string;
    director?: string;
    music_director?: string;
    producer?: string;
    supporting_cast?: SupportingCastMember[];
    crew?: CrewData;
    source: string;
    confidence: number;
    /** Per-field provenance tracking (v2.0) */
    provenance?: FieldProvenance;
}

/**
 * Per-field provenance tracking (v2.0)
 * Records which source provided each field and confidence level
 */
interface FieldProvenance {
    hero?: { source: string; confidence: number; fetchedAt: string };
    heroine?: { source: string; confidence: number; fetchedAt: string };
    director?: { source: string; confidence: number; fetchedAt: string };
    music_director?: { source: string; confidence: number; fetchedAt: string };
    producer?: { source: string; confidence: number; fetchedAt: string };
    supporting_cast?: { source: string; confidence: number; fetchedAt: string };
    crew?: { source: string; confidence: number; fetchedAt: string };
}

interface Movie {
    id: string;
    title_en: string;
    release_year: number;
    hero?: string;
    heroine?: string;
    director?: string;
    music_director?: string;
    producer?: string;
    tmdb_id?: number;
    imdb_id?: string;
}

// ============================================================================
// TMDB CREDITS API
// ============================================================================

async function tryTMDB(movie: Movie): Promise<CastCrewResult | null> {
    if (!movie.tmdb_id || !TMDB_API_KEY) return null;

    try {
        const url = `https://api.themoviedb.org/3/movie/${movie.tmdb_id}/credits?api_key=${TMDB_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data = await response.json();

        const result: CastCrewResult = {
            source: 'TMDB',
            confidence: 0.95,
        };

        // Get lead actors by gender and order
        if (data.cast && data.cast.length > 0) {
            const males = data.cast.filter((c: { gender: number }) => c.gender === 2);
            const females = data.cast.filter((c: { gender: number }) => c.gender === 1);

            if (males.length > 0 && !movie.hero) {
                result.hero = males[0].name;
            }
            if (females.length > 0 && !movie.heroine) {
                result.heroine = females[0].name;
            }

            // Supporting cast (actors 3-7, with character names)
            const supportingStart = 2;
            const supportingEnd = 7;
            const supportingCast: SupportingCastMember[] = [];

            for (let i = supportingStart; i < Math.min(supportingEnd, data.cast.length); i++) {
                const actor = data.cast[i];
                supportingCast.push({
                    name: actor.name,
                    role: actor.character || undefined,
                    order: i - supportingStart + 1,
                    type: 'supporting',
                });
            }

            if (supportingCast.length > 0) {
                result.supporting_cast = supportingCast;
            }
        }

        // Get crew
        if (data.crew) {
            // Director
            const director = data.crew.find((c: { job: string }) => c.job === 'Director');
            if (director && !movie.director) {
                result.director = director.name;
            }

            // Music Director
            const composer = data.crew.find((c: { job: string }) =>
                c.job === 'Original Music Composer' || c.job === 'Music' || c.job === 'Music Director'
            );
            if (composer && !movie.music_director) {
                result.music_director = composer.name;
            }

            // Producer
            const producer = data.crew.find((c: { job: string }) => c.job === 'Producer');
            if (producer && !movie.producer) {
                result.producer = producer.name;
            }

            // Extended crew
            const crewData: CrewData = {};

            const cinematographer = data.crew.find((c: { job: string }) =>
                c.job === 'Director of Photography' || c.job === 'Cinematography'
            );
            if (cinematographer) crewData.cinematographer = cinematographer.name;

            const editor = data.crew.find((c: { job: string }) => c.job === 'Editor');
            if (editor) crewData.editor = editor.name;

            const writer = data.crew.find((c: { job: string }) =>
                c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story'
            );
            if (writer) crewData.writer = writer.name;

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        // Only return if we found something useful
        const hasData = result.hero || result.heroine || result.director ||
            result.music_director || result.producer ||
            (result.supporting_cast && result.supporting_cast.length > 0) ||
            (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch {
        return null;
    }
}

// ============================================================================
// IMDB SCRAPER (New v4.0)
// ============================================================================

async function tryIMDb(movie: Movie, imdbId?: string): Promise<CastCrewResult | null> {
    if (!imdbId || !imdbId.startsWith('tt')) return null;

    try {
        const credits = await scrapeIMDbCredits(imdbId);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'IMDb',
            confidence: 0.90,
        };

        // Cast data
        if (credits.cast && credits.cast.length > 0) {
            // Get top 2 actors for hero/heroine if not already set
            if (!movie.hero && credits.cast[0]) {
                result.hero = credits.cast[0].name;
            }
            if (!movie.heroine && credits.cast[1]) {
                result.heroine = credits.cast[1].name;
            }

            // Supporting cast (positions 2-7)
            if (credits.cast.length > 2) {
                result.supporting_cast = credits.cast.slice(2, 7).map((actor, i) => ({
                    name: actor.name,
                    role: actor.character,
                    order: i + 1,
                    type: 'supporting' as const,
                }));
            }
        }

        // Crew data
        if (credits.crew) {
            const crewData: CrewData = {};

            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0]) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0]) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        // Only return if we found something useful
        const hasData = result.hero || result.heroine || result.music_director ||
            result.producer || (result.supporting_cast && result.supporting_cast.length > 0) ||
            (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`IMDb scraping failed for ${imdbId}:`, error);
        return null;
    }
}

// ============================================================================
// WIKIPEDIA INFOBOX PARSING (Enhanced v4.0)
// ============================================================================

function extractInfoboxValue(html: string, field: string): string[] {
    // Multiple patterns to capture different Wikipedia infobox formats
    const patterns = [
        // Pattern 1: Standard infobox row with th/td
        new RegExp(`<th[^>]*>[^<]*${field}[^<]*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i'),
        // Pattern 2: "Field by" format (Directed by, Produced by)
        new RegExp(`${field}\\s+by[^<]*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i'),
        // Pattern 3: Simple label followed by content
        new RegExp(`>${field}</[^>]+>\\s*</t[hd]>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i'),
        // Pattern 4: Data attribute based (modern Wikipedia)
        new RegExp(`data-wikidata-property-id="[^"]*"[^>]*>${field}[^<]*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`, 'i'),
    ];

    for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
            // Extract all linked names from the cell
            const names = [...match[1].matchAll(/<a[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/g)]
                .map((m) => m[2]?.trim() || m[1]?.trim())
                .filter((n) => n && n.length > 1 && !n.match(/^\d/) && !n.includes('(page'));

            // Also get plain text names (not linked)
            if (names.length === 0) {
                const plainNames = match[1]
                    .replace(/<[^>]+>/g, ' ')
                    .split(/[,\n•·]/)
                    .map((n) => n.trim())
                    .filter((n) => n.length > 2 && !n.match(/^\d/));
                return plainNames;
            }
            return names;
        }
    }
    return [];
}

async function tryWikipedia(movie: Movie): Promise<CastCrewResult | null> {
    try {
        // FIRST: Try enhanced Telugu Wikipedia infobox parser (v4.0)
        const teluguInfobox = await parseTeluguWikipediaInfobox(movie.title_en, movie.release_year);

        if (teluguInfobox) {
            const result: CastCrewResult = {
                source: 'Wikipedia',
                confidence: teluguInfobox.confidence,
            };

            // Crew data from Telugu Wikipedia
            if (teluguInfobox.cinematographer || teluguInfobox.editor ||
                teluguInfobox.writer || teluguInfobox.producer ||
                teluguInfobox.musicDirector) {
                result.crew = {};
                if (teluguInfobox.cinematographer) result.crew.cinematographer = teluguInfobox.cinematographer;
                if (teluguInfobox.editor) result.crew.editor = teluguInfobox.editor;
                if (teluguInfobox.writer) result.crew.writer = teluguInfobox.writer;
            }

            if (teluguInfobox.producer && !movie.producer) {
                result.producer = teluguInfobox.producer;
            }

            if (teluguInfobox.musicDirector && !movie.music_director) {
                result.music_director = teluguInfobox.musicDirector;
            }

            const hasData = result.music_director || result.producer ||
                (result.crew && Object.keys(result.crew).length > 0);

            if (hasData) return result;
        }

        // FALLBACK: Try English Wikipedia HTML scraping (legacy v2.0 method)
        const wikiTitle = movie.title_en.replace(/ /g, '_');
        const patterns = [
            `${wikiTitle}_(${movie.release_year}_Telugu_film)`,
            `${wikiTitle}_(${movie.release_year}_film)`,
            `${wikiTitle}_(Telugu_film)`,
            `${wikiTitle}_(Indian_film)`,
            `${wikiTitle}_(film)`,
            wikiTitle,
        ];

        for (const pattern of patterns) {
            const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pattern)}`;

            const response = await fetch(apiUrl, {
                headers: { 'User-Agent': 'TeluguPortal/1.0 (movie-enrichment)' },
            });

            if (!response.ok) continue;

            const html = await response.text();

            // Verify this is a Telugu film
            const isTeluguFilm = html.toLowerCase().includes('telugu') ||
                html.toLowerCase().includes('tollywood') ||
                html.includes(movie.director || 'XYZNOTFOUND') ||
                html.includes(movie.hero || 'XYZNOTFOUND');

            if (!isTeluguFilm && movie.release_year && movie.release_year > 1950) {
                continue; // Skip non-Telugu films for recent movies
            }

            const result: CastCrewResult = {
                source: 'Wikipedia',
                confidence: 0.85,
            };

            // Director
            const directors = extractInfoboxValue(html, 'Directed');
            if (directors.length > 0 && !movie.director) {
                result.director = directors[0];
            }

            // Produced by
            const producers = extractInfoboxValue(html, 'Produced');
            if (producers.length > 0 && !movie.producer) {
                result.producer = producers[0];
            }

            // Music by
            const musicBy = extractInfoboxValue(html, 'Music');
            if (musicBy.length > 0 && !movie.music_director) {
                result.music_director = musicBy[0];
            }

            // Starring (cast)
            const starring = extractInfoboxValue(html, 'Starring');
            if (starring.length > 0) {
                if (!movie.hero && starring[0]) result.hero = starring[0];
                if (!movie.heroine && starring[1]) result.heroine = starring[1];

                if (starring.length > 2) {
                    result.supporting_cast = starring.slice(2, 7).map((name, i) => ({
                        name,
                        order: i + 1,
                        type: 'supporting' as const,
                    }));
                }
            }

            // Cinematography
            const cinematography = extractInfoboxValue(html, 'Cinematography');
            // Edited by
            const editedBy = extractInfoboxValue(html, 'Edited');
            // Written by
            const writtenBy = extractInfoboxValue(html, 'Written');
            // Screenplay by
            const screenplay = extractInfoboxValue(html, 'Screenplay');

            if (cinematography.length > 0 || editedBy.length > 0 || writtenBy.length > 0 || screenplay.length > 0) {
                result.crew = {};
                if (cinematography.length > 0) result.crew.cinematographer = cinematography[0];
                if (editedBy.length > 0) result.crew.editor = editedBy[0];
                if (writtenBy.length > 0 || screenplay.length > 0) {
                    result.crew.writer = writtenBy[0] || screenplay[0];
                }
            }

            const hasData = result.hero || result.heroine || result.director ||
                result.music_director || result.producer ||
                (result.supporting_cast && result.supporting_cast.length > 0) ||
                (result.crew && Object.keys(result.crew).length > 0);

            if (hasData) return result;
        }

        return null;
    } catch (error) {
        console.error('Wikipedia parsing failed:', error);
        return null;
    }
}

// ============================================================================
// WIKIDATA SPARQL
// ============================================================================

async function tryWikidata(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
            movie.title_en + ' ' + movie.release_year + ' film'
        )}&language=en&format=json`;

        const searchResponse = await fetch(searchUrl, {
            headers: { 'User-Agent': 'TeluguPortal/1.0' },
        });

        if (!searchResponse.ok) return null;

        const searchData = await searchResponse.json();
        if (!searchData.search || searchData.search.length === 0) return null;

        const entityId = searchData.search[0].id;

        const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
        const entityResponse = await fetch(entityUrl, {
            headers: { 'User-Agent': 'TeluguPortal/1.0' },
        });

        if (!entityResponse.ok) return null;

        const entityData = await entityResponse.json();
        const entity = entityData.entities[entityId];

        const result: CastCrewResult = {
            source: 'Wikidata',
            confidence: 0.80,
        };

        // P57 = director
        if (entity.claims?.P57 && !movie.director) {
            const directorId = entity.claims.P57[0]?.mainsnak?.datavalue?.value?.id;
            if (directorId) {
                const name = await getWikidataLabel(directorId);
                if (name) result.director = name;
            }
        }

        // P86 = composer
        if (entity.claims?.P86 && !movie.music_director) {
            const composerId = entity.claims.P86[0]?.mainsnak?.datavalue?.value?.id;
            if (composerId) {
                const name = await getWikidataLabel(composerId);
                if (name) result.music_director = name;
            }
        }

        // P162 = producer
        if (entity.claims?.P162 && !movie.producer) {
            const producerId = entity.claims.P162[0]?.mainsnak?.datavalue?.value?.id;
            if (producerId) {
                const name = await getWikidataLabel(producerId);
                if (name) result.producer = name;
            }
        }

        // P161 = cast member
        if (entity.claims?.P161) {
            const castMembers: SupportingCastMember[] = [];
            let order = 1;

            for (const claim of entity.claims.P161.slice(0, 7)) {
                const actorId = claim?.mainsnak?.datavalue?.value?.id;
                if (actorId) {
                    const name = await getWikidataLabel(actorId);
                    if (name) {
                        if (order === 1 && !movie.hero) {
                            result.hero = name;
                        } else if (order === 2 && !movie.heroine) {
                            result.heroine = name;
                        } else {
                            castMembers.push({
                                name,
                                order: castMembers.length + 1,
                                type: 'supporting',
                            });
                        }
                        order++;
                    }
                }
            }

            if (castMembers.length > 0) {
                result.supporting_cast = castMembers.slice(0, 5);
            }
        }

        const hasData = result.hero || result.heroine || result.director ||
            result.music_director || result.producer ||
            (result.supporting_cast && result.supporting_cast.length > 0);

        return hasData ? result : null;
    } catch {
        return null;
    }
}

async function getWikidataLabel(entityId: string): Promise<string | null> {
    try {
        const url = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'TeluguPortal/1.0' },
        });

        if (!response.ok) return null;

        const data = await response.json();
        return data.entities?.[entityId]?.labels?.en?.value || null;
    } catch {
        return null;
    }
}

// ============================================================================
// MOVIEBUFF (Telugu-specific source) - STUB: Source not yet implemented
// ============================================================================

async function tryMovieBuff(_movie: Movie): Promise<CastCrewResult | null> {
    // MovieBuff fetcher not yet implemented
    // TODO: Implement when MovieBuff API access is available
    return null;
}

// ============================================================================
// JIOSAAVN (Music director specifically) - STUB: Source not yet implemented
// ============================================================================

async function tryJioSaavn(_movie: Movie): Promise<CastCrewResult | null> {
    // JioSaavn fetcher not yet implemented  
    // TODO: Implement when JioSaavn API access is available
    return null;
}

// ============================================================================
// LETTERBOXD (Verified community data)
// ============================================================================

async function tryLetterboxd(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const credits = await scrapeLetterboxdCredits(movie.title_en, movie.release_year);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'Letterboxd',
            confidence: 0.92,
        };

        if (credits.director && credits.director.length > 0 && !movie.director) {
            result.director = credits.director[0];
        }

        if (credits.cast && credits.cast.length > 0) {
            if (!movie.hero && credits.cast[0]) {
                result.hero = credits.cast[0].name;
            }
            if (!movie.heroine && credits.cast[1]) {
                result.heroine = credits.cast[1].name;
            }
        }

        if (credits.crew) {
            const crewData: CrewData = {};
            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0] && !movie.producer) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0] && !movie.music_director) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        const hasData = result.hero || result.heroine || result.director || result.music_director ||
            result.producer || (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`Letterboxd scraping failed:`, error);
        return null;
    }
}

// ============================================================================
// ROTTEN TOMATOES (Verified editorial data)
// ============================================================================

async function tryRottenTomatoes(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const credits = await scrapeRottenTomatoesCredits(movie.title_en, movie.release_year);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'RottenTomatoes',
            confidence: 0.90,
        };

        if (credits.director && credits.director.length > 0 && !movie.director) {
            result.director = credits.director[0];
        }

        if (credits.cast && credits.cast.length > 0) {
            if (!movie.hero && credits.cast[0]) {
                result.hero = credits.cast[0].name;
            }
            if (!movie.heroine && credits.cast[1]) {
                result.heroine = credits.cast[1].name;
            }
        }

        if (credits.crew) {
            const crewData: CrewData = {};
            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0] && !movie.producer) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0] && !movie.music_director) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        const hasData = result.hero || result.heroine || result.director || result.music_director ||
            result.producer || (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`RottenTomatoes scraping failed:`, error);
        return null;
    }
}

// ============================================================================
// IDLEBRAIN (Telugu-specific source)
// ============================================================================

async function tryIdlebrain(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const credits = await scrapeIdlebrainCredits(movie.title_en, movie.release_year);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'IdleBrain',
            confidence: 0.88,
        };

        if (credits.director && credits.director.length > 0 && !movie.director) {
            result.director = credits.director[0];
        }

        if (credits.cast && credits.cast.length > 0) {
            const hero = credits.cast.find(c => c.role === 'Hero') || credits.cast[0];
            if (!movie.hero && hero) {
                result.hero = hero.name;
            }

            const heroine = credits.cast.find(c => c.role === 'Heroine') || credits.cast[1];
            if (!movie.heroine && heroine) {
                result.heroine = heroine.name;
            }
        }

        if (credits.crew) {
            const crewData: CrewData = {};
            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0] && !movie.producer) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0] && !movie.music_director) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        const hasData = result.hero || result.heroine || result.director || result.music_director ||
            result.producer || (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`IdleBrain scraping failed:`, error);
        return null;
    }
}

// ============================================================================
// GREATANDHRA (Telugu review source)
// ============================================================================

async function tryGreatAndhra(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const credits = await scrapeGreatAndhraCredits(movie.title_en, movie.release_year);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'GreatAndhra',
            confidence: 0.85,
        };

        if (credits.director && credits.director.length > 0 && !movie.director) {
            result.director = credits.director[0];
        }

        if (credits.cast && credits.cast.length > 0) {
            const hero = credits.cast.find(c => c.role === 'Hero') || credits.cast[0];
            if (!movie.hero && hero) {
                result.hero = hero.name;
            }

            const heroine = credits.cast.find(c => c.role === 'Heroine') || credits.cast[1];
            if (!movie.heroine && heroine) {
                result.heroine = heroine.name;
            }
        }

        if (credits.crew) {
            const crewData: CrewData = {};
            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0] && !movie.producer) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0] && !movie.music_director) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        const hasData = result.hero || result.heroine || result.director || result.music_director ||
            result.producer || (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`GreatAndhra scraping failed:`, error);
        return null;
    }
}

// ============================================================================
// CINEJOSH (Telugu review source)
// ============================================================================

async function tryCineJosh(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const credits = await scrapeCineJoshCredits(movie.title_en, movie.release_year);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'CineJosh',
            confidence: 0.82,
        };

        if (credits.director && credits.director.length > 0 && !movie.director) {
            result.director = credits.director[0];
        }

        if (credits.cast && credits.cast.length > 0) {
            const hero = credits.cast.find(c => c.role === 'Hero') || credits.cast[0];
            if (!movie.hero && hero) {
                result.hero = hero.name;
            }

            const heroine = credits.cast.find(c => c.role === 'Heroine') || credits.cast[1];
            if (!movie.heroine && heroine) {
                result.heroine = heroine.name;
            }
        }

        if (credits.crew) {
            const crewData: CrewData = {};
            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0] && !movie.producer) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0] && !movie.music_director) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        const hasData = result.hero || result.heroine || result.director || result.music_director ||
            result.producer || (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`CineJosh scraping failed:`, error);
        return null;
    }
}

// ============================================================================
// BOOKMYSHOW (Official booking data)
// ============================================================================

async function tryBookMyShow(movie: Movie): Promise<CastCrewResult | null> {
    try {
        const credits = await scrapeBookMyShowCredits(movie.title_en, movie.release_year);
        if (!credits) return null;

        const result: CastCrewResult = {
            source: 'BookMyShow',
            confidence: 0.88,
        };

        if (credits.director && credits.director.length > 0 && !movie.director) {
            result.director = credits.director[0];
        }

        if (credits.cast && credits.cast.length > 0) {
            if (!movie.hero && credits.cast[0]) {
                result.hero = credits.cast[0].name;
            }
            if (!movie.heroine && credits.cast[1]) {
                result.heroine = credits.cast[1].name;
            }
        }

        if (credits.crew) {
            const crewData: CrewData = {};
            if (credits.crew.cinematographer?.length && credits.crew.cinematographer[0]) {
                crewData.cinematographer = credits.crew.cinematographer[0];
            }
            if (credits.crew.editor?.length && credits.crew.editor[0]) {
                crewData.editor = credits.crew.editor[0];
            }
            if (credits.crew.writer?.length && credits.crew.writer[0]) {
                crewData.writer = credits.crew.writer[0];
            }
            if (credits.crew.producer?.length && credits.crew.producer[0] && !movie.producer) {
                result.producer = credits.crew.producer[0];
            }
            if (credits.crew.musicDirector?.length && credits.crew.musicDirector[0] && !movie.music_director) {
                result.music_director = credits.crew.musicDirector[0];
            }

            if (Object.keys(crewData).length > 0) {
                result.crew = crewData;
            }
        }

        const hasData = result.hero || result.heroine || result.director || result.music_director ||
            result.producer || (result.crew && Object.keys(result.crew).length > 0);

        return hasData ? result : null;
    } catch (error) {
        console.error(`BookMyShow scraping failed:`, error);
        return null;
    }
}

// ============================================================================
// ENRICHMENT LOGIC
// ============================================================================

async function enrichMovie(movie: Movie): Promise<CastCrewResult | null> {
    const sources = [
        { name: 'TMDB', fn: tryTMDB, confidence: 0.95 },
        { name: 'Letterboxd', fn: tryLetterboxd, confidence: 0.92 },
        { name: 'RottenTomatoes', fn: tryRottenTomatoes, confidence: 0.90 },
        { name: 'IMDb', fn: (m: Movie) => tryIMDb(m, m.imdb_id), confidence: 0.90 },
        { name: 'IdleBrain', fn: tryIdlebrain, confidence: 0.88 },
        { name: 'BookMyShow', fn: tryBookMyShow, confidence: 0.88 },
        { name: 'Wikipedia', fn: tryWikipedia, confidence: 0.85 },
        { name: 'GreatAndhra', fn: tryGreatAndhra, confidence: 0.85 },
        { name: 'CineJosh', fn: tryCineJosh, confidence: 0.82 },
        { name: 'Wikidata', fn: tryWikidata, confidence: 0.80 },
        { name: 'MovieBuff', fn: tryMovieBuff, confidence: 0.70 },
        { name: 'JioSaavn', fn: tryJioSaavn, confidence: 0.65 },
    ];

    // Try each source in order, combining results for missing fields
    let combinedResult: CastCrewResult | null = null;
    const provenance: FieldProvenance = {};
    const fetchedAt = new Date().toISOString();

    for (const source of sources) {
        const result = await source.fn(movie);

        if (result) {
            if (!combinedResult) {
                combinedResult = result;
                combinedResult.provenance = provenance;
                
                // Record initial provenance
                if (result.hero) {
                    provenance.hero = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.heroine) {
                    provenance.heroine = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.director) {
                    provenance.director = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.music_director) {
                    provenance.music_director = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.producer) {
                    provenance.producer = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.supporting_cast?.length) {
                    provenance.supporting_cast = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.crew && Object.keys(result.crew).length > 0) {
                    provenance.crew = { source: source.name, confidence: source.confidence, fetchedAt };
                }
            } else {
                // Merge missing fields from this source with provenance tracking
                if (result.hero && !combinedResult.hero) {
                    combinedResult.hero = result.hero;
                    provenance.hero = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.heroine && !combinedResult.heroine) {
                    combinedResult.heroine = result.heroine;
                    provenance.heroine = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.director && !combinedResult.director) {
                    combinedResult.director = result.director;
                    provenance.director = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.music_director && !combinedResult.music_director) {
                    combinedResult.music_director = result.music_director;
                    combinedResult.source = `${combinedResult.source}+${result.source}`;
                    provenance.music_director = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.producer && !combinedResult.producer) {
                    combinedResult.producer = result.producer;
                    provenance.producer = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.supporting_cast && (!combinedResult.supporting_cast || combinedResult.supporting_cast.length === 0)) {
                    combinedResult.supporting_cast = result.supporting_cast;
                    provenance.supporting_cast = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                if (result.crew && (!combinedResult.crew || Object.keys(combinedResult.crew).length === 0)) {
                    combinedResult.crew = result.crew;
                    provenance.crew = { source: source.name, confidence: source.confidence, fetchedAt };
                }
                
                // Update provenance reference
                combinedResult.provenance = provenance;
            }
        }

        await new Promise((r) => setTimeout(r, 100));

        // Check if we have all essential data
        if (combinedResult?.hero && combinedResult?.director && combinedResult?.music_director) {
            break;
        }
    }

    return combinedResult;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           CAST & CREW ENRICHMENT SCRIPT (v4.0)                       ║
║   Sources: TMDB, IMDb, Wikipedia, Wikidata, MovieBuff, JioSaavn     ║
║   Extended: Music Director, Producer, 5 Supporting, Crew             ║
║   Enhanced: IMDb scraper + Telugu Wikipedia parser                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} movies`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Extended mode: ${EXTENDED ? 'Yes' : 'No'}`);
    console.log(`  Discover mode: ${DISCOVER ? chalk.magenta('ENABLED - Will find missing films first') : 'No'}`);
    if (ACTOR) console.log(`  Actor filter: "${ACTOR}"`);
    if (DIRECTOR_FILTER) console.log(`  Director filter: "${DIRECTOR_FILTER}"`);
    if (SLUG) console.log(`  Slug filter: "${SLUG}"`);

    // Step 0: Discovery Phase (if enabled)
    if (DISCOVER && ACTOR) {
        console.log(chalk.magenta.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║              DISCOVERY PHASE: Finding Missing Films                  ║
╚══════════════════════════════════════════════════════════════════════╝
`));

        const { spawn } = await import('child_process');

        await new Promise<void>((resolve) => {
            const discoveryArgs = [`--actor="${ACTOR}"`];
            if (EXECUTE) discoveryArgs.push('--execute');

            console.log(chalk.cyan(`Running: npx tsx scripts/discover-add-actor-films.ts ${discoveryArgs.join(' ')}\n`));

            const child = spawn('npx', ['tsx', 'scripts/discover-add-actor-films.ts', ...discoveryArgs], {
                stdio: 'inherit',
                shell: true,
            });

            child.on('close', () => {
                console.log(chalk.green('\n✅ Discovery phase completed'));
                resolve();
            });

            child.on('error', (error) => {
                console.error(chalk.red('Discovery phase failed:'), error);
                resolve();
            });
        });
    }

    // Build query based on flags
    let query = supabase
        .from('movies')
        .select('id, title_en, release_year, hero, heroine, director, music_director, producer, supporting_cast, crew, tmdb_id, imdb_id')
        .eq('language', 'Telugu');

    let filterDesc = 'Missing any cast/crew';

    // Apply actor/director/slug filters first (overrides other filters if specified)
    if (ACTOR) {
        query = query.ilike('hero', `%${ACTOR}%`);
        filterDesc = `Actor: ${ACTOR}`;
    } else if (DIRECTOR_FILTER) {
        query = query.ilike('director', `%${DIRECTOR_FILTER}%`);
        filterDesc = `Director: ${DIRECTOR_FILTER}`;
    } else if (SLUG) {
        query = query.eq('slug', SLUG);
        filterDesc = `Slug: ${SLUG}`;
    } else if (MISSING_HERO) {
        query = query.or('hero.is.null,hero.eq.Unknown');
        filterDesc = 'Missing hero';
    } else if (MISSING_DIRECTOR) {
        query = query.or('director.is.null,director.eq.Unknown');
        filterDesc = 'Missing director';
    } else if (MISSING_HEROINE) {
        query = query.or('heroine.is.null,heroine.eq.Unknown');
        filterDesc = 'Missing heroine';
    } else if (MISSING_MUSIC) {
        query = query.is('music_director', null);
        filterDesc = 'Missing music director';
    } else if (MISSING_PRODUCER) {
        query = query.is('producer', null);
        filterDesc = 'Missing producer';
    } else if (EXTENDED) {
        // Extended mode: find movies missing any extended data
        query = query.or('music_director.is.null,producer.is.null,supporting_cast.eq.[]');
        filterDesc = 'Missing extended cast/crew data';
    } else {
        query = query.or(
            'hero.is.null,hero.eq.Unknown,heroine.is.null,heroine.eq.Unknown,director.is.null,director.eq.Unknown'
        );
    }

    console.log(`  Filter: ${filterDesc}\n`);

    query = query.order('release_year', { ascending: false }).limit(LIMIT);

    const { data: movies, error } = await query;

    if (error) {
        console.error(chalk.red('Error fetching movies:'), error);
        return;
    }

    console.log(`  Found ${chalk.cyan(movies?.length || 0)} movies to process\n`);

    if (!movies || movies.length === 0) {
        console.log(chalk.green('  ✅ No movies need processing.'));
        return;
    }

    // Stats
    const stats = {
        TMDB: 0,
        Wikipedia: 0,
        Wikidata: 0,
        Combined: 0,
        none: 0,
    };

    let enriched = 0;
    let updated = 0;

    console.log('  Processing...\n');

    // Process movies with concurrency control
    const results: { movie: Movie; result: CastCrewResult | null }[] = [];
    const batchSize = CONCURRENCY;
    
    for (let i = 0; i < movies.length; i += batchSize) {
        const batch = movies.slice(i, Math.min(i + batchSize, movies.length));
        
        const batchPromises = batch.map(async (movie) => {
            const result = await enrichMovie(movie);
            return { movie, result };
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        for (const taskData of batchResults) {
            results.push(taskData);
            
            if (taskData.result) {
                // Track source (handle combined sources like "TMDB+Wikipedia")
                if (taskData.result.source.includes('+')) {
                    stats.Combined++;
                } else if (taskData.result.source in stats) {
                    stats[taskData.result.source as keyof typeof stats]++;
                }
                enriched++;
            } else {
                stats.none++;
            }
        }
        
        const completed = Math.min(i + batchSize, movies.length);
        const pct = Math.round((completed / movies.length) * 100);
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        process.stdout.write(`\r  [${bar}] ${pct}% (${completed}/${movies.length}) | Enriched: ${enriched}`);
    }

    console.log('\n\n');

    // Apply updates to database
    if (EXECUTE && enriched > 0) {
        console.log('\n\n  Applying updates to database...\n');

        for (const taskResult of results) {
            if (!taskResult.result) continue;

            const { movie, result: enrichResult } = taskResult;

            const updateData: Record<string, unknown> = {};

            if (enrichResult.hero && !movie.hero) updateData.hero = enrichResult.hero;
            if (enrichResult.heroine && !movie.heroine) updateData.heroine = enrichResult.heroine;
            if (enrichResult.director && !movie.director) updateData.director = enrichResult.director;
            if (enrichResult.music_director && !movie.music_director) updateData.music_director = enrichResult.music_director;
            if (enrichResult.producer && !movie.producer) updateData.producer = enrichResult.producer;
            if (enrichResult.supporting_cast && enrichResult.supporting_cast.length > 0) {
                updateData.supporting_cast = enrichResult.supporting_cast;
            }
            if (enrichResult.crew && Object.keys(enrichResult.crew).length > 0) {
                updateData.crew = enrichResult.crew;
            }

            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('movies')
                    .update(updateData)
                    .eq('id', movie.id);

                if (!updateError) {
                    updated++;
                }
            }
        }

        console.log(`  Updated ${chalk.green(updated)} movies in database\n`);
    }

    // Summary
    console.log(chalk.cyan.bold(`
═══════════════════════════════════════════════════════════════════
📊 ENRICHMENT SUMMARY
═══════════════════════════════════════════════════════════════════`));
    console.log(`  Processed:     ${movies.length} movies`);
    console.log(`  Enriched:      ${chalk.green(enriched)} movies`);
    console.log(`  Not found:     ${stats.none}`);
    console.log(`  Updated in DB: ${updated}`);
    console.log(`  Success rate:  ${Math.round((enriched / movies.length) * 100)}%`);
    console.log(`
  By Source:`);
    console.log(`    TMDB:      ${stats.TMDB}`);
    console.log(`    Wikipedia: ${stats.Wikipedia}`);
    console.log(`    Wikidata:  ${stats.Wikidata}`);
    console.log(`    Combined:  ${stats.Combined}`);

    if (!EXECUTE) {
        console.log(chalk.yellow(`
  ⚠️  DRY RUN - No changes were made.
  Run with --execute to apply changes.`));
    } else {
        console.log(chalk.green(`
  ✅ Enrichment complete!`));
    }
}

main().catch(console.error);
