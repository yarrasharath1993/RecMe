# 🎯 ACTOR ATTRIBUTION AUDIT - QUICK START

## 📊 CURRENT STATUS

✅ **Audit Running:** 23/100 actors complete (ETA: ~15-20 minutes total)  
✅ **13 Audit Files Generated** in `attribution-audits/`  
✅ **Key Discovery:** 91% of "missing" movies EXIST in DB but need re-attribution!  

---

## 🚀 QUICK ACTIONS

### 1. Review Sample Audit (1 minute)

```bash
# See what was found for Satyanarayana
head -20 attribution-audits/satyanarayana-attribution.csv | column -t -s,

# See what was found for Rambha
head -20 attribution-audits/rambha-attribution.csv | column -t -s,
```

### 2. Test Fix on ONE Actor (2 minutes)

```bash
# DRY RUN (safe - no changes)
npx tsx scripts/apply-attribution-fixes.ts --actor=satyanarayana --dry-run

# EXECUTE (applies changes)
npx tsx scripts/apply-attribution-fixes.ts --actor=satyanarayana --execute

# VERIFY
# Check DB - Satyanarayana's movie count should jump from 13 → 51
```

### 3. Wait for Full Audit (~15 more minutes)

The audit is running in background. Check progress:

```bash
# See current progress
tail -10 full-attribution-audit.log

# Count files generated
ls -1 attribution-audits/*.csv | wc -l

# See summary when complete
grep "AUDIT SUMMARY" -A 20 full-attribution-audit.log
```

### 4. Apply All Fixes (5 minutes)

Once audit is complete:

```bash
# DRY RUN all fixes (see what would change)
npx tsx scripts/apply-attribution-fixes.ts --all --dry-run

# EXECUTE all fixes (apply changes)
npx tsx scripts/apply-attribution-fixes.ts --all --execute
```

---

## 📁 FILES STRUCTURE

```
telugu-portal/
├── attribution-audits/              # Per-actor audit reports (CSV)
│   ├── satyanarayana-attribution.csv
│   ├── k.-balachander-attribution.csv
│   ├── rambha-attribution.csv
│   └── ... (60+ files expected)
│
├── scripts/
│   ├── automated-attribution-audit.ts     # ✅ RUNNING NOW
│   └── apply-attribution-fixes.ts          # Use after audit completes
│
├── ATTRIBUTION-AUDIT-FINDINGS.md    # Detailed analysis & findings
├── ATTRIBUTION-AUDIT-README.md       # This file
├── ACTOR-AUDIT-WORKSHEET-2026-01-18.csv   # Actor priority list
└── full-attribution-audit.log        # Live audit progress log
```

---

## 📊 WHAT THE AUDIT FOUND (So Far)

| Finding | Count | % |
|---------|-------|---|
| **Movies Scraped** | ~600 | - |
| **✓ Properly Attributed** | ~60 | 9% |
| **⚠️  Needs Attribution** | ~540 | **91%** |
| **❌ Missing** | ~0 | 0% |

**Conclusion:** Movies ARE in DB. They just need actor names added to `cast_members` field!

---

## 🎬 CSV FORMAT EXPLAINED

Each actor gets a CSV file like this:

| Status | Wikipedia Title | Wiki Year | DB Movie ID | DB Title | DB Year | Current Attribution | Match % | Action |
|--------|----------------|-----------|-------------|----------|---------|-------------------|---------|--------|
| ⚠️ EXISTS_NOT_ATTRIBUTED | Manchi Donga | 1988 | b9954658... | Manchi Donga | 1988 | Not attributed | 100 | Add Satyanarayana to cast |
| ✓ OK | Kondaveeti Donga | 1990 | 8f2a4e67... | Kondaveeti Donga | 1990 | Cast: Kaikala Satyanarayana | 100 | None |
| ❌ MISSING | Some Movie | 1985 | | | | | | Create movie |

**Key Columns:**
- **Status**: ✓ OK / ⚠️ NEEDS FIX / ❌ MISSING
- **Match %**: Confidence score (100 = perfect match)
- **Action**: What needs to be done

---

## 🔧 HOW THE FIX SCRIPT WORKS

```typescript
// For each "⚠️ NEEDS ATTRIBUTION" movie:

1. Read DB movie record (e.g., "Manchi Donga")
2. Check current cast_members field (e.g., "Chiranjeevi")
3. Append actor name (e.g., "Chiranjeevi, Kaikala Satyanarayana")
4. Update database
5. Log change

// Result: Actor properly credited in cast!
```

---

## ⚠️  IMPORTANT NOTES

### Match Confidence Scores
- **100%**: Perfect title match → Safe to apply
- **90-99%**: Very high confidence → Review if unsure
- **70-89%**: Good match → Manual review recommended
- **<70%**: Not shown in audit (rejected)

### What Gets Updated
- Only the `cast_members` field is modified
- No changes to hero/heroine/director fields
- No movie creation (only attribution fixes)

### Safety
- **Dry run first:** Always test with `--dry-run`
- **Single actor test:** Use `--actor=name` to test one
- **Rollback:** Database backups recommended

---

## 📈 EXPECTED RESULTS

### Sample Actor: Kaikala Satyanarayana

**Before:**
```sql
SELECT COUNT(*) FROM movies WHERE 
  hero LIKE '%Satyanarayana%' OR 
  cast_members LIKE '%Satyanarayana%';
-- Result: 13 movies
```

**After Fix:**
```sql
SELECT COUNT(*) FROM movies WHERE 
  hero LIKE '%Satyanarayana%' OR 
  cast_members LIKE '%Satyanarayana%';
-- Result: 51 movies (+292%)
```

### Database-Wide Impact (Projected)
- **Character actors:** 300-400% increase in attributed movies
- **Supporting cast completeness:** <20% → 80%+
- **Total actor-movie links:** +2,500 attributions
- **Database readiness:** 88% → 95%+ complete

---

## 🎯 SUCCESS CHECKLIST

### Phase 1: Audit (In Progress)
- [x] Audit script running
- [x] CSV files generating
- [ ] All 100 actors processed (23/100 complete)

### Phase 2: Validation (Next)
- [ ] Review sample CSVs
- [ ] Check match quality
- [ ] Verify one actor fix works

### Phase 3: Execution (After)
- [ ] Apply fixes to all actors
- [ ] Verify database counts
- [ ] Generate "after" statistics

### Phase 4: Launch Ready (Final)
- [ ] Supporting cast 80%+ attributed
- [ ] Character actors properly credited
- [ ] Database completeness 95%+

---

## ❓ TROUBLESHOOTING

### Audit stuck or failed?
```bash
# Check process
ps aux | grep automated-attribution-audit

# Check last output
tail -50 full-attribution-audit.log

# Restart from specific actor
# (modify script to start at offset)
```

### Fix script errors?
```bash
# Check database connection
npx tsx -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Test single movie update manually
# Use Supabase dashboard
```

### Match confidence too low?
- 100% matches: Apply automatically ✅
- 90-99% matches: Safe for most cases ✅
- 70-89% matches: Manual review 👀
- <70%: Skip (not shown in CSV) ❌

---

## 🚀 NEXT STEPS

1. **Wait for audit to complete** (~15 more minutes)
2. **Review 2-3 sample CSV files** (5 minutes)
3. **Test fix on one actor** (2 minutes)
4. **Apply all fixes** (5 minutes)
5. **Verify & celebrate!** 🎉

**Questions?** See `ATTRIBUTION-AUDIT-FINDINGS.md` for detailed analysis.

---

**Status:** ✅ AUDIT IN PROGRESS - Check back in 15 minutes!
