import * as fs from 'fs';

// Based on user's detailed research, categorize movies by type
const movieCategories = {
  // TRUE Telugu Original Films (should be added)
  teluguOriginals: [
    { actor: 'ali', title: 'Puli', year: 2010, notes: 'Telugu film, Pawan Kalyan hero' },
    { actor: 'ali', title: 'New', year: 2004, notes: 'Telugu version, S. J. Suryah film' },
    { actor: 'ali', title: 'Namo Bhootatma', year: 2014, notes: 'Telugu film' },
    { actor: 'chandra mohan', title: 'Duvvada Jagannadham', year: 2017, notes: 'Telugu film, Allu Arjun' },
    { actor: 'geetha', title: 'Racha', year: 2012, notes: 'Telugu film, Ram Charan' },
    { actor: 'geetha', title: '180', year: 2011, notes: 'Telugu-Tamil bilingual, Siddharth' },
    { actor: 'jagapathi babu', title: 'Gangstars', year: 2018, notes: 'Telugu Web Series' },
    { actor: 'mohan babu', title: 'Sri', year: 2005, notes: 'Telugu film, Manchu Manoj debut' },
    { actor: 'mohan babu', title: 'Saleem', year: 2009, notes: 'Telugu film, Vishnu Manchu LEAD (not supporting!)' },
    { actor: 'pawan kalyan', title: 'Hari Hara Veera Mallu: Part 1', year: 2025, notes: 'Telugu film, Pawan Kalyan lead' },
    { actor: 'ravi teja', title: 'Sambho Siva Sambho', year: 2010, notes: 'Telugu film' },
    { actor: 'ravi teja', title: 'Awe', year: 2018, notes: 'Telugu film, voice-over role' },
    { actor: 'rohit', title: 'RAM', year: 2024, notes: 'Telugu film' },
    { actor: 'sumanth', title: 'Malli Raava', year: 2017, notes: 'Telugu film, Sumanth lead' },
    { actor: 'sunil', title: 'Balu ABCDEFG', year: 2005, notes: 'Telugu film, Pawan Kalyan' },
    { actor: 'varun sandesh', title: 'Nuvvu Thopu Raa', year: 2019, notes: 'Telugu film, cameo' },
    { actor: 'venu', title: 'Bahumati', year: 2007, notes: 'Telugu film, Venu lead' },
    { actor: 'venu', title: 'Ramachari', year: 2013, notes: 'Telugu film, Venu lead' },
    { actor: 'satyanarayana', title: 'Yamagola Malli Modalayindi', year: 2007, notes: 'Telugu film' },
  ],
  
  // Telugu Dubs of Tamil/Malayalam/Hindi films (decide: add or skip?)
  teluguDubs: [
    { actor: 'ali', title: 'Mufasa: The Lion King', year: 2024, original: 'English', notes: 'Telugu dub, Ali voiced Timon' },
    { actor: 'ali', title: 'Total Dhamaal', year: 2019, original: 'Hindi', notes: 'Telugu dub voice-over' },
    { actor: 'brahmanandam', title: 'Saroja', year: 2008, original: 'Tamil', notes: 'Tamil film, Telugu dub' },
    { actor: 'brahmanandam', title: 'Vaalu', year: 2015, original: 'Tamil', notes: 'Tamil film, Telugu dub' },
    { actor: 'geetha', title: 'Unakkum Enakkum', year: 2006, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'geetha', title: 'Thoranai', year: 2009, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'geetha', title: 'Zachariayude Garbhinikal', year: 2013, original: 'Malayalam', notes: 'Malayalam film' },
    { actor: 'geetha', title: 'Djibouti', year: 2021, original: 'Malayalam', notes: 'Malayalam film' },
    { actor: 'karthik', title: 'Thee Ivan', year: 2023, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'karthik', title: 'Andhagan', year: 2024, original: 'Tamil', notes: 'Tamil film, guest' },
    { actor: 'karthik', title: 'Maanja Velu', year: 2010, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'latha', title: 'Kandha Kadamba Kathir Vela', year: 2000, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'latha', title: 'Kusthi', year: 2006, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'prakash raj', title: 'Paramasivan', year: 2006, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'prakash raj', title: 'Bheemaa', year: 2008, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'prakash raj', title: 'Un Samayal Arayil', year: 2014, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'rambha', title: 'Sudhandhiram', year: 2000, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'rambha', title: 'Military', year: 2003, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'rambha', title: 'Chronic Bachelor', year: 2003, original: 'Malayalam', notes: 'Malayalam film' },
    { actor: 'sarath babu', title: 'Anbu', year: 2003, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'sarath babu', title: 'Arul', year: 2004, original: 'Tamil', notes: 'Tamil film' },
    { actor: 'sunil', title: 'Turbo', year: 2024, original: 'Malayalam', notes: 'Malayalam film' },
    { actor: 'tarun', title: 'Anukoni Athidhi', year: 2020, original: 'Malayalam', notes: 'Telugu dub voice for Athiran' },
    { actor: 'ravi teja', title: 'Mahaveerudu', year: 2023, original: 'Tamil', notes: 'Telugu dub of Maaveeran' },
  ],
  
  // Hindi/English films (should skip for Telugu portal)
  nonSouthIndian: [
    { actor: 'amala', title: 'Listen... Amaya', year: 2013, language: 'Hindi', notes: 'Hindi film' },
    { actor: 'amala', title: 'Hamari Adhuri Kahani', year: 2015, language: 'Hindi', notes: 'Hindi film, cameo' },
    { actor: 'amala', title: 'Tumse Na Ho Payega', year: 2023, language: 'Hindi', notes: 'Hindi web series' },
    { actor: 'rambha', title: 'Kyo Kii... Main Jhuth Nahin Bolta', year: 2001, language: 'Hindi', notes: 'Hindi film' },
    { actor: 'sharada', title: 'Yaar Meri Zindagi', year: 2008, language: 'Hindi', notes: 'Hindi film (1971 release)' },
  ],
  
  // Web Series / TV Shows (decide separately)
  webSeriesTV: [
    { actor: 'amala', title: 'High Priestess', year: 2019, type: 'Web Series', notes: 'Telugu web series' },
    { actor: 'jagapathi babu', title: 'Gangstars', year: 2018, type: 'Web Series', notes: 'Telugu web series' },
    { actor: 'prakash raj', title: 'Ekam', year: 2024, type: 'Web Series', notes: 'Kannada web series' },
    { actor: 'simran', title: 'Paava Kadhaigal', year: 2020, type: 'Web Series', notes: 'Tamil Netflix anthology' },
    { actor: 'simran', title: 'Gulmohar', year: 2023, type: 'Web Film', notes: 'Hindi Hotstar film' },
    { actor: 'simran', title: 'Citadel: Honey Bunny', year: 2024, type: 'Web Series', notes: 'Hindi Prime series' },
    { actor: 'rambha', title: 'Dhee Ultimate Dance Show', year: 2011, type: 'TV Show', notes: 'Reality show judge' },
    { actor: 'vishnu', title: 'Chadarangam', year: 2020, type: 'Web Series', notes: 'Telugu ZEE5, Vishnu is PRODUCER' },
  ],
  
  // Data corrections needed
  corrections: [
    { issue: 'Vishnu Manchu in Saleem (2009) is LEAD HERO, not supporting' },
    { issue: 'Vishnu Manchu in Chadarangam (2020) is PRODUCER, not cast' },
    { issue: 'Many Prakash Raj films are Tamil where he is lead/producer' },
    { issue: 'K. Balachander films are mostly Tamil' },
  ]
};

// Generate analysis report
const analysis = {
  teluguOriginals: movieCategories.teluguOriginals.length,
  teluguDubs: movieCategories.teluguDubs.length,
  nonSouthIndian: movieCategories.nonSouthIndian.length,
  webSeriesTV: movieCategories.webSeriesTV.length,
  total: 151
};

console.log('\n═══ FILTERED ANALYSIS BASED ON USER RESEARCH ═══\n');

console.log('Original List: 151 movies');
console.log('\nAfter Filtering:\n');

console.log(`✅ Telugu Original Films:     ${analysis.teluguOriginals} movies`);
console.log(`   → Should definitely add to database\n`);

console.log(`🎬 Telugu Dubs (Tamil/Mal):   ${analysis.teluguDubs} movies`);
console.log(`   → Decision needed: Add dubbed versions?\n`);

console.log(`❌ Hindi/English Films:       ${analysis.nonSouthIndian} movies`);
console.log(`   → Skip: Not relevant for Telugu portal\n`);

console.log(`📺 Web Series/TV Shows:       ${analysis.webSeriesTV} movies`);
console.log(`   → Decision needed: Add web content?\n`);

console.log(`\n═══ RECOMMENDATIONS ═══\n`);

console.log(`Priority 1: Add ${analysis.teluguOriginals} Telugu Original Films`);
console.log(`  - These are true Telugu cinema productions`);
console.log(`  - Includes recent releases (Hari Hara Veera Mallu, RAM)\n`);

console.log(`Priority 2: Consider ${movieCategories.webSeriesTV.filter(w => w.notes.includes('Telugu')).length} Telugu Web Series`);
console.log(`  - High Priestess (2019), Gangstars (2018)\n`);

console.log(`Skip: ${analysis.nonSouthIndian} Hindi films + ${analysis.teluguDubs} Tamil/Malayalam films`);
console.log(`  - Unless you want dubbed versions for completeness\n`);

// Save refined list
const teluguOnlyCSV = [
  'Actor,Title,Year,Type,Notes',
  ...movieCategories.teluguOriginals.map(m => 
    `"${m.actor}","${m.title}",${m.year},"Telugu Original","${m.notes}"`
  )
].join('\n');

fs.writeFileSync('TELUGU-ORIGINALS-ONLY.csv', teluguOnlyCSV);

console.log(`\n✓ Created: TELUGU-ORIGINALS-ONLY.csv (${analysis.teluguOriginals} movies)\n`);

// Detailed breakdown
console.log(`\n═══ DETAILED BREAKDOWN ═══\n`);

console.log('Telugu Original Films to Add:\n');
movieCategories.teluguOriginals.forEach((m, i) => {
  console.log(`${i+1}. ${m.title} (${m.year}) - ${m.actor}`);
  console.log(`   ${m.notes}\n`);
});

console.log(`\n═══ REALISTIC GOAL ═══\n`);
console.log(`Instead of 151 movies → Focus on ${analysis.teluguOriginals} TRUE Telugu films`);
console.log(`This is a realistic, quality-focused approach!\n`);
