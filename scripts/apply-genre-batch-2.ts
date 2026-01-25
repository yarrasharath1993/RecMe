#!/usr/bin/env npx tsx
/**
 * Apply Genre Classification Batch 2 (Entries 401-600)
 * 
 * 200 movies from 2000-1992 era with corrected genres
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

interface MovieCorrection {
  id: number;
  title: string;
  slug: string;
  genres: string[];
  year: number;
  notes?: string;
  isDuplicate?: boolean;
}

const corrections: MovieCorrection[] = [
  { id: 401, title: 'Kauravudu', slug: 'kauravudu-2000', genres: ['Action', 'Drama'], year: 2000 },
  { id: 402, title: 'Yee Taram Nehru', slug: 'yee-taram-nehru-2000', genres: ['Drama'], year: 2000 },
  { id: 403, title: 'Okkadu Chalu', slug: 'okkadu-chalu-2000', genres: ['Action'], year: 2000 },
  { id: 404, title: 'Manasu Paddanu Kaani', slug: 'manasu-paddanu-kaani-2000', genres: ['Romance', 'Drama'], year: 2000 },
  { id: 405, title: 'Choosoddaam Randi', slug: 'choosoddaam-randi-2000', genres: ['Comedy', 'Drama'], year: 2000 },
  { id: 406, title: 'Durga', slug: 'durga-2000', genres: ['Drama', 'Fantasy'], year: 2000 },
  { id: 407, title: 'Maa Annayya', slug: 'maa-annayya-2000', genres: ['Drama'], year: 2000 },
  { id: 408, title: 'Chiru Navvutho', slug: 'chiru-navvutho-2000', genres: ['Comedy', 'Romance', 'Drama'], year: 2000 },
  { id: 409, title: 'Vamsoddarakudu', slug: 'vamsoddarakudu-2000', genres: ['Action', 'Drama'], year: 2000 },
  { id: 410, title: 'Sakutumba Saparivaara Sametham', slug: 'sakutumba-saparivaara-sametham-2000', genres: ['Drama', 'Comedy'], year: 2000 },
  { id: 411, title: 'Pelli Sambandham', slug: 'pelli-sambandham-2000', genres: ['Drama', 'Comedy'], year: 2000 },
  { id: 412, title: 'Sakutumba Saparivaara Sametam', slug: 'sakutumba-saparivaara-sametam-2000', genres: ['Drama', 'Comedy'], year: 2000, isDuplicate: true, notes: 'Duplicate of 410' },
  { id: 413, title: 'Dollar Dreams', slug: 'dollar-dreams-1999', genres: ['Drama'], year: 1999 },
  { id: 414, title: 'Panchadara Chilaka', slug: 'panchadara-chilaka-1999', genres: ['Drama'], year: 1999 },
  { id: 415, title: 'Speed Dancer', slug: 'speed-dancer-1999', genres: ['Action', 'Drama'], year: 1999 },
  { id: 416, title: 'Naa Hrudayamlo Nidurinche Cheli', slug: 'naa-hrudayamlo-nidurinche-cheli-1999', genres: ['Romance', 'Drama'], year: 1999 },
  { id: 417, title: 'Ammo Polisollu', slug: 'ammo-polisollu-1999', genres: ['Comedy', 'Drama'], year: 1999 },
  { id: 418, title: 'Asala Sandadi', slug: 'asala-sandadi-1999', genres: ['Comedy'], year: 1999 },
  { id: 419, title: 'Anaganaga Oka Ammai', slug: 'anaganaga-oka-ammai-1999', genres: ['Romance', 'Drama'], year: 1999 },
  { id: 420, title: 'Velugu Needalu', slug: 'velugu-needalu-1999', genres: ['Drama'], year: 1999 },
  { id: 421, title: 'Veedu Samanyudu Kadhu', slug: 'veedu-samanyudu-kadhu-1999', genres: ['Action', 'Drama'], year: 1999 },
  { id: 422, title: 'Harischandraa', slug: 'harischandraa-1999', genres: ['Comedy', 'Drama'], year: 1999 },
  { id: 423, title: 'Kaama', slug: 'kaama-1999', genres: ['Drama', 'Romance'], year: 1999 },
  { id: 424, title: 'Yamajathakudu', slug: 'yamajathakudu-1999', genres: ['Fantasy', 'Comedy'], year: 1999 },
  { id: 425, title: 'Ramasakkanodu', slug: 'ramasakkanodu-1999', genres: ['Drama'], year: 1999 },
  { id: 426, title: 'A. K. 47', slug: 'a-k-47-1999', genres: ['Action', 'Thriller'], year: 1999 },
  { id: 427, title: 'Sambayya', slug: 'sambayya-1999', genres: ['Drama'], year: 1999 },
  { id: 428, title: 'Aavide Syamala', slug: 'aavide-syamala-1999', genres: ['Comedy', 'Drama'], year: 1999 },
  { id: 429, title: 'Swapnalokam', slug: 'swapnalokam-1999', genres: ['Romance', 'Drama'], year: 1999 },
  { id: 430, title: 'Manavudu Danavudu', slug: 'manavudu-danavudu-1999', genres: ['Action'], year: 1999 },
  { id: 431, title: 'Preyasi Rave', slug: 'preyasi-rave-1999', genres: ['Romance', 'Drama'], year: 1999 },
  { id: 432, title: 'Raja Kumarudu', slug: 'raja-kumarudu-1999', genres: ['Romance', 'Action'], year: 1999 },
  { id: 433, title: 'Mechanic Mavayya', slug: 'mechanic-mavayya-1999', genres: ['Drama', 'Action'], year: 1999 },
  { id: 434, title: 'Gurupoornima', slug: 'gurupoornima-1999', genres: ['Drama'], year: 1999 },
  { id: 435, title: 'Vichitram', slug: 'vichitram-1999', genres: ['Comedy'], year: 1999 },
  { id: 436, title: 'Maanavudu Daanavudu', slug: 'maanavudu-daanavudu-1999', genres: ['Action'], year: 1999, notes: 'Variation of 430' },
  { id: 437, title: 'Priyuralu', slug: 'priyuralu-1998', genres: ['Romance', 'Drama'], year: 1998 },
  { id: 438, title: 'Sivayya', slug: 'sivayya-1998', genres: ['Action', 'Drama'], year: 1998 },
  { id: 439, title: 'Hello...yama!', slug: 'hello-yama-1998', genres: ['Fantasy', 'Comedy'], year: 1998 },
  { id: 440, title: 'Deergha Sumangali Bhava', slug: 'deergha-sumangali-bhava-1998', genres: ['Drama'], year: 1998 },
  { id: 441, title: 'Ulta Palta', slug: 'ulta-palta-1998', genres: ['Comedy'], year: 1998 },
  { id: 442, title: 'Daddy Daddy', slug: 'daddy-daddy-1998', genres: ['Comedy', 'Drama'], year: 1998 },
  { id: 443, title: 'Ayanagaru', slug: 'ayanagaru-1998', genres: ['Drama', 'Comedy'], year: 1998 },
  { id: 444, title: 'Eshwar Alla', slug: 'eshwar-alla-1998', genres: ['Drama'], year: 1998 },
  { id: 445, title: 'Gillikajjalu', slug: 'gillikajjalu-1998', genres: ['Comedy', 'Romance'], year: 1998 },
  { id: 446, title: 'Nenu Premisthunnanu', slug: 'nenu-premisthunnanu-1998', genres: ['Romance', 'Drama'], year: 1998 },
  { id: 447, title: 'Subhavartha', slug: 'subhavartha-1998', genres: ['Drama', 'Romance'], year: 1998 },
  { id: 448, title: 'Andaru Herole', slug: 'andaru-herole-1998', genres: ['Comedy'], year: 1998 },
  { id: 449, title: 'Prathista', slug: 'prathista-1998', genres: ['Action', 'Drama'], year: 1998 },
  { id: 450, title: 'Kante Koothurne Kanu', slug: 'kante-koothurne-kanu-1998', genres: ['Drama'], year: 1998 },
  { id: 451, title: 'Khaidi Garu', slug: 'khaidi-garu-1998', genres: ['Action', 'Drama'], year: 1998 },
  { id: 452, title: 'O Panaipothundi Babu', slug: 'o-panaipothundi-babu-1998', genres: ['Comedy'], year: 1998 },
  { id: 453, title: 'Subhalekhalu', slug: 'subhalekhalu-1998', genres: ['Drama', 'Romance'], year: 1998 },
  { id: 454, title: 'Pape Naa Pranam', slug: 'pape-naa-pranam-1998', genres: ['Thriller', 'Drama'], year: 1998 },
  { id: 455, title: 'Suryudu', slug: 'suryudu-1998', genres: ['Drama'], year: 1998 },
  { id: 456, title: 'Maavidaakulu', slug: 'maavidaakulu-1998', genres: ['Drama', 'Family'], year: 1998 },
  { id: 457, title: 'Sambhavam', slug: 'sambhavam-1998', genres: ['Drama', 'Action'], year: 1998 },
  { id: 458, title: 'Vaibhavam', slug: 'vaibhavam-1998', genres: ['Drama'], year: 1998 },
  { id: 459, title: 'Amma Rajinama', slug: 'amma-rajinama-1998', genres: ['Drama'], year: 1998, notes: '1991 film, possible re-release' },
  { id: 460, title: 'Pelli Peetalu', slug: 'pelli-peetalu-1998', genres: ['Romance', 'Comedy', 'Drama'], year: 1998 },
  { id: 461, title: 'Srimathi Vellostha', slug: 'srimathi-vellostha-1998', genres: ['Comedy', 'Drama'], year: 1998 },
  { id: 462, title: 'Pelli Kanuka', slug: 'pelli-kanuka-1998', genres: ['Romance', 'Drama'], year: 1998 },
  { id: 463, title: 'Sri Sita Ramula Kalyanam Chootamu Raarandi', slug: 'sri-sita-ramula-kalyanam-chootamu-raarandi-1998', genres: ['Romance', 'Drama'], year: 1998 },
  { id: 464, title: 'Vareva Moguda', slug: 'vareva-moguda-1998', genres: ['Comedy'], year: 1998 },
  { id: 465, title: 'Navvulata', slug: 'navvulata-1998', genres: ['Comedy', 'Romance'], year: 1998 },
  { id: 466, title: 'Padutha Theeyaga', slug: 'padutha-theeyaga-1998', genres: ['Romance', 'Drama'], year: 1998 },
  { id: 467, title: 'Suprabhatam', slug: 'suprabhatam-1998', genres: ['Drama', 'Comedy'], year: 1998 },
  { id: 468, title: 'Rajahamsa', slug: 'rajahamsa-1998', genres: ['Drama'], year: 1998 },
  { id: 469, title: 'Prema Pallaki', slug: 'prema-pallaki-1998', genres: ['Romance', 'Drama'], year: 1998 },
  { id: 470, title: 'Doni Sagali', slug: 'doni-sagali-1998', genres: ['Drama'], year: 1998, notes: 'Kannada film' },
  { id: 471, title: 'Aayanagaru', slug: 'aayanagaru-1998', genres: ['Comedy', 'Drama'], year: 1998 },
  { id: 472, title: 'All Rounder', slug: 'all-rounder-1998', genres: ['Comedy', 'Action'], year: 1998 },
  { id: 473, title: 'Mee Aayana Jagratha', slug: 'mee-aayana-jagratha-1998', genres: ['Comedy'], year: 1998 },
  { id: 474, title: 'Jai Bajarangabhali', slug: 'jai-bajarangabhali-1997', genres: ['Fantasy', 'Action'], year: 1997 },
  { id: 475, title: 'Aaro Pranam', slug: 'aaro-pranam-1997', genres: ['Romance', 'Drama'], year: 1997 },
  { id: 476, title: 'Bobbili Dora', slug: 'bobbili-dora-1997', genres: ['Action', 'Drama'], year: 1997 },
  { id: 477, title: 'Korukunna Priyudu', slug: 'korukunna-priyudu-1997', genres: ['Romance', 'Drama'], year: 1997 },
  { id: 478, title: 'Gokulamlo Seeta', slug: 'gokulamlo-seeta-1997', genres: ['Drama', 'Romance'], year: 1997 },
  { id: 479, title: 'Egire Paavurama', slug: 'egire-paavurama-1997', genres: ['Romance', 'Comedy', 'Drama'], year: 1997 },
  { id: 480, title: 'Pattukondi Chuddam', slug: 'pattukondi-chuddam-1997', genres: ['Comedy', 'Crime'], year: 1997 },
  { id: 481, title: 'Abbayi Gari Pelli', slug: 'abbayi-gari-pelli-1997', genres: ['Romance', 'Drama'], year: 1997 },
  { id: 482, title: 'Kurralla Rajyam', slug: 'kurralla-rajyam-1997', genres: ['Drama', 'Action'], year: 1997 },
  { id: 483, title: 'Jai Bajarangbali', slug: 'jai-bajarangbali-1997', genres: ['Fantasy', 'Drama'], year: 1997 },
  { id: 484, title: 'Adhirindhi Guru', slug: 'adhirindhi-guru-1997', genres: ['Comedy'], year: 1997 },
  { id: 485, title: 'Maa Nannaki Pelli', slug: 'maa-nannaki-pelli-1997', genres: ['Drama', 'Comedy', 'Family'], year: 1997 },
  { id: 486, title: 'Egire Pavuramaa', slug: 'egire-pavuramaa-1997', genres: ['Romance', 'Comedy', 'Drama'], year: 1997, isDuplicate: true, notes: 'Duplicate of 479' },
  { id: 487, title: 'Gunda Gardi', slug: 'gunda-gardi-1997', genres: ['Action'], year: 1997 },
  { id: 488, title: 'Chilakkottudu', slug: 'chilakkottudu-1997', genres: ['Comedy'], year: 1997 },
  { id: 489, title: 'Rakshakudu', slug: 'rakshakudu-1997', genres: ['Action', 'Romance'], year: 1997 },
  { id: 490, title: 'Priyaragalu', slug: 'priyaragalu-1997', genres: ['Romance', 'Drama'], year: 1997 },
  { id: 491, title: 'Bala Ramayanam', slug: 'bala-ramayanam-1997', genres: ['Mythological', 'Children'], year: 1997 },
  { id: 492, title: 'Maa Nannaku Pelli', slug: 'maa-nannaku-pelli-1997', genres: ['Drama', 'Comedy', 'Family'], year: 1997, isDuplicate: true, notes: 'Duplicate of 485' },
  { id: 493, title: 'Rukmini', slug: 'rukmini-1997', genres: ['Drama', 'Romance'], year: 1997 },
  { id: 494, title: 'Mama Bagunnava', slug: 'mama-bagunnava-1997', genres: ['Comedy', 'Drama'], year: 1997 },
  { id: 495, title: 'Pittala Dora', slug: 'pittala-dora-1996', genres: ['Comedy'], year: 1996 },
  { id: 496, title: 'Akka! Bagunnava?', slug: 'akka-bagunnava-1996', genres: ['Drama'], year: 1996 },
  { id: 497, title: 'Adirindi Alludu', slug: 'adirindi-alludu-1996', genres: ['Comedy', 'Action'], year: 1996 },
  { id: 498, title: 'Gulabi', slug: 'gulabi-1996', genres: ['Romance', 'Thriller'], year: 1996 },
  { id: 499, title: 'Maa Aavida Collector', slug: 'maa-aavida-collector-1996', genres: ['Drama', 'Comedy'], year: 1996 },
  { id: 500, title: 'Jabilamma Pelli', slug: 'jabilamma-pelli-1996', genres: ['Romance', 'Drama'], year: 1996 },
  { id: 501, title: 'Amma Ammani Choodalanivundi', slug: 'amma-ammani-choodalanivundi-1996', genres: ['Drama', 'Family'], year: 1996 },
  { id: 502, title: 'Ooha', slug: 'ooha-1996', genres: ['Romance', 'Drama'], year: 1996 },
  { id: 503, title: 'Topi Raja Sweety Roja', slug: 'topi-raja-sweety-roja-1996', genres: ['Comedy', 'Romance'], year: 1996 },
  { id: 504, title: 'Amma Durgamma', slug: 'amma-durgamma-1996', genres: ['Devotional', 'Fantasy'], year: 1996 },
  { id: 505, title: 'Akkum Bakkum', slug: 'akkum-bakkum-1996', genres: ['Comedy'], year: 1996 },
  { id: 506, title: 'Manasulo Maata', slug: 'manasulo-maata-1996', genres: ['Romance', 'Drama'], year: 1996 },
  { id: 507, title: 'Shri Krishnarjuna Vijayam', slug: 'shri-krishnarjuna-vijayam-1996', genres: ['Mythological', 'Drama'], year: 1996 },
  { id: 508, title: 'Rayudugaru Nayudugaru', slug: 'rayudugaru-nayudugaru-1996', genres: ['Drama'], year: 1996 },
  { id: 509, title: 'Srikaram', slug: 'srikaram-1996', genres: ['Drama', 'Family'], year: 1996 },
  { id: 510, title: 'Puttinti Gowravam', slug: 'puttinti-gowravam-1996', genres: ['Drama', 'Family'], year: 1996 },
  { id: 511, title: 'Sampradayam', slug: 'sampradayam-1996', genres: ['Drama', 'Family'], year: 1996 },
  { id: 512, title: 'Gunshot', slug: 'gunshot-1996', genres: ['Action', 'Crime', 'Thriller'], year: 1996 },
  { id: 513, title: 'Ayanaku Iddaru', slug: 'ayanaku-iddaru-1995', genres: ['Comedy', 'Drama'], year: 1995 },
  { id: 514, title: 'Subhamastu', slug: 'subhamastu-1995', genres: ['Drama', 'Family'], year: 1995 },
  { id: 515, title: 'Mounam', slug: 'mounam-1995', genres: ['Drama', 'Crime'], year: 1995 },
  { id: 516, title: 'Vaddu Bava Thappu', slug: 'vaddu-bava-thappu-1995', genres: ['Comedy', 'Romance'], year: 1995 },
  { id: 517, title: 'Real Hero', slug: 'real-hero-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 518, title: 'Maato Pettukoku', slug: 'maato-pettukoku-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 519, title: 'Raja Muthirai', slug: 'raja-muthirai-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 520, title: 'Ketu Duplicatu', slug: 'ketu-duplicatu-1995', genres: ['Comedy', 'Thriller'], year: 1995 },
  { id: 521, title: 'Rambantu', slug: 'rambantu-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 522, title: 'Adavi Dora', slug: 'adavi-dora-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 523, title: 'Sankalpam', slug: 'sankalpam-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 524, title: 'Orey Rikshaw', slug: 'orey-rikshaw-1995', genres: ['Drama', 'Action'], year: 1995 },
  { id: 525, title: 'Super Mogudu', slug: 'super-mogudu-1995', genres: ['Action', 'Comedy'], year: 1995 },
  { id: 526, title: 'Bharata Simham', slug: 'bharata-simham-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 527, title: 'Dear Brother', slug: 'dear-brother-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 528, title: 'Ketu Duplicate', slug: 'ketu-duplicate-1995', genres: ['Comedy', 'Thriller'], year: 1995, isDuplicate: true, notes: 'Duplicate of 520' },
  { id: 529, title: 'Chilakapachcha Kaapuram', slug: 'chilakapachcha-kaapuram-1995', genres: ['Drama', 'Romance', 'Family'], year: 1995 },
  { id: 530, title: 'Bhale Bullodu', slug: 'bhale-bullodu-1995', genres: ['Comedy', 'Action'], year: 1995 },
  { id: 531, title: 'Raja Simham', slug: 'raja-simham-1995', genres: ['Action', 'Drama'], year: 1995 },
  { id: 532, title: 'Raitu Bharatam', slug: 'raitu-bharatam-1994', genres: ['Drama', 'Action'], year: 1994 },
  { id: 533, title: 'Jailor Gaari Abbayi', slug: 'jailor-gaari-abbayi-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 534, title: 'Maga Rayudu', slug: 'maga-rayudu-1994', genres: ['Comedy', 'Drama'], year: 1994 },
  { id: 535, title: 'Maa Voori Maaraju', slug: 'maa-voori-maaraju-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 536, title: 'Police Alludu', slug: 'police-alludu-1994', genres: ['Action', 'Comedy'], year: 1994 },
  { id: 537, title: 'Angarakshakudu', slug: 'angarakshakudu-1994', genres: ['Action', 'Crime'], year: 1994 },
  { id: 538, title: 'Gharana Alludu', slug: 'gharana-alludu-1994', genres: ['Drama', 'Comedy'], year: 1994 },
  { id: 539, title: 'Pelli Koduku', slug: 'pelli-koduku-1994', genres: ['Comedy', 'Drama'], year: 1994 },
  { id: 540, title: 'Number One', slug: 'number-one-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 541, title: 'Indhu', slug: 'indhu-1994', genres: ['Romance', 'Drama'], year: 1994 },
  { id: 542, title: 'Athiradi Padai', slug: 'athiradi-padai-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 543, title: 'Shubha Lagnam', slug: 'shubha-lagnam-1994', genres: ['Drama', 'Romance'], year: 1994 },
  { id: 544, title: 'Bramhachari Mogudu', slug: 'bramhachari-mogudu-1994', genres: ['Comedy', 'Romance'], year: 1994 },
  { id: 545, title: 'Teerpu', slug: 'teerpu-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 546, title: 'Aavesam', slug: 'aavesam-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 547, title: 'Yes Nenante Nene', slug: 'yes-nenante-nene-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 548, title: 'Doragariki Donga Pellam', slug: 'doragariki-donga-pellam-1994', genres: ['Comedy'], year: 1994 },
  { id: 549, title: 'Allarodu', slug: 'allarodu-1994', genres: ['Comedy', 'Action'], year: 1994 },
  { id: 550, title: 'Captain', slug: 'captain-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 551, title: 'Allari Premikudu', slug: 'allari-premikudu-1994', genres: ['Romance', 'Comedy'], year: 1994 },
  { id: 552, title: 'Ammayi Kapuram', slug: 'ammayi-kapuram-1994', genres: ['Drama'], year: 1994 },
  { id: 553, title: 'Bangaru Kutumbam', slug: 'bangaru-kutumbam-1994', genres: ['Drama', 'Family'], year: 1994 },
  { id: 554, title: 'Palnati Pourusham', slug: 'palnati-pourusham-1994', genres: ['Action', 'Drama'], year: 1994 },
  { id: 555, title: 'Paruvu Pratishta', slug: 'paruvu-pratishta-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 556, title: 'Amma Koduku', slug: 'amma-koduku-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 557, title: 'Prema Pusthakam', slug: 'prema-pusthakam-1993', genres: ['Romance', 'Drama'], year: 1993 },
  { id: 558, title: 'Kunti Putrudu', slug: 'kunti-putrudu-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 559, title: 'Rendilla Poojari', slug: 'rendilla-poojari-1993', genres: ['Comedy', 'Drama'], year: 1993 },
  { id: 560, title: 'Kondapalli Raja', slug: 'kondapalli-raja-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 561, title: 'Chittemma Mogudu', slug: 'chittemma-mogudu-1993', genres: ['Drama', 'Comedy'], year: 1993 },
  { id: 562, title: 'Akka Pethanam', slug: 'akka-pethanam-1993', genres: ['Drama', 'Family'], year: 1993 },
  { id: 563, title: 'Rowdy Annayya', slug: 'rowdy-annayya-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 564, title: 'Detective Narada', slug: 'detective-narada-1993', genres: ['Comedy', 'Mystery'], year: 1993 },
  { id: 565, title: 'Kundan', slug: 'kundan-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 566, title: 'Srinatha Kavi Sarvabhowmudu', slug: 'srinatha-kavi-sarvabhowmudu-1993', genres: ['Biographical', 'Period Drama'], year: 1993 },
  { id: 567, title: 'Parugo Parugu', slug: 'parugo-parugu-1993', genres: ['Comedy'], year: 1993 },
  { id: 568, title: 'Aasayam', slug: 'aasayam-1993', genres: ['Drama'], year: 1993 },
  { id: 569, title: 'Chirunavvula Varamistava', slug: 'chirunavvula-varamistava-1993', genres: ['Romance', 'Drama'], year: 1993 },
  { id: 570, title: 'Pillalu Diddina Kapuram', slug: 'pillalu-diddina-kapuram-1993', genres: ['Drama', 'Family'], year: 1993 },
  { id: 571, title: 'Kirayi Gunda', slug: 'kirayi-gunda-1993', genres: ['Action'], year: 1993 },
  { id: 572, title: 'Major Chandrakanth', slug: 'major-chandrakanth-1993', genres: ['Action', 'Drama'], year: 1993 },
  { id: 573, title: 'Kongu Chatu Krishnudu', slug: 'kongu-chatu-krishnudu-1993', genres: ['Comedy', 'Drama'], year: 1993 },
  { id: 574, title: 'Prema Vijeta', slug: 'prema-vijeta-1992', genres: ['Action', 'Drama'], year: 1992 },
  { id: 575, title: 'Madhavayya Gari Manavadu', slug: 'madhavayya-gari-manavadu-1992', genres: ['Drama', 'Family'], year: 1992 },
  { id: 576, title: 'Aswamedham', slug: 'aswamedham-1992', genres: ['Action', 'Crime'], year: 1992 },
  { id: 577, title: 'Atta Sommu Alludu Danam', slug: 'atta-sommu-alludu-danam-1992', genres: ['Action', 'Comedy'], year: 1992 },
  { id: 578, title: 'Appula Appa Rao', slug: 'appula-appa-rao-1992', genres: ['Comedy'], year: 1992 },
  { id: 579, title: 'Pranadaata', slug: 'pranadaata-1992', genres: ['Drama', 'Action'], year: 1992 },
  { id: 580, title: 'Pellante Noorella Panta', slug: 'pellante-noorella-panta-1992', genres: ['Drama', 'Family'], year: 1992 },
  { id: 581, title: 'Moratodu Naa Mogudu', slug: 'moratodu-naa-mogudu-1992', genres: ['Drama', 'Action'], year: 1992 },
  { id: 582, title: 'Pellam Chatu Mogudu', slug: 'pellam-chatu-mogudu-1992', genres: ['Comedy', 'Romance'], year: 1992 },
  { id: 583, title: 'Sahasam', slug: 'sahasam-1992', genres: ['Action', 'Thriller'], year: 1992 },
  { id: 584, title: 'Prema Shikharam', slug: 'prema-shikharam-1992', genres: ['Romance', 'Drama'], year: 1992 },
  { id: 585, title: 'Jaganaddam and Sons', slug: 'jaganaddam-and-sons-1992', genres: ['Comedy', 'Drama'], year: 1992 },
  { id: 586, title: 'Dabbu Bhale Jabbu', slug: 'dabbu-bhale-jabbu-1992', genres: ['Comedy'], year: 1992 },
  { id: 587, title: 'Adharsham', slug: 'adharsham-1992', genres: ['Drama'], year: 1992 },
  { id: 588, title: 'Chillara Mogudu Allari Koduku', slug: 'chillara-mogudu-allari-koduku-1992', genres: ['Comedy'], year: 1992 },
  { id: 589, title: 'Doshi', slug: 'doshi-1992', genres: ['Action', 'Crime'], year: 1992 },
  { id: 590, title: 'Agreement', slug: 'agreement-1992', genres: ['Comedy', 'Romance'], year: 1992 },
  { id: 591, title: 'Donga Police', slug: 'donga-police-1992', genres: ['Action', 'Comedy'], year: 1992 },
  { id: 592, title: 'Allari Pilla', slug: 'allari-pilla-1992', genres: ['Romance', 'Comedy'], year: 1992 },
  { id: 593, title: 'Bangaru Mama', slug: 'bangaru-mama-1992', genres: ['Drama', 'Comedy'], year: 1992 },
  { id: 594, title: 'Aaj Ka Goonda Raj', slug: 'aaj-ka-goonda-raj-1992', genres: ['Action', 'Crime'], year: 1992 },
  { id: 595, title: 'College Bullodu', slug: 'college-bullodu-1992', genres: ['Drama', 'Romance'], year: 1992 },
  { id: 596, title: 'Raktha Tarpanam', slug: 'raktha-tarpanam-1992', genres: ['Action'], year: 1992, notes: 'Dir: Krishna' },
  { id: 597, title: 'Kala Rathrilo Kanne Pilla', slug: 'kala-rathrilo-kanne-pilla-1992', genres: ['Thriller', 'Mystery'], year: 1992 },
  { id: 598, title: 'Ayyayyo Brahamayya', slug: 'ayyayyo-brahamayya-1992', genres: ['Comedy', 'Drama'], year: 1992 },
  { id: 599, title: 'Rakta Tarpanam', slug: 'rakta-tarpanam-1992', genres: ['Action'], year: 1992, notes: 'Dir: Kodandarami Reddy - check if duplicate of 596' },
  { id: 600, title: 'Subba Rayudi Pelli', slug: 'subba-rayudi-pelli-1992', genres: ['Comedy', 'Drama'], year: 1992 },
];

async function applyCorrections() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║         APPLY GENRE BATCH 2 CORRECTIONS (200 movies)                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;
  const errors: string[] = [];
  const duplicates: string[] = [];

  for (const correction of corrections) {
    try {
      // Skip known duplicates
      if (correction.isDuplicate) {
        console.log(chalk.yellow(`\n${correction.id.toString().padStart(3)}. ${correction.title} (${correction.year})`));
        console.log(chalk.yellow(`     ⊘ Skipped - ${correction.notes}`));
        duplicates.push(`${correction.id}. ${correction.title} - ${correction.notes}`);
        skipCount++;
        continue;
      }

      console.log(chalk.white(`\n${correction.id.toString().padStart(3)}. ${correction.title} (${correction.year})`));
      
      // Find the movie by slug
      const { data: movie, error: fetchError } = await supabase
        .from('movies')
        .select('id, title_en, genres')
        .eq('slug', correction.slug)
        .single();

      if (fetchError || !movie) {
        console.log(chalk.red(`     ✗ Not found by slug: ${correction.slug}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.title}: Not found`);
        continue;
      }

      // Check if genres need updating
      const currentGenres = JSON.stringify(movie.genres || []);
      const newGenres = JSON.stringify(correction.genres);

      if (currentGenres === newGenres) {
        console.log(chalk.yellow(`     ⊘ No changes needed`));
        successCount++;
        continue;
      }

      // Update the movie genres
      const { error: updateError } = await supabase
        .from('movies')
        .update({
          genres: correction.genres,
        })
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`     ✗ Update failed: ${updateError.message}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.title}: ${updateError.message}`);
        continue;
      }

      console.log(chalk.green(`     ✓ Updated successfully`));
      console.log(chalk.gray(`       - Genres: ${currentGenres} → ${newGenres}`));
      if (correction.notes) {
        console.log(chalk.gray(`       - Note: ${correction.notes}`));
      }
      successCount++;

    } catch (error) {
      console.log(chalk.red(`     ✗ Error: ${error}`));
      failCount++;
      errors.push(`${correction.id}. ${correction.title}: ${error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 30));
  }

  // Summary
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║                           SUMMARY                                     ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.white(`  Total movies:              ${chalk.cyan(corrections.length)}`));
  console.log(chalk.green(`  ✓ Successfully updated:    ${chalk.cyan(successCount)}`));
  console.log(chalk.yellow(`  ⊘ Skipped (duplicates):    ${chalk.cyan(skipCount)}`));
  console.log(chalk.red(`  ✗ Failed:                  ${chalk.cyan(failCount)}`));

  if (duplicates.length > 0) {
    console.log(chalk.yellow(`\n  Duplicates identified:\n`));
    duplicates.forEach(dup => console.log(chalk.yellow(`    ${dup}`)));
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n  Errors:\n`));
    errors.forEach(err => console.log(chalk.red(`    ${err}`)));
  }

  console.log(chalk.green(`\n  ✅ Batch 2 corrections applied!\n`));
}

applyCorrections();
