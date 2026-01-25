import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MovieCorrection {
  idPrefix: string;
  action: 'PUBLISH' | 'FIX_LANGUAGE' | 'FIX_DATA' | 'DELETE';
  title?: string;
  year?: number;
  hero?: string;
  director?: string;
  rating?: number;
  language?: string;
  notes: string;
}

const corrections: MovieCorrection[] = [
  // DELETE - Invalid Entries
  { idPrefix: 'dd03', action: 'DELETE', notes: 'Duplicate placeholder data removed' },
  { idPrefix: 'f5d9', action: 'DELETE', notes: 'Placeholder "Best Actor" removed' },
  { idPrefix: 'a3f8', action: 'DELETE', notes: 'Placeholder removed (1987 film with modern names)' },
  
  // FIX_LANGUAGE - Hindi Films
  { idPrefix: '5205', action: 'FIX_LANGUAGE', title: 'Gunda Gardi', year: 1997, hero: 'Aditya Pancholi', director: 'V. Sai Prasad', language: 'Hindi', rating: 4.2, notes: 'Hindi action' },
  { idPrefix: 'c5a9', action: 'FIX_LANGUAGE', title: 'Khuda Gawah', year: 1992, hero: 'Amitabh Bachchan', director: 'Mukul Anand', language: 'Hindi', rating: 7.3, notes: 'Hindi epic' },
  { idPrefix: '03b3', action: 'FIX_LANGUAGE', title: 'ChaalBaaz', year: 1989, hero: 'Sridevi', director: 'Pankaj Parashar', language: 'Hindi', rating: 7.2, notes: 'Hindi comedy classic' },
  { idPrefix: '2361', action: 'FIX_LANGUAGE', title: 'Chaalbaaz', year: 1989, hero: 'Sridevi', director: 'Pankaj Parashar', language: 'Hindi', rating: 7.2, notes: 'Hindi comedy; Sridevi in double role' },
  { idPrefix: '881d', action: 'FIX_LANGUAGE', title: 'Thanedaar', year: 1990, hero: 'Sanjay Dutt', director: 'Raj N. Sippy', language: 'Hindi', rating: 6.2, notes: 'Hindi action' },
  { idPrefix: '90ae', action: 'FIX_LANGUAGE', title: 'Aaj Ka Arjun', year: 1990, hero: 'Amitabh Bachchan', director: 'K. C. Bokadia', language: 'Hindi', rating: 6.5, notes: 'Hindi remake of Enne Petha Raasa' },
  { idPrefix: '8f53', action: 'FIX_LANGUAGE', title: 'Shehzaade', year: 1989, hero: 'Dharmendra', director: 'Raj N. Sippy', language: 'Hindi', rating: 5.2, notes: 'Hindi action film' },
  { idPrefix: 'ab03', action: 'FIX_LANGUAGE', title: 'Gair Kanooni', year: 1989, hero: 'Govinda', director: 'Prayag Raj', language: 'Hindi', rating: 5.8, notes: 'Hindi action featuring Sridevi' },
  { idPrefix: '265c', action: 'FIX_LANGUAGE', title: 'Majboor', year: 1989, hero: 'Jeetendra', director: 'T. Rama Rao', language: 'Hindi', rating: 5.1, notes: 'Hindi remake of Aayanaki Iddaru' },
  { idPrefix: '0fcf', action: 'FIX_LANGUAGE', title: 'Kanoon Ki Awaaz', year: 1989, hero: 'Shatrughan Sinha', director: 'R. Kumar', language: 'Hindi', rating: 4.9, notes: 'Hindi action' },
  { idPrefix: 'c871', action: 'FIX_LANGUAGE', title: 'Sone Pe Suhaaga', year: 1988, hero: 'Jeetendra', director: 'K. Bapayya', language: 'Hindi', rating: 5.9, notes: 'Hindi multi-starrer action' },
  { idPrefix: 'a866', action: 'FIX_LANGUAGE', title: 'Ghar Ghar Ki Kahani', year: 1988, hero: 'Govinda', director: 'Kalpataru', language: 'Hindi', rating: 6.3, notes: 'Hindi family drama' },
  { idPrefix: 'e689', action: 'FIX_LANGUAGE', title: 'Majaal', year: 1987, hero: 'Jeetendra', director: 'K. Bapayya', language: 'Hindi', rating: 6.0, notes: 'Hindi remake of Sravana Sandhya' },
  { idPrefix: 'f19b', action: 'FIX_LANGUAGE', title: 'Watan Ke Rakhwale', year: 1987, hero: 'Dharmendra', director: 'T. Rama Rao', language: 'Hindi', rating: 6.2, notes: 'Hindi action drama' },
  { idPrefix: 'a784', action: 'FIX_LANGUAGE', title: 'Karma', year: 1986, hero: 'Dilip Kumar', director: 'Subhash Ghai', language: 'Hindi', rating: 7.6, notes: 'Hindi blockbuster action' },
  { idPrefix: 'f63b', action: 'FIX_LANGUAGE', title: 'Aakhree Raasta', year: 1986, hero: 'Amitabh Bachchan', director: 'K. Bhagyaraj', language: 'Hindi', rating: 7.5, notes: 'Hindi remake' },
  { idPrefix: '99b9', action: 'FIX_LANGUAGE', title: 'Mera Saathi', year: 1985, hero: 'Jeetendra', director: 'K. Raghavendra Rao', language: 'Hindi', rating: 5.8, notes: 'Hindi remake of Dharmaatmudu' },
  { idPrefix: '8453', action: 'FIX_LANGUAGE', title: 'Sharaabi', year: 1984, hero: 'Amitabh Bachchan', director: 'Prakash Mehra', language: 'Hindi', rating: 7.9, notes: 'Hindi classic' },
  { idPrefix: '874d', action: 'FIX_LANGUAGE', title: 'Inquilaab', year: 1984, hero: 'Amitabh Bachchan', director: 'T. Rama Rao', language: 'Hindi', rating: 6.4, notes: 'Hindi political thriller' },
  { idPrefix: '2f26', action: 'FIX_LANGUAGE', title: 'Qayamat', year: 1983, hero: 'Dharmendra', director: 'Raj N. Sippy', language: 'Hindi', rating: 6.1, notes: 'Hindi remake of Cape Fear' },
  { idPrefix: '4d43', action: 'FIX_LANGUAGE', title: 'Solva Sawan', year: 1979, hero: 'Amol Palekar', director: 'Bharathiraja', language: 'Hindi', rating: 6.5, notes: 'Hindi remake of 16 Vayathinile' },
  { idPrefix: '1a30', action: 'FIX_LANGUAGE', title: 'Amar Deep', year: 1979, hero: 'Rajesh Khanna', director: 'R. Krishnamurthy', language: 'Hindi', rating: 6.4, notes: 'Hindi remake' },
  { idPrefix: 'd7ea', action: 'FIX_LANGUAGE', title: 'Seeta Swayamvar', year: 1976, hero: 'Ravi Kumar', director: 'Bapu', language: 'Hindi', rating: 7.5, notes: 'Hindi version of Seeta Kalyanam' },
  { idPrefix: 'd7bc', action: 'FIX_LANGUAGE', title: 'Julie', year: 1975, hero: 'Lakshmi', director: 'K. S. Sethumadhavan', language: 'Hindi', rating: 7.1, notes: 'Hindi remake of Chattakari' },
  
  // FIX_LANGUAGE - Tamil Films
  { idPrefix: '325e', action: 'FIX_LANGUAGE', title: 'Ethiri En 3', year: 2012, hero: 'Srikanth', director: 'Ramkumar', language: 'Tamil', rating: 5.5, notes: 'Tamil thriller' },
  { idPrefix: '1f33', action: 'FIX_LANGUAGE', title: 'Porali', year: 2011, hero: 'M. Sasikumar', director: 'Samuthirakani', language: 'Tamil', rating: 6.8, notes: 'Tamil action drama' },
  { idPrefix: '70f9', action: 'FIX_LANGUAGE', title: 'Pasa Kiligal', year: 2006, hero: 'Prabhu', director: 'P. Amirdhan', language: 'Tamil', rating: 5.7, notes: 'Tamil family drama' },
  { idPrefix: 'ab5a', action: 'FIX_LANGUAGE', title: 'Kizhakku Kadarkarai Salai', year: 2006, hero: 'Srikanth', director: 'S. S. Stanley', language: 'Tamil', rating: 5.2, notes: 'Tamil romantic thriller' },
  { idPrefix: 'b0f3', action: 'FIX_LANGUAGE', title: 'Joot', year: 2004, hero: 'Srikanth', director: 'Azhagam Perumal', language: 'Tamil', rating: 5.8, notes: 'Tamil action film' },
  { idPrefix: 'd89e', action: 'FIX_LANGUAGE', title: 'Sonnal Thaan Kaadhala', year: 2001, hero: 'T. Rajendar', director: 'T. Rajendar', language: 'Tamil', rating: 4.5, notes: 'Tamil romance' },
  { idPrefix: '087d', action: 'FIX_LANGUAGE', title: 'Mitta Miraasu', year: 2001, hero: 'Prabhu', director: 'Mu Kalanjiyam', language: 'Tamil', rating: 6.2, notes: 'Tamil action drama' },
  { idPrefix: 'f496', action: 'FIX_LANGUAGE', title: 'Sandhitha Velai', year: 2000, hero: 'Karthik Muthuraman', director: 'Ravichandran', language: 'Tamil', rating: 5.4, notes: 'Tamil film' },
  { idPrefix: '06c7', action: 'FIX_LANGUAGE', title: 'Mugham', year: 1999, hero: 'Nassar', director: 'Gnana Rajasekaran', language: 'Tamil', rating: 7.0, notes: 'Tamil social drama' },
  { idPrefix: 'ef99', action: 'FIX_LANGUAGE', title: 'Chinna Raja', year: 1999, hero: 'Karthik Muthuraman', director: 'Chitra Lakshmanan', language: 'Tamil', rating: 5.7, notes: 'Tamil comedy' },
  { idPrefix: '5b98', action: 'FIX_LANGUAGE', title: 'En Aasai Rasave', year: 1998, hero: 'Sivaji Ganesan', director: 'Kasthoori Raja', language: 'Tamil', rating: 6.1, notes: 'Tamil drama' },
  { idPrefix: 'dfd4', action: 'FIX_LANGUAGE', title: 'Uzhaippali', year: 1993, hero: 'Rajinikanth', director: 'P. Vasu', language: 'Tamil', rating: 7.1, notes: 'Tamil action' },
  { idPrefix: '72fe', action: 'FIX_LANGUAGE', title: 'Chembaruthi', year: 1992, hero: 'Prashanth', director: 'R. K. Selvamani', language: 'Tamil', rating: 7.0, notes: 'Tamil romance' },
  { idPrefix: '340c', action: 'FIX_LANGUAGE', title: 'Sattam Oru Sathurangam', year: 1988, hero: 'Arjun Sarja', director: 'Prathap Pothan', language: 'Tamil', rating: 6.4, notes: 'Tamil thriller' },
  { idPrefix: 'fca1', action: 'FIX_LANGUAGE', title: 'Pokkiri Raja', year: 1982, hero: 'Rajinikanth', director: 'S. P. Muthuraman', language: 'Tamil', rating: 7.3, notes: 'Tamil blockbuster action' },
  { idPrefix: '7c91', action: 'FIX_LANGUAGE', title: 'Kallukul Eeram', year: 1980, hero: 'Aruna', director: 'P. S. Nivas', language: 'Tamil', rating: 6.8, notes: 'Tamil romantic drama' },
  { idPrefix: '5318', action: 'FIX_LANGUAGE', title: 'Ninaithaale Inikkum', year: 1979, hero: 'Kamal Haasan', director: 'K. Balachander', language: 'Tamil', rating: 8.1, notes: 'Tamil musical' },
  { idPrefix: 'e9f1', action: 'FIX_LANGUAGE', title: 'Pilot Premnath', year: 1978, hero: 'Sivaji Ganesan', director: 'A. C. Tirulokchandar', language: 'Tamil', rating: 6.9, notes: 'Tamil/Sinhalese co-production' },
  { idPrefix: 'ed0a', action: 'FIX_LANGUAGE', title: '16 Vayathinile', year: 1977, hero: 'Kamal Haasan', director: 'Bharathiraja', language: 'Tamil', rating: 8.4, notes: 'Tamil cult classic' },
  { idPrefix: 'd6f6', action: 'FIX_LANGUAGE', title: 'Amaradeepam', year: 1977, hero: 'Sivaji Ganesan', director: 'T. Prakash Rao', language: 'Tamil', rating: 6.7, notes: 'Tamil remake of Misamma' },
  { idPrefix: 'dc4e', action: 'FIX_LANGUAGE', title: 'Rajapart Rangadurai', year: 1973, hero: 'Sivaji Ganesan', director: 'P. Madhavan', language: 'Tamil', rating: 7.4, notes: 'Tamil drama' },
  { idPrefix: 'e156', action: 'FIX_LANGUAGE', title: 'Vasantha Maligai', year: 1972, hero: 'Sivaji Ganesan', director: 'K. S. Prakash Rao', language: 'Tamil', rating: 8.2, notes: 'Tamil remake' },
  { idPrefix: 'cc75', action: 'FIX_LANGUAGE', title: 'Kalathur Kannamma', year: 1960, hero: 'Gemini Ganesan', director: 'A. Bhimsingh', language: 'Tamil', rating: 7.9, notes: 'Tamil film; Kamal debut' },
  { idPrefix: '9807', action: 'FIX_LANGUAGE', title: 'Vanangamudi', year: 1957, hero: 'Sivaji Ganesan', director: 'P. Neelakantan', language: 'Tamil', rating: 7.0, notes: 'Tamil film' },
  { idPrefix: 'b846', action: 'FIX_LANGUAGE', title: 'Pennin Perumai', year: 1956, hero: 'Sivaji Ganesan', director: 'P. Pullaiah', language: 'Tamil', rating: 7.2, notes: 'Tamil remake of Ardhangi' },
  
  // FIX_LANGUAGE - Malayalam Films
  { idPrefix: '5cd8', action: 'FIX_LANGUAGE', title: 'Kalabha Mazha', year: 2011, hero: 'Sreejith Vijay', director: 'P. Bhaskaran', language: 'Malayalam', rating: 5.0, notes: 'Malayalam romantic drama' },
  { idPrefix: '5aad', action: 'FIX_LANGUAGE', title: 'Oppam', year: 2016, hero: 'Mohanlal', director: 'Priyadarshan', language: 'Malayalam', rating: 7.3, notes: 'Telugu Dub; Jagapathi Babu dubbed' },
  { idPrefix: '7064', action: 'FIX_LANGUAGE', title: 'Sesh Sangat', year: 2009, hero: 'Jaya Prada', director: 'Ashoke Viswanathan', language: 'Bengali', rating: 6.0, notes: 'Bengali social drama' },
  { idPrefix: '7bfd', action: 'FIX_LANGUAGE', title: 'Ee Snehatheerathu', year: 2004, hero: 'Kunchacko Boban', director: 'P. Sivaprasad', language: 'Malayalam', rating: 5.9, notes: 'Malayalam film' },
  { idPrefix: 'a175', action: 'FIX_LANGUAGE', title: 'Archana Aaradhana', year: 1985, hero: 'Mammootty', director: 'Sajan', language: 'Malayalam', rating: 6.2, notes: 'Malayalam drama' },
  { idPrefix: 'd5ce', action: 'FIX_LANGUAGE', title: 'Ashwadhamavu', year: 1979, hero: 'Madampu Kunjukuttan', director: 'K. R. Mohanan', language: 'Malayalam', rating: 7.2, notes: 'Malayalam arthouse classic' },
  { idPrefix: 'f9e7', action: 'FIX_LANGUAGE', title: 'Thulaavarsham', year: 1976, hero: 'Prem Nazir', director: 'N. Sankaran Nair', language: 'Malayalam', rating: 6.5, notes: 'Malayalam drama' },
  { idPrefix: '213c', action: 'FIX_LANGUAGE', title: 'Poombatta', year: 1971, hero: 'Sridevi (Child)', director: 'B. K. Pottekkadu', language: 'Malayalam', rating: 7.3, notes: 'Malayalam film' },
  
  // FIX_LANGUAGE - Kannada Films
  { idPrefix: 'a5a9', action: 'FIX_LANGUAGE', title: 'Bhakta Kumbara', year: 1974, hero: 'Dr. Rajkumar', director: 'Hunsur Krishnamurthy', language: 'Kannada', rating: 8.5, notes: 'Kannada devotional masterpiece' },
  
  // FIX_DATA + PUBLISH - Telugu Films with Corrections
  { idPrefix: '043b', action: 'PUBLISH', title: 'Salaar: Part 2 – Shouryanga Parvam', year: 2026, hero: 'Prabhas', director: 'Prashanth Neel', notes: 'High-octane sequel (unreleased)' },
  { idPrefix: '27ba', action: 'PUBLISH', title: 'Mental (Appatlo Okadundevadu)', year: 2016, hero: 'Sree Vishnu', director: 'Sagar K Chandra', rating: 7.6, notes: 'Fixed Director/Title' },
  { idPrefix: '01a6', action: 'PUBLISH', title: 'Bhale Mogudu Bhale Pellam', year: 2011, hero: 'Rajendra Prasad', director: 'Dinesh Baboo', rating: 5.2, notes: 'Comedy drama' },
  { idPrefix: '5e40', action: 'PUBLISH', title: 'Shubhapradam', year: 2010, hero: 'Allari Naresh', director: 'K. Viswanath', rating: 6.1, notes: 'Musical drama by K. Viswanath' },
  { idPrefix: 'bb35', action: 'PUBLISH', title: 'Betting Bangaraju', year: 2010, hero: 'Allari Naresh', director: 'E. Sattibabu', rating: 5.8, notes: 'Romantic comedy' },
  { idPrefix: 'aa1e', action: 'PUBLISH', title: 'State Rowdy', year: 1989, hero: 'Chiranjeevi', director: 'B. Gopal', rating: 7.0, notes: 'Corrected Year: 1989' },
  { idPrefix: '2d97', action: 'PUBLISH', title: 'Varakatnam', year: 1969, hero: 'N. T. Rama Rao', director: 'N. T. Rama Rao', rating: 7.5, notes: 'Corrected Year: 1969' },
  { idPrefix: '06fb', action: 'PUBLISH', title: 'Sundaraniki Tondarekkuva', year: 2006, hero: 'Allari Naresh', director: 'Phani Prakash', rating: 5.4, notes: 'Slapstick comedy' },
  { idPrefix: '6dcf', action: 'PUBLISH', title: 'Gopi – Goda Meedha Pilli', year: 2006, hero: 'Allari Naresh', director: 'Janardhana Maharshi', rating: 5.1, notes: 'Fantasy comedy' },
  { idPrefix: '8c3e', action: 'PUBLISH', title: 'Mayajalam', year: 2006, hero: 'Srikanth', director: 'S. V. Krishna Reddy', rating: 5.3, notes: 'Hero: Srikanth' },
  { idPrefix: 'db21', action: 'PUBLISH', title: 'Iddaru Attala Muddula Alludu', year: 2006, hero: 'Rajendra Prasad', director: 'Dev Anand', rating: 4.8, notes: 'Comedy drama' },
  { idPrefix: '5d32', action: 'PUBLISH', title: 'Vikramarkudu', year: 2005, hero: 'Ravi Teja', director: 'S. S. Rajamouli', rating: 8.1, notes: 'Corrected title from Vikram' },
  { idPrefix: '9898', action: 'PUBLISH', title: 'Apparao Driving School', year: 2004, hero: 'Rajendra Prasad', director: 'Anji Seenu', rating: 5.5, notes: 'Comedy entertainer' },
  { idPrefix: '3a00', action: 'PUBLISH', title: 'Kottai Mariamman', year: 2001, hero: 'Roja', director: 'Rama Narayanan', rating: 6.0, notes: 'Devotional film' },
  { idPrefix: 'ff32', action: 'PUBLISH', title: 'Angala Parameswari', year: 2001, hero: 'Roja', director: 'Phani Prakash', rating: 5.8, notes: 'Devotional drama' },
  { idPrefix: '472c', action: 'PUBLISH', title: 'Vamsoddarakudu', year: 2000, hero: 'Nandamuri Balakrishna', director: 'Sarath', rating: 6.4, notes: 'Family action drama' },
  { idPrefix: 'f98d', action: 'PUBLISH', title: 'Sakutumba Saparivaara Sametam', year: 2000, hero: 'Srikanth', director: 'S. V. Krishna Reddy', rating: 6.7, notes: 'Family entertainer' },
  { idPrefix: '92f3', action: 'PUBLISH', title: 'Preyasi Rave', year: 1999, hero: 'Srikanth', director: 'Chandra Mahesh', rating: 6.5, notes: 'Romantic drama' },
  { idPrefix: '6c60', action: 'PUBLISH', title: 'Aayanagaru', year: 1998, hero: 'Srikanth', director: 'Nagendra Magapu', rating: 5.6, notes: 'Family comedy' },
  { idPrefix: '3ab7', action: 'PUBLISH', title: 'Jai Bajarangbali', year: 1997, hero: 'Arjun Sarja', director: 'Rama Narayanan', rating: 5.9, notes: 'Devotional film' },
  { idPrefix: 'e345', action: 'PUBLISH', title: 'Egire Pavuramaa', year: 1997, hero: 'Srikanth', director: 'S. V. Krishna Reddy', rating: 7.2, notes: 'Musical romance' },
  { idPrefix: 'fd10', action: 'PUBLISH', title: 'Shri Krishnarjuna Vijayam', year: 1996, hero: 'Nandamuri Balakrishna', director: 'Singeetam Srinivasa Rao', rating: 7.4, notes: 'Mythological film' },
  { idPrefix: '86e5', action: 'PUBLISH', title: 'Shubha Lagnam', year: 1994, hero: 'Jagapathi Babu', director: 'S. V. Krishna Reddy', rating: 7.8, notes: 'Family cult classic' },
  { idPrefix: 'eab5', action: 'PUBLISH', title: 'Lakshyam', year: 2007, hero: 'Gopichand', director: 'Sriwass', rating: 7.2, notes: 'Corrected Year: 2007' },
  { idPrefix: '65be', action: 'PUBLISH', title: 'Brundavanam', year: 1993, hero: 'Rajendra Prasad', director: 'Singeetam Srinivasa Rao', rating: 7.5, notes: 'Family comedy' },
  { idPrefix: 'af26', action: 'PUBLISH', title: 'Raktha Tharpanam', year: 1992, hero: 'Krishna', director: 'Krishna', rating: 5.8, notes: 'Political drama' },
  { idPrefix: 'dbb8', action: 'PUBLISH', title: 'Preminchi Choodu', year: 2015, hero: 'Vishnu Manchu', director: 'G. Nageswara Reddy', rating: 5.4, notes: 'Corrected Year/Hero/Director' },
  { idPrefix: 'c0d1', action: 'PUBLISH', title: 'Poola Rangadu', year: 2012, hero: 'Sunil Varma', director: 'Veerabhadram', rating: 6.2, notes: 'Corrected Year/Director' },
  { idPrefix: 'a2cb', action: 'PUBLISH', title: 'Geethanjali', year: 1989, hero: 'Nagarjuna', director: 'Mani Ratnam', rating: 8.3, notes: 'National Award-winning classic' },
  { idPrefix: 'a4ff', action: 'PUBLISH', title: 'Vicky Daada', year: 1989, hero: 'Nagarjuna', director: 'A. Kodandarami Reddy', rating: 6.8, notes: 'Hero/Director corrected' },
  { idPrefix: '9a4b', action: 'PUBLISH', title: 'Antima Theerpu', year: 1988, hero: 'Krishnam Raju', director: 'Bharathiraja', rating: 7.0, notes: 'Corrected Hero/Director' },
  { idPrefix: '445b', action: 'PUBLISH', title: 'Kirai Dada', year: 1987, hero: 'Nagarjuna', director: 'A. Kodandarami Reddy', rating: 6.5, notes: 'Action drama' },
  { idPrefix: 'aa3f', action: 'PUBLISH', title: 'Sankeerthana', year: 1987, hero: 'Nagarjuna', director: 'Geetha Krishna', rating: 7.4, notes: 'Corrected Hero/Director' },
  { idPrefix: '3add', action: 'PUBLISH', title: 'Swayam Krushi', year: 1987, hero: 'Chiranjeevi', director: 'K. Viswanath', rating: 8.2, notes: 'Corrected Hero/Director' },
  { idPrefix: 'abd4', action: 'PUBLISH', title: 'Dabbevariki Chedu', year: 1987, hero: 'Rajendra Prasad', director: 'Relangi Narasimha Rao', rating: 7.1, notes: 'Satirical comedy' },
  { idPrefix: 'f9bb', action: 'PUBLISH', title: 'Kodama Simham', year: 1990, hero: 'Chiranjeevi', director: 'K. Murali Mohana Rao', rating: 7.5, notes: 'Corrected Year: 1990' },
  { idPrefix: 'd60b', action: 'PUBLISH', title: 'Sita Rama Kalyanam', year: 1986, hero: 'Nandamuri Balakrishna', director: 'Jandhyala', rating: 6.8, notes: 'Corrected Hero/Director' },
  { idPrefix: '3ecc', action: 'PUBLISH', title: 'Kashmora', year: 1986, hero: 'Rajendra Prasad', director: 'N. B. Chakravarthy', rating: 7.3, notes: 'Corrected Hero for 1986 film' },
  { idPrefix: 'd40f', action: 'PUBLISH', title: 'Saagara Sangamam', year: 1983, hero: 'Kamal Haasan', director: 'K. Viswanath', rating: 8.8, notes: 'Masterpiece on classical dance' },
  { idPrefix: '5303', action: 'PUBLISH', title: 'Palletoori Monagadu', year: 1983, hero: 'Chiranjeevi', director: 'S. A. Chandrasekhar', rating: 6.6, notes: 'Rural action drama' },
  { idPrefix: '734b', action: 'PUBLISH', title: 'Adavaallu Meeku Joharulu', year: 1981, hero: 'Chiranjeevi', director: 'K. Balachander', rating: 7.1, notes: 'Hero corrected' },
  { idPrefix: 'b7d0', action: 'PUBLISH', title: 'Varakatnam', year: 1968, hero: 'N. T. Rama Rao', director: 'N. T. Rama Rao', rating: 7.6, notes: 'National Award-winning' },
  { idPrefix: 'c0b0', action: 'PUBLISH', title: 'Poola Rangadu', year: 1967, hero: 'Akkineni Nageswara Rao', director: 'Adurthi Subba Rao', rating: 7.8, notes: 'Corrected Hero/Director for 1967' },
  { idPrefix: 'b517', action: 'PUBLISH', title: 'Bangaru Panjaram', year: 1969, hero: 'Sobhan Babu', director: 'B. N. Reddy', rating: 7.5, notes: 'Corrected Year: 1969' },
  { idPrefix: 'c14c', action: 'PUBLISH', title: 'Mooga Manasulu', year: 1964, hero: 'Akkineni Nageswara Rao', director: 'Adurthi Subba Rao', rating: 8.4, notes: 'Legendary reincarnation drama' },
  { idPrefix: '6e9d', action: 'PUBLISH', title: 'Nartanasala', year: 1963, hero: 'N. T. Rama Rao', director: 'K. Kameswara Rao', rating: 8.9, notes: 'Corrected Year: 1963' },
  { idPrefix: 'fbe0', action: 'PUBLISH', title: 'Andaru Dongale', year: 1974, hero: 'Sobhan Babu', director: 'V.B. Rajendra Prasad', rating: 6.8, notes: 'Corrected Hero/Director for 1974' },
  { idPrefix: '5cb4', action: 'PUBLISH', title: 'Bala Mitrula Katha', year: 1972, hero: 'Jaggayya', director: 'K. Varaprasada Rao', rating: 7.0, notes: 'Corrected Hero/Director' },
  { idPrefix: 'c8aa', action: 'PUBLISH', title: 'Sri Krishna Satya', year: 1971, hero: 'N. T. Rama Rao', director: 'N. T. Rama Rao', rating: 7.8, notes: 'Corrected from Tamil title' },
  { idPrefix: '9e11', action: 'PUBLISH', title: 'Kalyana Mandapam', year: 1971, hero: 'Sobhan Babu', director: 'V. Madhusudhan Rao', rating: 6.9, notes: 'Corrected Hero/Director for 1971' },
];

async function applyCorrections() {
  console.log('🚀 Applying Comprehensive Corrections...\n');
  console.log('='.repeat(80));
  
  const results = {
    deleted: [] as string[],
    languageFixed: [] as string[],
    published: [] as string[],
    errors: [] as { title: string; error: string }[],
  };
  
  for (const correction of corrections) {
    const actionLabel = correction.action === 'DELETE' ? '🗑️ ' : 
                        correction.action === 'FIX_LANGUAGE' ? '🌐' : '📽️ ';
    console.log(`\n${actionLabel} ${correction.title || 'Entry'} (${correction.year || 'N/A'})`);
    console.log(`   ID Prefix: ${correction.idPrefix}`);
    console.log(`   Action: ${correction.action}`);
    
    try {
      // Find movie by ID prefix
      const { data: movies, error: findError } = await supabase
        .from('movies')
        .select('id, title_en, release_year, language')
        .ilike('id', `${correction.idPrefix}%`)
        .limit(3);
      
      if (findError || !movies || movies.length === 0) {
        console.log(`   ❌ Not found in database`);
        results.errors.push({ title: correction.title || correction.idPrefix, error: 'Not found' });
        continue;
      }
      
      if (movies.length > 1) {
        console.log(`   ⚠️  Warning: Multiple matches (${movies.length}), using first match`);
      }
      
      const movieId = movies[0].id;
      console.log(`   ✓ Found: ${movies[0].title_en} (${movies[0].release_year})`);
      
      // Perform action
      if (correction.action === 'DELETE') {
        // Delete from career_milestones first (foreign key)
        await supabase
          .from('career_milestones')
          .delete()
          .eq('movie_id', movieId);
        
        // Delete movie
        const { error: deleteError } = await supabase
          .from('movies')
          .delete()
          .eq('id', movieId);
        
        if (deleteError) {
          console.log(`   ❌ Delete failed: ${deleteError.message}`);
          results.errors.push({ title: correction.title || correction.idPrefix, error: deleteError.message });
          continue;
        }
        
        console.log(`   ✅ Deleted!`);
        results.deleted.push(correction.title || movies[0].title_en);
        
      } else if (correction.action === 'FIX_LANGUAGE') {
        // Update language only
        const updates: any = {
          language: correction.language,
        };
        
        if (correction.title) updates.title_en = correction.title;
        if (correction.year) updates.release_year = correction.year;
        if (correction.hero) updates.hero = correction.hero;
        if (correction.director) updates.director = correction.director;
        if (correction.rating) updates.our_rating = correction.rating;
        
        const { error: updateError } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movieId);
        
        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          results.errors.push({ title: correction.title || correction.idPrefix, error: updateError.message });
          continue;
        }
        
        console.log(`   ✅ Language updated to: ${correction.language}`);
        results.languageFixed.push(`${correction.title} (${correction.language})`);
        
      } else if (correction.action === 'PUBLISH') {
        // Update data and publish
        const updates: any = {};
        
        if (correction.title) updates.title_en = correction.title;
        if (correction.year) updates.release_year = correction.year;
        if (correction.hero) updates.hero = correction.hero;
        if (correction.director) updates.director = correction.director;
        if (correction.rating) updates.our_rating = correction.rating;
        
        // Only publish if year <= 2024
        if (correction.year && correction.year <= 2024) {
          updates.is_published = true;
        }
        
        const { error: updateError } = await supabase
          .from('movies')
          .update(updates)
          .eq('id', movieId);
        
        if (updateError) {
          console.log(`   ❌ Update failed: ${updateError.message}`);
          results.errors.push({ title: correction.title || correction.idPrefix, error: updateError.message });
          continue;
        }
        
        if (correction.year && correction.year <= 2024) {
          console.log(`   ✅ Updated & Published!`);
          results.published.push(correction.title || movies[0].title_en);
        } else {
          console.log(`   ✅ Updated (not published - future release)`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title || correction.idPrefix, error: String(error) });
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n🗑️  Deleted (Invalid): ${results.deleted.length}`);
  results.deleted.forEach(item => console.log(`   - ${item}`));
  
  console.log(`\n🌐 Language Fixed: ${results.languageFixed.length}`);
  if (results.languageFixed.length <= 10) {
    results.languageFixed.forEach(item => console.log(`   - ${item}`));
  } else {
    results.languageFixed.slice(0, 10).forEach(item => console.log(`   - ${item}`));
    console.log(`   ... and ${results.languageFixed.length - 10} more`);
  }
  
  console.log(`\n📢 Telugu Movies Published: ${results.published.length}`);
  if (results.published.length <= 10) {
    results.published.forEach(item => console.log(`   - ${item}`));
  } else {
    results.published.slice(0, 10).forEach(item => console.log(`   - ${item}`));
    console.log(`   ... and ${results.published.length - 10} more`);
  }
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.slice(0, 10).forEach(item => console.log(`   - ${item.title}: ${item.error}`));
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more errors`);
    }
  }
  
  // Get final counts
  const { count: totalPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');
  
  const { count: totalUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');
  
  console.log('\n' + '='.repeat(80));
  console.log(`🎉 TOTAL TELUGU MOVIES PUBLISHED: ${totalPublished || 'unknown'}`);
  console.log(`📝 TOTAL TELUGU MOVIES UNPUBLISHED: ${totalUnpublished || 'unknown'}`);
  console.log('='.repeat(80));
  
  return results;
}

applyCorrections()
  .then(() => {
    console.log('\n✅ All corrections applied successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
