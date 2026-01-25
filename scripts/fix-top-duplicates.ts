/**
 * Fix the most impactful duplicate profiles
 * Focus on high-count duplicates first
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FixRule {
  role: string;
  field: string;
  wrongSpelling: string;
  correctSpelling: string;
  description: string;
}

// Define fix rules for clear-cut cases
const fixRules: FixRule[] = [
  // Heroes
  {
    role: 'Hero',
    field: 'hero',
    wrongSpelling: 'N.T. Rama Rao',
    correctSpelling: 'N. T. Rama Rao',
    description: 'NTR - 2 movies with wrong spacing',
  },
  {
    role: 'Hero',
    field: 'hero',
    wrongSpelling: 'N.T. Rama Rao Jr.',
    correctSpelling: 'N. T. Rama Rao Jr.',
    description: 'NTR Jr - 1 movie with wrong spacing',
  },
  {
    role: 'Hero',
    field: 'hero',
    wrongSpelling: 'Sairam Shankar',
    correctSpelling: 'Sai Ram Shankar',
    description: 'Sai Ram Shankar - spacing issue',
  },
  {
    role: 'Hero',
    field: 'hero',
    wrongSpelling: 'Ramakrishna',
    correctSpelling: 'Rama Krishna',
    description: 'Rama Krishna - spacing issue',
  },
  
  // Heroines
  {
    role: 'Heroine',
    field: 'heroine',
    wrongSpelling: 'Jayaprada',
    correctSpelling: 'Jaya Prada',
    description: 'Jaya Prada - 2 movies with wrong spacing',
  },
  {
    role: 'Heroine',
    field: 'heroine',
    wrongSpelling: 'Divya Vani',
    correctSpelling: 'Divyavani',
    description: 'Divyavani - spacing issue',
  },
  {
    role: 'Heroine',
    field: 'heroine',
    wrongSpelling: 'K R Vijaya',
    correctSpelling: 'K.R. Vijaya',
    description: 'K.R. Vijaya - dots missing',
  },
  
  // Directors - Major ones
  {
    role: 'Director',
    field: 'director',
    wrongSpelling: 'K.Raghavendra Rao',
    correctSpelling: 'K. Raghavendra Rao',
    description: 'K. Raghavendra Rao - 5 movies with wrong spacing',
  },
  {
    role: 'Director',
    field: 'director',
    wrongSpelling: 'Vamsy',
    correctSpelling: 'Vamsi',
    description: 'Vamsi - 3 movies with y instead of i',
  },
  {
    role: 'Director',
    field: 'director',
    wrongSpelling: 'V.V. Vinayak',
    correctSpelling: 'V. V. Vinayak',
    description: 'V. V. Vinayak - spacing issue',
  },
  {
    role: 'Director',
    field: 'director',
    wrongSpelling: 'Puri Jagannath',
    correctSpelling: 'Puri Jagannadh',
    description: 'Puri Jagannadh - spelling issue with dh',
  },
  {
    role: 'Director',
    field: 'director',
    wrongSpelling: 'B.V. Nandini Reddy',
    correctSpelling: 'B. V. Nandini Reddy',
    description: 'B. V. Nandini Reddy - spacing issue',
  },
];

async function fixDuplicate(rule: FixRule): Promise<boolean> {
  console.log(`\n🔧 Fixing: ${rule.description}`);
  console.log(`   "${rule.wrongSpelling}" → "${rule.correctSpelling}"`);

  // Count movies with wrong spelling
  const { count: beforeCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq(rule.field, rule.wrongSpelling);

  if (!beforeCount || beforeCount === 0) {
    console.log('   ✅ Already fixed or no movies found');
    return true;
  }

  console.log(`   Found ${beforeCount} movies with wrong spelling`);

  // Update movies
  const { error } = await supabase
    .from('movies')
    .update({ [rule.field]: rule.correctSpelling })
    .eq(rule.field, rule.wrongSpelling);

  if (error) {
    console.error('   ❌ Error:', error.message);
    return false;
  }

  // Verify fix
  const { count: afterCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq(rule.field, rule.wrongSpelling);

  console.log(`   ✅ Fixed! (${beforeCount} movies updated, ${afterCount || 0} remaining)`);
  return true;
}

async function fixAllDuplicates() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIXING TOP DUPLICATE PROFILES');
  console.log('='.repeat(80));

  let successCount = 0;
  let failCount = 0;

  for (const rule of fixRules) {
    const success = await fixDuplicate(rule);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal rules: ${fixRules.length}`);
  console.log(`✅ Successfully fixed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Run the audit again to check remaining duplicates');
  console.log('   2. Review complex cases manually');
  console.log('   3. Consider adding celebrity records for standardization');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Batch fix complete!\n');
}

fixAllDuplicates().catch(console.error);
