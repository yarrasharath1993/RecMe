# 🚀 Apply Celebrity Enrichments - Step-by-Step Guide

## Step 1: Approve Enrichments in Supabase

1. Open **Supabase Dashboard → SQL Editor**
2. Copy the contents of `approve-enrichments.sql`
3. Run the approval query:

```sql
-- Auto-approve all high-confidence (>=70%) enrichments
UPDATE celebrity_wiki_enrichments 
SET status = 'approved', reviewed_at = NOW()
WHERE confidence_score >= 0.7 AND status = 'pending';
```

4. Verify results:

```sql
SELECT status, COUNT(*) as count
FROM celebrity_wiki_enrichments
GROUP BY status;
```

Expected output:
- `approved`: ~65 records (high-confidence)
- `pending`: ~119 records (need manual review)

---

## Step 2: Apply Enrichments to Production

Run this command in your terminal:

```bash
npx tsx scripts/apply-celebrity-enrichments.ts
```

This will:
- Read all `approved` enrichments
- Update the `celebrities` table with new data
- Mark enrichments as `applied` after success

---

## Step 3: Verify the Changes

In Supabase SQL Editor:

```sql
-- Check how many were applied
SELECT COUNT(*) FROM celebrity_wiki_enrichments WHERE status = 'applied';

-- View updated celebrities
SELECT 
  name_en,
  full_bio IS NOT NULL as has_bio,
  date_of_birth,
  place_of_birth,
  family_relationships IS NOT NULL as has_family,
  updated_at
FROM celebrities
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC
LIMIT 20;
```

---

## What Gets Applied?

The script updates these fields in the `celebrities` table:

### Core Fields:
- `full_bio` - Full English biography
- `full_bio_te` - Full Telugu biography  
- `date_of_birth` - Birth date
- `place_of_birth` - Birthplace
- `education` - Educational background
- `height` - Height information

### Career Fields:
- `known_for` - Notable works (array)
- `industry_title` - Official title (e.g., "Megastar")
- `signature_style` - Acting/career style
- `brand_pillars` - Key brand attributes (array)
- `actor_eras` - Career phases (JSONB)
- `awards_count` - Total awards count

### Personal Fields:
- `nicknames` - Alternative names (array)
- `family_relationships` - Family tree (JSONB)

### Social Media:
- `twitter_url` - Twitter profile
- `instagram_url` - Instagram profile
- `facebook_url` - Facebook profile
- `website_url` - Official website

---

## Safety Features

✅ Only applies enrichments with status = `approved`  
✅ Non-destructive: Only updates fields with new data  
✅ Preserves existing data if enrichment field is null  
✅ Tracks application with `applied_at` timestamp  
✅ Provides detailed success/failure logging  

---

## Optional: Manual Review Before Approving

To review specific enrichments before auto-approving:

```sql
-- View all pending enrichments with details
SELECT 
  c.name_en,
  e.confidence_score,
  LEFT(e.full_bio, 100) as bio_preview,
  e.date_of_birth,
  e.place_of_birth,
  e.source_url
FROM celebrity_wiki_enrichments e
JOIN celebrities c ON e.celebrity_id = c.id
WHERE e.status = 'pending'
ORDER BY e.confidence_score DESC;

-- Approve specific celebrities
UPDATE celebrity_wiki_enrichments e
SET status = 'approved', reviewed_at = NOW()
FROM celebrities c
WHERE e.celebrity_id = c.id
  AND c.name_en IN ('Chiranjeevi', 'Prabhas', 'Ram Charan')
  AND e.status = 'pending';
```

---

## Rollback (If Needed)

If something goes wrong, you can:

1. **Mark as pending again:**
```sql
UPDATE celebrity_wiki_enrichments 
SET status = 'pending', applied_at = NULL
WHERE status = 'applied';
```

2. **Restore from backup:** (if you took a DB snapshot before applying)

---

## Next Steps After Applying

1. ✅ Verify data on your website
2. ✅ Test celebrity profile pages
3. ✅ Review medium-confidence enrichments (50-70%)
4. ✅ Handle movie enrichments next

---

**Ready to proceed?** Start with Step 1! 🎬
