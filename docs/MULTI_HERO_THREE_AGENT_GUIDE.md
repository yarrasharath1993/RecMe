# Multi-Hero / Multi-Lead Schema Extension — Using the Three-Agent System

**Goal:** Extend the schema so a movie can have **multiple heroes** and **multiple heroines/leads** (e.g. Seethamma Vakitlo Sirimalle Chettu: Hero 1, Hero 2, Heroine 1, Heroine 2), and use the **Planner → Antigravity → Execute** flow to get a reviewed plan before implementing.

---

## What Already Exists

- **Docs:** [MULTI-HERO-SUPPORT-SUMMARY.md](../MULTI-HERO-SUPPORT-SUMMARY.md) — phases (DB, API, testing), sample SQL, script names.
- **SQL:** [multi-cast-migration.sql](../multi-cast-migration.sql) — adds `heroes[]`, `heroines[]`, indexes, data migration from `hero`/`heroine`.
- **Scripts:** `migrate-to-multi-cast-schema.ts`, `audit-movie-schema-multicast.ts`.
- **Entity relations:** `entity_relations` table with `role_type` (hero, heroine, etc.) — can represent multiple heroes/heroines per movie.

You will use the **three-agent system** to get a structured plan and an adversarial review before you (or Cursor) implement.

---

## Step 1: Create Context for the Planner

A context file is already prepared: **`reports/context-multi-hero-schema.json`**.

It describes:
- The schema extension goal (multiple heroes, multiple heroines/leads).
- The example movie (Seethamma Vakitlo Sirimalle Chettu).
- References to existing docs and scripts.
- Governance constraints (backward compatibility, heroes[]/heroines[]).

You can edit this file to add more constraints or references.

---

## Step 2: Generate a Plan

Run the **Planner** with this context:

```bash
npm run planner -- --input=reports/context-multi-hero-schema.json --output=reports/plan-multi-hero.json --audit
```

**What you get:** `reports/plan-multi-hero.json` with:
- `priorities` — ordered focus areas (e.g. DB first, then types, API, UI).
- `suggested_actions` — list of steps with intent (e.g. MODIFY_SCHEMA, ENRICH_DATA, VALIDATE_DATA).
- `assumptions` and `risks`.

Use this as the **master checklist** for the change (migration, types, API, UI, entity_relations, tests).

---

## Step 3: Adversarial Review (Optional but Recommended)

Run **Antigravity** on the plan to get critiques and edge cases:

```bash
npm run antigravity -- --plan=reports/plan-multi-hero.json --output=reports/critique-multi-hero.json --audit
```

**What you get:** `reports/critique-multi-hero.json` with:
- `critiques` — e.g. backward compatibility, search/profile API, display order.
- `edge_cases` — e.g. movies with only hero, only heroine, or mixed leads.
- `suggested_tests` — what to test after implementation.

Adjust the plan or implementation order based on this before coding.

---

## Step 4: Execute (You or Cursor)

Execution is **manual** (or via Cursor following the plan). Suggested order:

### 4.1 Database

- Run the existing migration: execute `multi-cast-migration.sql` in Supabase (or run `migrate-to-multi-cast-schema.ts` if it applies the same changes).
- Ensure `heroes` and `heroines` are `TEXT[]`, with GIN indexes; backfill from `hero`/`heroine` (single → one-element array; comma-separated → split and trim).

### 4.2 Types

- In `types/reviews.ts` (and any shared movie type): add `heroes?: string[]` and `heroines?: string[]`; keep `hero?` and `heroine?` for backward compatibility.
- Any script or API that types movie rows should accept both old and new fields.

### 4.3 API

- **Profile API** (`app/api/profile/[slug]/route.ts`): when resolving filmography, query movies where the person appears in `heroes` or `heroines` (e.g. array contains) in addition to `hero`/`heroine`.
- **Search** (if you have movie search by cast): include `heroes`/`heroines` in the search logic so each hero/heroine is findable (see MULTI-HERO-SUPPORT-SUMMARY.md for examples).

### 4.4 UI — Movie Page (e.g. Seethamma Vakitlo…)

- **Data:** Fetch `heroes` and `heroines` from DB; if missing, derive from `hero`/`heroine` (single value → one-element array).
- **Display:** Show “Hero 1, Hero 2” and “Heroine 1, Heroine 2” (or “Leads”) using the same pattern as [Seethamma Vakitlo Sirimalle Chettu](http://localhost:3000/movies/seethamma-vakitlo-sirimalle-chettu-2013). Use `parseCastMembers` (or equivalent) so it accepts both legacy `hero`/`heroine` and new `heroes`/`heroines` and outputs a consistent structure for CompactCast.

### 4.5 Entity Relations (Optional but Recommended)

- When writing or backfilling `entity_relations`, create one row per hero/heroine from `heroes`/`heroines` (and from `hero`/`heroine` for legacy rows) so profile pages and analytics stay consistent.

### 4.6 Tests

- Add or run tests for: single-hero movie (backward compat), multi-hero movie (e.g. Kurukshetram), search by each hero, profile filmography for each hero/heroine. Use Antigravity’s `suggested_tests` as a checklist.

---

## Step 5: Optional — Runner and Handoff

If you want the **runner** to execute only **allowlisted** scripts (e.g. status checks) after the migration:

1. Create an approved handoff JSON with `approved_by: "human"` and `actions` containing `run_script` entries (e.g. `intel:movie-audit:status`, `movies:coverage:status`).
2. Set `CLAWDBOT_APPROVED_HANDOFF` and `CLAWDBOT_EXECUTE_HANDOFF=true` (or `CLAWDBOT_DRY_RUN_HANDOFF=true`).
3. Run the runner; it will execute only those scripts in `lib/execution/allowlist.ts`.

Schema changes and app code changes are **not** run by the runner — those you do manually or via Cursor using the plan.

---

## Quick Command Summary

| Step | Command |
|------|--------|
| 1. Context | Use `reports/context-multi-hero-schema.json` (edit if needed). |
| 2. Plan | `npm run planner -- --input=reports/context-multi-hero-schema.json --output=reports/plan-multi-hero.json --audit` |
| 3. Review | `npm run antigravity -- --plan=reports/plan-multi-hero.json --output=reports/critique-multi-hero.json --audit` |
| 4. Execute | Follow plan + critique: run migration, update types, API, UI, entity_relations, tests (see §4). |

---

## How This Uses the New System

- **Planner:** Turns your schema-extension goal and existing docs into a structured plan (priorities, suggested_actions, risks).
- **Antigravity:** Stress-tests the plan (backward compat, edge cases, tests) so you don’t miss pitfalls.
- **ClawDBot:** Not required for this workflow; use it if you later want analysis of validation reports or filmography data.
- **Execution:** You (or Cursor) implement the plan; the runner can run only allowlisted scripts, not migrations or app code.

This keeps schema and app changes under your control while using the three-agent system to plan and review the multi-hero / multi-lead extension.
