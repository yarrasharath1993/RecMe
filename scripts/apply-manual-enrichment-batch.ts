import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MovieUpdate {
  id: string;
  title?: string;
  year?: number;
  hero?: string;
  director?: string;
  rating?: number;
  synopsis?: string;
  language?: string;
  shouldPublish: boolean;
  notes: string;
}

// All corrections from user's manual review
const corrections: MovieUpdate[] = [
  // ===== PHASE 1: EXCELLENT MOVIES (3) =====
  {
    id: '340635c8-f4a4-410e-aa3f-ed1ba3f314f3',
    title: 'Jayammu Nischayammu Raa',
    year: 2016,
    hero: 'Srinivasa Reddy',
    director: 'Shiva Raj Kanumuri',
    rating: 7.0,
    synopsis: 'A naive government employee tries to win his lady love while struggling for a transfer to his native village, leading to comedic office politics.',
    shouldPublish: true,
    notes: 'Rating and synopsis added',
  },
  {
    id: 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e',
    title: 'Kothala Raayudu',
    year: 1979,
    hero: 'Chiranjeevi',
    director: 'K. Vasu',
    rating: 6.8,
    synopsis: 'Satyam is an innocent man who gets framed for a crime. He must prove his innocence and fight against injustice in this early Chiranjeevi hit.',
    shouldPublish: true,
    notes: 'Wikidata ID Q12985478 resolved',
  },
  {
    id: '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31',
    title: 'Karunamayudu',
    year: 1978,
    hero: 'Vijayachander',
    director: 'A. Bhimsingh',
    rating: 8.0,
    synopsis: 'A biographical epic depicting the life and ministry of Jesus Christ, focusing on his message of love and compassion. Nandi Award winner.',
    shouldPublish: true,
    notes: 'Wikidata ID Q16311395 resolved',
  },
  
  // ===== PHASE 2: GOOD MOVIES (9) =====
  {
    id: '9b7b604c-6907-4c79-bd7f-dd22d1a3f974',
    title: 'Devara: Part 2',
    year: 2026,
    hero: 'N. T. Rama Rao Jr.',
    director: 'Koratala Siva',
    rating: 7.5,
    synopsis: 'The high-octane sequel explores the power struggles within the coastal town following the events of Part 1, diving deeper into Deva\'s legacy.',
    shouldPublish: false, // Unreleased
    notes: 'Upcoming release, rating TBD',
  },
  {
    id: '27baa242-d2e1-44fb-b08e-30d39a95e688',
    title: 'Mental (Appatlo Okadundevadu)',
    year: 2016,
    synopsis: 'A gripping narrative focusing on the clashes between a young man and a controversial cop in 90s Hyderabad, exploring systemic corruption.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: '01a6f455-21ba-4559-be6d-0df444d63a12',
    title: 'Bhale Mogudu Bhale Pellam',
    year: 2011,
    synopsis: 'A middle-class man\'s life turns upside down when his wife becomes an overnight singing sensation, leading to hilarious domestic chaos.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: 'bb35eb63-49c4-42aa-a405-7ca08b8a813d',
    title: 'Betting Bangaraju',
    year: 2010,
    synopsis: 'A small-town local cricket bookie falls in love, but his betting habit gets him into a mess he struggles to escape from.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: '5e4052c0-9936-4bc9-9284-5adf79dcf4f4',
    title: 'Shubhapradam',
    year: 2010,
    synopsis: 'A cultural family drama directed by K. Viswanath, emphasizing traditional values, music, and the arts in Telugu culture.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: '5d32087c-cf2b-460d-9ee7-fa8b793758b6',
    title: 'Vikramarkudu',
    year: 2005,
    synopsis: 'A small-time thief impersonates a fearless police officer to protect the cop\'s daughter from vengeful criminals in this S.S. Rajamouli blockbuster.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: '3add2312-7681-4325-ab02-762a78da7a70',
    title: 'Swayam Krushi',
    year: 1987,
    synopsis: 'A launderman\'s journey from poverty to respectability through hard work and determination, highlighting social dignity of labor. K. Viswanath masterpiece.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: 'd60b0106-384b-4f9e-99b8-d959bb22ca1b',
    title: 'Sita Rama Kalyanam',
    year: 1986,
    synopsis: 'A traditional family drama centered around the intricacies of a marriage ceremony and relationships, directed by Jandhyala.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  {
    id: 'c0b08b22-73ed-4160-9064-4a5992f4df80',
    title: 'Poola Rangadu',
    year: 1967,
    synopsis: 'A classic story of family values, love, and sacrifice, starring ANR and Jamuna in the lead roles. Adurthi Subba Rao classic.',
    shouldPublish: true,
    notes: 'Poster and synopsis added',
  },
  
  // ===== PHASE 3: NEEDS HERO BATCH =====
  {
    id: 'db21f9c6-c5f3-4627-beb2-f3bbf0a5d6b6',
    title: 'Iddaru Attala Muddula Alludu',
    year: 2006,
    hero: 'Rajendra Prasad',
    director: 'Dev Anand',
    rating: 4.8,
    synopsis: 'A comedy of errors involving a man caught between his two mothers-in-law and their constant bickering.',
    shouldPublish: true,
    notes: 'Hero and rating added',
  },
  {
    id: '989898cd-a0f3-4fd2-bb7a-88d1dc19ed8c',
    title: 'Apparao Driving School',
    year: 2004,
    hero: 'Rajendra Prasad',
    director: 'Anji Seenu',
    rating: 5.5,
    synopsis: 'Apparao runs a driving school for women, leading to various comedic situations and romantic tangles.',
    shouldPublish: true,
    notes: 'Hero and rating added',
  },
  {
    id: '472cd7ac-09b8-45d8-8d05-59eaef7a3fc2',
    title: 'Vamsoddarakudu',
    year: 2000,
    hero: 'Balakrishna',
    director: 'Sarath',
    rating: 6.4,
    synopsis: 'An action drama where the protagonist fights to protect his family\'s honor and the village welfare.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: 'f98d0da0-f43e-459a-9a1f-79cc70e65668',
    title: 'Sakutumba Saparivaara Sametham',
    year: 2000,
    hero: 'Srikanth',
    director: 'S. V. Krishna Reddy',
    rating: 6.7,
    synopsis: 'A wholesome family entertainer revolving around the bond of a joint family and marriage values.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: '92f362e2-a50c-442d-a9bc-fc80b9b23c9e',
    title: 'Preyasi Rave',
    year: 1999,
    hero: 'Srikanth',
    director: 'Chandra Mahesh',
    rating: 6.5,
    synopsis: 'A romantic drama about a man\'s selfless love and the sacrifices he makes for his beloved\'s happiness.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: '6c6049b4-9e2d-4fe2-a1ed-6a42eab7ce0c',
    title: 'Aayanagaru',
    year: 1998,
    hero: 'Srikanth',
    director: 'Nagendra Magapu',
    rating: 5.6,
    synopsis: 'A family comedy involving domestic misunderstandings and a husband\'s attempt to balance relations.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: 'e34501c2-31f2-4aa7-bb05-9f5e1f6fa464',
    title: 'Egire Pavuramaa',
    year: 1997,
    hero: 'Srikanth',
    director: 'S. V. Krishna Reddy',
    rating: 7.2,
    synopsis: 'A musical hit about a young woman whose life changes when two men enter her life with different intentions.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: '4a8ce48e-7d16-4e95-b83c-95bc4fc61f9e',
    title: 'Topi Raja Sweety Roja',
    year: 1996,
    hero: 'Rajendra Prasad',
    director: 'Dr. N. Shiva Prasad',
    rating: 5.2,
    synopsis: 'A slapstick comedy featuring the misadventures of a local trickster and his romantic interests.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: '7db074ed-6b8c-4a53-875c-c5a66b7aa326',
    title: 'Akarshan',
    year: 1988,
    hero: 'Rajani',
    director: 'Tanvir Ahmed',
    rating: 6.0,
    synopsis: 'A romantic thriller exploring the psychological pull and consequences of an intense attraction.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: 'bc76e5d6-a52b-407f-9e27-0d2cdb34729a',
    title: 'Padaharella Ammayi',
    year: 1986,
    hero: 'Rajendra Prasad',
    director: 'P.S.K.M. Reddy',
    rating: 5.8,
    synopsis: 'A social drama following the life of a young girl navigating the challenges of rural society.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: 'f2c50adc-f2da-4cc7-b34a-2be8906cb80d',
    title: 'Meghasandesham',
    year: 1982,
    hero: 'Akkineni Nageswara Rao',
    director: 'Dasari Narayana Rao',
    rating: 8.4,
    synopsis: 'A lyrical masterpiece about a poet\'s platonic love and his tragic descent into loneliness. Award-winning classic.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: '781733fd-1fa9-4fa7-b54f-09c5ebd40df5',
    title: 'Talli Kodukula Anubandham',
    year: 1982,
    hero: 'Krishnam Raju',
    director: 'K. S. R. Das',
    rating: 6.6,
    synopsis: 'A high-octane action drama focusing on the unbreakable emotional bond between a mother and her son.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: 'ac2d1fc7-1fdd-4dc5-9eea-87f3a9c1f29e',
    title: 'Trishulam',
    year: 1982,
    hero: 'Krishnam Raju',
    director: 'K. Raghavendra Rao',
    rating: 7.8,
    synopsis: 'A social revolutionary drama where the hero fights against caste discrimination and local tyranny.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  {
    id: '1148f7b0-5e1e-478a-9532-39f71a9b73f3',
    title: 'Madhura Swapnam',
    year: 1982,
    hero: 'Krishnam Raju',
    director: 'K. Raghavendra Rao',
    rating: 6.9,
    synopsis: 'A romantic drama centered on dream-like aspirations and the harsh realities of love and sacrifice.',
    shouldPublish: true,
    notes: 'Hero added',
  },
  
  // ===== PHASE 4: NEEDS DIRECTOR BATCH =====
  {
    id: '863af758-e5be-4b4e-8ff3-e7c2bb0db06e',
    title: 'Time Pass',
    year: 2001,
    hero: 'Ajay Kumar',
    director: 'Pratap Pothan',
    rating: 4.8,
    synopsis: 'A romantic comedy dealing with the casual relationships and "time pass" culture of urban youth in the early 2000s.',
    shouldPublish: true,
    notes: 'Director added',
  },
  {
    id: 'da081ef8-5a7b-4816-8eaf-0cf9aba75603',
    title: 'Sardar',
    year: 1984,
    hero: 'Krishnam Raju',
    director: 'N. Sambasiva Rao',
    rating: 6.2,
    synopsis: 'A powerful action drama where a sincere man takes on the local goons and a corrupt system to protect his village.',
    shouldPublish: true,
    notes: 'Director added',
  },
  {
    id: '5cb4baa8-d2b5-49e3-90b5-e86b7bd0efb7',
    title: 'Bala Mitrula Katha',
    year: 1972,
    hero: 'Jaggayya',
    director: 'K. Varaprasada Rao',
    rating: 7.0,
    synopsis: 'A heartwarming story of two children from different social backgrounds whose deep friendship challenges societal norms.',
    shouldPublish: true,
    notes: 'Hero and director corrected',
  },
  {
    id: 'c8aa63d8-5ad3-46ee-8857-5f54e3ae1b3e',
    title: 'Sri Krishna Satya',
    year: 1971,
    hero: 'N. T. Rama Rao',
    director: 'N. T. Rama Rao',
    rating: 7.8,
    synopsis: 'A mythological epic focusing on Lord Krishna\'s divine journey and miracles, directed by and starring NTR.',
    shouldPublish: true,
    notes: 'Director confirmed',
  },
  {
    id: '9e11ff8a-c6e8-4bd4-a7a7-ef42dc5e86f5',
    title: 'Kalyana Mandapam',
    year: 1971,
    hero: 'Sobhan Babu',
    director: 'V. Madhusudhan Rao',
    rating: 6.9,
    synopsis: 'A romantic drama about a young man and woman overcoming familial obstacles to unite in marriage.',
    shouldPublish: true,
    notes: 'Hero and director added',
  },
  {
    id: 'b7d08f6c-91f0-4d13-89d3-ca1866ea6c50',
    title: 'Varakatnam',
    year: 1969,
    hero: 'N. T. Rama Rao',
    director: 'N. T. Rama Rao',
    rating: 7.6,
    synopsis: 'A national award-winning social drama addressing the evil of dowry in society. NTR\'s self-directed masterpiece.',
    shouldPublish: true,
    notes: 'Director confirmed',
  },
  {
    id: 'fbe0f570-5ec9-4bb5-9e37-5a313b050d28',
    title: 'Andaru Dongale',
    year: 1974,
    hero: 'Sobhan Babu',
    director: 'V. B. Rajendra Prasad',
    rating: 7.3,
    synopsis: 'A classic comedy-drama about a man who uses wit to outsmart a group of local swindlers.',
    shouldPublish: true,
    notes: 'Hero corrected to Sobhan Babu',
  },
];

// Language reclassifications (Hindi/Tamil films)
const languageReclassifications: Array<{id: string, title: string, year: number, newLanguage: string}> = [
  // Hindi films
  { id: 'd5ed3fbc-b4c0-4ef6-9e63-c35ef6af8d33', title: 'Sapnon Ka Mandir', year: 1991, newLanguage: 'Hindi' },
  { id: 'da081ef8-5a7b-4816-8eaf-0cf9aba75603', title: 'Main Awara Hoon', year: 1983, newLanguage: 'Hindi' },
  { id: 'c2ffd847-30f4-40f4-bec8-45f2f37c0e26', title: 'Ganga Ki Lahren', year: 1964, newLanguage: 'Hindi' },
  
  // Tamil films
  { id: '3a001ec1-4868-4f36-a4cc-ca97c2b84c9f', title: 'Kottai Mariamman', year: 2002, newLanguage: 'Tamil' },
  { id: 'e1b18d54-23c3-4e13-8d3f-6aae1d8daa7c', title: 'Doni Sagali', year: 1998, newLanguage: 'Kannada' },
  { id: '3ab71ec3-c59b-4d9c-aff4-85c56ca12c93', title: 'Jai Bajarangbali', year: 1997, newLanguage: 'Tamil' },
  { id: 'ab227e5a-6151-4fff-a9b3-faef4d83d0dc', title: 'Inimai Idho Idho', year: 1983, newLanguage: 'Tamil' },
  { id: '8be8fbf2-fa6a-48d7-92ed-a66bfeafe5be', title: 'Unnai Suttrum Ulagam', year: 1977, newLanguage: 'Tamil' },
  { id: 'bf98c8aa-7fdb-4b17-bb2d-4f5bd7acb92f', title: 'Chuzhi', year: 1973, newLanguage: 'Malayalam' },
  { id: '53565e17-6e61-4d0c-b825-2a52ad69abca', title: 'Sabadham', year: 1971, newLanguage: 'Tamil' },
  { id: '4d653c28-05fa-48a8-a0d4-5f01488a3f20', title: 'Sabarimala S. Dharmasastha', year: 1970, newLanguage: 'Malayalam' },
  { id: '16930c4f-c1c1-4aa0-bcd6-afaca30ed88c', title: 'Thunaivan', year: 1969, newLanguage: 'Tamil' },
  { id: '0767ac6c-d8da-47c8-8db6-51e5bb90929e', title: 'Vallavanukku Vallavan', year: 1965, newLanguage: 'Tamil' },
];

async function applyManualEnrichment() {
  console.log('\n' + '='.repeat(80));
  console.log('🎨 APPLYING MANUAL ENRICHMENT FROM USER REVIEW');
  console.log('='.repeat(80) + '\n');
  
  const results = {
    updated: [] as string[],
    published: [] as string[],
    reclassified: [] as string[],
    errors: [] as {title: string, error: string}[],
  };
  
  // Process corrections
  console.log(`📝 Processing ${corrections.length} movie corrections...\n`);
  
  for (const correction of corrections) {
    console.log(`\n🎬 ${correction.title || 'Updating'} (${correction.year})`);
    console.log(`   Notes: ${correction.notes}`);
    
    try {
      const updates: any = {};
      
      if (correction.title) updates.title_en = correction.title;
      if (correction.hero) updates.hero = correction.hero;
      if (correction.director) updates.director = correction.director;
      if (correction.rating) updates.our_rating = correction.rating;
      if (correction.synopsis) updates.synopsis = correction.synopsis;
      if (correction.shouldPublish && correction.year <= 2025) updates.is_published = true;
      
      const { error } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', correction.id);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push({ title: correction.title || correction.id, error: error.message });
        continue;
      }
      
      console.log(`   ✅ Updated!`);
      results.updated.push(correction.title || correction.id);
      
      if (correction.shouldPublish && correction.year <= 2025) {
        console.log(`   ✅ Published!`);
        results.published.push(correction.title || correction.id);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title || correction.id, error: String(error) });
    }
  }
  
  // Process language reclassifications
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`🌐 Processing ${languageReclassifications.length} language reclassifications...\n`);
  
  for (const reclass of languageReclassifications) {
    console.log(`\n🌐 ${reclass.title} (${reclass.year}) → ${reclass.newLanguage}`);
    
    try {
      const { error } = await supabase
        .from('movies')
        .update({ language: reclass.newLanguage })
        .eq('id', reclass.id);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.errors.push({ title: reclass.title, error: error.message });
        continue;
      }
      
      console.log(`   ✅ Reclassified to ${reclass.newLanguage}`);
      results.reclassified.push(reclass.title);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: reclass.title, error: String(error) });
    }
  }
  
  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Movies Updated: ${results.updated.length}`);
  console.log(`📢 Movies Published: ${results.published.length}`);
  console.log(`🌐 Movies Reclassified: ${results.reclassified.length}`);
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.slice(0, 5).forEach(e => console.log(`   - ${e.title}: ${e.error}`));
  }
  
  // Get updated counts
  const { count: teluguPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const { count: teluguUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  console.log('\n' + '='.repeat(80));
  console.log('📈 DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published:    ${teluguPublished?.toLocaleString()}`);
  console.log(`Telugu Unpublished:  ${teluguUnpublished?.toLocaleString()}`);
  console.log('='.repeat(80));
  
  return results;
}

applyManualEnrichment()
  .then((results) => {
    console.log('\n✅ Manual enrichment complete!');
    console.log(`\n🎉 ${results.published.length} movies published!`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
