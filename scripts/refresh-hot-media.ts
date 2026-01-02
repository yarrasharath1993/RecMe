#!/usr/bin/env npx tsx
/**
 * Refresh Hot Media - Clean and refetch with improved glamour image selection
 * 
 * Priority order for images:
 * 1. Tagged images (movie stills, red carpet - FULL BODY)
 * 2. Movie backdrops (scenes featuring the celebrity)
 * 3. Wikimedia Commons (event photos, CC licensed)
 * 4. Profile images (LAST RESORT - often headshots)
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const TMDB_API_BASE = 'https://api.themoviedb.org/3';

// Telugu actresses with known TMDB IDs for faster lookup
const ACTRESSES: Array<{
  name: string;
  name_te: string;
  tmdb_id?: number;
  type: 'actress' | 'anchor';
}> = [
  { name: 'Samantha Ruth Prabhu', name_te: 'సమంత రూత్ ప్రభు', tmdb_id: 1223786, type: 'actress' },
  { name: 'Rashmika Mandanna', name_te: 'రష్మిక మందన్న', tmdb_id: 1903874, type: 'actress' },
  { name: 'Pooja Hegde', name_te: 'పూజా హెగ్డే', tmdb_id: 1267329, type: 'actress' },
  { name: 'Kajal Aggarwal', name_te: 'కాజల్ అగర్వాల్', tmdb_id: 113809, type: 'actress' },
  { name: 'Tamannaah Bhatia', name_te: 'తమన్నా భాటియా', tmdb_id: 85721, type: 'actress' },
  { name: 'Anushka Shetty', name_te: 'అనుష్క శెట్టి', tmdb_id: 88167, type: 'actress' },
  { name: 'Nayanthara', name_te: 'నయనతార', tmdb_id: 91548, type: 'actress' },
  { name: 'Keerthy Suresh', name_te: 'కీర్తి సురేష్', tmdb_id: 1295762, type: 'actress' },
  { name: 'Sai Pallavi', name_te: 'సాయి పల్లవి', tmdb_id: 1473119, type: 'actress' },
  { name: 'Shruti Haasan', name_te: 'శృతి హసన్', tmdb_id: 85883, type: 'actress' },
  { name: 'Rakul Preet Singh', name_te: 'రకుల్ ప్రీత్ సింగ్', tmdb_id: 1143308, type: 'actress' },
  { name: 'Krithi Shetty', name_te: 'కృతి శెట్టి', tmdb_id: 544896, type: 'actress' },
  { name: 'Sreeleela', name_te: 'శ్రీలీల', tmdb_id: 2476557, type: 'actress' },
  { name: 'Nabha Natesh', name_te: 'నభా నటేష్', tmdb_id: 1559686, type: 'actress' },
  { name: 'Anupama Parameswaran', name_te: 'అనుపమ పరమేశ్వరన్', tmdb_id: 1470724, type: 'actress' },
  { name: 'Nidhhi Agerwal', name_te: 'నిధి అగర్వాల్', tmdb_id: 1830991, type: 'actress' },
  { name: 'Kiara Advani', name_te: 'కియారా అద్వానీ', tmdb_id: 1340978, type: 'actress' },
  { name: 'Janhvi Kapoor', name_te: 'జాన్హ్వీ కపూర్', tmdb_id: 1974970, type: 'actress' },
  { name: 'Malavika Mohanan', name_te: 'మాళవిక మోహనన్', tmdb_id: 1289455, type: 'actress' },
  { name: 'Shriya Saran', name_te: 'శ్రియా సరన్', tmdb_id: 145628, type: 'actress' },
  { name: 'Trisha Krishnan', name_te: 'త్రిష కృష్ణన్', tmdb_id: 78029, type: 'actress' },
  { name: 'Hansika Motwani', name_te: 'హన్సికా మోట్వానీ', tmdb_id: 1217934, type: 'actress' },
  { name: 'Raashi Khanna', name_te: 'రాశి ఖన్నా', tmdb_id: 1277023, type: 'actress' },
  { name: 'Pragya Jaiswal', name_te: 'ప్రజ్ఞ జైస్వాల్', tmdb_id: 584595, type: 'actress' },
  { name: 'Payal Rajput', name_te: 'పాయల్ రాజ్‌పుత్', tmdb_id: 1321910, type: 'actress' },
  // Anchors
  { name: 'Sreemukhi', name_te: 'శ్రీముఖి', tmdb_id: 1760654, type: 'anchor' },
  { name: 'Anasuya Bharadwaj', name_te: 'అనసూయ భరద్వాజ్', tmdb_id: 1453693, type: 'anchor' },
  { name: 'Rashmi Gautam', name_te: 'రష్మి గౌతమ్', tmdb_id: 1277061, type: 'anchor' },
];

const CATEGORIES = ['photoshoot', 'fashion', 'events', 'traditional', 'western', 'beach'];

const TELUGU_CAPTIONS: Record<string, string[]> = {
  photoshoot: [
    '{name} లేటెస్ట్ ఫోటోషూట్ 📸 స్టన్నింగ్!',
    '{name} మ్యాగజైన్ ఫోటోషూట్ 🔥 అద్భుతం!',
    '{name} హాట్ ఫోటోషూట్ క్లిక్స్ ✨ గార్జియస్!',
  ],
  fashion: [
    '{name} ఫ్యాషన్ ఈవెంట్‌లో గ్లామరస్‌గా 👗',
    '{name} స్టైలిష్ లుక్ 🔥 ట్రెండింగ్!',
    '{name} డిజైనర్ డ్రెస్‌లో స్టన్నింగ్ 🌟',
  ],
  traditional: [
    '{name} సాంప్రదాయ చీరలో అందంగా 🪷',
    '{name} ఎథ్నిక్ లుక్‌లో హాట్ 🔥',
    '{name} లెహంగాలో గ్లామరస్ 💫',
  ],
  western: [
    '{name} వెస్టర్న్ ఔట్‌ఫిట్‌లో హాట్ 👠',
    '{name} బోల్డ్ లుక్ 🔥 స్లేయింగ్!',
    '{name} ఈవెనింగ్ గౌన్‌లో స్టన్నింగ్ ✨',
  ],
  events: [
    '{name} రెడ్ కార్పెట్‌లో గ్లామరస్ 🎬',
    '{name} అవార్డ్ ఫంక్షన్‌లో హాట్ 🏆',
    '{name} మూవీ ప్రీమియర్‌లో స్టన్నింగ్ 📰',
  ],
  beach: [
    '{name} బీచ్ ఫోటోస్ 🏖️ హాట్!',
    '{name} వెకేషన్ వైబ్స్ ☀️ స్టన్నింగ్!',
    '{name} సమ్మర్ లుక్ 🌴 గార్జియస్!',
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
  type: 'tagged' | 'backdrop' | 'profile' | 'wikimedia';
  category: string;
  score: number;
  movieTitle?: string;
}

async function fetchGlamourImages(
  name: string,
  tmdbId: number | undefined,
  limit = 6
): Promise<ImageResult[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.log('⚠️ TMDB_API_KEY not set');
    return [];
  }

  const images: ImageResult[] = [];
  let personId = tmdbId;

  try {
    // Search for person if no ID provided
    if (!personId) {
      const searchUrl = `${TMDB_API_BASE}/search/person?api_key=${apiKey}&query=${encodeURIComponent(name)}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      const person = searchData.results?.find((p: any) =>
        p.name.toLowerCase() === name.toLowerCase()
      ) || searchData.results?.[0];
      if (person) personId = person.id;
    }

    if (!personId) return [];

    // PRIORITY 1: Tagged images (movie stills, red carpet - BEST for glamour)
    const taggedUrl = `${TMDB_API_BASE}/person/${personId}/tagged_images?api_key=${apiKey}&page=1`;
    const taggedRes = await fetch(taggedUrl);
    const taggedData = await taggedRes.json();

    if (taggedData.results) {
      // Filter for landscape/wide images (more likely to be full-body/glamour shots)
      const glamourImages = taggedData.results
        .filter((img: any) => {
          // Prefer backdrops (landscape) or posters with good aspect ratio
          const isBackdrop = img.image_type === 'backdrop';
          const isPoster = img.image_type === 'poster';
          const hasWidth = img.width && img.width > 500;
          // Wider images are more likely to be scene shots, not headshots
          const isWide = img.aspect_ratio && img.aspect_ratio > 1.3;
          return (isBackdrop || (isPoster && hasWidth) || isWide) && img.file_path;
        })
        .sort((a: any, b: any) => {
          // Score by: vote_average + aspect ratio (prefer wider)
          const scoreA = (a.vote_average || 0) + (a.aspect_ratio > 1.5 ? 2 : 0);
          const scoreB = (b.vote_average || 0) + (b.aspect_ratio > 1.5 ? 2 : 0);
          return scoreB - scoreA;
        })
        .slice(0, 4);

      for (const img of glamourImages) {
        const category = Math.random() > 0.5 ? 'events' : 'photoshoot';
        images.push({
          url: `https://image.tmdb.org/t/p/original${img.file_path}`,
          thumbnail: `https://image.tmdb.org/t/p/w780${img.file_path}`,
          type: 'tagged',
          category,
          score: Math.round(90 + Math.min(5, (img.vote_average || 0))),
          movieTitle: img.media?.title,
        });
      }
    }

    // PRIORITY 2: Movie backdrops where they appear
    const creditsUrl = `${TMDB_API_BASE}/person/${personId}/movie_credits?api_key=${apiKey}`;
    const creditsRes = await fetch(creditsUrl);
    const creditsData = await creditsRes.json();

    if (creditsData.cast && images.length < limit) {
      // Get recent popular movies
      const recentMovies = creditsData.cast
        .filter((m: any) => m.backdrop_path || m.poster_path)
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 3);

      for (const movie of recentMovies) {
        if (images.length >= limit) break;
        
        // Get movie images
        const movieImagesUrl = `${TMDB_API_BASE}/movie/${movie.id}/images?api_key=${apiKey}`;
        const movieImagesRes = await fetch(movieImagesUrl);
        const movieImagesData = await movieImagesRes.json();

        // Get best backdrops
        const backdrops = (movieImagesData.backdrops || [])
          .filter((b: any) => b.file_path && (!b.iso_639_1 || b.iso_639_1 === 'en'))
          .slice(0, 1);

        for (const backdrop of backdrops) {
          images.push({
            url: `https://image.tmdb.org/t/p/original${backdrop.file_path}`,
            thumbnail: `https://image.tmdb.org/t/p/w780${backdrop.file_path}`,
            type: 'backdrop',
            category: 'events',
            score: 85,
            movieTitle: movie.title,
          });
        }
      }
    }

    // PRIORITY 3: Wikimedia Commons (CC licensed event photos)
    if (images.length < limit) {
      const wikiImages = await fetchWikimediaImages(name, limit - images.length);
      images.push(...wikiImages);
    }

    // PRIORITY 4: Profile images - ONLY if we don't have enough (these are often headshots)
    if (images.length < 3) {
      const profileUrl = `${TMDB_API_BASE}/person/${personId}/images?api_key=${apiKey}`;
      const profileRes = await fetch(profileUrl);
      const profileData = await profileRes.json();

      if (profileData.profiles) {
        // Sort by vote count and aspect ratio (prefer taller = more full body)
        const bestProfiles = profileData.profiles
          .filter((p: any) => p.file_path && p.height > 400)
          .sort((a: any, b: any) => {
            // Lower aspect ratio means taller image (more likely full body)
            const aScore = (a.vote_average || 0) - (a.aspect_ratio || 0.667) * 2;
            const bScore = (b.vote_average || 0) - (b.aspect_ratio || 0.667) * 2;
            return bScore - aScore;
          })
          .slice(0, limit - images.length);

        for (const profile of bestProfiles) {
          const categories = ['photoshoot', 'fashion'];
          images.push({
            url: `https://image.tmdb.org/t/p/original${profile.file_path}`,
            thumbnail: `https://image.tmdb.org/t/p/w500${profile.file_path}`,
            type: 'profile',
            category: categories[Math.floor(Math.random() * categories.length)],
            score: Math.round(75 + Math.min(10, (profile.vote_average || 0) * 2)),
          });
        }
      }
    }
  } catch (error) {
    console.error(`   Error fetching TMDB images for ${name}:`, error);
  }

  return images.slice(0, limit);
}

async function fetchWikimediaImages(name: string, limit = 3): Promise<ImageResult[]> {
  const images: ImageResult[] = [];

  try {
    // Search Wikimedia Commons for high-quality photos
    const searchQuery = `${name} actress premiere`;
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=${limit + 2}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*`;

    const response = await fetch(commonsUrl);
    if (!response.ok) return images;

    const data = await response.json();
    const pages = data.query?.pages || {};

    for (const page of Object.values(pages) as any[]) {
      if (images.length >= limit) break;

      if (page.imageinfo && page.imageinfo[0]) {
        const info = page.imageinfo[0];

        // Only high quality photos
        if (
          info.mime?.startsWith('image/') &&
          !info.mime.includes('svg') &&
          info.width > 600 &&
          info.height > 400
        ) {
          images.push({
            url: info.url,
            thumbnail: info.url.replace(/\/commons\//, '/commons/thumb/').replace(/(\.[^.]+)$/, '/800px$1'),
            type: 'wikimedia',
            category: 'events',
            score: 80,
          });
        }
      }
    }
  } catch (error) {
    console.error(`   Wikimedia error for ${name}:`, error);
  }

  return images;
}

async function main() {
  const args = process.argv.slice(2);
  const skipClean = args.includes('--skip-clean');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '6');

  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║         REFRESH HOT MEDIA - IMPROVED GLAMOUR FETCHING            ║
║         Priority: Tagged > Backdrops > Wikimedia > Profiles      ║
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
    const { error: deleteError, count } = await supabase
      .from('hot_media')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('   ❌ Error deleting:', deleteError.message);
    } else {
      console.log(`   ✅ Deleted existing records`);
    }
  }

  let totalAdded = 0;
  let totalErrors = 0;
  const stats = { tagged: 0, backdrop: 0, wikimedia: 0, profile: 0 };

  // Step 2: Fetch fresh content for each actress
  console.log(`\n📸 Fetching fresh glamour content for ${ACTRESSES.length} celebrities...\n`);

  for (const actress of ACTRESSES) {
    console.log(`🔍 ${actress.name} (${actress.type})`);

    const images = await fetchGlamourImages(actress.name, actress.tmdb_id, limit);

    if (images.length === 0) {
      console.log(`   ⚠️ No images found`);
      continue;
    }

    console.log(`   📸 Found ${images.length} images (${images.map(i => i.type).join(', ')})`);

    // Insert each image
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
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
          platform: img.type === 'wikimedia' ? 'wikimedia' : 'tmdb',
          source_url: img.url,
          image_url: img.url,
          thumbnail_url: img.thumbnail,
          license_source: img.type === 'wikimedia' ? 'Wikimedia Commons' : 'TMDB',
          license_type: img.type === 'wikimedia' ? 'cc-by-sa' : 'api-provided',
          category: img.category,
          tags: [
            actress.name.split(' ')[0],
            img.category,
            'glamour',
            'telugu',
            img.movieTitle || '',
          ].filter(Boolean),
          selected_caption: caption,
          caption_te: caption,
          detected_emotion: 'glamour',
          content_angle: 'glam',
          confidence_score: Math.round(img.score),
          safety_risk: 'low',
          requires_review: false,
          is_blocked: false,
          is_featured: i === 0,
          is_hot: img.score > 85,
          trending_score: img.score - 10 + Math.random() * 20,
          status: 'approved',
          published_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        totalErrors++;
      } else {
        stats[img.type]++;
        totalAdded++;
      }
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 400));
  }

  console.log(`
════════════════════════════════════════════════════════════
📊 REFRESH COMPLETE
════════════════════════════════════════════════════════════
   Total added: ${totalAdded}
   Errors: ${totalErrors}

   By source:
   🎬 Tagged (movie stills):  ${stats.tagged}
   🖼️ Backdrops:              ${stats.backdrop}
   📷 Wikimedia:              ${stats.wikimedia}
   👤 Profile:                ${stats.profile}
════════════════════════════════════════════════════════════
`);

  // Show samples
  const { data: samples } = await supabase
    .from('hot_media')
    .select('entity_name, category, confidence_score, is_hot')
    .order('confidence_score', { ascending: false })
    .limit(10);

  if (samples && samples.length > 0) {
    console.log('🔥 Top content by quality score:');
    for (const s of samples) {
      console.log(`   ${s.is_hot ? '🔥' : '  '} ${s.entity_name} - ${s.category} (${s.confidence_score})`);
    }
  }
}

main().catch(console.error);

