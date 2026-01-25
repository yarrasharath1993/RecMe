import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCelebrity() {
  const { data, error } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'nagarjuna')
    .single();

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('\n=== Nagarjuna Celebrity Record ===\n');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkCelebrity();
