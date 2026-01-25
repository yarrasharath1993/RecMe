/**
 * Apply Synopsis Fixes
 * 
 * Updates synopses for movies that were flagged as missing or too short.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SynopsisFix {
  title: string;
  year: number;
  synopsis: string;
}

const synopsisFixes: SynopsisFix[] = [
  {
    title: 'Sahaa',
    year: 2024,
    synopsis: 'A young man named Sanju embarks on an emotional journey that captures the raw emotions of his life, from his innocent beginnings to a battle of love. The story explores dreams, struggles, and resilience in a heartfelt reflection of love.',
  },
  {
    title: 'Monster',
    year: 2022,
    synopsis: 'A taxi driver named Bhamini picks up an unusual customer, Lucky Singh, who takes an intrusive interest in her life and family. This encounter sparks a series of thrilling and mysterious events that unravel the true identity and intentions of the strange passenger.',
  },
  {
    title: 'Maha',
    year: 2022,
    synopsis: 'A single mother, Maha, must race against time to rescue her daughter who has been abducted by a ruthless serial killer targeting children. As Maha takes the investigation into her own hands, unexplored chapters of her past are unveiled, leading to shocking revelations.',
  },
];

async function applySynopsisFixes() {
  console.log('🔧 Applying synopsis fixes...\n');

  let fixed = 0;
  let errors = 0;

  for (const fix of synopsisFixes) {
    console.log(`📝 Processing: ${fix.title} (${fix.year})...`);

    // Find the movie
    const { data: movies, error: findError } = await supabase
      .from('movies')
      .select('id, title_en, release_year, synopsis')
      .eq('title_en', fix.title)
      .eq('release_year', fix.year)
      .limit(1);

    if (findError) {
      console.error(`   ❌ Error finding movie: ${findError.message}`);
      errors++;
      continue;
    }

    if (!movies || movies.length === 0) {
      console.error(`   ⚠️  Movie not found: ${fix.title} (${fix.year})`);
      errors++;
      continue;
    }

    const movie = movies[0];
    const oldSynopsis = movie.synopsis || '(empty)';
    const oldLength = oldSynopsis.length;

    // Update synopsis
    const { error: updateError } = await supabase
      .from('movies')
      .update({ synopsis: fix.synopsis })
      .eq('id', movie.id);

    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
      errors++;
      continue;
    }

    console.log(`   ✅ Updated synopsis (${oldLength} → ${fix.synopsis.length} chars)`);
    fixed++;
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixed}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`\n✨ Done!`);
}

// Run fixes
applySynopsisFixes()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
