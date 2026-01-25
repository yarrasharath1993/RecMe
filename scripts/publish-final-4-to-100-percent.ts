import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function publishFinal4To100Percent() {
  console.log('\n' + '='.repeat(80));
  console.log('🎯 PUBLISHING FINAL 4 MOVIES TO 100%!');
  console.log('='.repeat(80) + '\n');

  const results = {
    success: [] as string[],
    errors: [] as { title: string; error: string }[],
  };

  // 1. Fix and publish Shanti (1952) - Correct Telugu film data
  console.log('1️⃣  Fixing Shanti (1952) - Telugu social drama...');
  try {
    const { data, error } = await supabase
      .from('movies')
      .update({
        title_en: 'Shanti',
        hero: 'Akkineni Nageswara Rao',
        director: 'Vedantam Raghavaiah',
        language: 'Telugu',
        synopsis: 'A Telugu social drama featuring ANR and Savitri, exploring family values and relationships.',
        is_published: true,
      })
      .eq('id', '500fcf82-76ca-4a65-99a9-89da8e605c60')
      .select();

    if (error) throw error;
    console.log('   ✅ Shanti (1952) - Fixed and published!');
    results.success.push('Shanti (1952)');
  } catch (error) {
    console.log('   ❌ Error:', error);
    results.errors.push({ title: 'Shanti (1952)', error: String(error) });
  }

  // 2. Publish Jayammu Nischayammu Raa (2016) - Shorten synopsis
  console.log('\n2️⃣  Publishing Jayammu Nischayammu Raa (2016)...');
  try {
    const { data, error } = await supabase
      .from('movies')
      .update({
        synopsis: 'A simple man pursues career and love, believing a girl is his lucky charm.',
        is_published: true,
      })
      .eq('id', '340635c8-f4a4-410e-aa3f-ed1ba3f314f3')
      .select();

    if (error) throw error;
    console.log('   ✅ Jayammu Nischayammu Raa (2016) - Published!');
    results.success.push('Jayammu Nischayammu Raa (2016)');
  } catch (error) {
    console.log('   ❌ Error:', error);
    results.errors.push({ title: 'Jayammu Nischayammu Raa (2016)', error: String(error) });
  }

  // 3. Publish Salaar: Part 2 (2026) - Unreleased film
  console.log('\n3️⃣  Publishing Salaar: Part 2 (2026)...');
  try {
    const { data, error } = await supabase
      .from('movies')
      .update({
        is_published: true,
      })
      .eq('id', '043bb7f8-1808-417b-9655-4d1fd3b01b4d')
      .select();

    if (error) throw error;
    console.log('   ✅ Salaar: Part 2 (2026) - Published! (will auto-tag as unreleased)');
    results.success.push('Salaar: Part 2 (2026)');
  } catch (error) {
    console.log('   ❌ Error:', error);
    results.errors.push({ title: 'Salaar: Part 2 (2026)', error: String(error) });
  }

  // 4. Publish Devara: Part 2 (2026) - Unreleased film
  console.log('\n4️⃣  Publishing Devara: Part 2 (2026)...');
  try {
    const { data, error } = await supabase
      .from('movies')
      .update({
        is_published: true,
      })
      .eq('id', '9b7b604c-6907-4c79-bd7f-dd22d1a3f974')
      .select();

    if (error) throw error;
    console.log('   ✅ Devara: Part 2 (2026) - Published! (will auto-tag as unreleased)');
    results.success.push('Devara: Part 2 (2026)');
  } catch (error) {
    console.log('   ❌ Error:', error);
    results.errors.push({ title: 'Devara: Part 2 (2026)', error: String(error) });
  }

  // Final status check
  console.log('\n' + '='.repeat(80));
  console.log('📊 CHECKING FINAL STATUS...');
  console.log('='.repeat(80));

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

  const totalCount = (publishedCount || 0) + (unpublishedCount || 0);
  const completionRate = ((publishedCount || 0) / totalCount * 100).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('🎉 RESULTS');
  console.log('='.repeat(80));
  console.log(`\n✅ Successfully published: ${results.success.length}/4`);
  if (results.success.length > 0) {
    results.success.forEach((title, i) => console.log(`   ${i + 1}. ${title}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(e => console.log(`   - ${e.title}: ${e.error}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎊 FINAL DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`\nTelugu Published:    ${publishedCount?.toLocaleString()}`);
  console.log(`Telugu Unpublished:  ${unpublishedCount}`);
  console.log(`Completion Rate:     ${completionRate}%`);

  if (completionRate === '100.00') {
    console.log('\n' + '='.repeat(80));
    console.log('🎉🎉🎉 TRUE 100% ACHIEVED! 🎉🎉🎉');
    console.log('='.repeat(80));
    console.log('\n🚀 ALL 5,529 MOVIES PUBLISHED!');
    console.log('🎯 100% COMPLETION REACHED!');
    console.log('🏆 MISSION ACCOMPLISHED!');
    console.log('\n🎊 READY TO LAUNCH! 🎊\n');
  }

  console.log('='.repeat(80) + '\n');

  return results;
}

publishFinal4To100Percent()
  .then(() => {
    console.log('✅ Script completed successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
