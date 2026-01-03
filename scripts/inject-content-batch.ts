#!/usr/bin/env npx tsx
/**
 * Batch Content Injection - Phase 6
 * 
 * Injects evergreen content in one orchestrated flow:
 * - Stories (Kids content from safe sources)
 * - Health articles (evergreen wellness content)
 * - Games (Dubcharades, Sobon, etc.)
 * 
 * Rules:
 * - Remove ALL sample/dummy data first
 * - Safe, factual content only
 * - No copyrighted material
 * - Family-friendly
 * 
 * Usage:
 *   pnpm content:inject --type=all
 *   pnpm content:inject --type=stories --limit=50
 *   pnpm content:inject --type=health --limit=30
 *   pnpm content:inject --type=games --limit=10
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import chalk from 'chalk';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// TYPES
// ============================================================

interface CLIArgs {
  type: 'all' | 'stories' | 'health' | 'games';
  limit: number;
  cleanup: boolean; // Remove sample data first
  dryRun: boolean;
}

interface ContentItem {
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_published: boolean;
  is_evergreen: boolean;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase credentials');
  }
  
  return createClient(url, key);
}

// ============================================================
// SAMPLE CONTENT DATA
// ============================================================

const STORIES_CONTENT = [
  {
    title: 'The Clever Crow',
    content: 'A clever crow teaches children about problem-solving when faced with challenges...',
    category: 'Kids Stories',
    tags: ['moral', 'animals', 'problem-solving'],
    is_published: true,
    is_evergreen: true,
  },
  {
    title: 'The Honest Woodcutter',
    content: 'A story about honesty and integrity in everyday life...',
    category: 'Kids Stories',
    tags: ['moral', 'honesty', 'values'],
    is_published: true,
    is_evergreen: true,
  },
  {
    title: 'The Ant and the Grasshopper',
    content: 'A timeless tale about the importance of planning and hard work...',
    category: 'Kids Stories',
    tags: ['moral', 'planning', 'wisdom'],
    is_published: true,
    is_evergreen: true,
  },
];

const HEALTH_CONTENT = [
  {
    title: '10 Tips for Better Sleep',
    content: 'Discover evidence-based strategies for improving your sleep quality and overall well-being...',
    category: 'Health & Wellness',
    tags: ['sleep', 'wellness', 'lifestyle'],
    is_published: true,
    is_evergreen: true,
  },
  {
    title: 'Healthy Eating for Busy Professionals',
    content: 'Practical nutrition tips for maintaining a healthy diet despite a hectic schedule...',
    category: 'Health & Wellness',
    tags: ['nutrition', 'lifestyle', 'wellness'],
    is_published: true,
    is_evergreen: true,
  },
  {
    title: 'Simple Exercises You Can Do at Home',
    content: 'No gym? No problem! These simple exercises can be done anywhere...',
    category: 'Health & Wellness',
    tags: ['exercise', 'fitness', 'wellness'],
    is_published: true,
    is_evergreen: true,
  },
];

const GAMES_CONTENT = [
  {
    title: 'Dubcharades - Telugu Movie Game',
    content: 'A fun game where you act out Telugu movie titles without speaking...',
    category: 'Games',
    tags: ['games', 'movies', 'fun'],
    is_published: true,
    is_evergreen: true,
  },
  {
    title: 'Sobon - Word Chain Game',
    content: 'Connect words based on the last letter to create an endless chain...',
    category: 'Games',
    tags: ['games', 'words', 'fun'],
    is_published: true,
    is_evergreen: true,
  },
  {
    title: 'Movie Quiz - Guess the Dialogue',
    content: 'Test your Telugu cinema knowledge with this dialogue guessing game...',
    category: 'Games',
    tags: ['games', 'movies', 'quiz'],
    is_published: true,
    is_evergreen: true,
  },
];

// ============================================================
// CLEANUP FUNCTIONS
// ============================================================

async function cleanupSampleData(supabase: any): Promise<number> {
  console.log(chalk.yellow('🧹 Cleaning up sample/dummy data...\n'));

  let totalRemoved = 0;

  // Remove stories with 'sample' or 'test' in title
  const { data: sampleStories } = await supabase
    .from('stories')
    .select('id, title')
    .or('title.ilike.%sample%,title.ilike.%test%,title.ilike.%dummy%');

  if (sampleStories && sampleStories.length > 0) {
    console.log(chalk.gray(`  Found ${sampleStories.length} sample stories`));
    
    const { error } = await supabase
      .from('stories')
      .delete()
      .in('id', sampleStories.map((s: any) => s.id));

    if (!error) {
      totalRemoved += sampleStories.length;
      console.log(chalk.green(`  ✓ Removed ${sampleStories.length} sample stories`));
    }
  }

  // Remove health content with 'sample' or 'test'
  const { data: sampleHealth } = await supabase
    .from('health_content')
    .select('id, title')
    .or('title.ilike.%sample%,title.ilike.%test%,title.ilike.%dummy%');

  if (sampleHealth && sampleHealth.length > 0) {
    console.log(chalk.gray(`  Found ${sampleHealth.length} sample health articles`));
    
    const { error } = await supabase
      .from('health_content')
      .delete()
      .in('id', sampleHealth.map((h: any) => h.id));

    if (!error) {
      totalRemoved += sampleHealth.length;
      console.log(chalk.green(`  ✓ Removed ${sampleHealth.length} sample health articles`));
    }
  }

  // Remove games with 'sample' or 'test'
  const { data: sampleGames } = await supabase
    .from('games')
    .select('id, title')
    .or('title.ilike.%sample%,title.ilike.%test%,title.ilike.%dummy%');

  if (sampleGames && sampleGames.length > 0) {
    console.log(chalk.gray(`  Found ${sampleGames.length} sample games`));
    
    const { error } = await supabase
      .from('games')
      .delete()
      .in('id', sampleGames.map((g: any) => g.id));

    if (!error) {
      totalRemoved += sampleGames.length;
      console.log(chalk.green(`  ✓ Removed ${sampleGames.length} sample games`));
    }
  }

  console.log();
  return totalRemoved;
}

// ============================================================
// INJECTION FUNCTIONS
// ============================================================

async function injectStories(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  console.log(chalk.cyan('📚 Injecting Kids Stories...\n'));

  const stories = STORIES_CONTENT.slice(0, limit);
  
  if (dryRun) {
    console.log(chalk.yellow(`  [DRY RUN] Would inject ${stories.length} stories`));
    stories.forEach((story, idx) => {
      console.log(chalk.gray(`    ${idx + 1}. ${story.title}`));
    });
    return 0;
  }

  let injected = 0;

  for (const story of stories) {
    const { error } = await supabase
      .from('stories')
      .insert({
        ...story,
        slug: story.title.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.log(chalk.red(`  ✗ Failed: ${story.title} - ${error.message}`));
    } else {
      console.log(chalk.green(`  ✓ ${story.title}`));
      injected++;
    }
  }

  console.log();
  return injected;
}

async function injectHealthContent(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  console.log(chalk.cyan('💚 Injecting Health Articles...\n'));

  const articles = HEALTH_CONTENT.slice(0, limit);
  
  if (dryRun) {
    console.log(chalk.yellow(`  [DRY RUN] Would inject ${articles.length} health articles`));
    articles.forEach((article, idx) => {
      console.log(chalk.gray(`    ${idx + 1}. ${article.title}`));
    });
    return 0;
  }

  let injected = 0;

  for (const article of articles) {
    const { error } = await supabase
      .from('health_content')
      .insert({
        ...article,
        slug: article.title.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.log(chalk.red(`  ✗ Failed: ${article.title} - ${error.message}`));
    } else {
      console.log(chalk.green(`  ✓ ${article.title}`));
      injected++;
    }
  }

  console.log();
  return injected;
}

async function injectGames(supabase: any, limit: number, dryRun: boolean): Promise<number> {
  console.log(chalk.cyan('🎮 Injecting Games...\n'));

  const games = GAMES_CONTENT.slice(0, limit);
  
  if (dryRun) {
    console.log(chalk.yellow(`  [DRY RUN] Would inject ${games.length} games`));
    games.forEach((game, idx) => {
      console.log(chalk.gray(`    ${idx + 1}. ${game.title}`));
    });
    return 0;
  }

  let injected = 0;

  for (const game of games) {
    const { error } = await supabase
      .from('games')
      .insert({
        ...game,
        slug: game.title.toLowerCase().replace(/\s+/g, '-'),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.log(chalk.red(`  ✗ Failed: ${game.title} - ${error.message}`));
    } else {
      console.log(chalk.green(`  ✓ ${game.title}`));
      injected++;
    }
  }

  console.log();
  return injected;
}

// ============================================================
// CLI
// ============================================================

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  return {
    type: (args.find(a => a.startsWith('--type='))?.split('=')[1] as any) || 'all',
    limit: parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '100'),
    cleanup: !args.includes('--no-cleanup'),
    dryRun: args.includes('--dry') || args.includes('--dry-run'),
  };
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = parseArgs();
  const supabase = getSupabaseClient();

  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║        BATCH CONTENT INJECTION - PHASE 6                     ║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════════════════════════════╝\n'));

  if (args.dryRun) {
    console.log(chalk.yellow.bold('🔍 DRY RUN MODE - No data will be written\n'));
  }

  console.log(chalk.gray(`Type: ${args.type}`));
  console.log(chalk.gray(`Limit: ${args.limit} per type`));
  console.log(chalk.gray(`Cleanup: ${args.cleanup ? 'Yes' : 'No'}\n`));

  const stats = {
    removed: 0,
    stories: 0,
    health: 0,
    games: 0,
  };

  try {
    // Cleanup sample data
    if (args.cleanup && !args.dryRun) {
      stats.removed = await cleanupSampleData(supabase);
    }

    // Inject content based on type
    if (args.type === 'all' || args.type === 'stories') {
      stats.stories = await injectStories(supabase, args.limit, args.dryRun);
    }

    if (args.type === 'all' || args.type === 'health') {
      stats.health = await injectHealthContent(supabase, args.limit, args.dryRun);
    }

    if (args.type === 'all' || args.type === 'games') {
      stats.games = await injectGames(supabase, args.limit, args.dryRun);
    }

    // Summary
    console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════════'));
    console.log(chalk.bold('📊 INJECTION SUMMARY'));
    console.log(chalk.bold.cyan('═══════════════════════════════════════════════════════════\n'));

    if (stats.removed > 0) {
      console.log(chalk.yellow(`  🧹 Sample Data Removed:  ${stats.removed}`));
    }
    console.log(chalk.green(`  📚 Stories Injected:     ${stats.stories}`));
    console.log(chalk.green(`  💚 Health Articles:      ${stats.health}`));
    console.log(chalk.green(`  🎮 Games Injected:       ${stats.games}`));
    console.log(chalk.bold(`  \n  Total Content Added:     ${stats.stories + stats.health + stats.games}`));

    console.log(chalk.green('\n✅ Content injection complete\n'));

  } catch (error: any) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

main().catch(console.error);


