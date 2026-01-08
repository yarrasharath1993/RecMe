/**
 * Regenerate Review API
 * 
 * POST /api/admin/reviews/[id]/regenerate - Regenerate review for a movie
 * 
 * Wraps editorial-review-generator.ts logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROQ_API_KEY = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_UNLIMITED;

interface RouteParams {
  params: Promise<{ id: string }>;
}

type GenerationType = 'template' | 'ai' | 'hybrid';

interface SectionResult {
  section: string;
  generated: boolean;
  source: 'template' | 'ai' | 'existing';
  error?: string;
}

/**
 * POST - Regenerate review for a movie
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: movieId } = await params;

  try {
    const body = await request.json();
    const type: GenerationType = body.type || 'template';
    const sections: string[] = body.sections || ['all'];
    const forceRegenerate = body.forceRegenerate === true;

    // Fetch movie
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('*')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return NextResponse.json(
        { error: 'Movie not found' },
        { status: 404 }
      );
    }

    // Check if review exists
    const { data: existingReview } = await supabase
      .from('movie_reviews')
      .select('*')
      .eq('movie_id', movieId)
      .single();

    const sectionResults: SectionResult[] = [];
    const reviewData: Record<string, unknown> = existingReview || {
      movie_id: movieId,
      created_at: new Date().toISOString(),
    };

    // Define all 9 sections
    const allSections = [
      'opening_hook',
      'story_overview',
      'performance_analysis',
      'technical_breakdown',
      'music_audio',
      'highs_lows',
      'audience_fit',
      'comparison_context',
      'final_verdict',
    ];

    const sectionsToGenerate = sections.includes('all') ? allSections : sections;

    for (const section of sectionsToGenerate) {
      // Skip if section exists and not forcing
      if (existingReview?.[section] && !forceRegenerate) {
        sectionResults.push({
          section,
          generated: false,
          source: 'existing',
        });
        continue;
      }

      try {
        let content: string;

        if (type === 'template') {
          content = generateTemplateSection(section, movie);
        } else if (type === 'ai') {
          content = await generateAISection(section, movie);
        } else {
          // Hybrid: try template, fallback to AI for complex sections
          const complexSections = ['performance_analysis', 'comparison_context', 'final_verdict'];
          if (complexSections.includes(section)) {
            content = await generateAISection(section, movie);
          } else {
            content = generateTemplateSection(section, movie);
          }
        }

        reviewData[section] = content;
        sectionResults.push({
          section,
          generated: true,
          source: type === 'ai' ? 'ai' : 'template',
        });
      } catch (error) {
        sectionResults.push({
          section,
          generated: false,
          source: 'template',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Calculate overall rating and verdict
    reviewData.rating = calculateOverallRating(movie, reviewData);
    reviewData.verdict = generateVerdict(movie, reviewData.rating as number);
    reviewData.updated_at = new Date().toISOString();
    reviewData.generation_type = type;
    reviewData.generated_by = 'regenerate_api';

    // Upsert review
    const { data: savedReview, error: saveError } = await supabase
      .from('movie_reviews')
      .upsert(reviewData)
      .select()
      .single();

    if (saveError) {
      return NextResponse.json(
        { error: 'Failed to save review', details: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      movieId,
      movieTitle: movie.title_en,
      type,
      results: sectionResults,
      generatedCount: sectionResults.filter(r => r.generated).length,
      review: savedReview,
    });
  } catch (error) {
    console.error('Error regenerating review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTemplateSection(section: string, movie: Record<string, unknown>): string {
  const title = movie.title_en || 'This film';
  const hero = movie.hero || 'the lead actor';
  const heroine = movie.heroine || 'the lead actress';
  const director = movie.director || 'the director';
  const year = movie.release_year || '';

  const templates: Record<string, string> = {
    opening_hook: `${title} (${year}) is a Telugu film directed by ${director}, featuring ${hero} and ${heroine} in the lead roles. The film offers a compelling narrative that blends entertainment with emotional depth.`,
    
    story_overview: `The story of ${title} revolves around ${hero}'s character navigating through challenges. ${movie.synopsis || 'The narrative unfolds with engaging twists and turns that keep the audience invested.'}`,
    
    performance_analysis: `${hero} delivers a commendable performance, showcasing versatility in portraying the character's journey. ${heroine} complements the lead with a nuanced performance. The supporting cast adds depth to the narrative.`,
    
    technical_breakdown: `${director}'s vision is well-executed through competent technical work. The cinematography captures the essence of each scene, while the editing maintains a good pace throughout the film.`,
    
    music_audio: `The music by ${movie.music_director || 'the music director'} enhances the emotional impact of the film. The background score effectively builds tension and complements the narrative arc.`,
    
    highs_lows: `HIGHS: ${hero}'s performance, engaging storyline, and production values stand out. LOWS: Some scenes could have been tighter, and a few predictable moments affect the overall impact.`,
    
    audience_fit: `${title} appeals to fans of Telugu cinema who enjoy character-driven narratives. Families and regular moviegoers will find it entertaining, though it may require patience during slower sequences.`,
    
    comparison_context: `In the context of ${year} Telugu releases, ${title} holds its own among similar films in the genre. ${director}'s previous works set expectations that this film largely meets.`,
    
    final_verdict: `${title} is a film that delivers on its promise of entertainment with substance. While not without its flaws, the performances and technical execution make it a worthwhile watch for Telugu cinema enthusiasts.`,
  };

  return templates[section] || `Section ${section} content for ${title}.`;
}

async function generateAISection(section: string, movie: Record<string, unknown>): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('AI generation not available - GROQ_API_KEY not configured');
  }

  const title = movie.title_en || 'This film';
  const hero = movie.hero || 'the lead actor';
  const director = movie.director || 'the director';
  const year = movie.release_year || '';
  const synopsis = movie.synopsis || '';

  const sectionPrompts: Record<string, string> = {
    opening_hook: `Write an engaging opening hook (2-3 sentences) for a review of the Telugu film "${title}" (${year}), directed by ${director}, starring ${hero}.`,
    
    story_overview: `Write a story overview (3-4 sentences) for the Telugu film "${title}". Synopsis: ${synopsis}. Do not spoil major plot points.`,
    
    performance_analysis: `Analyze the performances in the Telugu film "${title}" starring ${hero}. Write 3-4 sentences covering lead and supporting performances.`,
    
    technical_breakdown: `Write a technical analysis (3-4 sentences) for "${title}" directed by ${director}, covering direction, cinematography, and editing.`,
    
    music_audio: `Analyze the music and audio design (2-3 sentences) for the Telugu film "${title}". Music director: ${movie.music_director || 'not specified'}.`,
    
    highs_lows: `List the HIGHS and LOWS of the Telugu film "${title}" (${year}). Format: HIGHS: [points]. LOWS: [points]. Keep it concise.`,
    
    audience_fit: `Describe the target audience for the Telugu film "${title}". Who should watch it and what to expect? 2-3 sentences.`,
    
    comparison_context: `Compare "${title}" (${year}) to other Telugu films of that era or by ${director}. 2-3 sentences.`,
    
    final_verdict: `Write a final verdict (3-4 sentences) for the Telugu film "${title}". Summarize the overall experience and recommendation.`,
  };

  const prompt = sectionPrompts[section] || `Write content for the ${section} section of a review for the Telugu film "${title}".`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a Telugu film critic writing professional movie reviews. Write in English. Be concise and insightful.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI generation failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || generateTemplateSection(section, movie);
}

function calculateOverallRating(movie: Record<string, unknown>, _reviewData: Record<string, unknown>): number {
  // Base rating from existing data
  let rating = 3.0;

  // Boost for verified data
  if (movie.verified) rating += 0.3;

  // Boost for complete data
  if (movie.synopsis) rating += 0.1;
  if (movie.poster_url) rating += 0.1;
  if (movie.backdrop_url) rating += 0.1;
  if (movie.hero && movie.heroine) rating += 0.1;

  // Cap at 4.5 (reserve 5.0 for human-rated classics)
  return Math.min(4.5, Math.max(2.0, rating));
}

function generateVerdict(movie: Record<string, unknown>, rating: number): string {
  const title = movie.title_en || 'This film';
  
  if (rating >= 4.0) {
    return `${title} is a must-watch that delivers on all fronts. Highly recommended.`;
  } else if (rating >= 3.5) {
    return `${title} is a solid entertainer that's worth your time. Recommended for fans of the genre.`;
  } else if (rating >= 3.0) {
    return `${title} is a decent watch with some good moments. Watch it if you're a fan of the lead actors.`;
  } else {
    return `${title} has its moments but falls short of expectations. Approach with tempered expectations.`;
  }
}

