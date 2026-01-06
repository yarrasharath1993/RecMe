/**
 * MULTI-SOURCE VALIDATOR
 * 
 * Cross-validates movie data across multiple sources (TMDB, Wikipedia, Wikidata, OMDB).
 * Implements consensus-based auto-fix logic:
 * - Auto-fix if 3+ sources agree with 80%+ confidence
 * - Generate report for items needing manual review
 * 
 * Usage:
 *   import { validateMovie, validateBatch, generateValidationReport } from '@/lib/validation/multi-source-validator';
 */

import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

export type ValidatableField = 'hero' | 'heroine' | 'director' | 'music_director' | 'producer';

export interface SourceValue {
  value: string | null;
  confidence: number;
  raw_value?: string;
}

export interface SourceData {
  tmdb?: SourceValue;
  wikipedia?: SourceValue;
  wikidata?: SourceValue;
  omdb?: SourceValue;
}

export interface FieldConsensus {
  field: ValidatableField;
  current_value: string | null;
  sources: SourceData;
  consensus: {
    value: string | null;
    agreement_count: number;
    auto_fixable: boolean;
    confidence: number;
    agreeing_sources: string[];
  };
  action: 'auto_fix' | 'needs_review' | 'no_change' | 'no_data';
  recommendation?: string;
}

export interface MovieValidationResult {
  movie_id: string;
  movie_title: string;
  release_year?: number;
  fields: FieldConsensus[];
  auto_fixed_count: number;
  needs_review_count: number;
  validation_timestamp: string;
}

export interface ValidationReport {
  generated_at: string;
  total_movies: number;
  auto_fixed: {
    count: number;
    items: Array<{
      movie: string;
      field: string;
      old_value: string | null;
      new_value: string;
      sources: string[];
    }>;
  };
  needs_review: {
    count: number;
    items: Array<{
      movie: string;
      movie_id: string;
      field: string;
      current_value: string | null;
      sources: SourceData;
      recommendation: string;
    }>;
  };
}

// ============================================================
// CONSTANTS
// ============================================================

const MIN_CONSENSUS_SOURCES = 3;
const MIN_CONSENSUS_CONFIDENCE = 0.8;

const TMDB_API_KEY = process.env.TMDB_API_KEY;

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// ============================================================
// NAME NORMALIZATION
// ============================================================

function normalizeName(name: string | null | undefined): string | null {
  if (!name || typeof name !== 'string') return null;
  
  // Remove common suffixes and clean up
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\(.*\)$/, '')  // Remove parenthetical info
    .trim()
    .toLowerCase();
}

function namesMatch(name1: string | null, name2: string | null): boolean {
  if (!name1 || !name2) return false;
  
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (!n1 || !n2) return false;
  
  // Exact match
  if (n1 === n2) return true;
  
  // One contains the other (e.g., "S.S. Rajamouli" vs "Rajamouli")
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Check without initials
  const n1NoInit = n1.replace(/[a-z]\.\s*/g, '').trim();
  const n2NoInit = n2.replace(/[a-z]\.\s*/g, '').trim();
  
  if (n1NoInit === n2NoInit) return true;
  if (n1NoInit.includes(n2NoInit) || n2NoInit.includes(n1NoInit)) return true;
  
  return false;
}

// ============================================================
// SOURCE FETCHERS
// ============================================================

async function fetchTMDBCredits(
  tmdbId: number
): Promise<{ hero?: string; heroine?: string; director?: string; music_director?: string; producer?: string }> {
  if (!TMDB_API_KEY || !tmdbId) return {};
  
  try {
    const url = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) return {};
    
    const data = await response.json();
    const result: Record<string, string> = {};
    
    // Get cast (hero/heroine based on gender and order)
    if (data.cast && data.cast.length > 0) {
      const males = data.cast.filter((c: { gender: number }) => c.gender === 2);
      const females = data.cast.filter((c: { gender: number }) => c.gender === 1);
      
      if (males.length > 0) result.hero = males[0].name;
      if (females.length > 0) result.heroine = females[0].name;
    }
    
    // Get crew
    if (data.crew) {
      const director = data.crew.find((c: { job: string }) => c.job === 'Director');
      const composer = data.crew.find((c: { job: string }) => 
        c.job === 'Original Music Composer' || c.job === 'Music' || c.job === 'Music Director'
      );
      const producer = data.crew.find((c: { job: string }) => c.job === 'Producer');
      
      if (director) result.director = director.name;
      if (composer) result.music_director = composer.name;
      if (producer) result.producer = producer.name;
    }
    
    return result;
  } catch {
    return {};
  }
}

async function fetchWikipediaData(
  title: string,
  year: number
): Promise<{ hero?: string; heroine?: string; director?: string; music_director?: string; producer?: string }> {
  try {
    const wikiTitle = title.replace(/ /g, '_');
    const patterns = [
      `${wikiTitle}_(${year}_film)`,
      `${wikiTitle}_(Telugu_film)`,
      `${wikiTitle}_(film)`,
      wikiTitle,
    ];
    
    for (const pattern of patterns) {
      const url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pattern)}`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'TeluguPortal/1.0 (movie-validation)' }
      });
      
      if (!response.ok) continue;
      
      const html = await response.text();
      const result: Record<string, string> = {};
      
      // Parse infobox
      const directorMatch = html.match(/Directed[\s\S]*?by[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      if (directorMatch) result.director = directorMatch[1].trim();
      
      const starringMatch = html.match(/Starring[\s\S]*?<td[^>]*>([\s\S]*?)<\/td>/i);
      if (starringMatch) {
        const names = [...starringMatch[1].matchAll(/<a[^>]*>([^<]+)<\/a>/g)]
          .map(m => m[1].trim());
        if (names[0]) result.hero = names[0];
        if (names[1]) result.heroine = names[1];
      }
      
      const musicMatch = html.match(/Music[\s\S]*?by[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      if (musicMatch) result.music_director = musicMatch[1].trim();
      
      const producerMatch = html.match(/Produced[\s\S]*?by[\s\S]*?<a[^>]*>([^<]+)<\/a>/i);
      if (producerMatch) result.producer = producerMatch[1].trim();
      
      if (Object.keys(result).length > 0) {
        return result;
      }
    }
    
    return {};
  } catch {
    return {};
  }
}

async function fetchWikidataCredits(
  title: string,
  year: number
): Promise<{ director?: string; music_director?: string; producer?: string }> {
  try {
    // Search for the film on Wikidata
    const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
      title + ' ' + year + ' Telugu film'
    )}&language=en&format=json`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!searchResponse.ok) return {};
    
    const searchData = await searchResponse.json();
    if (!searchData.search || searchData.search.length === 0) return {};
    
    const entityId = searchData.search[0].id;
    
    // Get entity data
    const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    const entityResponse = await fetch(entityUrl, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!entityResponse.ok) return {};
    
    const entityData = await entityResponse.json();
    const entity = entityData.entities[entityId];
    
    const result: Record<string, string> = {};
    
    // P57 = director
    if (entity.claims?.P57?.[0]?.mainsnak?.datavalue?.value?.id) {
      const directorId = entity.claims.P57[0].mainsnak.datavalue.value.id;
      const label = await getWikidataLabel(directorId);
      if (label) result.director = label;
    }
    
    // P86 = composer
    if (entity.claims?.P86?.[0]?.mainsnak?.datavalue?.value?.id) {
      const composerId = entity.claims.P86[0].mainsnak.datavalue.value.id;
      const label = await getWikidataLabel(composerId);
      if (label) result.music_director = label;
    }
    
    // P162 = producer
    if (entity.claims?.P162?.[0]?.mainsnak?.datavalue?.value?.id) {
      const producerId = entity.claims.P162[0].mainsnak.datavalue.value.id;
      const label = await getWikidataLabel(producerId);
      if (label) result.producer = label;
    }
    
    return result;
  } catch {
    return {};
  }
}

async function getWikidataLabel(entityId: string): Promise<string | null> {
  try {
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TeluguPortal/1.0' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.entities?.[entityId]?.labels?.en?.value || null;
  } catch {
    return null;
  }
}

// ============================================================
// CONSENSUS CALCULATION
// ============================================================

function calculateConsensus(
  field: ValidatableField,
  currentValue: string | null,
  sources: SourceData
): FieldConsensus {
  const sourceValues: { source: string; value: string; confidence: number }[] = [];
  
  // Collect all non-null values
  for (const [sourceName, sourceData] of Object.entries(sources)) {
    if (sourceData?.value) {
      sourceValues.push({
        source: sourceName,
        value: sourceData.value,
        confidence: sourceData.confidence,
      });
    }
  }
  
  if (sourceValues.length === 0) {
    return {
      field,
      current_value: currentValue,
      sources,
      consensus: {
        value: null,
        agreement_count: 0,
        auto_fixable: false,
        confidence: 0,
        agreeing_sources: [],
      },
      action: 'no_data',
    };
  }
  
  // Group by normalized value
  const groups: Map<string, { value: string; sources: string[]; totalConfidence: number }> = new Map();
  
  for (const sv of sourceValues) {
    const normalized = normalizeName(sv.value);
    if (!normalized) continue;
    
    let found = false;
    for (const [key, group] of groups.entries()) {
      if (namesMatch(key, normalized)) {
        group.sources.push(sv.source);
        group.totalConfidence += sv.confidence;
        found = true;
        break;
      }
    }
    
    if (!found) {
      groups.set(normalized, {
        value: sv.value,
        sources: [sv.source],
        totalConfidence: sv.confidence,
      });
    }
  }
  
  // Find largest group
  let bestGroup: { value: string; sources: string[]; totalConfidence: number } | null = null;
  
  for (const group of groups.values()) {
    if (!bestGroup || group.sources.length > bestGroup.sources.length) {
      bestGroup = group;
    }
  }
  
  if (!bestGroup) {
    return {
      field,
      current_value: currentValue,
      sources,
      consensus: {
        value: null,
        agreement_count: 0,
        auto_fixable: false,
        confidence: 0,
        agreeing_sources: [],
      },
      action: 'no_data',
    };
  }
  
  const avgConfidence = bestGroup.totalConfidence / bestGroup.sources.length;
  const autoFixable = bestGroup.sources.length >= MIN_CONSENSUS_SOURCES && 
                      avgConfidence >= MIN_CONSENSUS_CONFIDENCE;
  
  // Determine action
  let action: FieldConsensus['action'];
  let recommendation: string | undefined;
  
  if (namesMatch(currentValue, bestGroup.value)) {
    action = 'no_change';
  } else if (autoFixable) {
    action = 'auto_fix';
    recommendation = `Auto-fix: ${bestGroup.sources.length} sources agree (${bestGroup.sources.join(', ')})`;
  } else if (bestGroup.sources.length >= 2) {
    action = 'needs_review';
    recommendation = `${bestGroup.sources.length} sources suggest "${bestGroup.value}" (${bestGroup.sources.join(', ')})`;
  } else {
    action = 'needs_review';
    recommendation = `Only 1 source (${bestGroup.sources[0]}) suggests "${bestGroup.value}"`;
  }
  
  return {
    field,
    current_value: currentValue,
    sources,
    consensus: {
      value: bestGroup.value,
      agreement_count: bestGroup.sources.length,
      auto_fixable: autoFixable,
      confidence: avgConfidence,
      agreeing_sources: bestGroup.sources,
    },
    action,
    recommendation,
  };
}

// ============================================================
// MAIN VALIDATION FUNCTIONS
// ============================================================

export async function validateMovie(movie: {
  id: string;
  title_en: string;
  release_year?: number;
  tmdb_id?: number;
  hero?: string;
  heroine?: string;
  director?: string;
  music_director?: string;
  producer?: string;
}): Promise<MovieValidationResult> {
  // Fetch data from all sources
  const [tmdbData, wikiData, wikidataData] = await Promise.all([
    movie.tmdb_id ? fetchTMDBCredits(movie.tmdb_id) : Promise.resolve({}),
    fetchWikipediaData(movie.title_en, movie.release_year || 0),
    fetchWikidataCredits(movie.title_en, movie.release_year || 0),
  ]);
  
  // Build source data for each field
  const fieldsToValidate: ValidatableField[] = ['hero', 'heroine', 'director', 'music_director', 'producer'];
  const fieldResults: FieldConsensus[] = [];
  
  for (const field of fieldsToValidate) {
    const sources: SourceData = {};
    
    if (tmdbData[field]) {
      sources.tmdb = { value: tmdbData[field], confidence: 0.95 };
    }
    if (wikiData[field]) {
      sources.wikipedia = { value: wikiData[field], confidence: 0.85 };
    }
    if (wikidataData[field as keyof typeof wikidataData]) {
      sources.wikidata = { 
        value: wikidataData[field as keyof typeof wikidataData] as string, 
        confidence: 0.80 
      };
    }
    
    const currentValue = movie[field as keyof typeof movie] as string | undefined;
    const consensus = calculateConsensus(field, currentValue || null, sources);
    fieldResults.push(consensus);
  }
  
  return {
    movie_id: movie.id,
    movie_title: movie.title_en,
    release_year: movie.release_year,
    fields: fieldResults,
    auto_fixed_count: fieldResults.filter(f => f.action === 'auto_fix').length,
    needs_review_count: fieldResults.filter(f => f.action === 'needs_review').length,
    validation_timestamp: new Date().toISOString(),
  };
}

export async function validateBatch(
  movieIds: string[],
  options: {
    applyAutoFix?: boolean;
    onProgress?: (completed: number, total: number) => void;
  } = {}
): Promise<ValidationReport> {
  const supabase = getSupabaseClient();
  
  // Fetch all movies
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, tmdb_id, hero, heroine, director, music_director, producer')
    .in('id', movieIds);
  
  if (error || !movies) {
    throw new Error(`Failed to fetch movies: ${error?.message}`);
  }
  
  const report: ValidationReport = {
    generated_at: new Date().toISOString(),
    total_movies: movies.length,
    auto_fixed: { count: 0, items: [] },
    needs_review: { count: 0, items: [] },
  };
  
  let completed = 0;
  
  for (const movie of movies) {
    const result = await validateMovie(movie);
    
    for (const field of result.fields) {
      if (field.action === 'auto_fix') {
        report.auto_fixed.count++;
        report.auto_fixed.items.push({
          movie: `${movie.title_en} (${movie.release_year})`,
          field: field.field,
          old_value: field.current_value,
          new_value: field.consensus.value!,
          sources: field.consensus.agreeing_sources,
        });
        
        // Apply auto-fix if enabled
        if (options.applyAutoFix && field.consensus.value) {
          await supabase
            .from('movies')
            .update({ [field.field]: field.consensus.value })
            .eq('id', movie.id);
        }
      } else if (field.action === 'needs_review') {
        report.needs_review.count++;
        report.needs_review.items.push({
          movie: `${movie.title_en} (${movie.release_year})`,
          movie_id: movie.id,
          field: field.field,
          current_value: field.current_value,
          sources: field.sources,
          recommendation: field.recommendation || 'Review required',
        });
      }
    }
    
    completed++;
    options.onProgress?.(completed, movies.length);
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  return report;
}

export function generateMarkdownReport(report: ValidationReport): string {
  let md = `# Validation Report - ${report.generated_at.split('T')[0]}\n\n`;
  md += `**Total Movies Validated:** ${report.total_movies}\n\n`;
  md += `---\n\n`;
  
  // Auto-fixed section
  md += `## Auto-Fixed (${report.auto_fixed.count} items)\n\n`;
  
  if (report.auto_fixed.items.length > 0) {
    for (const item of report.auto_fixed.items) {
      md += `- **[${item.movie}]** ${item.field}: "${item.old_value || 'null'}" → "${item.new_value}" `;
      md += `(${item.sources.join(', ')} agree)\n`;
    }
  } else {
    md += `_No items were auto-fixed._\n`;
  }
  
  md += `\n---\n\n`;
  
  // Needs review section
  md += `## Needs Review (${report.needs_review.count} items)\n\n`;
  
  if (report.needs_review.items.length > 0) {
    for (const item of report.needs_review.items) {
      md += `### ${item.movie}\n\n`;
      md += `| Field | Current | TMDB | Wikipedia | Wikidata | OMDB |\n`;
      md += `|-------|---------|------|-----------|----------|------|\n`;
      md += `| ${item.field} | ${item.current_value || '-'} | `;
      md += `${item.sources.tmdb?.value || '-'} | `;
      md += `${item.sources.wikipedia?.value || '-'} | `;
      md += `${item.sources.wikidata?.value || '-'} | `;
      md += `${item.sources.omdb?.value || '-'} |\n\n`;
      md += `**Recommendation:** ${item.recommendation}\n\n`;
    }
  } else {
    md += `_No items need review._\n`;
  }
  
  return md;
}

