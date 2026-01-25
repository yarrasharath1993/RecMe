#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const slugs = [
    'police-officer-2019',
    'premier-padmini-2019',
    'raambo-2-2018',
    'bangara-s-o-bangarada-manushya-2017',
    '-2016',
    'far-from-the-tree-2021',
    'mumbai-saga-2021',
    'madhagaja-2021',
    'annabelle-sethupathi-2021'
  ];

  console.log(chalk.cyan('Checking movies with TMDB IDs but missing data:\n'));

  for (const slug of slugs) {
    const { data } = await supabase
      .from('movies')
      .select('slug, title_en, tmdb_id, director, hero, heroine, runtime, poster_url')
      .eq('slug', slug)
      .single();

    if (data) {
      console.log(chalk.white(`${data.title_en || slug}:`));
      console.log(`  TMDB: ${data.tmdb_id ? chalk.green(data.tmdb_id) : chalk.red('NONE')}`);
      console.log(`  Director: ${data.director ? chalk.green(data.director) : chalk.red('MISSING')}`);
      console.log(`  Hero: ${data.hero ? chalk.green(data.hero) : chalk.red('MISSING')}`);
      console.log(`  Heroine: ${data.heroine ? chalk.green(data.heroine) : chalk.yellow('MISSING')}`);
      console.log(`  Runtime: ${data.runtime ? chalk.green(data.runtime + 'min') : chalk.yellow('MISSING')}`);
      console.log(`  Poster: ${data.poster_url ? chalk.green('✓') : chalk.red('MISSING')}\n`);
    } else {
      console.log(chalk.red(`${slug}: NOT FOUND\n`));
    }
  }
}

check().catch(console.error);
