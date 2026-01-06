/**
 * Celebrities Page
 *
 * Shows all Telugu cinema celebrities.
 */

import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { Star, Users, Film, Music, Clapperboard } from 'lucide-react';

interface Celebrity {
  id: string;
  slug: string;
  name_en: string;
  name_te?: string;
  occupation?: string;
  profile_image?: string;
  popularity_score?: number;
}

export const revalidate = 3600;

export const metadata = {
  title: 'సెలబ్రిటీలు | TeluguVibes',
  description: 'తెలుగు సినిమా సెలబ్రిటీలు - నటులు, నటీమణులు, దర్శకులు, సంగీత దర్శకులు',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OCCUPATION_TABS = [
  { key: 'all', label: 'అందరూ', labelEn: 'All', icon: Users },
  { key: 'actor', label: 'నటులు', labelEn: 'Actors', icon: Film },
  { key: 'actress', label: 'నటీమణులు', labelEn: 'Actresses', icon: Star },
  { key: 'director', label: 'దర్శకులు', labelEn: 'Directors', icon: Clapperboard },
  { key: 'music_director', label: 'సంగీతం', labelEn: 'Music', icon: Music },
];

async function getCelebrities(occupation?: string) {
  let query = supabase
    .from("celebrities")
    .select("*")
    .order("popularity_score", { ascending: false })
    .limit(100);

  if (occupation && occupation !== "all") {
    // occupation is a text[] array, use contains operator
    query = query.contains("occupation", [occupation]);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching celebrities:", error);
    return [];
  }

  // Sort to prioritize those with real TMDB images first
  const sorted = (data || []).sort((a, b) => {
    const aHasRealImage =
      a.profile_image && a.profile_image.includes("tmdb.org");
    const bHasRealImage =
      b.profile_image && b.profile_image.includes("tmdb.org");

    // Real images first
    if (aHasRealImage && !bHasRealImage) return -1;
    if (!aHasRealImage && bHasRealImage) return 1;

    // Then by popularity
    return (b.popularity_score || 0) - (a.popularity_score || 0);
  });

  return sorted;
}

interface PageProps {
  searchParams: Promise<{ occupation?: string }>;
}

export default async function CelebritiesPage({ searchParams }: PageProps) {
  const { occupation } = await searchParams;
  const celebrities = await getCelebrities(occupation);

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero */}
      <section className="py-12 border-b" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            🌟 తెలుగు సెలబ్రిటీలు
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            తెలుగు సినిమా లెజెండ్స్ నుండి న్యూ జెన్ స్టార్స్ వరకు
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Occupation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {OCCUPATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = (occupation || 'all') === tab.key;
            return (
              <Link
                key={tab.key}
                href={
                  tab.key === "all"
                    ? "/celebrities"
                    : `/celebrities?occupation=${tab.key}`
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isActive
                    ? "bg-orange-500 text-[var(--text-primary)]"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Celebrities Grid */}
        {celebrities.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {celebrities.map((celebrity) => (
              <CelebrityCard key={celebrity.id} celebrity={celebrity} />
            ))}
          </div>
        ) : (
          <EmptyState occupation={occupation} />
        )}
      </div>
    </main>
  );
}

function CelebrityCard({ celebrity }: { celebrity: Celebrity }) {
  // Check if we have a real TMDB image
  const hasRealImage =
    celebrity.profile_image && celebrity.profile_image.includes("tmdb.org");
  const imageUrl = hasRealImage ? celebrity.profile_image : null;

  // Get initials for placeholder
  const initials = celebrity.name_en
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/celebrity/${celebrity.slug || celebrity.id}`}
      className="group relative bg-[var(--bg-primary)] rounded-xl overflow-hidden border border-[var(--border-primary)] hover:border-orange-500 transition-all"
    >
      <div className="aspect-[3/4] relative">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={celebrity.name_en}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          />
        ) : (
          // Stylish gradient placeholder with initials
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-600 via-orange-500 to-yellow-500 group-hover:scale-105 transition-transform duration-300">
            <span className="text-4xl font-bold text-[var(--text-primary)]/90 drop-shadow-lg">
              {initials}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="text-[var(--text-primary)] font-bold text-sm truncate group-hover:text-orange-400 transition-colors">
          {celebrity.name_te || celebrity.name_en}
        </h3>
        <p className="text-[var(--text-secondary)] text-xs truncate">
          {Array.isArray(celebrity.occupation)
            ? celebrity.occupation[0]
            : celebrity.occupation || "Actor"}
        </p>
        {(celebrity.popularity_score ?? 0) > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-yellow-400">
              {celebrity.popularity_score}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

function EmptyState({ occupation }: { occupation?: string }) {
  return (
    <div className="text-center py-16">
      <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
        సెలబ్రిటీలు కనుగొనబడలేదు
      </h2>
      <p className="text-[var(--text-secondary)] mb-6">
        {occupation
          ? `"${occupation}" వర్గంలో ఏ సెలబ్రిటీలు లేరు`
          : "డేటాబేస్ లో సెలబ్రిటీలు లేరు"}
      </p>
      <Link
        href="/admin/celebrities"
        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-[var(--text-primary)] rounded-lg hover:bg-orange-600 transition-colors"
      >
        Add Celebrities
      </Link>
    </div>
  );
}
