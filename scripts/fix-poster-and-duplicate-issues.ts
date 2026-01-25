import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIssues() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIXING POSTER & DUPLICATE ISSUES');
  console.log('='.repeat(80) + '\n');

  const fixes = [];

  // ============================================================
  // FIX 1: DELETE KIRAYI DADA DUPLICATE
  // ============================================================
  
  console.log('1️⃣  FIXING KIRAYI DADA DUPLICATE:\n');
  
  const kirayiDadaId1 = '445b265b'; // "Kirai Dada" with Nagarjuna
  const kirayiDadaId2 = 'a8051101'; // "Kirayi Dada" with Akkineni Nagarjuna
  
  // Check both entries
  const { data: kirai1 } = await supabase
    .from('movies')
    .select('id, title_en, hero, poster_url')
    .ilike('id', `${kirayiDadaId1}%`)
    .single();

  const { data: kirai2 } = await supabase
    .from('movies')
    .select('id, title_en, hero, poster_url')
    .ilike('id', `${kirayiDadaId2}%`)
    .single();

  console.log(`   Entry 1: "${kirai1?.title_en}" - Hero: ${kirai1?.hero}`);
  console.log(`   Entry 2: "${kirai2?.title_en}" - Hero: ${kirai2?.hero}`);
  console.log('');

  // Keep the one with better data (longer hero name = more complete)
  const keepId = (kirai1?.hero?.length || 0) > (kirai2?.hero?.length || 0) ? kirai1?.id : kirai2?.id;
  const deleteId = keepId === kirai1?.id ? kirai2?.id : kirai1?.id;

  console.log(`   Keeping: ${keepId === kirai1?.id ? 'Entry 1' : 'Entry 2'} (ID: ${keepId?.substring(0, 8)})`);
  console.log(`   Deleting: ${deleteId === kirai1?.id ? 'Entry 1' : 'Entry 2'} (ID: ${deleteId?.substring(0, 8)})`);
  console.log('');

  // First delete from career_milestones if exists
  const { error: milestoneError } = await supabase
    .from('career_milestones')
    .delete()
    .eq('movie_id', deleteId);

  if (milestoneError) {
    console.log(`   ⚠️  Career milestones deletion: ${milestoneError.message}`);
  }

  // Delete the duplicate
  const { error: deleteError } = await supabase
    .from('movies')
    .delete()
    .eq('id', deleteId);

  if (deleteError) {
    console.log(`   ❌ Error deleting duplicate: ${deleteError.message}\n`);
  } else {
    console.log(`   ✅ Deleted duplicate!\n`);
    fixes.push('Kirayi Dada duplicate removed');
  }

  // ============================================================
  // FIX 2: AUTO DRIVER (1998) POSTER
  // ============================================================
  
  console.log('2️⃣  CHECKING AUTO DRIVER (1998) POSTER:\n');
  
  const autoDriverId = 'd75c4f63-8542-4216-8028-b19a8fd48b48';
  
  const { data: autoDriver } = await supabase
    .from('movies')
    .select('*')
    .eq('id', autoDriverId)
    .single();

  console.log(`   Current Poster: ${autoDriver?.poster_url || 'NO POSTER'}`);
  console.log(`   TMDB ID: ${autoDriver?.tmdb_id}`);
  console.log('');
  
  // Suggest Wikipedia poster URL for Auto Driver
  const autoDriverWikiPoster = 'https://upload.wikimedia.org/wikipedia/en/9/91/Auto_Driver_%281998_film%29.jpg';
  
  console.log(`   Suggested Poster (from Wikipedia):`);
  console.log(`   ${autoDriverWikiPoster}`);
  console.log('');
  
  console.log(`   📝 Manual action required: Verify and update if current poster is wrong\n`);

  // ============================================================
  // FIX 3: SHANTI KRANTI (1991) POSTER
  // ============================================================
  
  console.log('3️⃣  CHECKING SHANTI KRANTI (1991) POSTER:\n');
  
  const shantiKrantiId = '7e8181bf-a26d-4433-8772-70c76078cf38';
  
  const { data: shantiKranti } = await supabase
    .from('movies')
    .select('*')
    .eq('id', shantiKrantiId)
    .single();

  console.log(`   Current Poster: ${shantiKranti?.poster_url || 'NO POSTER'}`);
  console.log(`   TMDB ID: ${shantiKranti?.tmdb_id}`);
  console.log('');
  
  // Suggest Wikipedia poster URL for Shanti Kranti
  const shantiKrantiWikiPoster = 'https://upload.wikimedia.org/wikipedia/en/thumb/4/45/Shanti_Kranti_film_poster.jpg/220px-Shanti_Kranti_film_poster.jpg';
  
  console.log(`   Suggested Poster (from Wikipedia - Kannada version, may need Telugu):`);
  console.log(`   ${shantiKrantiWikiPoster}`);
  console.log('');
  
  console.log(`   ⚠️  User confirmed current poster is Tamil version`);
  console.log(`   📝 Manual action required: Find Telugu poster with Nagarjuna\n`);

  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nFixed: ${fixes.length} issues`);
  fixes.forEach(f => console.log(`  ✅ ${f}`));
  
  console.log('\n📝 MANUAL ACTIONS NEEDED:');
  console.log('  1. Verify Auto Driver poster and update if wrong');
  console.log('  2. Find correct Telugu Shanti Kranti poster with Nagarjuna');
  console.log('  3. Hard refresh browser to see Kirayi Dada fix');
  console.log('\n' + '='.repeat(80) + '\n');

  // ============================================================
  // GENERATE SQL FOR MANUAL POSTER UPDATES
  // ============================================================
  
  console.log('💾 SQL COMMANDS FOR MANUAL POSTER UPDATES:\n');
  console.log('-- Update Auto Driver poster (verify URL first):');
  console.log(`UPDATE movies SET poster_url = '${autoDriverWikiPoster}' WHERE id = '${autoDriverId}';\n`);
  
  console.log('-- Update Shanti Kranti poster (after finding Telugu version):');
  console.log(`UPDATE movies SET poster_url = '<TELUGU_POSTER_URL>' WHERE id = '${shantiKrantiId}';\n`);
  
  console.log('='.repeat(80) + '\n');
}

fixIssues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
