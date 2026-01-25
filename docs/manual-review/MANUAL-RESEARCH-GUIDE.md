# 📚 MANUAL RESEARCH GUIDE - Path to 100%

**Created:** January 14, 2026  
**Current Status:** 77% → Target: 100%  
**Batches Generated:** 12 batches (390 profiles)

---

## 🎯 OVERVIEW

You now have **12 structured batches** ready for manual research:

| Category | Batches | Profiles | Time Estimate | Impact |
|----------|---------|----------|---------------|--------|
| **Awards** | 6-10 | 100 profiles | 25-30 hours | +10-12% |
| **Social Media** | 2-5 | 200 profiles | 10-15 hours | +5-8% |
| **Family Trees** | 1-3 | 90 profiles | 15-20 hours | +6-8% |
| **TOTAL** | **12** | **390** | **50-65 hours** | **+21-28%** |

**Result:** 77% → 98-100% completeness!

---

## 🏆 BATCH 1: AWARDS RESEARCH

### Files Created
1. `AWARDS-RESEARCH-BATCH-6.tsv` (20 profiles)
2. `AWARDS-RESEARCH-BATCH-7.tsv` (20 profiles)
3. `AWARDS-RESEARCH-BATCH-8.tsv` (20 profiles)
4. `AWARDS-RESEARCH-BATCH-9.tsv` (20 profiles)
5. `AWARDS-RESEARCH-BATCH-10.tsv` (20 profiles)

### How to Complete Awards Batch

#### Step 1: Open the TSV File
```bash
# Open in your preferred editor
open docs/manual-review/AWARDS-RESEARCH-BATCH-6.tsv
# OR
code docs/manual-review/AWARDS-RESEARCH-BATCH-6.tsv
```

#### Step 2: Research Each Celebrity

For each row:

1. **Check Wikipedia** (if URL provided)
   - Look for "Awards" or "Achievements" section
   - Note National Awards, Nandi Awards, Filmfare, SIIMA
   
2. **Check IMDb** (if ID provided)
   - Go to `https://www.imdb.com/name/{imdb_id}/awards`
   - Look for major Indian film awards
   
3. **Search Google**
   - Query: `"{name_en}" Telugu actor awards`
   - Look for credible sources

#### Step 3: Fill in the Data

**Format for awards_found column:**
```
Award Name (Year) - Film Name; Award Name (Year) - Film Name
```

**Examples:**
```
Nandi Award Best Actor (1998) - Prema; Filmfare Best Actor – Telugu (1999) - Tholi Prema; SIIMA Best Actor (2014) - Manam
```

**For multiple wins in same category:**
```
Nandi Award Best Actor (1998, 2001, 2005); Filmfare Lifetime Achievement Award – South (2015)
```

#### Step 4: Update Status

Change `TODO` to `DONE` when completed:
```
slug    name_en    occupation    wikipedia_url    imdb_id    awards_found    status    notes
celeb-xyz    Celebrity Name    actor    Wikipedia    nm123456    Nandi Award (2005)    DONE    
```

#### Step 5: Import the Batch

Once all 20 profiles are DONE:
```bash
cd /Users/sharathchandra/Projects/telugu-portal
npx tsx scripts/import-awards-batch-6.ts
```

### Awards Priority List

**Essential Awards to Include:**
1. **National Film Awards** (Highest priority)
2. **Nandi Awards** (Telugu state awards)
3. **Filmfare Awards South**
4. **SIIMA Awards** (Post-2012)
5. **Padma Awards** (Civilian honors)
6. **Raghupathi Venkaiah Award** (Lifetime achievement)

**Skip:**
- Fan-voted online awards
- Unverified regional awards
- Nominations without wins (unless major)

---

## 📱 BATCH 2: SOCIAL MEDIA RESEARCH

### Files Created
1. `SOCIAL-MEDIA-BATCH-2.tsv` (50 profiles)
2. `SOCIAL-MEDIA-BATCH-3.tsv` (50 profiles)
3. `SOCIAL-MEDIA-BATCH-4.tsv` (50 profiles)
4. `SOCIAL-MEDIA-BATCH-5.tsv` (50 profiles)

### How to Complete Social Media Batch

#### Step 1: Verify Active Status

**Priority Order:**
1. Active stars (2020-present) → HIGH PRIORITY
2. Recent retirees (2015-2020) → MEDIUM
3. Legends with estates → LOW
4. Deceased without social → SKIP

#### Step 2: Find Verified Accounts

**Twitter:**
- Search: `{name_en} Telugu actor Twitter`
- Look for blue checkmark (verified)
- Format: `https://twitter.com/{handle}`

**Instagram:**
- Search: `{name_en} Instagram official`
- Look for blue checkmark
- Format: `https://instagram.com/{handle}`

**Facebook:**
- Search: `{name_en} official Facebook`
- Look for verified page badge
- Format: `https://facebook.com/{pagename}`

#### Step 3: Fill in the Data

**Format:**
```
slug    name_en    occupation    wikipedia_url    twitter    instagram    facebook    official_website    status    notes
celeb-xyz    Celebrity Name    actor    Wikipedia    https://twitter.com/handle    https://instagram.com/handle    https://facebook.com/page        DONE    Verified accounts
```

#### Step 4: Import the Batch

```bash
npx tsx scripts/import-social-batch-2.ts
```

### Verification Checklist

- ✅ Account has blue checkmark/verification badge
- ✅ Account posts in Telugu/English related to cinema
- ✅ Account has significant followers (10K+)
- ✅ Account is actively posting (within last year)
- ❌ Don't include fan pages or unofficial accounts

---

## 👨‍👩‍👧‍👦 BATCH 3: FAMILY TREES RESEARCH

### Files Created
1. `FAMILY-TREES-BATCH-1.tsv` (30 profiles)
2. `FAMILY-TREES-BATCH-2.tsv` (30 profiles)
3. `FAMILY-TREES-BATCH-3.tsv` (30 profiles)

### How to Complete Family Trees Batch

#### Step 1: Research Family Relationships

**Sources:**
1. Wikipedia (most reliable)
2. IMDb biography
3. Film industry news sites
4. Family interviews

#### Step 2: Fill in the Data

**Format for each column:**

**Parents:**
```
Father Name (occupation), Mother Name
```

**Spouse:**
```
Spouse Name (marriage year) [if divorced: add "divorced YEAR"]
```

**Children:**
```
Child1 Name, Child2 Name, Child3 Name
```

**Siblings:**
```
Sibling1 Name (occupation), Sibling2 Name
```

**Relatives:**
```
Uncle Name (relationship), Cousin Name (relationship)
```

**Example:**
```
parents: Venkat Rao (producer), Lakshmi Devi
spouse: Samantha (2017)
children: Akshara, Anirudh
siblings: Ramesh (actor), Suresh
relatives: Mahesh Babu (cousin), Chiranjeevi (uncle)
```

#### Step 3: Update Status

Change `TODO` to `DONE` when completed.

#### Step 4: Import the Batch

```bash
npx tsx scripts/import-family-batch-1.ts
```

### Family Research Tips

**What to Include:**
- ✅ Immediate family (parents, spouse, children, siblings)
- ✅ Film industry relatives (actors, directors, producers)
- ✅ Famous relatives from other fields

**What to Skip:**
- ❌ Distant cousins unless film industry
- ❌ Unverified relationships
- ❌ Extended family without public presence

---

## 📊 RECOMMENDED WORK SCHEDULE

### Week 1: High-Value Quick Wins
**Focus:** Awards + Social Media (active stars)
**Time:** 10-12 hours
**Result:** 77% → 82%

**Monday-Tuesday (4 hours):**
- Awards Batch 6 (20 profiles)

**Wednesday-Thursday (4 hours):**
- Awards Batch 7 (20 profiles)

**Friday-Weekend (4 hours):**
- Social Media Batch 2 (50 profiles - faster!)

**Import and verify:**
```bash
npx tsx scripts/import-awards-batch-6.ts
npx tsx scripts/import-awards-batch-7.ts
npx tsx scripts/import-social-batch-2.ts
npx tsx scripts/audit-celebrity-profiles-complete.ts
```

---

### Week 2: Continued Momentum
**Focus:** More Awards + Social + Start Families
**Time:** 12-15 hours
**Result:** 82% → 88%

**Monday-Tuesday (5 hours):**
- Awards Batch 8 (20 profiles)
- Awards Batch 9 (20 profiles)

**Wednesday-Thursday (5 hours):**
- Social Media Batch 3 (50 profiles)
- Family Trees Batch 1 (30 profiles)

**Friday-Weekend (5 hours):**
- Awards Batch 10 (20 profiles)
- Social Media Batch 4 (50 profiles)

---

### Week 3: Deep Dive
**Focus:** Family Trees + Remaining Social
**Time:** 10-12 hours
**Result:** 88% → 94%

**Monday-Wednesday (6 hours):**
- Family Trees Batch 2 (30 profiles)
- Family Trees Batch 3 (30 profiles)

**Thursday-Weekend (6 hours):**
- Social Media Batch 5 (50 profiles)
- Review and corrections

---

### Week 4-5: Final Push
**Focus:** Quality check + Fill remaining gaps
**Time:** 8-10 hours
**Result:** 94% → 100%

**Tasks:**
- Review all imported data
- Fix any errors or missing entries
- Add awards for newly discovered legends
- Complete any remaining profiles
- Final audit

---

## 🛠️ IMPORT SCRIPTS

You'll need to create import scripts for each batch. Here's the template pattern:

### Awards Import Script
```typescript
// scripts/import-awards-batch-6.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read TSV, parse awards, insert into celebrity_awards table
```

### Social Media Import Script
```typescript
// scripts/import-social-batch-2.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read TSV, update twitter_url, instagram_url, facebook_url
```

### Family Trees Import Script
```typescript
// scripts/import-family-batch-1.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

// Read TSV, parse family relationships, update JSON field
```

---

## ✅ QUALITY CHECKLIST

Before importing each batch:

### Data Quality
- [ ] All TODO changed to DONE
- [ ] No empty cells (use "N/A" if not found)
- [ ] Proper formatting (semicolons, commas)
- [ ] No typos in names
- [ ] Verified sources used

### Awards Specific
- [ ] Awards are from credible sources
- [ ] Years are correct
- [ ] Film names are accurate (if applicable)
- [ ] Major awards prioritized

### Social Media Specific
- [ ] All accounts are verified
- [ ] URLs are complete and correct
- [ ] No fan pages included
- [ ] Active accounts only

### Family Trees Specific
- [ ] Relationships are accurate
- [ ] Names match database slugs where possible
- [ ] Film industry connections highlighted
- [ ] No unverified relationships

---

## 📈 PROGRESS TRACKING

After each batch import, run the audit:

```bash
npx tsx scripts/audit-celebrity-profiles-complete.ts
```

### Milestone Targets

| Batches Complete | Expected % | Premium Profiles | Complete Profiles |
|------------------|------------|------------------|-------------------|
| Start | 77% | 10 | 402 |
| After Batch 6-7 (40 awards) | 79% | 12 | 420 |
| After Batch 6-10 (100 awards) | 84% | 20 | 450 |
| After Social 2-5 (200 links) | 89% | 25 | 470 |
| After Family 1-3 (90 trees) | 95% | 35 | 490 |
| **COMPLETE** | **100%** | **50+** | **500+** |

---

## 💡 TIPS FOR EFFICIENCY

### Research Shortcuts

1. **Use IMDb's Awards Page:**
   ```
   https://www.imdb.com/name/{imdb_id}/awards
   ```

2. **Wikipedia Template:**
   - CTRL+F "Awards" or "Achievements"
   - Look for infoboxes
   - Check filmography tables

3. **Social Media Search:**
   ```
   site:twitter.com "{name}" Telugu actor verified
   ```

4. **Batch Similar Profiles:**
   - Group by era (1980s, 1990s, etc.)
   - Research dynasties together
   - Check co-stars simultaneously

### Time-Saving Strategies

- **Awards:** Start with top 20 legends (more likely documented)
- **Social:** Active stars first (easier to verify)
- **Families:** Research dynasties as groups
- **Skip:** Profiles with no Wikipedia and minimal IMDb

### Common Pitfalls

❌ **Don't:**
- Include unverified awards
- Add fan pages as social media
- Guess at family relationships
- Rush through batches

✅ **Do:**
- Double-check sources
- Use "N/A" when truly not available
- Add notes column for context
- Take breaks to avoid fatigue

---

## 🎯 SUCCESS METRICS

### After Completing All 12 Batches

**Expected Results:**
- **Completeness:** 77% → 98%+
- **Premium Profiles:** 10 → 40+
- **Complete Profiles:** 402 → 480+
- **Awards Documented:** 92 → 192+
- **Social Media:** 184 → 384+
- **Family Data:** 14 → 104+

**Time Investment:** 50-65 hours over 4-5 weeks

**ROI:** +21% completeness with high-quality, verified data

---

## 🚀 GET STARTED NOW!

### Your First Task (2-3 hours)

1. **Open Awards Batch 6:**
   ```bash
   open docs/manual-review/AWARDS-RESEARCH-BATCH-6.tsv
   ```

2. **Research the first 5 profiles:**
   - Aadhi Pinisetty
   - Aadi
   - Aamani
   - Aarthi Agarwal
   - Abbas

3. **Fill in awards found**

4. **Change status to DONE**

5. **Save and take a break!**

### After Your First Session

Once you complete the first 5, you'll have a rhythm. The rest will go faster!

**Remember:** Quality over speed. Accurate data is more valuable than rushed entries.

---

## 📞 NEED HELP?

If you encounter:
- **Conflicting information:** Add note, use most credible source
- **Profile not found:** Mark as "N/A" in notes
- **Unclear relationships:** Skip or mark as uncertain

**When in doubt:** It's better to leave blank than to add incorrect data.

---

**Ready to start?** Begin with AWARDS-RESEARCH-BATCH-6.tsv! 🏆

Good luck on your journey to 100% completeness! 🚀
