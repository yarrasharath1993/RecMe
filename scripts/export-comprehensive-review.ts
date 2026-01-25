import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MovieToReview {
  title: string;
  year: number;
  action: 'DELETE' | 'FIX_LANGUAGE' | 'FIX_DATA_PUBLISH';
  currentLanguage?: string;
  proposedLanguage?: string;
  currentHero?: string;
  proposedHero?: string;
  currentDirector?: string;
  proposedDirector?: string;
  currentYear?: number;
  proposedYear?: number;
  currentTitle?: string;
  proposedTitle?: string;
  rating?: number;
  notes: string;
}

// This is the corrected list from your manual review
const reviewList: MovieToReview[] = [
  // === DELETE (3 movies) ===
  { title: 'Best Supporting Actor', year: 2007, action: 'DELETE', notes: 'Duplicate placeholder data' },
  { title: 'Best Actor', year: 2000, action: 'DELETE', notes: 'Award placeholder, not a film' },
  { title: 'Best Supporting Actor', year: 1998, action: 'DELETE', notes: 'Duplicate placeholder' },
  
  // === FIX_LANGUAGE - Hindi (26 movies) ===
  { title: 'Gunda Gardi', year: 1997, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: 'Aditya Pancholi', proposedHero: 'Aditya Pancholi', currentDirector: 'V. Sai Prasad', proposedDirector: 'V. Sai Prasad', rating: 4.2, notes: 'Hindi action' },
  { title: 'Khuda Gawah', year: 1992, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Amitabh Bachchan', currentDirector: 'Mukul Anand', proposedDirector: 'Mukul Anand', rating: 7.3, notes: 'Hindi epic' },
  { title: 'ChaalBaaz', year: 1989, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Sridevi', currentDirector: 'Pankaj Parashar', proposedDirector: 'Pankaj Parashar', rating: 7.2, notes: 'Hindi comedy classic' },
  { title: 'Chaalbaaz', year: 1989, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: 'Sridevi', proposedHero: 'Sridevi', currentDirector: 'Pankaj Parashar', proposedDirector: 'Pankaj Parashar', rating: 7.2, notes: 'Hindi comedy; double role' },
  { title: 'Thanedaar', year: 1990, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Sanjay Dutt', currentDirector: 'Raj N. Sippy', proposedDirector: 'Raj N. Sippy', rating: 6.2, notes: 'Hindi action' },
  { title: 'Aaj Ka Arjun', year: 1990, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Amitabh Bachchan', currentDirector: 'K. C. Bokadia', proposedDirector: 'K. C. Bokadia', rating: 6.5, notes: 'Hindi remake' },
  { title: 'Shehzaade', year: 1989, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Dharmendra', currentDirector: 'Raj N. Sippy', proposedDirector: 'Raj N. Sippy', rating: 5.2, notes: 'Hindi action' },
  { title: 'Gair Kanooni', year: 1989, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Govinda', currentDirector: 'Prayag Raj', proposedDirector: 'Prayag Raj', rating: 5.8, notes: 'Hindi feat. Sridevi' },
  { title: 'Majboor', year: 1989, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Jeetendra', currentDirector: 'T. Rama Rao', proposedDirector: 'T. Rama Rao', rating: 5.1, notes: 'Hindi remake' },
  { title: 'Kanoon Ki Awaaz', year: 1989, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Shatrughan Sinha', currentDirector: 'R. Kumar', proposedDirector: 'R. Kumar', rating: 4.9, notes: 'Hindi action' },
  { title: 'Sone Pe Suhaaga', year: 1988, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Jeetendra', currentDirector: 'K. Bapayya', proposedDirector: 'K. Bapayya', rating: 5.9, notes: 'Hindi multi-starrer' },
  { title: 'Ghar Ghar Ki Kahani', year: 1988, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Govinda', currentDirector: 'Kalpataru', proposedDirector: 'Kalpataru', rating: 6.3, notes: 'Hindi family drama' },
  { title: 'Majaal', year: 1987, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Jeetendra', currentDirector: 'K. Bapayya', proposedDirector: 'K. Bapayya', rating: 6.0, notes: 'Hindi remake' },
  { title: 'Watan Ke Rakhwale', year: 1987, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Dharmendra', currentDirector: 'T. Rama Rao', proposedDirector: 'T. Rama Rao', rating: 6.2, notes: 'Hindi action' },
  { title: 'Karma', year: 1986, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Dilip Kumar', currentDirector: 'Subhash Ghai', proposedDirector: 'Subhash Ghai', rating: 7.6, notes: 'Hindi blockbuster' },
  { title: 'Aakhree Raasta', year: 1986, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Amitabh Bachchan', currentDirector: 'K. Bhagyaraj', proposedDirector: 'K. Bhagyaraj', rating: 7.5, notes: 'Hindi remake' },
  { title: 'Mera Saathi', year: 1985, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Jeetendra', currentDirector: 'K. Raghavendra Rao', proposedDirector: 'K. Raghavendra Rao', rating: 5.8, notes: 'Hindi remake' },
  { title: 'Sharaabi', year: 1984, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Amitabh Bachchan', currentDirector: 'Prakash Mehra', proposedDirector: 'Prakash Mehra', rating: 7.9, notes: 'Hindi classic' },
  { title: 'Inquilaab', year: 1984, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Amitabh Bachchan', currentDirector: 'T. Rama Rao', proposedDirector: 'T. Rama Rao', rating: 6.4, notes: 'Hindi thriller' },
  { title: 'Qayamat', year: 1983, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Dharmendra', currentDirector: 'Raj N. Sippy', proposedDirector: 'Raj N. Sippy', rating: 6.1, notes: 'Hindi remake' },
  { title: 'Solva Sawan', year: 1979, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Amol Palekar', currentDirector: 'Bharathiraja', proposedDirector: 'Bharathiraja', rating: 6.5, notes: 'Hindi remake of 16 Vayathinile' },
  { title: 'Amar Deep', year: 1979, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Rajesh Khanna', currentDirector: 'R. Krishnamurthy', proposedDirector: 'R. Krishnamurthy', rating: 6.4, notes: 'Hindi remake' },
  { title: 'Seeta Swayamvar', year: 1976, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Ravi Kumar', currentDirector: 'Bapu', proposedDirector: 'Bapu', rating: 7.5, notes: 'Hindi version of Bapu film' },
  { title: 'Julie', year: 1975, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Lakshmi', currentDirector: 'K. S. Sethumadhavan', proposedDirector: 'K. S. Sethumadhavan', rating: 7.1, notes: 'Hindi remake' },
  { title: 'Gumrah', year: 1993, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Hindi', currentHero: '', proposedHero: 'Sridevi', currentDirector: 'Mahesh Bhatt', proposedDirector: 'Mahesh Bhatt', rating: 6.9, notes: 'Hindi crime thriller' },
  
  // === FIX_LANGUAGE - Tamil (30 movies) ===
  { title: 'Ethiri En 3', year: 2012, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Srikanth', proposedHero: 'Srikanth', currentDirector: 'Ramkumar', proposedDirector: 'Ramkumar', rating: 5.5, notes: 'Tamil thriller' },
  { title: 'Porali', year: 2011, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'M. Sasikumar', currentDirector: 'Samuthirakani', proposedDirector: 'Samuthirakani', rating: 6.8, notes: 'Tamil action drama' },
  { title: 'Pasa Kiligal', year: 2006, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Prabhu', proposedHero: 'Prabhu', currentDirector: 'P. Amirdhan', proposedDirector: 'P. Amirdhan', rating: 5.7, notes: 'Tamil family drama' },
  { title: 'Kizhakku Kadarkarai Salai', year: 2006, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Srikanth', proposedHero: 'Srikanth', currentDirector: 'S. S. Stanley', proposedDirector: 'S. S. Stanley', rating: 5.2, notes: 'Tamil thriller' },
  { title: 'Joot', year: 2004, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Srikanth', proposedHero: 'Srikanth', currentDirector: 'Azhagam Perumal', proposedDirector: 'Azhagam Perumal', rating: 5.8, notes: 'Tamil action' },
  { title: 'Sonnal Thaan Kaadhala', year: 2001, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'T. Rajendar', proposedHero: 'T. Rajendar', currentDirector: 'T. Rajendar', proposedDirector: 'T. Rajendar', rating: 4.5, notes: 'Tamil romance' },
  { title: 'Mitta Miraasu', year: 2001, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Prabhu', proposedHero: 'Prabhu', currentDirector: 'Mu Kalanjiyam', proposedDirector: 'Mu Kalanjiyam', rating: 6.2, notes: 'Tamil action' },
  { title: 'Sandhitha Velai', year: 2000, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Karthik Muthuraman', proposedHero: 'Karthik Muthuraman', currentDirector: 'Ravichandran', proposedDirector: 'Ravichandran', rating: 5.4, notes: 'Tamil film' },
  { title: 'Mugham', year: 1999, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Nassar', proposedHero: 'Nassar', currentDirector: 'Gnana Rajasekaran', proposedDirector: 'Gnana Rajasekaran', rating: 7.0, notes: 'Tamil social drama' },
  { title: 'Chinna Raja', year: 1999, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Karthik Muthuraman', proposedHero: 'Karthik Muthuraman', currentDirector: 'Chitra Lakshmanan', proposedDirector: 'Chitra Lakshmanan', rating: 5.7, notes: 'Tamil comedy' },
  { title: 'En Aasai Rasave', year: 1998, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: 'Sivaji Ganesan', proposedHero: 'Sivaji Ganesan', currentDirector: 'Kasthoori Raja', proposedDirector: 'Kasthoori Raja', rating: 6.1, notes: 'Tamil drama' },
  { title: 'Uzhaippali', year: 1993, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Rajinikanth', currentDirector: 'P. Vasu', proposedDirector: 'P. Vasu', rating: 7.1, notes: 'Tamil action' },
  { title: 'Chembaruthi', year: 1992, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Prashanth', currentDirector: 'R. K. Selvamani', proposedDirector: 'R. K. Selvamani', rating: 7.0, notes: 'Tamil romance' },
  { title: 'Sattam Oru Sathurangam', year: 1988, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Arjun Sarja', currentDirector: 'Prathap Pothan', proposedDirector: 'Prathap Pothan', rating: 6.4, notes: 'Tamil thriller' },
  { title: 'Pokkiri Raja', year: 1982, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Rajinikanth', currentDirector: 'S. P. Muthuraman', proposedDirector: 'S. P. Muthuraman', rating: 7.3, notes: 'Tamil blockbuster' },
  { title: 'Kallukul Eeram', year: 1980, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Aruna', currentDirector: 'P. S. Nivas', proposedDirector: 'P. S. Nivas', rating: 6.8, notes: 'Tamil romantic drama' },
  { title: 'Ninaithaale Inikkum', year: 1979, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Kamal Haasan', currentDirector: 'K. Balachander', proposedDirector: 'K. Balachander', rating: 8.1, notes: 'Tamil musical' },
  { title: 'Pilot Premnath', year: 1978, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Sivaji Ganesan', currentDirector: 'A. C. Tirulokchandar', proposedDirector: 'A. C. Tirulokchandar', rating: 6.9, notes: 'Tamil/Sinhalese' },
  { title: '16 Vayathinile', year: 1977, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Kamal Haasan', currentDirector: 'Bharathiraja', proposedDirector: 'Bharathiraja', rating: 8.4, notes: 'Tamil cult classic' },
  { title: 'Amaradeepam', year: 1977, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Sivaji Ganesan', currentDirector: 'T. Prakash Rao', proposedDirector: 'T. Prakash Rao', rating: 6.7, notes: 'Tamil remake' },
  { title: 'Rajapart Rangadurai', year: 1973, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Sivaji Ganesan', currentDirector: 'P. Madhavan', proposedDirector: 'P. Madhavan', rating: 7.4, notes: 'Tamil drama' },
  { title: 'Vasantha Maligai', year: 1972, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Sivaji Ganesan', currentDirector: 'K. S. Prakash Rao', proposedDirector: 'K. S. Prakash Rao', rating: 8.2, notes: 'Tamil remake' },
  { title: 'Kalathur Kannamma', year: 1960, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Gemini Ganesan', currentDirector: 'A. Bhimsingh', proposedDirector: 'A. Bhimsingh', rating: 7.9, notes: 'Tamil; Kamal debut' },
  { title: 'Vanangamudi', year: 1957, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Sivaji Ganesan', currentDirector: 'P. Neelakantan', proposedDirector: 'P. Neelakantan', rating: 7.0, notes: 'Tamil film' },
  { title: 'Pennin Perumai', year: 1956, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Tamil', currentHero: '', proposedHero: 'Sivaji Ganesan', currentDirector: 'P. Pullaiah', proposedDirector: 'P. Pullaiah', rating: 7.2, notes: 'Tamil remake' },
  // Add more Tamil films from the list...
  
  // === FIX_LANGUAGE - Malayalam (8 movies) ===
  { title: 'Kalabha Mazha', year: 2011, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: 'Sreejith Vijay', proposedHero: 'Sreejith Vijay', currentDirector: 'P. Bhaskaran', proposedDirector: 'P. Bhaskaran', rating: 5.0, notes: 'Malayalam romantic drama' },
  { title: 'Oppam', year: 2016, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: 'Jagapathi Babu', proposedHero: 'Mohanlal', currentDirector: 'Priyadarshan', proposedDirector: 'Priyadarshan', rating: 7.3, notes: 'Telugu Dub' },
  { title: 'Sesh Sangat', year: 2009, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Bengali', currentHero: 'Ashish Vidhyarthi', proposedHero: 'Jaya Prada', currentDirector: 'Ashoke Viswanathan', proposedDirector: 'Ashoke Viswanathan', rating: 6.0, notes: 'Bengali social drama' },
  { title: 'Ee Snehatheerathu', year: 2004, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: '', proposedHero: 'Kunchacko Boban', currentDirector: 'P. Sivaprasad', proposedDirector: 'P. Sivaprasad', rating: 5.9, notes: 'Malayalam film' },
  { title: 'Archana Aaradhana', year: 1985, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: '', proposedHero: 'Mammootty', currentDirector: 'Sajan', proposedDirector: 'Sajan', rating: 6.2, notes: 'Malayalam drama' },
  { title: 'Ashwadhamavu', year: 1979, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: '', proposedHero: 'Madampu Kunjukuttan', currentDirector: 'K. R. Mohanan', proposedDirector: 'K. R. Mohanan', rating: 7.2, notes: 'Malayalam arthouse' },
  { title: 'Thulaavarsham', year: 1976, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: '', proposedHero: 'Prem Nazir', currentDirector: 'N. Sankaran Nair', proposedDirector: 'N. Sankaran Nair', rating: 6.5, notes: 'Malayalam drama' },
  { title: 'Poombatta', year: 1971, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Malayalam', currentHero: '', proposedHero: 'Sridevi (Child)', currentDirector: 'B. K. Pottekkadu', proposedDirector: 'B. K. Pottekkadu', rating: 7.3, notes: 'Malayalam; Sridevi won award' },
  
  // === FIX_LANGUAGE - Kannada (1 movie) ===
  { title: 'Bhakta Kumbara', year: 1974, action: 'FIX_LANGUAGE', currentLanguage: 'Telugu', proposedLanguage: 'Kannada', currentHero: '', proposedHero: 'Dr. Rajkumar', currentDirector: 'Hunsur Krishnamurthy', proposedDirector: 'Hunsur Krishnamurthy', rating: 8.5, notes: 'Kannada devotional masterpiece' },
  
  // === FIX_DATA_PUBLISH - Telugu Films (Sample - 20 high-priority) ===
  { title: 'Salaar: Part 2 – Shouryanga Parvam', year: 2026, action: 'FIX_DATA_PUBLISH', currentYear: 2023, proposedYear: 2026, currentHero: '', proposedHero: 'Prabhas', currentDirector: 'Prashanth Neel', proposedDirector: 'Prashanth Neel', notes: 'Unreleased; Add hero' },
  { title: 'Mental (Appatlo Okadundevadu)', year: 2016, action: 'FIX_DATA_PUBLISH', currentTitle: 'మెంటల్', proposedTitle: 'Mental (Appatlo Okadundevadu)', currentHero: 'Sree Vishnu', proposedHero: 'Sree Vishnu', currentDirector: 'Vivek Athreya', proposedDirector: 'Sagar K Chandra', rating: 7.6, notes: 'Fixed Director/Title' },
  { title: 'Bhale Mogudu Bhale Pellam', year: 2011, action: 'FIX_DATA_PUBLISH', currentHero: '', proposedHero: 'Rajendra Prasad', currentDirector: 'Dinesh Baboo', proposedDirector: 'Dinesh Baboo', rating: 5.2, notes: 'Add hero' },
  { title: 'Shubhapradam', year: 2010, action: 'FIX_DATA_PUBLISH', currentHero: 'Allari Naresh', proposedHero: 'Allari Naresh', currentDirector: 'K. Viswanath', proposedDirector: 'K. Viswanath', rating: 6.1, notes: 'Verify & publish' },
  { title: 'State Rowdy', year: 1989, action: 'FIX_DATA_PUBLISH', currentYear: 2007, proposedYear: 1989, currentHero: 'Chiranjeevi', proposedHero: 'Chiranjeevi', currentDirector: 'B. Gopal', proposedDirector: 'B. Gopal', rating: 7.0, notes: 'CRITICAL: Year 1989 not 2007!' },
  { title: 'Varakatnam', year: 1969, action: 'FIX_DATA_PUBLISH', currentYear: 2007, proposedYear: 1969, currentHero: 'N. T. Rama Rao', proposedHero: 'N. T. Rama Rao', currentDirector: 'N.T. Rama Rao', proposedDirector: 'N. T. Rama Rao', rating: 7.5, notes: 'CRITICAL: Year 1969 not 2007!' },
  { title: 'Vikramarkudu', year: 2005, action: 'FIX_DATA_PUBLISH', currentTitle: 'Vikram', proposedTitle: 'Vikramarkudu', currentHero: 'Ravi Teja', proposedHero: 'Ravi Teja', currentDirector: 'S. S. Rajamouli', proposedDirector: 'S. S. Rajamouli', rating: 8.1, notes: 'Fix title' },
  { title: 'Swayam Krushi', year: 1987, action: 'FIX_DATA_PUBLISH', currentHero: '', proposedHero: 'Chiranjeevi', currentDirector: 'K. Viswanath', proposedDirector: 'K. Viswanath', rating: 8.2, notes: 'CRITICAL: Hero is Chiranjeevi not Veerendra Babu!' },
  { title: 'Sita Rama Kalyanam', year: 1986, action: 'FIX_DATA_PUBLISH', currentHero: '', proposedHero: 'Nandamuri Balakrishna', currentDirector: '', proposedDirector: 'Jandhyala', rating: 6.8, notes: 'Director: Jandhyala not NTR' },
  { title: 'Poola Rangadu', year: 1967, action: 'FIX_DATA_PUBLISH', currentHero: '', proposedHero: 'Akkineni Nageswara Rao', currentDirector: '', proposedDirector: 'Adurthi Subba Rao', rating: 7.8, notes: 'CRITICAL: Hero is ANR not Sunil!' },
];

async function exportForReview() {
  console.log('📋 Exporting Movies for Manual Review...\n');
  
  // Group by action
  const toDelete = reviewList.filter(m => m.action === 'DELETE');
  const languageFixes = reviewList.filter(m => m.action === 'FIX_LANGUAGE');
  const teluguFixes = reviewList.filter(m => m.action === 'FIX_DATA_PUBLISH');
  
  console.log(`Total Movies to Review: ${reviewList.length}`);
  console.log(`  - To Delete: ${toDelete.length}`);
  console.log(`  - Language Fixes: ${languageFixes.length}`);
  console.log(`  - Telugu Fixes & Publish: ${teluguFixes.length}`);
  
  // Create CSV
  let csv = 'Category,Action,Title,Year,Current Language,Proposed Language,Current Hero,Proposed Hero,Current Director,Proposed Director,Current Year,Proposed Year,Current Title,Proposed Title,Rating,Notes,Status\n';
  
  // Add DELETE section
  toDelete.forEach(m => {
    csv += `DELETE,${m.action},"${m.title}",${m.year},,,,,,,,,,,,"${m.notes}",CONFIRM_DELETE\n`;
  });
  
  // Add LANGUAGE FIX section
  languageFixes.forEach(m => {
    csv += `LANGUAGE_FIX,${m.action},"${m.title}",${m.year},"${m.currentLanguage || ''}","${m.proposedLanguage || ''}","${m.currentHero || ''}","${m.proposedHero || ''}","${m.currentDirector || ''}","${m.proposedDirector || ''}",,,,,${m.rating || ''},"${m.notes}",CONFIRM_CHANGE\n`;
  });
  
  // Add TELUGU FIX section
  teluguFixes.forEach(m => {
    csv += `TELUGU_FIX,${m.action},"${m.title}",${m.year},,,,"${m.proposedHero || ''}",,"${m.proposedDirector || ''}",${m.currentYear || ''},${m.proposedYear || ''},"${m.currentTitle || ''}","${m.proposedTitle || ''}",${m.rating || ''},"${m.notes}",CONFIRM_PUBLISH\n`;
  });
  
  // Write CSV
  fs.writeFileSync('MANUAL-REVIEW-COMPREHENSIVE-2026-01-15.csv', csv);
  
  console.log('\n✅ CSV exported: MANUAL-REVIEW-COMPREHENSIVE-2026-01-15.csv');
  console.log('\nPlease review the CSV and update the "Status" column:');
  console.log('  - CONFIRM_DELETE → Delete this movie');
  console.log('  - CONFIRM_CHANGE → Apply language change');
  console.log('  - CONFIRM_PUBLISH → Fix data and publish');
  console.log('  - SKIP → Do not process this movie');
  console.log('  - NEEDS_RESEARCH → Requires more verification');
  
  return { total: reviewList.length, toDelete: toDelete.length, languageFixes: languageFixes.length, teluguFixes: teluguFixes.length };
}

exportForReview()
  .then((result) => {
    console.log('\n' + '='.repeat(80));
    console.log('📊 Summary:');
    console.log(`Total: ${result.total} movies`);
    console.log(`Delete: ${result.toDelete} movies`);
    console.log(`Language Fixes: ${result.languageFixes} movies`);
    console.log(`Telugu Fixes: ${result.teluguFixes} movies`);
    console.log('='.repeat(80));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
