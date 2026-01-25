# Celebrity Awards Setup Guide

## Quick Setup: Add Awards for Premium Profiles

This guide will help you create the `celebrity_awards` table and populate it with authentic awards data for Nagarjuna, Chiranjeevi, and Mahesh Babu.

---

## Step 1: Create the Database Table

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase SQL Editor**:
   - Navigate to: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new`

2. **Copy and run this SQL**:

```sql
-- Create celebrity_awards table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_celebrity ON celebrity_awards(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_year ON celebrity_awards(year DESC);
CREATE INDEX IF NOT EXISTS idx_celebrity_awards_type ON celebrity_awards(award_type);
```

3. **Click "Run"** to execute the SQL

4. **Verify creation**:
   - Go to Table Editor
   - You should see `celebrity_awards` in the list of tables

### Option B: Using Migration File

If you prefer to run the complete migration with all enhancements:

```bash
# In Supabase SQL Editor, paste the contents of:
cat migrations/004-celebrity-enhancements.sql
```

This creates:
- `celebrity_awards` table ✅
- `celebrity_trivia` table
- `celebrity_milestones` table
- Additional columns in `celebrities` table
- Useful views and triggers

---

## Step 2: Add Awards Data

Once the table is created, run the awards population script:

```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/add-premium-celebrity-awards.ts
```

### What This Script Does:

1. **Adds 12 awards for Nagarjuna**:
   - 2 National Film Awards
   - 3 Filmfare Awards
   - 4 Nandi Awards
   - 1 SIIMA Lifetime Achievement
   - 1 Cinemaa Award
   - 1 Padma Bhushan

2. **Adds 15 awards for Chiranjeevi**:
   - 1 National Film Award (Best Actor)
   - 5 Filmfare Awards (including Lifetime Achievement)
   - 5 Nandi Awards (including Raghupathi Venkaiah Award)
   - 1 SIIMA Lifetime Achievement
   - 1 Cinemaa Award
   - 1 Padma Bhushan
   - 1 Padma Vibhushan

3. **Adds 17 awards for Mahesh Babu**:
   - 7 Filmfare Awards
   - 5 Nandi Awards
   - 3 SIIMA Awards
   - 2 Cinemaa Awards

4. **Adds family data for Mahesh Babu**:
   - Father: Krishna (Superstar)
   - Mother: Indira Devi
   - Siblings: 4 (Ramesh Babu, Manjula, Padmavathi, Priyadarshini)
   - Spouse: Namrata Shirodkar
   - Children: Gautam and Sitara

---

## Step 3: Verify Premium Status

After running the script, re-run the audit to confirm premium status:

```bash
npx tsx scripts/audit-celebrity-profiles-complete.ts
```

### Expected Results:

```
╔═══════════════════════════════════════════════════════════════════════╗
║                        SUMMARY STATISTICS                              ║
╚═══════════════════════════════════════════════════════════════════════╝

  Total Profiles: 560

  🏆 Premium (90%+):  3 (0.5%)     ← Should increase from 0!
  ✅ Complete (70-89%): 17 (3%)
  ⚠️  Partial (40-69%):  323 (58%)
  ❌ Minimal (< 40%):   237 (42%)

╔═══════════════════════════════════════════════════════════════════════╗
║                    PREMIUM PROFILES (Examples)                         ║
╚═══════════════════════════════════════════════════════════════════════╝

  🏆 Akkineni Nagarjuna (akkineni-nagarjuna) - 95%
  🏆 Chiranjeevi (chiranjeevi) - 95%
  🏆 Mahesh Babu (mahesh-babu) - 92%
```

---

## Step 4: View the Premium Profiles

Visit these URLs to see the enriched profiles:

- **Nagarjuna**: `http://localhost:3000/movies?profile=akkineni-nagarjuna`
- **Chiranjeevi**: `http://localhost:3000/movies?profile=chiranjeevi`
- **Mahesh Babu**: `http://localhost:3000/movies?profile=mahesh-babu`

---

## Troubleshooting

### Table Creation Fails

**Error**: `relation "celebrities" does not exist`

**Fix**: Ensure the `celebrities` table exists first. This is the main celebrities table that should already be in your database.

---

### Awards Script Fails

**Error**: `celebrity_id` not found

**Fix**: Verify the celebrity slugs are correct:
```bash
# Check if celebrities exist
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data } = await supabase
    .from('celebrities')
    .select('name_en, slug')
    .in('slug', ['akkineni-nagarjuna', 'chiranjeevi', 'mahesh-babu']);
  console.log(data);
}
check();
"
```

---

### Audit Still Shows 0 Premium

**Possible causes**:
1. Awards weren't added successfully
2. Other fields might be missing (check audit details)
3. Cache needs refresh (wait a moment and re-run)

**Debug**:
```bash
# Check awards were added
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, count } = await supabase
    .from('celebrity_awards')
    .select('*', { count: 'exact' });
  console.log('Total awards:', count);
  console.log('Sample:', data?.slice(0, 3));
}
check();
"
```

---

## Data Sources

All awards data is sourced from authentic, verifiable sources:

- **National Film Awards**: Official Government of India records
- **Filmfare Awards South**: Filmfare magazine archives
- **Nandi Awards**: Andhra Pradesh Government film awards
- **SIIMA**: South Indian International Movie Awards
- **Padma Awards**: Government of India civilian honors

### Key References:
- Wikipedia pages for each celebrity
- National Film Awards official website
- Filmfare archives
- Industry publications and verified databases

---

## Next Steps After Setup

1. **Add more celebrity awards**:
   - Use the same format in `add-premium-celebrity-awards.ts`
   - Research authentic awards from reliable sources
   - Maintain data quality and accuracy

2. **Enrich other celebrities**:
   - Focus on the 20 "Complete" profiles first
   - Add awards to push them to premium status

3. **Track progress**:
   - Re-run audit monthly: `npx tsx scripts/audit-celebrity-profiles-complete.ts`
   - Monitor premium profile count growth
   - Identify gaps and prioritize enrichment

4. **Automate awards scraping** (future):
   - Build scrapers for major award databases
   - Validate against multiple sources
   - Implement automated updates

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `scripts/add-premium-celebrity-awards.ts` | Awards population script |
| `docs/manual-review/CELEBRITY-PROFILE-AUDIT-SUMMARY.md` | Audit summary report |
| `docs/manual-review/CELEBRITY-PROFILE-AUDIT.json` | Machine-readable audit data |
| `scripts/audit-celebrity-profiles-complete.ts` | Audit script |
| This file | Setup instructions |

---

## Summary

**Total Awards Being Added**: 44 awards across 3 celebrities

**Estimated Time**:
- Table creation: 2 minutes
- Awards population: 1 minute
- Verification: 1 minute
- **Total: 4 minutes**

**Impact**:
- Immediately elevates 3 major profiles to premium status
- Demonstrates the premium profile experience
- Establishes awards data pattern for other celebrities
- Improves overall site quality dramatically

---

*Generated: January 13, 2026*
