import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPayanamLanguage() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIXING PAYANAM LANGUAGE (Telugu → Tamil)');
  console.log('='.repeat(80) + '\n');

  // Find Payanam (2011)
  console.log('1️⃣  Finding Payanam (2011)...\n');
  
  const { data: payanam, error: findError } = await supabase
    .from('movies')
    .select('id, title_en, release_year, language, hero, director')
    .eq('title_en', 'Payanam')
    .eq('release_year', 2011)
    .single();

  if (findError || !payanam) {
    console.log('   ❌ Error: Movie not found!');
    console.log(`   Error: ${findError?.message || 'No data returned'}\n`);
    return;
  }

  console.log(`   ✅ Found: "${payanam.title_en}" (${payanam.release_year})`);
  console.log(`   Current Language: ${payanam.language}`);
  console.log(`   Hero: ${payanam.hero}`);
  console.log(`   Director: ${payanam.director}`);
  console.log(`   ID: ${payanam.id}`);
  console.log('');

  // Check Gaganam for context
  console.log('2️⃣  Checking Gaganam (2011) for context...\n');
  
  const { data: gaganam } = await supabase
    .from('movies')
    .select('id, title_en, release_year, language, hero, director')
    .eq('title_en', 'Gaganam')
    .eq('release_year', 2011)
    .single();

  if (gaganam) {
    console.log(`   ✅ Found: "${gaganam.title_en}" (${gaganam.release_year})`);
    console.log(`   Language: ${gaganam.language}`);
    console.log(`   Hero: ${gaganam.hero}`);
    console.log(`   Director: ${gaganam.director}`);
    console.log('');
    console.log(`   📝 Note: Payanam is the Tamil version of Gaganam`);
    console.log('');
  }

  // Update Payanam language to Tamil
  console.log('3️⃣  Updating Payanam language to Tamil...\n');
  
  const { data: updated, error: updateError } = await supabase
    .from('movies')
    .update({ language: 'Tamil' })
    .eq('id', payanam.id)
    .select();

  if (updateError) {
    console.log(`   ❌ Error updating: ${updateError.message}\n`);
    return;
  }

  console.log('   ✅ Language updated successfully!');
  console.log('');

  // Verify the change
  console.log('4️⃣  Verifying changes...\n');
  
  const { data: verified } = await supabase
    .from('movies')
    .select('id, title_en, language')
    .eq('id', payanam.id)
    .single();

  if (verified) {
    console.log(`   Title: "${verified.title_en}"`);
    console.log(`   New Language: ${verified.language}`);
    console.log(`   Status: ${verified.language === 'Tamil' ? '✅ CORRECT' : '❌ INCORRECT'}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log('\n✅ Payanam language updated: Telugu → Tamil');
  console.log('✅ Gaganam remains: Telugu');
  console.log('\n💡 Context: Payanam (Tamil) and Gaganam (Telugu) are the same film');
  console.log('   released in different languages with Nagarjuna in the lead role.');
  console.log('\n🔄 Next: Hard refresh browser to see changes on profile page');
  console.log('\n' + '='.repeat(80) + '\n');
}

fixPayanamLanguage()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
