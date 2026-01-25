import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Known male actors (should be "hero", not "heroine")
 */
const KNOWN_MALE_ACTORS = new Set([
  'rajinikanth', 'amitabh bachchan', 'pankaj tripathi', 'ajay devgn', 'sanjay dutt',
  'r. madhavan', 'hrithik roshan', 'akshay kumar', 'upendra', 'devaraj',
  'darling krishna', 'shiva rajkumar', 'v ravichandran', 'sudeepa', 'jp tuminad',
  'amoghavarsha', 'raj b shetty', 'rishab shetty', 'naslen', 'kunchacko boban',
  'basil joseph', 'soubin shahir', 'asif ali', 'mammootty', 'prithviraj sukamaran',
  'darshana rajendran', 'unni mukundan', 'fahadh faasil', 'dileesh pothan',
  'siddharth', 's. j. suryah', 'adhik ravichandran', 'raghava lawrence',
  'lokesh kanagaraj', 'samuthirakani', 'dhanush', 'udhayanidhi stalin',
  'karthi', 'vijay sethupathi', 'silambarasan', 'selvaraghavan',
  'n. t. rama rao', 'rajendra prasad', 'prabhas', 'krishna', 'ram gopal varma',
  'mohan babu', 'sundar c', 'sunil', 'rajasekhar', 'jayasudha', 'brahmanandam',
  'krishna bhagavan', 'kasinathuni viswanath', 'suresh gopi', 'prakash raj',
  'mahesh babu', 'allari naresh', 'puri jagannadh', 'gautham vasudev menon',
  'm. s. raju', 'vishnu varadhan', 'allani sridhar', 'e. v. v. satyanarayana',
  'kodi ramakrishna', 'm. balaiah', 'surender reddy', 'k. bapayya',
  'chandramohan', 'mouli', 'k. s. gopalakrishnan', 'balu mahendra',
  'a. c. tirulokchandar', 'bharathiraja', 'allu rama lingaiah',
  'v. b. rajendra prasad', 'ashok g.', 'jagapati babu', 'r. narayana murthy',
  'k raghavendra rao', 'vamsy', 'p. sambasiva rao', 'ravi raja pinisetty',
  't. krishna', 'k. s. r. das', 'sagar', 'saluri koteswara rao',
  's. s. rajamouli', 'dasari narayana rao', 'k. kattama raju',
  'sampath nandi', 'krishna chaitanya', 'g. v. prabhakar', 'raj kandukuri',
  'jamuna', 'k. s. prakash rao', 'mallikarjun', 'j. d. chakravarthi',
  'srikanth', 'sreenu vaitla', 'priyadarshan', 'srikanth addala',
  'vijay bhaskar', 'teja', 'sundeep kishan', 'suseenthiran',
  'mohan raja', 'sankalp reddy', 'anudeep', 'gowtam tinnanuri',
  'mahesh babu p', 'vamsikrishna akella', 'anand ravi', 'tirupathi swamy',
  'eranki sharma', 'arjun sajnani', 'k. murari', 'prem', 'raaj prabavathy menon',
  'kittu nalluri', 'tanvir ahmed', 'sasi', 'rishikeshwar yogi',
  'geetha krishna', 'ajay bhupathi', 'seenu ramasamy', 'anil kumar',
  'jayanth c. paranjee', 'jayant paranji', 'radha krishna jagarlamudi',
  'o. s. r. das', 'j. mahendran', 'l. v. prasad', 'harmesh malhotra',
  't. n. balu', 'k. r. vijaya', 'paul e. eliacin', 'kishore kumar pardasani',
  'hari santosh', 'praveen gandhi', 'mumaith khan', 'satyam bellamkonda',
  'ahishor solomon', 'anil ravipudi', 'sudheer varma', 'dhavala satyam',
  'thirupathisamy', 'sunil kumar reddy', 'madan ramigani', 'p. sunil kumar reddy',
]);

/**
 * Known female actors (should be "heroine", not "hero")
 */
const KNOWN_FEMALE_ACTORS = new Set([
  'ana de armas', 'tabu', 'kareena kapoor khan', 'alia bhatt', 'taapsee pannu',
  'kriti sanon', 'bhanupriya', 'kajol', 'priyamani', 'sindhu sreenivasa murthy',
  'kalyani priyadarshan', 'aishwarya lekshmi', 'sai pallavi', 'keerthy suresh',
  'vijaya nirmala', 'radha', 'bhumika chawla', 'jayasudha', 'jamuna',
  'sowcar janaki', 'anjali devi', 'k. r. vijaya', 'sneha ullal',
  'archana sharma', 'geetha krishna', 'mumaith khan',
]);

interface GenderMisclassification {
  movieId: string;
  title: string;
  year: number;
  slug: string;
  personName: string;
  currentRole: string;
  correctRole: string;
  field: string;
  confidence: number;
  reason: string;
}

async function auditGenderRoleMisclassifications() {
  console.log('🔍 Auditing gender role misclassifications...\n');

  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year, slug, hero, heroine')
    .eq('is_published', true)
    .not('release_year', 'is', null);

  if (error) {
    console.error('Error fetching movies:', error.message);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log('No movies found.');
    return;
  }

  console.log(`📊 Analyzing ${movies.length} published movies...\n`);

  const misclassifications: GenderMisclassification[] = [];

  for (const movie of movies) {
    // Check hero field for female actors
    if (movie.hero) {
      const heroNames = movie.hero.split(',').map(n => n.trim());
      for (const name of heroNames) {
        const normalizedName = name.toLowerCase().trim();
        if (KNOWN_FEMALE_ACTORS.has(normalizedName)) {
          misclassifications.push({
            movieId: movie.id,
            title: movie.title_en || 'Unknown',
            year: movie.release_year || 0,
            slug: movie.slug || '',
            personName: name,
            currentRole: 'hero',
            correctRole: 'heroine',
            field: 'hero',
            confidence: 95,
            reason: `Female actor "${name}" listed as hero, should be heroine`,
          });
        }
      }
    }

    // Check heroine field for male actors
    if (movie.heroine) {
      const heroineNames = movie.heroine.split(',').map(n => n.trim());
      for (const name of heroineNames) {
        const normalizedName = name.toLowerCase().trim();
        if (KNOWN_MALE_ACTORS.has(normalizedName)) {
          misclassifications.push({
            movieId: movie.id,
            title: movie.title_en || 'Unknown',
            year: movie.release_year || 0,
            slug: movie.slug || '',
            personName: name,
            currentRole: 'heroine',
            correctRole: 'hero',
            field: 'heroine',
            confidence: 95,
            reason: `Male actor "${name}" listed as heroine, should be hero`,
          });
        }
      }
    }
  }

  // Sort by confidence and year
  misclassifications.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return b.year - a.year;
  });

  console.log(`📋 Found ${misclassifications.length} gender role misclassifications\n`);

  // Generate CSV report
  const csvHeader = 'Movie ID,Title,Year,Slug,Person Name,Current Role,Correct Role,Field,Confidence,Reason';
  const csvRows = misclassifications.map(m => {
    const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    return [
      m.movieId,
      escape(m.title),
      m.year,
      escape(m.slug),
      escape(m.personName),
      escape(m.currentRole),
      escape(m.correctRole),
      escape(m.field),
      m.confidence,
      escape(m.reason),
    ].join(',');
  });

  const csvPath = path.join(process.cwd(), 'GENDER-ROLE-MISCLASSIFICATIONS.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');

  // Generate summary
  const byPerson = new Map<string, number>();
  misclassifications.forEach(m => {
    const count = byPerson.get(m.personName) || 0;
    byPerson.set(m.personName, count + 1);
  });

  console.log('📊 Summary by Person:\n');
  const sortedPersons = Array.from(byPerson.entries()).sort((a, b) => b[1] - a[1]);
  sortedPersons.slice(0, 20).forEach(([name, count]) => {
    console.log(`   ${name}: ${count} misclassifications`);
  });

  console.log(`\n📝 Detailed report saved to: ${csvPath}\n`);
  console.log('✨ Audit complete!\n');
}

auditGenderRoleMisclassifications().catch(console.error);
