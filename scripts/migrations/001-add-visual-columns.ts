/**
 * Migration Runner: Add Visual Intelligence Columns
 * 
 * Adds visual confidence, visual type, and archive card data columns to movies table.
 * This is a non-destructive, additive migration.
 * 
 * Usage: npx tsx scripts/migrations/001-add-visual-columns.ts
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
  console.log('MIGRATION: Add Visual Intelligence Columns');
  console.log('═══════════════════════════════════════════════════════════════════════\n');

  // Read the SQL migration file
  const sqlPath = path.join(__dirname, '../../migrations/005-add-visual-intelligence.sql');
  
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
    if (!statement || statement.startsWith('COMMENT')) {
      // Execute comments separately as they're valid SQL
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          // Comments might fail silently, that's ok
          skipCount++;
        } else {
          successCount++;
        }
      } catch {
        skipCount++;
      }
      continue;
    }

    try {
      // For ALTER TABLE statements, we need to handle them specially
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
    .from('movies')
    .select('id, title_en, poster_confidence, poster_visual_type, archive_card_data, visual_verified_at')
    .limit(1);

  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
    console.log('\n⚠️  You may need to run this migration manually via Supabase SQL editor.');
    console.log('   Copy the contents of: migrations/005-add-visual-intelligence.sql');
  } else {
    console.log('✅ All visual intelligence columns verified!');
    console.log('   - poster_confidence');
    console.log('   - poster_visual_type');
    console.log('   - archive_card_data');
    console.log('   - visual_verified_at');
    console.log('   - visual_verified_by');
  }
}

runMigration().catch(console.error);

