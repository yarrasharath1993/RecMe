# After Running multi-cast-migration.sql — What to Do Next

You already ran **multi-cast-migration.sql** (columns + indexes). Next: backfill data, then update code.

---

## Step 1: Backfill heroes and heroines (data)

The SQL you ran **only added columns**; it did not copy data from `hero`/`heroine` into `heroes`/`heroines`.

**Run this in Supabase SQL Editor:**

Open **`migrations/backfill-heroes-heroines.sql`** and run its contents. It will:

- Set `heroes = ARRAY[hero]` for rows with a single hero (and empty `heroes`)
- Split comma-separated `hero` into `heroes[]` where needed
- Do the same for `heroine` → `heroines`

**Or** use the script (only handles comma-separated; single-hero still need the SQL above):

```bash
npx tsx scripts/migrate-to-multi-cast-schema.ts --dry-run   # preview
npx tsx scripts/migrate-to-multi-cast-schema.ts             # apply (comma-separated only)
```

Then run **`migrations/backfill-heroes-heroines.sql`** to fill single-hero/heroine rows.

---

## Step 2: Types

**File:** `types/reviews.ts` (and any other place `Movie` is defined)

- Add: `heroes?: string[]` and `heroines?: string[]`
- Keep: `hero?: string` and `heroine?: string`

---

## Step 3: Cast parser (so UI shows Hero 1, Hero 2, etc.)

**File:** `lib/utils/cast-parser.ts`

- In **`MovieCastData`**, add `heroes?: string[]` and `heroines?: string[]`.
- In **`parseCastMembers`**:
  - If `movie.heroes?.length`, build the hero list from `movie.heroes` (label "Hero 1", "Hero 2", …).
  - Else keep current logic: `splitNames(movie.hero)` and supporting_cast with type `hero2`, etc.
  - Same for heroines: if `movie.heroines?.length`, use `movie.heroines`; else `splitNames(movie.heroine)` and supporting_cast.

---

## Step 4: Profile API (filmography by person)

**File:** `app/api/profile/[slug]/route.ts`

- Where you query movies by person (hero/heroine/director/…):
  - Keep existing `hero`/`heroine` conditions.
  - Add: include movies where `heroes` or `heroines` contains the person (e.g. Supabase `heroes.cs.{name}` or filter in app after fetch).

---

## Step 5: Movie page (select new columns)

**File:** `app/movies/[slug]/page.tsx` (and any query that loads a single movie)

- In the movie **select** query, add `heroes` and `heroines`.
- Display is already via `parseCastMembers(movie)`; once Step 3 is done, "Hero 1, Hero 2, Heroine 1, Heroine 2" will show when those arrays are set.

---

## Step 6: Validate

```bash
npx tsx scripts/audit-movie-schema-multicast.ts
```

Then manually check:

- One **single-hero** movie: still shows one hero.
- One **multi-hero** movie (e.g. Seethamma Vakitlo Sirimalle Chettu): shows Hero 1, Hero 2, Heroine 1, Heroine 2.
- **Profile** of each hero/heroine: filmography includes that movie.

---

## Order summary

| # | What |
|---|------|
| 1 | Run **`migrations/backfill-heroes-heroines.sql`** in Supabase (and optionally the migrate script first for comma-separated) |
| 2 | Add **`heroes?`, `heroines?`** to Movie types |
| 3 | Update **`lib/utils/cast-parser.ts`** to use `heroes`/`heroines` when present |
| 4 | Update **Profile API** to match on `heroes`/`heroines` |
| 5 | Add **`heroes`, `heroines`** to movie select in movie page (and list APIs if any) |
| 6 | Run audit script and manual tests |

Start with **Step 1** (backfill), then **2 → 3 → 4 → 5 → 6**.
