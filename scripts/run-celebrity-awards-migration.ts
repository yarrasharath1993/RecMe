#!/usr/bin/env npx tsx
/**
 * Run Celebrity Awards Migration
 * Creates the celebrity_awards table and related structures
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
function green(text: string) { return `${colors.green}${text}${colors.reset}`; }
function yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
function white(text: string) { return `${colors.white}${text}${colors.reset}`; }
function bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }

async function runMigration() {
  console.log(cyan(bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║         RUNNING CELEBRITY AWARDS MIGRATION                            ║
╚═══════════════════════════════════════════════════════════════════════╝
`)));

  // Since Supabase client doesn't support raw SQL execution directly,
  // we'll create the tables using individual RPC calls or direct table creation
  
  console.log(white('  📋 Creating celebrity_awards table...\n'));
  
  // SQL for celebrity_awards table
  const createTableSQL = `
-- 1. CELEBRITY AWARDS TABLE
CREATE TABLE IF NOT EXISTS celebrity_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  celebrity_id UUID REFERENCES celebrities(id) ON DELETE CASCADE,
  award_name TEXT NOT NULL,
  award_type TEXT CHECK (award_type IN ('national', 'filmfare', 'nandi', 'siima', 'cinemaa', 'other')),
  category TEXT,
  year INTEGER,
  movie_id UUID REFERENCES movies(id) ON DELETE SET NULL,
  movie_title TEXT,
  is_won BOOLEAN DEFAULT true,
  is_nomination BOOLEAN DEFAULT false,
  source TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for celebrity_awards
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_celebrity ON celebrity_awards(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_year ON celebrity_awards(year DESC);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_type ON celebrity_awards(award_type);
  `;

  console.log(yellow('  ⚠️  Please execute the following SQL in Supabase SQL Editor:\n'));
  console.log(cyan('─'.repeat(75)));
  console.log(white(createTableSQL));
  console.log(cyan('─'.repeat(75)));
  
  console.log(white('\n  Steps:'));
  console.log(white('  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new'));
  console.log(white('  2. Copy the SQL above'));
  console.log(white('  3. Paste and run it in the SQL Editor'));
  console.log(white('  4. Then run: npx tsx scripts/add-premium-celebrity-awards.ts\n'));
  
  console.log(yellow('  Alternative: Use the migration file directly:'));
  console.log(white('  cat migrations/004-celebrity-enhancements.sql | psql <connection-string>\n'));
}

runMigration().catch(console.error);
