'use client';

/**
 * Editorial Page - Part of News World
 * Shows opinion pieces and related News sections
 */

import { useLanguage } from '@/lib/i18n';
import { SampleContentGrid, generateSampleItems } from '@/components/SampleContentGrid';
import { RelatedSections } from '@/components/RelatedSections';
import { BottomInfoBar } from '@/components/BottomInfoBar';

export default function EditorialPage() {
  const { isEnglish } = useLanguage();
  const items = generateSampleItems('editorial', 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="relative py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-600/20 via-transparent to-gray-700/20" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-gray-500/20 px-4 py-2 rounded-full mb-6">
            <span className="text-2xl">📝</span>
            <span className="text-gray-300 font-medium">
              {isEnglish ? 'Editorial' : 'సంపాదకీయం'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isEnglish ? 'Editorial & Opinion' : 'సంపాదకీయం & అభిప్రాయం'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isEnglish 
              ? 'Thoughtful analysis, expert opinions, and editorial commentary'
              : 'విశ్లేషణలు, నిపుణుల అభిప్రాయాలు, సంపాదకీయ వ్యాఖ్యానం'}
          </p>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <SampleContentGrid
          sectionId="editorial"
          items={items}
          showAsFeatured={true}
        />
      </div>

      {/* Related Sections from News World */}
      <RelatedSections currentSectionId="editorial" />

      {/* Bottom Info Bar */}
      <BottomInfoBar />
    </div>
  );
}
