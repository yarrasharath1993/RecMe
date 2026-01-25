import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Synopsis for important films
const MOVIE_SYNOPSIS: Record<string, { title: string; year: number; synopsis: string }> = {
  // Classic Films
  'Devadasu': { title: 'Devadasu', year: 1953, synopsis: 'A timeless tragic romance based on Sarat Chandra Chattopadhyay\'s novel. Devadasu, a wealthy landlord\'s son, falls in love with his childhood sweetheart Parvathi, but is forced to abandon her due to class differences. Unable to cope with the separation, he spirals into alcoholism and self-destruction. ANR\'s legendary performance as the heartbroken lover remains iconic.' },
  'Paradesi': { title: 'Paradesi', year: 1953, synopsis: 'A touching drama about a young man who leaves his village to seek fortune in the city. The film explores themes of displacement, identity, and the harsh realities faced by migrants. ANR delivers a memorable performance in this socially relevant classic.' },
  'Sangham': { title: 'Sangham', year: 1954, synopsis: 'A romantic comedy-drama featuring the legendary pair of NTR and Bhanumathi. The film showcases their exceptional chemistry and comedic timing, becoming one of the most beloved films of the golden era.' },
  'Chintamani': { title: 'Chintamani', year: 1956, synopsis: 'A dramatic tale featuring NTR with Bhanumathi and Jamuna. The film explores complex relationships and moral dilemmas, showcasing the acting prowess of the golden era legends.' },
  'Sati Anasuya': { title: 'Sati Anasuya', year: 1957, synopsis: 'A mythological drama depicting the story of Anasuya, the devoted wife known for her chastity and purity. NTR and Anjali Devi bring this ancient tale to life with their powerful performances.' },
  'Rakta Sambandham': { title: 'Rakta Sambandham', year: 1962, synopsis: 'A family drama exploring the bonds of blood relationships and the conflicts that arise within families. The film deals with themes of sacrifice, duty, and familial love.' },
  'Naadi Aada Janme': { title: 'Naadi Aada Janme', year: 1965, synopsis: 'A dramatic film featuring NTR and Savitri that explores themes of fate, destiny, and the eternal bond between souls across lifetimes. A memorable collaboration between two legends.' },
  'Leta Manasulu': { title: 'Leta Manasulu', year: 1966, synopsis: 'A poignant drama exploring the tender emotions of young hearts. The film delicately portrays the innocence of first love and the complexities of human relationships.' },
  'Shakuntala': { title: 'Shakuntala', year: 1966, synopsis: 'A magnificent mythological drama based on Kalidasa\'s famous play. NTR as King Dushyanta and Saroja Devi as Shakuntala bring this timeless love story to the silver screen with grandeur.' },
  'Sakshi': { title: 'Sakshi', year: 1967, synopsis: 'A gripping thriller directed by Bapu, featuring Krishna and Vanisri. The film is known for its suspenseful narrative and unexpected twists, establishing Bapu as a master storyteller.' },
  
  // 70s-80s Films
  'Magaadu': { title: 'Magaadu', year: 1976, synopsis: 'An action-packed drama featuring NTR in a powerful role. The film showcases his commanding screen presence and became one of the popular mass entertainers of the era.' },
  'Chakradhari': { title: 'Chakradhari', year: 1977, synopsis: 'A devotional biographical film featuring ANR. The film explores spiritual themes and features memorable music, showcasing ANR\'s versatility as an actor.' },
  'Taxi Driver': { title: 'Taxi Driver', year: 1978, synopsis: 'An action drama featuring a young Sridevi alongside Jaishankar. The film follows the life of a taxi driver caught in circumstances beyond his control.' },
  'Sati Savitri': { title: 'Sati Savitri', year: 1978, synopsis: 'A mythological drama retelling the legendary story of Savitri who saved her husband Satyavan from the God of Death through her unwavering devotion and wisdom.' },
  '47 Rojulu': { title: '47 Rojulu', year: 1981, synopsis: 'A thriller directed by K. Balachander featuring Chiranjeevi and Jaya Prada. The film follows a gripping 47-day journey filled with suspense, drama, and unexpected turns.' },
  'Aadavaallu Meeku Joharlu': { title: 'Aadavaallu Meeku Joharlu', year: 1981, synopsis: 'A drama featuring Krishnam Raju and Jayasudha, directed by K. Balachander. The film explores gender dynamics and social themes with the director\'s signature style.' },
  'Ranuva Veeran': { title: 'Ranuva Veeran', year: 1981, synopsis: 'An action drama featuring the iconic Rajinikanth and Sridevi. The film showcases Rajinikanth\'s rising stardom and features thrilling action sequences.' },
  'Palletoori Monagadu': { title: 'Palletoori Monagadu', year: 1983, synopsis: 'A rural drama featuring Chiranjeevi in the role of a village youth. The film explores the simplicity and values of village life against urban influences.' },
  'Prema Pichollu': { title: 'Prema Pichollu', year: 1983, synopsis: 'A romantic drama featuring Chiranjeevi and Radhika. The film explores young love and its complications with a blend of romance and drama.' },
  'Bharya Bharthala Sawal': { title: 'Bharya Bharthala Sawal', year: 1983, synopsis: 'A family drama featuring Mohan Babu and Sumalatha that explores the dynamics of married life and the challenges couples face in their relationships.' },
  'Allulu Vasthunnaru': { title: 'Allulu Vasthunnaru', year: 1984, synopsis: 'A family entertainer featuring Chiranjeevi and Chandra Mohan. The film celebrates family bonds and traditional values with humor and heart.' },
  'Kotha Dampathulu': { title: 'Kotha Dampathulu', year: 1984, synopsis: 'A mystery drama featuring Naresh and Poornima. The film combines elements of suspense with family drama, keeping audiences engaged throughout.' },
  'Jwaala': { title: 'Jwaala', year: 1985, synopsis: 'An action-packed drama featuring Chiranjeevi in a fiery role. The film showcases his action prowess and established him as a leading action star.' },
  'Atmabhalam': { title: 'Atmabhalam', year: 1985, synopsis: 'A comedy drama featuring Balakrishna and Bhanupriya. The film blends humor with drama, showcasing the lighter side of the leading man.' },
  'Desoddarakudu': { title: 'Desoddarakudu', year: 1986, synopsis: 'An action drama featuring Balakrishna and Vijayashanti. The film deals with themes of patriotism and social justice.' },
  'Anasuyamma Gari Alludu': { title: 'Anasuyamma Gari Alludu', year: 1986, synopsis: 'A family comedy featuring Balakrishna. The film explores the humorous situations that arise when a young man tries to impress his prospective in-laws.' },
  'Seetarama Kalyanam': { title: 'Seetarama Kalyanam', year: 1986, synopsis: 'A romantic drama directed by Jandhyala featuring Balakrishna and Rajani. The film is known for its beautiful songs and the director\'s trademark humor.' },
  'Allari Krishnaiah': { title: 'Allari Krishnaiah', year: 1987, synopsis: 'A family drama featuring Balakrishna in the lead. The film explores family relationships and values with emotional depth.' },
  'President Gari Abbayi': { title: 'President Gari Abbayi', year: 1987, synopsis: 'A comedy drama featuring Balakrishna and Suhasini. The film follows the comedic situations arising from mistaken identities and family expectations.' },
  'Raktha Tilakam': { title: 'Raktha Tilakam', year: 1988, synopsis: 'An action drama marking Venkatesh\'s rise as an action hero. Directed by B. Gopal, the film features intense action sequences and a gripping storyline.' },
  'Rakthabishekam': { title: 'Rakthabishekam', year: 1988, synopsis: 'An action-packed drama featuring Balakrishna and Radha. Directed by A. Kodandarami Reddy, the film showcases powerful action sequences.' },
  'Mappillai': { title: 'Mappillai', year: 1989, synopsis: 'An action drama featuring Rajinikanth in one of his iconic roles. The film deals with family dynamics and features memorable dialogues and action sequences.' },
  'Hai Hai Nayaka': { title: 'Hai Hai Nayaka', year: 1989, synopsis: 'A comedy masterpiece directed by Jandhyala featuring Naresh. The film is celebrated for its witty dialogues and hilarious situations.' },
  'Mouna Poratam': { title: 'Mouna Poratam', year: 1989, synopsis: 'A drama featuring Karthik and Raadhika. The film explores themes of silent struggles and unspoken emotions in relationships.' },
  
  // 90s Films
  'Agni Sakshi': { title: 'Agni Sakshi', year: 1990, synopsis: 'A war drama directed by Ramesh Sippy featuring Jackie Shroff. The film explores the impact of war on individuals and families.' },
  'Iddaru Iddare': { title: 'Iddaru Iddare', year: 1990, synopsis: 'A family drama featuring Nagarjuna and Ramya Krishnan. The film explores relationships and family dynamics with emotional depth.' },
  'Police Bharya': { title: 'Police Bharya', year: 1990, synopsis: 'An action comedy featuring Naresh and Malashri. The film follows the life of a policeman and the challenges faced by his family.' },
  'Shanti Kranti': { title: 'Shanti Kranti', year: 1991, synopsis: 'A romantic action drama featuring Nagarjuna and Juhi Chawla. The film blends romance with action, showcasing Nagarjuna\'s charm.' },
  'Athiradhudu': { title: 'Athiradhudu', year: 1991, synopsis: 'A romantic drama featuring Bhanu Chander and Nirosha. The film explores themes of love and sacrifice.' },
  'Sarpayagam': { title: 'Sarpayagam', year: 1991, synopsis: 'A mythological drama featuring Sobhan Babu and Shobana. The film weaves mythology with drama in a compelling narrative.' },
  'Donga Police': { title: 'Donga Police', year: 1992, synopsis: 'An action comedy featuring Mohan Babu and Mamta Kulkarni. The film combines humor with thrilling action sequences.' },
  'Ghatothkachudu': { title: 'Ghatothkachudu', year: 1995, synopsis: 'A fantasy crime drama featuring Ali and Roja. The film combines mythological elements with a crime thriller narrative.' },
  'Akkada Ammayi Ikkada Abbayi': { title: 'Akkada Ammayi Ikkada Abbayi', year: 1996, synopsis: 'A romantic action film marking one of Pawan Kalyan\'s early appearances. The film features youthful romance and energetic action.' },
  'Sipayi': { title: 'Sipayi', year: 1996, synopsis: 'A musical action drama featuring V. Ravichandran and Soundarya. Known for its chartbuster music and stylish presentation.' },
  'Amma Durgamma': { title: 'Amma Durgamma', year: 1996, synopsis: 'A devotional fantasy film featuring Sasikumar and Ooha. The film explores the divine mother goddess theme with devotional fervor.' },
  'Aahwanam': { title: 'Aahwanam', year: 1997, synopsis: 'A romantic comedy directed by S.V. Krishna Reddy featuring Srikanth and Ramya Krishnan. Known for its humor and catchy music.' },
  'Suprabhatam': { title: 'Suprabhatam', year: 1998, synopsis: 'A drama comedy featuring Srikanth and Raasi. The film offers entertainment with its blend of drama and comedy.' },
  'Yuvaratna Raana': { title: 'Yuvaratna Raana', year: 1998, synopsis: 'A comedy featuring Balakrishna and Heera. Directed by A. Kodandarami Reddy, the film showcases Balakrishna\'s comic timing.' },
  'Rajahamsa': { title: 'Rajahamsa', year: 1998, synopsis: 'A drama directed by the legendary Singeetam Srinivasa Rao featuring Abbas and Sakshi Shivanand. Known for its unique storytelling.' },
  'Maa Balaji': { title: 'Maa Balaji', year: 1999, synopsis: 'A devotional drama directed by Kodi Ramakrishna featuring Vadde Naveen and Maheswari. The film celebrates devotion and faith.' },
  'Prema Katha': { title: 'Prema Katha', year: 1999, synopsis: 'A romantic action thriller directed by Ram Gopal Varma featuring Sumanth and Antara Mali. The film showcases RGV\'s distinctive style.' },
  'Preminche Manasu': { title: 'Preminche Manasu', year: 1999, synopsis: 'A romantic thriller featuring Ravi Teja and Keerthi Reddy. The film blends romance with suspense in an engaging narrative.' },
  
  // 2000s Films
  'Dollar Dreams': { title: 'Dollar Dreams', year: 2000, synopsis: 'A realistic drama directed by Sekhar Kammula about the aspirations and struggles of Indians pursuing the American dream. The film established Kammula as a thoughtful filmmaker.' },
  'Antha Mana Manchike': { title: 'Antha Mana Manchike', year: 2000, synopsis: 'A comedy-romance-drama featuring Rajendra Prasad and Ramya Krishna. The film offers wholesome entertainment with humor and heart.' },
  'Friends': { title: 'Friends', year: 2002, synopsis: 'A family drama featuring Jagapathi Babu and Shilpa Shetty. The film explores the bonds of friendship and love.' },
  'Gangotri': { title: 'Gangotri', year: 2003, synopsis: 'A romantic drama directed by the legendary K. Raghavendra Rao. The film features beautiful songs and picturesque locations.' },
  'Palanati Brahmanaidu': { title: 'Palanati Brahmanaidu', year: 2003, synopsis: 'A historical action drama featuring Balakrishna. Directed by B. Gopal, the film showcases the story of a legendary warrior.' },
  'Charminar': { title: 'Charminar', year: 2003, synopsis: 'A romantic drama set against the backdrop of Hyderabad\'s iconic Charminar. The film celebrates the city\'s culture and heritage.' },
  'Ori Nee Prema Bangaram Kaanu': { title: 'Ori Nee Prema Bangaram Kaanu', year: 2003, synopsis: 'A romantic family drama featuring Rajesh Krishnan and Sangeetha. The film explores love and family values.' },
  'Dil': { title: 'Dil', year: 2003, synopsis: 'A romantic drama marking Nithiin\'s early career. Directed by V.V. Vinayak, the film features youthful romance and catchy music.' },
  'Varam': { title: 'Varam', year: 2004, synopsis: 'A family romance drama featuring Srikanth and Asin. The film explores love, family expectations, and sacrifice.' },
  'Nuvvante Naakishtam': { title: 'Nuvvante Naakishtam', year: 2005, synopsis: 'A romantic drama featuring Allari Naresh and Anuradha Mehta. Directed by EVV Satyanarayana, known for his comedy touch.' },
  'Asthram': { title: 'Asthram', year: 2006, synopsis: 'An action thriller featuring Vishnu and Anushka. Directed by Suresh Krissna, the film offers intense action and drama.' },
  'Evadaithe Nakenti': { title: 'Evadaithe Nakenti', year: 2007, synopsis: 'An action drama featuring Rajasekhar and Mumaith Khan. The film showcases Rajasekhar\'s action prowess.' },
  'Pellaindi Kaani': { title: 'Pellaindi Kaani', year: 2007, synopsis: 'A comedy drama featuring Allari Naresh and Kamalinee Mukherjee. Directed by EVV Satyanarayana, known for hilarious situations.' },
  '2 Friends': { title: '2 Friends', year: 2018, synopsis: 'A drama exploring the deep bond of friendship between two individuals and the challenges they face together.' },
  
  // 2010s Films
  'Fitting Master': { title: 'Fitting Master', year: 2009, synopsis: 'A comedy-action film featuring Allari Naresh. Directed by EVV Satyanarayana, the film offers entertainment with humor and action.' },
  'Aakasa Ramanna': { title: 'Aakasa Ramanna', year: 2010, synopsis: 'A crime comedy featuring Rajiv Kanakala and Meera Jasmine. The film blends crime elements with comedy.' },
  'Alasyam Amrutham': { title: 'Alasyam Amrutham', year: 2010, synopsis: 'A comedy featuring Tanish and Madalsa Sharma. The film celebrates the laid-back approach to life with humor.' },
  'Rambabu Gadi Pellam': { title: 'Rambabu Gadi Pellam', year: 2010, synopsis: 'A comedy featuring Allari Naresh in a humorous take on married life and its everyday challenges.' },
  'Gaganam': { title: 'Gaganam', year: 2011, synopsis: 'A thrilling action drama featuring Nagarjuna. Based on a hijack situation, the film keeps audiences on the edge of their seats.' },
  'Sangharshana': { title: 'Sangharshana', year: 2011, synopsis: 'An action drama featuring Sasikumar and Swathi Reddy. The film deals with themes of conflict and resolution.' },
  'Yamudiki Mogudu': { title: 'Yamudiki Mogudu', year: 2012, synopsis: 'A romantic comedy-drama featuring Allari Naresh and Richa Panai. The film offers family entertainment with humor.' },
  'Godfather': { title: 'Godfather', year: 2022, synopsis: 'A political action thriller featuring Megastar Chiranjeevi and Nayanthara. A remake of the Malayalam film Lucifer, it showcases Chiranjeevi in a powerful role as a political strategist who controls the fate of a state.' },
  'Gunde Jaari Gallanthayyinde': { title: 'Gunde Jaari Gallanthayyinde', year: 2013, synopsis: 'A romantic film featuring Nithiin and Nithya Menen. The film celebrates love with beautiful music and heartfelt moments.' },
  'Naa Bangaaru Talli': { title: 'Naa Bangaaru Talli', year: 2013, synopsis: 'A powerful crime drama that addresses the issue of human trafficking. The film received critical acclaim for its bold subject matter.' },
  'Aaha Kalyanam': { title: 'Aaha Kalyanam', year: 2014, synopsis: 'A romantic comedy featuring Nani and Vaani Kapoor. The film is a remake of Band Baaja Baaraat, following wedding planners who fall in love.' },
  'Rudhramadevi': { title: 'Rudhramadevi', year: 2015, synopsis: 'An epic historical drama directed by Gunasekhar featuring Anushka Shetty as the warrior queen Rudramadevi. A visual spectacle celebrating one of India\'s few female rulers.' },
  'Nenu Seetha Devi': { title: 'Nenu Seetha Devi', year: 2016, synopsis: 'A romantic film featuring Suman Shetty and Komalee Prasad. The film explores modern love and relationships.' },
  'Sarrainodu': { title: 'Sarrainodu', year: 2016, synopsis: 'A blockbuster action drama featuring Stylish Star Allu Arjun and Rakul Preet Singh. Directed by Boyapati Srinu, the film features intense action and memorable dialogues.' },
  'Okka Ammayi Thappa': { title: 'Okka Ammayi Thappa', year: 2016, synopsis: 'A romantic action drama featuring Sundeep Kishan and Nithya Menen. The film blends romance with thrilling action.' },
  'Okka Kshanam': { title: 'Okka Kshanam', year: 2017, synopsis: 'A sci-fi thriller featuring Allu Sirish and Surbhi. The film explores time travel and alternate realities.' },
  'Vajra Kavachadhara Govinda': { title: 'Vajra Kavachadhara Govinda', year: 2019, synopsis: 'An action film featuring Saptagiri and Vaibhavi Joshi. The film offers entertainment with action and comedy.' },
  'Thipparaa Meesam': { title: 'Thipparaa Meesam', year: 2019, synopsis: 'A social drama featuring Sree Vishnu and Nikki Tamboli. The film addresses relevant social issues with sensitivity.' },
  'Love Story': { title: 'Love Story', year: 2021, synopsis: 'A touching romantic drama featuring Naga Chaitanya and Sai Pallavi. Directed by Sekhar Kammula, the film explores love across social barriers with beautiful dance sequences.' },
  'Journalist': { title: 'Journalist', year: 2021, synopsis: 'A drama featuring Ramki and Tashu Kaushik. The film explores the world of journalism and its challenges.' },
  'Lawyer Viswanath': { title: 'Lawyer Viswanath', year: 2021, synopsis: 'A legal drama featuring Ali Basha. The film follows a lawyer fighting for justice in a complex case.' },
  
  // Recent Films (2023-2026)
  'Breathe': { title: 'Breathe', year: 2023, synopsis: 'A thriller-drama featuring Vennela Kishore and Aishani Shetty. The film keeps audiences engaged with its suspenseful narrative.' },
  'Ugram': { title: 'Ugram', year: 2023, synopsis: 'An action thriller featuring Allari Naresh in an intense avatar. The film showcases Naresh in a powerful action role, different from his usual comedy.' },
  'Geetasakshigaa': { title: 'Geetasakshigaa', year: 2023, synopsis: 'An action drama featuring Aadarsh and Chitra Shukla. The film offers entertainment with action and emotional moments.' },
  'Saachi': { title: 'Saachi', year: 2023, synopsis: 'A drama featuring Ashok Mulavirat and Sanjana Reddy. The film explores personal struggles and triumphs.' },
  'Sindhooram': { title: 'Sindhooram', year: 2023, synopsis: 'An action drama featuring Siva Balaji and Brigida Saga. The film deals with themes of justice and redemption.' },
  'Ranga Maarthaanda': { title: 'Ranga Maarthaanda', year: 2023, synopsis: 'A family drama featuring Prakash Raj and Ramya Krishna. Directed by Deva Katta, the film explores family dynamics and generational conflicts.' },
  'Prasanna Vadanam': { title: 'Prasanna Vadanam', year: 2024, synopsis: 'An action thriller featuring Suhas and Raashi Singh. The film offers a gripping narrative with unexpected twists.' },
  'Dilruba': { title: 'Dilruba', year: 2025, synopsis: 'A romantic action film featuring Kiran Abbavaram and Nazia Davison. The film blends romance with thrilling action sequences.' },
  'Bhairavam': { title: 'Bhairavam', year: 2025, synopsis: 'An action crime thriller featuring Bellamkonda Srinivas and Aditi Shankar. The film offers intense action and a gripping crime narrative.' },
  'Thank You Dear': { title: 'Thank You Dear', year: 2025, synopsis: 'A romantic thriller featuring Dhanush Raghumudri and Hebah Patel. The film combines romance with suspenseful elements.' },
  'Sabhaku Namaskaram': { title: 'Sabhaku Namaskaram', year: 2026, synopsis: 'A political comedy featuring Allari Naresh. The film satirizes the political system with humor and wit.' },
};

// Celebrity industry titles
const CELEBRITY_TITLES: Record<string, string> = {
  // Directors
  'K. Viswanath': 'Kaladhipati',
  'B. Gopal': 'Action King Director',
  'Krishna Vamsi': 'Emotional Director',
  'Gunasekhar': 'Epic Director',
  'Singeetam Srinivasa Rao': 'Visionary Director',
  'Sukumar': 'Stylish Storyteller',
  'Tatineni Prakash Rao': 'Pioneer Director',
  'V. Ramachandra Rao': 'Classic Era Director',
  'P. Chandrasekhara Reddy': 'Golden Era Director',
  'P. Sambasiva Rao': 'Veteran Director',
  'V. Madhusudhan Rao': 'Melody Director',
  
  // Actors
  'NTR Jr': 'Young Tiger',
  'Nandamuri Kalyan Ram': 'ISM Hero',
  'Rana Daggubati': 'Baahubali Star',
  'Naga Chaitanya Akkineni': 'Yuva Samrat',
  'Varun Sandesh': 'Chocolate Boy',
  'Rajinikanth': 'Superstar',
  'Naveen Chandra': 'Versatile Actor',
  'Rajendra Prasad': 'Comedy King',
  'Rao Gopal Rao': 'Villain King',
  'Sai Ronak': 'Promising Young Actor',
  'Thrigun': 'Rising Star',
  
  // Actresses
  'Shriya Saran': 'Diva',
  'Hansika Motwani': 'Bombshell',
  'Meera Jasmine': 'Kerala Beauty',
  'Suhasini': 'Thinking Actress',
  'Simran': 'Dancing Queen',
  'Radha': 'Evergreen Heroine',
  'Aamani': 'Natural Actress',
  'Revathi': 'Director-Actress',
  'Saritha': 'Graceful Actress',
  'Ruhani Sharma': 'New Age Heroine',
  'Namrata Shirodkar': 'Former Miss India',
  'Hariprriya': 'Versatile Actress',
};

async function addSynopsisAndTitles() {
  console.log('=== ADDING SYNOPSIS AND CELEBRITY TITLES ===\n');
  
  // Update movie synopsis
  console.log('📽️ UPDATING MOVIE SYNOPSIS...\n');
  let synopsisUpdated = 0;
  
  for (const [key, movie] of Object.entries(MOVIE_SYNOPSIS)) {
    const { data, error } = await supabase
      .from('movies')
      .update({ synopsis: movie.synopsis, updated_at: new Date().toISOString() })
      .ilike('title_en', `%${movie.title}%`)
      .eq('release_year', movie.year)
      .eq('is_published', true)
      .is('synopsis', null);
    
    if (!error) {
      console.log(`✓ ${movie.title} (${movie.year})`);
      synopsisUpdated++;
    }
  }
  
  console.log(`\n📊 Synopsis updated: ${synopsisUpdated}\n`);
  
  // Update celebrity titles
  console.log('👤 UPDATING CELEBRITY TITLES...\n');
  let titlesUpdated = 0;
  
  for (const [name, title] of Object.entries(CELEBRITY_TITLES)) {
    const { data, error } = await supabase
      .from('celebrities')
      .update({ industry_title: title, updated_at: new Date().toISOString() })
      .ilike('name_en', `%${name}%`)
      .eq('is_published', true);
    
    if (!error) {
      console.log(`✓ ${name}: "${title}"`);
      titlesUpdated++;
    }
  }
  
  console.log(`\n📊 Celebrity titles updated: ${titlesUpdated}`);
  
  console.log('\n=== COMPLETE ===');
}

addSynopsisAndTitles().catch(console.error);
