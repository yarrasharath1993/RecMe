/**
 * Shared filtering utilities for enrichment scripts
 * 
 * Usage:
 *   import { parseFilters, applyFilters } from './lib/filter-utils';
 *   
 *   const filters = parseFilters();
 *   let query = supabase.from('movies').select('*').eq('language', 'Telugu');
 *   query = applyFilters(query, filters);
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface EnrichmentFilters {
  actor?: string;
  director?: string;
  slug?: string;
  decade?: string;
  limit: number;
  concurrency: number;
  execute: boolean;
}

/**
 * Parse common CLI arguments for enrichment scripts
 */
export function parseFilters(args: string[] = process.argv.slice(2)): EnrichmentFilters {
  const getArg = (name: string, defaultValue: string = ''): string => {
    const arg = args.find((a) => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
  };
  
  const hasFlag = (name: string): boolean => 
    args.includes(`--${name}`) || args.some(a => a.startsWith(`--${name}=`));

  const isDry = hasFlag('dry') || !hasFlag('execute');

  return {
    actor: getArg('actor', ''),
    director: getArg('director', ''),
    slug: getArg('slug', ''),
    decade: getArg('decade', ''),
    limit: parseInt(getArg('limit', '100')),
    concurrency: parseInt(getArg('concurrency', '20')),
    execute: hasFlag('execute') && !hasFlag('dry'),
  };
}

/**
 * Apply filters to a Supabase query
 * Returns a new query with filters applied
 */
export function applyFilters<T>(
  query: any, // PostgrestFilterBuilder
  filters: EnrichmentFilters
): any {
  let filteredQuery = query;

  // Filter by actor (hero field)
  if (filters.actor) {
    filteredQuery = filteredQuery.ilike('hero', `%${filters.actor}%`);
  }

  // Filter by director
  if (filters.director) {
    filteredQuery = filteredQuery.ilike('director', `%${filters.director}%`);
  }

  // Filter by specific slug
  if (filters.slug) {
    filteredQuery = filteredQuery.eq('slug', filters.slug);
  }

  // Filter by decade
  if (filters.decade) {
    const startYear = parseInt(filters.decade);
    filteredQuery = filteredQuery
      .gte('release_year', startYear)
      .lt('release_year', startYear + 10);
  }

  // Apply limit
  filteredQuery = filteredQuery.limit(filters.limit);

  return filteredQuery;
}

/**
 * Print active filters to console
 */
export function printFilters(filters: EnrichmentFilters): void {
  console.log(`  Mode: ${filters.execute ? '✅ EXECUTE' : '🔍 DRY RUN'}`);
  console.log(`  Limit: ${filters.limit}`);
  console.log(`  Concurrency: ${filters.concurrency}`);
  
  if (filters.actor) console.log(`  Actor filter: "${filters.actor}"`);
  if (filters.director) console.log(`  Director filter: "${filters.director}"`);
  if (filters.slug) console.log(`  Slug filter: "${filters.slug}"`);
  if (filters.decade) console.log(`  Decade filter: ${filters.decade}s`);
}
