#!/bin/bash
# Run Impact System Migrations
# Usage: bash scripts/run-migrations.sh

set -e  # Exit on error

echo "🗄️  Running Movie Impact & Intelligence System Migrations..."
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# Check if database URL is set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in .env.local"
    exit 1
fi

echo "✓ Environment loaded"
echo ""

# Extract database connection info from Supabase URL
# You'll need your actual PostgreSQL connection string
# Format: postgresql://user:password@host:port/database

echo "📋 Migrations to run:"
echo "  1. 033-confidence-scoring.sql"
echo "  2. 034-entity-relations.sql"
echo "  3. 035-inference-audit-log.sql"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not found. Using Supabase SQL editor instead."
    echo ""
    echo "📝 Manual steps:"
    echo "  1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql/new"
    echo "  2. Copy and run each migration file:"
    echo "     - migrations/033-confidence-scoring.sql"
    echo "     - migrations/034-entity-relations.sql"
    echo "     - migrations/035-inference-audit-log.sql"
    echo ""
    echo "✓ After running migrations in Supabase, proceed to Step 2"
    exit 0
fi

# If you have direct PostgreSQL access:
echo "🔄 Running migrations with psql..."
echo ""

# Uncomment and configure if you have direct PostgreSQL access:
# DB_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres"
# psql "$DB_URL" -f migrations/033-confidence-scoring.sql
# psql "$DB_URL" -f migrations/034-entity-relations.sql
# psql "$DB_URL" -f migrations/035-inference-audit-log.sql

echo "✅ Migrations completed!"
echo ""
echo "Next step: Set environment variables (Step 2)"
