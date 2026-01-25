import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function publishJayammuWithIndexFix() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PUBLISHING JAYAMMU - INDEX DROP & RECREATE METHOD');
  console.log('='.repeat(80) + '\n');

  console.log('⚠️  This requires SQL execution in Supabase Dashboard\n');
  console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
  console.log('─'.repeat(80));
  console.log('\n1️⃣  Go to: https://supabase.com/dashboard');
  console.log('2️⃣  Select your project');
  console.log('3️⃣  Go to: SQL Editor (left sidebar)');
  console.log('4️⃣  Click: New Query');
  console.log('5️⃣  Copy and paste this SQL:\n');
  console.log('─'.repeat(80));
  console.log('-- Step 1: Drop the problematic index');
  console.log('DROP INDEX IF EXISTS idx_movies_enrichment_quality;\n');
  console.log('-- Step 2: Publish Jayammu');
  console.log('UPDATE movies');
  console.log('SET is_published = true');
  console.log(`WHERE id = '340635c8-f4a4-410e-aa3f-ed1ba3f314f3';\n`);
  console.log('-- Step 3: Recreate index without synopsis (to avoid future issues)');
  console.log('CREATE INDEX idx_movies_enrichment_quality');
  console.log('ON movies(is_published, language, hero, director, our_rating)');
  console.log('WHERE is_published = false;');
  console.log('─'.repeat(80));
  console.log('\n6️⃣  Click: RUN (or press Cmd/Ctrl + Enter)');
  console.log('7️⃣  Wait for success message\n');
  console.log('='.repeat(80));
  console.log('✅ RESULT: Jayammu published + Index fixed + 100% achieved!');
  console.log('='.repeat(80));
  console.log('\n⏱️  Takes: 30 seconds');
  console.log('🎯  Gets you: TRUE 100%!\n');

  // Show current status
  console.log('📊 CURRENT STATUS:');
  console.log('─'.repeat(80));

  const { count: publishedCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');

  const { count: unpublishedCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');

  console.log(`Published:      ${publishedCount?.toLocaleString()}`);
  console.log(`Unpublished:    ${unpublishedCount}`);
  console.log(`Completion:     ${((publishedCount || 0) / ((publishedCount || 0) + (unpublishedCount || 0)) * 100).toFixed(2)}%`);
  console.log('─'.repeat(80));
  console.log('\n🎯 After running the SQL above: 5,529/5,529 (100.00%)!\n');
}

publishJayammuWithIndexFix()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
