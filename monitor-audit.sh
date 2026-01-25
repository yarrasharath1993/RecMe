#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  📊 FILMOGRAPHY AUDIT - LIVE MONITOR"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if audit is running
if pgrep -f "automated-attribution-audit.ts" > /dev/null; then
  echo "✅ Status: RUNNING"
else
  echo "⏸️  Status: COMPLETED or STOPPED"
fi

echo ""

# Count celebrities processed
PROCESSED=$(grep -c "^Progress:" audit-full-log-final.txt 2>/dev/null || echo "0")
echo "📋 Celebrities Processed: $PROCESSED / 184"

# Count CSVs generated
CSV_COUNT=$(ls attribution-audits/*.csv 2>/dev/null | wc -l | tr -d ' ')
echo "📁 CSV Files Generated: $CSV_COUNT"

# Count total movies found
MOVIES_FOUND=$(grep "Found.*movies on Wikipedia" audit-full-log-final.txt 2>/dev/null | grep -oE "[0-9]+ movies" | grep -oE "[0-9]+" | awk '{s+=$1} END {print s}')
echo "🎬 Total Movies Found: ${MOVIES_FOUND:-0}"

# Show recent progress
echo ""
echo "📍 Recent Activity:"
echo "─────────────────────────────────────────────────────────────"
tail -20 audit-full-log-final.txt 2>/dev/null || echo "(No log data yet)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Run: ./monitor-audit.sh to refresh"
echo "═══════════════════════════════════════════════════════════════"
