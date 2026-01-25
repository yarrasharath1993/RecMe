# Telugu Titles - Batch Translation Guide

**Date:** 1/15/2026  
**Total Pending:** 953 movies  
**Total Batches:** 22 batches  
**Batch Size:** ~50 movies per batch

---

## 🎯 Batch Overview

| Batch | Category | Priority | Count | File |
|-------|----------|----------|-------|------|
| 1 | 2024-Recent | HIGH | 50 | `batch-01-2024-Recent-1of4.csv` |
| 2 | 2024-Recent | HIGH | 50 | `batch-02-2024-Recent-2of4.csv` |
| 3 | 2024-Recent | HIGH | 50 | `batch-03-2024-Recent-3of4.csv` |
| 4 | 2024-Recent | HIGH | 11 | `batch-04-2024-Recent-4of4.csv` |
| 5 | 2023 | HIGH | 50 | `batch-05-2023-1of3.csv` |
| 6 | 2023 | HIGH | 50 | `batch-06-2023-2of3.csv` |
| 7 | 2023 | HIGH | 36 | `batch-07-2023-3of3.csv` |
| 8 | 2025-Upcoming | MEDIUM | 50 | `batch-08-2025-Upcoming-1of2.csv` |
| 9 | 2025-Upcoming | MEDIUM | 41 | `batch-09-2025-Upcoming-2of2.csv` |
| 10 | 2026-Upcoming | MEDIUM | 20 | `batch-10-2026-Upcoming-1of1.csv` |
| 11 | 2022 | MEDIUM | 50 | `batch-11-2022-1of3.csv` |
| 12 | 2022 | MEDIUM | 50 | `batch-12-2022-2of3.csv` |
| 13 | 2022 | MEDIUM | 27 | `batch-13-2022-3of3.csv` |
| 14 | 2021 | LOW | 50 | `batch-14-2021-1of3.csv` |
| 15 | 2021 | LOW | 50 | `batch-15-2021-2of3.csv` |
| 16 | 2021 | LOW | 41 | `batch-16-2021-3of3.csv` |
| 17 | Before-2021 | LOW | 50 | `batch-17-Before-2021-1of6.csv` |
| 18 | Before-2021 | LOW | 50 | `batch-18-Before-2021-2of6.csv` |
| 19 | Before-2021 | LOW | 50 | `batch-19-Before-2021-3of6.csv` |
| 20 | Before-2021 | LOW | 50 | `batch-20-Before-2021-4of6.csv` |
| 21 | Before-2021 | LOW | 50 | `batch-21-Before-2021-5of6.csv` |
| 22 | Before-2021 | LOW | 27 | `batch-22-Before-2021-6of6.csv` |

---

## 📋 How to Use

### Step 1: Pick a Batch
Start with **HIGH priority** batches (2024, 2023) for maximum impact.

### Step 2: Fill Telugu Titles
Open the batch CSV file and fill the "Title (Telugu - FILL THIS)" column.

### Step 3: Save the Batch
Save your changes after completing each batch.

### Step 4: Import to Main File
Once you've completed batches, let me know and I'll merge them back into the main file.

---

## 🔥 Recommended Order

1. **Start Here:** Batch 1-4 (2024 Recent - HIGH)
2. **Then:** Batch 5-7 (2023 - HIGH)
3. **Next:** Upcoming 2025-2026 (MEDIUM)
4. **Later:** 2021-2022 (MEDIUM/LOW)
5. **Final:** Before 2021 (LOW)

---

## 📊 Progress Tracking

- [ ] Batch 01 ✓ (50 movies)
- [ ] Batch 02 (50 movies)
- [ ] Batch 03 (50 movies)
... (continue for all 22 batches)

---

## 💡 Tips

1. **Focus on one batch at a time** - Don't get overwhelmed
2. **Use Google Translate as reference** - But verify accuracy
3. **Check existing movies** - See how similar titles were translated
4. **Mark unclear ones** - Add a note if you're unsure about a translation
5. **Take breaks** - This is a lot of work!

---

## 📞 Next Steps

After completing batches, run:
```bash
npx tsx scripts/merge-telugu-batches.ts
```

This will merge all completed batches back into the main CSV file.

---

**You've got this! 🚀**
