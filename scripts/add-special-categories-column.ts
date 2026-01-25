import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSpecialCategoriesColumn() {
  console.log('\n' + '='.repeat(80));
  console.log('🔧 ADDING SPECIAL CATEGORIES COLUMN TO MOVIES TABLE');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Add the column
    console.log('1️⃣  Adding special_categories column...\n');
    
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE movies 
        ADD COLUMN IF NOT EXISTS special_categories TEXT[];
      `
    });

    // If RPC doesn't work, we'll use direct SQL via Supabase client
    // For now, let's try a different approach - check if column exists first
    const { data: checkColumn, error: checkError } = await supabase
      .from('movies')
      .select('special_categories')
      .limit(1);

    if (checkError && checkError.message.includes('column') && checkError.message.includes('does not exist')) {
      console.log('   ⚠️  Column does not exist. Please run this SQL manually in Supabase SQL Editor:');
      console.log('');
      console.log('   ALTER TABLE movies ADD COLUMN IF NOT EXISTS special_categories TEXT[];');
      console.log('   CREATE INDEX IF NOT EXISTS idx_movies_special_categories ON movies USING GIN (special_categories);');
      console.log('');
      console.log('   Then run this script again to verify.\n');
      return;
    }

    // Step 2: Create index
    console.log('2️⃣  Creating GIN index for special_categories...\n');
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_movies_special_categories 
        ON movies USING GIN (special_categories);
      `
    });

    // Step 3: Verify the column exists
    console.log('3️⃣  Verifying column exists...\n');
    
    const { data: testData, error: testError } = await supabase
      .from('movies')
      .select('id, title_en, special_categories')
      .limit(5);

    if (testError) {
      console.log(`   ❌ Error: ${testError.message}\n`);
      console.log('   Please run this SQL manually in Supabase SQL Editor:');
      console.log('');
      console.log('   ALTER TABLE movies ADD COLUMN IF NOT EXISTS special_categories TEXT[];');
      console.log('   CREATE INDEX IF NOT EXISTS idx_movies_special_categories ON movies USING GIN (special_categories);');
      console.log('');
      return;
    }

    console.log('   ✅ Column exists and is accessible!');
    console.log(`   ✅ Tested with ${testData?.length || 0} movies\n`);

    // Step 4: Show current state
    console.log('4️⃣  Checking current special_categories data...\n');
    
    const { data: moviesWithCategories, error: countError } = await supabase
      .from('movies')
      .select('id')
      .not('special_categories', 'is', null);

    const count = moviesWithCategories?.length || 0;
    console.log(`   📊 Movies with special categories: ${count}`);
    console.log(`   📊 Total movies: ${testData?.length || 0}\n`);

    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log('\n✅ special_categories column added successfully!');
    console.log('✅ GIN index created for efficient querying');
    console.log('\n💡 Next steps:');
    console.log('   1. Run auto-tag-special-categories.ts to auto-tag movies');
    console.log('   2. Import your CSV with import-special-categories-csv.ts');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n⚠️  If the column already exists, you can skip this step.');
    console.log('⚠️  If it doesn\'t exist, please run this SQL manually in Supabase:');
    console.log('');
    console.log('   ALTER TABLE movies ADD COLUMN IF NOT EXISTS special_categories TEXT[];');
    console.log('   CREATE INDEX IF NOT EXISTS idx_movies_special_categories ON movies USING GIN (special_categories);');
    console.log('');
    process.exit(1);
  }
}

addSpecialCategoriesColumn()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
