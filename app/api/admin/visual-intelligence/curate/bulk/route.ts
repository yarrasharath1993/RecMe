/**
 * API Route: Bulk Archival Image Import
 * 
 * Imports multiple archival images from CSV data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateArchivalConfidence } from '@/lib/visual-intelligence/archival-sources';
import type { ArchivalSourceType, VisualType, LicenseType } from '@/lib/visual-intelligence/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface CSVRow {
  movie_title: string;
  image_url: string;
  image_type: VisualType;
  source_name: string;
  source_type: ArchivalSourceType;
  license_type: LicenseType;
  year_estimated?: string;
  attribution_text?: string;
}

function parseCSV(csv: string): CSVRow[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { csv } = body;

    if (!csv) {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      );
    }

    const rows = parseCSV(csv);
    
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid rows found in CSV' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.movie_title || !row.image_url || !row.source_name) {
          results.failed++;
          results.errors.push(`Row missing required fields: ${row.movie_title || 'Unknown'}`);
          continue;
        }

        // Find movie by title
        const { data: movies, error: searchError } = await supabase
          .from('movies')
          .select('id')
          .ilike('title_en', row.movie_title)
          .limit(1);

        if (searchError || !movies || movies.length === 0) {
          results.failed++;
          results.errors.push(`Movie not found: ${row.movie_title}`);
          continue;
        }

        const movieId = movies[0].id;

        // Calculate confidence
        const confidence = calculateArchivalConfidence(
          row.source_type || 'community',
          row.image_type || 'archival_still',
          false
        );

        // Insert archival image
        const { error: insertError } = await supabase
          .from('movie_archival_images')
          .insert({
            movie_id: movieId,
            image_url: row.image_url,
            image_type: row.image_type || 'archival_still',
            source_name: row.source_name,
            source_type: row.source_type || 'community',
            license_type: row.license_type || 'attribution_required',
            attribution_text: row.attribution_text || `Source: ${row.source_name}`,
            year_estimated: row.year_estimated ? parseInt(row.year_estimated) : null,
            is_primary: false,
            is_verified: false,
            confidence_score: confidence,
            created_by: 'bulk_import',
          });

        if (insertError) {
          // If table doesn't exist, try updating movie directly
          if (insertError.code === '42P01') {
            results.failed++;
            results.errors.push('Gallery table not yet created. Please run migration 007.');
            break;
          }
          
          results.failed++;
          results.errors.push(`Failed to insert: ${row.movie_title} - ${insertError.message}`);
          continue;
        }

        results.success++;
      } catch (rowError: any) {
        results.failed++;
        results.errors.push(`Error processing row: ${row.movie_title || 'Unknown'} - ${rowError.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in bulk import:', error);
    return NextResponse.json(
      { error: error.message, success: 0, failed: 0, errors: [error.message] },
      { status: 500 }
    );
  }
}

