'use client';

/**
 * Astrology Page - Part of Life Vibes
 * Shows horoscopes and related Life sections
 */

import { useLanguage } from '@/lib/i18n';
import { RelatedSections } from '@/components/RelatedSections';
import { BottomInfoBar } from '@/components/BottomInfoBar';

const zodiacSigns = [
  { en: 'Aries', te: 'మేషం', emoji: '♈', date: 'Mar 21 - Apr 19' },
  { en: 'Taurus', te: 'వృషభం', emoji: '♉', date: 'Apr 20 - May 20' },
  { en: 'Gemini', te: 'మిథునం', emoji: '♊', date: 'May 21 - Jun 20' },
  { en: 'Cancer', te: 'కర్కాటకం', emoji: '♋', date: 'Jun 21 - Jul 22' },
  { en: 'Leo', te: 'సింహం', emoji: '♌', date: 'Jul 23 - Aug 22' },
  { en: 'Virgo', te: 'కన్య', emoji: '♍', date: 'Aug 23 - Sep 22' },
  { en: 'Libra', te: 'తుల', emoji: '♎', date: 'Sep 23 - Oct 22' },
  { en: 'Scorpio', te: 'వృశ్చికం', emoji: '♏', date: 'Oct 23 - Nov 21' },
  { en: 'Sagittarius', te: 'ధనుస్సు', emoji: '♐', date: 'Nov 22 - Dec 21' },
  { en: 'Capricorn', te: 'మకరం', emoji: '♑', date: 'Dec 22 - Jan 19' },
  { en: 'Aquarius', te: 'కుంభం', emoji: '♒', date: 'Jan 20 - Feb 18' },
  { en: 'Pisces', te: 'మీనం', emoji: '♓', date: 'Feb 19 - Mar 20' },
];

export default function AstrologyPage() {
  const { isEnglish } = useLanguage();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="relative py-12 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-indigo-800/20 to-blue-900/40" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-1/4 text-6xl animate-pulse">✨</div>
          <div className="absolute top-20 right-1/3 text-4xl animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
          <div className="absolute bottom-10 left-1/3 text-5xl animate-pulse" style={{ animationDelay: '1s' }}>🌙</div>
        </div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-purple-500/20 px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            <span className="text-2xl">🔮</span>
            <span className="text-purple-300 font-medium">
              {isEnglish ? 'Star Signs' : 'రాశి ఫలాలు'}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {isEnglish ? 'Daily Horoscope' : 'రాశి ఫలాలు'}
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {isEnglish 
              ? 'Discover your daily horoscope and cosmic guidance'
              : 'మీ రాశి ఫలాలు, జ్యోతిష్య సలహాలు'}
          </p>
        </div>
      </div>

      {/* Zodiac Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {zodiacSigns.map((sign) => (
            <div 
              key={sign.en}
              className="group cursor-pointer p-6 rounded-xl text-center transition-all duration-300 hover:scale-105 hover:shadow-xl"
              style={{ 
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {sign.emoji}
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {isEnglish ? sign.en : sign.te}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {sign.date}
              </p>
            </div>
          ))}
        </div>

        {/* Today's Highlights */}
        <div className="mt-12 p-8 rounded-xl" style={{ 
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
          border: '1px solid var(--border-primary)'
        }}>
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
            {isEnglish ? "Today's Cosmic Guidance" : 'నేటి విశ్వ మార్గదర్శకత్వం'}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="text-3xl mb-2">🌅</div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {isEnglish ? 'Lucky Time' : 'అదృష్ట సమయం'}
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>9:00 AM - 11:00 AM</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="text-3xl mb-2">🎨</div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {isEnglish ? 'Lucky Color' : 'అదృష్ట రంగు'}
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>{isEnglish ? 'Royal Blue' : 'రాయల్ బ్లూ'}</p>
            </div>
            <div className="text-center p-4 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="text-3xl mb-2">🔢</div>
              <h4 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                {isEnglish ? 'Lucky Number' : 'అదృష్ట సంఖ్య'}
              </h4>
              <p style={{ color: 'var(--text-secondary)' }}>7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Sections from Life Vibes */}
      <RelatedSections currentSectionId="astrology" />

      {/* Bottom Info Bar */}
      <BottomInfoBar />
    </div>
  );
}
