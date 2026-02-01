# Actor Filmography Correction Playbook

**Source:** Learnings from Chiranjeevi filmography manual review (Jan 2026).  
**Purpose:** Reuse the same correction workflow for any other actor (e.g. Venkatesh, Mahesh Babu).

---

## 1. Role corrections (Hero / Villain / Supporting / Cameo)

| Pattern | What we did | Script / API |
|--------|-------------|---------------|
| **Hero → Villain** | Actor was in `hero` but played antagonist. Move to `supporting_cast` with `type: 'villain'`, clear `hero`. | `apply-chiranjeevi-manual-review-corrections.ts` |
| **Supporting → Hero** | Actor was in `supporting_cast` but was lead/anti-hero. Set `hero = Actor`, remove from `supporting_cast`. | Same script |
| **Hero → Supporting** | Bilingual: hero in one language, supporting in another. Move to `supporting_cast` with `type: 'supporting'`. | Same script |
| **Supporting → Cameo** | Guest/special appearance. Update `supporting_cast` entry `type` to `'cameo'` (and optional `role: 'Himself'` etc.). | Same script |

**DB shape:** `supporting_cast` is an array of `{ name, type?, role? }`. `type` can be: `supporting`, `cameo`, `villain`, `antagonist`. Profile API and export script must treat `villain`/`antagonist` as "Villain" for display.

---

## 2. Removed (not in filmography)

| Pattern | What we did |
|--------|-------------|
| **Wrong film** | Film title similar to a real one (e.g. Rakta Sambandham vs Rakta Bandham). Remove actor from that movie: clear from `hero` and `supporting_cast`, set `hero` to correct lead. |

Do **not** delete the movie row; only remove the actor from cast.

---

## 3. Duplicates merged

| Pattern | What we did |
|--------|-------------|
| **Same film, two rows** | Transliteration variants (e.g. Oorukichchina Maata / Oorukichina Maata). Keep one row (preferred title), **delete** the other row. |

Resolution: find by `release_year` + title match, pick "keep" title, delete the other movie row. Prefer the more common spelling as the kept slug.

---

## 4. Missing acted roles added

| Pattern | What we did |
|--------|-------------|
| **Cameo missing** | Film exists; add actor to `supporting_cast` with `type: 'cameo'`, `role: 'Himself'` (or character). If actor was wrongly in `hero`, set `hero` to correct lead. |
| **Villain/antagonist missing** | Film exists (e.g. Tamil); add actor to `supporting_cast` with `type: 'villain'`. Ensure movie is `is_published: true` so it appears in profile/export. |
| **Film missing** | Insert new movie row with correct `hero`/`heroine`/`director`, `language`, and actor in `supporting_cast`. Set `is_published: true`. |

---

## 5. Export and verification

| Step | Script / File |
|------|----------------|
| **Export filmography (movie + role)** | `scripts/export-chiranjeevi-filmography-for-verification.ts` – generalize with `--actor` or env for any actor. |
| **Verification report** | Output: `reports/<actor>-verify-batch1-movie-and-role.md` (or similar). |

Export must: (1) include hero movies, (2) paginate over all movies with non-null `supporting_cast` and include those where actor is in cast, (3) label `Villain` for `type: 'villain'`/`'antagonist'`.

---

## 6. Publishing

Unpublished movies where the actor has a role will not appear in profile or export. After adding/editing: set `is_published: true` for that movie.

---

## 7. Scripts to reuse (actor-agnostic)

| Script | Purpose |
|--------|---------|
| `apply-chiranjeevi-manual-review-corrections.ts` | Template: role fixes, remove-from-film, duplicate merge. **Generalize:** accept actor name + list of corrections (or path to a JSON/MD correction list). |
| `add-chiranjeevi-prema-natakam-ranuva-veeran.ts` | Template: add missing films/roles. **Generalize:** accept actor + list of `{ title, year, roleType, character?, addMovieIfMissing? }`. |
| `export-chiranjeevi-filmography-for-verification.ts` | **Generalize:** `--actor=Chiranjeevi` (or read from config) so one script exports any actor’s movie+role list. |
| `publish-prema-natakam.ts` | One-off publish by slug. **Generalize:** `publish-movie-by-slug.ts --slug=...` for any movie. |

---

## 8. ClawDBot integration

- **Structured lessons:** `lib/clawdbot/learnings/actor-filmography-lessons.json` – patterns and recommended_actions.
- **Correction summary as input:** Chiranjeevi fixes can be encoded as a governance-style report; ClawDBot analyzes it and outputs insights + recommended_actions for "next actor."
- **Run for another actor:** Use the same playbook: (1) export actor’s filmography, (2) manual review, (3) apply corrections using the same patterns (role fixes, remove, duplicates, add missing, publish).

---

## 9. Checklist for "next actor"

1. [ ] Export filmography: movie name + role (batch 1).
2. [ ] Manual review: note role corrections, removals, duplicates, missing films.
3. [ ] Apply role corrections (hero/villain/supporting/cameo) via script or DB updates.
4. [ ] Remove actor from films that are not in filmography.
5. [ ] Merge duplicates: keep one row per film, delete duplicate rows.
6. [ ] Add missing films/roles; set `is_published: true` where needed.
7. [ ] Re-export and verify count; confirm villain/cameo/supporting show correctly in profile.

---

## 10. Tried on other actors

| Actor | Batch 1 export | Notes |
|-------|----------------|-------|
| **Krishna** | `reports/krishna-verify-batch1-movie-and-role.md` (881 entries) | Export via `npx tsx scripts/export-actor-filmography-for-verification.ts --actor="Krishna"`. Manual review next; may need to disambiguate (e.g. Ghattamaneni Krishna vs older "Krishna" in hero). ClawDBot wrapper can time out on large filmographies; use `--output=reports/clawdbot-krishna-analysis.json` with longer timeout if needed. |
