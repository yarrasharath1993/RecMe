import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Corrections based on user review
 * Format: { actor: string, movie: string, correctRole: 'hero' | 'heroine' | 'supporting' | 'cameo' | 'child_artist' | 'producer' | 'director' | 'narrator' | 'voice' }
 */
const CORRECTIONS: Array<{
  actor: string;
  movie: string;
  correctRole: 'hero' | 'heroine' | 'supporting' | 'cameo' | 'child_artist' | 'producer' | 'director' | 'narrator' | 'voice' | 'remove';
  notes?: string;
}> = [
  // Amala - Lead Actress corrections
  { actor: 'amala', movie: 'Velaikaran', correctRole: 'heroine', notes: 'Lead Actress opposite Rajinikanth' },
  { actor: 'amala', movie: 'Mappillai', correctRole: 'heroine', notes: 'Lead Actress opposite Rajinikanth' },
  { actor: 'amala', movie: 'Kirayi Dada', correctRole: 'heroine', notes: 'Lead Actress opposite Nagarjuna' },
  { actor: 'amala', movie: 'Chinababu', correctRole: 'heroine', notes: 'Lead Actress opposite Nagarjuna' },
  { actor: 'amala', movie: 'Siva', correctRole: 'heroine', notes: 'Lead Actress opposite Nagarjuna' },
  { actor: 'amala', movie: 'Prema Yuddham', correctRole: 'heroine', notes: 'Lead Actress opposite Nagarjuna' },
  { actor: 'amala', movie: 'Nirnayam', correctRole: 'heroine', notes: 'Lead Actress opposite Nagarjuna' },
  { actor: 'amala', movie: 'Manam', correctRole: 'cameo', notes: 'Cameo / Special Appearance as dance teacher' },
  { actor: 'amala', movie: 'Pushpaka Vimana', correctRole: 'heroine', notes: 'Lead Actress opposite Kamal Haasan' },
  
  // Chandra Mohan - Lead Actor corrections
  { actor: 'chandra mohan', movie: 'Rangula Ratnam', correctRole: 'hero', notes: 'Protagonist / Lead Role; won Nandi Award for Best Actor' },
  { actor: 'chandra mohan', movie: 'Bomma Borusa', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'chandra mohan', movie: 'Kalam Marindi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'chandra mohan', movie: 'Padaharella Vayasu', correctRole: 'hero', notes: 'Lead Actor; won Filmfare Best Actor Award' },
  { actor: 'chandra mohan', movie: 'Ram Robert Rahim', correctRole: 'hero', notes: 'One of the three Leads (Ram) alongside Krishna and Rajinikanth' },
  { actor: 'chandra mohan', movie: 'Kalahala Kapuram', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'chandra mohan', movie: 'Muchataga Mugguru', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'chandra mohan', movie: 'Rendu Rella Aaru', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'chandra mohan', movie: 'Gandhinagar Rendava Veedhi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'chandra mohan', movie: 'Rambha Rambabu', correctRole: 'hero', notes: 'Lead Actor (Rambabu)' },
  
  // Daggubati Venkatesh - Lead Actor corrections
  { actor: 'daggubati venkatesh', movie: 'Prema Nagar', correctRole: 'child_artist', notes: 'Child Artist; played younger version of Keshav Varma' },
  { actor: 'daggubati venkatesh', movie: 'Vasantha Maligai', correctRole: 'child_artist', notes: 'Child Artist; played young Vijay Kumar' },
  { actor: 'daggubati venkatesh', movie: 'Kaliyuga Pandavulu', correctRole: 'hero', notes: 'Lead Actor; debut film as hero' },
  { actor: 'daggubati venkatesh', movie: 'Ajeyudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Raktha Tilakam', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Prema', correctRole: 'hero', notes: 'Lead Actor; won Nandi Award for Best Actor' },
  { actor: 'daggubati venkatesh', movie: 'Aggiramudu', correctRole: 'hero', notes: 'Lead Actor (Dual role)' },
  { actor: 'daggubati venkatesh', movie: 'Chanti', correctRole: 'hero', notes: 'Lead Actor; iconic career-defining role' },
  { actor: 'daggubati venkatesh', movie: 'Super Police', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Pokiri Raja', correctRole: 'hero', notes: 'Lead Actor (Dual role)' },
  { actor: 'daggubati venkatesh', movie: 'Dharma Chakram', correctRole: 'hero', notes: 'Lead Actor; won Nandi and Filmfare Best Actor awards' },
  { actor: 'daggubati venkatesh', movie: 'Chinnabbayi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Suryavamsam', correctRole: 'hero', notes: 'Lead Actor (Dual role)' },
  { actor: 'daggubati venkatesh', movie: 'Raja', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Kalisundam Raa', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Devi Putrudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Vasu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Vasantam', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Malliswari', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Sankranthi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'daggubati venkatesh', movie: 'Lakshmi', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'daggubati venkatesh', movie: 'Aadavari Matalaku Arthale Verule', correctRole: 'hero', notes: 'Lead Actor (Ganesh)' },
  { actor: 'daggubati venkatesh', movie: 'Chintakayala Ravi', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'daggubati venkatesh', movie: 'Eenadu', correctRole: 'hero', notes: 'Joint Lead with Kamal Haasan' },
  { actor: 'daggubati venkatesh', movie: 'Namo Venkatesa', correctRole: 'hero', notes: 'Lead Actor (Venkataramana)' },
  { actor: 'daggubati venkatesh', movie: 'Bodyguard', correctRole: 'hero', notes: 'Lead Actor (Venkatadri)' },
  { actor: 'daggubati venkatesh', movie: 'Seethamma Vakitlo Sirimalle Chettu', correctRole: 'hero', notes: 'Joint Lead (Peddodu) with Mahesh Babu' },
  { actor: 'daggubati venkatesh', movie: 'Drushyam', correctRole: 'hero', notes: 'Lead Actor (Rambabu)' },
  { actor: 'daggubati venkatesh', movie: 'Gopala Gopala', correctRole: 'hero', notes: 'Joint Lead with Pawan Kalyan' },
  { actor: 'daggubati venkatesh', movie: 'Babu Bangaram', correctRole: 'hero', notes: 'Lead Actor (ACP Krishna)' },
  { actor: 'daggubati venkatesh', movie: 'Guru', correctRole: 'hero', notes: 'Lead Actor (Aditya)' },
  { actor: 'daggubati venkatesh', movie: 'Agnyaathavaasi', correctRole: 'cameo', notes: 'Special Appearance / Cameo' },
  { actor: 'daggubati venkatesh', movie: 'F2: Fun and Frustration', correctRole: 'hero', notes: 'Joint Lead (Venky) with Varun Tej' },
  { actor: 'daggubati venkatesh', movie: 'Narappa', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'daggubati venkatesh', movie: 'F3: Fun and Frustration', correctRole: 'hero', notes: 'Joint Lead (Venky) with Varun Tej' },
  { actor: 'daggubati venkatesh', movie: 'Saindhav', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'daggubati venkatesh', movie: 'Sankranthiki Vasthunam', correctRole: 'hero', notes: 'Lead Actor (YD Raju)' },
  { actor: 'daggubati venkatesh', movie: 'Mana Shankara Vara Prasad Garu', correctRole: 'hero', notes: 'Lead Actor (Venky Gowda)' },
  
  // Geetha - Lead Actress corrections
  { actor: 'geetha', movie: 'Mana Voori Pandavulu', correctRole: 'heroine', notes: 'Lead Actress; debut film' },
  { actor: 'geetha', movie: 'Iddaru Asadhyule', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna' },
  { actor: 'geetha', movie: 'Thathayya Premaleelalu', correctRole: 'heroine', notes: 'Lead Actress opposite Chiranjeevi' },
  { actor: 'geetha', movie: 'Allullostunnaru', correctRole: 'heroine', notes: 'Lead Actress opposite Chiranjeevi' },
  { actor: 'geetha', movie: 'Thodu', correctRole: 'heroine', notes: 'Lead Actress; won Nandi Special Jury Award' },
  { actor: 'geetha', movie: 'Kuruthipunal', correctRole: 'heroine', notes: 'Lead Actress (Zeena) opposite Kamal Haasan' },
  { actor: 'geetha', movie: 'Aaj Ka Goonda Raj', correctRole: 'supporting', notes: 'Second Lead / Supporting; significant role' },
  
  // Jagapathi Babu - Lead Actor corrections
  { actor: 'jagapathi babu', movie: 'Victory', correctRole: 'hero', notes: 'Lead Actor in sports drama' },
  
  // Jaggayya - Lead Actor corrections
  { actor: 'jaggayya', movie: 'Ardhangi', correctRole: 'hero', notes: 'Lead Actor (co-lead with ANR)' },
  { actor: 'jaggayya', movie: 'Muddu Bidda', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'jaggayya', movie: 'Veera Kankanam', correctRole: 'hero', notes: 'Lead Actor (one of the leads with NTR)' },
  { actor: 'jaggayya', movie: 'Anna Thammudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'jaggayya', movie: 'Pelli Kanuka', correctRole: 'hero', notes: 'Lead Actor opposite B. Saroja Devi' },
  { actor: 'jaggayya', movie: 'Constable Koothuru', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'jaggayya', movie: 'Naadi Aada Janme', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'jaggayya', movie: 'Prana Mithrulu', correctRole: 'hero', notes: 'Lead Actor alongside ANR' },
  { actor: 'jaggayya', movie: 'Bandipotu Dongalu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'jaggayya', movie: 'Ramalayam', correctRole: 'hero', notes: 'Joint Lead (Ramaiah) alongside Sobhan Babu' },
  
  // Jaya Prada - Lead Actress corrections
  { actor: 'jaya prada', movie: 'Manmatha Leelai', correctRole: 'heroine', notes: 'Lead Actress (one of the female leads) opposite Kamal Haasan' },
  { actor: 'jaya prada', movie: 'Sargam', correctRole: 'heroine', notes: 'Lead Actress; Hindi debut (Hema)' },
  { actor: 'jaya prada', movie: 'Madhura Swapnam', correctRole: 'heroine', notes: 'Lead Actress opposite Krishnam Raju' },
  { actor: 'jaya prada', movie: 'Saagara Sangamam', correctRole: 'heroine', notes: 'Lead Actress (Madhavi); won Filmfare Best Actress' },
  { actor: 'jaya prada', movie: 'Pataal Bhairavi', correctRole: 'heroine', notes: 'Lead Actress opposite Jeetendra' },
  { actor: 'jaya prada', movie: 'Krishna Garadi', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna' },
  { actor: 'jaya prada', movie: 'Aulad', correctRole: 'heroine', notes: 'Lead Actress (Yashoda) opposite Jeetendra' },
  { actor: 'jaya prada', movie: 'Jaadugar', correctRole: 'heroine', notes: 'Lead Actress opposite Amitabh Bachchan' },
  { actor: 'jaya prada', movie: 'Majboor', correctRole: 'heroine', notes: 'Lead Actress opposite Jeetendra' },
  { actor: 'jaya prada', movie: 'Indrajeet', correctRole: 'heroine', notes: 'Lead Actress opposite Amitabh Bachchan' },
  { actor: 'jaya prada', movie: 'Maa', correctRole: 'heroine', notes: 'Lead Actress (title role) opposite Jeetendra' },
  { actor: 'jaya prada', movie: 'Insaniyat Ke Devta', correctRole: 'heroine', notes: 'Lead Actress (Savitri) opposite Rajinikanth' },
  { actor: 'jaya prada', movie: 'Insaniyat', correctRole: 'heroine', notes: 'Lead Actress opposite Amitabh Bachchan' },
  { actor: 'jaya prada', movie: 'Himapatha', correctRole: 'heroine', notes: 'Lead Actress in Kannada classic' },
  { actor: 'jaya prada', movie: 'Jeevan Yudh', correctRole: 'heroine', notes: 'Lead Actress opposite Mithun Chakraborty' },
  { actor: 'jaya prada', movie: 'Aami Sei Meye', correctRole: 'heroine', notes: 'Lead Actress (Bengali debut)' },
  { actor: 'jaya prada', movie: 'Ee Bandhana', correctRole: 'heroine', notes: 'Lead Actress opposite Vishnuvardhan' },
  { actor: 'jaya prada', movie: 'Pranayam', correctRole: 'heroine', notes: 'Lead Actress (protagonist Grace); won critical acclaim' },
  { actor: 'jaya prada', movie: 'Kinar', correctRole: 'heroine', notes: 'Lead Actress (protagonist Sethulakshmi)' },
  
  // K. Balachander - Director corrections
  { actor: 'k. balachander', movie: 'Bhama Vijayam', correctRole: 'director', notes: 'Director & Writer (No acting role)' },
  { actor: 'k. balachander', movie: 'Manmatha Leelai', correctRole: 'director', notes: 'Director & Writer (No acting role)' },
  { actor: 'k. balachander', movie: 'Avargal', correctRole: 'director', notes: 'Director & Writer (No acting role)' },
  { actor: 'k. balachander', movie: 'Aakali Rajyam', correctRole: 'director', notes: 'Director & Writer (No acting role)' },
  { actor: 'k. balachander', movie: 'Rudraveena', correctRole: 'director', notes: 'Director & Writer (No acting role)' },
  { actor: 'k. balachander', movie: 'Poojaikku Vandha Malar', correctRole: 'director', notes: 'Director & Writer (No acting role)' },
  
  // Kamal Haasan - Lead Actor corrections
  { actor: 'kamal haasan', movie: 'Avvai Shanmugi', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'kamal haasan', movie: 'Kaathala Kaathala', correctRole: 'hero', notes: 'Lead Actor (Ramalingam)' },
  { actor: 'kamal haasan', movie: '83', correctRole: 'producer', notes: 'Producer (Tamil version); does not act' },
  { actor: 'kamal haasan', movie: 'Uttama Villain', correctRole: 'hero', notes: 'Lead Actor (Manoranjen/Uthaman)' },
  { actor: 'kamal haasan', movie: 'Sye Raa Narasimha Reddy', correctRole: 'narrator', notes: 'Narrator (Voice only) for Tamil version' },
  
  // Kanchana - Lead Actress corrections
  { actor: 'kanchana', movie: 'Aatma Gowravam', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'kanchana', movie: 'Navaratri', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'kanchana', movie: 'Ave Kallu', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna' },
  { actor: 'kanchana', movie: 'Manchi Kutumbam', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'kanchana', movie: 'Bhale Mastaru', correctRole: 'heroine', notes: 'Lead Actress opposite NTR' },
  { actor: 'kanchana', movie: 'Dharma Daata', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'kanchana', movie: 'Kalyana Mandapam', correctRole: 'heroine', notes: 'Lead Actress opposite Sobhan Babu' },
  { actor: 'kanchana', movie: 'Raitu Kutumbam', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'kanchana', movie: 'Mahakavi Kshetrayya', correctRole: 'heroine', notes: 'Lead Actress (one of the leads) opposite ANR' },
  { actor: 'kanchana', movie: 'Veerabhimanyu', correctRole: 'heroine', notes: 'Lead Actress (Uttara) opposite Shobhan Babu' },
  { actor: 'kanchana', movie: 'Babruvahana', correctRole: 'heroine', notes: 'Lead Actress (Chitrangada) opposite Rajkumar' },
  
  // Karthik - Lead Actor corrections
  { actor: 'karthik', movie: 'Ilanjodigal', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'karthik', movie: 'Muthu Kaalai', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'karthik', movie: 'Chinna Raja', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'karthik', movie: 'Seethakoka Chilaka', correctRole: 'hero', notes: 'Lead Actor (Debut Hero role)' },
  { actor: 'karthik', movie: 'Anveshana', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'karthik', movie: 'Punyasthree', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  
  // Latha - Lead Actress corrections
  { actor: 'latha', movie: 'Andala Ramudu', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'latha', movie: 'Nippulanti Manishi', correctRole: 'heroine', notes: 'Lead Actress opposite NTR' },
  { actor: 'latha', movie: 'Magaadu', correctRole: 'heroine', notes: 'Lead Actress opposite NTR' },
  { actor: 'latha', movie: 'Kurukshetram', correctRole: 'heroine', notes: 'Lead Actress (Uttara)' },
  { actor: 'latha', movie: 'Kumara Raja', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna' },
  { actor: 'latha', movie: 'Andadu Aagadu', correctRole: 'heroine', notes: 'Lead Actress opposite Krishnam Raju' },
  { actor: 'latha', movie: 'Srungara Ramudu', correctRole: 'heroine', notes: 'Lead Actress opposite ANR' },
  { actor: 'latha', movie: 'Pancha Bhoothalu', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'latha', movie: 'Love In Singapore', correctRole: 'heroine', notes: 'Lead Actress opposite Kamal Haasan' },
  
  // Madhavi - Lead Actress corrections
  { actor: 'madhavi', movie: 'Thoorpu Padamara', correctRole: 'heroine', notes: 'Lead Actress; debut film as protagonist' },
  { actor: 'madhavi', movie: 'Amara Deepam', correctRole: 'heroine', notes: 'Lead Actress opposite Krishnam Raju' },
  { actor: 'madhavi', movie: 'Iddaru Asadhyule', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna and Rajinikanth' },
  { actor: 'madhavi', movie: 'Agni Samskaram', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'madhavi', movie: 'Intlo Ramayya Veedhilo Krishnayya', correctRole: 'heroine', notes: 'Lead Actress (Madhulatha) opposite Chiranjeevi' },
  { actor: 'madhavi', movie: 'Andhaa Kaanoon', correctRole: 'heroine', notes: 'Lead Actress (Shilpa) opposite Rajinikanth' },
  { actor: 'madhavi', movie: 'Geraftaar', correctRole: 'heroine', notes: 'Lead Actress opposite Kamal Haasan' },
  { actor: 'madhavi', movie: 'Agneepath', correctRole: 'heroine', notes: 'Lead Actress (Mary Matthew) opposite Amitabh Bachchan' },
  
  // Mohan Babu - Lead Actor corrections
  { actor: 'mohan babu', movie: 'Kottapeta Rowdy', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'mohan babu', movie: 'Adirindi Alludu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'mohan babu', movie: 'Raayudu', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'mohan babu', movie: 'Sri Ramulayya', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
  { actor: 'mohan babu', movie: 'Postman', correctRole: 'hero', notes: 'Lead Actor (Vishnu)' },
  { actor: 'mohan babu', movie: 'Adhipathi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'mohan babu', movie: 'Game', correctRole: 'hero', notes: 'Lead Actor (Pandit Raghava)' },
  { actor: 'mohan babu', movie: 'Pandavulu Pandavulu Tummeda', correctRole: 'hero', notes: 'Main Lead (Naidu) in ensemble film' },
  { actor: 'mohan babu', movie: 'Mama Manchu Alludu Kanchu', correctRole: 'hero', notes: 'Main Lead (Bhakthavatsala Naidu)' },
  { actor: 'mohan babu', movie: 'Luckunnodu', correctRole: 'cameo', notes: 'Special Appearance / Cameo as himself' },
  
  // N.T. Rama Rao - Lead Actor/Director corrections
  { actor: 'n.t. rama rao', movie: 'Seetha Rama Kalyanam', correctRole: 'hero', notes: 'Lead Actor (Ravana) and Director' },
  { actor: 'n.t. rama rao', movie: 'Gulebakavali Katha', correctRole: 'hero', notes: 'Lead Actor and Director' },
  { actor: 'n.t. rama rao', movie: 'Sri Krishna Pandaveeyam', correctRole: 'hero', notes: 'Lead Actor (Krishna/Duryodhana) and Director' },
  { actor: 'n.t. rama rao', movie: 'Ummadi Kutumbam', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'n.t. rama rao', movie: 'Varakatnam', correctRole: 'hero', notes: 'Lead Actor & Director; won National Film Award' },
  { actor: 'n.t. rama rao', movie: 'Kodalu Diddina Kapuram', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'n.t. rama rao', movie: 'Kannan Karunai', correctRole: 'hero', notes: 'Lead Actor (Lord Krishna) in Tamil film' },
  { actor: 'n.t. rama rao', movie: 'Kula Gowravam', correctRole: 'hero', notes: 'Lead Actor (Triple Role)' },
  { actor: 'n.t. rama rao', movie: 'Tatamma Kala', correctRole: 'hero', notes: 'Lead Actor & Director' },
  { actor: 'n.t. rama rao', movie: 'Daana Veera Soora Karna', correctRole: 'hero', notes: 'Lead Actor (Triple Role: Karna, Krishna, Duryodhana) & Director' },
  { actor: 'n.t. rama rao', movie: 'Chanakya Chandragupta', correctRole: 'hero', notes: 'Lead Actor (Chanakya) & Director' },
  { actor: 'n.t. rama rao', movie: 'Akbar Saleem Anarkali', correctRole: 'hero', notes: 'Lead Actor (Akbar) & Director' },
  { actor: 'n.t. rama rao', movie: 'Sri Rama Pattabhishekam', correctRole: 'hero', notes: 'Lead Actor (Rama/Ravana) & Director' },
  { actor: 'n.t. rama rao', movie: 'Sri Madvirata Parvam', correctRole: 'hero', notes: 'Lead Actor (Five Roles) & Director' },
  { actor: 'n.t. rama rao', movie: 'Sri Tirupati Venkateswara Kalyanam', correctRole: 'hero', notes: 'Lead Actor (Venkateswara) & Director' },
  { actor: 'n.t. rama rao', movie: 'Chanda Sasanudu', correctRole: 'hero', notes: 'Lead Actor (Dual Role) & Director' },
  { actor: 'n.t. rama rao', movie: 'Srimadvirat Veerabrahmendra Swami Charitra', correctRole: 'hero', notes: 'Lead Actor (Title Role) & Director' },
  { actor: 'n.t. rama rao', movie: 'Brahmarshi Vishwamitra', correctRole: 'hero', notes: 'Lead Actor (Title Role) & Director' },
  { actor: 'n.t. rama rao', movie: 'Samrat Ashoka', correctRole: 'hero', notes: 'Lead Actor (Title Role) & Director' },
  
  // Pawan Kalyan - Lead Actor corrections
  { actor: 'pawan kalyan', movie: 'Akkada Ammayi Ikkada Abbayi', correctRole: 'hero', notes: 'Lead Actor (Debut Film)' },
  { actor: 'pawan kalyan', movie: 'Gokulamlo Seetha', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Suswagatham', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Thammudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Badri', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Kushi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Johnny', correctRole: 'hero', notes: 'Lead Actor & Director' },
  { actor: 'pawan kalyan', movie: 'Gudumba Shankar', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Balu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Bangaram', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Shankar Dada Zindabad', correctRole: 'cameo', notes: 'Cameo Appearance; appears in song/special role (Chiranjeevi is lead)' },
  { actor: 'pawan kalyan', movie: 'Jalsa', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Teen Maar', correctRole: 'hero', notes: 'Lead Actor (Dual Role)' },
  { actor: 'pawan kalyan', movie: 'Gabbar Singh', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Atharintiki Daaredi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Gopala Gopala', correctRole: 'hero', notes: 'Joint Lead (Lord Krishna) alongside Venkatesh' },
  { actor: 'pawan kalyan', movie: 'Sardar Gabbar Singh', correctRole: 'hero', notes: 'Lead Actor & writer' },
  { actor: 'pawan kalyan', movie: 'Katamarayudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Agnyaathavaasi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Vakeel Saab', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Bheemla Nayak', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Chal Mohan Ranga', correctRole: 'producer', notes: 'Producer only; does not act' },
  { actor: 'pawan kalyan', movie: 'Sye Raa Narasimha Reddy', correctRole: 'narrator', notes: 'Narrator (Voice-over) only; no physical acting role' },
  { actor: 'pawan kalyan', movie: 'Panjaa', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'pawan kalyan', movie: 'Hari Hara Veera Mallu: Part 1 – Sword vs Spirit', correctRole: 'hero', notes: 'Lead Actor' },
  
  // Prabhu Deva - Cameo correction
  { actor: 'prabhu deva', movie: 'Mouna Raagam', correctRole: 'cameo', notes: 'Uncredited Cameo / Extra; appeared briefly in song' },
  
  // Pushpavalli - Lead Actress correction
  { actor: 'pushpavalli', movie: 'Chenchu Lakshmi', correctRole: 'heroine', notes: 'Lead Actress (Satyabhama in 1943 version)' },
  
  // Raasi - Corrections
  { actor: 'raasi', movie: 'Rao Gari Illu', correctRole: 'child_artist', notes: 'Child Artist (credited as Baby Raasi)' },
  { actor: 'raasi', movie: 'Aditya 369', correctRole: 'child_artist', notes: 'Child Artist (credited as Baby Raasi)' },
  { actor: 'raasi', movie: 'Palnati Pourusham', correctRole: 'heroine', notes: 'Lead Actress opposite Krishnam Raju' },
  { actor: 'raasi', movie: 'Postman', correctRole: 'heroine', notes: 'Lead Actress opposite Mohan Babu' },
  { actor: 'raasi', movie: 'Maa Aavida Meeda Ottu Mee Aavida Chala Manchidi', correctRole: 'heroine', notes: 'Lead Actress (one of the leads)' },
  { actor: 'raasi', movie: 'Venky', correctRole: 'cameo', notes: 'Cameo/Special Appearance in song "Oye Oye"' },
  
  // Raja - Lead Actor corrections
  { actor: 'raja', movie: 'O Chinnadana', correctRole: 'hero', notes: 'Lead Actor (debut as hero)' },
  { actor: 'raja', movie: 'Vijayam', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'raja', movie: 'Anand', correctRole: 'hero', notes: 'Lead Actor (protagonist Anand)' },
  { actor: 'raja', movie: 'Vennela', correctRole: 'hero', notes: 'Lead Actor (protagonist Naveen)' },
  { actor: 'raja', movie: 'Toss', correctRole: 'hero', notes: 'Joint Lead Actor with Upendra' },
  { actor: 'raja', movie: 'Sontha ooru', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'raja', movie: 'Inkosaari', correctRole: 'hero', notes: 'Lead Actor' },
  
  // Rajendra Prasad - Lead Actor corrections
  { actor: 'rajendra prasad', movie: 'Kashmora', correctRole: 'hero', notes: 'Lead Actor (Darkha)' },
  { actor: 'rajendra prasad', movie: 'Samsaram', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Bandhuvulostunnaru Jagratha', correctRole: 'hero', notes: 'Lead Actor (Chittibabu)' },
  { actor: 'rajendra prasad', movie: 'Vichitra Prema', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Bramhachari Mogudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Vaddu Bava Tappu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Mummy Mee Aayanochadu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Kshemanga Velli Labhamga Randi', correctRole: 'hero', notes: 'Joint Lead Actor (one of three main couples)' },
  { actor: 'rajendra prasad', movie: 'Ammo Bomma', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Sandade Sandadi', correctRole: 'hero', notes: 'Joint Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Sriramachandrulu', correctRole: 'hero', notes: 'Joint Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Oka Pellam Muddu Rendo Pellam Vaddu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Andagadu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Iddaru Attala Muddula Alludu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rajendra prasad', movie: 'Mee Sreyobhilashi', correctRole: 'hero', notes: 'Lead Actor (National Award winning role)' },
  { actor: 'rajendra prasad', movie: 'Bhale Mogudu Bhale Pellam', correctRole: 'hero', notes: 'Lead Actor' },
  
  // Rambha - Lead Actress corrections
  { actor: 'rambha', movie: 'Aa Okkati Adakku', correctRole: 'heroine', notes: 'Lead Actress (debut heroine role)' },
  { actor: 'rambha', movie: 'Bhairava Dweepam', correctRole: 'heroine', notes: 'Lead Actress (Princess Padmavathi)' },
  { actor: 'rambha', movie: 'Alluda Majaka', correctRole: 'heroine', notes: 'Lead Actress (Bobby)' },
  { actor: 'rambha', movie: 'Bombay Priyudu', correctRole: 'heroine', notes: 'Lead Actress opposite J.D. Chakravarthy' },
  { actor: 'rambha', movie: 'Hitler', correctRole: 'heroine', notes: 'Lead Actress opposite Chiranjeevi' },
  { actor: 'rambha', movie: 'Kodanda Ramudu', correctRole: 'heroine', notes: 'Lead Actress opposite J.D. Chakravarthy' },
  { actor: 'rambha', movie: 'Mrugaraju', correctRole: 'cameo', notes: 'Cameo/Special Appearance in song' },
  { actor: 'rambha', movie: 'Sriramachandrulu', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'rambha', movie: 'Neeku Naaku', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'rambha', movie: 'Desamuduru', correctRole: 'cameo', notes: 'Special Appearance as item dancer' },
  { actor: 'rambha', movie: 'Quick Gun Murugun', correctRole: 'heroine', notes: 'Lead Actress (Mango Dolly)' },
  
  // Ravi Teja - Lead Actor corrections
  { actor: 'ravi teja', movie: 'Sindhooram', correctRole: 'hero', notes: 'Joint Lead (Chanti); first major breakout role' },
  { actor: 'ravi teja', movie: 'Chiranjeevulu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Avunu Valliddaru Ista Paddaru!', correctRole: 'hero', notes: 'Lead Actor (Anil)' },
  { actor: 'ravi teja', movie: 'Ee Abbai Chala Manchodu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Venky', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Bhadra', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Shock', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Dubai Seenu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Krishna', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Kick', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Mirapakay', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Nippu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Balupu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Power', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Kick 2', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Raja the Great', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Touch Chesi Chudu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Disco Raja', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'ravi teja', movie: 'Doosukeltha', correctRole: 'cameo', notes: 'Cameo/Narrator; provided voice-over' },
  
  // Rohit - Lead Actor corrections
  { actor: 'rohit', movie: '6 Teens', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'rohit', movie: 'Anaganaga O Kurraadu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'rohit', movie: 'Keelu Gurram', correctRole: 'hero', notes: 'Lead Actor' },
  
  // Sarath Babu - Lead Actor corrections
  { actor: 'sarath babu', movie: 'Guppedu Manasu', correctRole: 'hero', notes: 'Lead Actor in K. Balachander film' },
  
  // Satyanarayana - Lead Actor correction
  { actor: 'satyanarayana', movie: 'Tayaramma Bangarayya', correctRole: 'hero', notes: 'Joint Lead (Bangarayya) alongside Sowcar Janaki' },
  { actor: 'satyanarayana', movie: 'Saripodhaa Sanivaaram', correctRole: 'cameo', notes: 'Cameo/Special Appearance (Posthumous); appears in photo' },
  
  // Sharada - Lead Actress corrections
  { actor: 'sharada', movie: 'Sambarala Rambabu', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sharada', movie: 'Chelleli Kapuram', correctRole: 'heroine', notes: 'Lead Actress opposite Sobhan Babu' },
  { actor: 'sharada', movie: 'Kalam Marindi', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sharada', movie: 'Devudu Chesina Manushulu', correctRole: 'heroine', notes: 'Lead Actress (one of the female leads)' },
  { actor: 'sharada', movie: 'Balipeetam', correctRole: 'heroine', notes: 'Lead Actress opposite Sobhan Babu' },
  { actor: 'sharada', movie: 'Daana Veera Soora Karna', correctRole: 'heroine', notes: 'Lead Actress (Draupadi)' },
  { actor: 'sharada', movie: 'Gorintaku', correctRole: 'heroine', notes: 'Lead Actress opposite Sobhan Babu' },
  { actor: 'sharada', movie: 'Sardar Papa Rayudu', correctRole: 'heroine', notes: 'Lead Actress opposite Sr. NTR' },
  { actor: 'sharada', movie: 'Bobbili Brahmanna', correctRole: 'heroine', notes: 'Lead Actress opposite Krishnam Raju' },
  { actor: 'sharada', movie: 'Anasuyamma Gari Alludu', correctRole: 'heroine', notes: 'Lead Role (Title character Anasuyamma)' },
  { actor: 'sharada', movie: 'Sardar Krishnama Naidu', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna' },
  { actor: 'sharada', movie: 'Bhale Donga', correctRole: 'heroine', notes: 'Lead Actress opposite Krishna' },
  { actor: 'sharada', movie: 'Kadapa Redamma', correctRole: 'heroine', notes: 'Lead Role (Title character Redamma)' },
  { actor: 'sharada', movie: 'Major Chandrakanth', correctRole: 'heroine', notes: 'Lead Actress opposite Sr. NTR' },
  { actor: 'sharada', movie: 'Bobbili Simham', correctRole: 'heroine', notes: 'Lead Actress opposite Nandamuri Balakrishna' },
  
  // Simran - Lead Actress corrections
  { actor: 'simran', movie: 'Samarasimha Reddy', correctRole: 'heroine', notes: 'Lead Actress opposite Nandamuri Balakrishna' },
  { actor: 'simran', movie: 'Annayya', correctRole: 'heroine', notes: 'Lead Actress opposite Chiranjeevi' },
  { actor: 'simran', movie: 'Seema Simham', correctRole: 'heroine', notes: 'Lead Actress (Hema) opposite Nandamuri Balakrishna' },
  { actor: 'simran', movie: 'Jai', correctRole: 'cameo', notes: 'Cameo/Special Appearance; appeared only in song "Alek"' },
  { actor: 'simran', movie: 'Petta', correctRole: 'heroine', notes: 'Lead Actress (Mangalam) as love interest of Rajinikanth' },
  { actor: 'simran', movie: 'Mahaan', correctRole: 'heroine', notes: 'Lead Actress (Naachiyaar), wife of protagonist Gandhi Mahaan' },
  { actor: 'simran', movie: 'Aranmanai 4', correctRole: 'cameo', notes: 'Special Appearance; appeared in devotional song' },
  
  // Sivaji - Lead Actor correction
  { actor: 'sivaji', movie: 'Andaru Dongale Dorikithe', correctRole: 'hero', notes: 'Lead Actor in comedy film' },
  
  // Sobhan Babu - Lead Actor correction
  { actor: 'sobhan babu', movie: 'Daiva Balam', correctRole: 'hero', notes: 'Lead Actor (1959 debut as hero)' },
  
  // Sridevi - Corrections
  { actor: 'sridevi', movie: 'Badi Panthulu', correctRole: 'child_artist', notes: 'Child Artist; played granddaughter of NTR' },
  { actor: 'sridevi', movie: 'Bhakta Tukaram', correctRole: 'child_artist', notes: 'Child Artist' },
  { actor: 'sridevi', movie: 'Yashoda Krishna', correctRole: 'child_artist', notes: 'Child Artist (played Lord Krishna)' },
  { actor: 'sridevi', movie: 'Padaharella Vayasu', correctRole: 'heroine', notes: 'Lead Actress; breakout film as protagonist' },
  { actor: 'sridevi', movie: 'Puli Bidda', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Adavi Simhalu', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Oka Radha Iddaru Krishnulu', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Makutamleni Maharaju', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Jagadeka Veerudu Athiloka Sundari', correctRole: 'heroine', notes: 'Lead Actress (Tilottama); iconic career-defining role' },
  { actor: 'sridevi', movie: 'Kshana Kshanam', correctRole: 'heroine', notes: 'Lead Actress (Satya)' },
  { actor: 'sridevi', movie: 'Moondru Mudichu', correctRole: 'heroine', notes: 'Lead Actress; first lead role in Tamil' },
  { actor: 'sridevi', movie: 'Gaayathri', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Bala Nagamma', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Pokkiri Raja', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Naan Adimai Illai', correctRole: 'heroine', notes: 'Lead Actress' },
  { actor: 'sridevi', movie: 'Kumara Sambhavam', correctRole: 'child_artist', notes: 'Child Artist (Lord Subramanya)' },
  { actor: 'sridevi', movie: 'Swapnangal', correctRole: 'child_artist', notes: 'Child Artist' },
  { actor: 'sridevi', movie: 'Poompatta', correctRole: 'child_artist', notes: 'Child Artist; won Kerala State Film Award' },
  { actor: 'sridevi', movie: 'Aasheervaadam', correctRole: 'child_artist', notes: 'Child Artist' },
  { actor: 'sridevi', movie: 'Devaraagam', correctRole: 'heroine', notes: 'Lead Actress' },
  
  // Sumanth - Lead Actor corrections
  { actor: 'sumanth', movie: 'Prema Katha', correctRole: 'hero', notes: 'Lead Actor; debut film as hero' },
  { actor: 'sumanth', movie: 'Yuvakudu', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Ramma Chilakamma', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Satyam', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Gowri', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Godavari', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Classmates', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Golconda High School', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Emo Gurram Egaravachu', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Naruda Donoruda', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sumanth', movie: 'Subramanyapuram', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  
  // Sunil - Lead Actor corrections
  { actor: 'sunil', movie: 'Poola Rangadu', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sunil', movie: 'Mr.PelliKoduku', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sunil', movie: 'Bhimavaram Bullodu', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sunil', movie: 'Krishnashtami', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sunil', movie: 'Ungarala Rambabu', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'sunil', movie: 'Silly Fellows', correctRole: 'hero', notes: 'Joint Lead with Allari Naresh' },
  { actor: 'sunil', movie: 'Changure Bangaru Raja', correctRole: 'voice', notes: 'Voice Role; provided voice for the dog, Veerabobbili' },
  
  // Tarun - Corrections
  { actor: 'tarun', movie: 'Thalapathi', correctRole: 'child_artist', notes: 'Child Artist; played younger version of Rajinikanth character' },
  { actor: 'tarun', movie: 'Vajram', correctRole: 'child_artist', notes: 'Child Artist role' },
  { actor: 'tarun', movie: 'Nuvve Kavali', correctRole: 'hero', notes: 'Lead Actor; debut as protagonist' },
  { actor: 'tarun', movie: 'Priyamaina Neeku', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Nuvvu Leka Nenu Lenu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Ninne Ishtapaddanu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Sakhiya', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Soggadu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Nava Vasantham', correctRole: 'hero', notes: 'Joint Lead Actor (one of four friends)' },
  { actor: 'tarun', movie: 'Bhale Dongalu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Sasirekha Parinayam', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Chukkalanti Ammayi Chakkanaina Abbayi', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Yuddham', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'tarun', movie: 'Idi Naa Love Story', correctRole: 'hero', notes: 'Lead Actor' },
  
  // Varun Sandesh - Lead Actor corrections
  { actor: 'varun sandesh', movie: 'Happy Days', correctRole: 'hero', notes: 'Lead Actor (Chandru); breakout debut role' },
  { actor: 'varun sandesh', movie: 'Kotha Bangaru Lokam', correctRole: 'hero', notes: 'Lead Actor (Balu)' },
  { actor: 'varun sandesh', movie: 'Evaraina Epudaina', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'varun sandesh', movie: 'Maro Charitra', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'varun sandesh', movie: 'Kudirithe Kappu Coffee', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'varun sandesh', movie: 'Chammak Challo', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'varun sandesh', movie: 'Nuvvala Nenila', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'varun sandesh', movie: 'Nindha', correctRole: 'hero', notes: 'Lead Actor (Vivek); thriller comeback role' },
  
  // Venu - Lead Actor corrections
  { actor: 'venu', movie: 'Swayamvaram', correctRole: 'hero', notes: 'Lead Actor; debut as hero' },
  { actor: 'venu', movie: 'Manasu Paddanu Kaani', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'venu', movie: 'Hanuman Junction', correctRole: 'hero', notes: 'Joint Lead Actor with Jagapathi Babu' },
  { actor: 'venu', movie: 'Priya Nestama', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'venu', movie: 'Kushi Kushiga', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'venu', movie: 'Sada Mee Sevalo', correctRole: 'hero', notes: 'Lead Actor (Hero)' },
  { actor: 'venu', movie: 'Gopi Gopika Godavari', correctRole: 'hero', notes: 'Lead Actor (Gopi)' },
  
  // Vishnu - Lead Actor corrections
  { actor: 'vishnu', movie: 'Vishnu', correctRole: 'hero', notes: 'Lead Actor; debut film as hero' },
  { actor: 'vishnu', movie: 'Suryam', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Political Rowdy', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Astram', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Dhee', correctRole: 'hero', notes: 'Lead Actor; career-defining blockbuster' },
  { actor: 'vishnu', movie: 'Vastadu Naa Raju', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Dhenikaina Ready', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Doosukeltha', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Pandavulu Pandavulu Tummeda', correctRole: 'hero', notes: 'Joint Lead with father Mohan Babu' },
  { actor: 'vishnu', movie: 'Dynamite', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Eedo Rakam Aado Rakam', correctRole: 'hero', notes: 'Joint Lead with Rajendra Prasad' },
  { actor: 'vishnu', movie: 'Luckunnodu', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Gayatri', correctRole: 'hero', notes: 'Joint Lead (Dual role)' },
  { actor: 'vishnu', movie: 'Voter', correctRole: 'hero', notes: 'Lead Actor' },
  { actor: 'vishnu', movie: 'Mosagallu', correctRole: 'hero', notes: 'Lead Actor (Arjun)' },
  { actor: 'vishnu', movie: 'Ginna', correctRole: 'hero', notes: 'Lead Actor (Gali Nageswara Rao)' },
  { actor: 'vishnu', movie: 'Current Theega', correctRole: 'cameo', notes: 'Cameo Appearance; also produced the film' },
  { actor: 'vishnu', movie: 'Singham 123', correctRole: 'producer', notes: 'Producer / Special Appearance; Sampoornesh Babu is lead' },
  { actor: 'vishnu', movie: 'Son of India', correctRole: 'producer', notes: 'Producer; did not have supporting role (Mohan Babu is lead)' },
  { actor: 'vishnu', movie: 'Kannappa', correctRole: 'hero', notes: 'Lead Actor (Title Role)' },
];

interface CorrectionResult {
  actor: string;
  movie: string;
  correctRole: string;
  status: 'fixed' | 'not_found' | 'already_correct' | 'error';
  message: string;
}

function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

function normalizeMovieTitle(title: string): string {
  return title.toLowerCase().trim();
}

async function applyAttributionCorrections() {
  console.log('🔧 Applying attribution corrections based on user review...\n');

  const results: CorrectionResult[] = [];
  let fixedCount = 0;
  let notFoundCount = 0;
  let alreadyCorrectCount = 0;
  let errorCount = 0;

  for (const correction of CORRECTIONS) {
    const actorName = normalizeName(correction.actor);
    const movieTitle = normalizeMovieTitle(correction.movie);

    console.log(`📋 Processing: ${correction.actor} in "${correction.movie}" → ${correction.correctRole}`);

    // Find the movie
    const { data: movies, error: findError } = await supabase
      .from('movies')
      .select('id, title_en, hero, heroine, director, producer, supporting_cast')
      .ilike('title_en', `%${correction.movie}%`)
      .eq('is_published', true)
      .limit(5);

    if (findError) {
      console.error(`   ❌ Error finding movie: ${findError.message}`);
      results.push({
        actor: correction.actor,
        movie: correction.movie,
        correctRole: correction.correctRole,
        status: 'error',
        message: findError.message,
      });
      errorCount++;
      continue;
    }

    if (!movies || movies.length === 0) {
      console.log(`   ⚠️  Movie not found: "${correction.movie}"`);
      results.push({
        actor: correction.actor,
        movie: correction.movie,
        correctRole: correction.correctRole,
        status: 'not_found',
        message: 'Movie not found in database',
      });
      notFoundCount++;
      continue;
    }

    // Use the first match (or best match if multiple)
    const movie = movies[0];
    if (movies.length > 1) {
      // Try to find exact match
      const exactMatch = movies.find(m => 
        normalizeMovieTitle(m.title_en || '') === movieTitle
      );
      if (exactMatch) {
        Object.assign(movie, exactMatch);
      }
    }

    // Check if actor is in supporting_cast
    const supportingCast = (movie.supporting_cast as any[]) || [];
    const actorInSupporting = supportingCast.findIndex(
      (member: any) => normalizeName(member.name || '') === actorName
    );

    if (actorInSupporting === -1) {
      console.log(`   ℹ️  Actor not found in supporting_cast, checking other fields...`);
      
      // Check if already in hero/heroine
      const inHero = movie.hero?.toLowerCase().includes(actorName);
      const inHeroine = movie.heroine?.toLowerCase().includes(actorName);
      
      if ((correction.correctRole === 'hero' && inHero) || 
          (correction.correctRole === 'heroine' && inHeroine)) {
        console.log(`   ✅ Already correct (in ${correction.correctRole})`);
        results.push({
          actor: correction.actor,
          movie: correction.movie,
          correctRole: correction.correctRole,
          status: 'already_correct',
          message: `Already in ${correction.correctRole} field`,
        });
        alreadyCorrectCount++;
        continue;
      }
      
      // If not in supporting_cast and not in hero/heroine, skip
      console.log(`   ⚠️  Actor not found in supporting_cast or hero/heroine fields`);
      results.push({
        actor: correction.actor,
        movie: correction.movie,
        correctRole: correction.correctRole,
        status: 'not_found',
        message: 'Actor not found in supporting_cast or hero/heroine',
      });
      notFoundCount++;
      continue;
    }

    // Remove from supporting_cast
    const updatedSupportingCast = supportingCast.filter(
      (_, index) => index !== actorInSupporting
    );

    // Prepare update based on correctRole
    const updateData: any = {
      supporting_cast: updatedSupportingCast.length > 0 ? updatedSupportingCast : null,
    };

    if (correction.correctRole === 'hero') {
      // Add to hero field
      const currentHero = movie.hero || '';
      const heroNames = currentHero.split(',').map(n => n.trim()).filter(n => n.length > 0);
      if (!heroNames.some(n => normalizeName(n) === actorName)) {
        updateData.hero = currentHero ? `${currentHero}, ${correction.actor}` : correction.actor;
      }
    } else if (correction.correctRole === 'heroine') {
      // Add to heroine field
      const currentHeroine = movie.heroine || '';
      const heroineNames = currentHeroine.split(',').map(n => n.trim()).filter(n => n.length > 0);
      if (!heroineNames.some(n => normalizeName(n) === actorName)) {
        updateData.heroine = currentHeroine ? `${currentHeroine}, ${correction.actor}` : correction.actor;
      }
    } else if (correction.correctRole === 'director') {
      // Add to director field
      const currentDirector = movie.director || '';
      const directorNames = currentDirector.split(',').map(n => n.trim()).filter(n => n.length > 0);
      if (!directorNames.some(n => normalizeName(n) === actorName)) {
        updateData.director = currentDirector ? `${currentDirector}, ${correction.actor}` : correction.actor;
      }
    } else if (correction.correctRole === 'producer') {
      // Add to producer field
      const currentProducer = movie.producer || '';
      const producerNames = currentProducer.split(',').map(n => n.trim()).filter(n => n.length > 0);
      if (!producerNames.some(n => normalizeName(n) === actorName)) {
        updateData.producer = currentProducer ? `${currentProducer}, ${correction.actor}` : correction.actor;
      }
    } else if (correction.correctRole === 'cameo') {
      // Keep in supporting_cast but change type to 'cameo'
      const member = supportingCast[actorInSupporting];
      member.type = 'cameo';
      updateData.supporting_cast = [...updatedSupportingCast, member];
    } else if (correction.correctRole === 'child_artist') {
      // Keep in supporting_cast but change type to 'special' and add note
      const member = supportingCast[actorInSupporting];
      member.type = 'special';
      member.role = member.role ? `${member.role} (Child Artist)` : 'Child Artist';
      updateData.supporting_cast = [...updatedSupportingCast, member];
    } else if (correction.correctRole === 'narrator' || correction.correctRole === 'voice') {
      // Keep in supporting_cast but change type to 'special'
      const member = supportingCast[actorInSupporting];
      member.type = 'special';
      member.role = member.role ? `${member.role} (${correction.correctRole})` : correction.correctRole;
      updateData.supporting_cast = [...updatedSupportingCast, member];
    } else if (correction.correctRole === 'remove') {
      // Just remove from supporting_cast, don't add anywhere else
      // updateData already has supporting_cast set
    }

    // Apply update
    const { error: updateError } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', movie.id);

    if (updateError) {
      console.error(`   ❌ Error updating: ${updateError.message}`);
      results.push({
        actor: correction.actor,
        movie: correction.movie,
        correctRole: correction.correctRole,
        status: 'error',
        message: updateError.message,
      });
      errorCount++;
    } else {
      console.log(`   ✅ Fixed: Moved from supporting_cast to ${correction.correctRole}`);
      if (correction.notes) {
        console.log(`      Note: ${correction.notes}`);
      }
      results.push({
        actor: correction.actor,
        movie: correction.movie,
        correctRole: correction.correctRole,
        status: 'fixed',
        message: `Moved from supporting_cast to ${correction.correctRole}`,
      });
      fixedCount++;
    }
    console.log('');
  }

  // Generate report
  const csvHeader = 'Actor,Movie,Correct Role,Status,Message';
  const csvRows = results.map(r => {
    const escape = (val: any) => `"${String(val).replace(/"/g, '""')}"`;
    return [
      escape(r.actor),
      escape(r.movie),
      escape(r.correctRole),
      escape(r.status),
      escape(r.message),
    ].join(',');
  });

  const csvPath = path.join(process.cwd(), 'ATTRIBUTION-CORRECTIONS-APPLIED.csv');
  fs.writeFileSync(csvPath, [csvHeader, ...csvRows].join('\n'), 'utf-8');

  console.log('\n📊 Summary:');
  console.log(`   ✅ Fixed: ${fixedCount}`);
  console.log(`   ⚠️  Not Found: ${notFoundCount}`);
  console.log(`   ℹ️  Already Correct: ${alreadyCorrectCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`\n📝 Report saved to: ${csvPath}\n`);
  console.log('✨ Corrections applied!\n');
}

applyAttributionCorrections().catch(console.error);
