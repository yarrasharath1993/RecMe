# 🎬 Start Manual Poster Hunt - Quick Guide

**Goal**: Find posters for 678 Telugu movies  
**Time**: 2-3 hours total  
**Expected Results**: 270-350 posters found  

---

## ✅ Step 1: Get Your Tools Ready (2 minutes)

1. **Open the CSV**:
   ```bash
   open MANUAL-POSTER-RESEARCH-678.csv
   ```
   Or open in Excel/Google Sheets

2. **Bookmark these sites** (right-click → Bookmark):
   - Google Images: https://images.google.com
   - IMDb: https://www.imdb.com
   - TeluguOne: https://www.teluguone.com
   - Letterboxd: https://letterboxd.com
   - Pinterest: https://pinterest.com

3. **Set up your workspace**:
   - CSV open on one screen
   - Browser on another screen (or split screen)
   - Keep `MANUAL-POSTER-RESEARCH-GUIDE.md` open for reference

---

## ✅ Step 2: Start With Easy Wins (30-45 minutes)

### Focus on 2000s-2010s Films (48 movies)

For each movie in the CSV from years 2000-2019:

1. **Google Images**: Search `"[Movie Title]" Telugu poster [Year]`
2. **Found a good poster?**
   - Right-click → Copy image address
   - Paste URL in `poster_url_found` column
   - Add source: `google_images`
   - Add quality note: `high` / `medium` / `low`
3. **Not found?** Try IMDb (if tmdb_id exists):
   - Go to `https://www.imdb.com/title/tt[tmdb_id]/mediaindex/`
   - Look for "Poster" section
   - Copy image URL
4. **Still not found?** Skip for now, move to next

**Target**: 35 posters in 45 minutes

---

## ✅ Step 3: Modern Era (45-60 minutes)

### Focus on 1990s Films (127 movies)

Try these sources in order:
1. Google Images (10 sec)
2. TeluguOne search (20 sec)
3. Letterboxd (15 sec)

**Quick searches**:
```
Google: "Gharshana 1988" Telugu poster
TeluguOne: Search → Movies → [Movie name]
Letterboxd: https://letterboxd.com/search/Gharshana/
```

**Target**: 60-80 posters in 60 minutes

---

## ✅ Step 4: Classic Era (60-90 minutes)

### Focus on 1980s Films (216 movies)

**Pro tip**: Batch by actor!

Example - If Chiranjeevi has 20 films:
1. Search: "Chiranjeevi filmography posters"
2. Find a page with all his posters
3. Match and fill 20 rows at once!

**Sources to try**:
- Google Images (advanced: file type = JPEG, size = large)
- Pinterest collections
- Instagram hashtags: #TeluguCinemaHistory #VintagePosters

**Target**: 100-130 posters in 90 minutes

---

## ✅ Step 5: Import Your Findings (5 minutes)

When you've filled the CSV with poster URLs:

1. **Dry run first** (check for errors):
   ```bash
   npx tsx scripts/import-manual-posters.ts MANUAL-POSTER-RESEARCH-678.csv
   ```

2. **Review the output**:
   - Check invalid URLs
   - Fix any issues in CSV

3. **Import for real**:
   ```bash
   npx tsx scripts/import-manual-posters.ts MANUAL-POSTER-RESEARCH-678.csv --execute
   ```

4. **Check results**:
   ```bash
   npx tsx scripts/quick-status.ts
   ```

---

## 🎯 CSV Format Example

Your CSV should look like this after research:

```csv
decade,year,title_en,hero,director,tmdb_id,slug,poster_url_found,source,notes
2010s,2015,"Baahubali","Prabhas","S.S. Rajamouli",12345,baahubali-2015,https://image.tmdb.org/t/p/w500/abc123.jpg,google_images,high quality
1990s,1995,"Anji","Chiranjeevi","Kodi Ramakrishna",,anji-1995,https://i.pinimg.com/originals/xyz.jpg,pinterest,medium quality
1980s,1985,"Challenge","Chiranjeevi","A. Kodandarami Reddy",,challenge-1985,https://example.com/poster.jpg,teluguone,high quality
```

**Important**: Only fill rows where you found posters!

---

## 💡 Pro Tips

### 1. Use Keyboard Shortcuts
- `Ctrl+C` - Copy
- `Ctrl+V` - Paste
- `Ctrl+F` - Find in page
- `Tab` - Next cell in Excel/Sheets

### 2. Google Image Search Tricks
```
"exact movie title" Telugu poster
movie title [year] original poster
"actor name" filmography poster
vintage telugu poster [movie name]
```

### 3. When Stuck
- Try alternate spellings
- Search by director's filmography
- Look for DVD/VHS covers on eBay
- Check Pinterest boards for vintage collections
- Post in Telugu cinema Facebook groups

### 4. Quality Check
✅ **Good poster**:
- Clear image (not blurry)
- 500px+ width
- Original poster design
- Colors look good

❌ **Bad poster**:
- Screenshot from movie
- Too small (<300px)
- Wrong movie
- Heavily watermarked

---

## 📊 Track Your Progress

Keep a running tally:

```
Session 1 (Day 1):
- 2010s: 8/9 found ✅
- 2000s: 35/39 found ✅
- 1990s (partial): 30/127 found 🟡
Total: 73 posters (1 hour)

Session 2 (Day 1):
- 1990s (complete): 90/127 found ✅
- 1980s (partial): 60/216 found 🟡
Total: 150 posters (2 hours)

... and so on
```

---

## 🎬 Ready? Let's Go!

1. ✅ Open `MANUAL-POSTER-RESEARCH-678.csv`
2. ✅ Bookmark the sources
3. ✅ Start with 2010s films (easy wins)
4. ✅ Work your way backwards in time
5. ✅ Import when done

---

## 📞 Questions?

Refer to:
- **Full Guide**: `MANUAL-POSTER-RESEARCH-GUIDE.md`
- **Import Help**: `scripts/import-manual-posters.ts --help`
- **Progress Check**: `npx tsx scripts/quick-status.ts`

---

**Good luck with your poster hunt! 🎯**

Every poster you find helps preserve Telugu cinema history! 🏆
