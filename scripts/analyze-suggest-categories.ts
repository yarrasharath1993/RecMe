import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface CategorySuggestion {
  name: string;
  slug: string;
  description: string;
  criteria: string;
  estimatedCount: number;
  sampleMovies: string[];
  emoji: string;
}

async function analyzeAndSuggestCategories() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 ANALYZING DATABASE TO SUGGEST SPECIAL CATEGORIES');
  console.log('='.repeat(80) + '\n');

  try {
    // Fetch all published movies with key data
    console.log('1️⃣  Fetching movie data...\n');
    
    const { data: movies, error } = await supabase
      .from('movies')
      .select('id, title_en, genres, our_rating, avg_rating, is_blockbuster, is_classic, is_underrated, release_year, tone, era')
      .eq('is_published', true)
      .eq('language', 'Telugu');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log(`   ✅ Analyzed ${movies?.length || 0} published Telugu movies\n`);

    if (!movies || movies.length === 0) {
      console.log('   ⚠️  No movies found\n');
      return;
    }

    const suggestions: CategorySuggestion[] = [];

    // 1. Weekend Binge (High-rated, binge-worthy)
    const weekendBinge = movies.filter(m => 
      (m.our_rating || m.avg_rating || 0) >= 7.5 &&
      (m.genres?.includes('Drama') || m.genres?.includes('Thriller') || m.genres?.includes('Action'))
    );
    if (weekendBinge.length > 0) {
      suggestions.push({
        name: 'Weekend Binge',
        slug: 'weekend-binge',
        description: 'High-rated movies perfect for a weekend marathon',
        criteria: 'Rating ≥ 7.5 + Drama/Thriller/Action',
        estimatedCount: weekendBinge.length,
        sampleMovies: weekendBinge.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '📺',
      });
    }

    // 2. Family Night (Family genre + high rating)
    const familyNight = movies.filter(m => 
      m.genres?.includes('Family') &&
      (m.our_rating || m.avg_rating || 0) >= 7 &&
      !m.genres?.includes('Horror')
    );
    if (familyNight.length > 0) {
      suggestions.push({
        name: 'Family Night',
        slug: 'family-night',
        description: 'Perfect movies to watch with the whole family',
        criteria: 'Family genre + Rating ≥ 7 + No Horror',
        estimatedCount: familyNight.length,
        sampleMovies: familyNight.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '👨‍👩‍👧‍👦',
      });
    }

    // 3. Action Packed (Action + high rating)
    const actionPacked = movies.filter(m => 
      m.genres?.includes('Action') &&
      (m.our_rating || m.avg_rating || 0) >= 7 &&
      m.is_blockbuster === true
    );
    if (actionPacked.length > 0) {
      suggestions.push({
        name: 'Action Packed',
        slug: 'action-packed',
        description: 'High-octane action blockbusters',
        criteria: 'Action + Blockbuster + Rating ≥ 7',
        estimatedCount: actionPacked.length,
        sampleMovies: actionPacked.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '💥',
      });
    }

    // 4. Tearjerkers (Drama/Romance + emotional)
    const tearjerkers = movies.filter(m => 
      (m.genres?.includes('Drama') || m.genres?.includes('Romance')) &&
      (m.our_rating || m.avg_rating || 0) >= 7 &&
      (m.tone?.toLowerCase().includes('emotional') || m.tone?.toLowerCase().includes('drama'))
    );
    if (tearjerkers.length > 0) {
      suggestions.push({
        name: 'Tearjerkers',
        slug: 'tearjerkers',
        description: 'Emotional dramas that will make you cry',
        criteria: 'Drama/Romance + Rating ≥ 7 + Emotional tone',
        estimatedCount: tearjerkers.length,
        sampleMovies: tearjerkers.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '😢',
      });
    }

    // 5. Laugh Riot (Comedy + high rating)
    const laughRiot = movies.filter(m => 
      m.genres?.includes('Comedy') &&
      (m.our_rating || m.avg_rating || 0) >= 7 &&
      !m.genres?.includes('Horror')
    );
    if (laughRiot.length > 0) {
      suggestions.push({
        name: 'Laugh Riot',
        slug: 'laugh-riot',
        description: 'Hilarious comedies guaranteed to make you laugh',
        criteria: 'Comedy + Rating ≥ 7 + No Horror',
        estimatedCount: laughRiot.length,
        sampleMovies: laughRiot.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '😂',
      });
    }

    // 6. Mind Benders (Thriller/Mystery + high rating)
    const mindBenders = movies.filter(m => 
      (m.genres?.includes('Thriller') || m.genres?.includes('Mystery')) &&
      (m.our_rating || m.avg_rating || 0) >= 7.5
    );
    if (mindBenders.length > 0) {
      suggestions.push({
        name: 'Mind Benders',
        slug: 'mind-benders',
        description: 'Twist-filled thrillers that keep you guessing',
        criteria: 'Thriller/Mystery + Rating ≥ 7.5',
        estimatedCount: mindBenders.length,
        sampleMovies: mindBenders.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '🧠',
      });
    }

    // 7. Cult Classics (Underrated + high rating)
    const cultClassics = movies.filter(m => 
      m.is_underrated === true &&
      (m.our_rating || m.avg_rating || 0) >= 7.5
    );
    if (cultClassics.length > 0) {
      suggestions.push({
        name: 'Cult Classics',
        slug: 'cult-classics',
        description: 'Underrated gems that deserve more recognition',
        criteria: 'Underrated + Rating ≥ 7.5',
        estimatedCount: cultClassics.length,
        sampleMovies: cultClassics.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '⭐',
      });
    }

    // 8. Date Night (Romance + high rating + recent)
    const currentYear = new Date().getFullYear();
    const dateNight = movies.filter(m => 
      m.genres?.includes('Romance') &&
      (m.our_rating || m.avg_rating || 0) >= 7 &&
      m.release_year && m.release_year >= 2010
    );
    if (dateNight.length > 0) {
      suggestions.push({
        name: 'Date Night',
        slug: 'date-night',
        description: 'Perfect romantic movies for a date night',
        criteria: 'Romance + Rating ≥ 7 + Released 2010+',
        estimatedCount: dateNight.length,
        sampleMovies: dateNight.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '🌹',
      });
    }

    // 9. Epic Sagas (Historical/Biographical + high rating)
    const epicSagas = movies.filter(m => 
      (m.genres?.includes('Historical') || m.genres?.includes('Biographical')) &&
      (m.our_rating || m.avg_rating || 0) >= 7.5
    );
    if (epicSagas.length > 0) {
      suggestions.push({
        name: 'Epic Sagas',
        slug: 'epic-sagas',
        description: 'Grand historical and biographical epics',
        criteria: 'Historical/Biographical + Rating ≥ 7.5',
        estimatedCount: epicSagas.length,
        sampleMovies: epicSagas.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '🏛️',
      });
    }

    // 10. Feel Good Vibes (Comedy/Family + feel-good tone)
    const feelGoodVibes = movies.filter(m => 
      (m.genres?.includes('Comedy') || m.genres?.includes('Family')) &&
      (m.our_rating || m.avg_rating || 0) >= 7 &&
      (m.tone?.toLowerCase().includes('feel-good') || m.tone?.toLowerCase().includes('light'))
    );
    if (feelGoodVibes.length > 0) {
      suggestions.push({
        name: 'Feel Good Vibes',
        slug: 'feel-good-vibes',
        description: 'Uplifting movies that spread positivity',
        criteria: 'Comedy/Family + Rating ≥ 7 + Feel-good tone',
        estimatedCount: feelGoodVibes.length,
        sampleMovies: feelGoodVibes.slice(0, 5).map(m => m.title_en || 'Unknown'),
        emoji: '☀️',
      });
    }

    // Display suggestions
    console.log('2️⃣  Category Suggestions Based on Data Analysis\n');
    console.log('='.repeat(80));
    
    suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.emoji} ${suggestion.name}`);
      console.log(`   Slug: ${suggestion.slug}`);
      console.log(`   Description: ${suggestion.description}`);
      console.log(`   Criteria: ${suggestion.criteria}`);
      console.log(`   Estimated Movies: ${suggestion.estimatedCount}`);
      console.log(`   Sample Movies:`);
      suggestion.sampleMovies.forEach(title => {
        console.log(`      - ${title}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`\n✅ Found ${suggestions.length} potential categories`);
    console.log(`📈 Total movies analyzed: ${movies.length}`);
    console.log('\n💡 Recommendations:');
    console.log('   - Categories with 20+ movies are most viable');
    console.log('   - Consider combining similar categories');
    console.log('   - Test with users to see which resonate most');
    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeAndSuggestCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
