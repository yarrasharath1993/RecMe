# Multi-Hero / Multi-Heroine — Next Steps

Use this checklist after running **Planner** and **Antigravity**. Order matters.

---

## Step 1: Database schema and data migration

**Goal:** Add `heroes[]` and `heroines[]` and backfill from `hero`/`heroine`.

### Option A: Run SQL in Supabase

1. Open **Supabase Dashboard** → SQL Editor.
2. Run the migration that adds columns **and** backfills data (from [MULTI-HERO-SUPPORT-SUMMARY.md](../MULTI-HERO-SUPPORT-SUMMARY.md)):

```sql
-- Add columns
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroes TEXT[];
ALTER TABLE movies ADD COLUMN IF NOT EXISTS heroines TEXT[];

-- Indexes
CREATE INDEX IF NOT EXISTS idx_movies_heroes ON movies USING GIN (heroes);
CREATE INDEX IF NOT EXISTS idx_movies_heroines ON movies USING GIN (heroines);

-- Backfill: comma-separated hero → heroes array
UPDATE movies
SET heroes = (
  SELECT array_agg(trim(unnest(string_to_array(hero, ','))))
  FROM unnest(string_to_array(hero, ',')) AS x
)
WHERE hero IS NOT NULL AND hero != '' AND (heroes IS NULL OR array_length(heroes, 1) IS NULL);

-- Simpler: single hero → one-element array (if not already set)
UPDATE movies
SET heroes = ARRAY[trim(hero)]
WHERE hero IS NOT NULL AND hero != '' AND hero NOT LIKE '%,%' AND (heroes IS NULL OR array_length(heroes, 1) IS NULL);

-- Same for heroine
UPDATE movies
SET heroines = (
  SELECT array_agg(trim(unnest(string_to_array(heroine, ','))))
  FROM unnest(string_to_array(heroine, ',')) AS x
)
WHERE heroine IS NOT NULL AND heroine != '' AND (heroines IS NULL OR array_length(heroines, 1) IS NULL);

UPDATE movies
SET heroines = ARRAY[trim(heroine)]
WHERE heroine IS NOT NULL AND heroine != '' AND heroine NOT LIKE '%,%' AND (heroes IS NULL OR array_length(heroines, 1) IS NULL);
```

(If your Postgres version doesn’t like the subquery form, use the simpler `ARRAY[trim(hero)]` style for both comma and single-value cases and run in two passes.)

### Option B: Use the migrate script

```bash
npx tsx scripts/migrate-to-multi-cast-schema.ts --dry-run   # Preview
npx tsx scripts/migrate-to-multi-cast-schema.ts             # Apply
```

**Check:** Run `audit-movie-schema-multicast.ts` (or a quick SQL count) to confirm heroes/heroines are populated and match expectations.

---

## Step 2: TypeScript types

**Goal:** Types know about `heroes` and `heroines`.

**Files to update:**

- **`types/reviews.ts`** (or wherever `Movie` is defined):  
  Add `heroes?: string[]` and `heroines?: string[]`.  
  Keep `hero?: string` and `heroine?: string` for backward compatibility.

- Any other **movie row type** used by API or UI: add `heroes?` and `heroines?` there too.

---

## Step 3: Cast parser (UI data source)

**Goal:** UI gets “Hero 1, Hero 2, Heroine 1, Heroine 2” from either arrays or legacy fields.

**File:** `lib/utils/cast-parser.ts`

- In **`MovieCastData`**, add `heroes?: string[]` and `heroines?: string[]`.
- In **`parseCastMembers`**:
  - If `movie.heroes?.length`, use `movie.heroes` for hero list (with “Hero 1”, “Hero 2”, etc.).
  - Else keep current logic: `splitNames(movie.hero)` and supporting_cast with type `hero2`, etc.
  - Same for heroines: if `movie.heroines?.length`, use `movie.heroines`; else `splitNames(movie.heroine)` and supporting_cast.

No change to the **return type** of `parseCastMembers`; only the **input** and **source** of hero/heroine names.

---

## Step 4: Profile API (filmography by person)

**Goal:** “Movies where this person is hero/heroine” includes movies where they appear in `heroes` or `heroines`.

**File:** `app/api/profile/[slug]/route.ts`

- Where you build the movie query for a person (e.g. search by name):
  - Today: `.or(\`hero.ilike.${pattern},heroine.ilike.${pattern},...\`)`.
  - Add: **array contains** for `heroes` and `heroines` (Supabase: `heroes.cs.{name}` or filter in app: `movie.heroes?.includes(name)` if you fetch then filter).
- So filmography includes:
  - Rows where `hero` / `heroine` matches, **or**
  - `heroes` / `heroines` contains the person (by name or slug, depending on how you store).

Keep **backward compatibility**: still select and use `hero` and `heroine` for older clients or fallback.

---

## Step 5: Movie page (and any movie list)

**Goal:** Movie page shows multiple heroes/heroines (e.g. Seethamma Vakitlo Sirimalle Chettu).

- **Data:** Ensure the movie query **selects** `heroes` and `heroines` (e.g. in `app/movies/[slug]/page.tsx` and list APIs).
- **Display:** You already use `parseCastMembers(movie)`. Once Step 3 is done, passing a movie with `heroes`/`heroines` (or fallback `hero`/`heroine`) will produce “Hero 1”, “Hero 2”, “Heroine 1”, “Heroine 2” in the cast list.
- No need to change **CompactCast** if it already consumes the result of `parseCastMembers`.

---

## Step 6: Entity relations (Antigravity suggestion)

**Goal:** `entity_relations` stays in sync with multiple heroes/heroines.

- When you **write** or **backfill** `entity_relations`:
  - For each movie, insert one row per entry in `heroes` (role_type `hero`) and one per entry in `heroines` (role_type `heroine`).
  - For legacy data, keep using `hero`/`heroine` to create rows if `heroes`/`heroines` are missing.
- Script: **`scripts/populate-entity-relations.ts`** (or equivalent): extend so it reads `movie.heroes` and `movie.heroines` when present, and creates one relation row per name; otherwise fall back to `movie.hero` and `movie.heroine`.

---

## Step 7: Validation and tests

- Run the audit script:
  ```bash
  npx tsx scripts/audit-movie-schema-multicast.ts
  ```
- **Manual checks:**
  - One **single-hero** movie: still shows one hero, profile/search still work.
  - One **multi-hero** movie (e.g. Seethamma Vakitlo Sirimalle Chettu, or Kurukshetram): shows Hero 1, Hero 2, Heroine 1, Heroine 2.
  - **Profile page** of each hero/heroine: filmography includes that movie.
- **Edge case (Antigravity):** Same name in multiple slots (e.g. two “Krishna”): display and profile matching still correct; fix matching by slug/ID if needed.

---

## Order summary

| # | Step                     | What to do |
|---|--------------------------|------------|
| 1 | DB schema + migration    | Run SQL or `migrate-to-multi-cast-schema.ts` |
| 2 | Types                    | Add `heroes?`, `heroines?` to Movie (and related) types |
| 3 | Cast parser              | In `cast-parser.ts`, use `heroes`/`heroines` when present, else `hero`/`heroine` |
| 4 | Profile API              | Include `heroes`/`heroines` in filmography query (array contains or filter) |
| 5 | Movie page / lists       | Select `heroes`, `heroines`; display already via `parseCastMembers` |
| 6 | Entity relations         | Backfill/update so one row per hero/heroine from `heroes`/`heroines` |
| 7 | Validate + test          | Run audit script, then single-hero + multi-hero + profile checks |

Start with **Step 1**; then **2** and **3** so the app compiles and UI can show multi-hero/heroine; then **4** and **5**; then **6** and **7**.
