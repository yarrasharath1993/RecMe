import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // Using anon key like earlier scripts
);

async function verifyConnection() {
  console.log('\n=== DATABASE CONNECTION VERIFICATION ===\n');
  console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...`);
  
  // Get total count
  const { count: totalCount, error: countError } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error:', countError);
    return;
  }

  console.log(`\nTotal movies: ${totalCount?.toLocaleString()}`);

  // Get genre stats
  const { count: withGenres, error: genreError } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .not('genres', 'is', null);

  if (!genreError) {
    const withoutGenres = totalCount - withGenres;
    const percent = ((withGenres / totalCount) * 100).toFixed(1);
    console.log(`With genres: ${withGenres?.toLocaleString()} (${percent}%)`);
    console.log(`Without genres: ${withoutGenres?.toLocaleString()}`);
  }

  console.log('\n✅ Connection verified\n');
}

verifyConnection();
