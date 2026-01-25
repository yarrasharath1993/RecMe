import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Manually reviewed and corrected data
const corrections = [
  // 2020s
  { id: '043bb7f8-1808-417b-9655-4d1fd3b01b4d', music_director: 'Ravi Basrur', release_year: 2026 },
  { id: '4f01db6e-a4b8-41f9-8ffc-0c8a1207eb34', music_director: 'T R Krishna Chetan', hero: 'Shanmukh Jaswanth', heroine: 'Anagha Ajith' },
  { id: 'e9421480-a36c-4013-b1fb-0b06dc44ee77', music_director: 'Praneeth Muzic', hero: 'Abhishek Sabbe' },
  { id: '0fad4e96-7fa9-40f7-82dc-3aa0c4c34efd', music_director: 'Roshan Saluri', heroine: 'Neha Jurel' },
  { id: '1cf5d5ee-3d38-411a-8996-0d264a6ebae4', music_director: 'Subhash Anand' },
  { id: 'd2ea0275-f55a-4e3e-bb40-fade8784bcbc', music_director: 'Gopi Sundar' },
  { id: '70a5c8d7-8c96-4e85-814f-d16c6e2d6516', music_director: 'K.S. Chandrashekar' },
  { id: '13c7b6e4-09ea-4e77-8cb3-7272a29ea7a6', music_director: 'Jaswanth Pasupuleti' },
  { id: '2e52dd37-be49-4e93-8799-b297ba6f12bc', music_director: 'Vasu Dixit' },
  { id: '1770f974-d4d3-4c5f-b9ef-0e174db8ae02', music_director: 'Pratik Abhyankar', hero: 'Trinadh' },
  { id: '3b0e593f-9717-4597-ac75-dd49ec125535', music_director: 'P.V.R. Raja', hero: 'Rishwi Thimmaraju', heroine: 'Ester Noronha' },
  { id: 'cc41dedf-9b84-4ef4-bb65-d021653b3015', music_director: 'Judah Sandhy', hero: 'Gautham Krishna' },
  { id: 'bbd69dfc-5cd8-4bab-aaf5-0d5a1799a9ab', music_director: 'Gowra Hari' },
  { id: '1c31eb51-3b2d-4b53-88b8-6b41def6600f', music_director: 'Satya Kashyap' },
  { id: 'b07d5abc-94ee-460c-9251-4c3a91bda391', music_director: 'Kalyani Malik' },
  { id: 'bb8034d4-812d-4ea5-bec9-6dbb00f30f02', music_director: 'Amitraj' },
  
  // 2010s
  { id: '51ef8c68-33a4-4649-89ec-1dba3402cdd1', music_director: 'M. Jayachandran', director: 'M. A. Nishad', hero: 'Pasupathy' },
  { id: 'ba405df5-3ea1-442c-ac50-7863ca4a42eb', music_director: 'Mihiraamsh' },
  { id: '08b54c86-914d-4804-be40-939e37bd1cf8', music_director: 'Sekhar Chandra' },
  { id: '5bcb96d4-7f72-459f-9626-af983ea6cdfb', music_director: 'Koti', director: 'N. Narasimha Rao' },
  { id: '5e4648fc-c7f2-4c69-9d0c-cdcf87501968', music_director: 'Krishna Chetan', director: 'Ram Ganpati Rao' },
  { id: '22b296ae-0236-4ce8-a038-23fab3ad9a8f', music_director: 'Madhu Ponnas', hero: 'Abhishek' },
  { id: '92a99020-68cc-45fb-9bb4-ac125686ebb0', music_director: 'Hari Gowra', director: 'Raaj Bharath', hero: 'Sai Ronak', heroine: 'Shravya' },
  { id: '35f8dfc5-609a-4f9a-ab94-e8dfd4deb254', music_director: 'Ravichandra' },
  { id: '576408ef-3abb-44ef-bd5c-6db3634e62e0', music_director: 'Arvind-Shankar', hero: 'Adith Arun' },
  { id: 'b994c347-d1e4-4edd-96f5-79f8baca9bea', music_director: 'Shankar-Ehsaan-Loy', heroine: 'Tamannaah Bhatia' },
  { id: '15a30869-79a8-45f3-8b35-585660039f99', music_director: 'Sekhar Chandra' },
  { id: '8cd6caf6-efa8-46b9-b6c7-a84e114381d4', music_director: 'Satya Mahaveer', heroine: 'Tridha Choudhury' },
  { id: '5910acf0-6784-433e-b7b9-d0a18edc5ba6', music_director: 'Achu Rajamani', hero: 'Manchu Vishnu', heroine: 'Hansika Motwani' },
  { id: 'df0a0ffb-36c3-4d4f-b32a-d7d7a4e4fe07', music_director: 'Chakri', hero: 'Tarun' },
  { id: 'a2cddffb-99b2-4d05-83ac-2c1fd2d5bb31', music_director: 'Shekar Chandra', director: 'Koneti Srinu' },
  { id: '8ac900ab-636a-4b62-8ea9-449341cd3539', music_director: 'Sachin-Jigar', heroine: 'Shruti Haasan' },
  { id: 'd20403fb-8432-4565-85c4-961d128206cb', music_director: 'Thaman S', title_en: 'Shadow', heroine: 'Taapsee Pannu' },
  { id: '1cfa647b-00b0-4798-98f9-a75e589e35d5', music_director: 'Yashovardhan', director: 'Naganna', heroine: 'Nikita Thukral' },
  { id: 'ce4f4031-9001-422d-bb6d-77164c22952c', music_director: 'Mahati' },
  { id: 'd2b85ce5-8c7c-4915-bf4c-f656c09583fd', music_director: 'Anil R', hero: 'Abijeet' },
  { id: '42186bca-a82e-4476-bd39-809162f248bd', music_director: 'Lalit Suresh' },
  { id: '1f339783-8a95-40dc-a318-fdb69edc331e', music_director: 'Sundar C. Babu' },
  { id: 'b424734e-1a88-463c-a2db-d1acd2b92178', music_director: 'Arjun' },
  { id: '47614fdc-e213-413b-ad2e-9fc41024fde3', music_director: 'Joshua Sridhar', hero: 'Akhil', heroine: 'Poorna' },
  { id: '0a90c9ef-dae5-4f8f-833a-341d257f1f73', music_director: 'Mani Sharma' },
  { id: '269f217a-99c7-4012-98f5-5fcc89dc6319', music_director: 'Chinni Charan', hero: 'Abbas' },
  { id: 'ae3b159f-0acc-4b51-8863-2d30201baed6', music_director: 'S.P. Venkatesh', hero: 'Jai Akash' },
  { id: '4d4cb01e-7be7-49f4-8ee6-657b4adf71bb', music_director: 'Chakri' },
  { id: 'c218798b-a4ca-42dc-b7c6-a6a407ab9524', music_director: 'Vishwa Mohan Bhatt', director: 'R. Sarath', hero: 'Xia Yu' },
  { id: '90065b76-6efe-48d1-b6e7-cee9e5197745', music_director: 'Colonial Cousins' },
  { id: '1c70dba4-0aa9-4292-a7e0-4a24bdc10dce', music_director: 'Chakri' },
  { id: '53f37cd5-1107-4396-93f0-5aa6ba836667', music_director: 'Ravindra Jain' },
  { id: '46cf0ad7-1b17-4940-9979-40805e295316', music_director: 'Vijay Kurakula', heroine: 'Sindhu Tolani' },
  { id: '95a02261-9df8-4a43-a6e0-4adb6f0e4a7e', music_director: 'John P. Varki' },
  { id: 'fa2a970d-aacb-4b7b-9aca-46a7c8df6d35', music_director: 'Sai Karthik', director: 'Venky' },
  { id: '8c8f8f93-9280-40ac-9567-757c01d51f12', music_director: 'Sri', hero: 'Allari Naresh', heroine: 'Kausha' },
  { id: 'cc0c6734-9ea5-41d0-82a7-765c9558d3e9', music_director: 'Thaman S' },
  { id: 'eab52068-0193-4c81-8808-34ca070abbe4', music_director: 'Mani Sharma', release_year: 2007 },
  { id: '46448a54-20ea-4406-8ce9-27df29e3e3fd', music_director: 'Mani Sharma', hero: 'Rajasekhar', heroine: 'Rambha' },
  { id: '6dcf4ef0-f5e9-4717-96dd-14513908ce02', music_director: 'Koti' },
  { id: 'db213db4-f0ba-4eca-ae5f-b291aef4be49', music_director: 'Vidyasagar' },
  
  // 2000s
  { id: '8b41e19f-4480-4a7f-bfb5-248bd481a2c8', music_director: 'Sandeep Chowta', director: 'Dasaradh', hero: 'Manchu Manoj', heroine: 'Tamannaah Bhatia' },
  { id: '2ca9e9a2-31e7-469d-a684-495f0f183da8', music_director: 'Hamsalekha' },
  { id: 'b3ddefa8-1e40-42d1-85fc-9e5e5739714d', music_director: 'S.A. Rajkumar', heroine: 'Laya' },
  { id: '05388c35-b8c8-408d-bf92-46473d6a5941', music_director: 'Vidyasagar', director: 'Nagalakshmi' },
  { id: 'bb9e4779-bf34-4187-8b6a-5eb92a833888', music_director: 'Ilaiyaraaja' },
  { id: 'dff595f3-e058-423b-a3ae-f1a1ce41da72', music_director: 'Chakri', release_year: 2002 },
  { id: 'ab2bfc71-3fbd-45cc-a9db-14ba0d8e3c68', music_director: 'Vandemataram', director: 'G. Nageswara Reddy', hero: 'Rohit', heroine: 'Anita Hassanandani' },
  { id: 'd2f163ca-7887-4b4f-a553-3d178386427e', music_director: 'Koti', director: 'E. V. V. Satyanarayana' },
  { id: '9df1e266-25cc-43b7-ac8b-bbd0fe7d97e3', music_director: 'Devi Sri Prasad', director: 'R. Raghuraj' },
  { id: '3372820e-3767-4676-bc41-47091f7bdf79', music_director: 'R. Narayana Murthy', director: 'R. Narayana Murthy', hero: 'R. Narayana Murthy' },
  { id: 'dba404be-c1e3-47b1-af59-a44286183907', title_en: 'Thilaadanam' },
  { id: '23d582fe-b793-48e3-aa52-d373f2908033', music_director: 'M.M. Srilekha', title_en: 'Ammaye Navvithe', hero: 'Rajendra Prasad', heroine: 'Bhavana' },
  { id: 'a8b7a98a-1211-406d-8fe2-5c7a54017797', music_director: 'S.A. Rajkumar', director: 'Dasaradh', heroine: 'Sneha' },
  { id: '1cf2eaaa-d81d-4fe9-8700-77adefff60e3', music_director: 'S.V. Krishna Reddy', director: 'P.A. Arun Prasad' },
  { id: 'da6bbdec-7ed9-4833-8718-791bd21c64c3', music_director: 'Mani Sharma' },
  { id: '42ab0724-35bb-453c-a9cb-65a3b5f9cfe8', music_director: 'M. M. Keeravani' },
  { id: '0398e7cb-3ac6-4634-9097-9c19234864ee', music_director: 'S. A. Rajkumar', hero: 'Sumanth' },
  { id: 'eb8cfe6b-3d53-48d9-8842-db7d6ebcac0a', music_director: 'S. V. Krishna Reddy' },
  { id: 'cc801a0a-487e-4b32-a53e-9811acc9d2e4', music_director: 'Ilaiyaraaja', hero: 'Vineeth' },
  { id: '51fb747b-a09e-4e85-87d1-d7b1215bc841', music_director: 'Mani Sharma' },
  { id: 'c66f58a2-c4cd-4206-9639-0a4167e784fc', music_director: 'M. M. Keeravani', hero: 'Akkineni Venkat', heroine: 'Chandni' },
  { id: 'e07b4c84-986c-4c9a-813f-04266996e108', music_director: 'Sirpy' },
  { id: '0a870842-3553-4713-b9ff-b371c3017729', music_director: 'Koti', director: 'E. V. V. Satyanarayana' },
  { id: '57af2864-fda4-401a-832a-3e8e6c1a1ac9', music_director: 'Koti', hero: 'J. D. Chakravarthy', heroine: 'Soundarya' },
  { id: '26931e42-1f85-4754-bede-0e2b8f6463bc', music_director: 'S. P. Venkatesh' },
  { id: '8fdf056e-1d81-4e16-9138-61c390fc66b7', music_director: 'M. M. Keeravani' },
  { id: '658606e7-9a74-49f5-8748-3757e84426e0', music_director: 'Koti' },
  { id: '32d1c1ea-abd5-44ae-980e-369ba2f6ab96', music_director: 'Ilaiyaraaja' },
  { id: '7c02513a-48b4-4fbc-90bf-a080eca4ace7', music_director: 'Deva', director: 'Pavithran' },
  { id: 'cac5fec7-32c9-4acd-aeec-e7983b3e61a4', music_director: 'Anand-Milind' },
  { id: '2ff0d645-a1c2-4c04-b684-d82c9e3608d7', music_director: 'Vandemataram Srinivas' },
  
  // 1990s
  { id: '798affd10dae', music_director: 'M. M. Keeravani' }, // Needs full ID
  { id: '45f578e7-18cb-46a0-9a2e-840c3baf87b7', music_director: 'Raj-Koti' },
  { id: 'b531f243-3b2c-46be-bbd0-59773e3ea129', music_director: 'Laxmikant-Pyarelal' },
  { id: '74201c2a-c4ac-4cc8-a6e9-a7276c97d666', music_director: 'R. D. Burman' },
  { id: '5a41344e-aa25-43aa-b84d-73bd8ebf817e', music_director: 'Shiv-Hari', hero: 'Anil Kapoor' },
  { id: '2153b25d-a999-4c1f-95c0-b9c9ba8bca5f', music_director: 'Raj-Koti' },
  { id: 'e7ddd297-cdac-412d-a405-6e41b2072f91', music_director: 'M. M. Keeravani', director: 'Chalam' },
  { id: '783566ee-f250-4ecd-99ce-574cf4f099d5', music_director: 'Raj-Koti' },
  { id: '5b8a5370-1c17-46d9-b05b-92847946c147', music_director: 'Ilaiyaraaja' },
  { id: '59290543-1651-4108-b7d7-bec8e5e019f0', music_director: 'Laxmikant-Pyarelal' },
  { id: 'bb15bede-cb1d-447f-9a8d-bcd151fd22f4', music_director: 'Shankar-Ganesh' },
  
  // 1980s
  { id: '8f7dd413-308f-4fc4-a3f0-429196b9848e', music_director: 'Chakravarthy', hero: 'Mohan' },
  { id: 'c03c3b7c-4ea6-49bf-acd8-cc7a5400f72e', music_director: 'R. D. Burman' },
  { id: 'a00b1bfc-c8e5-4dd8-a27f-a36e0f312123', music_director: 'Chakravarthy' },
  { id: '09db026f-9e52-4ff3-9432-d48e611c3d79', music_director: 'Bappi Lahiri', hero: 'Jeetendra' },
  { id: '189f1ec7-1af3-45ac-b87d-e30cd4021011', music_director: 'Master Venu' },
  { id: '926c1848-eea0-4d4f-9028-2278392d1653', music_director: 'Chakravarthy' },
  { id: 'd8f507fe-c7e3-4194-ae8d-ee318e059d68', music_director: 'Chakravarthy', hero: 'Krishnam Raju' },
  { id: 'f17dac8d-8ae1-4582-8209-40bdb9696acd', music_director: 'Chakravarthy' },
  { id: 'c29f53d4-0804-4951-bf84-89f43966ba5f', music_director: 'J. V. Raghavulu' },
  { id: 'efc17809-aac3-452b-8462-2fcef9bd44df', music_director: 'Chakravarthy', director: 'Amrutham' },
  { id: '3c8e2bde-5529-484d-a75e-4a6146047b4c', music_director: 'Satyam' },
  { id: 'd230d639-8927-40d7-9889-79f95e18d21f', music_director: 'S. Rajeswara Rao' },
  { id: '9807a152-23e5-4c40-9dae-53b618c2fa26', music_director: 'C. Ramchandra', hero: 'Nandamuri Balakrishna' },
  { id: '3c35824d-d2d5-41b8-bd12-ccfc108bba3f', music_director: 'K. V. Mahadevan', hero: 'N. T. Rama Rao' },
  { id: '45b3d0bc-521f-4600-8479-7100229a213a', music_director: 'K. V. Mahadevan', title_en: 'Adavi Ramudu' },
  
  // 1970s
  { id: 'fed29b1c-d954-4190-9ded-a9e2311af1d1', music_director: 'Satyam' },
  { id: '03fcbe9d-6ccd-4183-a488-e4a6e77d2128', music_director: 'Chakravarthy', director: 'Laxmi Deepak' },
  { id: 'fb3a5548-9e5f-4959-b2c1-b11f1825401a', music_director: 'Satyam' },
  { id: 'd745b9dc-6c71-44c5-b58c-e3a596b9fa36', music_director: 'Satyam' },
  { id: '1f9dc925-ee32-4a80-81e7-8ccdb1feb3b1', music_director: 'T. V. Raju' },
  { id: '3fd55b4d-0c1e-4a34-a42e-0ea8304902bf', music_director: 'P. Adinarayana Rao' },
  { id: '2b304fd9-9bcb-45b4-ab84-32fbd7648b7a', music_director: 'Satyam', hero: 'Tyagaraju' },
  { id: '82330833-3124-4248-89c4-0cee772d2865', music_director: 'S. Rajeswara Rao' },
  { id: 'f17a23d8-b42c-44ed-9c4a-90c873dc198a', music_director: 'T. V. Raju' },
  { id: '57e12151-fcd0-4497-86aa-1ccfd4fba945', music_director: 'V. Kumar' },
  { id: 'e640cd85-5b6d-4aa6-8417-67d9472f727d', music_director: 'T. V. Raju' },
  { id: '3d7e5606-5a88-4d3c-ac88-f5d9d266dafc', music_director: 'K. V. Mahadevan' },
  { id: 'f512c3d9-9b62-45bc-ace6-82bee59f59b3', music_director: 'T. V. Raju' },
  { id: '57d783f9-6889-4b27-b114-ce00d205c117', music_director: 'S. P. Kodandapani' },
  { id: '001fe9a1-f9ee-4b95-bfc3-ed3eff1c25a1', music_director: 'S. Rajeswara Rao' },
  { id: 'b253a2c0-7389-4d0c-9cac-0a9f357ec730', music_director: 'T. V. Raju' },
  { id: 'd9290f37-89e9-40b1-abf0-b322355eaefd', music_director: 'Ghantasala' },
  { id: '2142390d-8c14-4236-9aae-eb20edaa95cd', music_director: 'T. V. Raju' },
  { id: '9d7f8955-4c70-4623-88f6-4acbf7e0a0fb', music_director: 'M. V. Rajamma' },
  { id: '2c262b88-1e37-4622-a35c-cd8238e001c6', music_director: 'P. Adinarayana Rao', hero: 'S. V. Ranga Rao' },
  
  // 1960s
  { id: 'd184bfff-a604-4a40-87fa-c5e99e6604f1', music_director: 'Pendyala Nageswara Rao', hero: 'NTR & ANR', heroine: 'B. Saroja Devi' },
  { id: 'c78ffe87-4ab5-4d13-a7e0-d7abef4e1280', music_director: 'Joseph & Vijaya Krishna' },
  { id: '8a2686d8-95e2-4347-8613-96a509c045c4', music_director: 'Pendyala Nageswara Rao', hero: 'ANR' },
  { id: '2baf086a-427c-48d5-b22d-206c4baf3c62', music_director: 'Master Venu' },
  { id: '735842b6-5a51-4feb-85e8-2d4b8ef1a103', music_director: 'S. Hanumatha Rao' },
  { id: '342f5382-2c8f-4926-9533-11e1a484b3d3', music_director: 'T. V. Raju' },
  { id: '0e7d1fac-5a2d-4055-bdfb-92b79351007c', music_director: 'S. Rajeswara Rao', hero: 'ANR' },
  { id: 'eaf33e47-6cab-42d8-8c58-d05a39ccde49', music_director: 'Prasada Rao' },
  { id: 'b0d91a00-dacc-439b-853b-50d8e7a6f449', music_director: 'G. Ramanathan' },
  { id: '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a', music_director: 'Ghantasala', hero: 'ANR' },
  { id: 'c73ab17e-8f49-4974-a907-fabf2d9a70f0', music_director: 'T. Chalapathi Rao', release_year: 1960 },
  { id: '1dbed8ea-81cf-45a1-8673-16df2acc1bbf', music_director: 'C. R. Subburaman', hero: 'ANR', heroine: 'Savitri' },
  { id: '82cc705e-a19a-4d00-9dde-3c71a6def345', music_director: 'C. R. Subburaman', hero: 'ANR' },
  { id: 'c5e41c8d-0186-44b1-9cf7-832a64ec692f', music_director: 'Saluri Rajeswara Rao', director: 'K. Nagabhushanam' },
  
  // Pre-1945
  { id: '72cd10c7-b65e-4dc5-904b-bdae7c78403f', music_director: 'Chittoor V. Nagaiah' },
  { id: '259f1273-083f-4d98-9fe5-e161146426f1', director: 'P. Pullaiah' },
  { id: '97d553ff-1199-4ea3-b9bb-8cfce790e425', music_director: 'S. Rajeswara Rao' },
  { id: 'ef7766cd-c94f-420b-947a-e9f73c794626', music_director: 'S. Rajeswara Rao' },
  { id: 'cd114eaf-58c8-4227-862f-8ad3ceb74779', music_director: 'Bhimavarapu Narasimha Rao' },
  { id: '67f674fd-44b7-44bb-8e25-0db4f23051f0', heroine: 'S. Rajalakshmi' },
  { id: 'c23acc48-a64b-4580-a4fa-4f551326f6d4', music_director: 'H.R. Padmanabha Sastry', release_year: 1932 },
];

async function importCorrections() {
  console.log('\n🎵 Importing manually reviewed corrections...\n');
  
  let updated = 0;
  let errors = 0;
  
  for (const correction of corrections) {
    // Skip if ID is incomplete
    if (correction.id.length < 36) {
      console.log(`⚠️  Skipping incomplete ID: ${correction.id}`);
      continue;
    }
    
    // Build update object - only include non-null fields
    const updateData: Record<string, any> = {};
    
    if (correction.music_director) updateData.music_director = correction.music_director;
    if (correction.director) updateData.director = correction.director;
    if (correction.hero) updateData.hero = correction.hero;
    if (correction.heroine) updateData.heroine = correction.heroine;
    if (correction.release_year) updateData.release_year = correction.release_year;
    if ((correction as any).title_en) updateData.title_en = (correction as any).title_en;
    
    if (Object.keys(updateData).length === 0) {
      continue;
    }
    
    const { error } = await supabase
      .from('movies')
      .update(updateData)
      .eq('id', correction.id);
    
    if (error) {
      console.log(`❌ Error updating ${correction.id}: ${error.message}`);
      errors++;
    } else {
      updated++;
      if (updated % 20 === 0) {
        console.log(`   Updated ${updated} records...`);
      }
    }
  }
  
  console.log(`\n✅ Import complete: ${updated} records updated, ${errors} errors\n`);
  
  // Show final stats
  const { count: totalMissing } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)
    .or('music_director.is.null,music_director.eq.');
  
  const { count: totalPublished } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true);
  
  const coverage = ((totalPublished! - totalMissing!) / totalPublished! * 100).toFixed(1);
  
  console.log('📊 Final Music Director Coverage:');
  console.log(`   Total published: ${totalPublished}`);
  console.log(`   With music director: ${totalPublished! - totalMissing!}`);
  console.log(`   Still missing: ${totalMissing}`);
  console.log(`   Coverage: ${coverage}%\n`);
}

importCorrections();
