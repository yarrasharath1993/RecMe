/**
 * Instagram oEmbed API for Hot Media
 * 
 * POST /api/hot-media/instagram
 * - Add Instagram post by URL (auto-fetches oEmbed)
 * 
 * GET /api/hot-media/instagram/validate?url=...
 * - Validate and preview Instagram post
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  fetchInstagramEmbed, 
  isValidInstagramUrl, 
  detectInstagramType,
  TELUGU_CELEBRITY_INSTAGRAM 
} from '@/lib/hot-media/instagram-embed';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// Telugu captions
const TELUGU_CAPTIONS: Record<string, string[]> = {
  photoshoot: [
    '{name} లేటెస్ట్ ఫోటోషూట్ 📸',
    '{name} గ్లామరస్ క్లిక్స్ 🔥',
    '{name} స్టన్నింగ్ ఫోటోస్ ✨',
  ],
  fashion: ['{name} ఫ్యాషన్ గేమ్ స్ట్రాంగ్ 👗'],
  traditional: ['{name} చీరలో అందంగా 🪷'],
  western: ['{name} వెస్టర్న్ లుక్‌లో హాట్ 👠'],
  events: ['{name} ఈవెంట్‌లో గ్లామరస్ 🎬'],
  beach: ['{name} బీచ్ వైబ్స్ 🏖️'],
  saree: ['{name} చీర అందం 🥻'],
  reel: ['{name} వైరల్ రీల్ 🎬 ట్రెండింగ్!'],
};

function getCaption(name: string, category: string): string {
  const templates = TELUGU_CAPTIONS[category] || TELUGU_CAPTIONS.photoshoot;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{name}', name);
}

// GET - Validate Instagram URL and preview
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const action = searchParams.get('action');

  // Return known handles
  if (action === 'handles') {
    return NextResponse.json({
      success: true,
      handles: Object.entries(TELUGU_CELEBRITY_INSTAGRAM).map(([name, handle]) => ({
        name,
        handle,
        profile_url: `https://www.instagram.com/${handle}/`,
      })),
    });
  }

  if (!url) {
    return NextResponse.json({ success: false, error: 'URL required' }, { status: 400 });
  }

  if (!isValidInstagramUrl(url)) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid Instagram URL. Use format: https://instagram.com/p/POST_ID/' 
    }, { status: 400 });
  }

  try {
    const embedInfo = await fetchInstagramEmbed(url);
    const contentType = detectInstagramType(url);

    return NextResponse.json({
      success: true,
      preview: {
        post_id: embedInfo.postId,
        post_url: embedInfo.postUrl,
        content_type: contentType,
        author: embedInfo.authorName || null,
        handle: embedInfo.authorHandle || null,
        thumbnail_url: embedInfo.thumbnailUrl || null,
        has_embed: embedInfo.isValid,
        embed_html: embedInfo.embedHtml,
        warning: embedInfo.error || null,
      },
      known_celebrities: Object.keys(TELUGU_CELEBRITY_INSTAGRAM),
    });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch embed' 
    }, { status: 500 });
  }
}

// POST - Add Instagram post to hot_media
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      url, 
      celebrity_name, 
      celebrity_name_te,
      category = 'photoshoot',
      entity_type = 'actress',
      is_featured = true,
      is_hot = true,
    } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL required' }, { status: 400 });
    }

    if (!isValidInstagramUrl(url)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid Instagram URL' 
      }, { status: 400 });
    }

    if (!celebrity_name) {
      return NextResponse.json({ 
        success: false, 
        error: 'Celebrity name required' 
      }, { status: 400 });
    }

    // Fetch oEmbed
    const embedInfo = await fetchInstagramEmbed(url);
    
    if (!embedInfo.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: embedInfo.error || 'Failed to fetch Instagram embed' 
      }, { status: 400 });
    }

    const supabase = getSupabase();

    // Check for duplicate
    const { data: existing } = await supabase
      .from('hot_media')
      .select('id')
      .eq('source_url', embedInfo.postUrl)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: 'This Instagram post is already in the gallery',
        existing_id: existing.id,
      }, { status: 409 });
    }

    // Generate caption
    const contentType = detectInstagramType(url);
    const captionCategory = contentType === 'reel' ? 'reel' : category;
    const teluguName = celebrity_name_te || celebrity_name;
    const caption = getCaption(teluguName, captionCategory);

    // Insert into hot_media
    const { data, error } = await supabase
      .from('hot_media')
      .insert({
        entity_name: celebrity_name,
        entity_type,
        platform: 'instagram',
        source_url: embedInfo.postUrl,
        embed_url: embedInfo.postUrl,
        embed_html: embedInfo.embedHtml,
        image_url: embedInfo.thumbnailUrl || null,
        thumbnail_url: embedInfo.thumbnailUrl || null,
        license_source: 'Instagram oEmbed',
        license_type: 'embed',
        category: captionCategory,
        tags: [
          celebrity_name.split(' ')[0],
          'Instagram',
          'Telugu',
          'Tollywood',
          captionCategory,
          contentType,
        ],
        selected_caption: caption,
        caption_te: caption,
        detected_emotion: 'glamour',
        content_angle: 'glam',
        confidence_score: 95,
        safety_risk: 'low',
        requires_review: false,
        is_blocked: false,
        is_featured,
        is_hot,
        trending_score: 90 + Math.random() * 10,
        status: 'approved',
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      media: data,
      message: `Added Instagram ${contentType} from ${celebrity_name}`,
    });
  } catch (error) {
    console.error('Instagram POST error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

