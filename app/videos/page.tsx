'use client';

/**
 * Videos Page - Part of Life Vibes
 * Shows video content and related Life Vibes sections
 */

import { useLanguage } from '@/lib/i18n';
import { SampleContentGrid, generateSampleItems } from '@/components/SampleContentGrid';
import { RelatedSections } from '@/components/RelatedSections';
import { BottomInfoBar } from '@/components/BottomInfoBar';

export default function VideosPage() {
  const { isEnglish } = useLanguage();
  const items = generateSampleItems('videos', 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="relative py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-orange-600/20" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-red-500/20 px-4 py-2 rounded-full mb-6">
            <span className="text-2xl">🎬</span>
            <span className="text-red-300 font-medium">
              {isEnglish ? 'Video Wave' : 'వీడియో వేవ్'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isEnglish ? 'Video Wave' : 'వీడియో వేవ్'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isEnglish 
              ? 'Exclusive interviews, movie trailers, and trending video content'
              : 'ఎక్స్‌క్లూసివ్ ఇంటర్వ్యూలు, మూవీ ట్రైలర్లు, ట్రెండింగ్ వీడియోలు'}
          </p>
        </div>
      </div>

      {/* Video Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <SampleContentGrid
          sectionId="videos"
          items={items}
          showAsFeatured={true}
        />
      </div>

      {/* Related Sections from Life Vibes */}
      <RelatedSections currentSectionId="videos" />

      {/* Bottom Info Bar */}
      <BottomInfoBar />
    </div>
  );
}
