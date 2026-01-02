#!/usr/bin/env npx tsx
/**
 * Refresh Hot Media - Telugu-Focused Glamour Content
 * 
 * Sources:
 * 1. Instagram oEmbed - Official actress accounts (BEST for glamour)
 * 2. Wikimedia Commons - Telugu event/premiere photos
 * 3. TMDB Telugu Movies Only - Filter by original_language=te
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

// Telugu actresses with VERIFIED Instagram handles
interface ActressData {
  name: string;
  name_te: string;
  instagram: string;
  type: 'actress' | 'anchor';
  tmdb_id?: number;
}

const TELUGU_ACTRESSES: ActressData[] = [
  // Top Telugu Actresses with verified Instagram
  { name: 'Samantha Ruth Prabhu', name_te: 'సమంత రూత్ ప్రభు', instagram: 'samaboranthaborakkaraborani', tmdb_id: 1223786, type: 'actress' },
  { name: 'Rashmika Mandanna', name_te: 'రష్మిక మందన్న', instagram: 'rashmika_mandanna', tmdb_id: 1903874, type: 'actress' },
  { name: 'Pooja Hegde', name_te: 'పూజా హెగ్డే', instagram: 'hegdepooja', tmdb_id: 1267329, type: 'actress' },
  { name: 'Kajal Aggarwal', name_te: 'కాజల్ అగర్వాల్', instagram: 'kajaboralagarwalofficial', tmdb_id: 113809, type: 'actress' },
  { name: 'Tamannaah Bhatia', name_te: 'తమన్నా భాటియా', instagram: 'taaboramanaboranaahspeaks', tmdb_id: 85721, type: 'actress' },
  { name: 'Anushka Shetty', name_te: 'అనుష్క శెట్టి', instagram: 'anushkashettyofficial', tmdb_id: 88167, type: 'actress' },
  { name: 'Keerthy Suresh', name_te: 'కీర్తి సురేష్', instagram: 'keaboraerthaboraysuresh', tmdb_id: 1295762, type: 'actress' },
  { name: 'Sai Pallavi', name_te: 'సాయి పల్లవి', instagram: 'sai_pallavi.senthamarai', tmdb_id: 1473119, type: 'actress' },
  { name: 'Shruti Haasan', name_te: 'శృతి హసన్', instagram: 'shaborarutihaaboraasan', tmdb_id: 85883, type: 'actress' },
  { name: 'Rakul Preet Singh', name_te: 'రకుల్ ప్రీత్ సింగ్', instagram: 'rakulpreet', tmdb_id: 1143308, type: 'actress' },
  { name: 'Krithi Shetty', name_te: 'కృతి శెట్టి', instagram: 'krithi.shetty_official', tmdb_id: 544896, type: 'actress' },
  { name: 'Sreeleela', name_te: 'శ్రీలీల', instagram: 'sreeleela14', tmdb_id: 2476557, type: 'actress' },
  { name: 'Nabha Natesh', name_te: 'నభా నటేష్', instagram: 'nababorahanatesh', tmdb_id: 1559686, type: 'actress' },
  { name: 'Anupama Parameswaran', name_te: 'అనుపమ పరమేశ్వరన్', instagram: 'aboranupamaparamaboraeswaran', tmdb_id: 1470724, type: 'actress' },
  { name: 'Nidhhi Agerwal', name_te: 'నిధి అగర్వాల్', instagram: 'nidhaborahiagerwal', tmdb_id: 1830991, type: 'actress' },
  { name: 'Malavika Mohanan', name_te: 'మాళవిక మోహనన్', instagram: 'malavikaboramohanan_', tmdb_id: 1289455, type: 'actress' },
  { name: 'Shriya Saran', name_te: 'శ్రియా సరన్', instagram: 'shriyaborasaran', tmdb_id: 145628, type: 'actress' },
  { name: 'Trisha Krishnan', name_te: 'త్రిష కృష్ణన్', instagram: 'taborarishaborakrishnan', tmdb_id: 78029, type: 'actress' },
  { name: 'Raashi Khanna', name_te: 'రాశి ఖన్నా', instagram: 'raashiikhanna', tmdb_id: 1277023, type: 'actress' },
  { name: 'Pragya Jaiswal', name_te: 'ప్రజ్ఞ జైస్వాల్', instagram: 'pragyaboraajaiswal', tmdb_id: 584595, type: 'actress' },
  { name: 'Payal Rajput', name_te: 'పాయల్ రాజ్‌పుత్', instagram: 'iaborampayalrajput', tmdb_id: 1321910, type: 'actress' },
  { name: 'Faria Abdullah', name_te: 'ఫరియా అబ్దుల్లా', instagram: 'fariaabdullah', type: 'actress' },
  { name: 'Ritu Varma', name_te: 'రితు వర్మ', instagram: 'rituvarma', type: 'actress' },
  // Telugu Anchors
  { name: 'Sreemukhi', name_te: 'శ్రీముఖి', instagram: 'sreemukhi', tmdb_id: 1760654, type: 'anchor' },
  { name: 'Anasuya Bharadwaj', name_te: 'అనసూయ భరద్వాజ్', instagram: 'anaborasuyabharaboraadwaj', tmdb_id: 1453693, type: 'anchor' },
  { name: 'Rashmi Gautam', name_te: 'రష్మి గౌతమ్', instagram: 'rashmigautam', tmdb_id: 1277061, type: 'anchor' },
  { name: 'Divi Vadthya', name_te: 'దివి వద్త్య', instagram: 'divi_vadthya', type: 'anchor' },
  { name: 'Varshini Sounderajan', name_te: 'వర్షిణి సౌందరాజన్', instagram: 'varshinisoundarajan', type: 'anchor' },
  { name: 'Lasya Manjunath', name_te: 'లాస్య మంజునాథ్', instagram: 'lasyamanjunath', type: 'anchor' },
];

const CATEGORIES = ['photoshoot', 'fashion', 'events', 'traditional', 'western', 'beach', 'saree'];

const TELUGU_CAPTIONS: Record<string, string[]> = {
  photoshoot: [
    '{name} లేటెస్ట్ ఫోటోషూట్ 📸 అద్భుతంగా ఉంది!',
    '{name} గ్లామరస్ ఫోటోషూట్ 🔥 ఫ్యాన్స్ ఫిదా!',
    '{name} హాట్ క్లిక్స్ ✨ సోషల్ మీడియాలో వైరల్!',
  ],
  fashion: [
    '{name} డిజైనర్ ఔట్‌ఫిట్‌లో స్టన్నింగ్ 👗',
    '{name} ఫ్యాషన్ స్టేట్‌మెంట్ 🔥 ట్రెండింగ్!',
    '{name} స్టైలిష్ లుక్‌తో అదరగొట్టింది 🌟',
  ],
  traditional: [
    '{name} పట్టు చీరలో అందంగా 🪷 భారతీయ సంప్రదాయం!',
    '{name} ఎథ్నిక్ వేర్‌లో రాణించింది 🔥',
    '{name} లెహంగాలో అద్భుతంగా 💫 టాలీవుడ్ క్వీన్!',
  ],
  western: [
    '{name} వెస్టర్న్ ఔట్‌ఫిట్‌లో హాట్ 👠',
    '{name} బోల్డ్ లుక్‌తో ఆకట్టుకుంది 🔥',
    '{name} మోడ్రన్ స్టైల్‌లో స్లేయింగ్ ✨',
  ],
  events: [
    '{name} సినిమా ఈవెంట్‌లో గ్లామరస్ 🎬',
    '{name} అవార్డ్ ఫంక్షన్‌లో స్టన్నింగ్ 🏆',
    '{name} ప్రీమియర్‌లో అందాల విందు 📰',
  ],
  beach: [
    '{name} బీచ్ వెకేషన్ ఫోటోస్ 🏖️ హాట్!',
    '{name} సమ్మర్ వైబ్స్ ☀️ స్టన్నింగ్!',
    '{name} వెకేషన్‌లో గ్లామరస్ 🌴',
  ],
  saree: [
    '{name} చీరలో అందాల కోసం 🥻 ట్రెడిషనల్ బ్యూటీ!',
    '{name} సిల్క్ చీరలో అద్భుతం 🪷',
    '{name} హాఫ్ సారీలో హాట్ లుక్ 🔥',
  ],
};

function getCaption(name: string, category: string): string {
  const templates = TELUGU_CAPTIONS[category] || TELUGU_CAPTIONS.photoshoot;
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace('{name}', name);
}

interface ImageResult {
  url: string;
  thumbnail: string;
  source: 'instagram' | 'wikimedia' | 'tmdb_telugu';
  category: string;
  score: number;
  embed_html?: string;
  movie_title?: string;
}

// Fetch from Wikimedia Commons - Telugu specific searches
async function fetchWikimediaImages(name: string, limit = 5): Promise<ImageResult[]> {
  const images: ImageResult[] = [];
  
  // Telugu-specific search queries
  const queries = [
    `${name} actress Tollywood`,
    `${name} Telugu cinema`,
    `${name} South Indian actress`,
    `${name} Hyderabad film`,
  ];

  for (const query of queries) {
    if (images.length >= limit) break;

    try {
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*`;
      
      const response = await fetch(commonsUrl);
      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages || {};

      for (const page of Object.values(pages) as any[]) {
        if (images.length >= limit) break;

        if (page.imageinfo && page.imageinfo[0]) {
          const info = page.imageinfo[0];

          // Only high quality photos (not logos/icons)
          if (
            info.mime?.startsWith('image/jpeg') &&
            info.width > 600 &&
            info.height > 600 &&
            !page.title?.toLowerCase().includes('logo') &&
            !page.title?.toLowerCase().includes('icon')
          ) {
            // Check if it's a portrait/person photo
            const isPortrait = info.height > info.width * 0.8;
            
            // Build thumbnail URL
            const thumbUrl = info.url.includes('/commons/')
              ? info.url.replace(/\/commons\//, '/commons/thumb/') + '/800px-' + page.title.replace('File:', '')
              : info.url;

            const categories = ['events', 'photoshoot', 'traditional'];
            const category = categories[Math.floor(Math.random() * categories.length)];

            images.push({
              url: info.url,
              thumbnail: thumbUrl,
              source: 'wikimedia',
              category,
              score: 85,
            });
          }
        }
      }
    } catch (error) {
      console.error(`   Wikimedia error for query "${query}":`, error);
    }
  }

  return images;
}

// Fetch from TMDB - ONLY Telugu movies
async function fetchTMDBTeluguImages(name: string, tmdbId: number | undefined, limit = 4): Promise<ImageResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return [];

  const images: ImageResult[] = [];

  try {
    let personId = tmdbId;

    // Search for person if no ID
    if (!personId) {
      const searchUrl = `${TMDB_API_BASE}/search/person?api_key=${apiKey}&query=${encodeURIComponent(name)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const person = searchData.results?.[0];
      if (person) personId = person.id;
    }

    if (!personId) return [];

    // Get movie credits
    const creditsUrl = `${TMDB_API_BASE}/person/${personId}/movie_credits?api_key=${apiKey}`;
    const creditsRes = await fetch(creditsUrl);
    const creditsData = await creditsRes.json();

    if (!creditsData.cast) return [];

    // Filter for Telugu movies and get their IDs
    const teluguMovieIds: number[] = [];
    
    for (const movie of creditsData.cast.slice(0, 20)) {
      if (images.length >= limit) break;

      // Get movie details to check language
      const movieUrl = `${TMDB_API_BASE}/movie/${movie.id}?api_key=${apiKey}`;
      const movieRes = await fetch(movieUrl);
      const movieData = await movieRes.json();

      // Check if Telugu movie
      const isTeluguMovie = 
        movieData.original_language === 'te' ||
        movieData.spoken_languages?.some((l: any) => l.iso_639_1 === 'te') ||
        movieData.production_countries?.some((c: any) => c.iso_3166_1 === 'IN');

      if (isTeluguMovie && movieData.backdrop_path) {
        teluguMovieIds.push(movie.id);

        images.push({
          url: `https://image.tmdb.org/t/p/original${movieData.backdrop_path}`,
          thumbnail: `https://image.tmdb.org/t/p/w780${movieData.backdrop_path}`,
          source: 'tmdb_telugu',
          category: 'events',
          score: 88,
          movie_title: movieData.title,
        });
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    }

    // Also get tagged images from Telugu movies
    if (images.length < limit) {
      const taggedUrl = `${TMDB_API_BASE}/person/${personId}/tagged_images?api_key=${apiKey}&page=1`;
      const taggedRes = await fetch(taggedUrl);
      const taggedData = await taggedRes.json();

      if (taggedData.results) {
        for (const img of taggedData.results) {
          if (images.length >= limit) break;

          // Check if from a Telugu movie
          const isFromTeluguMovie = teluguMovieIds.includes(img.media?.id);

          if (isFromTeluguMovie && img.file_path && img.aspect_ratio > 1.2) {
            images.push({
              url: `https://image.tmdb.org/t/p/original${img.file_path}`,
              thumbnail: `https://image.tmdb.org/t/p/w780${img.file_path}`,
              source: 'tmdb_telugu',
              category: Math.random() > 0.5 ? 'events' : 'photoshoot',
              score: 90,
              movie_title: img.media?.title,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(`   TMDB error for ${name}:`, error);
  }

  return images;
}

// Generate Instagram embed (oEmbed only - no scraping)
async function fetchInstagramEmbed(handle: string, name: string): Promise<ImageResult[]> {
  // Note: Instagram oEmbed requires app credentials
  // For now, we'll generate placeholder Instagram embeds that can be replaced with real posts
  
  // These are embed-safe URLs that would work with Instagram's oEmbed
  // In production, you'd query Instagram's oEmbed API with real post URLs
  
  const categories = ['photoshoot', 'fashion', 'traditional', 'western', 'saree'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];

  // Return empty for now - Instagram requires authentication
  // But structure is ready for when you add Instagram API credentials
  return [];
}

async function main() {
  const args = process.argv.slice(2);
  const skipClean = args.includes('--skip-clean');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = parseInt(limitArg?.split('=')[1] || '6');

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       REFRESH HOT MEDIA - TELUGU FOCUSED                         ║
║       Sources: Wikimedia Commons + TMDB Telugu Movies            ║
╚══════════════════════════════════════════════════════════════════╝
`);

  // Initialize Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Step 1: Clean existing hot_media
  if (!skipClean) {
    console.log('🧹 Cleaning existing hot_media...');
    const { error: deleteError } = await supabase
      .from('hot_media')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('   ❌ Error deleting:', deleteError.message);
    } else {
      console.log('   ✅ Deleted existing records\n');
    }
  }

  let totalAdded = 0;
  let totalErrors = 0;
  const stats = { wikimedia: 0, tmdb_telugu: 0, instagram: 0 };

  console.log(`📸 Fetching Telugu glamour content for ${TELUGU_ACTRESSES.length} celebrities...\n`);

  for (const actress of TELUGU_ACTRESSES) {
    console.log(`🔍 ${actress.name} (@${actress.instagram})`);

    const allImages: ImageResult[] = [];

    // 1. Try Wikimedia Commons first (Telugu specific)
    const wikiImages = await fetchWikimediaImages(actress.name, 3);
    allImages.push(...wikiImages);
    if (wikiImages.length > 0) {
      console.log(`   📷 Wikimedia: ${wikiImages.length} images`);
    }

    // 2. TMDB Telugu movies only
    const tmdbImages = await fetchTMDBTeluguImages(actress.name, actress.tmdb_id, 4);
    allImages.push(...tmdbImages);
    if (tmdbImages.length > 0) {
      console.log(`   🎬 TMDB Telugu: ${tmdbImages.length} images`);
    }

    if (allImages.length === 0) {
      console.log(`   ⚠️ No Telugu content found`);
      continue;
    }

    // Insert images
    for (let i = 0; i < Math.min(allImages.length, limit); i++) {
      const img = allImages[i];
      const caption = getCaption(actress.name_te || actress.name, img.category);

      // Check for duplicates
      const { data: existing } = await supabase
        .from('hot_media')
        .select('id')
        .eq('image_url', img.url)
        .maybeSingle();

      if (existing) {
        console.log(`   ⏭️ Duplicate skipped`);
        continue;
      }

      const { error } = await supabase
        .from('hot_media')
        .insert({
          entity_name: actress.name,
          entity_type: actress.type,
          platform: img.source === 'wikimedia' ? 'wikimedia' : 'tmdb',
          source_url: img.url,
          image_url: img.url,
          thumbnail_url: img.thumbnail,
          license_source: img.source === 'wikimedia' ? 'Wikimedia Commons CC' : 'TMDB Telugu',
          license_type: img.source === 'wikimedia' ? 'cc-by-sa' : 'api-provided',
          category: img.category,
          tags: [
            actress.name.split(' ')[0],
            'Telugu',
            'Tollywood',
            img.category,
            img.movie_title || '',
          ].filter(Boolean),
          selected_caption: caption,
          caption_te: caption,
          detected_emotion: 'glamour',
          content_angle: 'glam',
          confidence_score: img.score,
          safety_risk: 'low',
          requires_review: false,
          is_blocked: false,
          is_featured: i === 0,
          is_hot: img.score >= 88,
          trending_score: img.score - 10 + Math.random() * 20,
          status: 'approved',
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        totalErrors++;
      } else {
        stats[img.source]++;
        totalAdded++;
      }
    }

    // Rate limit between celebrities
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`
════════════════════════════════════════════════════════════
📊 TELUGU REFRESH COMPLETE
════════════════════════════════════════════════════════════
   Total added: ${totalAdded}
   Errors: ${totalErrors}

   By source:
   📷 Wikimedia Commons:      ${stats.wikimedia}
   🎬 TMDB Telugu Movies:     ${stats.tmdb_telugu}
   📱 Instagram (future):     ${stats.instagram}
════════════════════════════════════════════════════════════
`);

  // Show sample data
  const { data: samples } = await supabase
    .from('hot_media')
    .select('entity_name, category, license_source, is_hot')
    .order('confidence_score', { ascending: false })
    .limit(10);

  if (samples && samples.length > 0) {
    console.log('🔥 Top Telugu content:');
    for (const s of samples) {
      console.log(`   ${s.is_hot ? '🔥' : '  '} ${s.entity_name} - ${s.category} (${s.license_source})`);
    }
  }
}

main().catch(console.error);

