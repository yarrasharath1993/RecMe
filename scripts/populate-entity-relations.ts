#!/usr/bin/env npx tsx
/**
 * ENTITY RELATIONS POPULATION SCRIPT
 * 
 * Extracts and populates the entity_relations table from existing movie fields:
 * - hero, heroine, director → entity_relations (verified=true, confidence=0.95)
 * - music_director, producer → entity_relations (verified=true, confidence=0.90)
 * - supporting_cast (JSONB) → entity_relations (verified=true, confidence=0.85)
 * - crew (JSONB) → entity_relations (verified=false, confidence=0.80)
 * 
 * NON-DESTRUCTIVE: Keeps existing movie fields, adds to entity_relations table
 * 
 * Usage:
 *   npx tsx scripts/populate-entity-relations.ts --limit=1000 --execute
 *   npx tsx scripts/populate-entity-relations.ts --all --execute
 *   npx tsx scripts/populate-entity-relations.ts --slug=baahubali --execute
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string = ''): string => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const EXECUTE = hasFlag('execute');
const LIMIT = parseInt(getArg('limit', '1000'));
const ALL = hasFlag('all');
const SLUG = getArg('slug', '');
const CLEAR_EXISTING = hasFlag('clear'); // Clear existing relations first
const DRY_RUN = hasFlag('dry-run');

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(chalk.blue.bold('\n🔗 ENTITY RELATIONS POPULATION SCRIPT\n'));
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  // Clear existing relations if requested
  if (CLEAR_EXISTING && EXECUTE) {
    console.log(chalk.yellow('Clearing existing entity_relations...'));
    const { error } = await supabase
      .from('entity_relations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) {
      console.log(chalk.red(`✗ Failed to clear: ${error.message}`));
    } else {
      console.log(chalk.green('✓ Cleared existing relations\n'));
    }
  }
  
  // Get movies
  const movies = await getMovies();
  
  if (!movies || movies.length === 0) {
    console.log(chalk.red('✗ No movies found'));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length} movies to process\n`));
  
  // Process movies
  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    relations_created: 0,
    heroes: 0,
    heroines: 0,
    directors: 0,
    music_directors: 0,
    producers: 0,
    supporting_cast: 0,
    crew: 0,
  };
  
  for (const movie of movies) {
    results.processed++;
    
    console.log(chalk.cyan(`\n[${results.processed}/${movies.length}] ${movie.title_en} (${movie.release_year || 'N/A'})`));
    
    try {
      const relations = await extractRelationsFromMovie(movie);
      
      console.log(chalk.gray(`  Found ${relations.length} relations`));
      
      if (EXECUTE && relations.length > 0) {
        // Insert relations (with conflict handling)
        const { data, error } = await supabase
          .from('entity_relations')
          .upsert(relations, {
            onConflict: 'movie_id,entity_name,role_type',
            ignoreDuplicates: false,
          });
        
        if (error) {
          console.log(chalk.red(`  ✗ Failed to insert: ${error.message}`));
          results.failed++;
        } else {
          console.log(chalk.green(`  ✓ Inserted ${relations.length} relations`));
          results.succeeded++;
          results.relations_created += relations.length;
          
          // Count by type
          for (const rel of relations) {
            if (rel.role_type === 'hero') results.heroes++;
            else if (rel.role_type === 'heroine') results.heroines++;
            else if (rel.role_type === 'director') results.directors++;
            else if (rel.role_type === 'music') results.music_directors++;
            else if (rel.role_type === 'producer') results.producers++;
            else if (rel.role_type === 'supporting') results.supporting_cast++;
            else if (rel.role_type === 'crew') results.crew++;
          }
        }
      } else if (DRY_RUN || !EXECUTE) {
        console.log(chalk.yellow(`  ⊳ DRY RUN - Would insert ${relations.length} relations`));
        results.succeeded++;
        results.relations_created += relations.length;
      }
      
    } catch (error) {
      console.log(chalk.red(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown'}`));
      results.failed++;
    }
  }
  
  // Print summary
  printSummary(results, movies.length);
}

// ============================================================
// HELPERS
// ============================================================

async function getMovies() {
  let query = supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, heroine, director, music_director, producer, supporting_cast, crew')
    .eq('is_published', true);
  
  if (SLUG) {
    query = query.eq('slug', SLUG);
  } else if (!ALL) {
    query = query.limit(LIMIT);
  }
  
  query = query.order('release_year', { ascending: false, nullsFirst: false });
  
  const { data, error } = await query;
  
  if (error) {
    console.log(chalk.red(`Error fetching movies: ${error.message}`));
    return null;
  }
  
  return data;
}

async function extractRelationsFromMovie(movie: any): Promise<any[]> {
  const relations: any[] = [];
  
  // Hero (verified, high confidence)
  if (movie.hero) {
    relations.push({
      movie_id: movie.id,
      movie_title: movie.title_en,
      movie_year: movie.release_year,
      movie_slug: movie.slug,
      entity_type: 'actor',
      entity_name: movie.hero,
      entity_slug: null, // Will be populated by linking script
      role_type: 'hero',
      is_verified: true,
      is_inferred: false,
      confidence: 0.95,
      inference_source: 'manual',
      data_source: 'existing_field',
    });
  }
  
  // Heroine (verified, high confidence)
  if (movie.heroine) {
    relations.push({
      movie_id: movie.id,
      movie_title: movie.title_en,
      movie_year: movie.release_year,
      movie_slug: movie.slug,
      entity_type: 'actress',
      entity_name: movie.heroine,
      entity_slug: null,
      role_type: 'heroine',
      is_verified: true,
      is_inferred: false,
      confidence: 0.95,
      inference_source: 'manual',
      data_source: 'existing_field',
    });
  }
  
  // Director (verified, high confidence)
  if (movie.director) {
    relations.push({
      movie_id: movie.id,
      movie_title: movie.title_en,
      movie_year: movie.release_year,
      movie_slug: movie.slug,
      entity_type: 'director',
      entity_name: movie.director,
      entity_slug: null,
      role_type: 'director',
      is_verified: true,
      is_inferred: false,
      confidence: 0.95,
      inference_source: 'manual',
      data_source: 'existing_field',
    });
  }
  
  // Music Director (verified, medium-high confidence)
  if (movie.music_director) {
    relations.push({
      movie_id: movie.id,
      movie_title: movie.title_en,
      movie_year: movie.release_year,
      movie_slug: movie.slug,
      entity_type: 'music_director',
      entity_name: movie.music_director,
      entity_slug: null,
      role_type: 'music',
      is_verified: true,
      is_inferred: false,
      confidence: 0.90,
      inference_source: 'manual',
      data_source: 'existing_field',
    });
  }
  
  // Producer (verified, medium-high confidence)
  if (movie.producer) {
    relations.push({
      movie_id: movie.id,
      movie_title: movie.title_en,
      movie_year: movie.release_year,
      movie_slug: movie.slug,
      entity_type: 'producer',
      entity_name: movie.producer,
      entity_slug: null,
      role_type: 'producer',
      is_verified: true,
      is_inferred: false,
      confidence: 0.90,
      inference_source: 'manual',
      data_source: 'existing_field',
    });
  }
  
  // Supporting Cast (JSONB array)
  if (movie.supporting_cast && Array.isArray(movie.supporting_cast)) {
    for (let i = 0; i < movie.supporting_cast.length; i++) {
      const cast = movie.supporting_cast[i];
      if (cast.name) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: 'actor',
          entity_name: cast.name,
          entity_slug: null,
          role_type: 'supporting',
          character_name: cast.role || null,
          billing_order: i + 1,
          is_verified: true,
          is_inferred: false,
          confidence: 0.85,
          inference_source: 'tmdb',
          data_source: 'supporting_cast_json',
        });
      }
    }
  }
  
  // Crew (JSONB object)
  if (movie.crew && typeof movie.crew === 'object') {
    const crewFields = [
      { key: 'cinematographer', type: 'cinematographer', role: 'cinematographer' },
      { key: 'editor', type: 'editor', role: 'editor' },
      { key: 'writer', type: 'writer', role: 'writer' },
      { key: 'choreographer', type: 'choreographer', role: 'choreographer' },
      { key: 'lyricist', type: 'lyricist', role: 'lyricist' },
    ];
    
    for (const field of crewFields) {
      if (movie.crew[field.key]) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: field.type,
          entity_name: movie.crew[field.key],
          entity_slug: null,
          role_type: 'crew',
          is_verified: false, // Crew data is less verified
          is_inferred: false,
          confidence: 0.80,
          inference_source: 'tmdb',
          data_source: 'crew_json',
        });
      }
    }
  }
  
  return relations;
}

function printSummary(results: any, total: number) {
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('ENTITY RELATIONS POPULATION SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:         ${total}`));
  console.log(chalk.white(`Processed:            ${results.processed}`));
  console.log(chalk.green(`Succeeded:            ${results.succeeded}`));
  console.log(chalk.red(`Failed:               ${results.failed}`));
  console.log(chalk.cyan(`Relations Created:    ${results.relations_created}`));
  
  console.log(chalk.gray('\nRelations by Type:'));
  console.log(chalk.white(`  Heroes:             ${results.heroes}`));
  console.log(chalk.white(`  Heroines:           ${results.heroines}`));
  console.log(chalk.white(`  Directors:          ${results.directors}`));
  console.log(chalk.white(`  Music Directors:    ${results.music_directors}`));
  console.log(chalk.white(`  Producers:          ${results.producers}`));
  console.log(chalk.white(`  Supporting Cast:    ${results.supporting_cast}`));
  console.log(chalk.white(`  Crew:               ${results.crew}`));
  
  const successRate = total > 0 ? Math.round((results.succeeded / total) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:         ${successRate}%`));
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes were made to database'));
    console.log(chalk.yellow('   Run with --execute to apply changes'));
  }
  
  console.log(chalk.gray('\nNext Steps:'));
  console.log(chalk.gray('  1. Run with --execute to populate entity_relations table'));
  console.log(chalk.gray('  2. Run link-entity-relations.ts to link entities to celebrities'));
  console.log(chalk.gray('  3. Use entity_relations for queries and analysis'));
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

// ============================================================
// RUN
// ============================================================

main()
  .then(() => {
    console.log(chalk.green('✓ Population script completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Population script failed:'), error);
    process.exit(1);
  });
