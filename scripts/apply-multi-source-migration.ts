#!/usr/bin/env npx tsx
/**
 * Apply Multi-Source Validation Migration
 * Adds the license_warning column to the movies table
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFile } from 'fs/promises';

config({ path: resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('\n🔧 Applying Multi-Source Validation Migration...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // Check if column already exists
  const { data, error: checkError } = await supabase
    .from('movies')
    .select('license_warning', { count: 'exact', head: true })
    .limit(1);
  
  if (!checkError) {
    console.log('✅ Migration already applied - license_warning column exists');
    return;
  }
  
  if (checkError && !checkError.message.includes('does not exist')) {
    console.error('❌ Error checking column:', checkError.message);
    return;
  }
  
  console.log('📝 Column does not exist. Please apply the migration:\n');
  console.log('┌─────────────────────────────────────────────────────────────┐');
  console.log('│ SUPABASE DASHBOARD MIGRATION                                │');
  console.log('└─────────────────────────────────────────────────────────────┘');
  console.log('');
  console.log('1. Open: https://supabase.com/dashboard/project/YOUR_PROJECT');
  console.log('2. Navigate to: SQL Editor > New Query');
  console.log('3. Paste this SQL:');
  console.log('');
  console.log('─'.repeat(65));
  
  const migration = await readFile('migrations/008-multi-source-validation.sql', 'utf-8');
  const sqlLines = migration.split('\n').filter(line => 
    !line.trim().startsWith('--') && line.trim().length > 0
  );
  
  console.log(sqlLines.join('\n'));
  console.log('─'.repeat(65));
  console.log('');
  console.log('4. Click "Run"');
  console.log('5. Verify success message');
  console.log('6. Re-run this script to confirm');
  console.log('');
}

main().catch(console.error);
