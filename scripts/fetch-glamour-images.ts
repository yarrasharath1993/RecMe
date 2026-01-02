#!/usr/bin/env npx tsx
/**
 * Fetch Glamour Images from Multiple Sources
 * 
 * Prioritizes:
 * 1. TMDB Tagged Images (events, photoshoots)
 * 2. TMDB Movie Backdrops (scene shots)
 * 3. Wikimedia Commons (licensed photos)
 * 4. TMDB Profiles (fallback)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { fetchGlamourImages, categorizeImage, getContentAngle, GlamourImage } from '../lib/hot-media/glamour-image-sources';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Telugu celebrities to fetch images for
const TELUGU_CELEBRITIES = [
  // Top Actresses
  { name: 'Rashmika Mandanna', name_te: 'రష్మిక మందన్న' },
  { name: 'Samantha Ruth Prabhu', name_te: 'సమంత' },
  { name: 'Pooja Hegde', name_te: 'పూజా హెగ్డే' },
  { name: 'Sreeleela', name_te: 'శ్రీలీల' },
  { name: 'Krithi Shetty', name_te: 'కృతి శెట్టి' },
  { name: 'Tamannaah Bhatia', name_te: 'తమన్నా భాటియా' },
  { name: 'Keerthy Suresh', name_te: 'కీర్తి సురేష్' },
  { name: 'Rakul Preet Singh', name_te: 'రకుల్ ప్రీత్ సింగ్' },
  { name: 'Nabha Natesh', name_te: 'నభా నటేష్' },
  { name: 'Anupama Parameswaran', name_te: 'అనుపమ పరమేశ్వరన్' },
  
  // More Popular Actresses
  { name: 'Shruti Haasan', name_te: 'శ్రుతి హాసన్' },
  { name: 'Kajal Aggarwal', name_te: 'కాజల్ అగర్వాల్' },
  { name: 'Nayanthara', name_te: 'నయనతార' },
  { name: 'Trisha Krishnan', name_te: 'త్రిష కృష్ణన్' },
  { name: 'Shriya Saran', name_te: 'శ్రియా సరన్' },
  { name: 'Nidhhi Agerwal', name_te: 'నిధి అగర్వాల్' },
  { name: 'Malavika Mohanan', name_te: 'మాలవికా మోహనన్' },
  { name: 'Faria Abdullah', name_te: 'ఫరియా అబ్దుల్లా' },
  
  // Anchors
  { name: 'Sreemukhi', name_te: 'శ్రీముఖి', entity_type: 'anchor' },
  { name: 'Anasuya Bharadwaj', name_te: 'అనసూయ భరద్వాజ్', entity_type: 'anchor' },
];

const TELUGU_CAPTIONS: Record<string, string[]> = {
  'movie-scene': [
    '{name} మూవీ స్టిల్స్ 🎬',
    '{name} సినిమా లుక్స్ 🔥',
  ],
  'photoshoot': [
    '{name} ఫోటోషూట్ 📸 వైరల్!',
    '{name} గ్లామరస్ క్లిక్స్ ✨',
  ],
  'event': [
    '{name} ఈవెంట్ ఫోటోస్ 🏆',
    '{name} రెడ్ కార్పెట్ లుక్ 🎭',
  ],
  'song-video': [
    '{name} సాంగ్ వీడియో లుక్ 🎵',
    '{name} డ్యాన్స్ స్టిల్స్ 💃',
  ],
  'gallery': [
    '{name} గ్యాలరీ ఫోటోస్ 📷',
    '{name} కలెక్షన్ 🌟',
  ],
  'portrait': [
    '{name} పోర్ట్రెయిట్ 📸',
    '{name} క్లోజప్ షాట్ ✨',
  ],
  'profile': [
    '{name} ఫోటో 📸',
    '{name} లుక్ 🌟',
  ],
};

function getCaption(name: string, category: string): string {
  const templates = TELUGU_CAPTIONS[category] || TELUGU_CAPTIONS.profile;
  return templates[Math.floor(Math.random() * templates.length)].replace('{name}', name);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry');
  const cleanFirst = args.includes('--clean');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10');
  
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       GLAMOUR IMAGE FETCHER                                      ║
║       Multi-Source Full-Body Image Discovery                     ║
╚══════════════════════════════════════════════════════════════════╝

Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}
Clean first: ${cleanFirst}
Images per celebrity: ${limit}
`);

  if (cleanFirst && !dryRun) {
    console.log('🧹 Cleaning existing TMDB images...');
    const { error } = await supabase
      .from('hot_media')
      .delete()
      .eq('platform', 'tmdb');
    
    if (error) {
      console.error('   Error:', error.message);
    } else {
      console.log('   ✅ Cleaned\n');
    }
  }

  let totalAdded = 0;
  let totalErrors = 0;
  const sourceStats: Record<string, number> = {};

  for (const celeb of TELUGU_CELEBRITIES) {
    console.log(`\n━━━ ${celeb.name} ━━━`);
    
    try {
      const images = await fetchGlamourImages(celeb.name, {
        maxImages: limit,
        preferFullBody: true,
        includeWikimedia: true,
        includeYouTube: false, // Enable if you have YouTube API key
      });
      
      if (images.length === 0) {
        console.log('   ⚠️ No images found');
        continue;
      }
      
      console.log(`   Found ${images.length} images`);
      
      // Show breakdown by source
      const bySource: Record<string, number> = {};
      for (const img of images) {
        bySource[img.source] = (bySource[img.source] || 0) + 1;
      }
      console.log(`   Sources: ${Object.entries(bySource).map(([k, v]) => `${k}=${v}`).join(', ')}`);
      
      if (dryRun) {
        console.log('   [DRY RUN] Would add:');
        for (const img of images.slice(0, 3)) {
          const category = categorizeImage(img);
          console.log(`      - ${category} (${img.source}) - ${img.is_full_body ? 'FULL BODY' : 'partial'}`);
        }
        continue;
      }
      
      // Add to database
      for (const img of images) {
        const category = categorizeImage(img);
        const caption = getCaption(celeb.name_te, category);
        
        // Check if image already exists
        const { data: existing } = await supabase
          .from('hot_media')
          .select('id')
          .eq('image_url', img.url)
          .single();
        
        if (existing) {
          continue; // Skip duplicates
        }
        
        const { error } = await supabase.from('hot_media').insert({
          entity_name: celeb.name,
          entity_type: (celeb as any).entity_type || 'actress',
          platform: 'tmdb',
          source_url: img.url,
          image_url: img.url,
          thumbnail_url: img.thumbnail_url,
          license_source: img.license,
          license_type: 'api-provided',
          category,
          tags: [
            celeb.name.split(' ')[0],
            category,
            img.source,
            img.is_full_body ? 'full-body' : 'portrait',
            img.movie_title || '',
          ].filter(Boolean),
          selected_caption: caption,
          caption_te: caption,
          detected_emotion: 'glamour',
          content_angle: getContentAngle(img),
          confidence_score: img.confidence,
          safety_risk: 'low',
          requires_review: false,
          is_blocked: false,
          is_featured: img.confidence >= 85,
          is_hot: img.is_full_body,
          trending_score: img.confidence,
          status: 'approved',
          published_at: new Date().toISOString(),
        });
        
        if (error) {
          totalErrors++;
          console.log(`   ❌ Insert error: ${error.message}`);
        } else {
          totalAdded++;
          sourceStats[img.source] = (sourceStats[img.source] || 0) + 1;
          
          if (img.is_full_body) {
            console.log(`   ✅ ${category} (${img.source}) - FULL BODY`);
          }
        }
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 500));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error}`);
      totalErrors++;
    }
  }

  console.log(`
════════════════════════════════════════════════════════════
📊 SUMMARY
════════════════════════════════════════════════════════════
   Celebrities processed: ${TELUGU_CELEBRITIES.length}
   Images added: ${totalAdded}
   Errors: ${totalErrors}
   
   By Source:
${Object.entries(sourceStats).map(([source, count]) => `      ${source}: ${count}`).join('\n')}
════════════════════════════════════════════════════════════
`);

  // Show final stats
  if (!dryRun) {
    const { data: stats } = await supabase
      .from('hot_media')
      .select('is_hot, content_angle')
      .eq('platform', 'tmdb');
    
    const fullBody = stats?.filter(s => s.content_angle === 'full-body').length || 0;
    const hot = stats?.filter(s => s.is_hot).length || 0;
    
    console.log(`
🔥 HOT CONTENT STATS:
   Full-body shots: ${fullBody}
   Marked as HOT: ${hot}
   Total TMDB: ${stats?.length || 0}
`);
  }
}

main().catch(console.error);

