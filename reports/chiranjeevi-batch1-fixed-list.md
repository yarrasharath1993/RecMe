# Chiranjeevi Batch 1 – Fixed List (Manual Review Applied)

Applied: 2026-01-29. Script: `scripts/apply-chiranjeevi-manual-review-corrections.ts`.

## Role corrections applied

| Movie | Before | After | Note |
|-------|--------|-------|------|
| 47 Rojulu (1981) | Hero | **Villain** | Antagonist Kumar (opposite Jayaprada) |
| Mosagadu (1980) | villain | **Villain** | First negative role (rowdy-sheeter) |
| I Love You (1979) | Supporting | **Hero** | Anti-hero/lead Ramesh (womanizer) |
| Kaali (1980) | Hero | **Supporting** | Hero in Telugu, Supporting in Tamil |
| Sipayi (1996) | Supporting | **Cameo** | Kannada guest appearance |
| Jagadguru Adi Shankara (2013) | Supporting | **Cameo** | Lord Shiva |

## Removed (not in filmography)

- **Rakta Sambandham (1980)** – Removed Chiranjeevi; film is not in his filmography (hero set to Murali Mohan). Confusion with Rakta Bandham / Raktha Sindhuram.

## Duplicates merged (extra row deleted, one kept)

| Deleted (duplicate row) | Kept |
|-------------------------|------|
| Oorukichchina Maata (1981) | Oorukichina Maata |
| Parvathi Parameswarulu (1981) | Paravathi Parameshwarulu |
| Todu Dongalu (1981) | Thodu Dongalu |
| Allulu Vasthunnaru (1984) | Allullostunnaru |
| Intiguttu (1984) | Inti Guttu |
| Bruce Lee (2015) | Bruce Lee: The Fighter |

## UI / API updates

- **Profile API** (`app/api/profile/[slug]/route.ts`): Added **Villain** role bucket for `supporting_cast` entries with `type: 'villain'` or `'antagonist'`.
- **Profile layout** (`components/reviews/EntityProfileLayoutV2.tsx`): Villain count and badge shown when present.
- **Export script** (`scripts/export-chiranjeevi-filmography-for-verification.ts`): Role label "Villain" for villain/antagonist type.

## Current count

After fixes: **157 entries** in `reports/chiranjeevi-verify-batch1-movie-and-role.md` (was 165; −1 Rakta Sambandham, −6 duplicate rows, +0).

No further changes for: Mana Voori Pandavulu (Supporting / Parthu), Rakta Bandham (Hero / Sub-Inspector Tilak), Mappillai (Cameo), Mana Shankara Vara Prasad Garu (Hero 2026) – already correct or noted.

---

## Added (Acted roles missing from list)

| Movie | Role | Note |
|-------|------|------|
| **Prema Natakam** (1981) | Cameo | Special appearance as himself |
| **Ranuva Veeran** (1981) | Villain | Tamil film; key antagonist opposite Rajinikanth |

Script: `scripts/add-chiranjeevi-prema-natakam-ranuva-veeran.ts` (run with `--execute`). Applied.
