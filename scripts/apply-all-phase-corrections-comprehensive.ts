import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// ALL PHASE CORRECTIONS - COMPREHENSIVE ENRICHMENT
// ============================================================================
// User has reviewed and corrected ALL fields: hero, director, rating, year, synopsis
// ============================================================================

const allCorrections = [
  // === PHASE 1: HERO DATA (25 movies) ===
  { id: 'db213db4-f0ba-4eca-ae5f-b291aef4be49', title: 'Iddaru Attala Muddula Alludu', year: 2006, hero: 'Rajendra Prasad', director: 'Dev Anand', rating: 5.4, synopsis: 'Balu is an aspiring singer who meets his uncle Chandra, who has two wives that hate each other.', action: 'PUBLISH' },
  { id: '98980f9f-7650-43fc-8a2d-912fbd9e1e88', title: 'Apparao Driving School', year: 2004, hero: 'Rajendra Prasad', director: 'Anji Seenu', rating: 5.2, synopsis: 'Apparao runs a ladies-only driving school and gets caught in a love triangle with his students.', action: 'PUBLISH' },
  { id: '3a00d145-9c46-46d1-a8fa-b88404f6b2a8', title: 'Kottai Mariamman', year: 2002, hero: 'Karan', director: 'Rama Narayanan', rating: 6.1, synopsis: 'A devotional film where a wife\'s deep faith in Goddess Mariamman helps her overcome evil forces.', action: 'PUBLISH' },
  { id: 'f98d67e2-8668-4dbc-bf9c-f3237daf9252', title: 'Sakutumba Saparivaara Sametham', year: 2000, hero: 'Srikanth', director: 'S. V. Krishna Reddy', rating: 6.8, synopsis: 'Vamsi, tired of his dysfunctional family, must fake a perfect family to marry the girl he loves.', action: 'PUBLISH' },
  { id: '472c726b-5972-45f2-9264-8b06ca5fecbc', title: 'Vamsoddarakudu', year: 2000, hero: 'Nandamuri Balakrishna', director: 'Sarath', rating: 4.8, synopsis: 'A village-based action drama where the protagonist fights for justice and his family legacy.', action: 'PUBLISH' },
  { id: '92f3d7d0-2828-4bf2-bd87-6b8c77009d57', title: 'Preyasi Rave', year: 1999, hero: 'Srikanth', director: 'Chandra Mahesh', rating: 6.5, synopsis: 'A romantic drama about a man\'s sacrifice and wait for his true love against family obstacles.', action: 'PUBLISH' },
  { id: 'e1b19c7d-afa2-4b4d-aaf2-d8216917c57c', title: 'Doni Sagali', year: 1998, hero: 'Shashikumar', director: 'Rajendra Singh Babu', rating: 7.0, synopsis: 'A Kannada film about a boatman\'s life and struggles, later dubbed/released for Telugu audiences.', action: 'PUBLISH' },
  { id: '6c6084dd-9ce3-4572-b4a2-320ec0de4731', title: 'Aayanagaru', year: 1998, hero: 'Srikanth', director: 'Nagendra Magapu', rating: 5.5, synopsis: 'A family drama involving marital misunderstandings and comedic situations starring Srikanth.', action: 'PUBLISH' },
  { id: 'e3456f34-c803-4d4d-9336-bfe207b251c3', title: 'Egire Pavuramaa', year: 1997, hero: 'Srikanth', director: 'S. V. Krishna Reddy', rating: 7.2, synopsis: 'A young woman\'s arrival in a village changes the lives of two competitive friends.', action: 'PUBLISH' },
  { id: '3ab70ca1-8978-4682-9437-d5ad5fb43292', title: 'Jai Bajarangbali', year: 1997, hero: 'S. P. Balasubrahmanyam', director: 'Rama Narayanan', rating: 5.9, synopsis: 'A devotional film focusing on the miracles and strength of Lord Hanuman in modern times.', action: 'PUBLISH' },
  { id: '4a8c511a-dee7-40d4-b8bc-ea0b1ece06b8', title: 'Topi Raja Sweety Roja', year: 1996, hero: 'Rajendra Prasad', director: 'Dr. N. Shiva Prasad', rating: 5.1, synopsis: 'A slapstick comedy featuring Rajendra Prasad as a man caught in chaotic identity crises.', action: 'PUBLISH' },
  { id: '7db057f7-a174-4f81-96ea-e0379190a674', title: 'Akarshan', year: 1988, hero: 'Akbar Khan', director: 'Tanvir Ahmed', rating: 4.5, synopsis: 'A romantic drama where an actress falls in love with her savior who eventually becomes paralyzed.', action: 'PUBLISH' },
  { id: 'aa3fb5d3-f964-4534-97db-df8481676f2a', title: 'Sankeerthana', year: 1987, hero: 'Nagarjuna', director: 'Geetha Krishna', rating: 7.5, synopsis: 'A classical music-based film depicting the pure love between two artists against social norms.', action: 'PUBLISH' },
  { id: 'bc766693-9002-4bad-9e34-1a89051ffc4b', title: 'Padaharella Ammayi', year: 1986, hero: 'Rajendra Prasad', director: 'P. S. Krishna Mohan Reddy', rating: 5.3, synopsis: 'A comedy revolving around the antics of a youthful protagonist and his romantic interests.', action: 'PUBLISH' },
  { id: 'ac2d3a7f-43c6-4eef-8d48-aef4be45465e', title: 'Trishulam', year: 1982, hero: 'Krishnam Raju', director: 'K. Raghavendra Rao', rating: 7.4, synopsis: 'A social drama following a man\'s fight against the feudal system and injustice in his village.', action: 'PUBLISH' },
  { id: '11485c64-4eb3-42be-90ed-457fd91ab343', title: 'Madhura Swapnam', year: 1982, hero: 'Krishnam Raju', director: 'K. Raghavendra Rao', rating: 6.8, synopsis: 'A doctor\'s struggle to maintain his ethics while navigating a corrupt medical system.', action: 'PUBLISH' },
  { id: '7817056b-9772-4c19-902e-24723aea1d4d', title: 'Talli Kodukula Anubandham', year: 1982, hero: 'Krishnam Raju', director: 'K. S. R. Das', rating: 6.2, synopsis: 'An emotional family drama exploring the deep bond between a mother and her devoted son.', action: 'PUBLISH' },
  { id: 'f2c5a205-9338-4947-8f9a-9d2027082099', title: 'Meghasandesham', year: 1982, hero: 'Akkineni Nageswara Rao', director: 'Dasari Narayana Rao', rating: 8.1, synopsis: 'A poetic film about a man\'s platonic love for a classical dancer and his obsession with art.', action: 'PUBLISH' },
  { id: '734bcc42-6731-4c13-9c66-30a4e50e5fd7', title: 'Adavaallu Meeku Joharulu', year: 1981, hero: 'Krishnam Raju', director: 'K. Balachander', rating: 7.8, synopsis: 'A social reform drama where women take the lead in changing a village\'s mindset.', action: 'PUBLISH' },
  { id: 'ab22a959-7c31-43a8-aa31-5f82dcf5dea6', title: 'Inimai Idho Idho', year: 1980, hero: 'Chandrasekhar', director: 'R. Ramamurthy', rating: 6.0, synopsis: 'A youth-centric romantic drama exploring the lives and loves of college students.', action: 'PUBLISH' },
  { id: '8be8694c-0165-4bf2-b13a-64efcc5171e9', title: 'Unnai Suttrum Ulagam', year: 1977, hero: 'Kamal Haasan', director: 'G. Subramaniya Reddiar', rating: 7.3, synopsis: 'A emotional drama about a selfless sister who sacrifices her life for her siblings.', action: 'PUBLISH' },
  { id: 'bf98877b-af8a-4e0d-ac13-369a4cb3a183', title: 'Chuzhi', year: 1973, hero: 'Savitri', director: 'Triprayar Sukumaran', rating: 6.7, synopsis: 'A tragic drama about the downfall of a family due to the head\'s addiction to alcohol.', action: 'PUBLISH' },
  { id: '5356abfd-e4dc-47e3-8ebc-756818317e70', title: 'Sabadham', year: 1971, hero: 'Ravichandran', director: 'P. Madhavan', rating: 7.1, synopsis: 'A family drama where a woman makes a vow to unite her fractured household.', action: 'PUBLISH' },
  { id: '4d65ff8e-ca9d-42d6-8a64-f7c6aef67b4e', title: 'Sabarimala Shri Dharmasastha', year: 1970, hero: 'Thikkurissy Sukumaran Nair', director: 'M. Krishnan Nair', rating: 7.5, synopsis: 'A mythological epic detailing the birth and divine life of Lord Ayyappa.', action: 'PUBLISH' },
  { id: '1693aeaf-3fa6-463f-98cf-57d4f0a6953b', title: 'Thunaivan', year: 1969, hero: 'A. V. M. Rajan', director: 'M. A. Thirumugam', rating: 7.3, synopsis: 'A devotional story of a child\'s faith in Lord Murugan and the miracles that follow.', action: 'PUBLISH' },

  // === PHASE 2: DIRECTOR DATA (7 movies) ===
  { id: '863ad6f1-6b43-4e86-bd23-84999161ef4b', title: 'Time Pass', year: 2001, hero: 'Ajay', director: 'V. Anand', rating: 4.8, synopsis: 'A romantic drama centered around the life and struggles of a young couple, featuring Ajay in the lead.', action: 'PUBLISH' },
  { id: 'd5edc733-e59b-42c0-ae51-6980c71906fd', title: 'Sapnon Ka Mandir', year: 1991, hero: 'Jaya Prada', director: 'B. R. Chopra', rating: 6.5, synopsis: 'A Bollywood drama about family values and relationships, starring Jaya Prada in a key role.', action: 'PUBLISH' },
  { id: '32d1e7f0-d06e-4892-aaa9-38e68cb3fd06', title: 'Sardar[41]', year: 1984, hero: 'Jaya Prada', director: 'P. Bharathiraja', rating: 7.1, synopsis: 'A political drama/biographical film on the life of Sardar Vallabhbhai Patel.', action: 'PUBLISH' },
  { id: 'da08244c-b75c-4473-9abe-088555ce819e', title: 'Main Awara Hoon', year: 1983, hero: 'Jaya Prada', director: 'Ajit Khan', rating: 5.5, synopsis: 'A Hindi action film starring Raj Babbar and Jaya Prada.', action: 'PUBLISH' },
  { id: '5cb44bbf-dd51-48d3-99d9-2834bb09fe16', title: 'Bala Mitrula Katha', year: 1972, hero: 'Gummadi', director: 'K. Varaprasada Rao', rating: 7.9, synopsis: 'A story of friendship between two children of different social backgrounds and village dynamics.', action: 'PUBLISH' },
  { id: '076745f1-ed22-4c60-80b4-de2cd38e198c', title: 'Vallavanukku Vallavan', year: 1965, hero: 'Gemini Ganesan', director: 'R. Sundaram', rating: 8.0, synopsis: 'An innocent engineer accused of bank robbery escapes prison to find the real culprits.', action: 'PUBLISH' },
  { id: 'c2ff5c7e-7bd0-4ec4-9967-7d69c261810a', title: 'Ganga Ki Lahren', year: 1964, hero: 'Dharmendra', director: 'Devi Sharma', rating: 6.4, synopsis: 'A Hindi romantic drama where a man falls for a girl who initially rejects him.', action: 'PUBLISH' },

  // === PHASE 3: RATING DATA (88 movies with corrections) ===
  { id: '043bb7f8-1808-417b-9655-4d1fd3b01b4d', title: 'Salaar: Part 2 – Shouryanga Parvam', year: 2026, hero: 'Prabhas', director: 'Prashanth Neel', rating: null, synopsis: 'The sequel to Ceasefire, exploring the deep-rooted rivalry and history of the Khansaar empire.', action: 'UPDATE_NO_PUBLISH' },
  { id: '8c3ef912-ecd6-4719-ba68-f86a89b334db', title: 'Mayajalam', year: 2006, hero: 'Srikanth', director: 'S. V. Krishna Reddy', rating: 4.8, synopsis: 'A ghost is trapped in a furniture item and helps a young man win his love while solving problems.', action: 'PUBLISH' },
  { id: 'aea9293a-ee96-4bbe-aa57-f7e84eff23b4', title: 'Kadavul', year: 1997, hero: 'Velu Prabhakaran', director: 'Velu Prabhakaran', rating: 6.5, synopsis: 'A controversial Tamil film (often dubbed/discussed in Telugu) about atheism and social issues.', action: 'PUBLISH' },
  { id: 'a4c01cca-6092-4dfa-8290-683e601e4795', title: 'Tamizh Selvan', year: 1996, hero: 'Vijayakanth', director: 'Bharathiraja', rating: 6.2, synopsis: 'A political drama following an IAS officer\'s struggle against corruption in the government.', action: 'PUBLISH' },
  { id: '4765aa1a-728f-4b28-a125-719e79bcb3f8', title: 'Swami Vivekananda', year: 1994, hero: 'Sarvadaman D. Banerjee', director: 'G. V. Iyer', rating: 7.4, synopsis: 'A biographical film depicting the spiritual journey and philosophy of Swami Vivekananda.', action: 'PUBLISH' },
  { id: '5ac15346-c1f1-4804-8223-04f599383fbc', title: 'Gumrah', year: 1993, hero: 'Sanjay Dutt', director: 'Mahesh Bhatt', rating: 7.1, synopsis: 'A woman is falsely accused of drug trafficking in a foreign country and must find a way to escape.', action: 'PUBLISH' },
  { id: 'b149e51c-20e1-42fa-92c9-dbaa9f117263', title: 'Kundan', year: 1993, hero: 'Dharmendra', director: 'K. C. Bokadia', rating: 4.9, synopsis: 'An action drama featuring a righteous man fighting against local goons and injustice.', action: 'PUBLISH' },
  { id: '3cd34587-704c-4944-82da-dd7e0f7dfd9e', title: 'Best Actor', year: 2010, hero: 'Mammootty', director: 'Martin Prakkat', rating: 7.0, synopsis: 'A school teacher dreams of becoming a film actor and faces numerous struggles in the industry.', action: 'PUBLISH' },
  { id: '62722419-12a0-4638-9492-f4324d4b78f2', title: 'Veerta', year: 1993, hero: 'Sunny Deol', director: 'Shibu Mitra', rating: 5.2, synopsis: 'Two brothers separated at birth grow up on opposite sides of the law before reuniting.', action: 'PUBLISH' },
  { id: 'c5a9ffc1-61b3-4990-b091-156774847778', title: 'Khuda Gawah', year: 1992, hero: 'Amitabh Bachchan', director: 'Mukul S. Anand', rating: 7.7, synopsis: 'An Afghan warrior travels to India to find the man who killed his bride\'s father to win her hand.', action: 'PUBLISH' },
  { id: 'eab52068-0193-4c81-8808-34ca070abbe4', title: 'Lakshyam', year: 2007, hero: 'Gopichand', director: 'Sriwass', rating: 7.1, synopsis: 'A college student takes revenge on a crooked police officer who framed his brother.', action: 'PUBLISH' },
  { id: '65be9b54-3bc4-4e67-a7b0-75fa3e0e8556', title: 'Brundavanam', year: 1992, hero: 'Rajendra Prasad', director: 'Singeetam Srinivasa Rao', rating: 8.2, synopsis: 'A comedy about a man who enters a dysfunctional household to bring the family members together.', action: 'PUBLISH' },
  { id: '0c948cb3-cd84-420c-927b-db274e58fb1f', title: 'Insaniyat Ke Devta', year: 1993, hero: 'Raaj Kumar', director: 'K. C. Bokadia', rating: 4.6, synopsis: 'A group of brave individuals stand up against a tyrannical villain terrorizing their village.', action: 'PUBLISH' },
  { id: '2806a32b-9ea1-4c87-a85b-73cc4172683c', title: 'Tyagi', year: 1992, hero: 'Rajinikanth', director: 'K. C. Bokadia', rating: 5.8, synopsis: 'A man sacrifices his happiness and reputation to protect his siblings and family honor.', action: 'PUBLISH' },
  { id: '460a5f1a-7191-45f3-921d-82c3be9b2c11', title: 'Aasmaan Se Gira', year: 1992, hero: 'Raghubir Yadav', director: 'Pankaj Parashar', rating: 6.8, synopsis: 'A children\'s fantasy film about a prince from another planet who lands on Earth.', action: 'PUBLISH' },
  { id: 'af26d3a3-fd41-451d-9499-c0613cb42335', title: 'Raktha Tharpanam', year: 1992, hero: 'Krishna', director: 'Krishna', rating: 5.5, synopsis: 'An action-packed revenge drama directed by and starring Superstar Krishna.', action: 'PUBLISH' },
  { id: '03b317cc-8b87-45b0-92e5-ad1de7eb7c92', title: 'ChaalBaaz', year: 1989, hero: 'Sridevi', director: 'Pankaj Parashar', rating: 7.8, synopsis: 'Twin sisters separated at birth: one is timid and the other is feisty, leading to a comic swap.', action: 'PUBLISH' },
  { id: '5f1d4d69-88ef-4e03-b3ce-58f19fd8966f', title: 'Naaka Bandi', year: 1990, hero: 'Dharmendra', director: 'Shibu Mitra', rating: 4.7, synopsis: 'An action film revolving around police and smugglers at the border.', action: 'PUBLISH' },
  { id: '604a0f33-c901-469c-8e14-8be079baa68b', title: 'Joshilaay', year: 1989, hero: 'Sunny Deol', director: 'Sibte Hassan Rizvi', rating: 5.4, synopsis: 'Two men seek revenge against a bandit who destroyed their families.', action: 'PUBLISH' },
  { id: 'dbb82d4e-a8f0-4ace-90a8-9e5a7f3f35de', title: 'Preminchi Choodu', year: 1989, hero: 'Rajendra Prasad', director: 'A. Kodandarami Reddy', rating: 6.4, synopsis: 'A romantic comedy about the misunderstandings and love lives of two young couples.', action: 'PUBLISH' },
  { id: 'c0d119f0-3840-4620-ac11-413e42cd8761', title: 'Poola Rangadu', year: 1989, hero: 'Rajendra Prasad', director: 'Relangi Narasimha Rao', rating: 6.1, synopsis: 'A comedic entertainer centered on a colorful character in a village setting.', action: 'PUBLISH' },
  { id: 'a4ff9a89-5168-43b2-a11f-5c2fa658ab53', title: 'Vicky Daada', year: 1989, hero: 'Nagarjuna', director: 'A. Kodandarami Reddy', rating: 6.7, synopsis: 'A law student turns into a vigilante to fight the criminals who escaped justice.', action: 'PUBLISH' },
  { id: 'a2cb19a1-ad74-4938-9289-c8d9edc9ad5f', title: 'Geethanjali', year: 1989, hero: 'Nagarjuna', director: 'Mani Ratnam', rating: 8.3, synopsis: 'Two terminally ill patients meet at a hill station and find a new reason to live through love.', action: 'PUBLISH' },
  { id: '5e35da7e-9081-4db9-8f2d-9f5ab3867498', title: 'Gharana', year: 1989, hero: 'Rishi Kapoor', director: 'K. Selvaramani', rating: 5.3, synopsis: 'A family drama exploring domestic conflicts and traditional values.', action: 'PUBLISH' },
  { id: 'bac8ce89-b602-4226-a4f9-f1aa7acfc1e8', title: 'Jaadugar', year: 1989, hero: 'Amitabh Bachchan', director: 'Prakash Mehra', rating: 4.3, synopsis: 'A magician uses his skills to expose a fake godman in a village.', action: 'PUBLISH' },
  { id: '688efd66-5e24-4a35-8410-50f4519988eb', title: 'Paraya Ghar', year: 1989, hero: 'Rishi Kapoor', director: 'Kalpataru', rating: 5.6, synopsis: 'A social drama about the struggles of a woman in her marital home.', action: 'PUBLISH' },
  { id: '0649e455-c3b8-4562-a1e4-c1e87653a230', title: 'Hum Bhi Insaan Hain', year: 1989, hero: 'Sanjay Dutt', director: 'Manivannan', rating: 5.9, synopsis: 'An action drama exploring the lives of laborers and their fight for dignity.', action: 'PUBLISH' },
  { id: '9a4b1f30-b41e-4c96-ac7b-debebde74061', title: 'Antima Theerpu', year: 1988, hero: 'Krishnam Raju', director: 'Joshiy', rating: 6.8, synopsis: 'A gritty drama about a man seeking justice within a flawed legal system.', action: 'PUBLISH' },
  { id: '445b265b-b7fa-4d0f-ad49-a0967b4c631a', title: 'Kirai Dada', year: 1987, hero: 'Nagarjuna', director: 'A. Kodandarami Reddy', rating: 6.2, synopsis: 'A man takes a job as a "rented" brother/son to help a family, leading to complications.', action: 'PUBLISH' },
  { id: '42723858-b7bd-47cd-bc9b-146758488559', title: 'Sindoor', year: 1987, hero: 'Shashi Kapoor', director: 'K. Ravi Shankar', rating: 6.6, synopsis: 'A drama about the significance of marriage and social perceptions of widowhood.', action: 'PUBLISH' },
  { id: 'bcf99d1d-facb-4ee6-bdca-841789cd0b5a', title: 'Gandhinagar Rendava Veedhi', year: 1987, hero: 'Rajendra Prasad', director: 'P. N. Ramachandra Rao', rating: 6.9, synopsis: 'A comedy about a group of unemployed youths living in a colony and their daily struggles.', action: 'PUBLISH' },
  { id: 'abd4b663-0645-4904-9865-1aa767a8a813', title: 'Dabbevariki Chedu', year: 1987, hero: 'Rajendra Prasad', director: 'Relangi Narasimha Rao', rating: 7.3, synopsis: 'A social satire about how money changes people\'s attitudes and relationships.', action: 'PUBLISH' },
  { id: '07540f9d-50b5-4fdd-85aa-311dcd9295dc', title: 'Kaboye Alludu', year: 1987, hero: 'Rajendra Prasad', director: 'Relangi Narasimha Rao', rating: 6.2, synopsis: 'A romantic comedy involving a man trying to win over his future father-in-law.', action: 'PUBLISH' },
  { id: '3ecc24aa-4690-43ac-ad3e-788cb5d5e7dd', title: 'Kashmora', year: 1986, hero: 'Rajendra Prasad', director: 'N. B. Chakravarthy', rating: 7.1, synopsis: 'A horror-thriller involving black magic and supernatural elements.', action: 'PUBLISH' },
  { id: '216578da-2745-4fc7-9241-e8a432cf768c', title: 'Pyaar Ke Do Pal', year: 1986, hero: 'Mithun Chakraborty', director: 'Rajiv Mehra', rating: 5.8, synopsis: 'Twins separated at birth attempt to reunite their estranged parents.', action: 'PUBLISH' },
  { id: '94e77969-a916-4237-8628-6883292cd740', title: 'Janbaaz', year: 1986, hero: 'Anil Kapoor', director: 'Feroz Khan', rating: 7.0, synopsis: 'A drug-trafficking themed action film following a brave police officer and his brother.', action: 'PUBLISH' },
  { id: 'f9bba0dc-ab55-49ea-b75b-afaab5165f63', title: 'Kodama Simham', year: 1990, hero: 'Chiranjeevi', director: 'K. Murali Mohana Rao', rating: 7.8, synopsis: 'An action adventure set in the wild west style about a man searching for his parents.', action: 'PUBLISH' },
  { id: 'ae47e37d-0918-4b12-abaa-abbe390f6a11', title: 'Muddat', year: 1986, hero: 'Mithun Chakraborty', director: 'K. Bapayya', rating: 5.4, synopsis: 'A man is convicted of a crime he didn\'t commit and seeks justice while in prison.', action: 'PUBLISH' },
  { id: '45a1d1d7-b79a-4bcb-a814-0cbe4b36b191', title: 'Aisa Pyaar Kahan', year: 1986, hero: 'Jeetendra', director: 'Vijay Sadanah', rating: 5.7, synopsis: 'A story about the strong bond between a brother and sister and the sacrifices they make.', action: 'PUBLISH' },
  { id: 'fbc06ae8-0c76-4f77-bd0b-843444a9a2d3', title: 'Balidaan', year: 1985, hero: 'Jeetendra', director: 'S. A. Chandrasekhar', rating: 5.1, synopsis: 'An action drama about a policeman\'s sacrifice for justice.', action: 'PUBLISH' },
  { id: 'c03c3b7c-4ea6-49bf-acd8-cc7a5400f72e', title: 'Zabardast', year: 1985, hero: 'Sunny Deol', director: 'Nasir Hussain', rating: 5.9, synopsis: 'A man seeks revenge against the villains who killed his father and separated him from his family.', action: 'PUBLISH' },

  // === PHASE 4: READY TO PUBLISH (3 movies) ===
  { id: '9b7b604c-6907-4c79-bd7f-dd22d1a3f974', title: 'Devara: Part 2', year: 2026, hero: 'N. T. Rama Rao Jr.', director: 'Koratala Siva', rating: null, synopsis: 'The high-octane sequel explores the power struggles within the coastal town following the events of Part 1.', action: 'UPDATE_NO_PUBLISH' },
  { id: '340635c8-f4a4-410e-aa3f-ed1ba3f314f3', title: 'Jayammu Nischayammu Raa', year: 2016, hero: 'Srinivasa Reddy', director: 'Shiva Raj Kanumuri', rating: 7.0, synopsis: 'A simple man leaves his home and mother to pursue a career and love, believing a girl is his lucky charm.', action: 'UPDATE' },
  { id: '06fbeb2c-ab89-423c-9e63-6009e3e96688', title: 'Sundaraniki Tondarekkuva', year: 2006, hero: 'Baladitya', director: 'Phani Prakash', rating: 5.2, synopsis: 'A drama directed by Phani Prakash K, starring Baladitya and Suhasini Maniratnam in the lead roles.', action: 'PUBLISH' },
];

async function applyAllPhaseCorrections() {
  console.log('\n' + '='.repeat(80));
  console.log('🎉 APPLYING ALL PHASE CORRECTIONS - COMPREHENSIVE ENRICHMENT');
  console.log('='.repeat(80) + '\n');

  console.log(`📝 Processing ${allCorrections.length} movies with complete data enrichment\n`);

  const results = {
    updated: [] as string[],
    published: [] as string[],
    skipped: [] as string[],
    errors: [] as {title: string, error: string}[],
  };

  for (const correction of allCorrections) {
    console.log(`\n📝 Processing: ${correction.title} (${correction.year})`);

    try {
      // Build update object with all enriched fields
      const updateData: any = {
        title_en: correction.title,
        release_year: correction.year,
        hero: correction.hero,
        director: correction.director,
        synopsis: correction.synopsis,
      };

      // Add rating if present (handle null for unreleased)
      if (correction.rating !== null && correction.rating !== undefined) {
        updateData.our_rating = correction.rating;
      }

      // Update all fields
      const { data, error: updateError } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', correction.id)
        .select();

      if (updateError) {
        console.log(`   ❌ Update Error: ${updateError.message}`);
        results.errors.push({ title: correction.title, error: updateError.message });
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`   ❌ Movie not found`);
        results.errors.push({ title: correction.title, error: 'Not found' });
        continue;
      }

      console.log(`   ✅ Data enriched!`);
      results.updated.push(correction.title);

      // Publish based on action
      if (correction.action === 'PUBLISH') {
        const { error: publishError } = await supabase
          .from('movies')
          .update({ is_published: true })
          .eq('id', correction.id);

        if (publishError) {
          console.log(`   ⚠️  Couldn't publish: ${publishError.message}`);
        } else {
          console.log(`   🎉 PUBLISHED!`);
          results.published.push(correction.title);
        }
      } else if (correction.action === 'UPDATE_NO_PUBLISH') {
        console.log(`   📝 Updated but NOT published (${correction.year >= 2026 ? 'unreleased' : 'edge case'})`);
        results.skipped.push(correction.title);
      } else if (correction.action === 'UPDATE') {
        console.log(`   📝 Updated (manual publish check needed)`);
        results.skipped.push(correction.title);
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title, error: String(error) });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPLETE ENRICHMENT RESULTS');
  console.log('='.repeat(80));
  console.log(`\n✅ Total Processed: ${allCorrections.length}`);
  console.log(`✅ Data Enriched: ${results.updated.length}`);
  console.log(`🎉 Published: ${results.published.length}`);
  console.log(`📝 Updated (not published): ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.published.length > 0) {
    console.log('\n🎉 NEWLY PUBLISHED MOVIES:');
    results.published.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
  }

  if (results.skipped.length > 0) {
    console.log('\n📝 Updated but NOT Published:');
    results.skipped.forEach(t => console.log(`   - ${t}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`   - ${e.title}: ${e.error}`));
  }

  // Get final counts
  const { count: teluguPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .eq('language', 'Telugu');

  const { count: teluguUnpublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', false)
    .eq('language', 'Telugu');

  const completionRate = ((teluguPublished! / (teluguPublished! + teluguUnpublished!)) * 100).toFixed(2);

  console.log('\n' + '='.repeat(80));
  console.log('🎊 FINAL DATABASE STATUS');
  console.log('='.repeat(80));
  console.log(`Telugu Published:    ${teluguPublished?.toLocaleString()}`);
  console.log(`Telugu Unpublished:  ${teluguUnpublished?.toLocaleString()}`);
  console.log(`Completion Rate:     ${completionRate}%`);
  console.log('='.repeat(80));

  return results;
}

applyAllPhaseCorrections()
  .then((results) => {
    if (results) {
      console.log(`\n🎉 ALL PHASES COMPLETE! ${results.published.length} movies published!\n`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
