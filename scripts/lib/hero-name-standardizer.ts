/**
 * HERO NAME STANDARDIZER
 * 
 * Standardizes hero name spellings in the database to ensure consistent
 * filmography counts and validation. Based on learnings from Balakrishna
 * filmography fix session where variations like "N. Balakrishna", 
 * "Bala Krishna" caused incorrect counts.
 * 
 * Usage:
 *   import { standardizeHeroNames, getStandardHeroName } from './lib/hero-name-standardizer';
 *   
 *   // Get standard name for a variation
 *   const standard = getStandardHeroName('N. Balakrishna'); // 'Nandamuri Balakrishna'
 *   
 *   // Standardize all hero names in database
 *   const result = await standardizeHeroNames(supabase);
 */

import { SupabaseClient } from '@supabase/supabase-js';

// ============================================================
// HERO NAME MAPPINGS
// ============================================================

/**
 * Maps known name variations to their standard form.
 * Key: lowercase normalized variation
 * Value: Standard name to use in database
 */
export const HERO_NAME_MAPPINGS: Record<string, string> = {
  // Nandamuri Balakrishna variations
  'n. balakrishna': 'Nandamuri Balakrishna',
  'n balakrishna': 'Nandamuri Balakrishna',
  'bala krishna': 'Nandamuri Balakrishna',
  'balakrishna': 'Nandamuri Balakrishna',
  'n.balakrishna': 'Nandamuri Balakrishna',
  'nbk': 'Nandamuri Balakrishna',
  
  // N.T. Rama Rao variations
  'n.t. rama rao': 'N.T. Rama Rao',
  'ntr': 'N.T. Rama Rao',
  'n t rama rao': 'N.T. Rama Rao',
  'nt rama rao': 'N.T. Rama Rao',
  'sr. ntr': 'N.T. Rama Rao',
  
  // Jr. NTR variations
  'jr. ntr': 'N.T. Rama Rao Jr.',
  'jr ntr': 'N.T. Rama Rao Jr.',
  'ntr jr': 'N.T. Rama Rao Jr.',
  'ntr junior': 'N.T. Rama Rao Jr.',
  'young tiger ntr': 'N.T. Rama Rao Jr.',
  'tarak': 'N.T. Rama Rao Jr.',
  
  // Chiranjeevi variations
  'mega star chiranjeevi': 'Chiranjeevi',
  'megastar chiranjeevi': 'Chiranjeevi',
  'chiru': 'Chiranjeevi',
  'k. chiranjeevi': 'Chiranjeevi',
  'konidela chiranjeevi': 'Chiranjeevi',
  'boss chiranjeevi': 'Chiranjeevi',
  
  // Ram Charan variations
  'ram charan teja': 'Ram Charan',
  'mega power star ram charan': 'Ram Charan',
  
  // Mahesh Babu variations
  'prince mahesh babu': 'Mahesh Babu',
  'super star mahesh babu': 'Mahesh Babu',
  'mahesh': 'Mahesh Babu',
  
  // Pawan Kalyan variations
  'power star pawan kalyan': 'Pawan Kalyan',
  'powerstar pawan kalyan': 'Pawan Kalyan',
  
  // Allu Arjun variations
  'stylish star allu arjun': 'Allu Arjun',
  'bunny': 'Allu Arjun',
  'icon star allu arjun': 'Allu Arjun',
  
  // Prabhas variations
  'darling prabhas': 'Prabhas',
  'rebel star prabhas': 'Prabhas',
  
  // Venkatesh variations
  'daggubati venkatesh': 'Venkatesh',
  'victory venkatesh': 'Venkatesh',
  'd. venkatesh': 'Venkatesh',
  
  // Nagarjuna variations
  'akkineni nagarjuna': 'Nagarjuna',
  'king nagarjuna': 'Nagarjuna',
  'nag': 'Nagarjuna',
  
  // Nani variations
  'natural star nani': 'Nani',
  
  // Ravi Teja variations
  'mass maharaja ravi teja': 'Ravi Teja',
  'mass maharaj ravi teja': 'Ravi Teja',
  
  // Classic heroes
  'superstar krishna': 'Krishna',
  'ghattamaneni krishna': 'Krishna',
  
  'rebel star krishnam raju': 'Krishnam Raju',
  'u. krishnam raju': 'Krishnam Raju',
  
  'akkineni nageswara rao': 'Akkineni Nageswara Rao',
  'anr': 'Akkineni Nageswara Rao',
  'a.n.r.': 'Akkineni Nageswara Rao',
  'a.n.r': 'Akkineni Nageswara Rao',
  
  // Modern heroes
  'vijay deverakonda': 'Vijay Deverakonda',
  'rowdy vijay deverakonda': 'Vijay Deverakonda',
  'arjun reddy vijay': 'Vijay Deverakonda',
  
  'ram pothineni': 'Ram Pothineni',
  'energetic star ram': 'Ram Pothineni',
  'rapo': 'Ram Pothineni',
  
  'nithiin': 'Nithiin',
  'nithin': 'Nithiin',
  
  'sharwanand': 'Sharwanand',
  'sharwa': 'Sharwanand',
};

/**
 * Standard hero names - the canonical form we want in the database.
 * Used for validation and lookup.
 */
export const STANDARD_HERO_NAMES = new Set([
  'Nandamuri Balakrishna',
  'N.T. Rama Rao',
  'N.T. Rama Rao Jr.',
  'Chiranjeevi',
  'Ram Charan',
  'Mahesh Babu',
  'Pawan Kalyan',
  'Allu Arjun',
  'Prabhas',
  'Venkatesh',
  'Nagarjuna',
  'Nani',
  'Ravi Teja',
  'Krishna',
  'Krishnam Raju',
  'Akkineni Nageswara Rao',
  'Vijay Deverakonda',
  'Ram Pothineni',
  'Nithiin',
  'Sharwanand',
  'Mohan Babu',
  'Sobhan Babu',
  'Jagapathi Babu',
  'Rajendra Prasad',
  'Siddharth',
  'Sudheer Babu',
  'Naga Chaitanya',
  'Akhil Akkineni',
  'Varun Tej',
  'Sai Dharam Tej',
  'Kalyan Ram',
  'Rana Daggubati',
]);

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Normalize a name for lookup in mappings
 */
function normalizeForLookup(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, '')  // Keep letters, numbers, spaces, dots
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get the standard hero name for a given variation.
 * Returns the input if no mapping exists.
 */
export function getStandardHeroName(name: string): string {
  if (!name) return name;
  
  const normalized = normalizeForLookup(name);
  
  // Direct mapping lookup
  if (HERO_NAME_MAPPINGS[normalized]) {
    return HERO_NAME_MAPPINGS[normalized];
  }
  
  // Check if already standard
  if (STANDARD_HERO_NAMES.has(name)) {
    return name;
  }
  
  // Try partial matches for compound names
  for (const [variation, standard] of Object.entries(HERO_NAME_MAPPINGS)) {
    if (normalized.includes(variation) || variation.includes(normalized)) {
      return standard;
    }
  }
  
  return name;
}

/**
 * Check if a name is a known variation that needs standardization
 */
export function isNameVariation(name: string): boolean {
  if (!name) return false;
  const normalized = normalizeForLookup(name);
  return !!HERO_NAME_MAPPINGS[normalized];
}

/**
 * Get all known variations for a standard name
 */
export function getNameVariations(standardName: string): string[] {
  const variations: string[] = [];
  
  for (const [variation, standard] of Object.entries(HERO_NAME_MAPPINGS)) {
    if (standard === standardName) {
      variations.push(variation);
    }
  }
  
  return variations;
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

export interface StandardizationResult {
  standardized: number;
  skipped: number;
  errors: string[];
  variations: Array<{
    original: string;
    standardized: string;
    count: number;
  }>;
}

/**
 * Find all hero name variations in the database
 */
export async function findHeroNameVariations(
  supabase: SupabaseClient
): Promise<Array<{ hero: string; count: number; standardName: string }>> {
  const variations: Array<{ hero: string; count: number; standardName: string }> = [];
  
  // Get all unique hero values
  const { data: heroes, error } = await supabase
    .from('movies')
    .select('hero')
    .not('hero', 'is', null);
  
  if (error || !heroes) {
    console.error('Error fetching heroes:', error);
    return variations;
  }
  
  // Count occurrences
  const heroCounts = new Map<string, number>();
  for (const row of heroes) {
    if (row.hero) {
      heroCounts.set(row.hero, (heroCounts.get(row.hero) || 0) + 1);
    }
  }
  
  // Find variations
  for (const [hero, count] of heroCounts) {
    const standardName = getStandardHeroName(hero);
    if (standardName !== hero) {
      variations.push({ hero, count, standardName });
    }
  }
  
  return variations.sort((a, b) => b.count - a.count);
}

/**
 * Standardize all hero names in the database
 */
export async function standardizeHeroNames(
  supabase: SupabaseClient,
  options: {
    dryRun?: boolean;
    verbose?: boolean;
    actorFilter?: string;  // Only standardize for specific actor
  } = {}
): Promise<StandardizationResult> {
  const { dryRun = false, verbose = false, actorFilter } = options;
  
  const result: StandardizationResult = {
    standardized: 0,
    skipped: 0,
    errors: [],
    variations: [],
  };
  
  // Find all variations
  const variations = await findHeroNameVariations(supabase);
  
  // Filter if actor specified
  const filteredVariations = actorFilter
    ? variations.filter(v => 
        v.standardName.toLowerCase().includes(actorFilter.toLowerCase()) ||
        v.hero.toLowerCase().includes(actorFilter.toLowerCase())
      )
    : variations;
  
  if (verbose) {
    console.log(`Found ${filteredVariations.length} name variations to standardize`);
  }
  
  // Process each variation
  for (const variation of filteredVariations) {
    if (verbose) {
      console.log(`  "${variation.hero}" (${variation.count} films) → "${variation.standardName}"`);
    }
    
    result.variations.push({
      original: variation.hero,
      standardized: variation.standardName,
      count: variation.count,
    });
    
    if (!dryRun) {
      const { error } = await supabase
        .from('movies')
        .update({ hero: variation.standardName })
        .eq('hero', variation.hero);
      
      if (error) {
        result.errors.push(`Failed to update "${variation.hero}": ${error.message}`);
      } else {
        result.standardized += variation.count;
      }
    } else {
      result.standardized += variation.count;
    }
  }
  
  return result;
}

/**
 * Get count of movies for an actor, including all name variations
 */
export async function getActorMovieCount(
  supabase: SupabaseClient,
  actorName: string
): Promise<{
  total: number;
  byVariation: Array<{ name: string; count: number }>;
}> {
  const standardName = getStandardHeroName(actorName);
  const variations = getNameVariations(standardName);
  
  // Include standard name and all variations
  const allNames = [standardName, ...variations, actorName];
  const uniqueNames = [...new Set(allNames)];
  
  const byVariation: Array<{ name: string; count: number }> = [];
  let total = 0;
  
  for (const name of uniqueNames) {
    const { count, error } = await supabase
      .from('movies')
      .select('*', { count: 'exact', head: true })
      .ilike('hero', `%${name}%`);
    
    if (!error && count && count > 0) {
      byVariation.push({ name, count });
      // Only count once per unique movie (avoid double counting)
      if (name === standardName || byVariation.length === 1) {
        total = Math.max(total, count);
      }
    }
  }
  
  return { total, byVariation };
}

// ============================================================
// CLI SUPPORT
// ============================================================

/**
 * Run as CLI script
 */
export async function runCLI(supabase: SupabaseClient): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const actorArg = args.find(a => a.startsWith('--actor='));
  const actorFilter = actorArg ? actorArg.split('=')[1] : undefined;
  
  console.log('═'.repeat(60));
  console.log('HERO NAME STANDARDIZER');
  console.log('═'.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  if (actorFilter) {
    console.log(`Actor filter: ${actorFilter}`);
  }
  console.log('');
  
  // Find variations first
  console.log('Finding name variations...');
  const variations = await findHeroNameVariations(supabase);
  
  if (variations.length === 0) {
    console.log('No name variations found. Database is already standardized.');
    return;
  }
  
  console.log(`\nFound ${variations.length} variations:\n`);
  for (const v of variations) {
    console.log(`  "${v.hero}" (${v.count} films) → "${v.standardName}"`);
  }
  
  // Apply standardization
  console.log('\n' + '─'.repeat(60));
  console.log(dryRun ? 'DRY RUN - No changes will be made' : 'Applying standardization...');
  
  const result = await standardizeHeroNames(supabase, { dryRun, verbose, actorFilter });
  
  console.log('\n' + '═'.repeat(60));
  console.log('SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Standardized: ${result.standardized} films`);
  console.log(`Skipped: ${result.skipped} films`);
  console.log(`Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\nErrors:');
    result.errors.forEach(e => console.log(`  - ${e}`));
  }
  
  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}
