#!/usr/bin/env npx tsx
/**
 * Add/update two movies with Chiranjeevi attribution:
 * 1. Kotta Alludu (1979) - Telugu - Chiranjeevi as Jagan (Supporting/Co-Lead)
 * 2. Mappillai (1989) - Tamil - Chiranjeevi as Himself (Cameo)
 *
 * Usage: npx tsx scripts/add-kotta-alludu-mappillai.ts
 *        npx tsx scripts/add-kotta-alludu-mappillai.ts --execute
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const EXECUTE = process.argv.includes('--execute');
const CHIRANJEEVI = 'Chiranjeevi';

function slugify(title: string, year: number): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .concat(`-${year}`);
}

function hasChiranjeeviInCast(supporting_cast: any): boolean {
  if (!Array.isArray(supporting_cast)) return false;
  return supporting_cast.some(
    (c: any) =>
      (typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi')) ||
      (typeof c === 'string' && c.toLowerCase().includes('chiranjeevi'))
  );
}

async function ensureKottaAlludu() {
  const slug = slugify('Kotta Alludu', 1979);
  const { data: existing } = await supabase.from('movies').select('id, title_en, hero, supporting_cast, director, producer').eq('slug', slug).single();

  if (existing) {
    const cast = Array.isArray(existing.supporting_cast) ? [...existing.supporting_cast] : [];
    if (hasChiranjeeviInCast(cast)) {
      console.log(chalk.gray('Kotta Alludu (1979): Chiranjeevi already in cast.'));
      return;
    }
    cast.push({ name: CHIRANJEEVI, type: 'supporting', role: 'Jagan' });
    if (!EXECUTE) {
      console.log(chalk.yellow('Would update Kotta Alludu (1979): add Chiranjeevi to supporting_cast (Jagan).'));
      return;
    }
    const { error } = await supabase
      .from('movies')
      .update({
        supporting_cast: cast,
        director: existing.director || 'P. Sambhasiva Rao',
        producer: existing.producer || 'M. Satyanarayana',
        hero: existing.hero || 'Krishna',
      })
      .eq('id', existing.id);
    if (error) {
      console.log(chalk.red('Kotta Alludu update error:'), error.message);
      return;
    }
    console.log(chalk.green('Kotta Alludu (1979): Added Chiranjeevi to supporting_cast (Jagan).'));
    return;
  }

  // Insert new movie
  const movieData = {
    title_en: 'Kotta Alludu',
    slug,
    release_year: 1979,
    language: 'Telugu',
    director: 'P. Sambhasiva Rao',
    producer: 'M. Satyanarayana',
    hero: 'Krishna',
    heroine: 'Jaya Prada',
    supporting_cast: [
      { name: CHIRANJEEVI, type: 'supporting', role: 'Jagan' },
      { name: 'Mohan Babu', type: 'supporting' },
    ],
    is_published: true,
  };
  if (!EXECUTE) {
    console.log(chalk.yellow('Would insert Kotta Alludu (1979) with Chiranjeevi as Jagan (supporting).'));
    return;
  }
  const { error } = await supabase.from('movies').insert(movieData);
  if (error) {
    console.log(chalk.red('Kotta Alludu insert error:'), error.message);
    return;
  }
  console.log(chalk.green('Kotta Alludu (1979): Inserted with Chiranjeevi as Jagan (supporting).'));
}

async function ensureMappillai() {
  const slug = slugify('Mappillai', 1989);
  const { data: existing } = await supabase.from('movies').select('id, title_en, hero, supporting_cast, director, producer').eq('slug', slug).single();

  if (existing) {
    const cast = Array.isArray(existing.supporting_cast) ? [...existing.supporting_cast] : [];
    if (hasChiranjeeviInCast(cast)) {
      console.log(chalk.gray('Mappillai (1989): Chiranjeevi already in cast.'));
      return;
    }
    cast.push({ name: CHIRANJEEVI, type: 'cameo', role: 'Himself' });
    if (!EXECUTE) {
      console.log(chalk.yellow('Would update Mappillai (1989): add Chiranjeevi to supporting_cast (cameo, Himself).'));
      return;
    }
    const { error } = await supabase
      .from('movies')
      .update({
        supporting_cast: cast,
        director: existing.director || 'Rajasekhar',
        producer: existing.producer || 'Allu Aravind',
        hero: existing.hero || 'Rajinikanth',
      })
      .eq('id', existing.id);
    if (error) {
      console.log(chalk.red('Mappillai update error:'), error.message);
      return;
    }
    console.log(chalk.green('Mappillai (1989): Added Chiranjeevi to supporting_cast (cameo, Himself).'));
    return;
  }

  const movieData = {
    title_en: 'Mappillai',
    slug,
    release_year: 1989,
    language: 'Tamil',
    director: 'Rajasekhar',
    producer: 'Allu Aravind',
    hero: 'Rajinikanth',
    heroine: 'Amala',
    supporting_cast: [
      { name: CHIRANJEEVI, type: 'cameo', role: 'Himself' },
      { name: 'Srividya', type: 'supporting' },
    ],
    is_published: true,
  };
  if (!EXECUTE) {
    console.log(chalk.yellow('Would insert Mappillai (1989) with Chiranjeevi as Himself (cameo).'));
    return;
  }
  const { error } = await supabase.from('movies').insert(movieData);
  if (error) {
    console.log(chalk.red('Mappillai insert error:'), error.message);
    return;
  }
  console.log(chalk.green('Mappillai (1989): Inserted with Chiranjeevi as Himself (cameo).'));
}

async function main() {
  console.log(chalk.cyan('Add Kotta Alludu (1979) & Mappillai (1989) with Chiranjeevi'));
  console.log(EXECUTE ? chalk.yellow('Mode: EXECUTE\n') : chalk.gray('Mode: dry-run (use --execute to apply)\n'));

  await ensureKottaAlludu();
  await ensureMappillai();

  if (!EXECUTE) console.log(chalk.cyan('\nRun with --execute to apply.'));
}

main().catch(console.error);
