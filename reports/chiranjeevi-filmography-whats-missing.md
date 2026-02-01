# Chiranjeevi Filmography: What’s Missing (Profile shows 151)

You see **151 movies** at `http://localhost:3000/movies?profile=chiranjeevi&tab=filmography`.  
The canonical list (Batches 1–4) has **156 entries**. Below is what’s still missing or mismatched.

---

## 1. Likely not on profile (16 – script “missing”)

These are in the canonical list but the verifier didn’t find a matching DB row (different title/spelling or no Chiranjeevi attribution). **Check on the filmography tab** (search or scroll) to see if any appear under another name.

| # | Year | Canonical title | Role | Check on filmography |
|---|------|------------------|------|------------------------|
| 1 | 1978 | **Manavoori Pandavulu** | Supporting | Search “Mana” or “Pandavulu” – may be “Mana Voori Pandavulu” |
| 2 | 1979 | Kotta Alludu | Hero | Search “Kotta” |
| 3 | 1979 | I Love You | Hero | Search “I Love” |
| 4 | 1979 | Idi Katha Kaadu | Supporting | Search “Idi Katha” |
| 5 | 1981 | 47 Natkal (Tamil) | Supporting | Search “47” or “Rojulu” (DB may be “47 Rojulu”) |
| 6 | 1985 | Puli | Hero | Search “Puli” (avoid “Pulijoodam”) |
| 7 | 1989 | Mappillai | Cameo | Search “Mappillai” |
| 8 | 1992 | Aaj Ka Goonda Raaj (Hindi) | Hero | Search “Goonda” (DB may be “Aaj Ka Goonda Raj”) |
| 9 | 2000 | Hands Up! | Cameo | Search “Hands” |
| 10 | 2009 | Magadheera | Cameo | Search “Magadheera” |
| 11 | 2013 | Jagadguru Adi Shankara | Supporting | Search “Jagadguru” or “Shankara” |
| 12 | 2015 | Bruce Lee - The Fighter | Cameo | Search “Bruce Lee” |
| 13 | 2026 | Chiranjeevi-Srikanth Odela Project | Hero | TBA / upcoming |
| 14 | — | Hanuman (Telugu) | Voice over | Search “Hanuman” |
| 15 | — | Rudhramadevi | Narrator | Search “Rudhramadevi” |
| 16 | — | Brahmāstra (Telugu) | Narrator | Search “Brahmastra” |

---

## 2. On profile but as “Hero” instead of “Supporting” (3)

These **are** in the 151; canonical says Supporting, DB has them as hero. To match canonical, they’d need to be moved to supporting cast.

| Movie | DB title on site | Canonical role |
|-------|-------------------|----------------|
| Kaali (1980) | Kaali | Supporting |
| Prema Tarangalu (1980) | Thathayya Premaleelalu | Supporting |
| Tiruguleni Manishi (1981) | Tirugu Leni Manishi | Supporting |

---

## 3. Counts

| What | Count |
|------|--------|
| You see on profile (total) | **151** |
| Canonical list (Batches 1–4) | **156** |
| Verifier “matched” (in DB + correct role) | **137** |
| Verifier “missing” (no matching DB row) | **16** |
| Verifier “wrong role” (in DB as hero, canonical says supporting) | **3** |

So: **151 ≈ 137 + 3 (wrong role) + 11** (e.g. spelling variants, cameos, or DB-only titles). The **16 “missing”** above are the ones to confirm on the filmography tab (by search) or add/fix in DB so they show.

---

## Quick checks on filmography tab

- **Mana Voori Pandavulu (1978)** – Search “Mana” or “Pandavulu”; if it appears, supporting is now showing.
- **Magadheera (2009)** – Search “Magadheera”; should appear as cameo if Chiranjeevi is in that movie’s supporting_cast.
- **Aaj Ka Goonda Raaj (1992)** – Search “Goonda” or “Aaj Ka”; may be stored as “Aaj Ka Goonda Raj”.
- **47 Natkal / 47 Rojulu (1981)** – Search “47”.

If any of these don’t appear, they’re in the “missing” set and need to be added or fixed in the DB (title/attribution).
