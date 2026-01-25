import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function findAmaran() {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .ilike('title_en', '%amaran%')
    .eq('release_year', 2024);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Found movies:');
  console.log(JSON.stringify(data, null, 2));
}

findAmaran().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
