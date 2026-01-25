# Genre Quality Audit - Fix Suggestions
**Date:** 2026-01-13
**Total Movies:** 7,398
**Issues Found:** 2,034
**Quality Score:** 72.5%

---

## 🔴 CRITICAL: Non-Standard Genres (11 movies)

These movies use non-standard genre names that should be mapped to standard genres:

### Genre Mapping Suggestions:

```
"Art" → "Drama"
"Biographical" → "Drama"
"Biography" → "Drama"
"Mass" → "Action"
"Sports" → "Drama"
"Biopic" → "Drama"
"Historical" → "History"
"Sci-Fi" → "Science Fiction"
"Suspense" → "Thriller"
"Teen" → "Drama"
"Supernatural" → "Fantasy"
"Epic" → "Adventure"
```

### Movies Affected:


#### "TV Movie" (10 movies) → Should be: **❓ NEEDS MAPPING**

- Rishi (2017) - Genres: [Drama, Adventure, TV Movie]
  `http://localhost:3000/movies/rishi-2017`
- Happy (2006) - Genres: [TV Movie, Drama]
  `http://localhost:3000/movies/happy-2006`
- Something the Lord Made (2004) - Genres: [TV Movie, Drama]
  `http://localhost:3000/movies/something-the-lord-made-2004`
- Kanoon Ki Awaaz (1989) - Genres: [Romance, Comedy, TV Movie]
  `http://localhost:3000/movies/kanoon-ki-awaaz-1989`
- Maharaju (1985) - Genres: [TV Movie, Drama]
  `http://localhost:3000/movies/maharaju-1985`
- Simhapuri Simham (1983) - Genres: [TV Movie, Adventure, Science Fiction]
  `http://localhost:3000/movies/simhapuri-simham-1983`
- Jeevitha Ratham (1981) - Genres: [Comedy, TV Movie]
  `http://localhost:3000/movies/jeevitha-ratham-1981`
- Viswaroopam (1981) - Genres: [Drama, TV Movie]
  `http://localhost:3000/movies/viswaroopam-1981`
- Nayakudu Vinayakudu (1980) - Genres: [Drama, TV Movie]
  `http://localhost:3000/movies/nayakudu-vinayakudu-1980`
- Kaali (1980) - Genres: [Thriller, Mystery, TV Movie]
  `http://localhost:3000/movies/kaali-1980`

#### "Spy" (1 movies) → Should be: **❓ NEEDS MAPPING**

- Gamattu Gudachari (1978) - Genres: [Spy, Thriller]
  `http://localhost:3000/movies/gamattu-gudachari-1978`

---

## 🟡 MEDIUM: TMDB Enrichment Opportunities (807 movies)

These movies have TMDB IDs but only generic single genres. Can be auto-enriched:

- Illicit Relationship (null) - TMDB: 857695
- Naa Katha (null) - TMDB: 1338987
- Inner City Blues (null) - TMDB: 871062
- Vanaveera (2026) - TMDB: 1412497
- Lenin (2026) - TMDB: 1408170
- Aakasam Lo Oka Tara (2026) - TMDB: 1322273
- Anantha (2026) - TMDB: 1608579
- Shambhala (2025) - TMDB: 1531435
- 1000 Waala (2025) - TMDB: 1437107
- Guard: Revenge for Love (2025) - TMDB: 1234172
- Arjun Chakravarthy (2025) - TMDB: 1541316
- Die My Love (2025) - TMDB: 1033148
- Goodbye June (2025) - TMDB: 1435092
- Vaamana (2025) - TMDB: 927224
- Daaku Maharaaj (2025) - TMDB: 1202235
- Paradha (2025) - TMDB: 1280611
- Robinhood (2025) - TMDB: 1120762
- Akhanda 2: Thaandavam (2025) - TMDB: 1372588
- Maa Nanna Superhero (2024) - TMDB: 1357414
- Sriranga Neethulu (2024) - TMDB: 1274480
- Dheera (2024) - TMDB: 1034187
- Ground (2024) - TMDB: 1302681
- Krishnamma (2024) - TMDB: 1001632
- Raajadhani Files (2024) - TMDB: 1243124
- Aattam (2024) - TMDB: 957926
- Pekamedalu (2024) - TMDB: 1317583
- Sam Anton (2024) - TMDB: 608317
- Laggam (2024) - TMDB: 1375193
- Utsavam (2024) - TMDB: 1237537
- Sheeshmahal (2024) - TMDB: 563152
- Akshara (2024) - TMDB: 408097
- Narudi Brathuku Natana (2024) - TMDB: 1376117
- Sarkaaru Noukari (2024) - TMDB: 1229853
- Committee Kurrollu (2024) - TMDB: 1327213
- Prathinidhi 2 (2024) - TMDB: 1277697
- Drinker Sai (2024) - TMDB: 1407473
- Double Engine (2024) - TMDB: 1026439
- Leela Vinodam (2024) - TMDB: 1396917
- Zebra (2024) - TMDB: 1407977
- Ruslaan (2024) - TMDB: 1196940
- Anthima Theerpu (2024) - TMDB: 1093029
- Saachi (2023) - TMDB: 1228860
- Kill Shot (2023) - TMDB: 1134055
- 12th Fail (2023) - TMDB: 1163258
- Simón (2023) - TMDB: 1105832
- Kaathal - The Core (2023) - TMDB: 1029947
- Karna (2023) - TMDB: 680017
- Panchatantra Kathalu (2022) - TMDB: 1006335
- Mukundan Unni Associates™ (2022) - TMDB: 591926
- Darja (2022) - TMDB: 954512

... and 757 more

---

## Top 20 Genres by Frequency

| Genre | Count | Status |
|-------|-------|--------|
| Drama | 4,845 | ✅ Valid |
| Romance | 3,144 | ✅ Valid |
| Family | 1,931 | ✅ Valid |
| Action | 1,874 | ✅ Valid |
| Comedy | 1,618 | ✅ Valid |
| Thriller | 1,128 | ✅ Valid |
| Crime | 653 | ✅ Valid |
| Adventure | 274 | ✅ Valid |
| Mythological | 266 | ✅ Valid |
| Mystery | 233 | ✅ Valid |
| Fantasy | 222 | ✅ Valid |
| Horror | 208 | ✅ Valid |
| Social | 199 | ✅ Valid |
| Documentary | 169 | ✅ Valid |
| Music | 137 | ✅ Valid |
| Science Fiction | 124 | ✅ Valid |
| History | 122 | ✅ Valid |
| Animation | 111 | ✅ Valid |
| War | 66 | ✅ Valid |
| Period | 40 | ✅ Valid |
