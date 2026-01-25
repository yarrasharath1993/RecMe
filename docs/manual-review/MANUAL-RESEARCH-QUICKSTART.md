# MANUAL RESEARCH QUICK-START GUIDE

**Generated**: January 13, 2026  
**Current Status**: Ready to start  
**Estimated Time**: 8-10 hours for Batch 1 (Telugu names + Awards)

---

## 🎯 OVERVIEW

We've automated everything possible (~65% completeness). Now we need manual research for:

1. **Telugu Names** (50 profiles) → 2-3 hours
2. **Awards** (20 profiles) → 5-6 hours

**Total Batch 1**: ~8 hours of research work

---

## 📋 BATCH FILES READY

### ✅ TELUGU-NAMES-BATCH-1.tsv
**Location**: `docs/manual-review/TELUGU-NAMES-BATCH-1.tsv`  
**Profiles**: 50 top celebrities  
**Time**: 3-4 minutes per profile  
**Total**: 2-3 hours

### ✅ AWARDS-RESEARCH-BATCH-1.tsv
**Location**: `docs/manual-review/AWARDS-RESEARCH-BATCH-1.tsv`  
**Profiles**: 20 legends  
**Time**: 15-20 minutes per profile  
**Total**: 5-6 hours

---

## 🚀 WORKFLOW: TELUGU NAMES

### Step 1: Open the TSV File
```bash
open docs/manual-review/TELUGU-NAMES-BATCH-1.tsv
```

Or use any text editor (VS Code, Excel, Google Sheets)

### Step 2: For Each Row
1. **Click the Wikipedia URL** (column E)
2. **Find the Telugu name**:
   - Usually in the first line
   - Look for: "తెలుగు: [name]"
   - Or check the infobox on the right
3. **Copy the Telugu script** (not transliteration!)
4. **Paste into `name_te` column** (column C)
5. **Mark status as `DONE`** (column H)

### Step 3: Example

**Before**:
```
celeb-ravi-teja	Ravi Teja		Actor	https://en.wikipedia.org/wiki/Ravi_Teja	...	PENDING
```

**After** (visit Wikipedia, find "రవితేజ"):
```
celeb-ravi-teja	Ravi Teja	రవితేజ	Actor	https://en.wikipedia.org/wiki/Ravi_Teja	...	DONE
```

### Step 4: Import When Ready
After completing 10-20 profiles (or all 50):
```bash
npx tsx scripts/import-telugu-names-batch.ts
```

This will automatically import all rows marked `DONE`.

---

## 🏆 WORKFLOW: AWARDS RESEARCH

### Step 1: Open the TSV File
```bash
open docs/manual-review/AWARDS-RESEARCH-BATCH-1.tsv
```

### Step 2: For Each Celebrity
1. **Visit Wikipedia page** (click URL)
2. **Find "Awards" or "Honours" section**
3. **Note down all major awards**:
   - Padma Awards (Shri, Bhushan, Vibhushan)
   - Dadasaheb Phalke Award
   - National Film Awards
   - Filmfare Awards South
   - Nandi Awards
   - SIIMA Awards
   - State Awards
   - Lifetime Achievement Awards

### Step 3: Format Awards Properly

**Format**: `Award Name (Year) - Category [for Movie]`

**Example**:
```
Padma Bhushan (2006); 
National Film Award (1987) - Best Actor [for Swathi Muthyam]; 
Filmfare Best Actor (1988, 1989); 
Nandi Award Best Actor (1987, 1988, 1990)
```

### Step 4: Fill the TSV

**Before**:
```
krishnam-raju	Krishnam Raju	Actor	https://en.wikipedia.org/wiki/Krishnam_Raju		PENDING
```

**After**:
```
krishnam-raju	Krishnam Raju	Actor	https://en.wikipedia.org/wiki/Krishnam_Raju	Nandi Award (1974, 1983); Filmfare Best Actor (1974); CineMAA Award (2003)	DONE	4 major awards
```

### Step 5: We'll Create Import Script
After you complete the research, I'll help create the import script to add these awards to the database.

---

## 💡 TIPS & TRICKS

### For Telugu Names:
- ✅ **Do**: Copy Telugu script exactly as shown
- ✅ **Do**: Check infobox if not in first line
- ✅ **Do**: Use IMDb if Wikipedia unclear
- ❌ **Don't**: Use transliteration (e.g., "Ravi Teja" instead of "రవితేజ")
- ❌ **Don't**: Add extra spaces or formatting

### For Awards:
- ✅ **Do**: Include year and category
- ✅ **Do**: Include movie name for acting awards
- ✅ **Do**: List ALL major awards (National, Filmfare, Nandi, Padma)
- ✅ **Do**: Check IMDb awards page as backup
- ❌ **Don't**: Include minor/regional awards
- ❌ **Don't**: Include nominations (only wins)
- ❌ **Don't**: Guess years - verify from Wikipedia

### General Tips:
- 🎯 **Batch work**: Do 10-15 at a time, then take a break
- ⏱️ **Time yourself**: Track if you're taking too long per profile
- 📝 **Add notes**: Use the notes column for anything uncertain
- ✅ **Verify**: Cross-check with IMDb if Wikipedia unclear
- 💾 **Save often**: Don't lose your work!

---

## 🔍 WHERE TO FIND DATA

### Telugu Names:
1. **Wikipedia** (first line or infobox) - 90% success rate
2. **IMDb** (sometimes shows Telugu name)
3. **Movie credits** (if listed on site)
4. **Google translate** ❌ (not recommended - use only as last resort)

### Awards:
1. **Wikipedia "Awards" section** - Primary source
2. **IMDb Awards page** - Backup verification
3. **Official award websites**:
   - National Film Awards: https://dff.gov.in/
   - Filmfare Awards: Search "Filmfare South [Celebrity Name]"
   - Nandi Awards: Wikipedia list pages
4. **News articles** (for recent awards)

---

## 📊 PROGRESS TRACKING

### Telugu Names Batch 1
- [ ] Profiles 1-10 (30-40 mins)
- [ ] Profiles 11-20 (30-40 mins)
- [ ] Profiles 21-30 (30-40 mins)
- [ ] Profiles 31-40 (30-40 mins)
- [ ] Profiles 41-50 (30-40 mins)
- [ ] Import batch: `npx tsx scripts/import-telugu-names-batch.ts`

**Total**: ~2-3 hours

### Awards Batch 1
- [ ] Profiles 1-5 (1-1.5 hours)
- [ ] Profiles 6-10 (1-1.5 hours)
- [ ] Profiles 11-15 (1-1.5 hours)
- [ ] Profiles 16-20 (1-1.5 hours)
- [ ] Create import SQL (with help)

**Total**: ~5-6 hours

---

## 🎯 MILESTONES

### After Telugu Names (50 profiles)
- ✅ Completeness: **~66%** (from 65%)
- ✅ Core Identity: **79%** (from 69%)
- ✅ 50 more profiles have proper Telugu representation

### After Awards (20 profiles)
- ✅ Completeness: **~68%** (from 66%)
- ✅ Advanced Enrichment: **50%** (from 41%)
- ✅ 20 legends have comprehensive award histories
- ✅ Multiple profiles reach "Premium" status

### Combined Impact
- ✅ **68% completeness** achieved
- ✅ **~70 profiles significantly improved**
- ✅ **6-8 new Premium profiles** expected
- ✅ **Database quality vastly improved**

---

## 🚨 COMMON ISSUES & SOLUTIONS

### Issue: Wikipedia page doesn't exist
**Solution**: 
1. Try Google search: "[Celebrity Name] Telugu actor Wikipedia"
2. Check IMDb instead
3. Skip and mark in notes column

### Issue: Telugu name not on Wikipedia
**Solution**:
1. Check IMDb
2. Check movie posters/credits
3. Skip and mark "No Telugu name found" in notes

### Issue: Multiple awards, unsure which to include
**Solution**: Include all of these categories:
- National Film Awards ✅
- Padma Awards ✅
- Filmfare Awards South ✅
- Nandi Awards ✅
- SIIMA Awards ✅
- State Awards ✅
- Lifetime Achievement ✅

Skip:
- Minor regional awards ❌
- TV awards ❌
- Nominations ❌

### Issue: Unsure about award year
**Solution**:
1. Cross-check with IMDb
2. Search "[Celebrity Name] [Award Name] [Year]" on Google
3. If still unsure, add note: "Year uncertain - needs verification"

---

## ⚡ QUICK COMMANDS

### Check progress:
```bash
# Count completed Telugu names
grep "DONE" docs/manual-review/TELUGU-NAMES-BATCH-1.tsv | wc -l

# Count completed awards
grep "DONE" docs/manual-review/AWARDS-RESEARCH-BATCH-1.tsv | wc -l
```

### Import Telugu names:
```bash
npx tsx scripts/import-telugu-names-batch.ts
```

### Verify import:
```bash
# Check how many profiles now have Telugu names
npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { count } = await supabase.from('celebrities').select('*', { count: 'exact', head: true }).not('name_te', 'is', null);
  console.log('Profiles with Telugu names:', count);
})();
"
```

---

## 📞 NEED HELP?

### If you get stuck:
1. **Skip the difficult one** - mark "SKIPPED" in status
2. **Add detailed notes** - explain what you tried
3. **Move to next profile** - don't waste time
4. **Ask for help** - we can tackle difficult ones together

### If you want to stop:
1. **Save your work** in the TSV file
2. **Import what you've done**: Run import script
3. **Resume later** - TSV tracks progress with DONE/PENDING

---

## 🎉 READY TO START?

### Recommended approach:
1. **Start with Telugu names** (easier, faster)
2. **Do 10 profiles** → Import → Verify
3. **Do another 10** → Import → Verify
4. **Continue until 50 done**
5. **Then start awards** (more detailed work)

### Time commitment:
- **Session 1**: 1 hour → 15-20 Telugu names
- **Session 2**: 1 hour → 15-20 Telugu names
- **Session 3**: 1 hour → 10-15 Telugu names
- **Session 4**: 1.5 hours → 5 award profiles
- **Session 5**: 1.5 hours → 5 award profiles
- **Session 6**: 1.5 hours → 5 award profiles
- **Session 7**: 1.5 hours → 5 award profiles

**Total**: ~8 hours spread across 7 sessions

---

## 🚀 WHEN YOU'RE READY

Open the files and start:
```bash
open docs/manual-review/TELUGU-NAMES-BATCH-1.tsv
open docs/manual-review/AWARDS-RESEARCH-BATCH-1.tsv
```

Or just ping me when you want to start, and I'll guide you through the first few!

---

*Good luck! Remember: Every profile you research makes the Telugu cinema database better! 🎬*
