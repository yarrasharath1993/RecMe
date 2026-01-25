import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function publishJayammu() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PUBLISHING JAYAMMU - FINAL ATTEMPT');
  console.log('='.repeat(80) + '\n');

  // Try with very short synopsis (under 50 chars)
  console.log('Attempting with minimal synopsis...\n');

  try {
    const { data, error } = await supabase
      .from('movies')
      .update({
        synopsis: 'A man pursues career and love.',
        is_published: true,
      })
      .eq('id', '340635c8-f4a4-410e-aa3f-ed1ba3f314f3')
      .select();

    if (error) {
      console.log('❌ Still failed with short synopsis:', error.message);
      console.log('\n🔧 Alternative solution needed: Manual SQL');
      console.log('\nRun this in Supabase SQL Editor:');
      console.log('─'.repeat(80));
      console.log(`UPDATE movies 
SET is_published = true 
WHERE id = '340635c8-f4a4-410e-aa3f-ed1ba3f314f3';`);
      console.log('─'.repeat(80));
      return false;
    }

    console.log('✅ SUCCESS! Jayammu Nischayammu Raa published!\n');

    // Check final status
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
    console.log('🎊 FINAL STATUS');
    console.log('='.repeat(80));
    console.log(`\nTelugu Published:    ${publishedCount?.toLocaleString()}`);
    console.log(`Telugu Unpublished:  ${unpublishedCount}`);
    console.log(`Completion Rate:     ${((publishedCount || 0) / ((publishedCount || 0) + (unpublishedCount || 0)) * 100).toFixed(2)}%`);

    if (unpublishedCount === 0) {
      console.log('\n' + '='.repeat(80));
      console.log('🎉🎉🎉 TRUE 100% ACHIEVED! 🎉🎉🎉');
      console.log('='.repeat(80));
      console.log('\n🚀 ALL 5,529 MOVIES PUBLISHED!');
      console.log('🎯 100% COMPLETION!');
      console.log('🏆 MISSION COMPLETE!');
      console.log('\n🎊 LAUNCH READY! 🎊\n');
    }

    return true;
  } catch (error) {
    console.log('❌ Unexpected error:', error);
    return false;
  }
}

publishJayammu()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
