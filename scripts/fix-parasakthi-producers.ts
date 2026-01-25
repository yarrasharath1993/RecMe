#!/usr/bin/env npx tsx
/**
 * Fix producer information for Parasakthi movies
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

interface ProducerFix {
  slug: string;
  title: string;
  year: number;
  correctYear?: number;
  producer: string;
  note?: string;
}

const fixes: ProducerFix[] = [
  {
    slug: 'parasakthi-1957',
    title: 'Parasakthi',
    year: 1957,
    correctYear: 1952,
    producer: 'P. A. Perumal Mudaliar (National Pictures) & A. V. Meiyappan (AVM Productions)',
    note: 'Correct year is 1952, not 1957',
  },
  {
    slug: 'adi-parasakthi-1971',
    title: 'Adi Parasakthi',
    year: 1971,
    producer: 'K. S. Gopalakrishnan (Chitra Productions)',
  },
  {
    slug: 'parasakthi-2026',
    title: 'Parasakthi',
    year: 2026,
    producer: 'Aakash Baskaran (Dawn Pictures)',
    note: 'Released January 10, 2026 for Pongal festival',
  },
];

async function applyFixes() {
  console.log(chalk.bold('\n🔧 FIXING PARASAKTHI PRODUCER INFORMATION\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  let applied = 0;
  let errors = 0;
  let notFound = 0;

  for (const fix of fixes) {
    try {
      // Try to find by slug first
      let { data: movie, error: fetchError } = await supabase
        .from('movies')
        .select('id, slug, title_en, release_year, producer')
        .eq('slug', fix.slug)
        .single();

      // If not found by slug, try by title and year
      if (fetchError || !movie) {
        const { data: movieByTitle, error: errorByTitle } = await supabase
          .from('movies')
          .select('id, slug, title_en, release_year, producer')
          .eq('title_en', fix.title)
          .eq('release_year', fix.year)
          .single();

        if (errorByTitle || !movieByTitle) {
          console.log(chalk.red(`❌ Not found: ${fix.title} (${fix.year})`));
          notFound++;
          continue;
        }
        movie = movieByTitle;
      }

      const updates: any = {
        producer: fix.producer,
      };

      // Update year if it's incorrect
      if (fix.correctYear && movie.release_year !== fix.correctYear) {
        updates.release_year = fix.correctYear;
        // Also update slug to match the correct year
        const newSlug = fix.slug.replace(`-${fix.year}`, `-${fix.correctYear}`);
        updates.slug = newSlug;
        console.log(chalk.yellow(`\n${fix.title}`));
        console.log(`  Year: ${movie.release_year} → ${fix.correctYear}`);
        console.log(`  Slug: ${movie.slug} → ${newSlug}`);
        console.log(`  Producer: ${movie.producer || 'MISSING'} → ${fix.producer}`);
      } else {
        console.log(chalk.yellow(`\n${fix.title} (${movie.release_year})`));
        console.log(`  Producer: ${movie.producer || 'MISSING'} → ${fix.producer}`);
      }

      if (fix.note) {
        console.log(chalk.gray(`  Note: ${fix.note}`));
      }

      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
        errors++;
      } else {
        console.log(chalk.green(`  ✅ Updated`));
        applied++;
      }
    } catch (e: any) {
      console.log(chalk.red(`❌ Unexpected error for ${fix.title}: ${e.message}`));
      errors++;
    }
  }

  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Applied: ${chalk.green(applied)}`);
  console.log(`  Not found: ${chalk.yellow(notFound)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log();
}

applyFixes().catch(console.error);
