#!/usr/bin/env npx tsx
/**
 * CAST & CREW ENRICHMENT SCRIPT (Enhanced v2.0)
 *
 * Enriches movies with complete cast and crew data from multiple sources
 * using parallel execution and the waterfall pattern.
 *
 * EXTENDED DATA (v2.0):
 * - Hero, Heroine, Director (existing)
 * - Music Director
 * - Producer
 * - Supporting Cast (5 actors with roles)
 * - Crew (cinematographer, editor, writer, choreographer)
 *
 * Usage:
 *   npx tsx scripts/enrich-cast-crew.ts --limit=100 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --extended --limit=500 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --missing-music --limit=50 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --missing-producer --limit=50 --execute
 *   npx tsx scripts/enrich-cast-crew.ts --concurrency=25 --execute
 *
 * Sources (in priority order):
 *   1. TMDB Credits API (if tmdb_id exists) - Best for all fields
 *   2. Wikipedia Infobox parsing
 *   3. Wikidata SPARQL queries
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import { runParallel, type Task } from '../lib/pipeline/execution-controller';

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
// WIKIPEDIA INFOBOX PARSING (Enhanced v2.0)
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
                (result.supporting_cast && result.supporting_cast.length > 0);

            if (hasData) return result;
        }

        return null;
    } catch {
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
// ENRICHMENT LOGIC
// ============================================================================

async function enrichMovie(movie: Movie): Promise<CastCrewResult | null> {
    const sources = [
        { name: 'TMDB', fn: tryTMDB },
        { name: 'Wikipedia', fn: tryWikipedia },
        { name: 'Wikidata', fn: tryWikidata },
    ];

    for (const source of sources) {
        const result = await source.fn(movie);
        if (result) {
            return result;
        }
        await new Promise((r) => setTimeout(r, 100));
    }

    return null;
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
    console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║           CAST & CREW ENRICHMENT SCRIPT (v2.0)                       ║
║     Extended: Music Director, Producer, 5 Supporting, Crew           ║
╚══════════════════════════════════════════════════════════════════════╝
`));

    console.log(`  Mode: ${EXECUTE ? chalk.green('EXECUTE') : chalk.yellow('DRY RUN')}`);
    console.log(`  Limit: ${LIMIT} movies`);
    console.log(`  Concurrency: ${CONCURRENCY}`);
    console.log(`  Extended mode: ${EXTENDED ? 'Yes' : 'No'}`);

    // Build query based on flags
    let query = supabase
        .from('movies')
        .select('id, title_en, release_year, hero, heroine, director, music_director, producer, supporting_cast, crew, tmdb_id')
        .eq('language', 'Telugu');

    let filterDesc = 'Missing any cast/crew';

    if (MISSING_HERO) {
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

    // Create tasks for parallel execution
    const tasks: Task<{ movie: Movie; result: CastCrewResult | null }>[] = movies.map((movie) => ({
        id: movie.id,
        name: movie.title_en,
        execute: async () => {
            const result = await enrichMovie(movie);
            return { movie, result };
        },
        retryable: true,
    }));

    // Stats
    const stats = {
        TMDB: 0,
        Wikipedia: 0,
        Wikidata: 0,
        none: 0,
    };

    let enriched = 0;
    let updated = 0;

    console.log('  Processing...\n');

    const result = await runParallel(tasks, {
        concurrency: CONCURRENCY,
        maxRetries: 2,
        retryDelayMs: 500,
        onProgress: (completed, total) => {
            const pct = Math.round((completed / total) * 100);
            const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
            process.stdout.write(`\r  [${bar}] ${pct}% (${completed}/${total}) | Enriched: ${enriched}`);
        },
        onTaskComplete: (taskResult) => {
            if (taskResult.success && taskResult.result) {
                const { result: enrichResult } = taskResult.result;
                if (enrichResult) {
                    stats[enrichResult.source as keyof typeof stats]++;
                    enriched++;
                } else {
                    stats.none++;
                }
            }
        },
    });

    console.log('\n\n');

    // Apply updates to database
    if (EXECUTE && enriched > 0) {
        console.log('  Applying updates to database...\n');

        for (const taskResult of result.results) {
            if (!taskResult.success || !taskResult.result?.result) continue;

            const { movie, result: enrichResult } = taskResult.result;

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
    const duration = 'N/A'; // Would need to track start time
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
