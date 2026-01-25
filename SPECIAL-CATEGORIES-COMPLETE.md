# Special Movie Categories - Complete List

## Overview
10 special watch categories have been implemented to help users find movies based on their mood and viewing context.

---

## All Categories

### 1. 🎭 Stress Buster
- **Slug**: `stress-buster`
- **Description**: Light, feel-good movies to lift your mood
- **Criteria**: Comedy/Family/Romance + Rating ≥ 7.0 + No Horror/Thriller/Crime

### 2. 🍿 Popcorn Movie
- **Slug**: `popcorn`
- **Description**: Entertaining, easy-watch films perfect for casual viewing
- **Criteria**: Action/Thriller/Comedy/Adventure + (Blockbuster OR Action with Rating ≥ 7) + Rating ≥ 6.5

### 3. 👥 Group Watch
- **Slug**: `group-watch`
- **Description**: Movies perfect for watching with friends and family
- **Criteria**: Comedy/Action/Thriller/Adventure/Family + Rating ≥ 6.5 + Family-friendly + No Horror

### 4. 💕 Watch with Special One
- **Slug**: `watch-with-special-one`
- **Description**: Romantic and intimate movies for couples
- **Criteria**: Romance/Drama + Rating ≥ 7.0 + No Horror/Crime/Thriller

### 5. 📺 Weekend Binge
- **Slug**: `weekend-binge`
- **Description**: High-rated movies perfect for a weekend marathon
- **Criteria**: Drama/Thriller/Action + Rating ≥ 7.5
- **Estimated Movies**: ~290

### 6. 👨‍👩‍👧‍👦 Family Night
- **Slug**: `family-night`
- **Description**: Perfect movies to watch with the whole family
- **Criteria**: Family genre + Rating ≥ 7.0 + No Horror + Family-friendly
- **Estimated Movies**: ~78

### 7. 😂 Laugh Riot
- **Slug**: `laugh-riot`
- **Description**: Hilarious comedies guaranteed to make you laugh
- **Criteria**: Comedy + Rating ≥ 7.0 + No Horror
- **Estimated Movies**: ~43

### 8. 🧠 Mind Benders
- **Slug**: `mind-benders`
- **Description**: Twist-filled thrillers that keep you guessing
- **Criteria**: Thriller/Mystery + Rating ≥ 7.5
- **Estimated Movies**: ~19

### 9. ⭐ Cult Classics
- **Slug**: `cult-classics`
- **Description**: Underrated gems that deserve more recognition
- **Criteria**: Underrated + Rating ≥ 7.5
- **Estimated Movies**: ~35

### 10. 👻 Horror Night
- **Slug**: `horror-night`
- **Description**: Scary horror movies for thrill seekers
- **Criteria**: Horror genre + Rating ≥ 6.0

---

## Implementation Status

✅ **Database Schema**: `special_categories TEXT[]` column ready
✅ **Auto-Detection Logic**: All 10 categories implemented
✅ **Recommend Me Modal**: All categories available as chips
✅ **Quick Filters**: All categories available on movies page
✅ **Sections API**: All categories appear in lazy-loaded sections
✅ **Recommendations API**: Filters and sections for all categories

---

## Next Steps

1. **Run Database Migration**:
   ```bash
   # Execute in Supabase SQL Editor:
   # add-special-categories-column.sql
   ```

2. **Auto-Tag Movies**:
   ```bash
   npx tsx scripts/auto-tag-special-categories.ts
   ```

3. **Import Manual Overrides** (if you have a CSV):
   ```bash
   npx tsx scripts/import-special-categories-csv.ts your-categories.csv
   ```

---

## CSV Format for Manual Import

```csv
title,year,categories
Baahubali,2015,popcorn,group-watch,weekend-binge
Geetha Govindam,2018,stress-buster,watch-with-special-one
```

---

## Category Groupings

### By Mood
- **Feel Good**: Stress Buster, Laugh Riot, Family Night
- **Entertainment**: Popcorn Movie, Weekend Binge, Group Watch
- **Romantic**: Watch with Special One
- **Thrilling**: Mind Benders, Horror Night
- **Hidden Gems**: Cult Classics

### By Viewing Context
- **Solo**: Stress Buster, Weekend Binge, Mind Benders, Horror Night, Cult Classics
- **Couples**: Watch with Special One
- **Family**: Family Night, Group Watch
- **Friends**: Group Watch, Popcorn Movie, Laugh Riot

---

## Notes

- Categories can overlap (a movie can belong to multiple categories)
- Auto-detection uses smart criteria based on genres, ratings, and metadata
- Manual overrides via CSV will merge with auto-detected categories
- All categories are available in:
  - Recommend Me modal
  - Movies page quick filters
  - URL parameters (`?specialCategory=stress-buster`)
  - Auto-generated sections on main page
