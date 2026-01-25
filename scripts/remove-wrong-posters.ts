import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function removeWrongPosters() {
  console.log('\n' + '='.repeat(80));
  console.log('🗑️  REMOVING WRONG POSTERS (Will use placeholder fallback)');
  console.log('='.repeat(80) + '\n');

  const fixes = [];

  // ============================================================
  // FIX 1: AUTO DRIVER (1998)
  // ============================================================
  
  console.log('1️⃣  REMOVING AUTO DRIVER (1998) POSTER:\n');
  
  const autoDriverId = 'd75c4f63-8542-4216-8028-b19a8fd48b48';
  
  const { data: autoDriverBefore } = await supabase
    .from('movies')
    .select('title_en, poster_url')
    .eq('id', autoDriverId)
    .single();

  console.log(`   Before: "${autoDriverBefore?.title_en}"`);
  console.log(`   Poster URL: ${autoDriverBefore?.poster_url || 'NO POSTER'}`);
  console.log('');

  const { error: autoError } = await supabase
    .from('movies')
    .update({ poster_url: null })
    .eq('id', autoDriverId);

  if (autoError) {
    console.log(`   ❌ Error: ${autoError.message}\n`);
  } else {
    console.log(`   ✅ Poster URL removed! Will use placeholder.\n`);
    fixes.push('Auto Driver poster removed');
  }

  // ============================================================
  // FIX 2: SHANTI KRANTI (1991)
  // ============================================================
  
  console.log('2️⃣  REMOVING SHANTI KRANTI (1991) POSTER:\n');
  
  const shantiKrantiId = '7e8181bf-a26d-4433-8772-70c76078cf38';
  
  const { data: shantiKrantiBefore } = await supabase
    .from('movies')
    .select('title_en, poster_url')
    .eq('id', shantiKrantiId)
    .single();

  console.log(`   Before: "${shantiKrantiBefore?.title_en}"`);
  console.log(`   Poster URL: ${shantiKrantiBefore?.poster_url || 'NO POSTER'}`);
  console.log('');

  const { error: shantiError } = await supabase
    .from('movies')
    .update({ poster_url: null })
    .eq('id', shantiKrantiId);

  if (shantiError) {
    console.log(`   ❌ Error: ${shantiError.message}\n`);
  } else {
    console.log(`   ✅ Poster URL removed! Will use placeholder.\n`);
    fixes.push('Shanti Kranti poster removed');
  }

  // ============================================================
  // VERIFICATION
  // ============================================================
  
  console.log('3️⃣  VERIFYING CHANGES:\n');
  
  const { data: autoDriverAfter } = await supabase
    .from('movies')
    .select('title_en, poster_url')
    .eq('id', autoDriverId)
    .single();

  const { data: shantiKrantiAfter } = await supabase
    .from('movies')
    .select('title_en, poster_url')
    .eq('id', shantiKrantiId)
    .single();

  console.log(`   Auto Driver: ${autoDriverAfter?.poster_url === null ? '✅ NULL (will use placeholder)' : '❌ Still has poster'}`);
  console.log(`   Shanti Kranti: ${shantiKrantiAfter?.poster_url === null ? '✅ NULL (will use placeholder)' : '❌ Still has poster'}`);
  console.log('');

  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Fixed: ${fixes.length} posters removed`);
  fixes.forEach(f => console.log(`   • ${f}`));
  
  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)');
  console.log('   2. Both movies will now show dynamic placeholders');
  console.log('   3. Placeholders will show cast images or movie info');
  console.log('\n' + '='.repeat(80) + '\n');
}

removeWrongPosters()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
