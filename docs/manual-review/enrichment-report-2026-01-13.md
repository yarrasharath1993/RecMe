
╔═══════════════════════════════════════════════════════════════════════╗
║         CRITICAL GAPS ENRICHMENT REPORT                               ║
╚═══════════════════════════════════════════════════════════════════════╝

Total Movies Processed:    10
Duration:                  0.4 minutes
Processing Rate:           25.0 movies/minute

ENRICHMENT RESULTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cast & Crew Enriched:     0 (0.0%)
Synopsis Enriched:         0 (0.0%)
Trailers Added:            0 (0.0%)
Tags Applied:              0 (0.0%)

Skipped (no changes):      10
Failed:                    0

Total Enrichments:         0

RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  Low cast/crew enrichment rate. Consider:
   - Enabling more Telugu sources (bookmyshow, eenadu, sakshi, etc.)
   - Running focused enrichment: --focus=cast-crew

⚠️  Low synopsis enrichment rate. Many movies already have Telugu synopsis or missing English.

⚠️  Low trailer enrichment rate. Movies may not have TMDB IDs or trailers not available.
   - Run TMDB ID enrichment first: npx tsx scripts/enrich-tmdb-ids.ts

Next Steps:
1. Re-run audit: npx tsx scripts/audit-movie-data-completeness.ts
2. Review conflicts (if any) in manual review queue
3. Run editorial tagging for 'featured' movies (manual)

