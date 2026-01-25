/**
 * Fix Youth (2005) movie data with correct information
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixYouthMovie() {
  console.log('\n🔧 Fixing Youth (2005) movie data...\n');

  // Get current data
  const { data: before } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', 'youth-2005')
    .single();

  console.log('BEFORE:');
  console.log('  Director:', before?.director);
  console.log('  Writer:', before?.writer || 'NULL');
  console.log('  Cinematographer:', before?.cinematographer || 'NULL');
  console.log('  Editor:', before?.editor || 'NULL');
  console.log('  Hero:', before?.hero);
  console.log('  Heroine:', before?.heroine);
  console.log('  Production Notes:', before?.production_notes || 'NULL');

  // Update with correct data
  const { error } = await supabase
    .from('movies')
    .update({
      director: 'J. Jitendra',
      writer: 'J. Jitendra',
      cinematographer: 'Ramana Salwa',
      editor: 'Menaga',
      hero: 'Vikram, Sri Harsha',
      heroine: 'Lahari, Sishwa',
      production_notes: 'Production: Sri Siva Kesava (SSK) Films',
      // Producer and Music Director are already correct
    })
    .eq('slug', 'youth-2005');

  if (error) {
    console.error('\n❌ Error updating:', error);
    return;
  }

  // Verify the fix
  const { data: after } = await supabase
    .from('movies')
    .select('*')
    .eq('slug', 'youth-2005')
    .single();

  console.log('\nAFTER:');
  console.log('  Director:', after?.director);
  console.log('  Writer:', after?.writer);
  console.log('  Cinematographer:', after?.cinematographer);
  console.log('  Editor:', after?.editor);
  console.log('  Hero:', after?.hero);
  console.log('  Heroine:', after?.heroine);
  console.log('  Production Notes:', after?.production_notes);

  console.log('\n✅ Fixed! Youth (2005) now has correct data');
  console.log('   URL: http://localhost:3000/movies/youth-2005');
  
  console.log('\n📝 Summary of changes:');
  console.log('   Director: "Vinayak" → "J. Jitendra"');
  console.log('   Writer: NULL → "J. Jitendra"');
  console.log('   Cinematographer: NULL → "Ramana Salwa"');
  console.log('   Editor: NULL → "Menaga"');
  console.log('   Hero: "Nithin" → "Vikram, Sri Harsha"');
  console.log('   Heroine: "Sharma" → "Lahari, Sishwa"');
  console.log('   Production Notes: NULL → "Production: Sri Siva Kesava (SSK) Films"');
  console.log('   Producer: ✅ Already correct (Gogikar Bajarang Jayadev)');
  console.log('   Music Director: ✅ Already correct (Ramana Ogeti)');
}

fixYouthMovie().catch(console.error);
