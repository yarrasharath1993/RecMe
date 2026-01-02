'use client';

/**
 * SampleContentGrid
 * 
 * Displays sample/placeholder content for sections that don't have real data yet.
 * Shows a visually appealing grid similar to the sports category page.
 */

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';
import { getCategoryMeta } from '@/lib/config/navigation';
import { Clock, Eye, TrendingUp, Sparkles } from 'lucide-react';

interface SampleItem {
  id: string;
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  imageUrl: string;
  href: string;
  badge?: string;
  views?: number;
}

interface SampleContentGridProps {
  sectionId: string;
  items: SampleItem[];
  emptyMessage?: string;
  emptyMessageEn?: string;
  showAsFeatured?: boolean;
}

// Generate sample items for different sections
export function generateSampleItems(sectionId: string, count: number = 6): SampleItem[] {
  const sampleData: Record<string, SampleItem[]> = {
    stories: [
      { id: '1', title: 'ప్రేమ కథ: మరపురాని క్షణాలు', titleEn: 'Love Story: Unforgettable Moments', imageUrl: 'https://picsum.photos/seed/story1/400/300', href: '/stories/1', badge: 'NEW', views: 1234 },
      { id: '2', title: 'రహస్య ద్వారం: మిస్టరీ కథ', titleEn: 'Secret Door: Mystery Story', imageUrl: 'https://picsum.photos/seed/story2/400/300', href: '/stories/2', views: 987 },
      { id: '3', title: 'చిన్ననాటి జ్ఞాపకాలు', titleEn: 'Childhood Memories', imageUrl: 'https://picsum.photos/seed/story3/400/300', href: '/stories/3', views: 756 },
      { id: '4', title: 'అమ్మ ప్రేమ: హృదయ స్పర్శి కథ', titleEn: "Mother's Love: Heartwarming Tale", imageUrl: 'https://picsum.photos/seed/story4/400/300', href: '/stories/4', badge: 'HOT', views: 2341 },
      { id: '5', title: 'నేస్తం కోసం: స్నేహ గాథ', titleEn: 'For A Friend: Friendship Tale', imageUrl: 'https://picsum.photos/seed/story5/400/300', href: '/stories/5', views: 543 },
      { id: '6', title: 'కలల బాట: స్ఫూర్తి కథ', titleEn: 'Path of Dreams: Inspirational Story', imageUrl: 'https://picsum.photos/seed/story6/400/300', href: '/stories/6', views: 432 },
    ],
    memes: [
      { id: '1', title: 'మహేష్ బాబు మీమ్స్', titleEn: 'Mahesh Babu Memes', imageUrl: 'https://picsum.photos/seed/meme1/400/400', href: '/memes/1', badge: 'VIRAL', views: 5678 },
      { id: '2', title: 'ఆఫీస్ మీమ్స్ కలెక్షన్', titleEn: 'Office Memes Collection', imageUrl: 'https://picsum.photos/seed/meme2/400/400', href: '/memes/2', views: 4321 },
      { id: '3', title: 'రిలేటబుల్ తెలుగు మీమ్స్', titleEn: 'Relatable Telugu Memes', imageUrl: 'https://picsum.photos/seed/meme3/400/400', href: '/memes/3', badge: 'HOT', views: 3456 },
      { id: '4', title: 'క్రికెట్ మీమ్స్ స్పెషల్', titleEn: 'Cricket Memes Special', imageUrl: 'https://picsum.photos/seed/meme4/400/400', href: '/memes/4', views: 2345 },
      { id: '5', title: 'పొలిటికల్ సెటైర్ మీమ్స్', titleEn: 'Political Satire Memes', imageUrl: 'https://picsum.photos/seed/meme5/400/400', href: '/memes/5', views: 1890 },
      { id: '6', title: 'వీకెండ్ మూడ్ మీమ్స్', titleEn: 'Weekend Mood Memes', imageUrl: 'https://picsum.photos/seed/meme6/400/400', href: '/memes/6', views: 1567 },
    ],
    quizzes: [
      { id: '1', title: 'తెలుగు సినిమా క్విజ్', titleEn: 'Telugu Cinema Quiz', imageUrl: 'https://picsum.photos/seed/quiz1/400/300', href: '/quizzes/1', badge: 'NEW', views: 2345 },
      { id: '2', title: 'జనరల్ నాలెడ్జ్ టెస్ట్', titleEn: 'General Knowledge Test', imageUrl: 'https://picsum.photos/seed/quiz2/400/300', href: '/quizzes/2', views: 1876 },
      { id: '3', title: 'IQ టెస్ట్ ఛాలెంజ్', titleEn: 'IQ Test Challenge', imageUrl: 'https://picsum.photos/seed/quiz3/400/300', href: '/quizzes/3', badge: 'HOT', views: 3456 },
      { id: '4', title: 'క్రికెట్ క్విజ్ మాస్టర్', titleEn: 'Cricket Quiz Master', imageUrl: 'https://picsum.photos/seed/quiz4/400/300', href: '/quizzes/4', views: 1234 },
      { id: '5', title: 'తెలుగు సాహిత్యం క్విజ్', titleEn: 'Telugu Literature Quiz', imageUrl: 'https://picsum.photos/seed/quiz5/400/300', href: '/quizzes/5', views: 987 },
      { id: '6', title: 'పర్సనాలిటీ టెస్ట్', titleEn: 'Personality Test', imageUrl: 'https://picsum.photos/seed/quiz6/400/300', href: '/quizzes/6', views: 2134 },
    ],
    webSeries: [
      { id: '1', title: 'ది ఫ్యామిలీ మ్యాన్ సీజన్ 3', titleEn: 'The Family Man Season 3', imageUrl: 'https://picsum.photos/seed/web1/400/225', href: '/web-series/1', badge: 'NEW', views: 8765 },
      { id: '2', title: 'మిర్జాపూర్ సీజన్ 4', titleEn: 'Mirzapur Season 4', imageUrl: 'https://picsum.photos/seed/web2/400/225', href: '/web-series/2', views: 7654 },
      { id: '3', title: 'పంచాయత్ సీజన్ 3', titleEn: 'Panchayat Season 3', imageUrl: 'https://picsum.photos/seed/web3/400/225', href: '/web-series/3', badge: 'HOT', views: 9876 },
      { id: '4', title: 'స్కామ్ 2024', titleEn: 'Scam 2024', imageUrl: 'https://picsum.photos/seed/web4/400/225', href: '/web-series/4', views: 5432 },
      { id: '5', title: 'అష్రమ్ సీజన్ 4', titleEn: 'Aashram Season 4', imageUrl: 'https://picsum.photos/seed/web5/400/225', href: '/web-series/5', views: 4321 },
      { id: '6', title: 'మేడ్ ఇన్ హెవెన్ సీజన్ 3', titleEn: 'Made in Heaven Season 3', imageUrl: 'https://picsum.photos/seed/web6/400/225', href: '/web-series/6', views: 3210 },
    ],
    jobs: [
      { id: '1', title: 'ఐటి కంపెనీల్లో 5000 ఉద్యోగాలు', titleEn: '5000 IT Company Jobs', imageUrl: 'https://picsum.photos/seed/job1/400/300', href: '/jobs/1', badge: 'NEW', views: 4567 },
      { id: '2', title: 'బ్యాంకింగ్ సెక్టార్ వేకెన్సీలు', titleEn: 'Banking Sector Vacancies', imageUrl: 'https://picsum.photos/seed/job2/400/300', href: '/jobs/2', views: 3456 },
      { id: '3', title: 'గవర్నమెంట్ జాబ్స్ 2024', titleEn: 'Government Jobs 2024', imageUrl: 'https://picsum.photos/seed/job3/400/300', href: '/jobs/3', badge: 'HOT', views: 8765 },
      { id: '4', title: 'ఫ్రెషర్స్ కోసం ఉద్యోగాలు', titleEn: 'Jobs for Freshers', imageUrl: 'https://picsum.photos/seed/job4/400/300', href: '/jobs/4', views: 2345 },
      { id: '5', title: 'రైల్వే రిక్రూట్‌మెంట్ 2024', titleEn: 'Railway Recruitment 2024', imageUrl: 'https://picsum.photos/seed/job5/400/300', href: '/jobs/5', views: 5678 },
      { id: '6', title: 'టీచింగ్ జాబ్స్ వేకెన్సీ', titleEn: 'Teaching Jobs Vacancy', imageUrl: 'https://picsum.photos/seed/job6/400/300', href: '/jobs/6', views: 1987 },
    ],
    astrology: [
      { id: '1', title: 'మేషం రాశి ఫలాలు 2024', titleEn: 'Aries Horoscope 2024', imageUrl: 'https://picsum.photos/seed/astro1/400/300', href: '/astrology/mesha', views: 3456 },
      { id: '2', title: 'వృషభం రాశి ఫలాలు', titleEn: 'Taurus Horoscope', imageUrl: 'https://picsum.photos/seed/astro2/400/300', href: '/astrology/vrushabha', views: 2987 },
      { id: '3', title: 'మిథునం రాశి ఫలాలు', titleEn: 'Gemini Horoscope', imageUrl: 'https://picsum.photos/seed/astro3/400/300', href: '/astrology/mithuna', views: 2654 },
      { id: '4', title: 'నేటి పంచాంగం', titleEn: "Today's Panchang", imageUrl: 'https://picsum.photos/seed/astro4/400/300', href: '/astrology/panchang', badge: 'NEW', views: 4567 },
      { id: '5', title: 'వారఫలాలు - అన్ని రాశులు', titleEn: 'Weekly Horoscope - All Signs', imageUrl: 'https://picsum.photos/seed/astro5/400/300', href: '/astrology/weekly', views: 5678 },
      { id: '6', title: 'నక్షత్ర ఫలాలు', titleEn: 'Nakshatra Predictions', imageUrl: 'https://picsum.photos/seed/astro6/400/300', href: '/astrology/nakshatra', views: 2134 },
    ],
    editorial: [
      { id: '1', title: 'ప్రజాస్వామ్యం మన బాధ్యత', titleEn: 'Democracy is Our Responsibility', imageUrl: 'https://picsum.photos/seed/edit1/400/300', href: '/editorial/1', views: 1234 },
      { id: '2', title: 'విద్యారంగంలో మార్పులు', titleEn: 'Changes in Education Sector', imageUrl: 'https://picsum.photos/seed/edit2/400/300', href: '/editorial/2', views: 987 },
      { id: '3', title: 'ఆర్థిక వ్యవస్థ గమనం', titleEn: 'Economic Outlook', imageUrl: 'https://picsum.photos/seed/edit3/400/300', href: '/editorial/3', badge: 'NEW', views: 1567 },
      { id: '4', title: 'సామాజిక న్యాయం', titleEn: 'Social Justice', imageUrl: 'https://picsum.photos/seed/edit4/400/300', href: '/editorial/4', views: 876 },
      { id: '5', title: 'పర్యావరణ పరిరక్షణ', titleEn: 'Environmental Protection', imageUrl: 'https://picsum.photos/seed/edit5/400/300', href: '/editorial/5', views: 654 },
      { id: '6', title: 'యువత భవిష్యత్తు', titleEn: 'Youth and Future', imageUrl: 'https://picsum.photos/seed/edit6/400/300', href: '/editorial/6', views: 543 },
    ],
    videos: [
      { id: '1', title: 'ఎక్స్‌క్లూసివ్ ఇంటర్వ్యూ', titleEn: 'Exclusive Interview', imageUrl: 'https://picsum.photos/seed/vid1/640/360', href: '/videos/1', badge: 'NEW', views: 5678 },
      { id: '2', title: 'మూవీ ట్రైలర్ రివ్యూ', titleEn: 'Movie Trailer Review', imageUrl: 'https://picsum.photos/seed/vid2/640/360', href: '/videos/2', views: 4567 },
      { id: '3', title: 'బ్రేకింగ్ న్యూస్ అనాలిసిస్', titleEn: 'Breaking News Analysis', imageUrl: 'https://picsum.photos/seed/vid3/640/360', href: '/videos/3', badge: 'HOT', views: 7890 },
      { id: '4', title: 'స్పోర్ట్స్ హైలైట్స్', titleEn: 'Sports Highlights', imageUrl: 'https://picsum.photos/seed/vid4/640/360', href: '/videos/4', views: 3456 },
      { id: '5', title: 'టెక్ రివ్యూ షో', titleEn: 'Tech Review Show', imageUrl: 'https://picsum.photos/seed/vid5/640/360', href: '/videos/5', views: 2345 },
      { id: '6', title: 'ట్రావెల్ వ్లాగ్', titleEn: 'Travel Vlog', imageUrl: 'https://picsum.photos/seed/vid6/640/360', href: '/videos/6', views: 1987 },
    ],
    photos: [
      { id: '1', title: 'సెలబ్రిటీ ఫోటో షూట్', titleEn: 'Celebrity Photo Shoot', imageUrl: 'https://picsum.photos/seed/photo1/400/500', href: '/photos/1', badge: 'HOT', views: 6789 },
      { id: '2', title: 'ఇవెంట్ గ్యాలరీ', titleEn: 'Event Gallery', imageUrl: 'https://picsum.photos/seed/photo2/400/500', href: '/photos/2', views: 5432 },
      { id: '3', title: 'మూవీ స్టిల్స్', titleEn: 'Movie Stills', imageUrl: 'https://picsum.photos/seed/photo3/400/500', href: '/photos/3', views: 4321 },
      { id: '4', title: 'ఫ్యాషన్ ఫోటోలు', titleEn: 'Fashion Photos', imageUrl: 'https://picsum.photos/seed/photo4/400/500', href: '/photos/4', badge: 'NEW', views: 3210 },
      { id: '5', title: 'స్పోర్ట్స్ ఫోటోగ్రఫీ', titleEn: 'Sports Photography', imageUrl: 'https://picsum.photos/seed/photo5/400/500', href: '/photos/5', views: 2109 },
      { id: '6', title: 'నేచర్ ఫోటోగ్రఫీ', titleEn: 'Nature Photography', imageUrl: 'https://picsum.photos/seed/photo6/400/500', href: '/photos/6', views: 1876 },
    ],
    games: [
      { id: '1', title: 'మూవీ క్విజ్ ఛాలెంజ్', titleEn: 'Movie Quiz Challenge', imageUrl: 'https://picsum.photos/seed/game1/400/300', href: '/games/movie-quiz', badge: 'HOT', views: 4567 },
      { id: '2', title: 'డంబ్ చరేడ్స్ గేమ్', titleEn: 'Dumb Charades Game', imageUrl: 'https://picsum.photos/seed/game2/400/300', href: '/games/dumb-charades', views: 3456 },
      { id: '3', title: 'డైలాగ్ గెస్ గేమ్', titleEn: 'Dialogue Guess Game', imageUrl: 'https://picsum.photos/seed/game3/400/300', href: '/games/dialogue-guess', badge: 'NEW', views: 2345 },
      { id: '4', title: 'హిట్ ఆర్ ఫ్లాప్', titleEn: 'Hit or Flop', imageUrl: 'https://picsum.photos/seed/game4/400/300', href: '/games/hit-or-flop', views: 1987 },
      { id: '5', title: 'ఎమోజీ మూవీ గేమ్', titleEn: 'Emoji Movie Game', imageUrl: 'https://picsum.photos/seed/game5/400/300', href: '/games/emoji-movie', views: 1654 },
      { id: '6', title: 'డైరెక్టర్ క్విజ్', titleEn: 'Director Quiz', imageUrl: 'https://picsum.photos/seed/game6/400/300', href: '/games/director-quiz', views: 1234 },
    ],
    health: [
      { id: '1', title: 'యోగా హెల్త్ బెనిఫిట్స్', titleEn: 'Yoga Health Benefits', imageUrl: 'https://picsum.photos/seed/health1/400/300', href: '/category/health', badge: 'NEW', views: 3456 },
      { id: '2', title: 'డయాబెటిస్ నియంత్రణ', titleEn: 'Diabetes Control Tips', imageUrl: 'https://picsum.photos/seed/health2/400/300', href: '/category/health', views: 2987 },
      { id: '3', title: 'మానసిక ఆరోగ్యం', titleEn: 'Mental Health Tips', imageUrl: 'https://picsum.photos/seed/health3/400/300', href: '/category/health', views: 2654 },
      { id: '4', title: 'ఫిట్‌నెస్ టిప్స్', titleEn: 'Fitness Tips 2024', imageUrl: 'https://picsum.photos/seed/health4/400/300', href: '/category/health', views: 2345 },
      { id: '5', title: 'ఆయుర్వేద రెమెడీస్', titleEn: 'Ayurvedic Remedies', imageUrl: 'https://picsum.photos/seed/health5/400/300', href: '/category/health', views: 1987 },
      { id: '6', title: 'స్కిన్ కేర్ గైడ్', titleEn: 'Skin Care Guide', imageUrl: 'https://picsum.photos/seed/health6/400/300', href: '/category/health', views: 1654 },
    ],
    food: [
      { id: '1', title: 'హైదరాబాదీ బిర్యానీ రెసిపీ', titleEn: 'Hyderabadi Biryani Recipe', imageUrl: 'https://picsum.photos/seed/food1/400/300', href: '/category/food', badge: 'HOT', views: 5678 },
      { id: '2', title: 'తెలుగు వంటకాల చరిత్ర', titleEn: 'Telugu Cuisine History', imageUrl: 'https://picsum.photos/seed/food2/400/300', href: '/category/food', views: 4567 },
      { id: '3', title: 'హెల్తీ బ్రేక్‌ఫాస్ట్', titleEn: 'Healthy Breakfast Ideas', imageUrl: 'https://picsum.photos/seed/food3/400/300', href: '/category/food', badge: 'NEW', views: 3456 },
      { id: '4', title: 'సంక్రాంతి స్పెషల్', titleEn: 'Sankranti Specials', imageUrl: 'https://picsum.photos/seed/food4/400/300', href: '/category/food', views: 2345 },
      { id: '5', title: 'స్ట్రీట్ ఫుడ్ హైదరాబాద్', titleEn: 'Street Food Hyderabad', imageUrl: 'https://picsum.photos/seed/food5/400/300', href: '/category/food', views: 1987 },
      { id: '6', title: 'సమ్మర్ కూల్ డ్రింక్స్', titleEn: 'Summer Cool Drinks', imageUrl: 'https://picsum.photos/seed/food6/400/300', href: '/category/food', views: 1654 },
    ],
    lifestyle: [
      { id: '1', title: 'మోడర్న్ ఇంటీరియర్ ట్రెండ్స్', titleEn: 'Modern Interior Trends', imageUrl: 'https://picsum.photos/seed/life1/400/300', href: '/category/lifestyle', badge: 'NEW', views: 3456 },
      { id: '2', title: 'ఫ్యాషన్ వీక్ హైలైట్స్', titleEn: 'Fashion Week Highlights', imageUrl: 'https://picsum.photos/seed/life2/400/300', href: '/category/lifestyle', views: 2987 },
      { id: '3', title: 'ట్రావెల్ గైడ్ 2024', titleEn: 'Travel Guide 2024', imageUrl: 'https://picsum.photos/seed/life3/400/300', href: '/category/lifestyle', badge: 'HOT', views: 4567 },
      { id: '4', title: 'హోమ్ డెకర్ ఐడియాస్', titleEn: 'Home Decor Ideas', imageUrl: 'https://picsum.photos/seed/life4/400/300', href: '/category/lifestyle', views: 2345 },
      { id: '5', title: 'వెడ్డింగ్ ప్లానింగ్', titleEn: 'Wedding Planning Tips', imageUrl: 'https://picsum.photos/seed/life5/400/300', href: '/category/lifestyle', views: 1987 },
      { id: '6', title: 'బ్యూటీ టిప్స్', titleEn: 'Beauty Tips', imageUrl: 'https://picsum.photos/seed/life6/400/300', href: '/category/lifestyle', views: 1654 },
    ],
  };

  return sampleData[sectionId]?.slice(0, count) || [];
}

export function SampleContentGrid({
  sectionId,
  items,
  emptyMessage = 'కంటెంట్ త్వరలో వస్తుంది',
  emptyMessageEn = 'Content coming soon',
  showAsFeatured = true,
}: SampleContentGridProps) {
  const { lang, isEnglish } = useLanguage();
  const meta = getCategoryMeta(sectionId);

  if (items.length === 0) {
    return (
      <div 
        className="text-center py-12 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        <div className="text-6xl mb-4">{meta.icon}</div>
        <h2 
          className={`text-xl font-bold mb-2 ${isEnglish ? 'font-heading' : ''}`}
          style={{ color: 'var(--text-primary)' }}
        >
          {isEnglish ? emptyMessageEn : emptyMessage}
        </h2>
        <p style={{ color: 'var(--text-tertiary)' }}>
          {isEnglish ? 'Stay tuned for updates!' : 'అప్‌డేట్స్ కోసం చూస్తుండండి!'}
        </p>
      </div>
    );
  }

  const featuredItem = items[0];
  const regularItems = items.slice(1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Featured Item */}
      {showAsFeatured && featuredItem && (
        <Link
          href={featuredItem.href}
          className="block group rounded-xl overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
        >
          <div className="relative aspect-video overflow-hidden">
            <img
              src={featuredItem.imageUrl}
              alt={isEnglish ? featuredItem.titleEn : featuredItem.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
            {featuredItem.badge && (
              <span 
                className="absolute top-3 left-3 px-2 py-1 text-xs font-bold rounded"
                style={{ 
                  background: featuredItem.badge === 'HOT' || featuredItem.badge === 'VIRAL' 
                    ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                    : 'linear-gradient(135deg, #10b981, #059669)',
                  color: 'white',
                }}
              >
                {featuredItem.badge}
              </span>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 
                className={`text-xl sm:text-2xl font-bold text-white mb-2 ${isEnglish ? 'font-heading' : ''}`}
              >
                {isEnglish ? featuredItem.titleEn : featuredItem.title}
              </h2>
              <div className="flex items-center gap-4 text-white/70 text-sm">
                {featuredItem.views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {featuredItem.views.toLocaleString()}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {isEnglish ? '2 hours ago' : '2 గంటల క్రితం'}
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Stats Bar */}
      <div 
        className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
      >
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {isEnglish ? 'Total' : 'మొత్తం'}{' '}
          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{items.length}</span>{' '}
          {isEnglish ? 'items' : 'అంశాలు'}
        </span>
        <span className="flex items-center gap-1 text-sm" style={{ color: meta.color }}>
          <TrendingUp className="w-4 h-4" />
          {isEnglish ? 'Trending' : 'ట్రెండింగ్'}
        </span>
      </div>

      {/* Regular Items Grid */}
      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {regularItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group rounded-xl overflow-hidden transition-transform hover:scale-102"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={item.imageUrl}
                alt={isEnglish ? item.titleEn : item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {item.badge && (
                <span 
                  className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold rounded"
                  style={{ 
                    background: item.badge === 'HOT' || item.badge === 'VIRAL' 
                      ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                      : 'linear-gradient(135deg, #10b981, #059669)',
                    color: 'white',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 
                className={`font-medium text-sm line-clamp-2 group-hover:text-[${meta.color}] transition-colors ${isEnglish ? 'font-body' : ''}`}
                style={{ color: 'var(--text-primary)' }}
              >
                {isEnglish ? item.titleEn : item.title}
              </h3>
              {item.views && (
                <span className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <Eye className="w-3 h-3" />
                  {item.views.toLocaleString()}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Load More Button */}
      {items.length >= 6 && (
        <div className="text-center pt-4">
          <button 
            className={`px-6 py-3 rounded-lg font-medium transition-all hover:scale-105 ${isEnglish ? 'font-body' : ''}`}
            style={{ 
              background: 'var(--bg-tertiary)', 
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
            }}
          >
            {isEnglish ? 'Load More →' : 'మరిన్ని చూడండి →'}
          </button>
        </div>
      )}
    </div>
  );
}

export default SampleContentGrid;

