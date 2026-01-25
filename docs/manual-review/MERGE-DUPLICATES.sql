-- ============================================================
-- CELEBRITY DUPLICATE REMOVAL SQL
-- Generated: 2026-01-13T19:07:17.254Z
-- Total Groups: 68
-- Total Profiles to Delete: 39
-- ============================================================

-- IMPORTANT: Review each DELETE statement before running!
-- The "primary" profile (kept) is listed in comments.

BEGIN;

-- ============================================================
-- Same TMDB ID: 584666
-- PRIMARY (KEEP): Kodandarami Reddy (celeb-kodandarami-reddy)
--   ID: b15157d0-e667-4be8-b470-eb6955a9b3c6
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Kodanda Rami Reddy (celeb-kodanda-rami-reddy)
DELETE FROM celebrities WHERE id = '9f7a6c1d-c515-4062-9436-ae170cc37094';
-- DELETE: A Kodandarami Reddy (celeb-a-kodandarami-reddy)
DELETE FROM celebrities WHERE id = '059efba5-7e6f-4c1a-9682-e6ca66dac5c6';

-- ============================================================
-- Same TMDB ID: 1180898
-- PRIMARY (KEEP): Aadi (celeb-aadi)
--   ID: bd03d4e0-7ac8-46d0-be57-956c3fc0f048
--   Confidence: 58, Published: true
-- ============================================================
-- DELETE: Aadi Saikumar (celeb-aadi-saikumar)
DELETE FROM celebrities WHERE id = '3c8c9b48-081b-4839-8866-3adad4d9b47a';

-- ============================================================
-- Same TMDB ID: 149958
-- PRIMARY (KEEP): Akkineni Nagarjuna (celeb-akkineni-nagarjuna)
--   ID: 416db06b-7f62-4e09-af2d-32a85a4ff295
--   Confidence: 0.5, Published: false
-- ============================================================
-- DELETE: Nagarjuna (celeb-05929a7d)
DELETE FROM celebrities WHERE id = '05929a7d-7263-490a-b82a-bbf3e7c78853';

-- ============================================================
-- Same TMDB ID: 237254
-- PRIMARY (KEEP): Akkineni Nageswara Rao (akkineni-nageswara-rao)
--   ID: 32a99a11-86be-4afa-a0e6-ce18c6ce3eea
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Nageshwara Rao Akkineni (celeb-nageshwara-rao-akkineni)
DELETE FROM celebrities WHERE id = 'b4262f0a-ab14-4797-abba-12ce1cf1b8d6';

-- ============================================================
-- Same TMDB ID: 108215
-- PRIMARY (KEEP): Allu (celeb-allu)
--   ID: fa67cbeb-adcc-49e1-9418-77e29ddc0aac
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Allu Arjun (allu-arjun)
DELETE FROM celebrities WHERE id = 'e772a33c-504c-47f1-b723-ea9a47869638';

-- ============================================================
-- Same TMDB ID: 1208885
-- PRIMARY (KEEP): Sobhan Babu (sobhan-babu)
--   ID: f63204ee-5d9a-40ed-a706-6edfd0620f84
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Babu Rao (celeb-babu-rao)
DELETE FROM celebrities WHERE id = 'a76b95b6-67e6-4dfc-91f3-f125b45f0675';

-- ============================================================
-- Same TMDB ID: 1107010
-- PRIMARY (KEEP): Bhanuchander (celeb-bhanuchander)
--   ID: 77b6b8f3-559d-4563-81a5-b9a65edf600f
--   Confidence: 0.5, Published: true
-- ============================================================
-- DELETE: Bhanu Chander (null)
DELETE FROM celebrities WHERE id = '71476596-7275-4532-be84-631e99c81e15';

-- ============================================================
-- Same TMDB ID: 1003965
-- PRIMARY (KEEP): Bhanumathi (celeb-bhanumathi)
--   ID: b89cc71e-0cea-4446-ada4-ba6852e48f50
--   Confidence: 80, Published: true
-- ============================================================
-- DELETE: P Bhanumathi (p-bhanumathi)
DELETE FROM celebrities WHERE id = '4f6558d3-45cf-428e-a717-bfb5f6f976f2';
-- DELETE: Bhanumathi Ramakrishna (celeb-bhanumathi-ramakrishna)
DELETE FROM celebrities WHERE id = '0f44232a-79a0-4a5f-939f-0e1038cf8fac';

-- ============================================================
-- Same TMDB ID: 586627
-- PRIMARY (KEEP): Chandra Mohan (celeb-chandra-mohan)
--   ID: 7b4239ee-a744-4591-9b04-4e8609627e7b
--   Confidence: 80, Published: true
-- ============================================================
-- DELETE: Chandramohan (celeb-chandramohan)
DELETE FROM celebrities WHERE id = '39963462-2470-488d-8e0b-0d75a0acd7e5';

-- ============================================================
-- Same TMDB ID: 88166
-- PRIMARY (KEEP): Daggubati Venkatesh (celeb-daggubati-venkatesh)
--   ID: ceb2c247-5c54-4283-959b-dc3f394d9c09
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Venkatesh (celeb-52cf4ded)
DELETE FROM celebrities WHERE id = '52cf4ded-32c8-4d0f-9883-5867f252aa78';

-- ============================================================
-- Same TMDB ID: 590744
-- PRIMARY (KEEP): Rajasekhar (celeb-rajasekhar)
--   ID: 9124d7c0-72fd-4f21-ab80-8a35fe1d2d83
--   Confidence: 82, Published: true
-- ============================================================
-- DELETE: Dr. Rajasekhar (celeb-dr-rajasekhar)
DELETE FROM celebrities WHERE id = '602a3f4c-b9b0-4375-a126-05d73bfa1f24';

-- ============================================================
-- Same TMDB ID: 1060277
-- PRIMARY (KEEP): E.V.V. Satyanarayana (celeb-e-v-v-satyanarayana)
--   ID: 25f2f198-b386-463a-87d4-61655dbe088d
--   Confidence: 75, Published: true
-- ============================================================
-- DELETE: E. V. V. Satyanarayana (null)
DELETE FROM celebrities WHERE id = 'ec8d245c-7c81-41c5-93f9-d0a458d2b8a8';
-- DELETE: E V V Satyanarayana (celeb-e-v-v-satyanarayana)
DELETE FROM celebrities WHERE id = 'da60dad4-f36d-4e36-8467-a231c42f9524';

-- ============================================================
-- Same TMDB ID: 465273
-- PRIMARY (KEEP): Jagapathi Babu (celeb-jagapathi-babu)
--   ID: ed2aaa80-0f2b-4977-b1fb-bd3a8f0030f6
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Jagapati Babu (celeb-jagapati-babu)
DELETE FROM celebrities WHERE id = 'a9caaf6b-8425-48bd-b32a-786cf908f018';

-- ============================================================
-- Same TMDB ID: 1335686
-- PRIMARY (KEEP): Jaggayya (jaggayya)
--   ID: 680ebff5-78e7-4aca-8815-374583bc9069
--   Confidence: 53, Published: true
-- ============================================================
-- DELETE: Kongara Jaggayya (celeb-kongara-jaggayya)
DELETE FROM celebrities WHERE id = '12246ccf-e690-41f3-b33e-5b9951bfd054';

-- ============================================================
-- Same TMDB ID: 584415
-- PRIMARY (KEEP): Janaki (celeb-janaki)
--   ID: c293135b-e402-4667-ad0a-280f44a04910
--   Confidence: 58, Published: true
-- ============================================================
-- DELETE: Showkar Janaki (null)
DELETE FROM celebrities WHERE id = '5c495fb9-803c-4842-9859-64f2a93fe7fb';
-- DELETE: Sowcar Janaki (celeb-sowcar-janaki)
DELETE FROM celebrities WHERE id = '612b0831-bb6d-4e3c-ab90-97f6057ae5cc';

-- ============================================================
-- Same TMDB ID: 928860
-- PRIMARY (KEEP): Jandhyala (celeb-jandhyala)
--   ID: 265f1268-e5e4-4836-a9f7-436c86a237fe
--   Confidence: 71, Published: true
-- ============================================================
-- DELETE: Jandhyala Subramanya Sastry (celeb-jandhyala-subramanya-sastry)
DELETE FROM celebrities WHERE id = '43d45481-b2fc-4a9f-a07d-5b27e0ce91c4';

-- ============================================================
-- Same TMDB ID: 238016
-- PRIMARY (KEEP): Jaya Prada (jaya-prada)
--   ID: 9144620f-4abd-4ba6-a713-494ea336cf76
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Jayaprada (null)
DELETE FROM celebrities WHERE id = 'fcb5d352-c9e7-4fd3-9aac-7fbe8c18a818';

-- ============================================================
-- Same TMDB ID: 1123523
-- PRIMARY (KEEP): Jayalalitha (celeb-jayalalitha)
--   ID: 3e18a500-ed87-4122-9fc4-7a54dce3bb82
--   Confidence: 66, Published: true
-- ============================================================
-- DELETE: Jayalalithaa (celeb-jayalalithaa)
DELETE FROM celebrities WHERE id = '2839233f-e743-4949-99f6-0f7704899710';

-- ============================================================
-- Same TMDB ID: 148037
-- PRIMARY (KEEP): N.T. Rama Rao Jr. (celeb-n-t-rama-rao-jr-)
--   ID: 5e9bdc8d-63f8-4007-93dc-e03824a243cf
--   Confidence: 71, Published: true
-- ============================================================
-- DELETE: Jr. NTR (jr-ntr)
DELETE FROM celebrities WHERE id = 'cca50aad-69af-4c86-be34-2fef9c4f7e8f';

-- ============================================================
-- Same TMDB ID: 237706
-- PRIMARY (KEEP): K. Balachander (null)
--   ID: aefdd1b5-016c-43f8-ac19-c1cb18fbc061
--   Confidence: 76, Published: true
-- ============================================================
-- DELETE: K Balachander (celeb-k-balachander)
DELETE FROM celebrities WHERE id = 'e47f51c1-c14a-4a73-b461-eae5e17ab72b';

-- ============================================================
-- Same TMDB ID: 1335734
-- PRIMARY (KEEP): K.S.R. Das (celeb-k-s-r-das)
--   ID: a6215fa5-680b-4b0b-afcd-0e43accadbea
--   Confidence: 67, Published: true
-- ============================================================
-- DELETE: K. S. R. Das (celeb-k-s-r-das)
DELETE FROM celebrities WHERE id = '6a903db0-b953-48e2-ace3-c370a3653386';

-- ============================================================
-- Same TMDB ID: 552991
-- PRIMARY (KEEP): Satyanarayana (celeb-satyanarayana)
--   ID: 68dfa96d-1d00-43f6-81bc-c871bc84e209
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Kaikala Satyanarayana (celeb-kaikala-satyanarayana)
DELETE FROM celebrities WHERE id = '291b42c7-3839-4ef0-afa4-6cfbf6afb070';

-- ============================================================
-- Same TMDB ID: 82078
-- PRIMARY (KEEP): Khushboo (celeb-khushboo)
--   ID: 52292e26-0955-4978-8929-c09687e16ffb
--   Confidence: 0.5, Published: true
-- ============================================================
-- DELETE: Kushboo (celeb-kushboo)
DELETE FROM celebrities WHERE id = 'bf5297a6-0ae8-49bc-b782-728d15f1a3ce';

-- ============================================================
-- Same TMDB ID: 1003933
-- PRIMARY (KEEP): N.T. Rama Rao (celeb-n-t-rama-rao)
--   ID: 2066cd3d-60ec-46b2-86f0-eb4c50b2253a
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: T. Rama Rao (celeb-t-rama-rao)
DELETE FROM celebrities WHERE id = 'a52ce466-f54d-4e17-8a54-81cd769ad62d';
-- DELETE: N T Rama Rao (n-t-rama-rao)
DELETE FROM celebrities WHERE id = '56e96776-389c-498c-9e4d-e099031e7f04';

-- ============================================================
-- Same TMDB ID: 1400656
-- PRIMARY (KEEP): Naga Shaurya (celeb-naga-shaurya)
--   ID: 9b3fba37-c96b-4407-89d3-0e329eaa0b9a
--   Confidence: 55, Published: true
-- ============================================================
-- DELETE: Naga Shourya (celeb-naga-shourya)
DELETE FROM celebrities WHERE id = '303c9687-1d0e-42c4-acc1-e7a042e3e14e';

-- ============================================================
-- Same TMDB ID: 938965
-- PRIMARY (KEEP): Rohit (celeb-rohit)
--   ID: d7dfcf0b-d81e-4507-a827-51e4174a20b3
--   Confidence: 78, Published: true
-- ============================================================
-- DELETE: Nara Rohit (celeb-nara-rohit)
DELETE FROM celebrities WHERE id = '0d3c270a-908b-4723-b3d7-ea92bfe6411b';
-- DELETE: Nara Rohith (celeb-nara-rohith)
DELETE FROM celebrities WHERE id = '413563f4-9760-4157-8608-d98593ff4aff';

-- ============================================================
-- Same TMDB ID: 562177
-- PRIMARY (KEEP): Raadhika (celeb-raadhika)
--   ID: da2f3282-9f32-45d5-a5d4-06cf7b990f44
--   Confidence: 0.5, Published: true
-- ============================================================
-- DELETE: Radikaa Sarathkumar (celeb-radikaa-sarathkumar)
DELETE FROM celebrities WHERE id = '4c03c0df-c977-4de9-9bad-c7a7782e4b5a';

-- ============================================================
-- Same TMDB ID: 141701
-- PRIMARY (KEEP): Ramya Krishna (celeb-ramya-krishna)
--   ID: ed0400fb-23c3-4fc8-b945-afb6c51d8f03
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Ramya Krishnan (celeb-ramya-krishnan)
DELETE FROM celebrities WHERE id = '7b5ad0b1-105a-4a9d-a5f9-1070ce756e28';

-- ============================================================
-- Same TMDB ID: 584132
-- PRIMARY (KEEP): Ravichandran (null)
--   ID: 6bde6742-b23a-4d6d-974b-793037fe6493
--   Confidence: 58, Published: true
-- ============================================================
-- DELETE: S. S. Ravichandra (celeb-s-s-ravichandra)
DELETE FROM celebrities WHERE id = 'f6daf0c0-2852-4776-87ac-7b9cc3346305';

-- ============================================================
-- Same TMDB ID: 1029010
-- PRIMARY (KEEP): S.V. Krishna Reddy (celeb-s-v-krishna-reddy)
--   ID: d4edec92-7691-44a5-ab1b-cb70b68b7c08
--   Confidence: 63, Published: true
-- ============================================================
-- DELETE: S. V. Krishna Reddy (celeb-s-v-krishna-reddy)
DELETE FROM celebrities WHERE id = 'b37c432b-117a-4a66-8972-26b7b3042c09';

-- ============================================================
-- Same TMDB ID: 1386112
-- PRIMARY (KEEP): Sai Dharam Tej (celeb-sai-dharam-tej)
--   ID: de66941a-103f-4692-9928-14c6b9674917
--   Confidence: 0.5, Published: true
-- ============================================================
-- DELETE: Sai Durgha Tej (celeb-sai-durgha-tej)
DELETE FROM celebrities WHERE id = '86cc389f-9d7a-4245-ae9f-5d1918883b99';

-- ============================================================
-- Same TMDB ID: 225312
-- PRIMARY (KEEP): Samantha (celeb-samantha)
--   ID: 96b036df-313a-4bd0-b472-1fb35b57b21c
--   Confidence: 73, Published: true
-- ============================================================
-- DELETE: Samantha Ruth Prabhu (samantha)
DELETE FROM celebrities WHERE id = '5cd427fc-92bb-477c-b38c-f5777373c577';

-- ============================================================
-- Same TMDB ID: 2984931
-- PRIMARY (KEEP): Shantipriya (celeb-shantipriya)
--   ID: 764bf9e3-654c-4c03-a431-f3eae47673c0
--   Confidence: 0.5, Published: true
-- ============================================================
-- DELETE: Shanthi Priya (null)
DELETE FROM celebrities WHERE id = 'ab69ec8c-2d7e-40f5-9154-c1635b4534db';

-- ============================================================
-- Same TMDB ID: 582183
-- PRIMARY (KEEP): Sivaji (celeb-sivaji)
--   ID: 72e1b4b8-2b29-4402-a2d6-6c06a68c7252
--   Confidence: 76, Published: true
-- ============================================================
-- DELETE: Sivaji Ganesan (celeb-sivaji-ganesan)
DELETE FROM celebrities WHERE id = 'ef16114f-6a26-4fab-abe4-6e5514be1f6e';

-- ============================================================
-- Same TMDB ID: 1107021
-- PRIMARY (KEEP): Sreenu Vaitla (celeb-sreenu-vaitla)
--   ID: 0d40f232-87e7-48b2-a831-53d9c54479f8
--   Confidence: 53, Published: true
-- ============================================================
-- DELETE: Srinu Vaitla (celeb-srinu-vaitla)
DELETE FROM celebrities WHERE id = '1f3c2739-bfa9-40a3-a5a3-10d8ffe01fa7';

-- ============================================================
-- Same TMDB ID: 1201818
-- PRIMARY (KEEP): Suman (celeb-suman)
--   ID: 2498ba80-af97-4cfd-8e03-d031d6b87191
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Sumanth Ashwin (celeb-sumanth-ashwin)
DELETE FROM celebrities WHERE id = '4a992d7e-6de8-4395-85be-717a73f31c4c';

-- ============================================================
-- Same TMDB ID: 583972
-- PRIMARY (KEEP): Vanisri (celeb-vanisri)
--   ID: 343c8f42-04c0-4759-8b0e-16e303966af4
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Vanisree (vanisree)
DELETE FROM celebrities WHERE id = 'aa7fdedc-96c6-49fa-9f6d-516cf727421a';

-- ============================================================
-- Same IMDb ID: nm0004630
-- PRIMARY (KEEP): Kodandarami Reddy (celeb-kodandarami-reddy)
--   ID: b15157d0-e667-4be8-b470-eb6955a9b3c6
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Kodanda Rami Reddy (celeb-kodanda-rami-reddy)
DELETE FROM celebrities WHERE id = '9f7a6c1d-c515-4062-9436-ae170cc37094';
-- DELETE: A Kodandarami Reddy (celeb-a-kodandarami-reddy)
DELETE FROM celebrities WHERE id = '059efba5-7e6f-4c1a-9682-e6ca66dac5c6';

-- ============================================================
-- Same IMDb ID: nm4925980
-- PRIMARY (KEEP): Aadi (celeb-aadi)
--   ID: bd03d4e0-7ac8-46d0-be57-956c3fc0f048
--   Confidence: 58, Published: true
-- ============================================================
-- DELETE: Aadi Saikumar (celeb-aadi-saikumar)
DELETE FROM celebrities WHERE id = '3c8c9b48-081b-4839-8866-3adad4d9b47a';

-- ============================================================
-- Same IMDb ID: nm0004463
-- PRIMARY (KEEP): Akkineni Nageswara Rao (akkineni-nageswara-rao)
--   ID: 32a99a11-86be-4afa-a0e6-ce18c6ce3eea
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Nageshwara Rao Akkineni (celeb-nageshwara-rao-akkineni)
DELETE FROM celebrities WHERE id = 'b4262f0a-ab14-4797-abba-12ce1cf1b8d6';

-- ============================================================
-- Same IMDb ID: nm1084853
-- PRIMARY (KEEP): Allu (celeb-allu)
--   ID: fa67cbeb-adcc-49e1-9418-77e29ddc0aac
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Allu Arjun (allu-arjun)
DELETE FROM celebrities WHERE id = 'e772a33c-504c-47f1-b723-ea9a47869638';

-- ============================================================
-- Same IMDb ID: nm0893142
-- PRIMARY (KEEP): Daggubati Venkatesh (celeb-daggubati-venkatesh)
--   ID: ceb2c247-5c54-4283-959b-dc3f394d9c09
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Venkatesh (celeb-52cf4ded)
DELETE FROM celebrities WHERE id = '52cf4ded-32c8-4d0f-9883-5867f252aa78';

-- ============================================================
-- Same IMDb ID: nm0707362
-- PRIMARY (KEEP): Rajasekhar (celeb-rajasekhar)
--   ID: 9124d7c0-72fd-4f21-ab80-8a35fe1d2d83
--   Confidence: 82, Published: true
-- ============================================================
-- DELETE: Dr. Rajasekhar (celeb-dr-rajasekhar)
DELETE FROM celebrities WHERE id = '602a3f4c-b9b0-4375-a126-05d73bfa1f24';

-- ============================================================
-- Same IMDb ID: nm0004466
-- PRIMARY (KEEP): E.V.V. Satyanarayana (celeb-e-v-v-satyanarayana)
--   ID: 25f2f198-b386-463a-87d4-61655dbe088d
--   Confidence: 75, Published: true
-- ============================================================
-- DELETE: E. V. V. Satyanarayana (null)
DELETE FROM celebrities WHERE id = 'ec8d245c-7c81-41c5-93f9-d0a458d2b8a8';

-- ============================================================
-- Same IMDb ID: nm0045075
-- PRIMARY (KEEP): Jagapathi Babu (celeb-jagapathi-babu)
--   ID: ed2aaa80-0f2b-4977-b1fb-bd3a8f0030f6
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Jagapati Babu (celeb-jagapati-babu)
DELETE FROM celebrities WHERE id = 'a9caaf6b-8425-48bd-b32a-786cf908f018';

-- ============================================================
-- Same IMDb ID: nm0417386
-- PRIMARY (KEEP): Jandhyala (celeb-jandhyala)
--   ID: 265f1268-e5e4-4836-a9f7-436c86a237fe
--   Confidence: 71, Published: true
-- ============================================================
-- DELETE: Jandhyala Subramanya Sastry (celeb-jandhyala-subramanya-sastry)
DELETE FROM celebrities WHERE id = '43d45481-b2fc-4a9f-a07d-5b27e0ce91c4';

-- ============================================================
-- Same IMDb ID: nm0412883
-- PRIMARY (KEEP): Jayalalitha (celeb-jayalalitha)
--   ID: 3e18a500-ed87-4122-9fc4-7a54dce3bb82
--   Confidence: 66, Published: true
-- ============================================================
-- DELETE: Jayalalithaa (celeb-jayalalithaa)
DELETE FROM celebrities WHERE id = '2839233f-e743-4949-99f6-0f7704899710';

-- ============================================================
-- Same IMDb ID: nm0004467
-- PRIMARY (KEEP): Satyanarayana (celeb-satyanarayana)
--   ID: 68dfa96d-1d00-43f6-81bc-c871bc84e209
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Kaikala Satyanarayana (celeb-kaikala-satyanarayana)
DELETE FROM celebrities WHERE id = '291b42c7-3839-4ef0-afa4-6cfbf6afb070';

-- ============================================================
-- Same IMDb ID: nm0004417
-- PRIMARY (KEEP): N.T. Rama Rao (celeb-n-t-rama-rao)
--   ID: 2066cd3d-60ec-46b2-86f0-eb4c50b2253a
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: T. Rama Rao (celeb-t-rama-rao)
DELETE FROM celebrities WHERE id = 'a52ce466-f54d-4e17-8a54-81cd769ad62d';

-- ============================================================
-- Same IMDb ID: nm3611091
-- PRIMARY (KEEP): Rohit (celeb-rohit)
--   ID: d7dfcf0b-d81e-4507-a827-51e4174a20b3
--   Confidence: 78, Published: true
-- ============================================================
-- DELETE: Nara Rohit (celeb-nara-rohit)
DELETE FROM celebrities WHERE id = '0d3c270a-908b-4723-b3d7-ea92bfe6411b';

-- ============================================================
-- Same IMDb ID: nm0471447
-- PRIMARY (KEEP): Ramya Krishna (celeb-ramya-krishna)
--   ID: ed0400fb-23c3-4fc8-b945-afb6c51d8f03
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Ramya Krishnan (celeb-ramya-krishnan)
DELETE FROM celebrities WHERE id = '7b5ad0b1-105a-4a9d-a5f9-1070ce756e28';

-- ============================================================
-- Same IMDb ID: nm0007161
-- PRIMARY (KEEP): S.V. Krishna Reddy (celeb-s-v-krishna-reddy)
--   ID: d4edec92-7691-44a5-ab1b-cb70b68b7c08
--   Confidence: 63, Published: true
-- ============================================================
-- DELETE: S. V. Krishna Reddy (celeb-s-v-krishna-reddy)
DELETE FROM celebrities WHERE id = 'b37c432b-117a-4a66-8972-26b7b3042c09';

-- ============================================================
-- Same IMDb ID: nm0304262
-- PRIMARY (KEEP): Sivaji (celeb-sivaji)
--   ID: 72e1b4b8-2b29-4402-a2d6-6c06a68c7252
--   Confidence: 76, Published: true
-- ============================================================
-- DELETE: Sivaji Ganesan (celeb-sivaji-ganesan)
DELETE FROM celebrities WHERE id = 'ef16114f-6a26-4fab-abe4-6e5514be1f6e';

-- ============================================================
-- Same IMDb ID: nm5896360
-- PRIMARY (KEEP): Suman (celeb-suman)
--   ID: 2498ba80-af97-4cfd-8e03-d031d6b87191
--   Confidence: 90, Published: true
-- ============================================================
-- DELETE: Sumanth Ashwin (celeb-sumanth-ashwin)
DELETE FROM celebrities WHERE id = '4a992d7e-6de8-4395-85be-717a73f31c4c';

-- ============================================================
-- Similar names (100% match)
-- PRIMARY (KEEP): C. S. Rao (celeb-c-s-rao)
--   ID: da6ce938-b660-4ad9-ad23-ebd8b91a9dda
--   Confidence: 55, Published: true
-- ============================================================
-- DELETE: C.S. Rao (celeb-c-s-rao)
DELETE FROM celebrities WHERE id = '0a022e7f-f8cb-4e3c-9ac5-c16bd85e16d3';

-- ============================================================
-- Similar names (96% match)
-- PRIMARY (KEEP): Kamalakara Kameshwara Rao (celeb-kamalakara-kameshwara-rao)
--   ID: ff96c57f-b0d5-4580-ba8f-1091d1affefe
--   Confidence: 0.5, Published: true
-- ============================================================
-- DELETE: Kamalakara Kameswara Rao (celeb-kamalakara-kameswara-rao)
DELETE FROM celebrities WHERE id = '7c169da1-299b-49e0-8cdf-94542b159c8c';

-- ============================================================
-- SUMMARY
-- Total Deletes: 63
-- Profiles Retained: 56
-- ============================================================

-- Uncomment the line below to commit the changes:
-- COMMIT;

-- Or rollback if you want to review further:
ROLLBACK;