#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  📊 ATTRIBUTION FIXES - LIVE MONITOR"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check if script is running
if pgrep -f "apply-attribution-fixes-from-audit.ts" > /dev/null; then
  echo "✅ Status: RUNNING"
else
  echo "⏸️  Status: COMPLETED or STOPPED"
fi

echo ""

# Extract stats from log
LOG_FILE="attribution-fixes-log-v2.txt"

if [ -f "$LOG_FILE" ]; then
  # Count celebrities processed
  PROCESSED=$(grep -c "^\[.*movies\)" "$LOG_FILE" 2>/dev/null || echo "0")
  echo "👥 Celebrities Processed: $PROCESSED / 108"
  
  # Count successful fixes
  SUCCESS=$(grep -c "^  ✓" "$LOG_FILE" 2>/dev/null || echo "0")
  echo "✅ Successful Attributions: $SUCCESS"
  
  # Count failed
  FAILED=$(grep -c "^  ✗" "$LOG_FILE" 2>/dev/null || echo "0")
  echo "❌ Failed: $FAILED"
  
  # Success rate
  if [ "$SUCCESS" -gt 0 ]; then
    TOTAL=$((SUCCESS + FAILED))
    if [ "$TOTAL" -gt 0 ]; then
      RATE=$(awk "BEGIN {printf \"%.1f\", ($SUCCESS/$TOTAL)*100}")
      echo "📈 Success Rate: ${RATE}%"
    fi
  fi
else
  echo "⚠️  Log file not found"
fi

echo ""
echo "📍 Recent Activity:"
echo "─────────────────────────────────────────────────────────────"
tail -25 "$LOG_FILE" 2>/dev/null || echo "(No log data yet)"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Run: ./monitor-attribution.sh to refresh"
echo "═══════════════════════════════════════════════════════════════"
