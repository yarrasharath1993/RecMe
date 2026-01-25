# Movie Name Inconsistencies Audit Report

**Date:** 2026-01-14T19:36:23.277Z
**Total Movies:** 1000
**Celebrities with Variations:** 0

## Summary

This report identifies celebrities whose names appear in multiple formats across the movies table,
causing duplicate entries in search results.

---

## Top 50 Inconsistencies (by impact)


## SQL Normalization Script

```sql
BEGIN;

-- This script normalizes celebrity names in the movies table
-- Always backup before running!

-- Uncomment to commit:
-- COMMIT;

-- Or rollback to review:
ROLLBACK;
```
