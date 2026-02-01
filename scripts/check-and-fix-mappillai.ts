#!/usr/bin/env npx tsx
/**
 * Check Mappillai (1989) in DB and add/fix Chiranjeevi cameo.
 * Run: npx tsx scripts/check-and-fix-mappillai.ts --execute
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

async function main() {
  // Find all movies with Mappillai in title or slug
  const { data: byTitle } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, language, is_published, hero, supporting_cast, director, producer')
    .ilike('title_en', '%mappillai%');

  const { data: bySlug } = await supabase
    .from('movies')
    .select('id, title_en, slug, release_year, language, is_published, hero, supporting_cast, director, producer')
    .ilike('slug', '%mappillai%');

  const all = [...(byTitle || []), ...(bySlug || [])];
  const unique = Array.from(new Map(all.map(m => [m.id, m])).values());

  console.log(chalk.cyan('Movies matching Mappillai:'), unique.length);
  unique.forEach(m => {
    console.log(chalk.gray('  '), m.slug, m.release_year, m.language, 'published:', m.is_published);
    console.log(chalk.gray('    hero:'), m.hero, 'supporting_cast:', JSON.stringify(m.supporting_cast));
  });

  // Target: Tamil 1989 Mappillai (Rajinikanth, Chiranjeevi cameo)
  const target = unique.find(m => m.release_year === 1989 && (m.language === 'Tamil' || m.slug === 'mappillai-1989'));
  if (!target) {
    console.log(chalk.yellow('\nNo Mappillai (1989) Tamil found. Inserting.'));
    const slug = 'mappillai-1989';
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
        { name: 'Chiranjeevi', type: 'cameo', role: 'Himself' },
        { name: 'Srividya', type: 'supporting' },
      ],
      is_published: true,
    };
    if (EXECUTE) {
      const { error } = await supabase.from('movies').insert(movieData);
      if (error) {
        console.log(chalk.red('Insert error:'), error.message);
        return;
      }
      console.log(chalk.green('Inserted Mappillai (1989) with Chiranjeevi cameo.'));
    } else {
      console.log(chalk.cyan('Dry-run: would insert'), movieData);
    }
    return;
  }

  const cast = Array.isArray(target.supporting_cast) ? [...target.supporting_cast] : [];
  const hasChiru = cast.some((c: any) =>
    (typeof c === 'object' && c?.name && String(c.name).toLowerCase().includes('chiranjeevi')) ||
    (typeof c === 'string' && c.toLowerCase().includes('chiranjeevi'))
  );

  if (!hasChiru) {
    console.log(chalk.yellow('\nAdding Chiranjeevi to supporting_cast (cameo).'));
    cast.push({ name: 'Chiranjeevi', type: 'cameo', role: 'Himself' });
    if (EXECUTE) {
      const { error } = await supabase
        .from('movies')
        .update({
          supporting_cast: cast,
          director: target.director || 'Rajasekhar',
          producer: target.producer || 'Allu Aravind',
          hero: target.hero || 'Rajinikanth',
          is_published: true,
        })
        .eq('id', target.id);
      if (error) {
        console.log(chalk.red('Update error:'), error.message);
        return;
      }
      console.log(chalk.green('Updated Mappillai (1989): Chiranjeevi added as cameo.'));
    }
    return;
  }

  if (!target.is_published) {
    console.log(chalk.yellow('\nMovie exists but is_published = false. Publishing.'));
    if (EXECUTE) {
      await supabase.from('movies').update({ is_published: true }).eq('id', target.id);
      console.log(chalk.green('Set is_published = true.'));
    }
    return;
  }

  console.log(chalk.green('\nMappillai (1989) already has Chiranjeevi in cast and is published.'));
}

main().catch(console.error);
