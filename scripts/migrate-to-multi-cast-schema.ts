#!/usr/bin/env npx tsx
/**
 * Migrate to Multi-Cast Schema
 * 
 * This script migrates the movies table to support multiple heroes/heroines:
 * 1. Adds heroes[] and heroines[] array columns
 * 2. Migrates comma-separated values to arrays
 * 3. Maintains backward compatibility with existing hero/heroine fields
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-multi-cast-schema.ts --dry-run  # Preview changes
 *   npx tsx scripts/migrate-to-multi-cast-schema.ts            # Apply changes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Parse comma-separated names into array
 */
function parseNames(nameString: string | null): string[] {
  if (!nameString) return [];
  
  // Split by comma
  const names = nameString.split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  
  return names;
}

/**
 * Check if schema columns exist
 */
async function checkSchema(): Promise<boolean> {
  // Note: Supabase doesn't directly expose information_schema
  // We'll try to query and see if columns exist
  const { error } = await supabase
    .from('movies')
    .select('heroes, heroines')
    .limit(1);

  return !error; // If no error, columns exist
}

async function migrateToMultiCast() {
  console.log('🚀 Multi-Cast Schema Migration\n');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes)' : '✅ LIVE (will make changes)'}\n`);

  // Step 1: Check if columns already exist
  console.log('📋 Step 1: Checking schema...\n');
  
  const columnsExist = await checkSchema();
  
  if (columnsExist) {
    console.log('✅ heroes and heroines columns already exist\n');
  } else {
    console.log('⚠️  heroes and heroines columns do NOT exist');
    console.log('   These need to be added via Supabase dashboard or SQL:');
    console.log('');
    console.log('   SQL to run:');
    console.log('   ```sql');
    console.log('   ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroes TEXT[];');
    console.log('   ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroines TEXT[];');
    console.log('   CREATE INDEX IF NOT EXISTS idx_movies_heroes ON movies USING GIN (heroes);');
    console.log('   CREATE INDEX IF NOT EXISTS idx_movies_heroines ON movies USING GIN (heroines);');
    console.log('   ```\n');
    
    if (!DRY_RUN) {
      console.log('❌ Cannot proceed without columns. Add them first and re-run.\n');
      return;
    }
  }

  // Step 2: Find movies with comma-separated heroes
  console.log('='.repeat(80));
  console.log('📋 Step 2: Finding movies with multiple heroes...\n');

  const { data: commaHeroMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine, heroes, heroines')
    .eq('is_published', true)
    .ilike('hero', '%,%');

  const { data: commaHeroineMovies } = await supabase
    .from('movies')
    .select('id, title_en, hero, heroine, heroes, heroines')
    .eq('is_published', true)
    .ilike('heroine', '%,%');

  console.log(`Found ${commaHeroMovies?.length || 0} movies with multiple heroes`);
  console.log(`Found ${commaHeroineMovies?.length || 0} movies with multiple heroines\n`);

  // Step 3: Preview migration
  console.log('='.repeat(80));
  console.log('📋 Step 3: Migration Preview\n');

  let heroUpdateCount = 0;
  let heroineUpdateCount = 0;

  const updates: Array<{
    id: string;
    title: string;
    oldHero: string;
    newHeroes: string[];
    oldHeroine: string;
    newHeroines: string[];
  }> = [];

  // Process hero migrations
  if (commaHeroMovies) {
    for (const movie of commaHeroMovies) {
      const heroes = parseNames(movie.hero);
      
      // Only migrate if not already migrated
      if (!movie.heroes || movie.heroes.length === 0) {
        heroUpdateCount++;
        updates.push({
          id: movie.id,
          title: movie.title_en,
          oldHero: movie.hero,
          newHeroes: heroes,
          oldHeroine: movie.heroine || '',
          newHeroines: movie.heroines || [],
        });
      }
    }
  }

  // Process heroine migrations
  if (commaHeroineMovies) {
    for (const movie of commaHeroineMovies) {
      const heroines = parseNames(movie.heroine);
      
      // Check if already in updates
      const existing = updates.find(u => u.id === movie.id);
      if (existing) {
        existing.newHeroines = heroines;
      } else if (!movie.heroines || movie.heroines.length === 0) {
        heroineUpdateCount++;
        updates.push({
          id: movie.id,
          title: movie.title_en,
          oldHero: movie.hero || '',
          newHeroes: movie.heroes || [],
          oldHeroine: movie.heroine,
          newHeroines: heroines,
        });
      }
    }
  }

  console.log(`Movies to update: ${updates.length}`);
  console.log(`  - Hero field updates: ${heroUpdateCount}`);
  console.log(`  - Heroine field updates: ${heroineUpdateCount}\n`);

  // Show sample updates
  console.log('Sample updates (first 10):\n');
  updates.slice(0, 10).forEach((update, index) => {
    console.log(`${index + 1}. ${update.title}`);
    if (update.newHeroes.length > 0) {
      console.log(`   hero: "${update.oldHero}"`);
      console.log(`   → heroes: [${update.newHeroes.map(h => `"${h}"`).join(', ')}]`);
    }
    if (update.newHeroines.length > 0) {
      console.log(`   heroine: "${update.oldHeroine}"`);
      console.log(`   → heroines: [${update.newHeroines.map(h => `"${h}"`).join(', ')}]`);
    }
    console.log('');
  });

  if (updates.length > 10) {
    console.log(`... and ${updates.length - 10} more\n`);
  }

  // Step 4: Apply migration (if not dry run)
  if (!DRY_RUN && updates.length > 0) {
    console.log('='.repeat(80));
    console.log('📋 Step 4: Applying migration...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      const updateData: any = {};
      
      if (update.newHeroes.length > 0) {
        updateData.heroes = update.newHeroes;
      }
      
      if (update.newHeroines.length > 0) {
        updateData.heroines = update.newHeroines;
      }

      const { error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', update.id);

      if (error) {
        console.log(`❌ Error updating "${update.title}": ${error.message}`);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          console.log(`   ✅ Updated ${successCount}/${updates.length} movies...`);
        }
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}\n`);
  } else if (DRY_RUN) {
    console.log('='.repeat(80));
    console.log('🔍 DRY RUN MODE - No changes made\n');
    console.log('To apply changes, run without --dry-run flag:\n');
    console.log('  npx tsx scripts/migrate-to-multi-cast-schema.ts\n');
  }

  // Step 5: Generate SQL script
  console.log('='.repeat(80));
  console.log('📋 Generating SQL script for manual execution...\n');

  let sqlScript = `-- Multi-Cast Schema Migration SQL Script
-- Generated: ${new Date().toISOString()}
-- Total Updates: ${updates.length}

BEGIN;

-- Add columns if not exists
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroes TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroines TEXT[];

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_movies_heroes ON movies USING GIN (heroes);
CREATE INDEX IF NOT EXISTS idx_movies_heroines ON movies USING GIN (heroines);

-- Update movies
`;

  updates.forEach((update, index) => {
    sqlScript += `\n-- ${index + 1}. ${update.title}\n`;
    
    if (update.newHeroes.length > 0) {
      const heroesArray = update.newHeroes.map(h => `'${h.replace(/'/g, "''")}'`).join(', ');
      sqlScript += `UPDATE movies SET heroes = ARRAY[${heroesArray}] WHERE id = '${update.id}';\n`;
    }
    
    if (update.newHeroines.length > 0) {
      const heroinesArray = update.newHeroines.map(h => `'${h.replace(/'/g, "''")}'`).join(', ');
      sqlScript += `UPDATE movies SET heroines = ARRAY[${heroinesArray}] WHERE id = '${update.id}';\n`;
    }
  });

  sqlScript += `\n-- Commit changes
COMMIT;

-- Or rollback to review:
-- ROLLBACK;
`;

  const sqlPath = '/Users/sharathchandra/Projects/telugu-portal/multi-cast-migration.sql';
  fs.writeFileSync(sqlPath, sqlScript);
  console.log(`SQL script saved: ${sqlPath}\n`);

  console.log('='.repeat(80));
  console.log('✅ Migration script complete!\n');
  console.log('Next steps:');
  console.log('1. Review the SQL script');
  console.log('2. Run migration (without --dry-run)');
  console.log('3. Update search API to handle heroes[] arrays');
  console.log('4. Update profile API to query heroes[] arrays');
  console.log('5. Test multi-hero movies\n');
}

migrateToMultiCast().catch(console.error);
