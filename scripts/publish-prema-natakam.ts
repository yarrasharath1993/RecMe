#!/usr/bin/env npx tsx
/** Publish Prema Natakam (1981) so it appears in Chiranjeevi filmography export. */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('movies')
    .update({ is_published: true })
    .eq('slug', 'prema-natakam-1981')
    .select('id, title_en, slug, is_published');

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  if (data?.length) {
    console.log('Published:', data[0].title_en || data[0].slug);
  } else {
    console.log('No movie found with slug prema-natakam-1981');
  }
}

main();
