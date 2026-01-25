#!/bin/bash

# Monitor deduplication progress
clear
echo "═══════════════════════════════════════════════════════════════"
echo "  DEDUPLICATION MONITOR"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [ -f deduplication-log-full.txt ]; then
  # Get progress lines
  PROGRESS=$(grep "Progress:" deduplication-log-full.txt | tail -1)
  LAST_MOVIE=$(grep "  ✓" deduplication-log-full.txt | tail -1)
  
  echo "📊 Current Progress:"
  echo "   $PROGRESS"
  echo ""
  echo "🎬 Last Movie Processed:"
  echo "   $LAST_MOVIE"
  echo ""
  
  # Count total movies cleaned
  CLEANED=$(grep "Movies cleaned:" deduplication-log-full.txt | tail -1 | awk '{print $3}' | tr -d ',')
  DUPLICATES=$(grep "Duplicates removed:" deduplication-log-full.txt | tail -1 | awk '{print $3}')
  
  if [ ! -z "$CLEANED" ]; then
    echo "✨ Totals So Far:"
    echo "   Movies cleaned: $CLEANED"
    echo "   Duplicates removed: $DUPLICATES"
  fi
else
  echo "⏳ Waiting for log file to be created..."
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Press Ctrl+C to exit monitor"
echo "Log file: deduplication-log-full.txt"
