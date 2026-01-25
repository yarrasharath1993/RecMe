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
  language: string;
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
  {
    title_en: 'Puli',
    title_te: 'పులి',
    release_year: 2010,
    language: 'Telugu',
    genre: ['Action', 'Drama'],
    hero: 'Pawan Kalyan',
    heroine: 'Nikeesha Patel',
    director: 'S. J. Suryah',
    music_director: 'A. R. Rahman',
    supporting_cast: [
      { name: 'Pawan Kalyan', role: 'Puli', type: 'hero', order: 1 },
      { name: 'Nikeesha Patel', role: 'Kajal', type: 'heroine', order: 2 },
      { name: 'Sarah-Jane Dias', role: 'Shruti', type: 'heroine', order: 3 },
      { name: 'Nikitin Dheer', role: 'Villain', type: 'supporting', order: 4 },
      { name: 'Ali', role: 'Supporting', type: 'supporting', order: 5 },
      { name: 'Shriya Saran', role: 'Special Appearance', type: 'cameo', order: 6 },
    ],
    crew: {},
    synopsis: 'A man seeks revenge for his father\'s death while protecting his village from an evil landlord.',
  },
  {
    title_en: 'New',
    title_te: 'న్యూ',
    release_year: 2004,
    language: 'Telugu',
    genre: ['Romance', 'Drama'],
    hero: 'S. J. Suryah',
    heroine: 'Simran',
    director: 'S. J. Suryah',
    music_director: 'A. R. Rahman',
    supporting_cast: [
      { name: 'S. J. Suryah', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Simran', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Kiran Rathod', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Ali', role: 'Supporting (Telugu version)', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A romantic drama about love and relationships.',
  },
  {
    title_en: 'Namo Bhootatma',
    title_te: 'నమో భూతాత్మ',
    release_year: 2014,
    language: 'Telugu',
    genre: ['Horror', 'Thriller'],
    supporting_cast: [
      { name: 'Ali', role: 'Supporting', type: 'supporting', order: 1 },
    ],
    crew: {},
    synopsis: 'A horror thriller film.',
  },
  {
    title_en: 'Duvvada Jagannadham',
    title_te: 'దువ్వాడ జగన్నాథం',
    release_year: 2017,
    language: 'Telugu',
    genre: ['Action', 'Comedy'],
    hero: 'Allu Arjun',
    heroine: 'Pooja Hegde',
    director: 'Harish Shankar',
    music_director: 'Devi Sri Prasad',
    supporting_cast: [
      { name: 'Allu Arjun', role: 'DJ', type: 'hero', order: 1 },
      { name: 'Pooja Hegde', role: 'Pooja', type: 'heroine', order: 2 },
      { name: 'Rao Ramesh', role: 'Villain', type: 'supporting', order: 3 },
      { name: 'Chandra Mohan', role: 'DJ\'s Uncle', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A caterer leads a secret double life as a vigilante.',
  },
  {
    title_en: 'Racha',
    title_te: 'రాచ',
    release_year: 2012,
    language: 'Telugu',
    genre: ['Action', 'Romance'],
    hero: 'Ram Charan',
    heroine: 'Tamannaah',
    director: 'Sampath Nandi',
    music_director: 'Mani Sharma',
    supporting_cast: [
      { name: 'Ram Charan', role: 'Racha', type: 'hero', order: 1 },
      { name: 'Tamannaah', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Ajmal Ameer', role: 'Villain', type: 'supporting', order: 3 },
      { name: 'Geetha', role: 'Hero\'s Mother', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A young man fights against corruption and injustice.',
  },
  {
    title_en: '180',
    title_te: '180',
    release_year: 2011,
    language: 'Telugu',
    genre: ['Romance', 'Drama'],
    hero: 'Siddharth',
    heroine: 'Priya Anand',
    director: 'Jayendra Panchapakesan',
    supporting_cast: [
      { name: 'Siddharth', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Priya Anand', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Nithya Menen', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Geetha', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A Telugu-Tamil bilingual romantic drama.',
  },
  {
    title_en: 'Gangstars',
    title_te: 'గ్యాంగ్‌స్టార్స్',
    release_year: 2018,
    language: 'Telugu',
    genre: ['Crime', 'Thriller'],
    hero: 'Jagapathi Babu',
    director: 'Ajay Bhuyan',
    music_director: 'Sai Karthik',
    producer: 'B.V. Nandini Reddy',
    supporting_cast: [
      { name: 'Jagapathi Babu', role: 'Kumar Das/KD', type: 'hero', order: 1 },
      { name: 'Navdeep', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Shweta Basu Prasad', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Siddu Jonnalagadda', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Apoorva Arora', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {
      creator: [{ name: 'B.V. Nandini Reddy', role: 'Creator' }],
    },
    media_type: 'Web Series',
    synopsis: 'A web series about gangsters and crime in the city.',
  },
  {
    title_en: 'Sri',
    title_te: 'శ్రీ',
    release_year: 2005,
    language: 'Telugu',
    genre: ['Action', 'Drama'],
    hero: 'Manchu Manoj',
    heroine: 'Tamannaah',
    director: 'Dasaradh',
    music_director: 'Sandeep Chowta',
    supporting_cast: [
      { name: 'Manchu Manoj', role: 'Sri (Debut)', type: 'hero', order: 1 },
      { name: 'Tamannaah', role: 'Heroine (Debut)', type: 'heroine', order: 2 },
      { name: 'Mohan Babu', role: 'Basivireddy', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'Debut film of Manchu Manoj and Tamannaah.',
  },
  {
    title_en: 'Saleem',
    title_te: 'సలీం',
    release_year: 2009,
    language: 'Telugu',
    genre: ['Action', 'Romance'],
    hero: 'Manchu Vishnu',
    heroine: 'Ileana D\'Cruz',
    director: 'YVS Chowdary',
    music_director: 'Sandeep Chowta',
    producer: 'Mohan Babu',
    supporting_cast: [
      { name: 'Manchu Vishnu', role: 'Saleem', type: 'hero', order: 1 },
      { name: 'Ileana D\'Cruz', role: 'Satyavathi', type: 'heroine', order: 2 },
      { name: 'Mohan Babu', role: 'Ogirala Joginatham', type: 'supporting', order: 3 },
      { name: 'Kaikala Satyanarayana', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Ali', role: 'Supporting', type: 'supporting', order: 5 },
      { name: 'Brahmanandam', role: 'Supporting', type: 'supporting', order: 6 },
    ],
    crew: {},
    synopsis: 'An action romance film starring Vishnu Manchu in the lead role.',
    notes: 'Vishnu Manchu is LEAD HERO, not supporting cast',
  },
  {
    title_en: 'Hari Hara Veera Mallu: Part 1',
    title_te: 'హరి హర వీరా మల్లు: పార్ట్ 1',
    release_year: 2025,
    language: 'Telugu',
    genre: ['Historical', 'Action'],
    hero: 'Pawan Kalyan',
    heroine: 'Nidhhi Agerwal',
    director: 'Krish Jagarlamudi',
    music_director: 'M. M. Keeravani',
    producer: 'A.M. Ratnam',
    supporting_cast: [
      { name: 'Pawan Kalyan', role: 'Hari Hara Veera Mallu', type: 'hero', order: 1 },
      { name: 'Nidhhi Agerwal', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Bobby Deol', role: 'Villain', type: 'supporting', order: 3 },
      { name: 'Anupam Kher', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Vikramjeet Virk', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {
      director: [{ name: 'Jyothi Krishna', role: 'Co-Director' }],
    },
    synopsis: 'A historical action epic about a legendary warrior.',
  },
  {
    title_en: 'Sambho Siva Sambho',
    title_te: 'సంభో శివ సంభో',
    release_year: 2010,
    language: 'Telugu',
    genre: ['Action', 'Drama'],
    hero: 'Ravi Teja',
    heroine: 'Priyamani',
    director: 'Samuthirakani',
    music_director: 'Sundar C. Babu',
    supporting_cast: [
      { name: 'Ravi Teja', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Allari Naresh', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Siva Balaji', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Priyamani', role: 'Heroine', type: 'heroine', order: 4 },
    ],
    crew: {},
    synopsis: 'An action drama about fighting against corruption.',
  },
  {
    title_en: 'Awe',
    title_te: 'అ!',
    release_year: 2018,
    language: 'Telugu',
    genre: ['Thriller', 'Mystery'],
    director: 'Prasanth Varma',
    music_director: 'Mark K. Robin',
    supporting_cast: [
      { name: 'Kajal Aggarwal', role: 'Supporting', type: 'supporting', order: 1 },
      { name: 'Nithya Menen', role: 'Supporting', type: 'supporting', order: 2 },
      { name: 'Regina Cassandra', role: 'Supporting', type: 'supporting', order: 3 },
    ],
    crew: {
      voice: [{ name: 'Ravi Teja', role: 'Voice-over for Chanti (Bonsai tree)' }],
    },
    synopsis: 'A unique thriller with interconnected stories. Ravi Teja provides voice-over for a bonsai tree character.',
  },
  {
    title_en: 'RAM: Rapid Action Mission',
    title_te: 'రామ్',
    release_year: 2024,
    language: 'Telugu',
    genre: ['Action', 'Thriller'],
    hero: 'Surya Ayansh',
    heroine: 'Dhanya Balakrishna',
    director: 'Mihiraam Vynateyaa',
    supporting_cast: [
      { name: 'Surya Ayansh', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Dhanya Balakrishna', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Rohit', role: 'Officer', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'An action thriller about a rapid action mission.',
  },
  {
    title_en: 'Malli Raava',
    title_te: 'మళ్లీ రావ',
    release_year: 2017,
    language: 'Telugu',
    genre: ['Romance', 'Drama'],
    hero: 'Sumanth',
    heroine: 'Aakanksha Singh',
    director: 'Gowtam Tinnanuri',
    supporting_cast: [
      { name: 'Sumanth', role: 'Karthik', type: 'hero', order: 1 },
      { name: 'Aakanksha Singh', role: 'Anjali', type: 'heroine', order: 2 },
      { name: 'Annapurna', role: 'Supporting', type: 'supporting', order: 3 },
    ],
    crew: {},
    synopsis: 'A romantic drama spanning multiple years.',
  },
  {
    title_en: 'Balu ABCDEFG',
    title_te: 'బాలు ABCDEFG',
    release_year: 2005,
    language: 'Telugu',
    genre: ['Action', 'Comedy'],
    hero: 'Pawan Kalyan',
    heroine: 'Shriya Saran',
    director: 'A. Karunakaran',
    supporting_cast: [
      { name: 'Pawan Kalyan', role: 'Balu', type: 'hero', order: 1 },
      { name: 'Shriya Saran', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Neha Oberoi', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Sunil', role: 'Balu\'s friend', type: 'supporting', order: 4 },
      { name: 'Brahmanandam', role: 'Supporting', type: 'supporting', order: 5 },
      { name: 'Gulshan Grover', role: 'Villain', type: 'supporting', order: 6 },
    ],
    crew: {},
    synopsis: 'An action comedy film starring Pawan Kalyan.',
  },
  {
    title_en: 'Nuvvu Thopu Raa',
    title_te: 'నువ్వు తోపురా',
    release_year: 2019,
    language: 'Telugu',
    genre: ['Comedy', 'Drama'],
    hero: 'Sudhakar Komakula',
    heroine: 'Nitya Shetty',
    director: 'Harinath Babu',
    supporting_cast: [
      { name: 'Sudhakar Komakula', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Nitya Shetty', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Varun Sandesh', role: 'Car driver/friend', type: 'cameo', order: 3 },
      { name: 'Nirosha', role: 'Supporting', type: 'supporting', order: 4 },
    ],
    crew: {},
    synopsis: 'A comedy drama with Varun Sandesh in a cameo appearance.',
  },
  {
    title_en: 'Bahumati',
    title_te: 'బాహుమతి',
    release_year: 2007,
    language: 'Telugu',
    genre: ['Comedy', 'Drama'],
    hero: 'Venu Thottempudi',
    heroine: 'Sangeetha',
    director: 'S. V. Krishna Reddy',
    supporting_cast: [
      { name: 'Venu Thottempudi', role: 'Venkat', type: 'hero', order: 1 },
      { name: 'Sangeetha', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Shabana Khan', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Brahmanandam', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Ali', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'A comedy drama starring Venu Thottempudi in the lead role.',
  },
  {
    title_en: 'Ramachari',
    title_te: 'రామచారి',
    release_year: 2013,
    language: 'Telugu',
    genre: ['Action', 'Romance'],
    hero: 'Venu Thottempudi',
    heroine: 'Kamalinee Mukherjee',
    director: 'G. Eshwar',
    supporting_cast: [
      { name: 'Venu Thottempudi', role: 'Ramachari', type: 'hero', order: 1 },
      { name: 'Kamalinee Mukherjee', role: 'Heroine', type: 'heroine', order: 2 },
      { name: 'Brahmanandam', role: 'Supporting', type: 'supporting', order: 3 },
      { name: 'Ali', role: 'Supporting', type: 'supporting', order: 4 },
      { name: 'Murali Sharma', role: 'Supporting', type: 'supporting', order: 5 },
    ],
    crew: {},
    synopsis: 'An action romance film starring Venu Thottempudi in the lead role.',
  },
  {
    title_en: 'Yamagola Malli Modalayindi',
    title_te: 'యమగోల మళ్లీ మొదలయింది',
    release_year: 2007,
    language: 'Telugu',
    genre: ['Comedy', 'Fantasy'],
    hero: 'Srikanth',
    heroine: 'Meera Jasmine',
    director: 'Srinivasa Reddy',
    music_director: 'Jeevan Thomas',
    supporting_cast: [
      { name: 'Srikanth', role: 'Hero', type: 'hero', order: 1 },
      { name: 'Venu Thottempudi', role: 'Hero', type: 'hero', order: 2 },
      { name: 'Meera Jasmine', role: 'Heroine', type: 'heroine', order: 3 },
      { name: 'Reemma Sen', role: 'Heroine', type: 'heroine', order: 4 },
      { name: 'Kaikala Satyanarayana', role: 'Senior Yama', type: 'supporting', order: 5 },
    ],
    crew: {
      voice: [{ name: 'NTR Jr.', role: 'Voice/Photo cameo' }],
    },
    synopsis: 'A comedy fantasy sequel about Yama (God of Death).',
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
    console.log(chalk.yellow(`  ○ Already exists: ${movie.title_en} (${movie.release_year}) - ID: ${existingId}`));
    return true;
  }

  if (dryRun) {
    console.log(chalk.green(`  → Would create: ${movie.title_en} (${movie.release_year})`));
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
    language: movie.language,
    genres: movie.genre || [],  // Note: 'genres' (plural) in database
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
    console.log(chalk.red(`  ✗ Failed: ${movie.title_en}`));
    console.log(chalk.red(`    Error: ${error.message}`));
    return false;
  }

  console.log(chalk.green(`  ✓ Created: ${movie.title_en} (${movie.release_year}) - ID: ${data.id}`));
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
  console.log(chalk.bold('  ADD 19 TELUGU ORIGINAL FILMS'));
  console.log(chalk.bold('═══════════════════════════════════════════════════════════════\n'));

  let created = 0;
  let alreadyExists = 0;
  let failed = 0;

  // Group by decade
  const moviesByDecade = movies.reduce((acc, movie) => {
    const decade = Math.floor(movie.release_year / 10) * 10;
    if (!acc[decade]) acc[decade] = [];
    acc[decade].push(movie);
    return acc;
  }, {} as Record<number, MovieData[]>);

  for (const [decade, decadeMovies] of Object.entries(moviesByDecade).sort((a, b) => parseInt(b[0]) - parseInt(a[0]))) {
    console.log(chalk.cyan(`\n📅 ${decade}s (${decadeMovies.length} movies)\n`));

    for (const movie of decadeMovies) {
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

  if (dryRun) {
    console.log(chalk.yellow(`\nWould create:           ${movies.length - alreadyExists} movies`));
  } else {
    console.log(chalk.green(`\n✓ Created:              ${created} movies`));
    console.log(chalk.red(`✗ Failed:               ${failed} movies`));
  }

  console.log(chalk.bold('\n═══════════════════════════════════════════════════════════════\n'));

  if (!dryRun && created > 0) {
    console.log(chalk.green(`✅ Success! Added ${created} Telugu original films to database.`));
    console.log(chalk.cyan(`\nNew Attribution Total: ${755 + created} movies\n`));
  }
}

main();
