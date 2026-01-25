import { createClient } from '@supabase/supabase-js';
import chalk from 'chalk';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface MovieData {
  title_en: string;
  title_te?: string;
  release_year: number;
  language: string; // Original language: Tamil, Malayalam, Hindi, etc.
  genre?: string[];
  hero?: string;
  heroine?: string;
  director?: string;
  music_director?: string;
  producer?: string;
  cinematographer?: string;
  supporting_cast: Array<{
    name: string;
    role: string;
    type: 'hero' | 'heroine' | 'supporting' | 'cameo';
    order: number;
  }>;
  crew: {
    [key: string]: Array<{ name: string; role: string }>;
  };
  synopsis?: string;
  media_type?: string;
  notes?: string;
}

const movies: MovieData[] = [
  // TAMIL FILMS
  {
    title_en: 'Saroja',
    title_te: 'సరోజ',
    release_year: 2008,
    language: 'Tamil',
    genre: ['Action', 'Thriller'],
    director: 'Venkat Prabhu',
    music_director: 'Yuvan Shankar Raja',
    supporting_cast: [
      { name: 'Shiva', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Premji', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Vaibhav', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Vega Tamotia', role: 'Heroine', type: 'heroine', order: 4 },
      { name: 'Brahmanandam', role: 'Special Appearance', type: 'cameo', order: 5 },
    ],
    crew: {},
    synopsis: 'A Tamil action thriller. Brahmanandam appears in a special role.',
  },
  {
    title_en: 'Vaalu',
    title_te: 'వాలు',
    release_year: 2015,
    language: 'Tamil',
    genre: ['Action', 'Romance'],
    hero: 'Silambarasan',
    heroine: 'Hansika Motwani',
    director: 'Vijay Chander',
    supporting_cast: [
      { name: 'Silambarasan', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Hansika Motwani', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Santhanam', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Brahmanandam', role: 'Supporting (Telugu dub)', type: 'supporting', order: 4 },
      { name: 'Raasi', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A Tamil action romance film.',
    notes: 'Brahmanandam appears in Telugu dubbed version',
  },
  {
    title_en: 'Thee Ivan',
    title_te: 'తీ ఇవాన్',
    release_year: 2023,
    language: 'Tamil',
    genre: ['Action', 'Drama'],
    hero: 'Karthik',
    director: 'T.M. Jayamurugan',
    supporting_cast: [
      { name: 'Karthik', role: 'Lead', type: 'hero', order: 1 },
      { name: 'Sukanya', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Suman', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Aishwarya Lekshmi', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Tamil action drama film.',
  },
  {
    title_en: 'Andhagan',
    title_te: 'అంధగాన్',
    release_year: 2024,
    language: 'Tamil',
    genre: ['Thriller', 'Mystery'],
    hero: 'Prashanth',
    heroine: 'Priya Anand',
    director: 'Thiagarajan',
    supporting_cast: [
      { name: 'Prashanth', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Priya Anand', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Simran', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Karthik', role: 'Guest appearance', type: 'cameo', order: 4 },
      { name: 'Samuthirakani', role: 'Supporting', type: 'supporting', order: 5 },
      { name: 'Yogi Babu', role: 'Supporting', type: 'supporting', order: 6 },
    ],
    crew: {},
    synopsis: 'A Tamil thriller remake of Andhadhun.',
  },
  {
    title_en: 'Maanja Velu',
    title_te: 'మాంజా వేలు',
    release_year: 2010,
    language: 'Tamil',
    genre: ['Action', 'Drama'],
    hero: 'Arun Vijay',
    heroine: 'Dhansika',
    director: 'A. Venkatesh',
    supporting_cast: [
      { name: 'Arun Vijay', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Dhansika', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Karthik', role: 'Subhash Chandra Bose', type: 'supporting', order: 3 },
      { name: 'Prabhu', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Santhanam', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A Tamil action drama.',
  },
  {
    title_en: 'Unakkum Enakkum',
    title_te: 'ఉనక్కుమ్ ఎనక్కుమ్',
    release_year: 2006,
    language: 'Tamil',
    genre: ['Romance', 'Drama'],
    hero: 'Jayam Ravi',
    heroine: 'Trisha',
    director: 'M. Raja',
    music_director: 'Devi Sri Prasad',
    supporting_cast: [
      { name: 'Jayam Ravi', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Trisha', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Prabhu', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Bhagyaraj', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Geetha', role: 'Hero\'s Mother', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A Tamil romantic drama.',
  },
  {
    title_en: 'Thoranai',
    title_te: 'తోరణై',
    release_year: 2009,
    language: 'Tamil',
    genre: ['Action', 'Romance'],
    hero: 'Vishal',
    heroine: 'Shriya Saran',
    director: 'Sabha Ayyappan',
    supporting_cast: [
      { name: 'Vishal', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Shriya Saran', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Prakash Raj', role: 'Villain', type: 'supporting', order: 3 },
      { name: 'Geetha', role: 'Mother', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Tamil action romance film.',
  },
  {
    title_en: 'Paramasivan',
    title_te: 'పరమశివన్',
    release_year: 2006,
    language: 'Tamil',
    genre: ['Action', 'Thriller'],
    hero: 'Ajith Kumar',
    heroine: 'Laila',
    director: 'P. Vasu',
    music_director: 'Vidyasagar',
    supporting_cast: [
      { name: 'Ajith Kumar', role: 'Paramasivan', type: 'hero', order: 1 },
      { name: 'Laila', role: 'Malar', type: 'heroine', order: 2 },
      { name: 'Prakash Raj', role: 'SP Nandhakumar', type: 'supporting', order: 3 },
      { name: 'Vivek', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Jayaram', role: 'Supporting', type: 'supporting', order: 5 },
      { name: 'Nassar', role: 'Supporting', type: 'supporting', order: 6 },
    ],
    crew: {},
    synopsis: 'A Tamil action thriller starring Ajith Kumar.',
  },
  {
    title_en: 'Bheemaa',
    title_te: 'భీమా',
    release_year: 2008,
    language: 'Tamil',
    genre: ['Action', 'Drama'],
    hero: 'Vikram',
    heroine: 'Trisha',
    director: 'N. Linguswamy',
    music_director: 'Harris Jayaraj',
    supporting_cast: [
      { name: 'Vikram', role: 'Sekhar', type: 'hero', order: 1 },
      { name: 'Trisha', role: 'Shalini', type: 'heroine', order: 2 },
      { name: 'Prakash Raj', role: 'Chinna', type: 'supporting', order: 3 },
      { name: 'Raghuvaran', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Ashish Vidyarthi', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A Tamil action drama starring Vikram.',
  },
  {
    title_en: 'Un Samayal Arayil',
    title_te: 'ఉన్ సమయాల్ అరయిల్',
    release_year: 2014,
    language: 'Tamil',
    genre: ['Drama', 'Family'],
    hero: 'Prakash Raj',
    heroine: 'Sneha',
    director: 'Prakash Raj',
    music_director: 'Ilaiyaraaja',
    supporting_cast: [
      { name: 'Prakash Raj', role: 'Kalidas (Lead)', type: 'hero', order: 1 },
      { name: 'Sneha', role: 'Gowri', type: 'heroine', order: 2 },
      { name: 'Tejus', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Samyuktha Hornad', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Urvashi', role: 'Supporting', type: 'supporting', order: 5 },
      { name: 'Thambi Ramaiah', role: 'Supporting', type: 'supporting', order: 6 },
    ],
    crew: {},
    synopsis: 'A Tamil family drama directed by and starring Prakash Raj.',
    notes: 'Prakash Raj is lead actor and director',
  },
  {
    title_en: 'Sudhandhiram',
    title_te: 'సుధాంధిరం',
    release_year: 2000,
    language: 'Tamil',
    genre: ['Action', 'Drama'],
    hero: 'Arjun Sarja',
    heroine: 'Rambha',
    director: 'Raj Kapoor',
    supporting_cast: [
      { name: 'Arjun Sarja', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Rambha', role: 'Divya', type: 'heroine', order: 2 },
      { name: 'Raghuvaran', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Radhika Chaudhari', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Mumtaj', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A Tamil action drama.',
  },
  {
    title_en: 'Military',
    title_te: 'మిలిటరీ',
    release_year: 2003,
    language: 'Tamil',
    genre: ['Action', 'Drama'],
    hero: 'Sathyaraj',
    heroine: 'Rambha',
    director: 'G. Sai Suresh',
    supporting_cast: [
      { name: 'Sathyaraj', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Rambha', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Manivannan', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Vijayakumar', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Tamil action drama.',
  },
  {
    title_en: 'Anbu',
    title_te: 'అన్బు',
    release_year: 2003,
    language: 'Tamil',
    genre: ['Drama', 'Family'],
    hero: 'Bala',
    heroine: 'Deepu',
    director: 'Dalpathiraj',
    supporting_cast: [
      { name: 'Bala', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Deepu', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Sarath Babu', role: 'Hero\'s father', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'A Tamil family drama.',
  },
  {
    title_en: 'Arul',
    title_te: 'అరుల్',
    release_year: 2004,
    language: 'Tamil',
    genre: ['Action', 'Drama'],
    hero: 'Vikram',
    heroine: 'Jyothika',
    director: 'Hari',
    music_director: 'Harris Jayaraj',
    supporting_cast: [
      { name: 'Vikram', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Jyothika', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Sarath Babu', role: 'Doctor', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'A Tamil action drama starring Vikram.',
  },
  
  // MALAYALAM FILMS
  {
    title_en: 'Zachariayude Garbhinikal',
    title_te: 'జకరయ్యూడే గర్భినికల్',
    release_year: 2013,
    language: 'Malayalam',
    genre: ['Comedy', 'Drama'],
    director: 'Aneesh Anwar',
    supporting_cast: [
      { name: 'Lal', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Sanusha', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Sandra Thomas', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Geetha', role: 'Sister Jasmine', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Malayalam comedy drama. Nominated for Filmfare Award South for Best Supporting Actress (Geetha).',
  },
  {
    title_en: 'Djibouti',
    title_te: 'జిబౌటి',
    release_year: 2021,
    language: 'Malayalam',
    genre: ['Thriller', 'Drama'],
    director: 'S.J. Sinu',
    supporting_cast: [
      { name: 'Amit Chakkalakkal', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Shagun Jaswal', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Jacob Gregory', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Geetha', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Malayalam thriller.',
  },
  {
    title_en: 'Chronic Bachelor',
    title_te: 'క్రానిక్ బ్యాచిలర్',
    release_year: 2003,
    language: 'Malayalam',
    genre: ['Comedy', 'Romance'],
    hero: 'Mammootty',
    director: 'Siddique',
    music_director: 'Deepak Dev',
    supporting_cast: [
      { name: 'Mammootty', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Mukesh', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Rambha', role: 'Heroine', type: 'heroine', order: 3 },
      { name: 'Bhavana', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Malayalam comedy film.',
  },
  {
    title_en: 'Kochi Rajavu',
    title_te: 'కొచ్చి రాజావు',
    release_year: 2005,
    language: 'Malayalam',
    genre: ['Comedy', 'Action'],
    hero: 'Dileep',
    director: 'Johny Antony',
    music_director: 'Vidyasagar',
    supporting_cast: [
      { name: 'Dileep', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Kavya Madhavan', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Rambha', role: 'Heroine', type: 'heroine', order: 3 },
    ],
    crew: {},
    synopsis: 'A Malayalam comedy action film.',
  },
  {
    title_en: 'Turbo',
    title_te: 'టర్బో',
    release_year: 2024,
    language: 'Malayalam',
    genre: ['Action', 'Comedy'],
    hero: 'Mammootty',
    director: 'Vysakh',
    music_director: 'Christo Xavier',
    supporting_cast: [
      { name: 'Mammootty', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Sunil', role: 'Andrew', type: 'supporting', order: 2 },
      { name: 'Raj B. Shetty', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Anjana Jayaprakash', role: 'Heroine', type: 'heroine', order: 4 },
    ],
    crew: {},
    synopsis: 'A Malayalam action comedy starring Mammootty.',
  },
  {
    title_en: 'Rappakal',
    title_te: 'రప్పకల్',
    release_year: 2005,
    language: 'Malayalam',
    genre: ['Drama', 'Thriller'],
    hero: 'Mammootty',
    heroine: 'Nayanthara',
    director: 'Kamal',
    music_director: 'Mohan Sithara',
    supporting_cast: [
      { name: 'Mammootty', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Nayanthara', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Sharada', role: 'Saraswathiyamma', type: 'supporting', order: 3 },
      { name: 'Balachandra Menon', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Geetu Mohandas', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A Malayalam drama thriller.',
  },
  
  // HINDI FILMS
  {
    title_en: 'Listen... Amaya',
    title_te: 'లిజన్... అమయా',
    release_year: 2013,
    language: 'Hindi',
    genre: ['Drama', 'Family'],
    director: 'Avinash Kumar Singh',
    supporting_cast: [
      { name: 'Farooq Sheikh', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Deepti Naval', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Swara Bhaskar', role: 'Amaya', type: 'supporting', order: 3 },
      { name: 'Amala Akkineni', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Hindi family drama.',
  },
  {
    title_en: 'Hamari Adhuri Kahani',
    title_te: 'హమారీ అధూరీ కహానీ',
    release_year: 2015,
    language: 'Hindi',
    genre: ['Romance', 'Drama'],
    hero: 'Emraan Hashmi',
    heroine: 'Vidya Balan',
    director: 'Mohit Suri',
    supporting_cast: [
      { name: 'Emraan Hashmi', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Vidya Balan', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Rajkummar Rao', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Amala Akkineni', role: 'Rohini (Cameo)', type: 'cameo', order: 4 },
    ],
    crew: {},
    synopsis: 'A Hindi romantic drama.',
  },
  {
    title_en: 'Tumse Na Ho Payega',
    title_te: 'తుమ్సే నా హో పయేగా',
    release_year: 2023,
    language: 'Hindi',
    genre: ['Comedy', 'Drama'],
    hero: 'Ishwak Singh',
    heroine: 'Mahima Makwana',
    director: 'Abhishek Sinha',
    supporting_cast: [
      { name: 'Ishwak Singh', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Mahima Makwana', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Amala Akkineni', role: 'Mother', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'A Hindi comedy drama web series.',
    media_type: 'Web Series',
  },
  {
    title_en: 'Kyo Kii... Main Jhuth Nahin Bolta',
    title_te: 'క్యో కీ... మైన్ ఝూత్ నహీన్ బోల్తా',
    release_year: 2001,
    language: 'Hindi',
    genre: ['Comedy', 'Drama'],
    hero: 'Govinda',
    heroine: 'Sushmita Sen',
    director: 'David Dhawan',
    supporting_cast: [
      { name: 'Govinda', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Sushmita Sen', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Rambha', role: 'Tara (Supporting Lead)', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'A Hindi comedy film.',
  },
  {
    title_en: 'Gulmohar',
    title_te: 'గుల్మోహర్',
    release_year: 2023,
    language: 'Hindi',
    genre: ['Drama', 'Family'],
    director: 'Rahul V. Chittella',
    supporting_cast: [
      { name: 'Sharmila Tagore', role: 'Lead', type: 'hero', order: 1 },
      { name: 'Manoj Bajpayee', role: 'Lead', type: 'hero', order: 2 },
      { name: 'Simran', role: 'Indu', type: 'supporting', order: 3 },
      { name: 'Suraj Sharma', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Hindi family drama on Disney+ Hotstar.',
    media_type: 'Web Film',
  },
  {
    title_en: 'Citadel: Honey Bunny',
    title_te: 'సిటాడెల్: హనీ బన్నీ',
    release_year: 2024,
    language: 'Hindi',
    genre: ['Action', 'Thriller'],
    hero: 'Varun Dhawan',
    heroine: 'Samantha Ruth Prabhu',
    director: 'Raj & DK',
    supporting_cast: [
      { name: 'Varun Dhawan', role: 'Lead', type: 'hero', order: 1 },
      { name: 'Samantha Ruth Prabhu', role: 'Lead', type: 'heroine', order: 2 },
      { name: 'Simran', role: 'Zubin', type: 'supporting', order: 3 },
      { name: 'Kay Kay Menon', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Saqib Saleem', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {
      creator: [{ name: 'Raj & DK', role: 'Directors' }],
    },
    synopsis: 'A Hindi action thriller web series.',
    media_type: 'Web Series',
  },
  
  // WEB SERIES (Telugu)
  {
    title_en: 'High Priestess',
    title_te: 'హై ప్రీస్టెస్',
    release_year: 2019,
    language: 'Telugu',
    genre: ['Thriller', 'Mystery'],
    hero: 'Amala Akkineni',
    director: 'Pushpa Ignatius',
    supporting_cast: [
      { name: 'Amala Akkineni', role: 'Swathi Reddy (Lead)', type: 'hero', order: 1 },
      { name: 'Kishore', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Sunainaa', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Vijayalakshmi', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Telugu thriller web series.',
    media_type: 'Web Series',
  },
];

async function checkMovieExists(title: string, year: number): Promise<string | null> {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .ilike('title_en', title)
    .eq('release_year', year)
    .maybeSingle();

  if (error) {
    console.error(chalk.red(`Error checking movie: ${error.message}`));
    return null;
  }

  return data ? data.id : null;
}

async function createMovie(movie: MovieData, dryRun: boolean): Promise<boolean> {
  const existingId = await checkMovieExists(movie.title_en, movie.release_year);

  if (existingId) {
    console.log(chalk.yellow(`  ○ Already exists: ${movie.title_en} (${movie.release_year}) [${movie.language}] - ID: ${existingId}`));
    return true;
  }

  if (dryRun) {
    console.log(chalk.green(`  → Would create: ${movie.title_en} (${movie.release_year}) [${movie.language}]`));
    console.log(chalk.gray(`    Cast: ${movie.supporting_cast.slice(0, 3).map(c => c.name).join(', ')}`));
    if (movie.director) console.log(chalk.gray(`    Director: ${movie.director}`));
    if (movie.media_type) console.log(chalk.gray(`    Type: ${movie.media_type}`));
    return true;
  }

  // Create movie entry
  const moviePayload: any = {
    title_en: movie.title_en,
    title_te: movie.title_te || '',
    release_year: movie.release_year,
    language: movie.language, // CRITICAL: Original language
    genres: movie.genre || [],
    primary_genre: movie.genre?.[0] || '',
    hero: movie.hero || '',
    heroine: movie.heroine || '',
    director: movie.director || '',
    directors: movie.director ? [movie.director] : [],
    music_director: movie.music_director || '',
    producer: movie.producer || null,
    producers: movie.producer ? [movie.producer] : [],
    cinematographer: movie.cinematographer || null,
    supporting_cast: movie.supporting_cast,
    crew: movie.crew,
    synopsis: movie.synopsis || '',
    is_published: true,
    slug: `${movie.title_en.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${movie.release_year}`,
    content_type: movie.media_type || 'Theatrical',
  };

  const { data, error } = await supabase
    .from('movies')
    .insert(moviePayload)
    .select()
    .single();

  if (error) {
    console.log(chalk.red(`  ✗ Failed: ${movie.title_en} [${movie.language}]`));
    console.log(chalk.red(`    Error: ${error.message}`));
    return false;
  }

  console.log(chalk.green(`  ✓ Created: ${movie.title_en} (${movie.release_year}) [${movie.language}] - ID: ${data.id}`));
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');

  if (dryRun) {
    console.log(chalk.yellow('\n⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.gray('Use --execute to create movies\n'));
  } else {
    console.log(chalk.red('\n⚠️  EXECUTE MODE - Movies will be created!\n'));
  }

  console.log(chalk.bold('═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  ADD CROSS-LANGUAGE FILMS (Tamil, Malayalam, Hindi + Web)'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));

  let created = 0;
  let alreadyExists = 0;
  let failed = 0;

  // Group by language
  const moviesByLanguage = movies.reduce((acc, movie) => {
    if (!acc[movie.language]) acc[movie.language] = [];
    acc[movie.language].push(movie);
    return acc;
  }, {} as Record<string, MovieData[]>);

  for (const [language, langMovies] of Object.entries(moviesByLanguage).sort()) {
    console.log(chalk.cyan(`\n🌍 ${language} Films (${langMovies.length} movies)\n`));

    for (const movie of langMovies) {
      const success = await createMovie(movie, dryRun);

      if (success) {
        if (await checkMovieExists(movie.title_en, movie.release_year)) {
          alreadyExists++;
        } else {
          created++;
        }
      } else {
        failed++;
      }
    }
  }

  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('  SUMMARY'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));

  console.log(chalk.blue(`Total Movies:           ${movies.length}`));
  console.log(chalk.yellow(`Already Exists:         ${alreadyExists}`));

  // Breakdown by language
  console.log(chalk.cyan('\nBy Language:'));
  Object.entries(moviesByLanguage).sort().forEach(([lang, movies]) => {
    console.log(chalk.gray(`  ${lang.padEnd(12)}: ${movies.length} movies`));
  });

  if (dryRun) {
    console.log(chalk.yellow(`\nWould create:           ${movies.length - alreadyExists} movies`));
  } else {
    console.log(chalk.green(`\n✓ Created:              ${created} movies`));
    console.log(chalk.red(`✗ Failed:               ${failed} movies`));
  }

  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════\n'));

  if (!dryRun && created > 0) {
    console.log(chalk.green(`✅ Success! Added ${created} cross-language films to database.`));
    console.log(chalk.cyan(`\nDatabase now includes:`));
    console.log(chalk.cyan(`  - Telugu actors in Tamil films`));
    console.log(chalk.cyan(`  - Telugu actors in Malayalam films`));
    console.log(chalk.cyan(`  - Telugu actors in Hindi films`));
    console.log(chalk.cyan(`  - Telugu web series\n`));
    console.log(chalk.cyan(`New Total: ${774 + created} movies in database\n`));
  }
}

main();
