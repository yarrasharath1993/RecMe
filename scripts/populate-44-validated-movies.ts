#!/usr/bin/env npx tsx
/**
 * POPULATE ENTITY RELATIONS FOR 44 VALIDATED MOVIES
 * 
 * Extracts and populates entity relations for the 44 movies we just updated
 * with validated Hero and Director information
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// The 44 validated movie IDs
const VALIDATED_MOVIE_IDS = [
  'b994c347-d1e4-4edd-96f5-79f8baca9bea',
  'd20403fb-8432-4565-85c4-961d128206cb',
  '8ac900ab-636a-4b62-8ea9-449341cd3539',
  '8182275f-e88d-4453-b855-4bb1695ef80c',
  '5cd8b5da-c6cc-4acc-822a-361acc6e6803',
  '1f339783-8a95-40dc-a318-fdb69edc331e',
  '5e4052c0-9936-4bc9-9284-5adf79dcf4f4',
  'bb35eb63-49c4-42aa-a405-7ca08b8a813d',
  '6dcf4ef0-f5e9-4717-96dd-14513908ce02',
  '06fbeb2c-ab89-423c-9e63-6009e3e96688',
  '092508fb-f084-443b-aa50-3c6d06b6ec12',
  'ff32a1f8-e0a8-41fd-9fe9-5f9ffb94b6fa',
  '5205c2dc-2f36-48c9-9807-3153e897adbd',
  'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485',
  'e1124ed1-4aee-40ec-a97e-f5ecd5966a8d',
  '6d038721-fec0-4ba3-a90b-acbb26ef088e',
  '86e58157-d33f-48d1-a562-7413efddffd9',
  '32d1c1ea-abd5-44ae-980e-369ba2f6ab96',
  '95639c8c-fad3-4ef9-b2a3-0e1b06040346',
  '1d57f0ef-c4ed-4b34-b453-b608ce213ba3',
  '9fcf70da-160e-4635-af49-538749378675',
  '6212f700-84e3-4c84-bedc-570a48747a3d',
  '06506eed-73d6-43dd-af5e-66030ac47b65',
  '0a0d8345-02a7-4343-ada9-89ea66b5f912',
  '90c2fb7e-6c92-45a4-81c4-a6c18b32e742',
  'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e',
  'd230d639-8927-40d7-9889-79f95e18d21f',
  '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31',
  '2d2300e8-75f4-40fa-9d89-11b728749949',
  'f0b669a6-227e-46c8-bdca-8778aef704d8',
  'b7aad561-d88c-44b1-bd47-7076d669d0b5',
  '1196ac9f-472a-446a-9f7b-41b8ad8bdb75',
  '2ced2102-12ab-4391-9e5b-40ae526c7b11',
  '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4',
  '2142390d-8c14-4236-9aae-eb20edaa95cd',
  '3bbeed9a-30c4-458c-827a-11f4df9582c4',
  '4bf8c217-ffe2-489d-809d-50a499ac3cd1',
  '7f0b003c-b15f-4087-9003-0efc1d959658',
  '5d95bc5d-9490-4664-abc6-d2a9e29a05a8',
  '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3',
  'aa6a8a7d-f47e-42a0-b938-3145ad479fb3',
  'f86df043-4436-46ee-a4b6-6889d3b29f2e',
  '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a',
  'f6069bac-c8e0-43a6-9742-22cd0cb22ac1',
];

const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function populateEntityRelations() {
  console.log(chalk.blue.bold('\n🔗 POPULATE ENTITY RELATIONS FOR 44 VALIDATED MOVIES\n'));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  // Fetch the 44 movies
  const { data: movies, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, hero, director, heroine, music_director, producer, supporting_cast, crew')
    .in('id', VALIDATED_MOVIE_IDS);
  
  if (fetchError || !movies) {
    console.log(chalk.red(`✗ Error fetching movies: ${fetchError?.message}`));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length}/44 movies\n`));
  
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    totalRelations: 0,
    heroes: 0,
    heroines: 0,
    directors: 0,
    musicDirectors: 0,
    producers: 0,
    supporting: 0,
    crew: 0,
  };
  
  for (const movie of movies) {
    stats.processed++;
    
    try {
      const relations: any[] = [];
      
      // Extract hero
      if (movie.hero) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: 'actor',
          entity_name: movie.hero,
          entity_slug: toSlug(movie.hero),
          role_type: 'hero',
          is_verified: true,
          is_inferred: false,
          confidence: 1.0,
          inference_source: 'manual',
        });
        stats.heroes++;
      }
      
      // Extract heroine
      if (movie.heroine) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: 'actor',
          entity_name: movie.heroine,
          entity_slug: toSlug(movie.heroine),
          role_type: 'heroine',
          is_verified: true,
          is_inferred: false,
          confidence: 1.0,
          inference_source: 'manual',
        });
        stats.heroines++;
      }
      
      // Extract director
      if (movie.director) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: 'director',
          entity_name: movie.director,
          entity_slug: toSlug(movie.director),
          role_type: 'director',
          is_verified: true,
          is_inferred: false,
          confidence: 1.0,
          inference_source: 'manual',
        });
        stats.directors++;
      }
      
      // Extract music director
      if (movie.music_director) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: 'music_director',
          entity_name: movie.music_director,
          entity_slug: toSlug(movie.music_director),
          role_type: 'music_director',
          is_verified: true,
          is_inferred: false,
          confidence: 1.0,
          inference_source: 'manual',
        });
        stats.musicDirectors++;
      }
      
      // Extract producer
      if (movie.producer) {
        relations.push({
          movie_id: movie.id,
          movie_title: movie.title_en,
          movie_year: movie.release_year,
          movie_slug: movie.slug,
          entity_type: 'producer',
          entity_name: movie.producer,
          entity_slug: toSlug(movie.producer),
          role_type: 'producer',
          is_verified: true,
          is_inferred: false,
          confidence: 1.0,
          inference_source: 'manual',
        });
        stats.producers++;
      }
      
      // Extract supporting cast
      if (Array.isArray(movie.supporting_cast)) {
        for (let i = 0; i < movie.supporting_cast.length; i++) {
          const actor = movie.supporting_cast[i];
          const actorName = typeof actor === 'string' ? actor : actor.name;
          
          if (actorName) {
            relations.push({
              movie_id: movie.id,
              movie_title: movie.title_en,
              movie_year: movie.release_year,
              movie_slug: movie.slug,
              entity_type: 'actor',
              entity_name: actorName,
              entity_slug: toSlug(actorName),
              role_type: 'supporting',
              is_verified: true,
              is_inferred: false,
              confidence: 0.9,
              inference_source: 'manual',
              billing_order: i + 1,
            });
            stats.supporting++;
          }
        }
      }
      
      // Extract crew
      if (movie.crew && typeof movie.crew === 'object') {
        const crewFields = ['cinematographer', 'editor', 'writer', 'choreographer', 'lyricist', 'art_director', 'costume_designer'];
        
        for (const field of crewFields) {
          if (movie.crew[field]) {
            relations.push({
              movie_id: movie.id,
              movie_title: movie.title_en,
              movie_year: movie.release_year,
              movie_slug: movie.slug,
              entity_type: 'crew',
              entity_name: movie.crew[field],
              entity_slug: toSlug(movie.crew[field]),
              role_type: field,
              is_verified: true,
              is_inferred: false,
              confidence: 0.9,
              inference_source: 'manual',
            });
            stats.crew++;
          }
        }
      }
      
      console.log(chalk.cyan(`[${stats.processed}/44] ${movie.title_en}`));
      console.log(chalk.gray(`  Found ${relations.length} relations`));
      
      if (EXECUTE && relations.length > 0) {
        // Delete existing relations for this movie first
        await supabase
          .from('entity_relations')
          .delete()
          .eq('movie_id', movie.id);
        
        // Insert new relations
        const { error: insertError } = await supabase
          .from('entity_relations')
          .insert(relations);
        
        if (insertError) {
          console.log(chalk.red(`  ✗ Failed: ${insertError.message}`));
          stats.failed++;
        } else {
          console.log(chalk.green(`  ✓ Inserted ${relations.length} relations`));
          stats.succeeded++;
          stats.totalRelations += relations.length;
        }
      } else {
        console.log(chalk.yellow(`  ⊳ DRY RUN - Would insert ${relations.length} relations`));
        stats.succeeded++;
        stats.totalRelations += relations.length;
      }
      
    } catch (error) {
      console.log(chalk.red(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      stats.failed++;
    }
  }
  
  // Print summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('ENTITY RELATIONS POPULATION SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:         ${stats.processed}`));
  console.log(chalk.green(`Succeeded:            ${stats.succeeded}`));
  console.log(chalk.red(`Failed:               ${stats.failed}`));
  console.log(chalk.cyan(`Relations Created:    ${stats.totalRelations}`));
  
  console.log(chalk.gray('\nRelations by Type:'));
  console.log(chalk.white(`  Heroes:             ${stats.heroes}`));
  console.log(chalk.white(`  Heroines:           ${stats.heroines}`));
  console.log(chalk.white(`  Directors:          ${stats.directors}`));
  console.log(chalk.white(`  Music Directors:    ${stats.musicDirectors}`));
  console.log(chalk.white(`  Producers:          ${stats.producers}`));
  console.log(chalk.white(`  Supporting Cast:    ${stats.supporting}`));
  console.log(chalk.white(`  Crew:               ${stats.crew}`));
  
  const successRate = stats.processed > 0 ? Math.round((stats.succeeded / stats.processed) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:         ${successRate}%`));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes were made to database'));
    console.log(chalk.yellow('   Run with --execute to apply changes'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

populateEntityRelations()
  .then(() => {
    console.log(chalk.green('✓ Entity relations population completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Population failed:'), error);
    process.exit(1);
  });
