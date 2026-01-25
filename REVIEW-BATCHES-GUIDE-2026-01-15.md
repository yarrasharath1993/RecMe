# Review Batches Guide - 210 Telugu Movies

**Generated:** January 15, 2026  
**Total Movies:** 210 (Excellent: 89, Good: 121)

---

## ✅ Files Created

All files are in the `review-batches/` folder:

### Batch Files (for review)
1. **batch-1-of-5.csv** - 50 movies (2025-1988) - **ALL EXCELLENT ⭐⭐⭐**
2. **batch-2-of-5.csv** - 50 movies (2018-1987) - 39 Excellent, 11 Good
3. **batch-3-of-5.csv** - 50 movies (2002-2018) - ALL GOOD ⭐⭐
4. **batch-4-of-5.csv** - 50 movies (1978-2002) - ALL GOOD ⭐⭐
5. **batch-5-of-5.csv** - 10 movies (1953-1977) - ALL GOOD ⭐⭐

### Reference Files
- **ALL-MOVIES-MASTER.csv** - All 210 movies in one file (for quick search)
- **REVIEW-SUMMARY.txt** - Complete review checklist and instructions

---

## 📊 Batch Breakdown

### Batch 1: PRIORITY (50 movies) ⭐⭐⭐
- **Quality:** All Excellent (complete data)
- **Years:** 2025 - 1988 (newest)
- **Status:** Ready to publish immediately
- **Review Focus:** Quick verification only
  - Check hero/director names for duplicates
  - Verify ratings seem reasonable
  - Spot check a few titles on IMDb

### Batch 2: HIGH PRIORITY (50 movies)
- **Quality:** 39 Excellent, 11 Good
- **Years:** 2018 - 1987
- **Status:** Mostly ready
- **Review Focus:** 
  - The 11 "Good" movies need closer look
  - Check missing fields (poster/rating)

### Batches 3-5: MODERATE PRIORITY (110 movies) ⭐⭐
- **Quality:** All Good (missing one field)
- **Years:** 1953 - 2018 (older films)
- **Status:** Publishable but could be improved
- **Review Focus:**
  - Check what's missing (usually poster or music director)
  - Add data if easily available
  - Accept as-is if hard to find

---

## 📋 CSV Columns Explained

| Column | Description | Check For |
|--------|-------------|-----------|
| **ID** | Database ID | - |
| **Title (English)** | English title | Correct spelling, no typos |
| **Title (Telugu)** | Telugu title | Add if missing |
| **Year** | Release year | Not future (unless upcoming) |
| **Language** | All should be Telugu | Should be "Telugu" |
| **Quality** | Excellent or Good | - |
| **Hero** | Lead actor(s) | Correct name, check duplicates |
| **Heroine** | Lead actress(es) | Correct name |
| **Director** | Director name | Correct spelling |
| **Music Director** | Music composer | Add if missing & known |
| **Producer** | Producer | Optional |
| **Writer** | Screenplay writer | Optional |
| **Cinematographer** | DOP | Optional |
| **Editor** | Film editor | Optional |
| **Our Rating** | 1-10 rating | Seems reasonable? |
| **TMDB Rating** | TMDB average | Compare with our rating |
| **Has Poster** | YES/NO | - |
| **Poster URL** | Image URL | Test a few URLs |
| **Genres** | Movie genres | Correct? |
| **Duration (min)** | Runtime | Reasonable? |
| **TMDB ID** | TMDB ID | - |
| **IMDb ID** | IMDb ID | - |
| **Slug** | URL slug | - |
| **Issues/Notes** | Auto-detected issues | Review these |

---

## 🔍 Review Checklist

### For Each Movie:

#### 1. ✅ Critical Fields (Must Have)
- [ ] Title exists and is correct
- [ ] Year is valid (not 9999 or future)
- [ ] Language is "Telugu"
- [ ] Has Hero OR Director
- [ ] Has Rating OR Poster

#### 2. ⚠️ Important Fields (Should Have)
- [ ] Hero name is correct (not duplicate actor)
- [ ] Director name is correct
- [ ] Rating is reasonable (1-10, not 0 or suspicious)
- [ ] Poster URL works

#### 3. 💡 Nice to Have
- [ ] Heroine listed
- [ ] Music director listed
- [ ] Telugu title available
- [ ] Genres are correct

---

## 🚨 Common Issues to Watch For

### 1. Duplicate Actor Names
**Problem:** Same actor with different names
```
❌ "Krishna" vs "Superstar Krishna"
❌ "Nagarjuna Akkineni" vs "Akkineni Nagarjuna"
❌ "NTR" vs "N. T. Rama Rao" vs "Nandamuri Taraka Rama Rao"
```
**Solution:** Use consistent name format from celebrities table

### 2. Multi-Cast Movies
**Problem:** Multiple heroes in one field
```
"Akkineni Nagarjuna, Allari Naresh"
```
**Status:** Currently OK (will be fixed in multi-cast migration)

### 3. Wrong Primary Hero
**Problem:** Supporting actor listed as hero
```
Movie: "Manam"
Hero: Should be "Nagarjuna" not "Naga Chaitanya"
```
**Solution:** Verify on IMDb, use top-billed actor

### 4. Rating Anomalies
**Watch out for:**
- Rating = 0 (usually means not rated)
- Rating = 10 (suspiciously perfect)
- Rating < 3 for popular movies
- Rating > 8 for unknown movies

### 5. Missing Telugu Titles
- Not critical, but nice to have
- Add if you know it
- Skip if takes too long to find

---

## 📝 Review Process

### Recommended Approach

#### Phase 1: Batch 1 (Excellent Movies) - 30 minutes
1. Open `batch-1-of-5.csv` in Excel/Google Sheets
2. Quick scan through all 50 movies
3. Look for obvious errors:
   - Duplicate actor names
   - Suspicious ratings
   - Wrong years
4. Mark issues in "Issues/Notes" column
5. Count: How many are approved?

#### Phase 2: Batch 2 (Mixed) - 45 minutes
1. Same process as Batch 1
2. Pay extra attention to 11 "Good" movies
3. Check what's missing
4. Decide if acceptable or needs enrichment

#### Phase 3: Batches 3-5 (Good Movies) - 2 hours
1. Review 110 movies in 3 batches
2. Focus on major issues only
3. Don't spend time on minor details
4. Acceptable gaps: poster, music director, heroine

### Time Estimate
- **Quick review:** 3-4 hours total
- **Thorough review:** 6-8 hours total
- **Perfect review:** 10-12 hours total

**Recommendation:** Start with quick review of Batch 1 only (30 mins)

---

## ✅ Approval Categories

After review, categorize movies as:

### A. APPROVED FOR PUBLISHING
- All critical data verified
- No major issues found
- Ready to go live immediately

### B. APPROVED WITH NOTES
- Minor issues (e.g., missing heroine)
- Not critical, can publish
- Fix later if needed

### C. NEEDS FIXES
- Critical issues found
- Must fix before publishing
- Example: Wrong hero, wrong year

### D. REJECT/DELETE
- Wrong movie entirely
- Duplicate of published movie
- Invalid data

---

## 📊 Expected Results

### Optimistic Scenario
- Batch 1 (Excellent): 48-50 approved (96-100%)
- Batch 2 (Mixed): 45-48 approved (90-96%)
- Batches 3-5 (Good): 95-105 approved (86-95%)
- **Total:** 188-203 approved (90-97%)

### Realistic Scenario
- Batch 1 (Excellent): 45-48 approved (90-96%)
- Batch 2 (Mixed): 40-45 approved (80-90%)
- Batches 3-5 (Good): 85-95 approved (77-86%)
- **Total:** 170-188 approved (81-90%)

### Conservative Scenario
- Batch 1 (Excellent): 40-45 approved (80-90%)
- Batch 2 (Mixed): 35-40 approved (70-80%)
- Batches 3-5 (Good): 70-85 approved (64-77%)
- **Total:** 145-170 approved (69-81%)

**Even conservative scenario = 145+ movies published!** 🎉

---

## 💻 How to Review in Excel

### Opening the File
1. Double-click `batch-1-of-5.csv`
2. Should open in Excel/Numbers/Google Sheets
3. If not, right-click → Open With → Excel

### Useful Excel Tricks

#### Filter by Quality
1. Click header row
2. Data → Filter
3. Click "Quality" column filter
4. Show only "Excellent" or "Good"

#### Sort by Year
1. Click any cell in Year column
2. Data → Sort → Descending

#### Highlight Issues
1. Click "Issues/Notes" column
2. Conditional Formatting
3. Highlight cells that contain text

#### Add Comments
1. Right-click cell
2. Insert Comment
3. Type your notes

### Keyboard Shortcuts
- **Tab** - Move to next cell
- **Shift+Tab** - Move to previous cell
- **Ctrl+F** (Cmd+F on Mac) - Find
- **Ctrl+H** - Find and replace

---

## 🎯 Quick Start Guide

### 5-Minute Quick Start

```bash
# 1. Navigate to review folder
cd review-batches/

# 2. Open first batch
open batch-1-of-5.csv

# 3. Quick scan:
- Scroll through all 50 movies
- Look for red flags
- Note any obvious errors

# 4. Report back:
"Reviewed Batch 1: X approved, Y need fixes, Z rejected"
```

### After Review

**Tell me:**
1. Which batch(es) you reviewed
2. How many approved
3. List of issues found
4. Which movies need fixes

**Then I'll:**
1. Create fix script for issues
2. Publish approved movies
3. Move to next batch

---

## 📞 Support

**If you find issues:**
- Tell me which batch and row number
- Describe the problem
- I'll create fix scripts

**Common requests:**
- "Fix duplicate hero names in batch X"
- "Add missing music directors to batch Y"
- "Delete movie Z, it's a duplicate"

---

## 🚀 Next Steps

1. **Right now:** Open `batch-1-of-5.csv` in Excel
2. **Spend 30 mins:** Quick review of 50 movies
3. **Report back:** How many look good?
4. **Then:** Publish approved movies immediately
5. **Later:** Review remaining batches at your pace

**Goal:** Get first 50 movies published today! 🎬

---

## Summary

✅ **Created:** 5 batch CSVs (50 movies each) + master CSV  
✅ **Total:** 210 movies ready for review  
✅ **Quality:** 89 excellent, 121 good  
✅ **Time:** 30 mins for Batch 1, 3-4 hours for all  

**Start with Batch 1 - it's the highest quality and easiest to review!**
