'use client';

/**
 * Photos Page - Part of Glam & Entertainment
 * Shows photo galleries and related Glam sections
 */

import { useLanguage } from '@/lib/i18n';
import { SampleContentGrid, generateSampleItems } from '@/components/SampleContentGrid';
import { RelatedSections } from '@/components/RelatedSections';
import { BottomInfoBar } from '@/components/BottomInfoBar';

export default function PhotosPage() {
  const { isEnglish } = useLanguage();
  const items = generateSampleItems('photos', 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="relative py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-transparent to-pink-600/20" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-purple-500/20 px-4 py-2 rounded-full mb-6">
            <span className="text-2xl">📸</span>
            <span className="text-purple-300 font-medium">
              {isEnglish ? 'Photo Flash' : 'ఫోటో ఫ్లాష్'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isEnglish ? 'Photo Flash' : 'ఫోటో ఫ్లాష్'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isEnglish 
              ? 'Celebrity photoshoots, event galleries, and exclusive photos'
              : 'సెలబ్రిటీ ఫోటోషూట్లు, ఇవెంట్ గ్యాలరీలు, ఎక్స్‌క్లూసివ్ ఫోటోలు'}
          </p>
        </div>
      </div>

      {/* Photo Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <SampleContentGrid
          sectionId="photos"
          items={items}
          showAsFeatured={true}
        />
      </div>

      {/* Related Sections from Glam & Entertainment */}
      <RelatedSections currentSectionId="photos" />

      {/* Bottom Info Bar */}
      <BottomInfoBar />
    </div>
  );
}
