/**
 * Migration Runner: Add Smart Review Columns
 * 
 * Adds smart review, derivation timestamp, and needs_human_review columns to movie_reviews table.
 * This is a non-destructive, additive migration.
 * 
 * Usage: npx tsx scripts/migrations/002-add-smart-review-columns.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log('MIGRATION: Add Smart Review Columns');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // Read the SQL migration file
  const sqlPath = path.join(__dirname, '../../migrations/006-add-smart-review-fields.sql');
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration file not found: ${sqlPath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

  // Split by statements and execute each
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    if (!statement) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        if (error.message?.includes('already exists')) {
          console.log(`⏭️  Skipped (already exists): ${statement.substring(0, 60)}...`);
          skipCount++;
        } else {
          console.error(`❌ Error: ${error.message}`);
          console.error(`   Statement: ${statement.substring(0, 80)}...`);
          errorCount++;
        }
      } else {
        console.log(`✅ Executed: ${statement.substring(0, 60)}...`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n───────────────────────────────────────────────────────────────────────');
  console.log('MIGRATION SUMMARY');
  console.log('───────────────────────────────────────────────────────────────────────');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⏭️  Skipped:    ${skipCount}`);
  console.log(`❌ Errors:     ${errorCount}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // Verify the columns exist
  console.log('Verifying columns...\n');
  
  const { data: sample, error: verifyError } = await supabase
    .from('movie_reviews')
    .select('id, movie_id, smart_review, smart_review_derived_at, needs_human_review')
    .limit(1);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    console.log('\n⚠️  You may need to run this migration manually via Supabase SQL editor.');
    console.log('   Copy the contents of: migrations/006-add-smart-review-fields.sql');
  } else {
    console.log('✅ All smart review columns verified!');
    console.log('   - smart_review');
    console.log('   - smart_review_derived_at');
    console.log('   - needs_human_review');
  }
}

runMigration().catch(console.error);

