# Classification Enrichment Report

**Generated:** 1/12/2026, 8:47:00 PM

**Mode:** EXECUTE

## Summary

| Metric | Value |
|--------|-------|
| Total Processed | 45 |
| Primary Genre (high conf) | 3 |
| Primary Genre (low conf - skipped) | 41 |
| Primary Genre (ambiguous) | 1 |
| Age Rating (high conf) | 0 |
| Age Rating (medium conf) | 21 |
| Age Rating (skipped) | 0 |
| **Needs Manual Review** | **43** |

## Confidence Thresholds

- Primary Genre: Requires 2+ independent signals with total weight >= 0.65
- Age Rating: Requires 2+ signal sources; medium confidence acceptable
- Never downgrades existing ratings
- Never overwrites existing high-confidence data with low-confidence

## Cases Needing Manual Review (42)

### Primary Genre Issues

| Movie | Year | Reason | Signals |
|-------|------|--------|--------|
| Vishwambhara | 2026 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Fantasy (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Mega 159 | 2026 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Mana Shankara Vara Prasad Garu | 2026 | Confidence 0.50 - consider review | Comedy (genres_array_primary: 0.35), Action (genres_array_secondary: 0.17), Comedy (director_pattern: 0.15), Action (hero_pattern: 0.10) |
| Sabhaku Namaskaram | 2026 | Confidence 0.35 - consider review | Political (genres_array_primary: 0.35), Comedy (genres_array_secondary: 0.17) |
| Ranga Maarthaanda | 2023 | Confidence 0.45 - consider review | Drama (genres_array_primary: 0.35), Family (genres_array_secondary: 0.17), Action (director_pattern: 0.15), Drama (hero_pattern: 0.10) |
| Aaha Kalyanam | 2014 | Confidence 0.35 - consider review | Romance (genres_array_primary: 0.35), Comedy (genres_array_secondary: 0.17), Historical (director_pattern: 0.15), Drama (hero_pattern: 0.10) |
| Sangharshana | 2011 | Confidence 0.35 - consider review | Action (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17) |
| Rambabu Gadi Pellam | 2010 | Confidence 0.35 - consider review | Comedy (genres_array_primary: 0.35), Action (era_default: 0.10) |
| Alasyam Amrutham | 2010 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Horror (hero_pattern: 0.10) |
| Fitting Master | 2009 | Confidence 0.35 - consider review | Comedy (genres_array_primary: 0.35), Action (genres_array_secondary: 0.17) |
| Evadaithe Nakenti | 2007 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Pellaindi Kaani | 2007 | Confidence 0.35 - consider review | Comedy (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17) |
| Nuvvante Naakishtam | 2005 | Confidence 0.35 - consider review | Romance (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17) |
| Charminar | 2003 | Confidence 0.45 - consider review | Drama (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Drama (hero_pattern: 0.10) |
| Friends | 2002 | Confidence 0.45 - consider review | Drama (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Drama (hero_pattern: 0.10) |
| Eduruleni Manishi | 2001 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Family (genres_array_secondary: 0.17), Action (hero_pattern: 0.10), Family (synopsis_keywords: 0.05) |
| Maa Balaji | 1999 | Tie between Historical and Action (both ~0.15) - needs review | Historical (director_pattern: 0.15), Action (era_default: 0.10) |
| Suprabhatam | 1998 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Rajahamsa | 1998 | Confidence 0.35 - consider review | Romance (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17), Fantasy (director_pattern: 0.15) |
| Rakshakudu | 1997 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Action (hero_pattern: 0.10), Crime (synopsis_keywords: 0.05) |
| Amma Durgamma | 1996 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Devotional (genres_array_secondary: 0.17) |
| Ghatothkachudu | 1995 | Confidence 0.45 - consider review | Drama (genres_array_primary: 0.35), Comedy (director_pattern: 0.15), Drama (hero_pattern: 0.10) |
| Donga Police | 1992 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Comedy (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Shanti Kranti | 1991 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Athiradhudu | 1991 | Confidence 0.35 - consider review | Action (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17) |
| Sarpayagam | 1991 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Mythological (genres_array_secondary: 0.17), Romance (hero_pattern: 0.10) |
| Iddaru Iddare | 1990 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Romance (genres_array_secondary: 0.17), Action (director_pattern: 0.15), Action (hero_pattern: 0.10) |
| Police Bharya | 1990 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Action (genres_array_secondary: 0.17), Comedy (director_pattern: 0.15) |
| Kodama Simham | 1990 | Confidence 0.35 - consider review | Western (genres_array_primary: 0.35), Action (genres_array_secondary: 0.17), Action (hero_pattern: 0.10) |
| Rudranetra | 1989 | Confidence 0.35 - consider review | Spy Thriller (genres_array_primary: 0.35), Drama (director_pattern: 0.15), Action (hero_pattern: 0.10) |
| Raktha Tilakam | 1988 | Confidence 0.50 - consider review | Action (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17), Action (director_pattern: 0.15), Drama (hero_pattern: 0.10) |
| Chanakya Sapatham | 1986 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Drama (director_pattern: 0.15), Action (hero_pattern: 0.10), Crime (synopsis_keywords: 0.05) |
| Adavi Donga | 1985 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Drama (director_pattern: 0.15), Action (hero_pattern: 0.10) |
| Yamakinkarudu | 1982 | Confidence 0.50 - consider review | Action (genres_array_primary: 0.35), Thriller (genres_array_secondary: 0.17), Action (hero_pattern: 0.10), Action (synopsis_keywords: 0.05) |
| Intlo Ramayya Veedhilo Krishnayya | 1982 | Confidence 0.35 - consider review | Comedy (genres_array_primary: 0.35), Drama (genres_array_secondary: 0.17), Historical (director_pattern: 0.15), Action (hero_pattern: 0.10) |
| Radha My Darling | 1982 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Action (hero_pattern: 0.10), Romance (synopsis_keywords: 0.05) |
| Mondi Ghatam | 1982 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Action (genres_array_secondary: 0.17), Action (hero_pattern: 0.10), Family (synopsis_keywords: 0.05) |
| Oorukichina Maata | 1981 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Action (hero_pattern: 0.10), Thriller (synopsis_keywords: 0.05) |
| 47 Rojulu | 1981 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Action (era_default: 0.10) |
| Aadavaallu Meeku Joharlu | 1981 | Confidence 0.35 - consider review | Drama (genres_array_primary: 0.35), Action (hero_pattern: 0.10) |
| Sri Rama Bantu | 1979 | Confidence 0.45 - consider review | Action (genres_array_primary: 0.35), Action (hero_pattern: 0.10) |
| Sudigundalu | 1968 | Confidence 0.45 - consider review | Drama (genres_array_primary: 0.35), Social (genres_array_secondary: 0.17), Drama (hero_pattern: 0.10), Crime (synopsis_keywords: 0.05) |

## Sample Successful Classifications

| Movie | Year | Primary Genre | Sources | Age Rating | Reasons |
|-------|------|---------------|---------|------------|--------|
| Vishwambhara | 2026 | Action | genres_array_primary, hero_pattern | U/A | Default safe middle ground → U/A |
| Auto Jaani | 2026 | Action | genres_array_primary, director_pattern, hero_pattern | U/A | Default safe middle ground → U/A |
| Mega 159 | 2026 | Action | genres_array_primary, hero_pattern | U/A | Default safe middle ground → U/A |
| Mana Shankara Vara Prasad Garu | 2026 | Comedy | genres_array_primary, director_pattern | U/A | Default safe middle ground → U/A |
| Sabhaku Namaskaram | 2026 | Political | genres_array_primary | U/A | Default safe middle ground → U/A |
| Ranga Maarthaanda | 2023 | Drama | genres_array_primary, hero_pattern | U/A | Default safe middle ground → U/A |
| Aaha Kalyanam | 2014 | Romance | genres_array_primary | U/A | Default safe middle ground → U/A |
| Sangharshana | 2011 | Action | genres_array_primary | U/A | Default safe middle ground → U/A |
| Rambabu Gadi Pellam | 2010 | Comedy | genres_array_primary | U/A | Default safe middle ground → U/A |
| Alasyam Amrutham | 2010 | Drama | genres_array_primary | U/A | Default safe middle ground → U/A |
| Fitting Master | 2009 | Comedy | genres_array_primary | U/A | Default safe middle ground → U/A |
| Evadaithe Nakenti | 2007 | Action | genres_array_primary, hero_pattern | U/A | Default safe middle ground → U/A |
| Pellaindi Kaani | 2007 | Comedy | genres_array_primary | U/A | Default safe middle ground → U/A |
| Nuvvante Naakishtam | 2005 | Romance | genres_array_primary | U/A | Default safe middle ground → U/A |
| Charminar | 2003 | Drama | genres_array_primary, hero_pattern | U/A | Default safe middle ground → U/A |
| Friends | 2002 | Drama | genres_array_primary, hero_pattern | U/A | Default safe middle ground → U/A |
| Eduruleni Manishi | 2001 | Drama | genres_array_primary | U/A | Default safe middle ground → U/A |
| Maa Balaji | 1999 | Historical | director_pattern | U/A | Default safe middle ground → U/A |
| Suprabhatam | 1998 | Drama | genres_array_primary | U/A | Default safe middle ground → U/A |
| Rajahamsa | 1998 | Romance | genres_array_primary | U/A | Default safe middle ground → U/A |

## Known Limitations

1. Movies without genres[] array have fewer signals for primary_genre derivation
2. Pre-1950 movies default to 'U' rating due to limited content flagging
3. Director/Hero patterns only cover major Telugu cinema personalities
4. Synopsis keyword extraction is basic; does not use NLP
5. Ambiguous cases (Action vs Drama) are common for masala films
