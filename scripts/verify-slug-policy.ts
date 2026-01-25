/**
 * Verify and Fix Slug Policy for Unreleased Movies
 * 
 * Ensures unreleased movies use -tba suffix and released movies have proper year-based slugs.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import slugifyLib from 'slugify';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
  if (!text) return '';
  return slugifyLib(text, {
    lower: true,
    strict: true,
    trim: true,
    locale: 'en',
  });
}

interface SlugUpdate {
  title: string;
  year: number | null;
  currentSlug: string;
  expectedSlug: string;
  reason: string;
}

const unreleasedMovies = [
  { title: 'Devara: Part 2', year: 2026, expectedSlug: 'devara-2-tba' },
  { title: 'Vāranāsi', year: 2026, expectedSlug: 'varanasi-tba' },
  { title: 'G.D.N (Biopic of G.D. Naidu)', year: 2025, expectedSlug: 'gdn-biopic-of-gd-naidu-tba' },
  { title: 'AA22xA6', year: 2026, expectedSlug: 'aa22xa6-tba' },
  { title: 'Goodachari 2', year: 2026, expectedSlug: 'goodachari-2-tba' },
  { title: 'Spirit', year: 2026, expectedSlug: 'spirit-tba' },
  { title: 'Salaar: Part 2 - Shouryaanga Parvam', year: 2026, expectedSlug: 'salaar-2-tba' },
  { title: 'Pushpa 3 - The Rampage', year: 2026, expectedSlug: 'pushpa-3-the-rampage-tba' },
  { title: 'Band Melam', year: 2026, expectedSlug: 'band-melam-tba' },
];

// Released movies that should have year-based slugs
const releasedMovies = [
  { title: 'Guard: Revenge for Love', year: 2024, expectedSlug: 'guard-revenge-for-love-2024' },
  { title: 'The Raja Saab', year: 2026, expectedSlug: 'the-raja-saab-2026', needsRating: true },
];

async function verifyAndFixSlugs() {
  console.log('🔍 Verifying slug policy compliance...\n');

  const updates: SlugUpdate[] = [];
  let fixed = 0;
  let errors = 0;

  // Check unreleased movies
  console.log('📋 Checking unreleased movies (should have -tba suffix)...\n');
  for (const movie of unreleasedMovies) {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, slug')
      .eq('title_en', movie.title)
      .eq('release_year', movie.year)
      .limit(1);

    if (error) {
      console.error(`   ❌ Error finding ${movie.title}: ${error.message}`);
      errors++;
      continue;
    }

    if (!movies || movies.length === 0) {
      console.error(`   ⚠️  Not found: ${movie.title} (${movie.year})`);
      continue;
    }

    const dbMovie = movies[0];
    if (dbMovie.slug !== movie.expectedSlug) {
      console.log(`   🔧 Fixing: ${movie.title}`);
      console.log(`      Current: ${dbMovie.slug}`);
      console.log(`      Expected: ${movie.expectedSlug}`);

      const { error: updateError } = await supabase
        .from('movies')
        .update({ slug: movie.expectedSlug })
        .eq('id', dbMovie.id);

      if (updateError) {
        console.error(`      ❌ Error: ${updateError.message}`);
        errors++;
      } else {
        console.log(`      ✅ Updated`);
        fixed++;
      }
    } else {
      console.log(`   ✅ Correct: ${movie.title} (${dbMovie.slug})`);
    }
  }

  // Check released movies
  console.log('\n📋 Checking released movies (should have year-based slugs)...\n');
  for (const movie of releasedMovies) {
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title_en, release_year, slug, our_rating, avg_rating')
      .eq('title_en', movie.title)
      .eq('release_year', movie.year)
      .limit(1);

    if (error) {
      console.error(`   ❌ Error finding ${movie.title}: ${error.message}`);
      errors++;
      continue;
    }

    if (!movies || movies.length === 0) {
      console.error(`   ⚠️  Not found: ${movie.title} (${movie.year})`);
      continue;
    }

    const dbMovie = movies[0];
    
    // Check slug
    if (dbMovie.slug !== movie.expectedSlug) {
      console.log(`   🔧 Fixing slug: ${movie.title}`);
      console.log(`      Current: ${dbMovie.slug}`);
      console.log(`      Expected: ${movie.expectedSlug}`);

      const { error: updateError } = await supabase
        .from('movies')
        .update({ slug: movie.expectedSlug })
        .eq('id', dbMovie.id);

      if (updateError) {
        console.error(`      ❌ Error: ${updateError.message}`);
        errors++;
      } else {
        console.log(`      ✅ Updated`);
        fixed++;
      }
    } else {
      console.log(`   ✅ Slug correct: ${movie.title} (${dbMovie.slug})`);
    }

    // Check if rating is needed
    if (movie.needsRating && !dbMovie.our_rating && !dbMovie.avg_rating) {
      console.log(`   ⚠️  Missing rating: ${movie.title} (released Jan 9, 2026)`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n✨ Done!`);
}

// Run verification
verifyAndFixSlugs()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
