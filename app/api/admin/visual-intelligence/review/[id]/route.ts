/**
 * API Route: Visual Intelligence Review CRUD
 * 
 * Provides update and delete operations for reviews from the visual intelligence dashboard.
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
      'smart_review',
      'needs_human_review',
    ];
    
    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const { data, error } = await supabase
      .from('movie_reviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating review:', error);
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
    // Clear the smart_review data instead of deleting the review
    const { error } = await supabase
      .from('movie_reviews')
      .update({ 
        smart_review: null,
        needs_human_review: false,
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Smart review cleared' });
  } catch (error: any) {
    console.error('Error deleting review:', error);
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
      .from('movie_reviews')
      .select(`
        *,
        movies (
          title_en,
          release_year
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

