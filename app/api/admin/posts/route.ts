/**
 * Admin Posts API
 * Fetch and manage posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0');

    let query = supabase
      .from('posts')
      .select('id, title, title_te, slug, status, category, content_sector, content_type, views, created_at, published_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Posts API error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Generate slug if not provided - only ASCII characters allowed
    const titleForSlug = body.title || body.title_te || 'post';
    const slug = body.slug || titleForSlug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[\u0C00-\u0C7F]/g, '') // Remove Telugu characters
      .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dash
      .replace(/^-+|-+$/g, '')         // Trim dashes from ends
      .slice(0, 80) + '-' + Date.now().toString(36);

    // Prepare post data - only include columns that exist
    const postData: Record<string, unknown> = {
      id: uuidv4(),
      title: body.title || body.title_te,
      title_te: body.title_te || body.title,
      slug,
      telugu_body: body.telugu_body || body.body_te,
      body_te: body.body_te || body.telugu_body,
      category: body.category || 'entertainment',
      status: body.status || 'draft',
      image_url: body.image_url || (body.image_urls?.[0] || null),
      image_urls: body.image_urls || (body.image_url ? [body.image_url] : null),
      tags: body.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add published_at if publishing
    if (body.status === 'published') {
      postData.published_at = body.published_at || new Date().toISOString();
    }

    // Add content platform fields if provided
    if (body.content_sector) postData.content_sector = body.content_sector;
    if (body.content_type) postData.content_type = body.content_type;
    if (body.content_subsector) postData.content_subsector = body.content_subsector;
    if (body.audience_profile) postData.audience_profile = body.audience_profile;
    if (body.sensitivity_level) postData.sensitivity_level = body.sensitivity_level;
    if (body.age_group) postData.age_group = body.age_group;
    if (body.fact_confidence_score !== undefined) postData.fact_confidence_score = body.fact_confidence_score;
    if (body.source_count !== undefined) postData.source_count = body.source_count;
    if (body.source_refs) postData.source_refs = body.source_refs;
    if (body.verification_status) postData.verification_status = body.verification_status;
    if (body.fictional_label !== undefined) postData.fictional_label = body.fictional_label;
    if (body.requires_disclaimer !== undefined) postData.requires_disclaimer = body.requires_disclaimer;
    if (body.disclaimer_type) postData.disclaimer_type = body.disclaimer_type;
    if (body.historical_period) postData.historical_period = body.historical_period;
    if (body.geo_context) postData.geo_context = body.geo_context;
    if (body.schema_type) postData.schema_type = body.schema_type;

    const { data, error } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error('Create post error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Post created successfully',
    });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
