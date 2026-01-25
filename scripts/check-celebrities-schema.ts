/**
 * Check celebrities table schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', 'celeb-teja')
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📋 Celebrities table columns for Teja:\n');
  console.log(Object.keys(data || {}).sort().join('\n'));
  
  console.log('\n\n📝 Full data:');
  console.log(JSON.stringify(data, null, 2));
}

checkSchema().catch(console.error);
