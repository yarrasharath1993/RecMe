#!/usr/bin/env npx tsx
/**
 * Add Celebrity Slug Aliases
 * 
 * Creates a slug_aliases column to support multiple URLs for the same celebrity
 * This ensures old URLs continue to work after slug changes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const DRY_RUN = process.argv.includes('--dry-run');

interface SlugAlias {
  celebrity_id: string;
  celebrity_name: string;
  primary_slug: string;
  aliases: string[];
}

const ALIASES: SlugAlias[] = [
  {
    celebrity_id: '7ea66985-c6f8-4f52-a51b-1dc9fd3f184d',
    celebrity_name: 'Akkineni Nagarjuna',
    primary_slug: 'nagarjuna',
    aliases: ['akkineni-nagarjuna', 'nagarjuna-akkineni'],
  },
  // Add more as needed
];

async function addSlugAliases() {
  console.log('🔗 Adding Celebrity Slug Aliases\n');
  console.log('='.repeat(80));
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✅ LIVE'}\n`);

  // Check if slug_aliases column exists
  const { data: sample, error: sampleError } = await supabase
    .from('celebrities')
    .select('slug_aliases')
    .limit(1);

  if (sampleError) {
    console.log('⚠️  slug_aliases column does NOT exist\n');
    console.log('SQL to add it:');
    console.log('```sql');
    console.log('ALTER TABLE celebrities ADD COLUMN IF NOT EXISTS slug_aliases TEXT[];');
    console.log('CREATE INDEX IF NOT EXISTS idx_celebrities_slug_aliases');
    console.log('ON celebrities USING GIN (slug_aliases);');
    console.log('```\n');
    
    if (!DRY_RUN) {
      console.log('❌ Cannot proceed. Add column first.\n');
      return;
    }
  } else {
    console.log('✅ slug_aliases column exists\n');
  }

  // Add aliases
  console.log('📝 Adding aliases:\n');

  for (const alias of ALIASES) {
    console.log(`\n${alias.celebrity_name}:`);
    console.log(`  Primary: ${alias.primary_slug}`);
    console.log(`  Aliases: ${alias.aliases.join(', ')}`);

    if (!DRY_RUN) {
      const { error } = await supabase
        .from('celebrities')
        .update({ slug_aliases: alias.aliases })
        .eq('id', alias.celebrity_id);

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
      } else {
        console.log(`  ✅ Updated`);
      }
    } else {
      console.log(`  [DRY RUN] Would update`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📝 How This Works:\n');
  console.log('1. Primary slug: "nagarjuna"');
  console.log('   URL: http://localhost:3000/movies?profile=nagarjuna ✅\n');
  console.log('2. Alias: "akkineni-nagarjuna"');
  console.log('   URL: http://localhost:3000/movies?profile=akkineni-nagarjuna ✅');
  console.log('   → API checks slug_aliases, finds match, loads profile\n');
  console.log('3. All aliases point to same profile');
  console.log('   → No duplicates, just multiple URLs\n');

  console.log('📝 API Update Needed:\n');
  console.log('In /app/api/profile/[slug]/route.ts, add:');
  console.log('```typescript');
  console.log('// Try slug_aliases if exact match not found');
  console.log('if (!celebrity) {');
  console.log('  const { data: aliasMatch } = await supabase');
  console.log('    .from("celebrities")');
  console.log('    .select("*")');
  console.log('    .contains("slug_aliases", [slug])');
  console.log('    .single();');
  console.log('  if (aliasMatch) celebrity = aliasMatch;');
  console.log('}');
  console.log('```\n');
}

addSlugAliases().catch(console.error);
