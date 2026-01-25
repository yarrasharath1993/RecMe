import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function publishJayammuMinimal() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PUBLISHING JAYAMMU - MINIMAL UPDATE (is_published ONLY)');
  console.log('='.repeat(80) + '\n');

  console.log('Updating ONLY is_published field (no synopsis change)...\n');

  try {
    // Update ONLY is_published, don't touch anything else
    const { data, error } = await supabase
      .from('movies')
      .update({ is_published: true })
      .eq('id', '340635c8-f4a4-410e-aa3f-ed1ba3f314f3')
      .select();

    if (error) {
      console.log('❌ Failed:', error.message);
      console.log('\n📋 MANUAL SQL REQUIRED:');
      console.log('─'.repeat(80));
      console.log('The index "idx_movies_enrichment_quality" is blocking programmatic updates.');
      console.log('\n✅ SOLUTION: Run this in Supabase SQL Editor:\n');
      console.log('UPDATE movies');
      console.log('SET is_published = true');
      console.log(`WHERE id = '340635c8-f4a4-410e-aa3f-ed1ba3f314f3';\n`);
      console.log('─'.repeat(80));
      console.log('\nThis bypasses the client library and updates directly.');
      console.log('Takes 30 seconds → Gets you to 100%! 🎯\n');
      return false;
    }

    console.log('✅ SUCCESS! Jayammu Nischayammu Raa published!\n');

    // Final status check
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

    console.log('='.repeat(80));
    console.log('🎊 FINAL DATABASE STATUS');
    console.log('='.repeat(80));
    console.log(`\nTelugu Published:    ${publishedCount?.toLocaleString()}`);
    console.log(`Telugu Unpublished:  ${unpublishedCount}`);
    console.log(`Completion Rate:     ${((publishedCount || 0) / ((publishedCount || 0) + (unpublishedCount || 0)) * 100).toFixed(2)}%`);

    if (unpublishedCount === 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🎉🎉🎉 TRUE 100% ACHIEVED! 🎉🎉🎉');
      console.log('='.repeat(80));
      console.log('\n🚀 ALL 5,529 TELUGU MOVIES PUBLISHED!');
      console.log('🎯 100.00% COMPLETION!');
      console.log('🏆 MISSION COMPLETE!');
      console.log('\n🎊 DATABASE PERFECTED! 🎊');
      console.log('🎊 READY TO LAUNCH! 🎊\n');
      console.log('='.repeat(80));
    }

    return true;
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return false;
  }
}

publishJayammuMinimal()
  .then((success) => {
    if (!success) {
      console.log('\n💡 NEXT STEP: Copy the SQL above and run in Supabase Dashboard');
      console.log('   URL: https://supabase.com/dashboard → SQL Editor\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
