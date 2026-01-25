import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixIssues() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 FIXING REPORTED ISSUES');
  console.log('='.repeat(80) + '\n');

  const fixes = [];

  // Fix 1: Correct Aaha producer
  console.log('1️⃣  Fixing Aaha producer (Nagarjuna Akkineni → R. Mohan)...\n');
  
  const { data: aahaFixed, error: aahaError } = await supabase
    .from('movies')
    .update({ producer: 'R. Mohan' })
    .eq('id', 'a9f4180c-4911-4241-a567-4899736f06a8')
    .select();

  if (aahaError) {
    console.log('   ❌ Error:', aahaError.message);
  } else {
    console.log('   ✅ Fixed: "Aahaa..!" (1998) producer → R. Mohan\n');
    fixes.push('Aaha producer corrected');
  }

  // Fix 2: Check why Kedi (2006) is appearing
  console.log('2️⃣  Investigating Kedi (2006) appearing on Nagarjuna profile...\n');
  
  const { data: kedi2006 } = await supabase
    .from('movies')
    .select('*')
    .eq('id', '8331c248-2d16-4203-b61f-061c17b3e4be')
    .single();

  console.log('   Kedi (2006) fields:');
  console.log(`     Hero: "${kedi2006?.hero}"`);
  console.log(`     Heroine: "${kedi2006?.heroine}"`);
  console.log(`     Director: "${kedi2006?.director}"`);
  console.log(`     Producer: "${kedi2006?.producer}"`);
  console.log(`     Music: "${kedi2006?.music_director}"`);
  console.log(`     Writer: "${kedi2006?.writer}"`);
  
  // Check if any field has "nagarjuna"
  const hasNagarjuna = [
    kedi2006?.hero,
    kedi2006?.heroine,
    kedi2006?.director,
    kedi2006?.producer,
    kedi2006?.music_director,
    kedi2006?.writer
  ].some(field => field?.toLowerCase().includes('nagarjuna'));
  
  if (hasNagarjuna) {
    console.log('\n   ⚠️  Found "nagarjuna" in one of the fields!');
    console.log('   This movie will appear on Nagarjuna\'s profile due to our search.');
  } else {
    console.log('\n   ✅ No "nagarjuna" found in any field.');
    console.log('   This shouldn\'t appear on his profile.');
  }

  // Fix 3: Note about broken images (this is a frontend issue)
  console.log('\n3️⃣  About broken image placeholders...\n');
  console.log('   This is a FRONTEND issue, not database.');
  console.log('   The image component needs to handle onError to show placeholder.');
  console.log('   Location: Check the <img> or <Image> component in profile page.\n');
  
  fixes.push('Identified frontend image placeholder issue');

  console.log('='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nFixed: ${fixes.length} issues`);
  fixes.forEach(f => console.log(`  ✅ ${f}`));
  console.log('\n' + '='.repeat(80) + '\n');
}

fixIssues()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
