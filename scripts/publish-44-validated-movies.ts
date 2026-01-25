#!/usr/bin/env npx tsx
/**
 * PUBLISH 44 VALIDATED MOVIES
 * 
 * Checks which of the 44 validated movies are ready to publish
 * and creates a manual review list for those that need attention
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

interface MovieStatus {
  id: string;
  title: string;
  year: number;
  slug: string;
  status: 'ready' | 'needs_review';
  issues: string[];
  hasHero: boolean;
  hasDirector: boolean;
  hasPoster: boolean;
  hasRating: boolean;
  isPublished: boolean;
}

async function analyzeAndPublish() {
  console.log(chalk.blue.bold('\n📋 ANALYZE & PUBLISH 44 VALIDATED MOVIES\n'));
  
  if (!EXECUTE) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('    Use --execute to publish movies\n'));
  }
  
  // Fetch all 44 movies
  const { data: movies, error: fetchError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, hero, director, poster_url, our_rating, is_published')
    .in('id', VALIDATED_MOVIE_IDS);
  
  if (fetchError || !movies) {
    console.log(chalk.red(`✗ Error fetching movies: ${fetchError?.message}`));
    return;
  }
  
  console.log(chalk.green(`✓ Found ${movies.length}/44 movies\n`));
  
  const readyToPublish: MovieStatus[] = [];
  const needsReview: MovieStatus[] = [];
  
  // Analyze each movie
  for (const movie of movies) {
    const issues: string[] = [];
    
    const hasHero = !!movie.hero;
    const hasDirector = !!movie.director;
    const hasPoster = !!movie.poster_url;
    const hasRating = !!movie.our_rating;
    
    if (!hasHero) issues.push('Missing Hero');
    if (!hasDirector) issues.push('Missing Director');
    if (!hasPoster) issues.push('Missing Poster');
    if (!hasRating) issues.push('Missing Rating');
    
    const status: MovieStatus = {
      id: movie.id,
      title: movie.title_en,
      year: movie.release_year,
      slug: movie.slug,
      status: issues.length === 0 ? 'ready' : 'needs_review',
      issues,
      hasHero,
      hasDirector,
      hasPoster,
      hasRating,
      isPublished: movie.is_published,
    };
    
    if (status.status === 'ready') {
      readyToPublish.push(status);
    } else {
      needsReview.push(status);
    }
  }
  
  // Print ready to publish
  console.log(chalk.green.bold(`\n✅ READY TO PUBLISH (${readyToPublish.length} movies)\n`));
  
  for (const movie of readyToPublish) {
    console.log(chalk.green(`✓ ${movie.title} (${movie.year})`));
    console.log(chalk.gray(`  Status: ${movie.isPublished ? 'Already Published' : 'Will Publish'}`));
  }
  
  // Publish ready movies
  if (EXECUTE && readyToPublish.length > 0) {
    const idsToPublish = readyToPublish
      .filter(m => !m.isPublished)
      .map(m => m.id);
    
    if (idsToPublish.length > 0) {
      console.log(chalk.cyan(`\n📤 Publishing ${idsToPublish.length} movies...`));
      
      const { error: publishError } = await supabase
        .from('movies')
        .update({ is_published: true, updated_at: new Date().toISOString() })
        .in('id', idsToPublish);
      
      if (publishError) {
        console.log(chalk.red(`✗ Publish failed: ${publishError.message}`));
      } else {
        console.log(chalk.green(`✓ Published ${idsToPublish.length} movies successfully!`));
      }
    }
  }
  
  // Print needs review
  console.log(chalk.yellow.bold(`\n⚠️  NEEDS MANUAL REVIEW (${needsReview.length} movies)\n`));
  
  for (const movie of needsReview) {
    console.log(chalk.yellow(`⚠ ${movie.title} (${movie.year})`));
    console.log(chalk.gray(`  Issues: ${movie.issues.join(', ')}`));
  }
  
  // Generate CSV for manual review
  const csvLines = [
    'ID,Title,Year,Slug,Has_Hero,Has_Director,Has_Poster,Has_Rating,Issues',
    ...needsReview.map(m => 
      `${m.id},"${m.title}",${m.year},${m.slug},${m.hasHero},${m.hasDirector},${m.hasPoster},${m.hasRating},"${m.issues.join('; ')}"`
    )
  ];
  
  const csvContent = csvLines.join('\n');
  fs.writeFileSync('validated-movies-manual-review-2026-01-15.csv', csvContent);
  
  console.log(chalk.cyan(`\n📄 Manual review list saved to: validated-movies-manual-review-2026-01-15.csv`));
  
  // Print summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('PUBLICATION SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies Analyzed:     ${movies.length}`));
  console.log(chalk.green(`Ready to Publish:          ${readyToPublish.length}`));
  console.log(chalk.gray(`  Already Published:       ${readyToPublish.filter(m => m.isPublished).length}`));
  console.log(chalk.cyan(`  Will Publish:            ${readyToPublish.filter(m => !m.isPublished).length}`));
  console.log(chalk.yellow(`Needs Manual Review:       ${needsReview.length}`));
  
  console.log(chalk.gray('\nIssue Breakdown:'));
  const issueCounts: Record<string, number> = {};
  needsReview.forEach(m => {
    m.issues.forEach(issue => {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    });
  });
  
  Object.entries(issueCounts).forEach(([issue, count]) => {
    console.log(chalk.white(`  ${issue}: ${count} movies`));
  });
  
  if (!EXECUTE && readyToPublish.filter(m => !m.isPublished).length > 0) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No movies were published'));
    console.log(chalk.yellow('   Run with --execute to publish'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

analyzeAndPublish()
  .then(() => {
    console.log(chalk.green('✓ Analysis and publication completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Process failed:'), error);
    process.exit(1);
  });
