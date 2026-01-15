/**
 * GHOST ENTRY RE-ATTRIBUTION ENGINE
 * 
 * Identifies "ghost entries" (films incorrectly attributed to an actor) and determines
 * the correct actor through multi-source verification. NEVER deletes - only re-attributes.
 * 
 * Features:
 * - Multi-source verification (TMDB, IMDb, Wikipedia, Wikidata, OMDB)
 * - Consensus building algorithm
 * - Confidence scoring
 * - Never deletes - always suggests re-attribution or flags for manual review
 * 
 * Decision Tree:
 * - 3+ sources agree on different actor: Re-attribute (95% confidence)
 * - 2 sources agree on different actor: Re-attribute (80% confidence)
 * - 1 source suggests different actor: Flag for manual review
 * - 0 sources have cast data: Flag for manual review (never delete)
 */

import { fetchFromAllSources, MultiSourceResult } from './multi-source-orchestrator';
import { CONFIDENCE_THRESHOLDS, boostConfidenceForConsensus } from './confidence-config';
import { scrapeIMDbCredits, isActorInCast as isActorInIMDbCast } from './imdb-scraper';
import { parseWikipediaInfobox, isActorInWikipediaCast } from './wikipedia-infobox-parser';

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ============================================================
// TYPES
// ============================================================

export interface GhostEntry {
  movieId: string;
  title: string;
  releaseYear: number;
  currentActor: string;
  tmdbId?: number;
  imdbId?: string;
}

export interface ReAttributionResult {
  confidence: number;
  suggestedActor: string | null;
  sources: Array<{
    source: 'tmdb' | 'wikipedia' | 'imdb' | 'wikidata' | 'omdb';
    actor: string;
    role?: string;
    castOrder?: number;
  }>;
  action: 'reattribute' | 'manual_review';
  reason: string;
}

export interface GhostAnalysis {
  movieId: string;
  title: string;
  currentActor: string;
  isGhost: boolean;
  reattribution?: ReAttributionResult;
}

// ============================================================
// ACTOR VERIFICATION
// ============================================================

/**
 * Check if actor is in TMDB cast
 */
async function verifyActorInTMDB(
  tmdbId: number,
  actorName: string
): Promise<{ found: boolean; suggestedActor?: string; castOrder?: number }> {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY not configured');
  }

  try {
    const creditsUrl = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    const response = await fetch(creditsUrl);
    const credits = await response.json();

    if (!credits.cast) {
      return { found: false };
    }

    const normalizedName = actorName.toLowerCase().trim();

    // Check if actor is in cast
    const actorInCast = credits.cast.find((c: any) => 
      c.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(c.name.toLowerCase())
    );

    if (actorInCast) {
      return { found: true, castOrder: actorInCast.order };
    }

    // Actor not found - suggest the lead actor
    const leadActor = credits.cast.find((c: any) => c.order === 0);
    
    return {
      found: false,
      suggestedActor: leadActor?.name,
      castOrder: leadActor?.order,
    };

  } catch (error) {
    console.error(`TMDB cast verification error:`, error);
    return { found: false };
  }
}

/**
 * Check if actor is in IMDb cast
 */
async function verifyActorInIMDb(
  imdbId: string,
  actorName: string
): Promise<{ found: boolean; suggestedActor?: string; castOrder?: number }> {
  try {
    const credits = await scrapeIMDbCredits(imdbId);
    
    if (!credits || !credits.cast) {
      return { found: false };
    }

    const found = isActorInIMDbCast(credits, actorName);

    if (found) {
      return { found: true };
    }

    // Actor not found - suggest the lead actor
    const leadActor = credits.cast[0];
    
    return {
      found: false,
      suggestedActor: leadActor?.name,
      castOrder: leadActor?.order,
    };

  } catch (error) {
    console.error(`IMDb cast verification error:`, error);
    return { found: false };
  }
}

/**
 * Check if actor is in Wikipedia cast
 */
async function verifyActorInWikipedia(
  title: string,
  year: number,
  actorName: string
): Promise<{ found: boolean; suggestedActor?: string }> {
  try {
    const infobox = await parseWikipediaInfobox(title, year);
    
    if (!infobox) {
      return { found: false };
    }

    const found = isActorInWikipediaCast(infobox, actorName);

    if (found) {
      return { found: true };
    }

    // Actor not found - suggest the first cast member
    const suggestedActor = infobox.cast && infobox.cast.length > 0 ? infobox.cast[0] : undefined;
    
    return {
      found: false,
      suggestedActor,
    };

  } catch (error) {
    console.error(`Wikipedia cast verification error:`, error);
    return { found: false };
  }
}

// ============================================================
// RE-ATTRIBUTION LOGIC
// ============================================================

/**
 * Determine if film is a ghost entry and suggest re-attribution
 */
export async function analyzeGhostEntry(
  movie: GhostEntry
): Promise<GhostAnalysis> {
  const sources: ReAttributionResult['sources'] = [];

  // Verify with TMDB
  if (movie.tmdbId) {
    const tmdbResult = await verifyActorInTMDB(movie.tmdbId, movie.currentActor);
    
    if (!tmdbResult.found && tmdbResult.suggestedActor) {
      sources.push({
        source: 'tmdb',
        actor: tmdbResult.suggestedActor,
        castOrder: tmdbResult.castOrder,
      });
    } else if (tmdbResult.found) {
      // Actor found - not a ghost entry
      return {
        movieId: movie.movieId,
        title: movie.title,
        currentActor: movie.currentActor,
        isGhost: false,
      };
    }
  }

  // Verify with IMDb
  if (movie.imdbId) {
    const imdbResult = await verifyActorInIMDb(movie.imdbId, movie.currentActor);
    
    if (!imdbResult.found && imdbResult.suggestedActor) {
      sources.push({
        source: 'imdb',
        actor: imdbResult.suggestedActor,
        castOrder: imdbResult.castOrder,
      });
    } else if (imdbResult.found) {
      // Actor found - not a ghost entry
      return {
        movieId: movie.movieId,
        title: movie.title,
        currentActor: movie.currentActor,
        isGhost: false,
      };
    }
  }

  // Verify with Wikipedia
  const wikiResult = await verifyActorInWikipedia(movie.title, movie.releaseYear, movie.currentActor);
  
  if (!wikiResult.found && wikiResult.suggestedActor) {
    sources.push({
      source: 'wikipedia',
      actor: wikiResult.suggestedActor,
    });
  } else if (wikiResult.found) {
    // Actor found - not a ghost entry
    return {
      movieId: movie.movieId,
      title: movie.title,
      currentActor: movie.currentActor,
      isGhost: false,
    };
  }

  // If no sources found the actor, it's likely a ghost entry
  if (sources.length === 0) {
    return {
      movieId: movie.movieId,
      title: movie.title,
      currentActor: movie.currentActor,
      isGhost: true,
      reattribution: {
        confidence: 0.40,
        suggestedActor: null,
        sources: [],
        action: 'manual_review',
        reason: 'No cast data found in any source - manual review required',
      },
    };
  }

  // Build consensus from sources
  const actorCounts: Record<string, number> = {};
  const actorSources: Record<string, ReAttributionResult['sources']> = {};

  for (const source of sources) {
    const actor = source.actor;
    actorCounts[actor] = (actorCounts[actor] || 0) + 1;
    
    if (!actorSources[actor]) {
      actorSources[actor] = [];
    }
    actorSources[actor].push(source);
  }

  // Find most suggested actor
  const sortedActors = Object.entries(actorCounts).sort((a, b) => b[1] - a[1]);
  const [suggestedActor, count] = sortedActors[0];

  // Determine confidence and action
  let confidence: number;
  let action: 'reattribute' | 'manual_review';
  let reason: string;

  if (count >= 3) {
    // 3+ sources agree: High confidence re-attribution
    confidence = 0.95;
    action = 'reattribute';
    reason = `${count} sources agree on ${suggestedActor}`;
  } else if (count === 2) {
    // 2 sources agree: Medium confidence re-attribution
    confidence = 0.80;
    action = 'reattribute';
    reason = `2 sources agree on ${suggestedActor}`;
  } else {
    // Only 1 source: Flag for manual review
    confidence = 0.60;
    action = 'manual_review';
    reason = `Only 1 source suggests ${suggestedActor} - manual review recommended`;
  }

  return {
    movieId: movie.movieId,
    title: movie.title,
    currentActor: movie.currentActor,
    isGhost: true,
    reattribution: {
      confidence,
      suggestedActor,
      sources: actorSources[suggestedActor],
      action,
      reason,
    },
  };
}

/**
 * Batch analyze multiple potential ghost entries
 */
export async function batchAnalyzeGhostEntries(
  movies: GhostEntry[]
): Promise<GhostAnalysis[]> {
  const results: GhostAnalysis[] = [];

  for (const movie of movies) {
    console.log(`Analyzing: ${movie.title} (${movie.releaseYear})...`);
    
    const analysis = await analyzeGhostEntry(movie);
    results.push(analysis);

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Generate report for ghost entries
 */
export function generateGhostEntriesReport(analyses: GhostAnalysis[]): string {
  const lines: string[] = [];

  const ghostEntries = analyses.filter(a => a.isGhost);
  const validEntries = analyses.filter(a => !a.isGhost);

  lines.push(`# Ghost Entries Analysis`);
  lines.push('');
  lines.push(`Total Analyzed: ${analyses.length}`);
  lines.push(`Valid Entries: ${validEntries.length}`);
  lines.push(`Ghost Entries: ${ghostEntries.length}`);
  lines.push('');

  if (ghostEntries.length > 0) {
    // Auto-reattribute candidates
    const autoReattribute = ghostEntries.filter(g => 
      g.reattribution?.action === 'reattribute' && 
      g.reattribution.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.reattribute
    );

    if (autoReattribute.length > 0) {
      lines.push(`## Auto-Reattribute (${autoReattribute.length})`);
      lines.push('');
      lines.push('| Title | Current Actor | Suggested Actor | Confidence | Reason |');
      lines.push('|-------|---------------|-----------------|------------|--------|');

      for (const entry of autoReattribute) {
        const r = entry.reattribution!;
        lines.push(`| ${entry.title} | ${entry.currentActor} | ${r.suggestedActor} | ${(r.confidence * 100).toFixed(0)}% | ${r.reason} |`);
      }

      lines.push('');
    }

    // Manual review candidates
    const manualReview = ghostEntries.filter(g => 
      !autoReattribute.includes(g)
    );

    if (manualReview.length > 0) {
      lines.push(`## Manual Review Required (${manualReview.length})`);
      lines.push('');
      lines.push('| Title | Current Actor | Suggested Actor | Confidence | Reason |');
      lines.push('|-------|---------------|-----------------|------------|--------|');

      for (const entry of manualReview) {
        const r = entry.reattribution;
        const suggested = r?.suggestedActor || 'Unknown';
        const confidence = r ? (r.confidence * 100).toFixed(0) : '0';
        const reason = r?.reason || 'No data found';
        
        lines.push(`| ${entry.title} | ${entry.currentActor} | ${suggested} | ${confidence}% | ${reason} |`);
      }

      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Check if confidence meets threshold for auto-reattribution
 */
export function shouldAutoReattribute(analysis: GhostAnalysis): boolean {
  if (!analysis.isGhost || !analysis.reattribution) {
    return false;
  }

  return (
    analysis.reattribution.action === 'reattribute' &&
    analysis.reattribution.confidence >= CONFIDENCE_THRESHOLDS.AUTO_FIX.reattribute
  );
}
