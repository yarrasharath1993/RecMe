import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieFix {
  year: number;
  title: string;
  director: string;
  hero: string;
  heroine: string;
  genre?: string;
  status?: string;
}

// 1963 Movies - Audited Data (24 movies)
const FIXES_1963: MovieFix[] = [
  { year: 1963, title: 'Aapta Mitrulu', director: 'S.K.S. Prasada Rao', hero: 'N.T. Rama Rao, Kanta Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Aaptha Mithrulu', director: 'S.K.S. Prasada Rao', hero: 'N.T. Rama Rao, Kanta Rao', heroine: 'Krishna Kumari', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1963, title: 'Anuragam', director: 'G. Ramineedu', hero: 'Chalam', heroine: 'G. Varalakshmi, Sowcar Janaki', genre: 'Drama' },
  { year: 1963, title: 'Bandipotu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari, Rajasree', genre: 'Action, Folklore' },
  { year: 1963, title: 'Chaduvukunna Ammayilu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri, Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Constable Koothuru', director: 'Tapi Chanakya', hero: 'Kanta Rao, Jaggayya', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Deva Sundari', director: 'H.M. Reddy', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
  { year: 1963, title: 'Edureeta', director: 'B.S. Narayana', hero: 'N.T. Rama Rao, Jaggayya', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1963, title: 'Eedu Jodu', director: 'K.B. Tilak', hero: 'N.T. Rama Rao', heroine: 'Sowcar Janaki', genre: 'Drama' },
  { year: 1963, title: 'Irugu Porugu', director: 'I.N. Murthy', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Lakshadhikari', director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Manchi Chedu', director: 'T.R. Ramanna', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Naga Devata', director: 'K.S.R. Das', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
  { year: 1963, title: 'Paruvu Prathishta', director: 'Manapuram Appa Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1963, title: 'Paruvu-Prathishta', director: 'Manapuram Appa Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1963, title: 'Paruvu-Prathishtta', director: 'Manapuram Appa Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1963, title: 'Pempudu Koothuru', director: 'B.R. Panthulu', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1963, title: 'Punarjanma', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Savati Koduku', director: 'Y.R. Swamy', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1963, title: 'Somavara Vratha Mahathyam', director: 'R.M. Krishnaswamy', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Devotional' },
  { year: 1963, title: 'Sri Tirupatamma Katha', director: 'B.S. Narayana', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1963, title: 'Thalli Biddalu', director: 'K.B. Tilak', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1963, title: 'Thobuttuvulu', director: 'C. Pullaiah', hero: 'N.T. Rama Rao, Jaggayya', heroine: 'Savitri', genre: 'Drama' },
  { year: 1963, title: 'Valmiki', director: 'C.S. Rao', hero: 'N.T. Rama Rao, Kanta Rao', heroine: 'Rajasree', genre: 'Mythological' },
  { year: 1963, title: 'Vishnu Maya', director: 'N.S. Varma', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
];

// 1962 Movies - Audited Data (20 movies)
const FIXES_1962: MovieFix[] = [
  { year: 1962, title: 'Aasha Jeevulu', director: 'B.S. Ranga', hero: 'Akkineni Nageswara Rao, Jaggayya', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1962, title: 'Aathma Bandhuvu', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1962, title: 'Appaginthalu', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1962, title: 'Chitti Tammudu', director: 'K.B. Tilak', hero: 'N.T. Rama Rao, Kanta Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1962, title: 'Dakshayagnam', director: 'C.H. Narayana Murthy', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Mythological' },
  { year: 1962, title: 'Gaali Medalu', director: 'B.R. Panthulu', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1962, title: 'Gulebakavali Katha', director: 'N.T. Rama Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Folklore, Fantasy' },
  { year: 1962, title: 'Kalimilemulu', director: 'G. Ramineedu', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1962, title: 'Khaidi Kannayya', director: 'B. Vittalacharya', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Action' },
  { year: 1962, title: 'Madana Kamaraju Katha', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Folklore' },
  { year: 1962, title: 'Manchi Manasulu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama, Classic' },
  { year: 1962, title: 'Mohini Rukmangada', director: 'K.S. Prakash Rao', hero: 'N.T. Rama Rao, Kanta Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1962, title: 'Nagarjuna', director: 'Y.V. Rao', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Historical' },
  { year: 1962, title: 'Nichaya Thamboolam', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1962, title: 'Padandi Mundhuku', director: 'V. Madhusudhana Rao', hero: 'Jaggayya', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1962, title: 'Padandi Munduku', director: 'V. Madhusudhana Rao', hero: 'Jaggayya', heroine: 'Krishna Kumari', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1962, title: 'Samrat Pruthviraj', director: 'Hunsur Krishnamurthy', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Historical' },
  { year: 1962, title: 'Siri Sampadalu', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1962, title: 'Swarna Gowri', director: 'Y.R. Swamy', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Devotional' },
  { year: 1962, title: 'Swarna Manjari', director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Folklore' },
];

// 1961 Movies - Audited Data (25 movies)
const FIXES_1961: MovieFix[] = [
  { year: 1961, title: 'Batasari', director: 'P.S. Ramakrishna Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Bhanumathi, Devika', genre: 'Drama' },
  { year: 1961, title: 'Bava Maradallu', director: 'P.A. Padmanabha Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1961, title: 'Bhakta Jayadeva', director: 'P.V. Rama Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Devotional' },
  { year: 1961, title: 'Bharya Bhartalu', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1961, title: 'Bikari Ramudu', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Action' },
  { year: 1961, title: 'Evaru Donga', director: 'M. Appa Rao', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Action' },
  { year: 1961, title: 'Gullo Pelli', director: 'K.B. Tilak', hero: 'Chalam', heroine: 'Krishna Kumari', genre: 'Comedy' },
  { year: 1961, title: 'Intiki Deepam Illale', director: 'V.N. Reddy', hero: 'N.T. Rama Rao', heroine: 'Savitri, B. Saroja Devi', genre: 'Drama' },
  { year: 1961, title: 'Kalasi Vunte Kaladu Sukham', director: 'Tapi Chanakya', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama, Classic' },
  { year: 1961, title: 'Kanna Koduku', director: 'K.S. Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1961, title: 'Kannyaka Parameswari Mahatmyam', director: 'H.M. Reddy', hero: 'S.V. Ranga Rao', heroine: 'Devika', genre: 'Mythological' },
  { year: 1961, title: 'Korada Veerudu', director: 'K.S.R. Das', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
  { year: 1961, title: 'Krishna Kuchela', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao, Kanta Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1961, title: 'Kula Gothralu', director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1961, title: 'Pelli Kaani Pillalu', director: 'C.S. Rao', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1961, title: 'Pendli Pilupu', director: 'A.V. Seshagiri Rao', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1961, title: 'Rushyasrunga', director: 'H.M. Reddy', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1961, title: 'Sabhash Raja', director: 'P.S. Ramakrishna Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1961, title: 'Santha', director: 'Manapuram Appa Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1961, title: 'Shanta', director: 'Manapuram Appa Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Drama', status: 'DUPLICATE' },
  { year: 1961, title: 'Taxi Ramudu', director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Drama' },
  { year: 1961, title: 'Thandrulu Kodukulu', director: 'K. Hemambaradhara Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1961, title: 'Vagdanam', director: 'Atreya', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1961, title: 'Varalakshmi Vratham', director: 'B. Vittalacharya', hero: 'Kanta Rao', heroine: 'Krishna Kumari', genre: 'Devotional' },
  { year: 1961, title: 'Velugu Needalu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama, Classic' },
];

// 1960 Movies - Audited Data (29 movies)
const FIXES_1960: MovieFix[] = [
  { year: 1960, title: 'Abhimanam', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1960, title: 'Annapurna', director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao, Jaggayya', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1960, title: 'Bhakta Raghunath', director: 'Samudrala Sr.', hero: 'Akkineni Nageswara Rao', heroine: 'Jamuna', genre: 'Devotional' },
  { year: 1960, title: 'Bhatti Vikramarka', director: 'Jampana', hero: 'N.T. Rama Rao, Kanta Rao', heroine: 'Anjali Devi', genre: 'Folklore' },
  { year: 1960, title: 'Chivaraku Migiledi', director: 'Gutha Ramineedu', hero: 'Gummadi, Prabhakar Reddy', heroine: 'Savitri', genre: 'Drama' },
  { year: 1960, title: 'Devanthakudu', director: 'C. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1960, title: 'Jagannatakam', director: 'Amancharla Seshagiri Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1960, title: 'Kadeddulu Ekaram Nela', director: 'Jampana', hero: 'N.T. Rama Rao', heroine: 'Sowcar Janaki', genre: 'Drama' },
  { year: 1960, title: 'Kanna Koothuru', director: 'P.S. Ramakrishna Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1960, title: 'Kula Daivam', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Devotional' },
  { year: 1960, title: 'Kumkuma Rekha', director: 'Y.R. Swamy', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1960, title: 'Maa Babu', director: 'Tatineni Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1960, title: 'Magavari Mayalu', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1960, title: 'Mahakavi Kalidasu', director: 'K. Kameswara Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Historical, Drama' },
  { year: 1960, title: 'Mamaku Tagga Alludu', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1960, title: 'Nammina Bantu', director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1960, title: 'Nithya Kalyanam Paccha Thoranam', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1960, title: 'Pelli Kanuka', director: 'C.V. Sridhar', hero: 'Akkineni Nageswara Rao', heroine: 'Krishna Kumari, B. Saroja Devi', genre: 'Drama' },
  { year: 1960, title: 'Pillalu Techina Challani Rajyam', director: 'B.R. Panthulu', hero: 'Jaggayya', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1960, title: 'Raja Makutam', director: 'B.N. Reddy', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1960, title: 'Ramasundari', director: 'Hunsur Krishnamurthy', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1960, title: 'Rani Ratnaprabha', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Folklore' },
  { year: 1960, title: 'Renukadevi Mahatyam', director: 'K.S. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Mythological' },
  { year: 1960, title: 'Runanubandham', director: 'Vedantam Raghavayya', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1960, title: 'Sahasra Siracheda Apoorva Chinthamani', director: 'S.D. Lal', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1960, title: 'Samajam', director: 'A. Narayana Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1960, title: 'Shanthi Nivasam', director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree, Krishna Kumari', genre: 'Drama' },
  { year: 1960, title: 'Sri Krishna Rayabaram', director: 'Jampana', hero: 'N.T. Rama Rao, Kanta Rao', heroine: '', genre: 'Mythological' },
  { year: 1960, title: 'Vimala', director: 'S.M. Sriramulu Naidu', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
];

// 1959 Movies - Audited Data (19 movies)
const FIXES_1959: MovieFix[] = [
  { year: 1959, title: 'Aalu Magalu', director: 'S.V. Krishna Rao', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Drama' },
  { year: 1959, title: 'Banda Ramudu', director: 'P. Pullaiah', hero: 'N.T. Rama Rao', heroine: 'Savitri', genre: 'Mythological' },
  { year: 1959, title: 'Bhagya Devathai', director: 'Tapi Chanakya', hero: 'Jaggayya', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1959, title: 'Bhaktha Ambareesha', director: 'B.S. Ranga', hero: 'Kanta Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1959, title: 'Illarikam', director: 'Tatineni Prakash Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1959, title: 'Jaya Vijaya', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Folklore' },
  { year: 1959, title: 'Jayabheri', director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1959, title: 'Karmika Vijayam', director: 'M.A. Thirumugam', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1959, title: 'Koothuru Kaapuram', director: 'Sobhanadri Rao', hero: 'Jaggayya', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1959, title: 'Krishna Leelalu', director: 'Jampana', hero: 'Akkineni Nageswara Rao', heroine: 'Rajasree', genre: 'Mythological' },
  { year: 1959, title: 'Manorama', director: 'B. Vittalacharya', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1959, title: 'Pelli Meeda Pelli', director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Comedy' },
  { year: 1959, title: 'Pellinaati Pramanalu', director: 'K.V. Reddy', hero: 'Akkineni Nageswara Rao', heroine: 'Jamuna, Rajasree', genre: 'Drama' },
  { year: 1959, title: 'Raja Malaya Simha', director: 'B.S. Ranga', hero: 'N.T. Rama Rao', heroine: 'Rajasree, Anjali Devi', genre: 'Folklore' },
  { year: 1959, title: 'Rechukka Pagatichukka', director: 'Kamalakara Kameswara Rao', hero: 'N.T. Rama Rao', heroine: 'Sowcar Janaki', genre: 'Drama' },
  { year: 1959, title: 'Sabhash Ramudu', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'Devika', genre: 'Action' },
  { year: 1959, title: 'Sati Sukanya', director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1959, title: 'Sipayi Koothuru', director: 'P. Chengaiah', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1959, title: 'Vachina Kodalu Nachindi', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
];

// 1958 Movies - Audited Data (17 movies)
const FIXES_1958: MovieFix[] = [
  { year: 1958, title: 'Aada Pettanam', director: 'Adurthi Subba Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1958, title: 'Anna Thammudu', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'Jamuna', genre: 'Drama' },
  { year: 1958, title: 'Atha Okinti Kodale', director: 'K.B. Tilak', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1958, title: 'Bhuloka Ramba', director: 'D. Yoganand', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Folklore' },
  { year: 1958, title: 'Chenchu Lakshmi', director: 'B.A. Subba Rao', hero: 'Akkineni Nageswara Rao', heroine: 'Anjali Devi', genre: 'Mythological' },
  { year: 1958, title: 'Etthuku Pai Etthu', director: 'Tapi Chanakya', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1958, title: 'Ganga Gouri Samvadam', director: 'C.K. Sadasivan', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1958, title: 'Inti Guttu', director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', heroine: 'Savitri, Rajasree', genre: 'Drama' },
  { year: 1958, title: 'Manchi Manasuku Manchi Rojulu', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Drama' },
  { year: 1958, title: 'Mundhadugu', director: 'K.S. Prakash Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Drama' },
  { year: 1958, title: 'Parvathi Kalyanam', director: 'Bhaskar Rao', hero: 'N.T. Rama Rao', heroine: 'Krishna Kumari', genre: 'Mythological' },
  { year: 1958, title: 'Raja Nandini', director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Folklore' },
  { year: 1958, title: 'Sobha', director: 'Kamalakara Kameswara Rao', hero: 'N.T. Rama Rao', heroine: 'Anjali Devi', genre: 'Drama' },
  { year: 1958, title: 'Sree Ramanjaneya Yuddham', director: 'S. Rajinikanth', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Mythological' },
  { year: 1958, title: 'Sri Krishna Garadi', director: 'Y.V. Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Mythological' },
  { year: 1958, title: 'Sri Krishna Maya', director: 'C.S. Rao', hero: 'N.T. Rama Rao', heroine: 'Rajasree', genre: 'Mythological' },
  { year: 1958, title: 'Veera Bhaskarudu', director: 'K.B. Nagabhushanam', hero: 'Kanta Rao', heroine: 'Rajasree', genre: 'Folklore' },
];

async function applyFixes() {
  console.log('=== APPLYING 1958-1963 MOVIE FIXES ===\n');
  
  const allFixes = [...FIXES_1963, ...FIXES_1962, ...FIXES_1961, ...FIXES_1960, ...FIXES_1959, ...FIXES_1958];
  let updated = 0;
  let notFound = 0;
  let duplicatesRemoved = 0;
  
  for (const fix of allFixes) {
    // Generate possible slug variations
    const slugBase = fix.title
      .toLowerCase()
      .replace(/[?!.,'"()]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    // Try to find by title and year first
    let { data: movie, error } = await supabase
      .from('movies')
      .select('id, title_en, slug, release_year, director, hero, heroine')
      .eq('release_year', fix.year)
      .eq('is_published', true)
      .or(`title_en.ilike.%${fix.title}%,slug.ilike.%${slugBase}%`)
      .limit(1)
      .single();
    
    if (error || !movie) {
      // Try more flexible search
      const { data: flexMovie } = await supabase
        .from('movies')
        .select('id, title_en, slug, release_year, director, hero, heroine')
        .eq('release_year', fix.year)
        .eq('is_published', true)
        .ilike('title_en', `%${fix.title.split(' ')[0]}%`)
        .limit(1)
        .single();
      
      movie = flexMovie;
    }
    
    if (!movie) {
      console.log(`NOT FOUND: ${fix.title} (${fix.year})`);
      notFound++;
      continue;
    }
    
    // Handle duplicates
    if (fix.status === 'DUPLICATE') {
      const { error: deleteError } = await supabase
        .from('movies')
        .update({ is_published: false, updated_at: new Date().toISOString() })
        .eq('id', movie.id);
      
      if (!deleteError) {
        console.log(`DUPLICATE REMOVED: ${movie.title_en} (${fix.year})`);
        duplicatesRemoved++;
      }
      continue;
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (fix.director) updateData.director = fix.director;
    if (fix.hero) updateData.hero = fix.hero;
    if (fix.heroine !== undefined) updateData.heroine = fix.heroine || null;
    if (fix.genre) updateData.genres = fix.genre.split(', ').map(g => g.trim());
    
    const { error: updateError } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movie.id);
    
    if (!updateError) {
      console.log(`OK: ${movie.title_en} -> Dir: ${fix.director}, Hero: ${fix.hero}, Heroine: ${fix.heroine || 'N/A'}`);
      updated++;
    } else {
      console.log(`ERR: ${movie.title_en} - ${updateError.message}`);
    }
  }
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total fixes attempted: ${allFixes.length}`);
  console.log(`Successfully updated: ${updated}`);
  console.log(`Duplicates removed: ${duplicatesRemoved}`);
  console.log(`Not found: ${notFound}`);
}

applyFixes().catch(console.error);
