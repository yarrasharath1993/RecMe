#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  const checks = [
    { slug: 'co-kancharapalem-2018', field: 'heroine', expected: 'Nitya Sri' },
    { slug: 'mentoo-2023', field: 'heroine', expected: 'Riya Suman' },
    { slug: 'dhammu-2012', field: 'hero', expected: 'Jr. NTR' },
  ];

  for (const check of checks) {
    const { data } = await supabase
      .from('movies')
      .select('slug, hero, heroine')
      .eq('slug', check.slug)
      .single();

    if (data) {
      const value = check.field === 'hero' ? data.hero : data.heroine;
      const status = value === check.expected ? '✅' : '❌';
      console.log(`${status} ${check.slug}: ${check.field} = "${value}" (expected: "${check.expected}")`);
    } else {
      console.log(`❌ ${check.slug}: Not found`);
    }
  }
}

verify().catch(console.error);
