#!/bin/bash
# Fast enrichment loop - runs batches sequentially without timeouts

BATCH_SIZE=50
MAX_BATCHES=20

echo "🚀 Starting Fast Enrichment Loop"
echo "=================================="
echo "Batch size: $BATCH_SIZE"
echo "Max batches: $MAX_BATCHES"
echo ""

for i in $(seq 1 $MAX_BATCHES); do
    echo ""
    echo "========================================"
    echo "🔄 BATCH $i/$MAX_BATCHES"
    echo "========================================"
    
    # Run the batch
    npx tsx scripts/enrich-waterfall.ts --placeholders-only --limit=$BATCH_SIZE --execute
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -ne 0 ]; then
        echo "❌ Batch $i failed with exit code $EXIT_CODE"
        echo "Continuing to next batch..."
    else
        echo "✅ Batch $i completed"
    fi
    
    # Short delay
    echo "⏳ Waiting 3 seconds..."
    sleep 3
done

echo ""
echo "🎉 Fast enrichment loop complete!"
echo "Run again if more movies remain."
