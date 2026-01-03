#!/bin/bash

# FIX SECTION LANGUAGE FILTERS
# Adds language parameter and filtering to all section generator functions

FILE="lib/reviews/section-intelligence.ts"

echo "🔧 Fixing section-intelligence.ts to add language filters..."

# Backup original file
cp "$FILE" "$FILE.backup"

# Add language parameter to function signatures and add .eq('language', language) filter
sed -i '' 's/export async function getUpcoming(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection>/export async function getUpcoming(config: SectionConfig = DEFAULT_CONFIG, language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getTrending(): Promise<ReviewSection>/export async function getTrending(language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getClassics(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection>/export async function getClassics(config: SectionConfig = DEFAULT_CONFIG, language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getBlockbusters(): Promise<ReviewSection>/export async function getBlockbusters(language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getHiddenGems(): Promise<ReviewSection>/export async function getHiddenGems(language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getCultClassics(): Promise<ReviewSection>/export async function getCultClassics(language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getMostRecommended(): Promise<ReviewSection>/export async function getMostRecommended(language: string = '\''Telugu'\''): Promise<ReviewSection>/g' "$FILE"

sed -i '' 's/export async function getGenreSections(config: SectionConfig = DEFAULT_CONFIG): Promise<ReviewSection\[\]>/export async function getGenreSections(config: SectionConfig = DEFAULT_CONFIG, language: string = '\''Telugu'\''): Promise<ReviewSection\[\]>/g' "$FILE"

sed -i '' 's/export async function getAllReviewSections(config: SectionConfig = DEFAULT_CONFIG): Promise</export async function getAllReviewSections(config: SectionConfig = DEFAULT_CONFIG, language: string = '\''Telugu'\''): Promise</g' "$FILE"

echo "✅ Function signatures updated"
echo ""
echo "❌ NOTE: This script can only update function signatures."
echo "   You MUST manually add .eq('language', language) to ALL database queries!"
echo ""
echo "Backup created at: $FILE.backup"




