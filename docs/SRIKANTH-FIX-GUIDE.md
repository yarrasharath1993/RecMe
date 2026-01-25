# Srikanth Actors Fix Guide

## Problem
The URL `http://localhost:3000/movies?profile=srikanth` shows movies from 2 different actors:
- **Tamil actor Srikanth** (main actor, should have slug "srikanth")
- **Srikanth Meka** (Telugu actor, should have slug "srikanth-meka")

## Solution

### Step 1: Check Current State

Run this query to see what exists:

```sql
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE name_en ILIKE '%srikanth%' OR name_te ILIKE '%srikanth%'
ORDER BY name_en;
```

### Step 2: Identify Movies

Check how movies are distributed:

```sql
SELECT 
  hero, 
  COUNT(*) as movie_count,
  STRING_AGG(DISTINCT language, ', ') as languages
FROM movies
WHERE hero ILIKE '%srikanth%' AND is_published = true
GROUP BY hero
ORDER BY movie_count DESC;
```

### Step 3: Fix Tamil Actor Srikanth

**If profile exists:**
```sql
UPDATE celebrities 
SET 
  slug = 'srikanth',
  name_en = 'Srikanth',
  name_te = 'ஸ்ரீகாந்த்',
  updated_at = NOW()
WHERE id = '<tamil-srikanth-id>';
```

**If profile doesn't exist:**
```sql
INSERT INTO celebrities (
  name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
) VALUES (
  'Srikanth', 'ஸ்ரீகாந்த்', 'srikanth', 'male', 'actor', true, NOW(), NOW()
) RETURNING id;
```

### Step 4: Fix Srikanth Meka

**If profile exists:**
```sql
UPDATE celebrities 
SET 
  slug = 'srikanth-meka',
  name_en = 'Srikanth Meka',
  name_te = 'శ్రీకాంత్ మేక',
  updated_at = NOW()
WHERE id = '<srikanth-meka-id>';
```

**If profile doesn't exist:**
```sql
INSERT INTO celebrities (
  name_en, name_te, slug, gender, occupation, is_published, created_at, updated_at
) VALUES (
  'Srikanth Meka', 'శ్రీకాంత్ మేక', 'srikanth-meka', 'male', 'actor', true, NOW(), NOW()
) RETURNING id;
```

### Step 5: Verify

```sql
SELECT id, name_en, name_te, slug, is_published 
FROM celebrities 
WHERE slug IN ('srikanth', 'srikanth-meka')
ORDER BY slug;
```

## Expected Result

After the fix:
- `?profile=srikanth` → Shows Tamil actor Srikanth's filmography (Tamil/Malayalam movies)
- `?profile=srikanth-meka` → Shows Srikanth Meka's filmography (Telugu movies)
- No mixing of filmographies

## Tamil Actor Srikanth's Known Movies

Based on the provided filmography, these movies should belong to Tamil actor Srikanth:

**2025:** Blackmail, Dinasari, Konjam Kadhal Konjam Modhal, Mathru  
**2024:** Operation Laila, Sathamindri Mutham Tha, Aanandhapuram Diaries, Maya Puthagam, Sshhh  
**2023:** Bagheera, Kannai Nambathey, Echo, Amala, Pindam, Ravanasura  
**2022:** Maha, Coffee with Kadhal, 10th Class Diaries, Recce  
**2021:** Mirugaa, Y, Jai Sena, Asalem Jarigindi  
**2019:** Rocky: The Revenge, Raagala 24 Gantallo, Marshal  
**2017:** Lie  
**2016:** Sowkarpettai, Nambiar, Sarrainodu  
**2015:** Om Shanti Om  
**2014:** Kathai Thiraikathai Vasanam Iyakkam  
**2012:** Nanban, Paagan, Hero, Nippu  
**2011:** Sathurangam, Dhada, Uppukandam Brothers Back in Action  
**2010:** Drohi, Rasikkum Seemane, Police Police  
**2009:** Indira Vizha  
**2008:** Poo, Vallamai Tharayo  
**2007:** Aadavari Matalaku Ardhalu Verule  
**2006:** Mercury Pookkal, Uyir, Kizhakku Kadarkarai Salai  
**2005:** Kana Kandaen, Oru Naal Oru Kanavu, Bambara Kannaley  
**2004:** Aayitha Ezhuthu, Bose, Varnajalam  
**2003:** Parthiban Kanavu, Priyamana Thozhi, Manasellam, Okariki Okaru  
**2002:** Roja Kootam, April Mathathil

All other Telugu movies with "srikanth" in hero field should belong to Srikanth Meka.
