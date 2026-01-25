#!/usr/bin/env npx tsx
/**
 * Apply Specific Fixes for 2026 Data Issues
 * 
 * 1. Fix missing directors (3 movies)
 * 2. Fix missing heroes (3 movies)
 * 3. Remove duplicate: Akasha Ramanna → Aakasa Ramanna
 * 4. Reattribute wrong hero gender issues with correct male heroes
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface Fix {
  type: string;
  slug?: string;
  title?: string;
  field: string;
  currentValue: any;
  suggestedValue: any;
  confidence: number;
  details: string;
}

// Specific fixes from user data
const FIXES: Fix[] = [
  {
    type: 'missing_director',
    title: "Creating The Queen's Gambit",
    field: 'director',
    currentValue: null,
    suggestedValue: 'Scott Frank',
    confidence: 0.95,
    details: 'Scott Frank is credited as the director of this behind-the-scenes documentary.',
  },
  {
    type: 'missing_director',
    title: 'Making Squid Game: The Challenge',
    field: 'director',
    currentValue: null,
    suggestedValue: 'Diccon Ramsay',
    confidence: 0.85,
    details: 'Diccon Ramsay is the series director for this "making-of" special.',
  },
  {
    type: 'missing_director',
    title: 'RBD: Ser o Parecer (En Vivo)',
    field: 'director',
    currentValue: null,
    suggestedValue: 'Esteban Madrazo',
    confidence: 0.80,
    details: 'Esteban Madrazo directed the "Ser o Parecer" music video and associated live visual content for RBD.',
  },
  {
    type: 'missing_hero',
    title: 'Piper',
    field: 'hero',
    currentValue: null,
    suggestedValue: 'Piper (Sandpiper Hatchling)',
    confidence: 0.99,
    details: 'Piper is the titular protagonist, a young sandpiper overcoming aquaphobia.',
  },
  {
    type: 'missing_hero',
    title: 'Koyaanisqatsi',
    field: 'hero',
    currentValue: null,
    suggestedValue: 'None (Nature/Humanity)',
    confidence: 0.95,
    details: 'This is a non-narrative film with no individual characters or "hero"; the focus is the relationship between nature and humanity.',
  },
  {
    type: 'missing_hero',
    title: 'Kitbull',
    field: 'hero',
    currentValue: null,
    suggestedValue: 'Kitten and Pit Bull',
    confidence: 0.99,
    details: 'The story centers on the unlikely bond between an independent stray kitten and a mistreated pit bull.',
  },
];

async function searchTMDB(title: string, year?: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    query: title,
  });
  
  if (year) {
    params.append('year', year.toString());
  }

  const response = await fetch(`${TMDB_BASE_URL}/search/movie?${params}`);
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.results?.[0] || null;
}

async function getTMDBDetails(tmdbId: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY!,
    append_to_response: 'credits',
  });

  const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?${params}`);
  if (!response.ok) return null;
  
  return response.json();
}

async function applySpecificFixes(execute: boolean) {
  console.log(chalk.blue.bold(`\n📝 Applying Specific Fixes (${FIXES.length} items)\n`));
  
  let fixed = 0;
  let failed = 0;
  
  for (const fix of FIXES) {
    // Find movie by title
    const { data: movies } = await supabase
      .from('movies')
      .select('*')
      .ilike('title_en', `%${fix.title}%`)
      .limit(5);
    
    if (!movies || movies.length === 0) {
      console.log(chalk.yellow(`  ⊘ ${fix.title}: Not found in database`));
      failed++;
      continue;
    }
    
    // If multiple matches, find best match
    const movie = movies.find(m => 
      m.title_en?.toLowerCase() === fix.title?.toLowerCase()
    ) || movies[0];
    
    const updates: any = {};
    updates[fix.field] = fix.suggestedValue;
    
    if (execute) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (error) {
        console.log(chalk.red(`  ❌ ${fix.title}: Update failed - ${error.message}`));
        failed++;
        continue;
      }
    }
    
    console.log(chalk.green(`  ✓ ${fix.title}: ${fix.field} = "${fix.suggestedValue}"`));
    fixed++;
  }
  
  return { fixed, failed };
}

async function removeDuplicate(execute: boolean) {
  console.log(chalk.blue.bold(`\n🔄 Removing Duplicate: Akasha Ramanna\n`));
  
  // Find both versions
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .or('title_en.ilike.%Akasha Ramanna%,title_en.ilike.%Aakasa Ramanna%')
    .eq('release_year', 2010);
  
  if (!movies || movies.length === 0) {
    console.log(chalk.yellow('  ⊘ No duplicate found'));
    return { fixed: 0, failed: 0 };
  }
  
  console.log(chalk.cyan(`  Found ${movies.length} entries:`));
  movies.forEach(m => {
    console.log(chalk.gray(`    - ${m.title_en} (${m.slug})`));
  });
  
  // Find the correct one (Aakasa Ramanna) and the duplicate (Akasha Ramanna)
  const correctMovie = movies.find(m => m.title_en?.includes('Aakasa'));
  const duplicateMovie = movies.find(m => m.title_en?.includes('Akasha') && m.id !== correctMovie?.id);
  
  if (!correctMovie) {
    console.log(chalk.yellow('  ⊘ Correct version (Aakasa Ramanna) not found'));
    return { fixed: 0, failed: 1 };
  }
  
  if (!duplicateMovie) {
    console.log(chalk.green('  ✓ No duplicate to remove (only correct version exists)'));
    return { fixed: 0, failed: 0 };
  }
  
  if (execute) {
    // Delete the duplicate
    const { error } = await supabase
      .from('movies')
      .delete()
      .eq('id', duplicateMovie.id);
    
    if (error) {
      console.log(chalk.red(`  ❌ Failed to delete duplicate: ${error.message}`));
      return { fixed: 0, failed: 1 };
    }
  }
  
  console.log(chalk.green(`  ✓ Duplicate removed: ${duplicateMovie.title_en} (${duplicateMovie.slug})`));
  console.log(chalk.green(`  ✓ Kept correct version: ${correctMovie.title_en} (${correctMovie.slug})`));
  
  return { fixed: 1, failed: 0 };
}

async function fixWrongHeroGender(batchSize: number, execute: boolean) {
  console.log(chalk.blue.bold(`\n👥 Fixing Wrong Hero Gender Issues\n`));
  
  // Get movies with female names in hero field
  const femaleNames = [
    'Sridevi', 'Soundarya', 'Ramya', 'Radhika', 'Jayasudha', 
    'Bhanupriya', 'Meena', 'Simran', 'Trisha', 'Samantha'
  ];
  
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .eq('language', 'Telugu')
    .not('hero', 'is', null)
    .limit(batchSize);
  
  if (!movies) {
    console.log(chalk.yellow('  ⊘ No movies found'));
    return { fixed: 0, failed: 0 };
  }
  
  // Filter for female names
  const problematicMovies = movies.filter(m => 
    femaleNames.some(name => m.hero?.toLowerCase().includes(name.toLowerCase()))
  );
  
  console.log(chalk.cyan(`  Found ${problematicMovies.length} movies with potential issues\n`));
  
  let fixed = 0;
  let failed = 0;
  
  for (const movie of problematicMovies.slice(0, 20)) { // Process first 20
    console.log(chalk.gray(`  Processing: ${movie.title_en} (${movie.release_year})`));
    console.log(chalk.gray(`    Current: Hero="${movie.hero}", Heroine="${movie.heroine}"`));
    
    // Try to get correct cast from TMDB
    let tmdbId = movie.tmdb_id;
    
    if (!tmdbId) {
      const tmdbMovie = await searchTMDB(movie.title_en, movie.release_year);
      if (tmdbMovie) {
        tmdbId = tmdbMovie.id;
      }
    }
    
    if (!tmdbId) {
      console.log(chalk.yellow(`    ⊘ No TMDB ID found\n`));
      failed++;
      continue;
    }
    
    const details = await getTMDBDetails(tmdbId);
    if (!details?.credits?.cast) {
      console.log(chalk.yellow(`    ⊘ No cast data from TMDB\n`));
      failed++;
      continue;
    }
    
    const cast = details.credits.cast;
    const maleLeads = cast.filter((c: any) => c.gender === 2).sort((a: any, b: any) => a.order - b.order);
    const femaleLeads = cast.filter((c: any) => c.gender === 1).sort((a: any, b: any) => a.order - b.order);
    
    const updates: any = {};
    
    // If current hero is in female leads, it's likely wrong
    const currentHeroName = movie.hero;
    const isCurrentHeroFemale = femaleLeads.some((c: any) => 
      c.name.toLowerCase().includes(currentHeroName?.toLowerCase())
    );
    
    if (isCurrentHeroFemale && maleLeads.length > 0) {
      // Move current hero to heroine, set correct male hero
      updates.hero = maleLeads[0].name;
      updates.heroine = currentHeroName;
      
      console.log(chalk.green(`    ✓ Reattributed: Hero="${updates.hero}", Heroine="${updates.heroine}"`));
    } else if (maleLeads.length > 0 && femaleLeads.length > 0) {
      // Just update with correct values
      updates.hero = maleLeads[0].name;
      updates.heroine = femaleLeads[0].name;
      
      console.log(chalk.green(`    ✓ Updated: Hero="${updates.hero}", Heroine="${updates.heroine}"`));
    } else {
      console.log(chalk.yellow(`    ⊘ Could not determine correct attribution\n`));
      failed++;
      continue;
    }
    
    if (execute && Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (error) {
        console.log(chalk.red(`    ❌ Update failed: ${error.message}\n`));
        failed++;
        continue;
      }
    }
    
    console.log(chalk.green(`    ✅ Fixed!\n`));
    fixed++;
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return { fixed, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const fixGender = args.includes('--fix-gender');
  const batchSize = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '20');

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║         APPLY SPECIFIC FIXES - 2026 DATA                             ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(`  Mode: ${execute ? chalk.red('EXECUTE') : chalk.yellow('DRY RUN')}`);
  console.log(`  Fix Gender Issues: ${fixGender ? chalk.green('YES') : chalk.gray('NO')}`);
  console.log(`  Batch Size: ${batchSize}\n`);

  const results: any = {
    specific_fixes: { fixed: 0, failed: 0 },
    duplicate_removal: { fixed: 0, failed: 0 },
    gender_fixes: { fixed: 0, failed: 0 },
  };

  // 1. Apply specific fixes (directors, heroes)
  results.specific_fixes = await applySpecificFixes(execute);

  // 2. Remove duplicate
  results.duplicate_removal = await removeDuplicate(execute);

  // 3. Fix gender attribution issues (if requested)
  if (fixGender) {
    results.gender_fixes = await fixWrongHeroGender(batchSize, execute);
  }

  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════╗
║            SUMMARY                                                   ║
╚══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.cyan('\n  Specific Fixes (Directors & Heroes):'));
  console.log(chalk.green(`    Fixed: ${results.specific_fixes.fixed}`));
  console.log(chalk.red(`    Failed: ${results.specific_fixes.failed}`));

  console.log(chalk.cyan('\n  Duplicate Removal:'));
  console.log(chalk.green(`    Fixed: ${results.duplicate_removal.fixed}`));
  console.log(chalk.red(`    Failed: ${results.duplicate_removal.failed}`));

  if (fixGender) {
    console.log(chalk.cyan('\n  Gender Attribution Fixes:'));
    console.log(chalk.green(`    Fixed: ${results.gender_fixes.fixed}`));
    console.log(chalk.red(`    Failed: ${results.gender_fixes.failed}`));
  }

  const totalFixed = Object.values(results).reduce((sum: number, r: any) => sum + r.fixed, 0);
  const totalFailed = Object.values(results).reduce((sum: number, r: any) => sum + r.failed, 0);

  console.log(chalk.blue.bold('\n  OVERALL:'));
  console.log(chalk.green(`    Total Fixed: ${totalFixed}`));
  console.log(chalk.red(`    Total Failed: ${totalFailed}`));

  if (!execute) {
    console.log(chalk.yellow(`\n  Run with --execute to apply changes`));
    console.log(chalk.gray(`  Run with --fix-gender to also fix gender attribution`));
    console.log(chalk.gray(`  Use --batch=<number> to control gender fix batch size\n`));
  }
}

main().catch(console.error);
