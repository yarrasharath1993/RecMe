#!/usr/bin/env npx tsx
/**
 * Fix Minimal Celebrity Profiles
 * 
 * Fixes profiles with missing slugs and biographies:
 * - Generates slugs from names
 * - Fetches biographies from TMDB
 * - Updates entity confidence scores
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import slugify from 'slugify';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function red(text: string) { return `${colors.red}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

interface Celebrity {
  id: string;
  name_en: string;
  slug: string | null;
  short_bio: string | null;
  tmdb_id: number | null;
  entity_confidence_score: number | null;
}

function generateSlug(name: string): string {
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
}

async function fetchTMDBBio(tmdbId: number): Promise<string | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/person/${tmdbId}?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.biography || null;
  } catch (error) {
    console.error(`Error fetching TMDB bio for ${tmdbId}:`, error);
    return null;
  }
}

async function fixMinimalProfiles() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║           FIX MINIMAL CELEBRITY PROFILES                              ║
║           Adding Missing Slugs & Biographies                          ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  // Fetch profiles with missing slugs or bios
  const { data: profiles, error } = await supabase
    .from('celebrities')
    .select('id, name_en, slug, short_bio, tmdb_id, entity_confidence_score')
    .or('slug.is.null,short_bio.is.null')
    .order('entity_confidence_score', { ascending: true });

  if (error || !profiles) {
    console.error(red('❌ Error fetching profiles:'), error);
    return;
  }

  console.log(white(`  Found ${profiles.length} profiles needing fixes\n`));

  let slugsFixed = 0;
  let biosAdded = 0;
  let errors = 0;

  for (const profile of profiles) {
    const updates: any = {};
    const changes: string[] = [];

    // Fix missing slug
    if (!profile.slug && profile.name_en) {
      const newSlug = generateSlug(profile.name_en);
      
      // Check if slug already exists
      const { data: existing } = await supabase
        .from('celebrities')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', profile.id)
        .single();

      if (existing) {
        // Slug collision, add a suffix
        updates.slug = `${newSlug}-${profile.id.slice(0, 8)}`;
        console.log(yellow(`  ⚠️  Slug collision for ${profile.name_en}, using: ${updates.slug}`));
      } else {
        updates.slug = newSlug;
      }
      
      changes.push('slug');
      slugsFixed++;
    }

    // Fetch biography from TMDB if missing
    if (!profile.short_bio && profile.tmdb_id) {
      const bio = await fetchTMDBBio(profile.tmdb_id);
      if (bio) {
        // Take first 500 chars as short bio
        updates.short_bio = bio.slice(0, 500).trim();
        if (bio.length > 500) {
          updates.short_bio += '...';
        }
        changes.push('bio');
        biosAdded++;
      }
    }

    // Update confidence score if we made changes
    if (changes.length > 0) {
      if ((profile.entity_confidence_score || 0) < 50) {
        updates.entity_confidence_score = 50; // Bump to 50 if we added data
        changes.push('confidence');
      }

      // Execute update
      const { error: updateError } = await supabase
        .from('celebrities')
        .update(updates)
        .eq('id', profile.id);

      if (updateError) {
        console.log(red(`  ❌ Error updating ${profile.name_en}: ${updateError.message}`));
        errors++;
      } else {
        console.log(green(`  ✓ ${profile.name_en}`));
        console.log(white(`    Fixed: ${changes.join(', ')}`));
        if (updates.slug) {
          console.log(white(`    New slug: ${updates.slug}`));
        }
      }
    } else {
      console.log(yellow(`  ⚠️  ${profile.name_en} - No fixes available (needs manual attention)`));
    }
  }

  console.log(cyan(bold('\n╔═══════════════════════════════════════════════════════════════════════╗')));
  console.log(cyan(bold('║                        SUMMARY                                         ║')));
  console.log(cyan(bold('╚═══════════════════════════════════════════════════════════════════════╝\n')));

  console.log(green(`  ✅ Slugs fixed: ${slugsFixed}`));
  console.log(green(`  ✅ Biographies added: ${biosAdded}`));
  if (errors > 0) {
    console.log(red(`  ❌ Errors: ${errors}`));
  }
  console.log('');

  console.log(cyan(bold('  🚀 NEXT STEPS:\n')));
  console.log(white('  1. Re-run completeness audit'));
  console.log(white('  2. Manually add bios for profiles without TMDB ID'));
  console.log(white('  3. Proceed with awards enrichment\n'));
}

fixMinimalProfiles().catch(console.error);
