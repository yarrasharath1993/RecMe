/**
 * API Route: Archival Outreach Tracking
 * 
 * Manages outreach requests to archives, family estates, and film societies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const sourceType = searchParams.get('source_type');

  try {
    let query = supabase
      .from('archival_outreach')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json({ 
          requests: [], 
          message: 'Outreach table pending migration 007' 
        });
      }
      throw error;
    }

    return NextResponse.json({ requests: data || [] });
  } catch (error: any) {
    console.error('Error fetching outreach requests:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    
    const {
      movie_id,
      movie_title,
      request_type,
      source_type,
      contact_name,
      contact_email,
      contact_phone,
      organization_name,
      status = 'draft',
      request_notes,
    } = body;

    // Validate required fields
    if (!request_type || !source_type) {
      return NextResponse.json(
        { error: 'Request type and source type are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('archival_outreach')
      .insert({
        movie_id,
        movie_title,
        request_type,
        source_type,
        contact_name,
        contact_email,
        contact_phone,
        organization_name,
        status,
        request_notes,
        created_by: 'admin',
      })
      .select()
      .single();

    if (error) {
      // Table might not exist yet
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Outreach table not yet created. Please run migration 007.' },
          { status: 500 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error creating outreach request:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Handle status transitions
    if (updates.status === 'sent' && !updates.sent_at) {
      updates.sent_at = new Date().toISOString();
    }
    if (['responded', 'approved', 'rejected', 'partial_approval'].includes(updates.status) && !updates.response_at) {
      updates.response_at = new Date().toISOString();
    }
    if (updates.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    updates.updated_at = new Date().toISOString();
    updates.updated_by = 'admin';

    const { data, error } = await supabase
      .from('archival_outreach')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating outreach request:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('archival_outreach')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting outreach request:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

