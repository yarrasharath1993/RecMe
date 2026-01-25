# Export Srikanth Movies for Manual Review

## Purpose

Export all movies with "srikanth" in the hero field so you can manually review and assign them between:
- **Tamil actor Srikanth** (slug: `srikanth`)
- **Srikanth Meka** (slug: `srikanth-meka`) - Telugu actor, born 1968

## How to Export

### Option 1: Using Supabase SQL Editor

1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `export-srikanth-movies-review.sql`
4. Run the query
5. Click "Download CSV" or "Export" to save the results

### Option 2: Using psql or Database Client

```bash
psql -h your-host -U your-user -d your-database -f export-srikanth-movies-review.sql -o SRIKANTH-MOVIES-REVIEW.csv
```

## CSV Columns

The exported CSV includes:

- `id` - Movie ID
- `title_en` - English title
- `title_te` - Telugu title (if available)
- `hero` - Hero name as stored in database
- `release_year` - Year of release
- `language` - Movie language
- `director` - Director name
- `slug` - Movie slug
- `is_published` - Whether movie is published
- `suggested_actor` - Suggested actor based on heuristics:
  - `Srikanth Meka` - If hero contains "meka"/"addala", or Telugu movie
  - `Tamil Srikanth` - If matches known filmography or Tamil/Malayalam movie
  - `REVIEW NEEDED` - Needs manual review
- `notes` - Explanation for the suggestion

## Manual Review Process

1. **Open the CSV** in Excel, Google Sheets, or any spreadsheet tool
2. **Review each movie** and update the `suggested_actor` column:
   - Change to `Tamil Srikanth` if it belongs to Tamil actor
   - Change to `Srikanth Meka` if it belongs to Telugu actor
   - Keep `REVIEW NEEDED` if unsure (you can research later)
3. **Save the updated CSV**
4. **Use the updated CSV** to fix the database (see next section)

## After Review: Apply the Fixes

Once you've reviewed and updated the CSV, you can:

### Option 1: Update Hero Names in Movies Table

For movies assigned to **Srikanth Meka**, update hero field to "Srikanth Meka":

```sql
-- Update hero names for Srikanth Meka movies
UPDATE movies
SET hero = 'Srikanth Meka', updated_at = NOW()
WHERE id IN (
  -- List of movie IDs from your reviewed CSV where suggested_actor = 'Srikanth Meka'
  'id1', 'id2', 'id3' -- replace with actual IDs
);
```

For movies assigned to **Tamil Srikanth**, ensure hero field is just "Srikanth":

```sql
-- Ensure Tamil Srikanth movies have correct hero name
UPDATE movies
SET hero = 'Srikanth', updated_at = NOW()
WHERE id IN (
  -- List of movie IDs from your reviewed CSV where suggested_actor = 'Tamil Srikanth'
  'id1', 'id2', 'id3' -- replace with actual IDs
);
```

### Option 2: Bulk Update Script

Create a script that reads your reviewed CSV and applies the updates automatically.

## Reference: Tamil Actor Srikanth's Known Movies

These movies should definitely be assigned to Tamil actor Srikanth:

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

## Reference: Srikanth Meka

According to [Wikipedia](https://en.wikipedia.org/wiki/Srikanth_(actor,_born_1968)):
- **Meka Srikanth** (born 23 March 1968)
- Telugu actor, 120+ Telugu films
- Debuted in 1991 with "People's Encounter"
- Works predominantly in Telugu cinema
- Also appeared in some Kannada, Malayalam and Tamil films

## Expected Result

After fixing:
- `?profile=srikanth` → Shows Tamil actor Srikanth's filmography
- `?profile=srikanth-meka` → Shows Srikanth Meka's filmography
- No mixing of filmographies
