/**
 * API Route: Visual Intelligence Movie CRUD
 * 
 * Provides update and delete operations for movies from the visual intelligence dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = await params;
  
  try {
    const body = await request.json();
    
    // Only allow updating specific fields
    const allowedFields = [
      'poster_url',
      'poster_confidence',
      'poster_visual_type',
      'archive_card_data',
      'is_published',
    ];
    
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }
    
    // If updating visual data, update verification timestamp
    if ('poster_confidence' in updateData || 'poster_visual_type' in updateData) {
      updateData.visual_verified_at = new Date().toISOString();
      updateData.visual_verified_by = 'admin';
    }

    const { data, error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating movie:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = await params;
  
  try {
    // Soft delete by unpublishing, or hard delete if needed
    // For safety, we'll just unpublish
    const { error } = await supabase
      .from('movies')
      .update({ is_published: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Movie unpublished (soft delete)' });
  } catch (error: any) {
    console.error('Error deleting movie:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { id } = await params;
  
  try {
    const { data, error } = await supabase
      .from('movies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching movie:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

