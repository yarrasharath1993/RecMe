/**
 * API Route: Archival Image Curation
 * 
 * Saves archival images with proper provenance and attribution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    
    const {
      movie_id,
      image_url,
      image_type,
      source_name,
      source_type,
      license_type,
      attribution_text,
      year_estimated,
      description,
      is_primary,
      provenance_notes,
      confidence_score,
    } = body;

    // Validate required fields
    if (!movie_id || !image_url || !source_name || !source_type || !license_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is set as primary, update the movie's main poster
    if (is_primary) {
      // Update the movie's archival_source and poster data
      const archivalSource = {
        source_name,
        source_type,
        license_type,
        attribution_text,
        year_estimated,
        provenance_notes,
        acquisition_date: new Date().toISOString().split('T')[0],
        acquired_by: 'admin',
        is_verified: false,
      };

      const { error: movieError } = await supabase
        .from('movies')
        .update({
          poster_url: image_url,
          poster_confidence: confidence_score,
          poster_visual_type: image_type,
          archival_source: archivalSource,
          visual_verified_at: new Date().toISOString(),
          visual_verified_by: 'admin',
        })
        .eq('id', movie_id);

      if (movieError) {
        console.error('Error updating movie:', movieError);
        return NextResponse.json(
          { error: 'Failed to update movie poster' },
          { status: 500 }
        );
      }
    }

    // Insert into movie_archival_images gallery table
    const { data, error } = await supabase
      .from('movie_archival_images')
      .insert({
        movie_id,
        image_url,
        image_type,
        source_name,
        source_type,
        license_type,
        attribution_text,
        year_estimated,
        description,
        is_primary: is_primary || false,
        is_verified: false,
        confidence_score: confidence_score || 0.7,
        created_by: 'admin',
      })
      .select()
      .single();

    if (error) {
      // If table doesn't exist yet (migration not run), just update the movie
      if (error.code === '42P01') {
        // Table doesn't exist - migration not yet applied
        // Still return success if we updated the movie
        if (is_primary) {
          return NextResponse.json({
            success: true,
            message: 'Movie poster updated (gallery table pending migration)',
          });
        }
        return NextResponse.json(
          { error: 'Gallery table not yet created. Please run migration 007.' },
          { status: 500 }
        );
      }
      
      console.error('Error inserting archival image:', error);
      return NextResponse.json(
        { error: 'Failed to save archival image' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: is_primary ? 'Archival image saved and set as primary' : 'Archival image saved to gallery',
    });
  } catch (error: any) {
    console.error('Error in curate API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const searchParams = request.nextUrl.searchParams;
  const movieId = searchParams.get('movie_id');

  if (!movieId) {
    return NextResponse.json(
      { error: 'movie_id is required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('movie_archival_images')
      .select('*')
      .eq('movie_id', movieId)
      .order('display_order', { ascending: true });

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ images: [], message: 'Gallery table pending migration' });
      }
      throw error;
    }

    return NextResponse.json({ images: data || [] });
  } catch (error: any) {
    console.error('Error fetching archival images:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

