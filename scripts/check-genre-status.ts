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
  console.log(chalk.cyan('Checking genre status...\n'));

  // Total movies
  const { count: total } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });

  // Movies with genres
  const { count: withGenres } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('genres', 'is', null)
    .not('genres', 'eq', '{}')
    .gt('genres', '[]');

  // Movies without genres
  const { count: withoutGenres } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('genres.is.null,genres.eq.{},genres.eq.[]');

  console.log(chalk.white(`Total movies:         ${chalk.cyan(total)}`));
  console.log(chalk.green(`✓ With genres:        ${chalk.cyan(withGenres)} (${Math.round((withGenres/total)*100)}%)`));
  console.log(chalk.red(`✗ Without genres:     ${chalk.cyan(withoutGenres)} (${Math.round((withoutGenres/total)*100)}%)`));

  // Check award entries
  const { count: awards } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .or('title_en.ilike.%award%,title_en.ilike.%villain%,title_en.ilike.%jury%');

  console.log(chalk.yellow(`\n⚠ Potential awards:   ${chalk.cyan(awards)}`));
}

check();
