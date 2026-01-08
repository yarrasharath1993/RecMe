/**
 * Schema.org Structured Data Components
 * 
 * Provides JSON-LD structured data for:
 * - Movie schema
 * - Review schema
 * - Actor/Person schema
 * - Collection schema
 * - Article schema
 * 
 * Enhances SEO and rich snippets in search results.
 */

import Script from 'next/script';

// ============================================================
// TYPES
// ============================================================

interface MovieSchemaProps {
  name: string;
  nameTeluguName?: string;
  description?: string;
  datePublished?: string;
  director?: string;
  actors?: string[];
  genre?: string[];
  duration?: string; // ISO 8601 format (e.g., "PT2H30M")
  image?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount?: number;
    bestRating?: number;
    worstRating?: number;
  };
  contentRating?: string;
  inLanguage?: string;
  url?: string;
}

interface ReviewSchemaProps {
  movieName: string;
  reviewBody: string;
  author?: string;
  datePublished?: string;
  rating?: {
    ratingValue: number;
    bestRating?: number;
    worstRating?: number;
  };
  url?: string;
}

interface PersonSchemaProps {
  name: string;
  description?: string;
  image?: string;
  jobTitle?: string;
  birthDate?: string;
  nationality?: string;
  url?: string;
  sameAs?: string[];
}

interface CollectionSchemaProps {
  name: string;
  description?: string;
  itemCount?: number;
  url?: string;
  image?: string;
}

interface ArticleSchemaProps {
  headline: string;
  description?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  image?: string;
  url?: string;
}

// ============================================================
// HELPER
// ============================================================

function SchemaScriptComponent({ data }: { data: Record<string, unknown> }) {
  return (
    <Script
      id={`schema-${data['@type']}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
    />
  );
}

// ============================================================
// GENERIC SCHEMA SCRIPT (for multiple schemas)
// ============================================================

interface SchemaScriptProps {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Generic SchemaScript component that renders one or multiple JSON-LD schemas
 */
export function SchemaScript({ schema }: SchemaScriptProps) {
  if (Array.isArray(schema)) {
    return (
      <>
        {schema.map((s, index) => (
          <Script
            key={`schema-${s['@type'] || index}`}
            id={`schema-${s['@type'] || index}-${index}`}
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(s),
            }}
          />
        ))}
      </>
    );
  }

  return (
    <Script
      id={`schema-${schema['@type']}`}
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

// ============================================================
// MOVIE SCHEMA
// ============================================================

export function MovieSchema({
  name,
  nameTeluguName,
  description,
  datePublished,
  director,
  actors,
  genre,
  duration,
  image,
  aggregateRating,
  contentRating,
  inLanguage = 'te',
  url,
}: MovieSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name,
    ...(nameTeluguName && { alternateName: nameTeluguName }),
    ...(description && { description }),
    ...(datePublished && { datePublished }),
    ...(director && {
      director: {
        '@type': 'Person',
        name: director,
      },
    }),
    ...(actors &&
      actors.length > 0 && {
        actor: actors.map((actor) => ({
          '@type': 'Person',
          name: actor,
        })),
      }),
    ...(genre && { genre }),
    ...(duration && { duration }),
    ...(image && { image }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        bestRating: aggregateRating.bestRating || 10,
        worstRating: aggregateRating.worstRating || 1,
        ...(aggregateRating.ratingCount && { ratingCount: aggregateRating.ratingCount }),
      },
    }),
    ...(contentRating && { contentRating }),
    inLanguage,
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// REVIEW SCHEMA
// ============================================================

export function ReviewSchema({
  movieName,
  reviewBody,
  author = 'TeluguVibes',
  datePublished,
  rating,
  url,
}: ReviewSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Movie',
      name: movieName,
    },
    reviewBody,
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
    ...(datePublished && { datePublished }),
    ...(rating && {
      reviewRating: {
        '@type': 'Rating',
        ratingValue: rating.ratingValue,
        bestRating: rating.bestRating || 10,
        worstRating: rating.worstRating || 1,
      },
    }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// PERSON SCHEMA (Actor/Director)
// ============================================================

export function PersonSchema({
  name,
  description,
  image,
  jobTitle,
  birthDate,
  nationality,
  url,
  sameAs,
}: PersonSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    ...(description && { description }),
    ...(image && { image }),
    ...(jobTitle && { jobTitle }),
    ...(birthDate && { birthDate }),
    ...(nationality && { nationality }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// COLLECTION SCHEMA
// ============================================================

export function CollectionSchema({
  name,
  description,
  itemCount,
  url,
  image,
}: CollectionSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    ...(description && { description }),
    ...(itemCount && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: itemCount,
      },
    }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    ...(image && { image }),
    isPartOf: {
      '@type': 'WebSite',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// ARTICLE SCHEMA
// ============================================================

export function ArticleSchema({
  headline,
  description,
  author = 'TeluguVibes',
  datePublished,
  dateModified,
  image,
  url,
}: ArticleSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    ...(description && { description }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(image && { image }),
    ...(url && { mainEntityOfPage: url.startsWith('http') ? url : `${baseUrl}${url}` }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// WEBSITE SCHEMA (for homepage)
// ============================================================

export function WebsiteSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'TeluguVibes',
    alternateName: 'తెలుగు వైబ్స్',
    description: 'Premium Telugu entertainment portal with movie reviews, celebrity news, and more',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['te', 'en'],
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// BREADCRUMB SCHEMA
// ============================================================

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// FAQ SCHEMA
// ============================================================

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ items }: { items: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// ENHANCED MOVIE SCHEMA (with full cast/crew)
// ============================================================

interface EnhancedMovieSchemaProps {
  name: string;
  alternateName?: string;
  description?: string;
  datePublished?: string;
  director?: { name: string; url?: string };
  actors?: { name: string; character?: string; url?: string }[];
  musicBy?: { name: string; url?: string };
  producer?: { name: string; url?: string };
  genre?: string[];
  duration?: string;
  image?: string;
  trailer?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount?: number;
    bestRating?: number;
    worstRating?: number;
  };
  contentRating?: string;
  inLanguage?: string;
  countryOfOrigin?: string;
  productionCompany?: string;
  url?: string;
  sameAs?: string[];
}

export function EnhancedMovieSchema({
  name,
  alternateName,
  description,
  datePublished,
  director,
  actors,
  musicBy,
  producer,
  genre,
  duration,
  image,
  trailer,
  aggregateRating,
  contentRating,
  inLanguage = 'te',
  countryOfOrigin = 'IN',
  productionCompany,
  url,
  sameAs,
}: EnhancedMovieSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name,
    ...(alternateName && { alternateName }),
    ...(description && { description }),
    ...(datePublished && { datePublished }),
    ...(director && {
      director: {
        '@type': 'Person',
        name: director.name,
        ...(director.url && { url: director.url }),
      },
    }),
    ...(actors && actors.length > 0 && {
      actor: actors.map((actor) => ({
        '@type': 'Person',
        name: actor.name,
        ...(actor.character && { characterName: actor.character }),
        ...(actor.url && { url: actor.url }),
      })),
    }),
    ...(musicBy && {
      musicBy: {
        '@type': 'Person',
        name: musicBy.name,
        ...(musicBy.url && { url: musicBy.url }),
      },
    }),
    ...(producer && {
      producer: {
        '@type': 'Person',
        name: producer.name,
        ...(producer.url && { url: producer.url }),
      },
    }),
    ...(genre && { genre }),
    ...(duration && { duration }),
    ...(image && { image }),
    ...(trailer && {
      trailer: {
        '@type': 'VideoObject',
        name: `${name} - Official Trailer`,
        embedUrl: trailer,
      },
    }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        bestRating: aggregateRating.bestRating || 10,
        worstRating: aggregateRating.worstRating || 1,
        ...(aggregateRating.ratingCount && { ratingCount: aggregateRating.ratingCount }),
      },
    }),
    ...(contentRating && { contentRating }),
    inLanguage,
    countryOfOrigin: {
      '@type': 'Country',
      name: countryOfOrigin,
    },
    ...(productionCompany && {
      productionCompany: {
        '@type': 'Organization',
        name: productionCompany,
      },
    }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// VIDEO SCHEMA (for YouTube embeds)
// ============================================================

interface VideoSchemaProps {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  duration?: string;
  contentUrl?: string;
  embedUrl?: string;
}

export function VideoSchema({
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
}: VideoSchemaProps) {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name,
    ...(description && { description }),
    ...(thumbnailUrl && { thumbnailUrl }),
    ...(uploadDate && { uploadDate }),
    ...(duration && { duration }),
    ...(contentUrl && { contentUrl }),
    ...(embedUrl && { embedUrl }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// RECIPE SCHEMA (for food_bachelor sector)
// ============================================================

interface RecipeSchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  image?: string;
  prepTime?: string; // ISO 8601 duration (e.g., "PT15M")
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string; // e.g., "4 servings"
  recipeCategory?: string; // e.g., "Breakfast", "Snack"
  recipeCuisine?: string; // e.g., "Telugu", "South Indian"
  recipeIngredient?: string[];
  recipeInstructions?: string[] | { text: string; name?: string }[];
  nutrition?: {
    calories?: string;
    fatContent?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
  };
  author?: string;
  datePublished?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount?: number;
  };
  url?: string;
}

export function RecipeSchema({
  name,
  nameTe,
  description,
  image,
  prepTime,
  cookTime,
  totalTime,
  recipeYield,
  recipeCategory,
  recipeCuisine = 'Telugu',
  recipeIngredient,
  recipeInstructions,
  nutrition,
  author = 'TeluguVibes',
  datePublished,
  aggregateRating,
  url,
}: RecipeSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name,
    ...(nameTe && { alternateName: nameTe }),
    ...(description && { description }),
    ...(image && { image }),
    ...(prepTime && { prepTime }),
    ...(cookTime && { cookTime }),
    ...(totalTime && { totalTime }),
    ...(recipeYield && { recipeYield }),
    ...(recipeCategory && { recipeCategory }),
    recipeCuisine,
    ...(recipeIngredient && recipeIngredient.length > 0 && { recipeIngredient }),
    ...(recipeInstructions && recipeInstructions.length > 0 && {
      recipeInstructions: recipeInstructions.map((instruction, index) => 
        typeof instruction === 'string' 
          ? {
              '@type': 'HowToStep',
              position: index + 1,
              text: instruction,
            }
          : {
              '@type': 'HowToStep',
              position: index + 1,
              text: instruction.text,
              ...(instruction.name && { name: instruction.name }),
            }
      ),
    }),
    ...(nutrition && {
      nutrition: {
        '@type': 'NutritionInformation',
        ...nutrition,
      },
    }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue,
        bestRating: 5,
        worstRating: 1,
        ...(aggregateRating.ratingCount && { ratingCount: aggregateRating.ratingCount }),
      },
    }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// LEARNING RESOURCE SCHEMA (for kids_family sector)
// ============================================================

interface LearningResourceSchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  educationalLevel?: string; // e.g., "Beginner", "Preschool", "Elementary"
  learningResourceType?: string; // e.g., "Story", "Quiz", "Activity"
  teaches?: string; // e.g., "Moral Values", "Telugu Alphabet"
  educationalUse?: string; // e.g., "assignment", "self study"
  typicalAgeRange?: string; // e.g., "4-6", "7-10"
  timeRequired?: string; // ISO 8601 duration
  author?: string;
  datePublished?: string;
  image?: string;
  url?: string;
  inLanguage?: string;
  isAccessibleForFree?: boolean;
  audience?: {
    audienceType: string;
    educationalRole?: string;
  };
}

export function LearningResourceSchema({
  name,
  nameTe,
  description,
  educationalLevel,
  learningResourceType,
  teaches,
  educationalUse,
  typicalAgeRange,
  timeRequired,
  author = 'TeluguVibes',
  datePublished,
  image,
  url,
  inLanguage = 'te',
  isAccessibleForFree = true,
  audience,
}: LearningResourceSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name,
    ...(nameTe && { alternateName: nameTe }),
    ...(description && { description }),
    ...(educationalLevel && { educationalLevel }),
    ...(learningResourceType && { learningResourceType }),
    ...(teaches && { teaches }),
    ...(educationalUse && { educationalUse }),
    ...(typicalAgeRange && { typicalAgeRange }),
    ...(timeRequired && { timeRequired }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(image && { image }),
    inLanguage,
    isAccessibleForFree,
    ...(audience && {
      audience: {
        '@type': 'EducationalAudience',
        ...audience,
      },
    }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// MEDICAL WEB PAGE SCHEMA (for pregnancy_wellness sector)
// ============================================================

interface MedicalWebPageSchemaProps {
  headline: string;
  headlineTe?: string;
  description?: string;
  about?: string; // Medical topic
  specialty?: string; // e.g., "Obstetrics", "Nutrition"
  audience?: string; // e.g., "Pregnant Women", "New Parents"
  datePublished?: string;
  dateModified?: string;
  lastReviewed?: string;
  author?: string;
  reviewedBy?: string;
  image?: string;
  url?: string;
  mainContentOfPage?: string;
  disclaimer?: string;
}

export function MedicalWebPageSchema({
  headline,
  headlineTe,
  description,
  about,
  specialty,
  audience,
  datePublished,
  dateModified,
  lastReviewed,
  author = 'TeluguVibes',
  reviewedBy,
  image,
  url,
  mainContentOfPage,
  disclaimer = 'This content is for informational purposes only and is not a substitute for professional medical advice.',
}: MedicalWebPageSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline,
    ...(headlineTe && { alternativeHeadline: headlineTe }),
    ...(description && { description }),
    ...(about && {
      about: {
        '@type': 'MedicalCondition',
        name: about,
      },
    }),
    ...(specialty && { specialty }),
    ...(audience && {
      audience: {
        '@type': 'MedicalAudience',
        audienceType: audience,
      },
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    ...(lastReviewed && { lastReviewed }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(reviewedBy && {
      reviewedBy: {
        '@type': 'Organization',
        name: reviewedBy,
      },
    }),
    ...(image && { image }),
    ...(url && { mainEntityOfPage: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    ...(mainContentOfPage && { mainContentOfPage }),
    // Add medical disclaimer
    disclaimer: {
      '@type': 'MedicalDisclaimer',
      text: disclaimer,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// TIMELINE SCHEMA (for crime_courts and archives_buried sectors)
// ============================================================

interface TimelineEvent {
  date: string;
  name: string;
  description?: string;
  location?: string;
}

interface TimelineSchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  events: TimelineEvent[];
  startDate?: string;
  endDate?: string;
  author?: string;
  datePublished?: string;
  image?: string;
  url?: string;
  about?: string;
}

export function TimelineSchema({
  name,
  nameTe,
  description,
  events,
  startDate,
  endDate,
  author = 'TeluguVibes',
  datePublished,
  image,
  url,
  about,
}: TimelineSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name,
    ...(nameTe && { alternateName: nameTe }),
    ...(description && { description }),
    ...(about && {
      about: {
        '@type': 'Thing',
        name: about,
      },
    }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(image && { image }),
    ...(url && { mainEntityOfPage: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    // Timeline as ItemList
    mainEntity: {
      '@type': 'ItemList',
      name: `Timeline: ${name}`,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      numberOfItems: events.length,
      itemListElement: events.map((event, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Event',
          name: event.name,
          startDate: event.date,
          ...(event.description && { description: event.description }),
          ...(event.location && {
            location: {
              '@type': 'Place',
              name: event.location,
            },
          }),
        },
      })),
    },
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// LEGAL CASE SCHEMA (for crime_courts sector)
// ============================================================

interface LegalCaseSchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  caseNumber?: string;
  court?: string;
  dateStarted?: string;
  dateConcluded?: string;
  outcome?: string;
  parties?: string[];
  judge?: string;
  events?: TimelineEvent[];
  author?: string;
  datePublished?: string;
  image?: string;
  url?: string;
  disclaimer?: string;
}

export function LegalCaseSchema({
  name,
  nameTe,
  description,
  caseNumber,
  court,
  dateStarted,
  dateConcluded,
  outcome,
  parties,
  judge,
  events,
  author = 'TeluguVibes',
  datePublished,
  image,
  url,
  disclaimer = 'This content is based on publicly available records. Information should be independently verified for legal purposes.',
}: LegalCaseSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    articleSection: 'Legal Case Study',
    name,
    headline: name,
    ...(nameTe && { alternativeHeadline: nameTe }),
    ...(description && { description }),
    ...(caseNumber && { identifier: caseNumber }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(image && { image }),
    ...(url && { mainEntityOfPage: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    // Case details as mainEntity
    mainEntity: {
      '@type': 'Thing',
      name: name,
      ...(caseNumber && { identifier: caseNumber }),
      ...(court && { location: { '@type': 'CourtHouse', name: court } }),
      ...(dateStarted && { startDate: dateStarted }),
      ...(dateConcluded && { endDate: dateConcluded }),
      ...(outcome && { result: outcome }),
      ...(judge && { agent: { '@type': 'Person', name: judge, jobTitle: 'Judge' } }),
      ...(parties && parties.length > 0 && {
        participant: parties.map(party => ({
          '@type': 'Person',
          name: party,
        })),
      }),
    },
    // Timeline if events provided
    ...(events && events.length > 0 && {
      hasPart: {
        '@type': 'ItemList',
        name: 'Case Timeline',
        numberOfItems: events.length,
        itemListElement: events.map((event, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Event',
            name: event.name,
            startDate: event.date,
            ...(event.description && { description: event.description }),
          },
        })),
      },
    }),
    // Legal disclaimer
    disclaimer: disclaimer,
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// ARCHIVE COMPONENT SCHEMA (for archives_buried sector)
// ============================================================

interface ArchiveSchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  dateCreated?: string;
  dateModified?: string;
  historicalPeriod?: string;
  about?: string;
  locationCreated?: string;
  material?: string; // e.g., "Document", "Photograph", "Recording"
  holdingArchive?: string;
  accessMode?: string;
  author?: string;
  datePublished?: string;
  image?: string;
  url?: string;
  disclaimer?: string;
}

export function ArchiveSchema({
  name,
  nameTe,
  description,
  dateCreated,
  dateModified,
  historicalPeriod,
  about,
  locationCreated,
  material,
  holdingArchive,
  accessMode,
  author = 'TeluguVibes',
  datePublished,
  image,
  url,
  disclaimer = 'This content discusses sensitive historical topics and may contain disturbing material.',
}: ArchiveSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ArchiveComponent',
    name,
    ...(nameTe && { alternateName: nameTe }),
    ...(description && { description }),
    ...(dateCreated && { dateCreated }),
    ...(dateModified && { dateModified }),
    ...(historicalPeriod && { temporalCoverage: historicalPeriod }),
    ...(about && {
      about: {
        '@type': 'Thing',
        name: about,
      },
    }),
    ...(locationCreated && {
      locationCreated: {
        '@type': 'Place',
        name: locationCreated,
      },
    }),
    ...(material && { material }),
    ...(holdingArchive && {
      holdingArchive: {
        '@type': 'ArchiveOrganization',
        name: holdingArchive,
      },
    }),
    ...(accessMode && { accessMode }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(image && { image }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    disclaimer: disclaimer,
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// FICTIONAL CONTENT SCHEMA (for what_if_fiction sector)
// ============================================================

interface FictionalContentSchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  author?: string;
  datePublished?: string;
  genre?: string[];
  about?: string;
  character?: string[];
  setting?: string;
  image?: string;
  url?: string;
  disclaimer?: string;
}

export function FictionalContentSchema({
  name,
  nameTe,
  description,
  author = 'TeluguVibes',
  datePublished,
  genre,
  about,
  character,
  setting,
  image,
  url,
  disclaimer = 'This is a work of fiction or speculation. Any resemblance to actual events or persons is coincidental.',
}: FictionalContentSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    additionalType: 'FictionalWork',
    name,
    ...(nameTe && { alternateName: nameTe }),
    ...(description && { description }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(genre && genre.length > 0 && { genre }),
    ...(about && {
      about: {
        '@type': 'Thing',
        name: about,
      },
    }),
    ...(character && character.length > 0 && {
      character: character.map(c => ({
        '@type': 'Person',
        name: c,
      })),
    }),
    ...(setting && {
      contentLocation: {
        '@type': 'Place',
        name: setting,
      },
    }),
    ...(image && { image }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    disclaimer: disclaimer,
    isFamilyFriendly: true,
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

// ============================================================
// STORY SCHEMA (for kids stories)
// ============================================================

interface StorySchemaProps {
  name: string;
  nameTe?: string;
  description?: string;
  author?: string;
  datePublished?: string;
  genre?: string[];
  typicalAgeRange?: string;
  educationalAlignment?: string;
  moral?: string;
  character?: string[];
  image?: string;
  url?: string;
  inLanguage?: string;
  timeRequired?: string;
}

export function StorySchema({
  name,
  nameTe,
  description,
  author = 'TeluguVibes',
  datePublished,
  genre,
  typicalAgeRange,
  educationalAlignment,
  moral,
  character,
  image,
  url,
  inLanguage = 'te',
  timeRequired,
}: StorySchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://teluguvibes.com';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ShortStory',
    name,
    ...(nameTe && { alternateName: nameTe }),
    ...(description && { description }),
    author: {
      '@type': 'Organization',
      name: author,
    },
    ...(datePublished && { datePublished }),
    ...(genre && genre.length > 0 && { genre }),
    ...(typicalAgeRange && { typicalAgeRange }),
    ...(educationalAlignment && {
      educationalAlignment: {
        '@type': 'AlignmentObject',
        alignmentType: 'teaches',
        targetName: educationalAlignment,
      },
    }),
    ...(moral && {
      teaches: moral,
    }),
    ...(character && character.length > 0 && {
      character: character.map(c => ({
        '@type': 'Person',
        name: c,
      })),
    }),
    ...(image && { image }),
    inLanguage,
    ...(timeRequired && { timeRequired }),
    ...(url && { url: url.startsWith('http') ? url : `${baseUrl}${url}` }),
    isFamilyFriendly: true,
    publisher: {
      '@type': 'Organization',
      name: 'TeluguVibes',
      url: baseUrl,
    },
  };

  return <SchemaScriptComponent data={schema} />;
}

export default {
  MovieSchema,
  ReviewSchema,
  PersonSchema,
  CollectionSchema,
  ArticleSchema,
  WebsiteSchema,
  BreadcrumbSchema,
  FAQSchema,
  EnhancedMovieSchema,
  VideoSchema,
  // New content sector schemas
  RecipeSchema,
  LearningResourceSchema,
  MedicalWebPageSchema,
  TimelineSchema,
  LegalCaseSchema,
  ArchiveSchema,
  FictionalContentSchema,
  StorySchema,
};
