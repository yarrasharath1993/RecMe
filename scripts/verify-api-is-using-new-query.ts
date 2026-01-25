import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyQuery() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 VERIFYING WHAT THE API SHOULD BE DOING');
  console.log('='.repeat(80) + '\n');

  // Get celebrity
  const { data: celeb } = await supabase
    .from('celebrities')
    .select('name_en')
    .eq('slug', 'nagarjuna')
    .single();

  console.log(`1️⃣  Celebrity name_en: "${celeb?.name_en}"\n`);

  const personName = celeb?.name_en;
  if (!personName) {
    console.log('❌ Celebrity not found!');
    return;
  }

  // What the API SHOULD do now:
  const searchTerm = personName.split(/\s+/).pop() || personName;
  console.log(`2️⃣  Search term (last word): "${searchTerm}"\n`);

  // Query with that term
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title_en, hero')
    .eq('is_published', true)
    .or(`hero.ilike.%${searchTerm}%`);

  console.log(`3️⃣  Movies fetched with search term "${searchTerm}": ${movies?.length || 0}\n`);

  // Show breakdown
  const heroValues = new Map<string, number>();
  movies?.forEach(m => {
    if (m.hero?.toLowerCase().includes('nagarjuna')) {
      heroValues.set(m.hero, (heroValues.get(m.hero) || 0) + 1);
    }
  });

  console.log('   Breakdown:\n');
  Array.from(heroValues.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([hero, count]) => {
      console.log(`   "${hero}": ${count} movies`);
    });

  console.log('\n' + '='.repeat(80));
  console.log('📊 EXPECTED RESULT');
  console.log('='.repeat(80));
  console.log(`\nThe API SHOULD fetch: ${movies?.length || 0} movies`);
  console.log(`Currently showing: 68 movies`);
  console.log(`\n${movies?.length || 0} >= 85? ${(movies?.length || 0) >= 85 ? '✅ YES' : '❌ NO'}`);
  console.log('\n' + '='.repeat(80) + '\n');
}

verifyQuery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
