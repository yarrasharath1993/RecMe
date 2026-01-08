# Rating Anomaly Report

Generated: 2026-01-07

## Fixed Movies

| Movie | Before | After | Action |
|-------|--------|-------|--------|
| Annamayya (1997) | 6.0 | 8.7 | Increased - National Award winner classic |
| Malini & Co (2015) | 9.5 | 5.5 | Decreased - Average thriller, not a masterpiece |

## 1. Classics Rated Below 7

**Total found: 1,453 movies**

These are marked as `is_classic=true` but have `our_rating < 7`. Most have ratings of 5-6 which are likely too low for classic films.

**Action needed:** Manual review to assign appropriate ratings (likely 7.5-9.0 for true classics)

### Sample (first 20):

| Title | Year | our_rating | avg_rating | Slug |
|-------|------|------------|------------|------|
| Muggure Mugguru | 1978 | 5 | 0 | muggure-mugguru-1978 |
| Bhishma | 1944 | 5 | 0 | bhishma-1944 |
| Nindu Manishi | 1978 | 5 | 0 | nindu-manishi-1978 |
| Katakataala Rudraiah | 1978 | 5 | 0 | katakataala-rudraiah-1978 |
| Bhookailas | 1940 | 5 | 0 | bhookailas-1940 |
| Bhakta Prahlada | 1942 | 5 | 0 | bhakta-prahlada-1942 |
| Sumangali | 1940 | 5 | 0 | sumangali-1940 |
| Yogi Vemana | 1947 | 5 | 0 | yogi-vemana-1947 |

## 2. Non-Classic Films Rated 9+

**Total found: 2 movies**

These films are NOT marked as classics or blockbusters but have inflated ratings of 9+.

**Action needed:** Decrease ratings to realistic levels (likely 6-7.5)

| Title | Year | our_rating | avg_rating | Slug |
|-------|------|------------|------------|------|
| Sainma | 2015 | 9.5 | 9.9 | sainma-2015 |
| Kerintha | 2015 | 9.5 | 9.9 | kerintha-2015 |

## 3. Large Rating Discrepancies (our_rating vs avg_rating >= 2.5 points)

**Total found: 45 movies**

These have significant differences between editorial rating and TMDB/external rating.

**Action needed:** Manual review to determine correct rating

### Sample (first 20):

| Title | Year | our_rating | avg_rating | Diff | Slug |
|-------|------|------------|------------|------|------|
| Mr. Pregnant | 2023 | 5 | 2 | +3.0 | mr-pregnant-2023 |
| Punya Bhoomi Naa Desam | 1995 | 5 | 1 | +4.0 | punya-bhoomi-naa-desam-1995 |
| Fcuk: Father Chitti Umaa Kaarthik | 2021 | 5 | 1 | +4.0 | fcuk-father-chitti-umaa-kaarthik-2021 |
| Arddhanaari | 2016 | 5 | 1 | +4.0 | arddhanaari-2016 |
| Hawaa | 2019 | 5 | 1 | +4.0 | hawaa-2019 |

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| Classics rated below 7 | 1,453 | High - Review in batches |
| Inflated non-classics (9+) | 2 | High - Fix immediately |
| Large discrepancies | 45 | Medium - Manual review |

## Recommendations

1. **Immediate fixes**: Lower ratings for Sainma and Kerintha from 9.5 to realistic levels
2. **Batch review classics**: Create a script to identify truly acclaimed classics (with awards, high IMDB/TMDB ratings) and auto-increase their ratings
3. **Manual review**: The 45 discrepancy cases need human judgment
4. **Root cause**: AI review generation needs better context about film significance

