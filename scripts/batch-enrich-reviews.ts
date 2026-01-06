#!/usr/bin/env npx tsx
/**
 * Batch enrich existing reviews with multi-source data
 * SAFE: Never overwrites existing AI content
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateOrEnrichEditorialReview } from '../lib/reviews/editorial-review-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10');
  const dryRun = args.includes('--dry-run');

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          BATCH ENRICH REVIEWS (SAFE - NO OVERWRITES)         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Get movies with existing reviews that have IMDB IDs (for OMDb data)
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, imdb_id')
    .eq('is_published', true)
    .not('imdb_id', 'is', null)
    .order('avg_rating', { ascending: false })
    .limit(limit);

  console.log(`Found ${movies?.length || 0} movies with IMDB IDs\n`);

  let generated = 0, enriched = 0, skipped = 0;

  for (const movie of movies || []) {
    console.log(`\n📽️ ${movie.title_en} (IMDB: ${movie.imdb_id})`);
    
    if (dryRun) {
      console.log('   [DRY RUN] Would process...');
      continue;
    }

    try {
      const result = await generateOrEnrichEditorialReview(movie.id);
      
      if (result.action === 'generated') {
        generated++;
        console.log(`   ✅ Generated new review`);
      } else if (result.action === 'enriched') {
        enriched++;
        console.log(`   ✨ Enriched with: ${result.sectionsAdded?.join(', ')}`);
      } else {
        skipped++;
        console.log(`   ⏭️ Skipped (no new data)`);
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Generated: ${generated}`);
  console.log(`  Enriched:  ${enriched}`);
  console.log(`  Skipped:   ${skipped}`);
  console.log('');
}

main().catch(console.error);
