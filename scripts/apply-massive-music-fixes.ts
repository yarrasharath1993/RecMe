#!/usr/bin/env npx tsx
/**
 * Apply Massive Music Director & Data Fixes from Manual Review
 * Includes hero/director corrections and anomaly fixes
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MovieFix {
  id?: string;
  title: string;
  year: number;
  director?: string;
  hero?: string;
  heroine?: string;
  music_director?: string;
  producer?: string;
}

// Movies with specific IDs that need full fixes
const ID_BASED_FIXES: MovieFix[] = [
  { id: '2611d53a', title: 'Aradhana', year: 1987, director: 'Bharathiraja', hero: 'Chiranjeevi', heroine: 'Suhasini', music_director: 'Ilaiyaraaja', producer: 'Allu Aravind' },
  { id: '985ec4ac', title: 'Samsaram Oka Chadarangam', year: 1987, director: 'S.P. Muthuraman', hero: 'Sarath Babu', heroine: 'Suhasini', music_director: 'K. Chakravarthy', producer: 'M. Balasubramanian' },
  { id: '42a803e4', title: 'Chiranjeevi', year: 1985, director: 'C.V. Rajendran', hero: 'Chiranjeevi', heroine: 'Vijayashanti', music_director: 'K. Chakravarthy', producer: 'K. Lakshmi Devi' },
  { id: 'c53c4327', title: 'Pattabhishekam', year: 1985, director: 'K. Raghavendra Rao', hero: 'Nandamuri Balakrishna', heroine: 'Vijayashanti', music_director: 'K. Chakravarthy', producer: 'Nandamuri Harikrishna' },
  { id: 'e8e681d4', title: 'Rakta Sindhuram', year: 1985, director: 'A. Kodandarami Reddy', hero: 'Chiranjeevi', heroine: 'Radha', music_director: 'K. Chakravarthy', producer: 'A.S.R. Anjaneyulu' },
  { id: '1e238a2f', title: 'Rojulu Marayi', year: 1984, director: 'A. Kodandarami Reddy', hero: 'Chiranjeevi', heroine: 'Poornima', music_director: 'J.V. Raghavulu', producer: 'K.V.V. Satyanarayana' },
  { id: 'ecae4f38', title: 'Devanthakudu', year: 1984, director: 'S.A. Chandrasekhar', hero: 'Chiranjeevi', heroine: 'Jayapradha', music_director: 'J.V. Raghavulu', producer: 'G. Tirupathi Rao' },
  { id: 'ec7b1c9a', title: 'Dharmaatmudu', year: 1983, director: 'B. Bhaskara Rao', hero: 'Krishnam Raju', heroine: 'Jayasudha', music_director: 'Satyam', producer: 'K. Kesava Rao' },
  { id: 'b29ee1b0', title: 'Chalaki Chellamma', year: 1982, director: 'A. Kodandarami Reddy', hero: 'Chiranjeevi', heroine: 'Sunitha', music_director: 'K. Chakravarthy', producer: 'V. Sashidhar' },
  { id: '4573fe79', title: 'Seethakoka Chilaka', year: 1981, director: 'Bharathiraja', hero: 'Karthik', heroine: 'Mucherla Aruna', music_director: 'Ilaiyaraaja', producer: 'Edida Nageswara Rao' },
  { id: '0b58ead7', title: 'Chattaniki Kallu Levu', year: 1981, director: 'S.A. Chandrasekhar', hero: 'Chiranjeevi', heroine: 'Madhavi', music_director: 'K. Chakravarthy', producer: 'A.L. Abhinandhan' },
  { id: '6831aff4', title: 'Kotha Jeevithalu', year: 1980, director: 'Bharathiraja', hero: 'Hari', heroine: 'Suhasini', music_director: 'Ilaiyaraaja', producer: 'Edida Nageswara Rao' },
  { id: 'fbb6add6', title: 'Maavari Manchitanam', year: 1979, director: 'B.A. Subba Rao', hero: 'Gummadi', heroine: 'Sowcar Janaki', music_director: 'K. Chakravarthy', producer: 'B.A. Subba Rao' },
  { id: 'cfb97d2c', title: 'Vetagaadu', year: 1979, director: 'K. Raghavendra Rao', hero: 'N.T. Rama Rao', heroine: 'Sridevi', music_director: 'K. Chakravarthy', producer: 'M. Arjuna Raju' },
  { id: 'df549993', title: 'Shri Rama Bantu', year: 1979, director: 'S.D. Lal', hero: 'Chandra Mohan', heroine: 'Geetha', music_director: 'Satyam', producer: 'Simon Danielsson' },
  { id: 'f1d111a3', title: 'Mugguru Muggure', year: 1978, director: 'S.D. Lal', hero: 'Krishna', heroine: 'Jayachitra', music_director: 'K. Chakravarthy', producer: 'Y.V. Rao' },
];

// Massive music director data from validation batches
const MUSIC_DIRECTOR_FIXES: MovieFix[] = [
  // Batch 1
  { title: 'Sandhya Ragam', year: 1981, director: 'Jandhyala', hero: 'Sarath Babu', music_director: 'Ramesh Naidu' },
  { title: 'Maaya Rambha', year: 1950, director: 'T. Prakash Rao', hero: 'Akkineni Nageswara Rao', music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Kaliyuga Mahabharatam', year: 1979, director: 'V. Hanuman Prasad', hero: 'Narasimha Raju', music_director: 'Satyam' },
  { title: 'Rajakota Rahasyam', year: 1971, director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Adrusta Jathakudu', year: 1971, director: 'K. Hemambadhara Rao', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Vichithra Kutumbam', year: 1971, music_director: 'T.V. Raju' },
  { title: 'Lanke Bindelu', year: 1983, director: 'Vijaya Nirmala', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Vichitra Bandham', year: 1972, director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Ammayilu Jagratha', year: 1975, director: 'P. Sambasiva Rao', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Chandravanka', year: 1951, director: 'V. Nagayya', hero: 'N.T. Rama Rao', music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Iddaru Ammayilu', year: 1971, director: 'S.R. Puttanna Kanagal', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Merupu Daadi', year: 1984, director: 'Raviraja Pinisetty', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Illalu', year: 1981, director: 'T. Rama Rao', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Akhandudu', year: 1970, director: 'V. Ramachandra Rao', hero: 'Krishna', music_director: 'S.P. Kodandapani' },
  { title: 'Manorama', year: 1959, director: 'B. Vittalacharya', hero: 'Kanta Rao', music_director: 'Ramesh Naidu' },
  { title: 'Devalayam', year: 1985, director: 'T. Krishna', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Manushulanta Okkate', year: 1976, director: 'Dasari Narayana Rao', hero: 'N.T. Rama Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Erra Mallelu', year: 1981, director: 'Dhavala Satyam', hero: 'Madala Ranga Rao', music_director: 'K. Chakravarthy' },
  { title: 'Maa Bhoomi', year: 1980, director: 'Goutam Ghose', hero: 'Sai Chand', music_director: 'Vinjanuri Seetha Devi' },
  { title: 'Jeevana Tarangalu', year: 1973, director: 'Tatineni Rama Rao', hero: 'Sobhan Babu', music_director: 'K.V. Mahadevan' },
  { title: 'Vindhyarani', year: 1948, director: 'C. Pullaiah', hero: 'Akkineni Nageswara Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Kula Gowravam', year: 1972, director: 'Peketi Sivaram', hero: 'N.T. Rama Rao', music_director: 'T.G. Lingappa' },
  { title: 'Dharma Daata', year: 1970, director: 'A. Sanjeevi', hero: 'Akkineni Nageswara Rao', music_director: 'T.V. Raju' },
  { title: 'Oke Kutumbham', year: 1970, director: 'A. Bhimsingh', hero: 'N.T. Rama Rao', music_director: 'S.P. Kodandapani' },
  { title: 'Jagamondi', year: 1981, director: 'V. Madhusudan Rao', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Brahmachari', year: 1968, director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', music_director: 'T.V. Raju' },
  { title: 'Pedda Akkayya', year: 1967, director: 'B.A. Subba Rao', hero: 'Haranath', music_director: 'Master Venu' },
  { title: 'Talli Prema', year: 1941, director: 'Jyotish Sinha', music_director: 'S.B. Dinakar Rao' },
  { title: 'Rajakeeya Chadarangam', year: 1989, director: 'A. Kodandarami Reddy', hero: 'Krishna', music_director: 'Raj-Koti' },
  { title: 'Kula Gothralu', year: 1961, director: 'K. Pratyagatma', hero: 'Akkineni Nageswara Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Mantra Dandam', year: 1951, director: 'K.S. Ramachandra Rao', music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Muggure Mugguru', year: 1978, director: 'S.D. Lal', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Pedda Manushulu', year: 1999, director: 'Boyina Subba Rao', hero: 'Suman', music_director: 'S.A. Rajkumar' },
  { title: 'Krishnaveni', year: 1974, director: 'V. Madhusudhana Rao', hero: 'Krishnam Raju', music_director: 'Vijaya Bhaskar' },
  { title: 'Pichi Pantuulu', year: 1983, director: 'Jandhyala', hero: 'Chandra Mohan', music_director: 'Ramesh Naidu' },
  { title: 'Deva Sundari', year: 1963, director: 'H.M. Reddy', hero: 'Kanta Rao', music_director: 'Ghantasala' },
  { title: 'Adambaralu Anubandhalu', year: 1974, director: 'K. Vasu', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Cancer-Sukhavyadhulu', year: 1982, director: 'M. Prabhakar Reddy', music_director: 'K. Chakravarthy' },
  { title: 'Tholi Kodi Koosindi', year: 1980, director: 'K. Balachander', hero: 'Sarath Babu', music_director: 'M.S. Viswanathan' },
  { title: 'Bharya Biddalu', year: 1972, director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Sri Tirupatamma Katha', year: 1964, director: 'B.S. Narayana', hero: 'N.T. Rama Rao', music_director: 'Pamarthi' },
  { title: 'Manase Mandiram', year: 1966, director: 'C.V. Sridhar', hero: 'Akkineni Nageswara Rao', music_director: 'M.S. Viswanathan' },
  { title: 'Natakala Rayudu', year: 1969, director: 'A. Sanjeevi', hero: 'Nagabhushanam', music_director: 'G.K. Venkatesh' },
  { title: 'Magallako Namaskaram', year: 1983, director: 'Bhavaniprasad', hero: 'Chandra Mohan', music_director: 'Satyam' },
  { title: 'Manushulu Marali', year: 1969, director: 'V. Madhusudhan Rao', hero: 'Sobhan Babu', music_director: 'K.V. Mahadevan' },
  { title: 'Muthyala Pallaki', year: 1976, director: 'Dasari Narayana Rao', hero: 'Narasinga Rao', music_director: 'Satyam' },
  { title: 'Kattula Kondayya', year: 1985, director: 'K.S.R. Das', hero: 'Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Yagnam', year: 2004, director: 'A.S. Ravi Kumar Chowdary', hero: 'Gopichand', music_director: 'Mani Sharma' },
  { title: 'Murali Krishna', year: 1964, director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', music_director: 'Master Venu' },
  { title: 'Chinninati Kalalu', year: 1975, director: 'K. Vasu', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Muthyamantha Muddu', year: 1989, director: 'Ravi Raja Pinisetty', hero: 'Rajendra Prasad', music_director: 'Hamsalekha' },
  { title: 'Dharmangadha', year: 1949, director: 'P. Pullaiah', music_director: 'G. Aswathama' },
  { title: 'Paila Pacheesu', year: 1989, director: 'T.S.B.K. Moulee', hero: 'Rajendra Prasad', music_director: 'Raj-Koti' },
  { title: 'Balipeetam', year: 1975, director: 'Dasari Narayana Rao', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Brahma Rudrulu', year: 1986, director: 'K. Murali Mohan Rao', music_director: 'K. Chakravarthy' },
  { title: 'Manjari', year: 1953, director: 'Y.V. Rao', music_director: 'H.R. Padmanabha Sastry' },
  { title: 'Vivaha Bandham', year: 1964, director: 'P.S. Ramakrishna Rao', hero: 'N.T. Rama Rao', music_director: 'M.B. Srinivasan' },
  { title: 'Visala Hrudayalu', year: 1965, director: 'B.S. Narayana', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Mahatmudu', year: 1976, director: 'M.S. Gopinath', hero: 'Akkineni Nageswara Rao', music_director: 'T. Chalapathi Rao' },
  { title: 'Balaraju', year: 1948, director: 'Ghantasala Balaramaiah', hero: 'Akkineni Nageswara Rao', music_director: 'Ghantasala' },
  { title: 'Adavalle Aligithe', year: 1983, director: 'Vejella Satyanarayana', hero: 'Gummadi', music_director: 'Krishna-Chakra' },
  { title: 'Gunavanthudu', year: 1975, director: 'Adurthi Subba Rao', hero: 'N.T. Rama Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Memu Manushulame', year: 1973, director: 'K. Babu Rao', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Aadhani Adrustam', year: 1975, director: 'G.V.R. Seshagiri Rao', hero: 'Chalam', music_director: 'Satyam' },
  { title: 'Raju Vedale', year: 1976, director: 'Tatineni Rama Rao', hero: 'N.T. Rama Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Srivari Muchatlu', year: 1981, director: 'Dasari Narayana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'Satyam' },
  { title: 'Sarangadhara', year: 1957, director: 'V.S. Raghavan', hero: 'N.T. Rama Rao', music_director: 'G. Ramanathan' },
  { title: 'Kanna Koduku', year: 1973, director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'P. Adinarayana Rao' },
  { title: 'Moguda? Pellama?', year: 1975, director: 'K. Vasu', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Kalahasti Mahatyam', year: 1954, director: 'H.L.N. Simha', hero: 'Rajkumar', music_director: 'R. Sudharsanam' },
  { title: 'Sati Arundhati', year: 1968, director: 'K.V. Nandan Rao', hero: 'Kanta Rao', music_director: 'S.P. Kodandapani' },
  { title: 'Pratignapalana', year: 1965, director: 'C.S. Rao', hero: 'Kanta Rao', music_director: 'S.P. Kodandapani' },
  { title: 'Triveni Sangamam', year: 1983, director: 'Kommineni', hero: 'Murali Mohan', music_director: 'J.V. Raghavulu' },
  { title: 'Acharya', year: 2022, director: 'Koratala Siva', hero: 'Chiranjeevi', music_director: 'Mani Sharma' },
  { title: 'Iddaru Monagallu', year: 1967, director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', music_director: 'S.D. Batish' },
  { title: 'Kode Nagu', year: 1974, director: 'K.S. Prakash Rao', hero: 'Sobhan Babu', music_director: 'K.V. Mahadevan' },
  { title: 'Praja Rajyam', year: 1983, director: 'M. Mallikarjuna Rao', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Ramudu Bheemudu', year: 1964, director: 'Tapi Chanakya', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Palleturi Pidugu', year: 1983, director: 'B. Vittalacharya', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Padmavathi Kalyanam', year: 1983, director: 'K. Vasu', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Raghu Ramudu', year: 1983, director: 'Kommineni', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Ugra Narasimham', year: 1986, director: 'Dasari Narayana Rao', hero: 'Balakrishna', music_director: 'Satyam' },
  { title: 'Dharma Devatha', year: 1952, director: 'P. Pullaiah', music_director: 'C.R. Subbaraman' },
  { title: 'Pushpaka Vimanam', year: 1987, director: 'Singeetam Srinivasa Rao', hero: 'Kamal Haasan', music_director: 'L. Vaidyanathan' },
  { title: 'Hantakulu Devantakulu', year: 1972, director: 'K.S.R. Das', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Bhatti Vikramarka', year: 1960, director: 'Jampana', music_director: 'Pendyala' },
  { title: 'Jeevitham', year: 1950, director: 'M.V. Raman', music_director: 'R. Sudharsanam' },
  { title: 'Gumastha', year: 1953, director: 'R.M. Krishnaswamy', music_director: 'G. Ramanathan' },
  { title: 'Gaanam', year: 1982, director: 'K. Raghunath', hero: 'Sridhar', music_director: 'K. Chakravarthy' },
  { title: 'Harischandrudu', year: 1981, director: 'U. Visweswara Rao', hero: 'Murali Mohan', music_director: 'T. Chalapathi Rao' },
  { title: 'Pandanti Kapuram', year: 1972, director: 'Lakshmi Deepak', hero: 'Krishna', music_director: 'S.P. Kodandapani' },
  { title: 'Rudrakali', year: 1983, director: 'K. Raghunath', hero: 'Lakshmi', music_director: 'Satyam' },
  { title: 'Disco King', year: 1984, director: 'T. Prasad', hero: 'Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Vande Mataram', year: 1939, director: 'B.N. Reddy', hero: 'V. Nagaiah', music_director: 'V. Nagaiah' },
  { title: 'Nirdoshi', year: 1967, director: 'V. Madhusudhana Rao', hero: 'N.T. Rama Rao', music_director: 'Ghantasala' },
  { title: 'Prameelarjuneeyam', year: 1965, director: 'M. Mallikarjuna Rao', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Veerabhimanyu', year: 1965, director: 'V. Madhusudhana Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Bhama Kalapam', year: 1988, director: 'Rajendra Prasad', hero: 'Rajendra Prasad', music_director: 'Vasu Rao' },
  { title: 'Melukolupu', year: 1956, director: 'K.S. Prakash Rao', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Swarna Manjari', year: 1962, director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', music_director: 'P. Adinarayana Rao' },

  // Batch 2 - VIP 2 and more
  { title: 'Harishchandra', year: 1956, director: 'K. Kameswara Rao', hero: 'N.T. Rama Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Pralaya Rudrudu', year: 1982, director: 'A. Kodandarami Reddy', hero: 'Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Panthulamma', year: 1977, director: 'Singeetam Srinivasa Rao', hero: 'Ranganath', music_director: 'Rajan-Nagendra' },
  { title: 'Suvarnamala', year: 1948, director: 'Ghantasala Balaramaiah', hero: 'Akkineni Nageswara Rao', music_director: 'Ghantasala' },
  { title: 'Kaliyuga Ravanasurudu', year: 1980, director: 'K. Bapaiah', hero: 'Krishnam Raju', music_director: 'K. Chakravarthy' },
  { title: 'Zamindarugari Ammayi', year: 1975, director: 'Singeetam Srinivasa Rao', hero: 'Krishna', music_director: 'G.K. Venkatesh' },
  { title: 'Sankranti', year: 1952, director: 'C. Pullaiah', hero: 'N.T. Rama Rao', music_director: 'Aswathama' },
  { title: 'Baalanandam', year: 1954, director: 'K.S. Prakash Rao', music_director: 'Pendyala' },
  { title: 'Anta Manavalle', year: 1954, director: 'Tapi Chanakya', hero: 'Jaggayya', music_director: 'Master Venu' },
  { title: 'Simha Garjana', year: 1978, director: 'Kommineni', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Bangaru Bommalu', year: 1977, director: 'V.B. Rajendra Prasad', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Dhanama? Daivama?', year: 1973, director: 'C.S. Rao', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Meghasandesam', year: 1982, director: 'Dasari Narayana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'Ramesh Naidu' },
  { title: 'Bandipotu Dongalu', year: 1968, director: 'K.S. Prakash Rao', hero: 'Akkineni Nageswara Rao', music_director: 'Pendyala' },
  { title: 'Mahakavi Kshetrayya', year: 1976, director: 'C.S. Rao', hero: 'Akkineni Nageswara Rao', music_director: 'P. Adinarayana Rao' },
  { title: 'Chinnari Papalu', year: 1968, director: 'Savitri', hero: 'Jaggayya', music_director: 'P. Adinarayana Rao' },
  { title: 'Manchi Babai', year: 1978, director: 'T. Krishna', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Vichitra Kutumbam', year: 1969, music_director: 'T.V. Raju' },
  { title: 'Navaratri', year: 1966, director: 'T. Rama Rao', hero: 'Akkineni Nageswara Rao', music_director: 'T.V. Raju' },
  { title: 'Lakshmana Rekha', year: 1975, director: 'N. Gopala Krishna', hero: 'Chandra Mohan', music_director: 'Satyam' },
  { title: 'Puttinti Gowravam', year: 1975, director: 'Dasari Narayana Rao', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Dhanavanthulu Gunavanthulu', year: 1974, director: 'K. Varaprasad', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'VIP 2', year: 2017, director: 'Soundarya Rajinikanth', hero: 'Dhanush', music_director: 'Sean Roldan' },
  { title: 'Beedhala Aasthi', year: 1955, director: 'D.L. Ramachander', hero: 'N.T. Rama Rao', music_director: 'Master Venu' },
  { title: 'Peddalu Maarali', year: 1974, director: 'P. Chandrasekhara Reddy', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Aatmiyudu', year: 1977, director: 'T. Lenin Babu', hero: 'Akkineni Nageswara Rao', music_director: 'J.V. Raghavulu' },
  { title: 'Adugu Jaadalu', year: 1966, director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', music_director: 'Master Venu' },
  { title: 'Kanyashulkam', year: 1955, director: 'P. Pullaiah', hero: 'N.T. Rama Rao', music_director: 'Ghantasala' },
  { title: 'Pancha Bhoothalu', year: 1979, director: 'P.C. Reddy', hero: 'Chandra Mohan', music_director: 'Satyam' },
  { title: 'Kanna Koduku', year: 1961, director: 'K.S. Prakash Rao', hero: 'Akkineni Nageswara Rao', music_director: 'S.P. Kodandapani' },
  { title: 'Thaali Bottu', year: 1970, director: 'M. Mallikarjuna Rao', hero: 'Krishna', music_director: 'T.V. Raju' },
  { title: 'Eenadu', year: 1982, director: 'P. Sambasiva Rao', hero: 'Krishna', music_director: 'J.V. Raghavulu' },
  { title: 'Thota Ramudu', year: 1975, director: 'Dasari Narayana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'M.S. Viswanathan' },
  { title: 'Saptaswaralu', year: 1969, director: 'Vedantam Raghavayya', hero: 'Kanta Rao', music_director: 'T.V. Raju' },
  { title: 'Dongala Dopidi', year: 1978, director: 'M. Mallikarjuna Rao', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Kambojaraju Katha', year: 1967, director: 'K. Kameswara Rao', hero: 'Kanta Rao', music_director: 'T.V. Raju' },
  { title: 'Amma Manasu', year: 1974, director: 'K. Viswanath', hero: 'Chalam', music_director: 'K.V. Mahadevan' },
  { title: 'Prema Sagaram', year: 1983, director: 'T. Rajendar', hero: 'T. Rajendar', music_director: 'T. Rajendar' },
  { title: 'Karthika Deepam', year: 1979, director: 'Lakshmi Deepak', hero: 'Sobhan Babu', music_director: 'Satyam' },
  { title: 'Nagarjuna', year: 1962, director: 'Y.V. Rao', hero: 'Kanta Rao', music_director: 'Rajan-Nagendra' },
  { title: 'Samsaram Sagaram', year: 1973, director: 'Dasari Narayana Rao', hero: 'S.V. Ranga Rao', music_director: 'Ramesh Naidu' },
  { title: 'Koduku Kodalu', year: 1972, director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Datta Putrudu', year: 1972, director: 'T. Lenin Babu', hero: 'Akkineni Nageswara Rao', music_director: 'T. Chalapathi Rao' },
  { title: 'Neeti-Nijayiti', year: 1972, director: 'C.S. Rao', hero: 'Krishna', music_director: 'S.P. Kodandapani' },
  { title: 'Varalakshmi Vratam', year: 1971, director: 'B. Vittalacharya', hero: 'Krishna', music_director: 'T.V. Raju' },
  { title: 'Bhale Mastaru', year: 1969, director: 'S.D. Lal', music_director: 'T.V. Raju' },
  { title: 'Driver Ramudu', year: 1979, director: 'K. Raghavendra Rao', hero: 'N.T. Rama Rao', music_director: 'K. Chakravarthy' },
  { title: 'Edureeta', year: 1977, director: 'V. Madhusudhan Rao', hero: 'N.T. Rama Rao', music_director: 'K. Chakravarthy' },
  { title: 'Bhagya Chakramu', year: 1968, director: 'K.V. Reddy', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Devata', year: 1965, director: 'K. Hemambaradhara Rao', hero: 'N.T. Rama Rao', music_director: 'S.P. Kodandapani' },
  { title: 'Bangaru Kanuka', year: 1982, director: 'Vamsi', hero: 'Akkineni Nageswara Rao', music_director: 'Satyam' },
  { title: 'Dharma Chakram', year: 1980, director: 'Lakshmi Deepak', hero: 'Sobhan Babu', music_director: 'Satyam' },
  { title: 'Sriranga Neethulu', year: 1983, director: 'A. Kodandarami Reddy', hero: 'Akkineni Nageswara Rao', music_director: 'Satyam' },
  { title: 'Manishiko Chartira', year: 1982, hero: 'Murali Mohan', music_director: 'J.V. Raghavulu' },
  { title: 'Bullet', year: 1985, director: 'Bapu', hero: 'Krishnam Raju', music_director: 'M.S. Viswanathan' },
  { title: 'Vamsha Gowravam', year: 1982, director: 'Dasari Narayana Rao', hero: 'Krishnam Raju', music_director: 'Ramesh Naidu' },
  { title: 'Swara Kalpana', year: 1989, director: 'Vamsi', hero: 'Suman', music_director: 'Gangai Amaran' },
  { title: 'Nireekshana', year: 1986, director: 'Balu Mahendra', hero: 'Bhanu Chander', music_director: 'Ilaiyaraaja' },
  { title: 'Police Venkataswamy', year: 1983, director: 'Sivachandran', hero: 'Rajinikanth', music_director: 'Ilaiyaraaja' },
  { title: 'Babruvahana', year: 1964, director: 'Samudrala Sr.', hero: 'N.T. Rama Rao', music_director: 'Paamarthi' },
  { title: 'Anna Thammudu', year: 1958, director: 'C.S. Rao', hero: 'N.T. Rama Rao', music_director: 'Aswathama' },
  { title: 'Palnati Yuddham', year: 1947, music_director: 'Galipenchala' },
  { title: 'Srivari Shobanam', year: 1985, director: 'Jandhyala', hero: 'Naresh', music_director: 'Ramesh Naidu' },
  { title: 'Aalapana', year: 1985, director: 'Vamsi', hero: 'Mohan', music_director: 'Ilaiyaraaja' },
  { title: 'Iddaru Kodukulu', year: 1982, director: 'D. Yoganand', music_director: 'M.S. Viswanathan' },
  { title: 'Swapna', year: 1981, director: 'Dasari Narayana Rao', hero: 'Raja', music_director: 'Satyam' },
  { title: 'Kala Yamudu', year: 1983, director: 'K.S.R. Das', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Maha Purushudu', year: 1981, director: 'Lakshmi Deepak', hero: 'N.T. Rama Rao', music_director: 'Satyam' },
  { title: 'Mangalasutram', year: 1966, director: 'A.K. Velan', hero: 'N.T. Rama Rao', music_director: 'T. Chalapathi Rao' },
  { title: 'Circar Express', year: 1968, director: 'K.S.R. Das', hero: 'Krishna', music_director: 'T.V. Raju' },
  { title: 'Poola Pallaki', year: 1982, director: 'K. Vasu', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Yamapaasam', year: 1989, director: 'A. Kodandarami Reddy', hero: 'Rajasekhar', music_director: 'Raj-Koti' },
  { title: 'Khaidi Kannayya', year: 1962, director: 'B. Vittalacharya', hero: 'Kanta Rao', music_director: 'Rajan-Nagendra' },
  { title: 'Thene Manasulu', year: 1987, director: 'Rajendra Prasad', hero: 'Rajendra Prasad', music_director: 'Raj-Koti' },
  { title: 'Shrimati', year: 1966, director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'T.V. Raju' },
  { title: 'Pellinaati Pramanalu', year: 1958, director: 'K.V. Reddy', hero: 'Akkineni Nageswara Rao', music_director: 'Ghantasala' },
  { title: 'Vamsy', year: 1982, director: 'Kodi Ramakrishna', music_director: 'Satyam' },
  { title: 'Samsaram', year: 1950, director: 'L.V. Prasad', music_director: 'S. Rajeswara Rao' },
  { title: 'Vivaha Bhojanambu', year: 1988, director: 'Jandhyala', hero: 'Rajendra Prasad', music_director: 'S.P. Balasubrahmanyam' },
  { title: 'Vaddante Dabbu', year: 1954, director: 'Y.R. Swamy', hero: 'N.T. Rama Rao', music_director: 'T.A. Kalyanam' },
  { title: 'Nadamanthrapu Siri', year: 1968, director: 'T. Rama Rao', hero: 'Haranath', music_director: 'T.V. Raju' },
  { title: 'Repati Pourulu', year: 1986, director: 'T. Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Chitti Tammudu', year: 1962, director: 'K.B. Tilak', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Pethamdaarlu', year: 1970, director: 'C.S. Rao', music_director: 'T.V. Raju' },
  { title: 'Katakataala Rudraiah', year: 1978, director: 'Dasari Narayana Rao', hero: 'Krishnam Raju', music_director: 'J.V. Raghavulu' },
  { title: 'Ooruki Monagadu', year: 1981, director: 'K. Raghavendra Rao', hero: 'Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Bantrotu Bharya', year: 1974, director: 'Dasari Narayana Rao', hero: 'Chalam', music_director: 'Ramesh Naidu' },
  { title: 'Babulugaadi Debba', year: 1981, director: 'K. Vasu', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Inti Kodalu', year: 1974, director: 'Lakshmi Deepak', music_director: 'Satyam' },
  { title: 'Preminchi Choodu', year: 1965, director: 'P. Pullaiah', hero: 'Akkineni Nageswara Rao', music_director: 'Master Venu' },
  { title: 'Radhamma Mogudu', year: 1982, director: 'A. Kodandarami Reddy', hero: 'Krishnam Raju', music_director: 'K. Chakravarthy' },
  { title: 'Pandanti Samsaram', year: 1975, director: 'Dasari Narayana Rao', hero: 'Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Marapurani Manishi', year: 1973, director: 'Tatineni Rama Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Ardharathiri', year: 1969, director: 'P. Sambasiva Rao', hero: 'Jaggayya', music_director: 'Master Venu' },
  { title: 'Muddula Krishnaiah', year: 1986, director: 'A. Kodandarami Reddy', hero: 'Balakrishna', music_director: 'S. Rajeswara Rao' },
  { title: 'Sankalpam', year: 1957, director: 'C.V. Ranganatha Dasu', hero: 'N.T. Rama Rao', music_director: 'Susarla Dakshinamurthi' },
  { title: 'Raakasi Loya', year: 1983, director: 'Vijaya Nirmala', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Challenge Vetagallu', year: 1983, director: 'A. Kodandarami Reddy', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Chandrahasa', year: 1941, director: 'M.L. Raghunath', hero: 'V. Nagayya', music_director: 'V. Nagayya' },

  // Batch 3 - Donga Ramudu and more
  { title: 'Donga Ramudu', year: 1988, director: 'K. Raghavendra Rao', hero: 'N. Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Devudu Mamayya', year: 1981, director: 'K. Vasu', hero: 'Sobhan Babu', music_director: 'J.V. Raghavulu' },
  { title: 'Jailu Pakshi', year: 1986, director: 'Kodi Ramakrishna', hero: 'Rajendra Prasad', music_director: 'K. Chakravarthy' },
  { title: 'Gunasundari Katha', year: 1949, director: 'K.V. Reddy', music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Sri Saibaba', year: 1950, director: 'P. Pullaiah', hero: 'N.T. Rama Rao', music_director: 'Saluri Rajeswara Rao' },
  { title: 'Punyasthree', year: 1986, director: 'Muthyala Subbaiah', hero: 'Rajendra Prasad', music_director: 'K. Chakravarthy' },
  { title: 'Mahalakshmi', year: 1980, director: 'Singeetam Srinivasa Rao', hero: 'J.V. Somayajulu', music_director: 'G.K. Venkatesh' },
  { title: 'Malle Pandiri', year: 1982, director: 'Jandhyala', hero: 'S.P. Balasubrahmanyam', music_director: 'Ramesh Naidu' },
  { title: 'Makutamleni Maharaju', year: 1987, director: 'K. Bapaiah', hero: 'Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Grahanam Vidichindi', year: 1983, director: 'Murali Mohan', hero: 'Rajendra Prasad', music_director: 'Ramesh Naidu' },
  { title: 'Prema Sankellu', year: 1982, director: 'Vijaya Nirmala', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Vasantha Geetam', year: 1984, director: 'Singeetam Srinivasa Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K. Chakravarthy' },
  { title: 'Agni Samadhi', year: 1983, director: 'K. Vasu', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Yuvataram Pilicindi', year: 1985, director: 'Sandhya Rani', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Bandipotu', year: 1963, director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', music_director: 'Ghantasala' },
  { title: 'Bharyalu Jagratha', year: 1989, director: 'K. Balachander', hero: 'Rahman', music_director: 'G.V. Prakash' },
  { title: 'Rechukka', year: 1954, director: 'P. Pullaiah', hero: 'N.T. Rama Rao', music_director: 'Aswathama' },
  { title: 'Panthulamma', year: 1943, director: 'Gudavalli Ramabrahmam', music_director: 'S. Rajeswara Rao' },
  { title: 'Hantakulostunnaru Jagratha', year: 1966, director: 'K.S.R. Das', hero: 'Krishna', music_director: 'T.V. Raju' },
  { title: 'Aakali Rajyam', year: 1981, director: 'K. Balachander', hero: 'Kamal Haasan', music_director: 'M.S. Viswanathan' },
  { title: 'Illalu', year: 1940, director: 'Gudavalli Ramabrahmam', music_director: 'S. Rajeswara Rao' },
  { title: 'Chikkadu Dorakadu', year: 1988, director: 'Relangi Narasimha Rao', hero: 'Rajendra Prasad', music_director: 'Raj-Koti' },
  { title: 'Maha Sangramam', year: 1985, director: 'A. Kodandarami Reddy', music_director: 'K. Chakravarthy' },
  { title: 'Siksha', year: 1985, director: 'Relangi Narasimha Rao', hero: 'Chandra Mohan', music_director: 'Raj-Koti' },
  { title: 'Devi Moogambika', year: 1983, director: 'Renuka Sharma', hero: 'Sridhar', music_director: 'K.V. Mahadevan' },
  { title: 'Raj Bharat', year: 1982, director: 'K. Vasu', hero: 'Krishnam Raju', music_director: 'Satyam' },
  { title: 'Kirayi Bommalu', year: 1983, director: 'A. Kodandarami Reddy', hero: 'Suman', music_director: 'Rajan-Nagendra' },
  { title: 'Babai Abbai', year: 1985, director: 'Jandhyala', hero: 'N. Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Agni Poolu', year: 1981, director: 'K. Bapaiah', hero: 'Krishnam Raju', music_director: 'K.V. Mahadevan' },
  { title: 'Maradalu Pelli', year: 1952, director: 'M.R.V. Prasad Rao', hero: 'N.T. Rama Rao', music_director: 'Saluri Rajeswara Rao' },
  { title: 'Manasaakshi', year: 1977, director: 'P. Sambasiva Rao', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Chikkadu Dorakadu', year: 1967, director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Bhakta Potana', year: 1966, director: 'K. Kameswara Rao', hero: 'Gummadi', music_director: 'Saluri Rajeswara Rao' },
  { title: 'Stree Sahasam', year: 1951, director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', music_director: 'C.R. Subbaraman' },
  { title: 'Aathma Bandhuvu', year: 1962, director: 'P. Pullaiah', hero: 'N.T. Rama Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Inti Guttu', year: 1958, director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', music_director: 'M.S. Prakash' },
  { title: 'Deena Bandhu', year: 1942, director: 'V. Nagayya', hero: 'V. Nagayya', music_director: 'Saluri Rajeswara Rao' },
  { title: 'Jeevana Poratam', year: 1986, director: 'Rajachandra', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Vichitra Sodarulu', year: 1989, director: 'Singeetam Srinivasa Rao', hero: 'Kamal Haasan', music_director: 'Ilaiyaraaja' },
  { title: 'Aggi Pidugu', year: 1964, director: 'B. Vittalacharya', hero: 'N.T. Rama Rao', music_director: 'Rajan-Nagendra' },
  { title: 'Aame Katha', year: 1977, director: 'K. Raghavendra Rao', hero: 'Murali Mohan', music_director: 'K. Chakravarthy' },
  { title: 'Oorukichchina Maata', year: 1981, director: 'M. Balaiah', hero: 'Chiranjeevi', music_director: 'M.S. Viswanathan' },
  { title: 'Daasi', year: 1988, director: 'B. Narsing Rao', hero: 'Archana', music_director: 'B. Narsing Rao' },
  { title: 'Madana Gopaludu', year: 1987, director: 'P.N. Ramachandra Rao', hero: 'Rajendra Prasad', music_director: 'Sivaji Raja' },
  { title: 'Rangula Puli', year: 1983, director: 'Kodi Ramakrishna', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Chilipi Chinnodu', year: 1982, director: 'K. Vasu', hero: 'Sarath Babu', music_director: 'Satyam' },
  { title: 'Manavulara Manninchandi', year: 1983, director: 'K. Balachander', hero: 'Kamal Haasan', music_director: 'M.S. Viswanathan' },
  { title: 'Prema Mandiram', year: 1981, director: 'Dasari Narayana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Aada Brathuku', year: 1965, director: 'Vedantam Raghavayya', hero: 'N.T. Rama Rao', music_director: 'Viswanathan-Ramamoorthy' },
  { title: 'Sabhash Suri', year: 1964, director: 'I.N. Murthy', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Magavari Mayalu', year: 1960, director: 'B.A. Subba Rao', hero: 'N.T. Rama Rao', music_director: 'Master Venu' },
  { title: 'Pralaya Gharjana', year: 1983, director: 'P. Sambasiva Rao', hero: 'Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Kumkuma Barani', year: 1968, director: 'M. Mallikarjuna Rao', hero: 'Krishna', music_director: 'T.V. Raju' },
  { title: 'Koti Kokkadu', year: 1983, director: 'K. Vasu', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Donga Kollu', year: 1988, director: 'P.N. Ramachandra Rao', hero: 'Rajendra Prasad', music_director: 'Vasu Rao' },
  { title: 'Kodalu Kaavaali', year: 1980, director: 'K. Vasu', hero: 'Murali Mohan', music_director: 'Satyam' },
  { title: 'Beedala Patlu', year: 1950, director: 'K. Ramnoth', music_director: 'S.M. Subbaiah Naidu' },
  { title: 'Simhamtho Chelagatam', year: 1983, director: 'Kodi Ramakrishna', hero: 'Suman', music_director: 'Satyam' },
  { title: 'Dakshayagnam', year: 1941, director: 'Ch. Narayana Murthy', hero: 'V. Nagayya', music_director: 'S. Rajeswara Rao' },
  { title: 'Kiladi Krishnudu', year: 1980, director: 'Vijaya Nirmala', hero: 'Krishna', music_director: 'Ramesh Naidu' },
  { title: 'Driver Babu', year: 1986, director: 'K. Saradh', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Nirdoshi', year: 1951, director: 'H.M. Reddy', hero: 'Akkineni Nageswara Rao', music_director: 'G. Ramanathan' },
  { title: 'Nelavanka', year: 1983, director: 'Jandhyala', hero: 'Rajesh', music_director: 'Ramesh Naidu' },
  { title: 'Zamindar', year: 1965, director: 'V. Madhusudhana Rao', hero: 'Akkineni Nageswara Rao', music_director: 'T.V. Raju' },
  { title: 'Repu Needhe', year: 1957, director: 'K. Bhaskar Rao', hero: 'N.T. Rama Rao', music_director: 'Ghantasala' },
  { title: 'Gullo Pelli', year: 1961, director: 'K.B. Tilak', hero: 'Chalam', music_director: 'Pendyala' },
  { title: 'Vimala', year: 1960, director: 'S.M. Sriramulu Naidu', hero: 'N.T. Rama Rao', music_director: 'S.M. Subbaiah Naidu' },
  { title: 'Sampoorna Ramayanam', year: 1972, director: 'Bapu', hero: 'Sobhan Babu', music_director: 'K.V. Mahadevan' },
  { title: 'Chintamani', year: 1956, director: 'P.S. Ramakrishna Rao', music_director: 'P. Adinarayana Rao' },
  { title: 'Parivartana', year: 1954, director: 'T. Prakash Rao', music_director: 'T. Chalapathi Rao' },
  { title: 'Chandi Rani', year: 1953, director: 'P. Bhanumathi', music_director: 'C.R. Subbaraman' },
  { title: 'Bhale Thammudu', year: 1985, director: 'Paruchuri Brothers', hero: 'N. Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Chattam', year: 1983, director: 'K. Bapaiah', hero: 'Krishnam Raju', music_director: 'K. Chakravarthy' },
  { title: 'Satyame Jayam', year: 1942, director: 'A.S.A. Sami', hero: 'V. Nagayya', music_director: 'S.V. Venkatraman' },
  { title: 'Monagallaku Monagadu', year: 1966, director: 'S.D. Lal', hero: 'Krishna', music_director: 'Vedantam Raghavayya' },
  { title: 'Andaru Manchivare', year: 1975, director: 'S.S. Balan', hero: 'Shobhan Babu', music_director: 'V. Kumar' },
  { title: 'Bhimanjaneya Yuddham', year: 1966, director: 'S.D. Lal', music_director: 'T.V. Raju' },
  { title: 'Kodalu Diddina Kapuram', year: 1970, director: 'D. Yoganand', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Bangaru Manasulu', year: 1973, director: 'K.S. Reddy', hero: 'Sobhan Babu', music_director: 'Satyam' },
  { title: 'Koothuru Kaapuram', year: 1959, director: 'Sobhanadri Rao', hero: 'Jaggayya', music_director: 'Master Venu' },
  { title: 'Nagula Chavithi', year: 1956, director: 'Ch. Narayana Murthy', hero: 'N.T. Rama Rao', music_director: 'R. Sudharsanam' },
  { title: 'Raitu Kutumbam', year: 1971, director: 'P. Sambasiva Rao', hero: 'Akkineni Nageswara Rao', music_director: 'T.V. Raju' },
  { title: 'Thodu Needa', year: 1965, director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  { title: 'Chinnaari Chittibaau', year: 1981, director: 'K. Subba Rao', hero: 'Chandra Mohan', music_director: 'Satyam' },
  { title: 'Vagdanam', year: 1961, director: 'Atreya', hero: 'Akkineni Nageswara Rao', music_director: 'Pendyala' },
  { title: 'Surya Chandra', year: 1985, director: 'Vijaya Bapineedu', hero: 'Krishna', music_director: 'K. Chakravarthy' },
  { title: 'Kongu Mudi', year: 1985, director: 'Vijaya Bapineedu', hero: 'Naresh', music_director: 'K. Chakravarthy' },
  { title: 'Gali Patalu', year: 1974, director: 'P. Chandrasekhara Reddy', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Kalavari Kodalu', year: 1964, director: 'K. Hemambaradhara Rao', hero: 'N.T. Rama Rao', music_director: 'T.V. Raju' },
  { title: 'Swayamprabha', year: 1957, director: 'P. Sreedhar', hero: 'N.T. Rama Rao', music_director: 'Ramesh Naidu' },
  { title: 'Aada Pettanam', year: 1958, director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Bobbili Yuddham', year: 1964, director: 'C. Seetharam', hero: 'N.T. Rama Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Inspector Bharya', year: 1972, director: 'P.V. Satyanarayana', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Bomma Borusa', year: 1971, director: 'K. Balachander', hero: 'Chandra Mohan', music_director: 'R. Govardhanam' },
  { title: 'Sabhash Vadina', year: 1972, director: 'M. Mallikarjuna Rao', hero: 'Krishna', music_director: 'Satyam' },
  { title: 'Paruvu-Prathishta', year: 1963, director: 'Manapuram Appa Rao', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Sangeeta Lakshmi', year: 1966, director: 'Giduturi Suryam', hero: 'N.T. Rama Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Nammina Bantu', year: 1960, director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', music_director: 'S. Rajeswara Rao' },
  { title: 'Gruhalakshmi', year: 1984, director: 'B. Bhaskara Rao', hero: 'Rajendra Prasad', music_director: 'K. Chakravarthy' },
];

// More batches...
const ADDITIONAL_FIXES: MovieFix[] = [
  // Justice Chowdary batch
  { title: 'Justice Chowdary', year: 1982, director: 'K. Raghavendra Rao', hero: 'N.T. Rama Rao', music_director: 'K. Chakravarthy' },
  { title: 'Muthyala Muggu', year: 1975, director: 'Bapu', hero: 'Sridhar', music_director: 'K.V. Mahadevan' },
  { title: 'Swargaseema', year: 1945, director: 'B.N. Reddy', hero: 'V. Nagayya', music_director: 'Ogirala Ramachandra Rao' },
  { title: 'Nuvve Kavali', year: 2000, director: 'K. Vijaya Bhaskar', hero: 'Tarun', music_director: 'Koti' },
  { title: 'Moodu Mullu', year: 1983, director: 'Jandhyala', hero: 'Chandra Mohan', music_director: 'Ramesh Naidu' },
  { title: 'Subhodhayam', year: 1980, director: 'K. Viswanath', hero: 'Chandra Mohan', music_director: 'K.V. Mahadevan' },
  { title: 'Manchi Manasulu', year: 1962, director: 'Adurthi Subba Rao', hero: 'Akkineni Nageswara Rao', music_director: 'K.V. Mahadevan' },
  
  // Final batch corrections
  { title: 'Chandi', year: 2013, director: 'V. Samudra', hero: 'Priyamani', music_director: 'S.R. Shankar' },
  { title: 'Naku Pellam Kavali', year: 1987, director: 'Vijaya Bapineedu', hero: 'Rajendra Prasad', music_director: 'Vasu Rao' },
  { title: 'Vaddu Bava Tappu', year: 1995, director: 'K. Ajay Kumar', hero: 'Rajendra Prasad', music_director: 'Vidyasagar' },
  { title: 'Captain Nagarjuna', year: 1986, director: 'V.B. Rajendra Prasad', hero: 'Nagarjuna', music_director: 'K. Chakravarthy' },
  { title: 'Kattula Kondaiah', year: 1985, director: 'S.B. Chakravarthy', hero: 'Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Desoddarakudu', year: 1986, director: 'S.S. Ravichandra', hero: 'Balakrishna', music_director: 'K. Chakravarthy' },
  { title: 'Sarfarosh', year: 1985, director: 'Dasari Narayana Rao', hero: 'Sobhan Babu', music_director: 'K. Chakravarthy' },
  { title: 'Pekata Paparao', year: 1993, director: 'Y. Nageswara Rao', hero: 'Rajendra Prasad', music_director: 'Raj-Koti' },
  { title: '9 Nelalu', year: 2001, director: 'Kranthi Kumar', hero: 'Vikram', music_director: 'Vasu Rao' },
  { title: 'Sultan', year: 1999, director: 'Sarath', hero: 'Balakrishna', music_director: 'Koti' },
  { title: 'Uma Chandi Gowri Shankarula Katha', year: 1968, director: 'K.V. Reddy', hero: 'N.T. Rama Rao', music_director: 'Pendyala' },
  { title: 'Lahiri Lahiri Lahirilo', year: 2002, director: 'Y.V.S. Chowdary', hero: 'Harikrishna', music_director: 'M.M. Keeravani' },
  { title: 'Chalaki Mogudu Chavali Pellam', year: 1991, director: 'Relangi Narasimha Rao', hero: 'Rajendra Prasad', music_director: 'J.V. Raghavulu' },
  { title: 'Dollar Dreams', year: 2000, director: 'Sekhar Kammula', hero: 'Santosh Kumar', music_director: 'Ravi Krishna' },
  { title: 'Payanam', year: 2011, director: 'Radha Mohan', hero: 'Nagarjuna', music_director: 'Pravin Mani' },
  { title: 'Hello!', year: 2017, director: 'Vikram Kumar', hero: 'Akhil Akkineni', music_director: 'Anup Rubens' },
  { title: 'Brahmarshi Viswamitra', year: 1991, director: 'N.T. Rama Rao', hero: 'N.T. Rama Rao', music_director: 'Ravindra Jain' },
  { title: 'Kothala Raayudu', year: 1979, director: 'K. Vasu', hero: 'Chiranjeevi', music_director: 'J.V. Raghavulu' },
  { title: 'Yugapurushudu', year: 1978, director: 'K. Bapaiah', hero: 'N.T. Rama Rao', music_director: 'K. Chakravarthy' },
  { title: 'Jwaala', year: 1985, director: 'Ravi Raja Pinisetty', hero: 'Chiranjeevi', music_director: 'Ilaiyaraaja' },
  { title: 'Ashoka Chakravarthy', year: 1989, director: 'Suresh Krissna', hero: 'Balakrishna', music_director: 'Ilaiyaraaja' },
  { title: 'Nee Kosam', year: 1999, director: 'Srinu Vaitla', hero: 'Ravi Teja', music_director: 'R.P. Patnaik' },
  { title: 'Okkadu Chalu', year: 2000, director: 'Ravi Raja Pinisetty', hero: 'Rajasekhar', music_director: 'Mani Sharma' },
];

async function findAndUpdateMovie(fix: MovieFix): Promise<boolean> {
  // Try to find by ID first if provided
  if (fix.id) {
    const { data: movie, error } = await supabase
      .from('movies')
      .select('id, title_en')
      .ilike('id', `${fix.id}%`)
      .single();
    
    if (movie) {
      const updates: Record<string, any> = {};
      if (fix.music_director) updates.music_director = fix.music_director;
      if (fix.director) updates.director = fix.director;
      if (fix.hero) updates.hero = fix.hero;
      if (fix.heroine) updates.heroine = fix.heroine;
      if (fix.producer) updates.producer = fix.producer;
      
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);
      
      if (!updateError) {
        return true;
      }
    }
  }
  
  // Find by title and year
  const searchTerms = fix.title.split(' ').filter(t => t.length > 2);
  const searchTerm = searchTerms[0] || fix.title;
  
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title_en, release_year')
    .eq('release_year', fix.year)
    .ilike('title_en', `%${searchTerm}%`)
    .limit(10);
  
  if (!movies || movies.length === 0) return false;
  
  // Find best match
  const movie = movies.find(m => 
    m.title_en.toLowerCase() === fix.title.toLowerCase() ||
    m.title_en.toLowerCase().includes(fix.title.toLowerCase()) ||
    fix.title.toLowerCase().includes(m.title_en.toLowerCase().split('(')[0].trim())
  );
  
  if (!movie) return false;
  
  const updates: Record<string, any> = {};
  if (fix.music_director) updates.music_director = fix.music_director;
  if (fix.director) updates.director = fix.director;
  if (fix.hero) updates.hero = fix.hero;
  if (fix.heroine) updates.heroine = fix.heroine;
  if (fix.producer) updates.producer = fix.producer;
  
  const { error: updateError } = await supabase
    .from('movies')
    .update(updates)
    .eq('id', movie.id);
  
  return !updateError;
}

async function main() {
  console.log(chalk.cyan.bold(`
╔══════════════════════════════════════════════════════════════════╗
║   MASSIVE MUSIC DIRECTOR & DATA FIXES FROM MANUAL REVIEW         ║
║   Total Records: ${(ID_BASED_FIXES.length + MUSIC_DIRECTOR_FIXES.length + ADDITIONAL_FIXES.length).toString().padEnd(4)}                                           ║
╚══════════════════════════════════════════════════════════════════╝
`));

  const allFixes = [...ID_BASED_FIXES, ...MUSIC_DIRECTOR_FIXES, ...ADDITIONAL_FIXES];
  let updated = 0;
  let notFound = 0;
  
  console.log(chalk.yellow('Processing ID-based fixes first...'));
  for (const fix of ID_BASED_FIXES) {
    const success = await findAndUpdateMovie(fix);
    if (success) {
      const extras = [];
      if (fix.director) extras.push(`dir=${fix.director}`);
      if (fix.hero) extras.push(`hero=${fix.hero}`);
      console.log(chalk.green(`✓ ${fix.title} (${fix.year}) → ${fix.music_director} ${extras.length ? `[${extras.join(', ')}]` : ''}`));
      updated++;
    } else {
      console.log(chalk.yellow(`✗ Not found: ${fix.title} (${fix.year})`));
      notFound++;
    }
  }
  
  console.log(chalk.yellow('\nProcessing music director fixes...'));
  let batchCount = 0;
  for (const fix of MUSIC_DIRECTOR_FIXES) {
    const success = await findAndUpdateMovie(fix);
    if (success) {
      updated++;
      batchCount++;
      if (batchCount % 50 === 0) {
        console.log(chalk.green(`  Processed ${batchCount}/${MUSIC_DIRECTOR_FIXES.length}...`));
      }
    } else {
      notFound++;
    }
  }
  console.log(chalk.green(`  Completed ${batchCount} music director fixes`));
  
  console.log(chalk.yellow('\nProcessing additional fixes...'));
  for (const fix of ADDITIONAL_FIXES) {
    const success = await findAndUpdateMovie(fix);
    if (success) {
      updated++;
    } else {
      notFound++;
    }
  }

  console.log(chalk.cyan.bold('\n═══════════════════════════════════════════════════════════════'));
  console.log(chalk.bold('📊 FINAL SUMMARY'));
  console.log(chalk.cyan.bold('═══════════════════════════════════════════════════════════════\n'));
  
  console.log(`  Total attempted:  ${allFixes.length}`);
  console.log(`  Updated:          ${chalk.green(updated)}`);
  console.log(`  Not found:        ${chalk.yellow(notFound)}`);
  console.log(`  Success rate:     ${chalk.cyan((updated / allFixes.length * 100).toFixed(1))}%`);

  // Get final count
  const { count } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .is('music_director', null)
    .eq('is_published', true);
  
  console.log(`\n  Remaining without music director: ${chalk.yellow(count)}`);
  console.log(chalk.green('\n✅ Done!\n'));
}

main().catch(console.error);
