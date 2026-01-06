#!/bin/bash
# ============================================================
# NIGHTLY IMAGE ENRICHMENT SCRIPT
# ============================================================
# 
# This script runs the multi-source enrichment waterfall in batch mode
# to process movies with placeholder images overnight.
#
# Usage:
#   ./scripts/nightly-image-enrichment.sh
#   ./scripts/nightly-image-enrichment.sh --limit=200
#   ./scripts/nightly-image-enrichment.sh --dry-run
#
# Cron Example (run at 2 AM daily):
#   0 2 * * * /path/to/telugu-portal/scripts/nightly-image-enrichment.sh >> /var/log/enrichment.log 2>&1
#
# ============================================================

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_DIR/logs"
DATE=$(date +%Y%m%d)
LOG_FILE="$LOG_DIR/enrichment-$DATE.log"

# Default settings
LIMIT=100
DRY_RUN=false
AUTO_APPROVE=0.8
QUEUE_BELOW=0.6

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --limit=*)
            LIMIT="${1#*=}"
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --auto-approve=*)
            AUTO_APPROVE="${1#*=}"
            shift
            ;;
        --queue-below=*)
            QUEUE_BELOW="${1#*=}"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Log start
echo "============================================================" | tee -a "$LOG_FILE"
echo "NIGHTLY IMAGE ENRICHMENT - $(date)" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "Project: $PROJECT_DIR" | tee -a "$LOG_FILE"
echo "Limit: $LIMIT movies" | tee -a "$LOG_FILE"
echo "Auto-approve above: $AUTO_APPROVE" | tee -a "$LOG_FILE"
echo "Queue below: $QUEUE_BELOW" | tee -a "$LOG_FILE"
echo "Dry run: $DRY_RUN" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Change to project directory
cd "$PROJECT_DIR"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "ERROR: .env.local not found!" | tee -a "$LOG_FILE"
    exit 1
fi

# Build command
CMD="npx tsx scripts/enrich-waterfall.ts --placeholders-only --batch --limit=$LIMIT --auto-approve-above=$AUTO_APPROVE --queue-below=$QUEUE_BELOW"

if [ "$DRY_RUN" = false ]; then
    CMD="$CMD --execute"
fi

# Run the enrichment
echo "Running: $CMD" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

eval "$CMD" 2>&1 | tee -a "$LOG_FILE"

# Log completion
echo "" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"
echo "COMPLETED - $(date)" | tee -a "$LOG_FILE"
echo "============================================================" | tee -a "$LOG_FILE"

# Report summary
if [ -f "$LOG_FILE" ]; then
    echo ""
    echo "Log saved to: $LOG_FILE"
    
    # Extract quick stats if available
    PROCESSED=$(grep -o "Processed:[[:space:]]*[0-9]*" "$LOG_FILE" | tail -1 | grep -o "[0-9]*" || echo "0")
    ENRICHED=$(grep -o "Enriched:[[:space:]]*[0-9]*" "$LOG_FILE" | tail -1 | grep -o "[0-9]*" || echo "0")
    
    if [ "$PROCESSED" != "0" ]; then
        echo "Quick Stats: Processed $PROCESSED, Enriched $ENRICHED"
    fi
fi

