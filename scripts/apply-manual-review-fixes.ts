#!/usr/bin/env npx tsx
/**
 * Apply manual review fixes from MANUAL-REVIEW-ITEMS.csv
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import chalk from 'chalk';

config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Fix {
  id: string;
  slug: string;
  type: 'documentary' | 'duplicate_cast' | 'missing_hero' | 'missing_heroine' | 'gender_swap' | 'bad_slug' | 'suspicious_confirm' | 'both_missing';
  hero?: string | null;
  heroine?: string | null;
  newSlug?: string;
  note?: string;
}

const fixes: Fix[] = [
  // DOCUMENTARIES - Add subject/lead but mark appropriately
  { id: '9364f5fd-99b1-477b-b710-f9d11035aaac', slug: 'modern-masters-ss-rajamouli-2024', type: 'documentary', hero: 'S. S. Rajamouli', heroine: null, note: 'Biographical documentary' },
  { id: '0c49a2f1-017f-46e3-936d-819cd2317ead', slug: 'nayanthara-beyond-the-fairy-tale-2024', type: 'documentary', hero: 'Vignesh Shivan', heroine: 'Nayanthara', note: 'Documentary film' },
  { id: 'c6aa0c78-3300-4b1b-a2bd-343ee93be13d', slug: 'rrr-behind-and-beyond-2024', type: 'documentary', hero: 'Ram Charan / N.T. Rama Rao Jr.', heroine: null, note: 'Documentary film' },
  { id: '725651a0-9ce5-47b1-81c4-0d2ce4af38c4', slug: 'far-from-the-tree-2021', type: 'documentary', hero: 'Billy Dobson', heroine: 'Nancy Theiga', note: 'Disney animated short' },
  { id: '7cacd9d1-4f91-4c17-803c-1c6f426873f0', slug: 'earthlings-2005', type: 'documentary', hero: 'Joaquin Phoenix', heroine: null, note: 'Documentary' },
  { id: '5e34a4a8-b964-4822-90e7-d76769951bc6', slug: 'baraka-1993', type: 'documentary', hero: 'Patrick Disanto', heroine: null, note: 'Documentary' },
  { id: '873c2b3e-a7dd-4ef7-a250-a9d2f4902f65', slug: 'koyaanisqatsi-1983', type: 'documentary', hero: null, heroine: null, note: 'Experimental documentary' },
  { id: '00bfa782-814f-4445-8644-5d10e72a7255', slug: 'vincent-1982', type: 'documentary', hero: 'Vincent Price', heroine: null, note: 'Animated short' },
  { id: '845186f1-e99b-4b5e-8cec-5fe5b9c731e5', slug: 'queen-live-at-wembley-stadium-1986', type: 'documentary', hero: 'Freddie Mercury', heroine: null, note: 'Concert film' },
  { id: '4276917a-0045-4b76-81f6-269728066f35', slug: 'hannah-gadsby-nanette-2018', type: 'documentary', hero: 'Hannah Gadsby', heroine: null, note: 'Stand-up special' },
  { id: 'ceb40bb2-dbcd-4eb9-a2b3-2510875484ef', slug: 'john-mulaney-kid-gorgeous-at-radio-city-2018', type: 'documentary', hero: 'John Mulaney', heroine: null, note: 'Stand-up special' },
  { id: '687561cd-b46f-467c-8c15-4741a9c9e377', slug: 'john-mulaney-new-in-town-2012', type: 'documentary', hero: 'John Mulaney', heroine: null, note: 'Stand-up special' },
  { id: '8da0c364-df3f-4f36-b928-0d969f997304', slug: 'george-carlin-jammin-in-new-york-1992', type: 'documentary', hero: 'George Carlin', heroine: null, note: 'Stand-up special' },
  { id: '2fbc8f58-8a44-4fb5-9d5b-73415cdaeb44', slug: 'george-carlin-it-s-bad-for-ya--2008', type: 'documentary', hero: 'George Carlin', heroine: null, note: 'Stand-up special' },
  { id: '447beab7-f068-4110-8af2-053411a79f74', slug: 'louis-c-k-chewed-up-2008', type: 'documentary', hero: 'Louis C.K.', heroine: null, note: 'Stand-up special' },
  { id: 'cf48dc2a-a14e-43d5-9488-0fd1f55a7802', slug: 'piper-2016', type: 'documentary', hero: 'Piper (Sandpiper Hatchling)', heroine: null, note: 'Pixar short' },
  { id: '04fe3514-9717-4dfb-ae9c-7a3c4d750f95', slug: 'kitbull-2019', type: 'documentary', hero: 'Kitten and Pit Bull', heroine: null, note: 'Pixar short' },
  { id: '651eb874-46f6-478d-a324-9b7630a5fb67', slug: 'opal-2020', type: 'documentary', hero: 'Jack Stauber', heroine: null, note: 'Short film' },
  { id: 'e46179d7-0116-4d05-9ff2-6fa7043ee737', slug: 'duck-amuck-1953', type: 'documentary', hero: 'Mel Blanc', heroine: null, note: 'Looney Tunes animated short' },
  { id: 'b5c08365-d3c6-4966-a295-2b7d3413d592', slug: 'ocean-with-david-attenborough-2025', type: 'documentary', hero: 'David Attenborough', heroine: null, note: 'Nature documentary' },

  // DUPLICATE CAST FIXES
  { id: 'ece482e4-b7e6-46b9-bf85-07347f5fb933', slug: 'naayak-2013', type: 'duplicate_cast', hero: 'Ram Charan', heroine: 'Kajal Aggarwal', note: 'Amala Paul is supporting cast' },
  { id: '7064c032-a15f-4d90-bfaa-68d67cc73a71', slug: 'sesh-sangat-2009', type: 'duplicate_cast', hero: 'Suman', heroine: 'Jaya Prada', note: 'Fix duplicate' },
  { id: 'd7bc94cc-2f66-4b0d-8b0a-e6390f7d9f5f', slug: 'julie-1975', type: 'duplicate_cast', hero: 'Vikram', heroine: 'Lakshmi', note: 'Fix duplicate' },

  // GENDER SWAP FIXES
  { id: '747156d4-ecf6-4ce0-a213-91de6c14dffe', slug: 'english-vinglish-2012', type: 'gender_swap', hero: 'Adil Hussain', heroine: 'Sridevi', note: 'Female-centric film' },
  { id: '734bcc42-6731-4c13-9c66-30a4e50e5fd7', slug: 'adavaallu-meeku-joharulu-1981', type: 'gender_swap', hero: 'Chiranjeevi', heroine: 'Jayasudha', note: 'Gender swap error' },
  { id: '86e58157-d33f-48d1-a562-7413efddffd9', slug: 'shubha-lagnam-1994', type: 'gender_swap', hero: 'Jagapathi Babu', heroine: 'Aamani', note: 'Suhasini was incorrectly in hero field' },

  // MISSING HERO
  { id: '663813c1-2372-42b3-9dfc-cd78bef3e62c', slug: 'odela-2-2025', type: 'missing_hero', hero: 'Hebah Patel', note: 'Pivotal role' },
  { id: '8b147d30-ad71-43e9-bff9-ac56cff3ae63', slug: 'lust-stories-2-2023', type: 'missing_hero', hero: 'Vijay Varma', note: 'Anthology film' },
  { id: '587e7815-9c1c-4352-8627-21d0ca0b5b9a', slug: 'miss-shetty-mr-polishetty-2023', type: 'missing_hero', hero: 'Naveen Polishetty', note: 'Male lead' },
  { id: '931edc30-8bae-4f26-bf8a-986dfb21fb42', slug: 'yashoda-2022', type: 'missing_hero', hero: 'Varalaxmi Sarathkumar', note: 'Female-centric, Varalaxmi is antagonist' },
  { id: '1f876ebb-b748-46bb-80d5-9467d5cbf862', slug: 'chandamama-raave-asap-2021', type: 'missing_hero', hero: 'Sai Dharam Tej', note: 'Male lead' },
  { id: '959d5cc0-df04-41d8-bc22-4a3a3f1cdafe', slug: 'the-power-2021', type: 'missing_hero', hero: 'Vidyut Jammwal', note: 'Male lead' },
  { id: '1f509925-a7af-45e4-a1df-3b79fc66c43c', slug: 'devi-2020', type: 'missing_hero', hero: 'Karthick Naren', note: 'Male lead' },
  { id: 'aa80fa40-69d5-414d-b347-866e01ffc698', slug: 'devi-2-2019', type: 'missing_hero', hero: 'Arya', note: 'Male lead' },
  { id: '8d92f69b-d01b-4826-a081-19ea658d00e0', slug: 'kanne-kalaimaane-2019', type: 'missing_hero', hero: 'Jayam Ravi', note: 'Male lead' },
  { id: '8de2c23e-055a-4087-9860-83a74be23f32', slug: 'o-baby-yentha-sakkagunnave-2019', type: 'missing_hero', hero: 'Naga Shaurya', note: 'Male lead' },
  { id: 'b74d9756-798e-4f4d-bca3-c9d914ab5e36', slug: 'action-2019', type: 'missing_hero', hero: 'Vishal', note: 'Male lead' },
  { id: '97675229-ba19-47f3-8d07-5f9beaefd770', slug: 'petromax-2019', type: 'missing_hero', hero: 'Sathish', note: 'Male lead' },
  { id: '7c44139b-5b9c-4f89-adc7-b56cee4fa9af', slug: 'khamoshi-2019', type: 'missing_hero', hero: 'Sharwanand', note: 'Male lead' },
  { id: '8f69beca-b63a-42fe-a4b9-1fa805084f0d', slug: 'awe-2018', type: 'missing_hero', hero: 'Nani', note: 'Multi-protagonist ensemble' },
  { id: '6273af4d-f577-4bb8-9fd5-0b92cc9ec033', slug: 'mom-2018', type: 'missing_hero', hero: 'Akshaye Khanna', note: 'Female-centric thriller' },
  { id: '4961d6aa-b74a-4b4b-b9b5-3b58bd017c3b', slug: 'mom-2017', type: 'missing_hero', hero: 'Akshaye Khanna', note: 'Female-centric thriller' },
  { id: '973a629d-bf38-46b9-b7ed-072619cd8646', slug: 'anbanavan-asaradhavan-adangadhavan-2017', type: 'missing_hero', hero: 'Silambarasan (Simbu)', note: 'Male lead' },
  { id: 'eb80b9c0-3cd7-4280-ba2f-f58c1222907c', slug: 'behen-hogi-teri-2017', type: 'missing_hero', hero: 'Rajkummar Rao', note: 'Male lead' },
  { id: '9ae4694b-6332-4775-907f-de052bd508a0', slug: 'devi-l-2016', type: 'missing_hero', hero: 'Prabhas', note: 'Male lead' },
  { id: '8d8dbc6e-8e4a-4940-9db9-1e086d5f4db6', slug: 'do-lafzon-ki-kahani-2016', type: 'missing_hero', hero: 'Randeep Hooda', note: 'Male lead' },
  { id: '23aff150-7056-411c-9f84-c673afe8d8da', slug: 'lacchimdeviki-o-lekkundi-2016', type: 'missing_hero', hero: 'Varun Tej', note: 'Male lead' },
  { id: 'ba676bd5-9990-4329-afb1-352928f849a7', slug: 'inji-iduppazhagi-2015', type: 'missing_hero', hero: 'Vikram', note: 'Male lead' },
  { id: '0514af1f-14fe-45a6-a765-b7452536d659', slug: 'rudhramadevi-2015', type: 'missing_hero', hero: 'Rana Daggubati', note: 'Historical epic' },
  { id: '5b941ca4-6b01-4304-9b69-751170233650', slug: 'paayum-puli-2015', type: 'missing_hero', hero: 'Vishal', note: 'Male lead' },
  { id: '49dbd9b5-81ad-4f57-9342-be9fd96c537b', slug: 'vasuvum-saravananum-onna-padichavanga-2015', type: 'missing_hero', hero: 'Sivakarthikeyan', note: 'Male lead' },
  { id: 'a75e8ded-39e4-4aba-85fe-1931c2b18aab', slug: 'anaamika-2014', type: 'missing_hero', hero: 'Vaibhav Reddy', note: 'Police Officer' },
  { id: '8aa23f75-a4eb-4632-8f82-24327499ea7a', slug: 'poojai-2014', type: 'missing_hero', hero: 'Vishal', note: 'Male lead' },
  { id: '5b809714-e54b-4fe5-a9b9-9f3aa6878ea5', slug: 'all-in-all-azhagu-raja-2013', type: 'missing_hero', hero: 'Karthi', note: 'Male lead' },
  { id: '1bfe0855-c62f-4cf2-a748-359cd768e74b', slug: 'buddy-2013', type: 'missing_hero', hero: 'Allari Naresh', note: 'Male lead' },
  { id: '5c021218-ec73-4926-932e-4c152ce1e580', slug: 'english-vinglish-2013', type: 'missing_hero', hero: 'Adil Hussain', note: 'Female-centric film' },
  { id: '06291f44-dcb0-4c95-8722-edf3d5f837ad', slug: 'andala-rakshasi-2012', type: 'missing_hero', hero: 'Naveen Chandra', note: 'Male lead' },
  { id: '34d9230d-7747-4309-a697-b49fa8eccb65', slug: 'the-desire-a-journey-of-a-woman-2011', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: 'a4afdffb-c673-485e-85d9-fceb44932a25', slug: 'vaanam-2011', type: 'missing_hero', hero: 'Silambarasan', note: 'Male lead' },
  { id: '23245d82-caff-43ca-ab22-777f22787584', slug: 'venghai-2011', type: 'missing_hero', hero: 'Dhanush', note: 'Male lead' },
  { id: '6a33daf1-0b9c-4a35-bca4-901c04128cbd', slug: 'thillalangadi-2010', type: 'missing_hero', hero: 'Silambarasan', note: 'Male lead' },
  { id: '1287e3f6-481d-41de-b4aa-51880a236d43', slug: 'padikathavan-2009', type: 'missing_hero', hero: 'Dhanush', note: 'Male lead' },
  { id: '53f37cd5-1107-4396-93f0-5aa6ba836667', slug: 'sesh-sanghat-2009', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: 'f99c8074-68cf-43d8-94a5-3a025a58c774', slug: 'kanden-kadhalai-2009', type: 'missing_hero', hero: 'Bharath', note: 'Male lead' },
  { id: '2d90a8b6-4839-4505-aa49-d2a6f48c4ecd', slug: 'arundhati-2009', type: 'missing_hero', hero: 'Sonu Sood', note: 'Antagonist/Lead Male' },
  { id: '5c9d770c-865b-4db6-b2c5-fdce4b0fa46c', slug: 'dasavathaaram-2008', type: 'missing_hero', hero: 'Kamal Haasan', note: 'Played 10 roles' },
  { id: '644907cf-42ea-4235-a5be-f34042f8da2b', slug: 'kaloori-2007', type: 'missing_hero', hero: 'Simbu', note: 'Male lead' },
  { id: 'b3a4e810-a2b6-480d-9990-25f8d4470193', slug: 'viyabari-2007', type: 'missing_hero', hero: 'Simbu', note: 'Male lead' },
  { id: 'c2be9108-69d6-4f9d-a1c1-c45e48e3cec1', slug: 'chandamama-2007', type: 'missing_hero', hero: 'Navdeep', note: 'Male lead' },
  { id: '1e0ce6fe-0058-4097-9069-6879f475350e', slug: 'rendu-2006', type: 'missing_hero', hero: 'Madhavan', note: 'Male lead' },
  { id: '8331c248-2d16-4203-b61f-061c17b3e4be', slug: 'kedi-2006', type: 'missing_hero', hero: 'Ravi Krishna', note: 'Male lead' },
  { id: '5d32087c-cf2b-460d-9ee7-fa8b793758b6', slug: 'vikram-2005', type: 'missing_hero', hero: 'Ravi Teja', note: 'Dual role' },
  { id: 'dfe6496d-ec04-4f8e-9d27-feeca6f99805', slug: 'chand-sa-roshan-chehra-2005', type: 'missing_hero', hero: 'Akshay Kumar', note: 'Male lead' },
  { id: '5020bf64-babb-4c56-b8ab-30aa962d3b60', slug: 'swetha-naagu-2004', type: 'missing_hero', hero: 'Abbas', note: 'Male lead' },
  { id: 'c984fdf8-5122-48f7-97b5-00d9a2c65f25', slug: 'haisiyat-1984', type: 'missing_hero', hero: 'Jeetendra', note: 'Male lead' },
  { id: 'b5ad8e82-037e-4fc0-8804-13d0e0b7fb9a', slug: 'gift-1984', type: 'missing_hero', hero: 'Jeetendra', note: 'Male lead' },
  { id: 'e8f1fa7d-2da0-4df4-a177-a22befb71bb2', slug: 'jaag-utha-insan-1984', type: 'missing_hero', hero: 'Mithun Chakraborty', note: 'Male lead' },
  { id: '1c56d0c1-5b55-4a00-9a1a-6186aa6a956f', slug: 'mundadugu-1983', type: 'missing_hero', hero: 'Krishna', note: 'Male lead' },
  { id: '16c85fc9-80de-4f8c-bd0d-069b48a57168', slug: 'mawaali-1983', type: 'missing_hero', hero: 'Jeetendra', note: 'Male lead' },
  { id: 'c150588c-1ee3-49e9-849a-a08ca59a96fe', slug: 'moondram-pirai-1983', type: 'missing_hero', hero: 'Kamal Haasan', note: 'Protagonist' },
  { id: '8b7664a5-c6dc-4a48-9240-70c1e53de017', slug: 'swayamvaram-1982', type: 'missing_hero', hero: 'Sobhan Babu', note: 'Male lead' },
  { id: '11485c64-4eb3-42be-90ed-457fd91ab343', slug: 'madhura-swapnam-1982', type: 'missing_hero', hero: 'Sobhan Babu', note: 'Male lead' },
  { id: 'b3e5ff75-192c-4137-9f44-eb6885a8b227', slug: 'golkonda-abbulu-1982', type: 'missing_hero', hero: 'Sobhan Babu', note: 'Male lead' },
  { id: 'edf03aba-fb65-4895-b39c-8de570b77b02', slug: 'ragile-hrudayalu-1980', type: 'missing_hero', hero: 'Sobhan Babu', note: 'Male lead' },
  { id: '66dd2690-e978-4b37-b1b6-6a46e4950c5f', slug: 'pagalil-oru-iravu-1979', type: 'missing_hero', hero: 'Kamal Haasan', note: 'Male lead' },
  { id: 'a3954a89-0f81-4fd0-a527-0497705c4a27', slug: 'angeekaaram-1977', type: 'missing_hero', hero: 'Kamal Haasan', note: 'Male lead' },
  { id: '93055d51-4f13-4364-9717-f494055af13e', slug: 'oonjaal-1977', type: 'missing_hero', hero: 'Kamal Haasan', note: 'Male lead' },
  { id: '17f6c2cb-f7a2-4781-a402-8429d5170d0a', slug: 'seeta-kalyanam-1976', type: 'missing_hero', hero: 'Ravi Kumar', note: 'Directed by Bapu' },
  { id: 'b1043ceb-4841-4e6b-8575-1ff7271dd6f3', slug: 'devude-digivaste-1975', type: 'missing_hero', hero: 'Ramakrishna', note: 'Male lead' },
  { id: 'bf98877b-af8a-4e0d-ac13-369a4cb3a183', slug: 'chuzhi-1973', type: 'missing_hero', hero: 'Salam Baig', note: 'Male lead' },
  { id: '2ced2102-12ab-4391-9e5b-40ae526c7b11', slug: 'amma-mata-1972', type: 'missing_hero', hero: 'Sobhan Babu', note: 'Sridevi as child artist' },
  { id: '3f43d925-b849-4651-ab42-4205cc9d0209', slug: 'poompatta-1971', type: 'missing_hero', hero: 'Raghavan', note: 'Prema as lead actress' },
  { id: '2a590415-5b6c-4321-bfcc-271fc1466bfb', slug: 'manishichina-maguva-1969', type: 'missing_hero', hero: 'Chalam', note: 'Male lead' },
  { id: '7b463cf0-057b-4154-b696-37c6daa1f0a9', slug: 'oke-maata-2000', type: 'missing_hero', hero: 'Upendra', note: 'Male lead' },
  { id: '2c61e1ee-623b-40b8-885f-a90bbccbc84f', slug: 'devadoothan-2000', type: 'missing_hero', hero: 'Mohanlal', note: 'Male lead' },
  { id: '472c726b-5972-45f2-9264-8b06ca5fecbc', slug: 'vamsoddarakudu-2000', type: 'missing_hero', hero: 'Nandamuri Balakrishna', note: 'Male lead' },
  { id: 'c3f4b681-7d6f-4de3-847e-28511a2f9e70', slug: 'sooryavansham-1999', type: 'missing_hero', hero: 'Amitabh Bachchan', note: 'Dual Role' },
  { id: '6664df27-bf9e-4166-9c82-7297e05e21d4', slug: 'suryavamsam-1998', type: 'missing_hero', hero: 'Mammootty', note: 'Male lead' },
  { id: '73591e57-5fbb-41a9-a8d4-80875b608a2c', slug: 'chandralekha-1998', type: 'missing_hero', hero: 'Nagarjuna', note: 'Male lead' },
  { id: '1352bac0-cd25-4d01-9c7b-54669a02021b', slug: 'deergha-sumangali-bhava-1998', type: 'missing_hero', hero: 'Venkatesh', note: 'Male lead' },
  { id: '38a75021-b146-4c61-8ded-2a393423c86c', slug: 'jeevan-yudh-1997', type: 'missing_hero', hero: 'Mithun Chakraborty', note: 'Male lead' },
  { id: '84f6df71-8fcd-44da-bbe2-501430656d83', slug: 'best-actress-1996', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '002b93f5-f5af-4273-83b3-05faeb090322', slug: 'devaraagam-1996', type: 'missing_hero', hero: 'Arvind Swamy', note: 'Male lead' },
  { id: 'aa04e255-0138-4e23-8086-370cf90ce4ba', slug: 'ammoru-1995', type: 'missing_hero', hero: 'Suresh', note: 'Male lead' },
  { id: '216e0c71-19e5-46a3-8845-13b53a49d57b', slug: 'veer-1995', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '7517dddc-368c-4869-9883-ea4cba404c19', slug: 'muddula-priyudu-1994', type: 'missing_hero', hero: 'Venkatesh', note: 'Male lead' },
  { id: 'bb055ff1-9e3c-4758-929b-78af641a99db', slug: 'anna-chellelu-1993', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '02111a72-de46-4a7c-90de-53ec9264ef42', slug: 'manavarali-pelli-1993', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '24db7c59-187b-47d4-8437-c5a098c85e11', slug: 'chandra-mukhi-1993', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '9f116506-21dd-4f04-9d9c-b7c7029359ea', slug: 'karthavyam-1991', type: 'missing_hero', hero: 'Vinod Kumar', note: 'Significant role' },
  { id: '2153b25d-a999-4c1f-95c0-b9c9ba8bca5f', slug: 'kartavyam-1990', type: 'missing_hero', hero: 'Vinod Kumar', note: 'Significant role' },
  { id: 'a963e49b-0157-46a2-9380-ecc78433eb26', slug: 'justice-rudramadevi-1990', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '8f26804c-51c3-4508-9bf1-1248769c7c4e', slug: 'sakshi-1989', type: 'missing_hero', hero: 'Rajasekhar', note: 'Male lead' },
  { id: '4021e5b1-f36b-4657-b910-1b588141e09d', slug: 'aahuthi-1988', type: 'missing_hero', hero: 'Rajasekhar', note: 'Male lead' },
  { id: 'd12f2a32-75a3-48f3-9a05-6ef8a08a2755', slug: 'jawab-hum-denge-1987', type: 'missing_hero', hero: 'Shatrughan Sinha', note: 'Male lead' },
  { id: '422b6457-0e66-4546-868c-cc93b6a7c6b5', slug: 'sri-bannari-amman-2002', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: 'ff32a1f8-e0a8-41fd-9fe9-5f9ffb94b6fa', slug: 'angala-parameswari-2002', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '53888702-5231-4c81-84b9-01234aa1eaf1', slug: 'kottai-mariamman-2001', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: '53d9286b-54c1-42b8-afc9-fc6f96c0bc3d', slug: 'independence-1999', type: 'missing_hero', hero: 'Suman', note: 'Male lead' },
  { id: 'd53f3678-0fe2-4d7d-95a0-847e80359765', slug: 'anthapuram-1999', type: 'missing_hero', hero: 'Jagapathi Babu', note: 'Female-centric drama' },
  { id: 'b4a8c52b-f778-41f9-a161-b8ad53ffca09', slug: 'anthahpuram-1998', type: 'missing_hero', hero: 'Jagapathi Babu', note: 'Female-centric drama' },

  // MISSING HEROINE
  { id: '06f3f75f-deac-4135-8aaa-69079d66d428', slug: 'toxic-yash-2026', type: 'missing_heroine', heroine: 'Nayanthara', note: 'Reported lead' },
  { id: '1fb06eaf-7d74-41c9-b965-97cf3cae228f', slug: 'kalki-2898-ad-2024', type: 'missing_heroine', heroine: 'Deepika Padukone', note: 'Female lead' },
  { id: '19bc0324-80de-4386-8db6-81f9324e94f6', slug: 'mumbai-saga-2021', type: 'missing_heroine', heroine: 'Kajal Aggarwal', note: 'Female lead' },
  { id: '546251ea-b489-4c8f-9721-04c5e3751c9b', slug: 'savyasachi-2018', type: 'missing_heroine', heroine: 'Nidhhi Agerwal', note: 'Female lead' },
  { id: '6ccaa274-f5da-4a49-9f9d-9d3547e91170', slug: 'chakravarthy-2017', type: 'missing_heroine', heroine: 'Deepa Sannidhi', note: 'Female lead' },
  { id: 'b24f6fda-39b4-4390-8a87-238444dc54c6', slug: 'bahubali-the-beginning-2015', type: 'missing_heroine', heroine: 'Tamannaah', note: 'Female lead' },
  { id: 'c4ab0633-5d0b-441f-9f69-19636285f7d9', slug: 'chandi-the-power-of-woman-2013', type: 'missing_heroine', heroine: 'Vijayashanti', note: 'Female lead' },
  { id: '40637c18-d7e5-4fd8-901a-b531ddb30c4d', slug: 'd-for-dopidi-2013', type: 'missing_heroine', heroine: 'Melanie Kannokada', note: 'Female lead' },
  { id: 'ce52a896-7006-4230-9efc-b932c7304787', slug: 'jhummandi-naadam-2010', type: 'missing_heroine', heroine: 'Taapsee Pannu', note: 'Debut' },
  { id: '5e4052c0-9936-4bc9-9284-5adf79dcf4f4', slug: 'shubhapradam-2010', type: 'missing_heroine', heroine: 'Manjari Phadnis', note: 'Female lead' },
  { id: 'e51fc56d-e23b-44e7-8d46-30dc4308b582', slug: 'luck-2009', type: 'missing_heroine', heroine: 'Shruti Haasan', note: 'Female lead' },
  { id: '4b6bc505-eaaa-494c-9a16-b6b383f10a3f', slug: 'munna-2007', type: 'missing_heroine', heroine: 'Ileana D\'Cruz', note: 'Female lead' },
  { id: '15f97b32-29cb-470d-8174-2a8ec4a2e33a', slug: 'ghutan-2007', type: 'missing_heroine', heroine: 'Mona Chopra', note: 'Female lead' },
  { id: 'b5c120b6-a177-4775-8ff0-60eecc178ae6', slug: 'ranam-2006', type: 'missing_heroine', heroine: 'Kamna Jethmalani', note: 'Female lead' },
  { id: '06fbeb2c-ab89-423c-9e63-6009e3e96688', slug: 'sundaraniki-thondarekkuva-2006', type: 'missing_heroine', heroine: 'Sneha', note: 'Female lead' },
  { id: '8c3ef912-ecd6-4719-ba68-f86a89b334db', slug: 'mayajalam-2006', type: 'missing_heroine', heroine: 'Sneha', note: 'Female lead' },
  { id: 'c1b12143-412a-4c03-869b-2864611b9c07', slug: 'parijatham-2006', type: 'missing_heroine', heroine: 'Saranya Bhagyaraj', note: 'Female lead' },
  { id: 'c212cbf8-5145-44b7-8740-a2928fa13c6b', slug: 'hanuman-2005', type: 'missing_heroine', heroine: null, note: 'Animated feature - no traditional heroine' },
  { id: '59c5dbca-c6c9-4d7b-bac7-1734b5782888', slug: 'bunny-2005', type: 'missing_heroine', heroine: 'Gowri Munjal', note: 'Female lead' },
  { id: '489d6c4b-2358-4b79-a375-380894053836', slug: 'arjun-2004', type: 'missing_heroine', heroine: 'Shriya Saran', note: 'Female lead' },
  { id: 'e2291068-2a52-4c56-8581-c534925a6f78', slug: 'loc-kargil-2003', type: 'missing_heroine', heroine: 'Esha Deol', note: 'Ensemble cast' },
  { id: '092508fb-f084-443b-aa50-3c6d06b6ec12', slug: 'chennakeshava-reddy-2002', type: 'missing_heroine', heroine: 'Shriya Saran', note: 'Female lead' },
  { id: 'f98d67e2-8668-4dbc-bf9c-f3237daf9252', slug: 'sakutumba-saparivaara-sametham-2000', type: 'missing_heroine', heroine: 'Suhasini', note: 'Female lead' },
  { id: '4ad9424a-f90b-42db-8fcb-4d3e64ddf228', slug: 'o-panaipothundi-babu-1998', type: 'missing_heroine', heroine: 'Maheswari', note: 'Female lead' },
  { id: 'e3456f34-c803-4d4d-9336-bfe207b251c3', slug: 'egire-pavuramaa-1997', type: 'missing_heroine', heroine: 'Laila', note: 'Female lead' },
  { id: 'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485', slug: 'shri-krishnarjuna-vijayam-1996', type: 'missing_heroine', heroine: 'Roja', note: 'Female lead' },
  { id: 'e1124ed1-4aee-40ec-a97e-f5ecd5966a8d', slug: 'maato-pettukoku-1995', type: 'missing_heroine', heroine: 'Ramyakrishna', note: 'Female lead' },
  { id: '95639c8c-fad3-4ef9-b2a3-0e1b06040346', slug: 'aaj-ka-goonda-raj-1992', type: 'missing_heroine', heroine: 'Meenakshi Seshadri', note: 'Female lead' },
  { id: '9b92b0a3-0f2a-45f0-84f3-8c8229f9d689', slug: 'rowdy-gari-pellam-1991', type: 'missing_heroine', heroine: 'Shobana', note: 'Female lead' },
  { id: 'bf27e9bc-b4a7-40f6-b6c5-fde21f2378d1', slug: 'pandirimancham-1991', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: '97205711-d99c-4507-8dd1-bccf914a517b', slug: 'chinnari-muddula-papa-1990', type: 'missing_heroine', heroine: 'Kushboo', note: 'Female lead' },
  { id: 'ab03592a-8f48-4478-a2ff-b5ed09d237bc', slug: 'gair-kanooni-1989', type: 'missing_heroine', heroine: 'Juhi Chawla', note: 'Female lead' },
  { id: '03b317cc-8b87-45b0-92e5-ad1de7eb7c92', slug: 'chaalbaaz-1990', type: 'missing_hero', hero: 'Rajinikanth', note: 'Male lead' },
  { id: '00d89f19-ccce-49ba-ab22-f4dde8c8d63c', slug: 'mappillai-1989', type: 'missing_heroine', heroine: 'Amala', note: 'Female lead' },
  { id: 'f19bec41-1999-46e3-8f2b-511abefe9056', slug: 'watan-ke-rakhwale-1987', type: 'missing_heroine', heroine: 'Sridevi', note: 'Female lead' },
  { id: 'abd4b663-0645-4904-9865-1aa767a8a813', slug: 'dabbevariki-chedu-1987', type: 'missing_heroine', heroine: 'Seetha', note: 'Female lead' },
  { id: 'a784367c-e6c8-4eac-bdd0-19b54530c4a8', slug: 'karma-1986', type: 'missing_heroine', heroine: 'Sridevi', note: 'Female lead' },
  { id: 'd60b0106-384b-4f9e-99b8-d959bb22ca1b', slug: 'sita-rama-kalyanam-1986', type: 'missing_heroine', heroine: 'Rajani', note: 'Female lead' },
  { id: '874d23ee-a47a-4c6e-8e3b-573059e94e1e', slug: 'inquilaab-1984', type: 'missing_heroine', heroine: 'Sridevi', note: 'Female lead' },
  { id: '2dae0a9c-7979-4c58-a70b-b7162126cd8c', slug: 's-p-bhayankar-1984', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: 'ac2d3a7f-43c6-4eef-8d48-aef4be45465e', slug: 'trishulam-1982', type: 'missing_heroine', heroine: 'Sridevi', note: 'Female lead' },
  { id: '7817056b-9772-4c19-902e-24723aea1d4d', slug: 'talli-kodukula-anubandham-1982', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: 'f2c5a205-9338-4947-8f9a-9d2027082099', slug: 'meghasandesham-1982', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: '734bcc42-6731-4c13-9c66-30a4e50e5fd7', slug: 'adavaallu-meeku-joharulu-1981', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Gender swap fix' },
  { id: 'ff4ef5a0-eff3-40a6-b117-a8462a6a0265', slug: 'jeevitha-ratham-1981', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: '052658b3-f5bc-4867-8a2b-c0ef4d6e1210', slug: 'jagamondi-1981', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: '28cdaf3a-d4be-4e89-a7a7-63e97d55e6c6', slug: 'manavude-mahaneeyudu-1980', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: '90c2fb7e-6c92-45a4-81c4-a6c18b32e742', slug: 'rakta-sambandham-1980', type: 'missing_heroine', heroine: 'Sumalatha', note: 'Female lead' },
  { id: '6212f700-84e3-4c84-bedc-570a48747a3d', slug: 'nizhalgal-1980', type: 'missing_heroine', heroine: 'Radha', note: 'Female lead' },
  { id: 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e', slug: 'kothala-raayudu-1979', type: 'missing_heroine', heroine: 'Madhavi', note: 'Female lead' },
  { id: 'd230d639-8927-40d7-9889-79f95e18d21f', slug: 'sri-rambantu-1979', type: 'missing_heroine', heroine: 'Kavitha', note: 'Female lead' },
  { id: '3c8e2bde-5529-484d-a75e-4a6146047b4c', slug: 'rama-banam-1979', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: 'b4387f43-8aa1-47ec-bdbb-72e5c891afa8', slug: 'khaidi-kalidasu-1977', type: 'missing_heroine', heroine: 'Jayasudha', note: 'Female lead' },
  { id: '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4', slug: 'shri-krishnavataram-1967', type: 'missing_heroine', heroine: 'Devika', note: 'Female lead' },
  { id: '7f0b003c-b15f-4087-9003-0efc1d959658', slug: 'paarthaal-pasi-theerum-1962', type: 'missing_heroine', heroine: 'Savitri', note: 'Female lead' },
  { id: '5d95bc5d-9490-4664-abc6-d2a9e29a05a8', slug: 'kuravanji-1960', type: 'missing_heroine', heroine: 'Savitri', note: 'Female lead' },
  { id: 'f86df043-4436-46ee-a4b6-6889d3b29f2e', slug: 'pathini-deivam-1957', type: 'missing_heroine', heroine: 'Savitri', note: 'Female lead' },
  { id: 'db9a5c4b-1645-4f27-b9ce-b40e864736b8', slug: 'sneha-bandham-1973', type: 'missing_heroine', heroine: 'Jamuna', note: 'Female lead' },
  { id: '5cb44bbf-dd51-48d3-99d9-2834bb09fe16', slug: 'bala-mitrula-katha-1972', type: 'missing_heroine', heroine: 'Bhanumathi', note: 'Female lead' },
  { id: 'c314b523-1ee8-458f-9b0a-8957e2d7fef9', slug: 'antha-mana-manchike-1972', type: 'missing_heroine', heroine: 'Nagabhushanam', note: 'Female lead' },
  { id: 'e4fca088-8438-40c5-a506-1b60064b3465', slug: 'bangaru-talli-1971', type: 'missing_heroine', heroine: 'Jamuna', note: 'Female lead' },
  { id: '241cd6d8-d112-40d6-ba30-62f60ced616d', slug: 'prema-kavali-2011', type: 'missing_heroine', heroine: 'Haripriya', note: 'Female lead' },
  { id: '8182275f-e88d-4453-b855-4bb1695ef80c', slug: 'badrinadh-2011', type: 'missing_heroine', heroine: 'Tamannaah', note: 'Female lead' },
  { id: '9847e6d2-e641-445d-ad9f-8066e3120c4b', slug: 'madura-raja-2019', type: 'missing_heroine', heroine: 'Meena', note: 'Female lead' },
  { id: '4bf3e6e9-856f-453e-bde9-9382875b513c', slug: 'n-a-2019', type: 'missing_heroine', heroine: null, note: 'Concert film - no traditional heroine' },
  { id: 'acf194fe-4408-4b2b-9644-3ea74d579879', slug: 'bo-burnham-inside-2021', type: 'missing_heroine', heroine: null, note: 'Stand-up special - no traditional heroine' },
  { id: '48cd41ce-bdab-4e2e-b69c-908da6dbc187', slug: 'entertainment-2014', type: 'missing_heroine', heroine: null, note: 'Animated feature' },
  { id: 'df5c63e9-89fa-498f-93ec-9ea92cd305c2', slug: 'family-1996', type: 'missing_heroine', heroine: null, note: 'Animated feature' },

  // BAD SLUG FIXES
  { id: '9610fea5-10e1-4d27-8796-8a8e41c6d274', slug: 'qarib-qarib-singlle-2017', type: 'bad_slug', newSlug: 'qarib-qarib-singlle-2017', note: 'Already correct' },
  { id: 'ed71d9e9-2812-429d-938a-e6cb98fbdd5c', slug: 'queen-2014', type: 'bad_slug', newSlug: 'queen-2014', note: 'Already correct' },
  { id: 'edf915ed-6da6-4f3f-afd2-48d1da848edd', slug: 'queen-days-of-our-lives-2011', type: 'bad_slug', newSlug: 'queen-days-of-our-lives-2011', note: 'Already correct' },
  { id: '1da56a37-112f-45ab-9ea6-905c9657a7e8', slug: 'quick-gun-murugan-2009', type: 'bad_slug', newSlug: 'quick-gun-murugan-2009', note: 'Already correct' },
  // { id: '7a5dc5f8-681d-49a7-9ff4-3a4962dcb9b0', slug: 'quick-gun-murugun-2009', type: 'bad_slug', newSlug: 'quick-gun-murugan-2009', note: 'SKIPPED: Duplicate slug exists - needs manual merge' },
  { id: '66e5c368-a0f3-46c5-ba66-a0a7d38eaf0c', slug: 'qayamat-se-qayamat-tak-1988', type: 'bad_slug', newSlug: 'qayamat-se-qayamat-tak-1988', note: 'Already correct' },
  { id: '845186f1-e99b-4b5e-8cec-5fe5b9c731e5', slug: 'queen-live-at-wembley-stadium-1986', type: 'bad_slug', newSlug: 'queen-live-at-wembley-stadium-1986', note: 'Already correct' },
  { id: '2f2684e9-4ef1-4173-9c5a-4ae3b918959b', slug: 'qayamat-1983', type: 'bad_slug', newSlug: 'qayamat-1983', note: 'Already correct' },
];

async function applyFix(fix: Fix): Promise<boolean> {
  try {
    const { data: movie, error: fetchError } = await supabase
      .from('movies')
      .select('id, slug, hero, heroine')
      .eq('id', fix.id)
      .single();

    if (fetchError || !movie) {
      console.log(chalk.red(`❌ Not found: ${fix.slug} (${fix.id})`));
      return false;
    }

    const updates: any = {};

    switch (fix.type) {
      case 'documentary':
        if (fix.hero !== undefined) updates.hero = fix.hero;
        if (fix.heroine !== undefined) updates.heroine = fix.heroine;
        break;

      case 'duplicate_cast':
        if (fix.hero) updates.hero = fix.hero;
        if (fix.heroine) updates.heroine = fix.heroine;
        break;

      case 'gender_swap':
        if (fix.hero) updates.hero = fix.hero;
        if (fix.heroine) updates.heroine = fix.heroine;
        break;

      case 'missing_hero':
        if (fix.hero) updates.hero = fix.hero;
        break;

      case 'missing_heroine':
        if (fix.heroine !== undefined) updates.heroine = fix.heroine;
        break;

      case 'bad_slug':
        if (fix.newSlug && fix.newSlug !== fix.slug) {
          updates.slug = fix.newSlug;
        }
        break;

      case 'suspicious_confirm':
        // No action needed - these are confirmed as feature films
        return true;

      case 'both_missing':
        if (fix.hero) updates.hero = fix.hero;
        if (fix.heroine !== undefined) updates.heroine = fix.heroine;
        break;
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`  ❌ Error: ${updateError.message}`));
        return false;
      }
      return true;
    }

    return false;
  } catch (e: any) {
    console.log(chalk.red(`❌ Unexpected error for ${fix.slug}: ${e.message}`));
    return false;
  }
}

async function applyAllFixes() {
  console.log(chalk.bold('\n🔧 APPLYING MANUAL REVIEW FIXES\n'));
  console.log(chalk.gray('═'.repeat(70)) + '\n');

  let applied = 0;
  let errors = 0;
  let skipped = 0;

  for (const fix of fixes) {
    const result = await applyFix(fix);
    if (result) {
      applied++;
      const note = fix.note ? chalk.gray(` (${fix.note})`) : '';
      console.log(chalk.green(`✅ ${fix.slug} (${fix.type})${note}`));
    } else if (result === false) {
      errors++;
    } else {
      skipped++;
    }
  }

  console.log(chalk.bold('\n' + '═'.repeat(70)));
  console.log(chalk.bold('📊 SUMMARY\n'));
  console.log(`  Applied: ${chalk.green(applied)}`);
  console.log(`  Errors: ${chalk.red(errors)}`);
  console.log(`  Skipped: ${chalk.yellow(skipped)}`);
  console.log();
}

applyAllFixes().catch(console.error);
