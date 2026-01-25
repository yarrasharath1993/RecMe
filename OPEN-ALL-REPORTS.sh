#!/bin/bash
# Quick script to open all reports from today's manual research session

echo "Opening all manual research reports..."

# Master index
open docs/manual-review/ALL-BATCHES-INDEX.md

# Completion reports
open docs/manual-review/MANUAL-RESEARCH-SESSION-COMPLETE.md
open docs/manual-review/TELUGU-NAMES-BATCH-1-COMPLETE.md
open docs/manual-review/AWARDS-BATCH-1-COMPLETE.md
open docs/manual-review/AUTOMATED-BLITZ-COMPLETE.md

# Batch files (completed data)
open docs/manual-review/TELUGU-NAMES-BATCH-1.tsv
open docs/manual-review/AWARDS-RESEARCH-BATCH-1.tsv

# Master roadmap
open docs/manual-review/PATH-TO-100-PERCENT-REPORT.md

echo "✅ All reports opened!"
