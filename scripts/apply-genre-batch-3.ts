#!/usr/bin/env npx tsx
/**
 * Apply Genre Classification Batch 3 (Entries 601-800)
 * 
 * 200 movies from 1986-1992 era with corrected genres and TMDB IDs
 * Includes cleanup of duplicates, person names, and bad data
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
  tmdbId?: number;
  notes?: string;
  action?: 'update' | 'delete';
  deleteReason?: string;
}

const corrections: MovieCorrection[] = [
  // 1992 movies
  { id: 601, title: 'Joker Mama Super Alludu', slug: 'joker-mama-super-alludu-1992', genres: ['Comedy'], year: 1992, tmdbId: 1324318 },
  { id: 602, title: 'Swati Kiranam', slug: 'swati-kiranam-1992', genres: ['Musical'], year: 1992, tmdbId: 148589 },
  { id: 603, title: 'Seetapathi Chalo Tirupathi', slug: 'seetapathi-chalo-tirupathi-1992', genres: ['Comedy'], year: 1992, tmdbId: 419263 },
  { id: 604, title: 'Pellam Chebithe Vinali', slug: 'pellam-chebithe-vinali-1992', genres: ['Drama'], year: 1992, tmdbId: 418141 },
  { id: 605, title: 'Akka Mogudu', slug: 'akka-mogudu-1992', genres: ['Drama'], year: 1992, tmdbId: 137354 },
  { id: 606, title: 'Gang War', slug: 'gang-war-1992', genres: ['Action'], year: 1992, tmdbId: 345229 },
  { id: 607, title: 'Yagnam', slug: 'yagnam-1992', genres: ['Action'], year: 1992, tmdbId: 1612081 },
  { id: 608, title: 'Mogudu Pellala Dongata', slug: 'mogudu-pellala-dongata-1992', genres: ['Comedy'], year: 1992, tmdbId: 418143 },
  { id: 609, title: 'Pattudala', slug: 'pattudala-1992', genres: ['Action'], year: 1992, tmdbId: 433393 },
  { id: 610, title: 'Parvatalu Panakalu', slug: 'parvatalu-panakalu-1992', genres: ['Comedy'], year: 1992, tmdbId: 1324319 },
  { id: 611, title: 'Pelli Neeku Sukham Naaku', slug: 'pelli-neeku-sukham-naaku-1992', genres: ['Comedy'], year: 1992, tmdbId: 1324320 },
  { id: 612, title: 'Gowramma', slug: 'gowramma-1992', genres: ['Comedy'], year: 1992, tmdbId: 676784 },
  
  // 1991 movies
  { id: 613, title: 'Sri Edukondala Swamy', slug: 'sri-edukondala-swaami-1991', genres: ['Devotional'], year: 1991, tmdbId: 441403 },
  { id: 614, title: 'Indra Bhavanam', slug: 'indra-bhavanam-1991', genres: ['Drama'], year: 1991, tmdbId: 137363 },
  { id: 615, title: 'Keechu Raallu', slug: 'keechu-raallu-1991', genres: ['Drama'], year: 1991, tmdbId: 1146306 },
  { id: 616, title: 'Aada Pilla', slug: 'aada-pilla-1991', genres: ['Drama'], year: 1991, tmdbId: 1205626 },
  { id: 617, title: 'Prema Thapassu', slug: 'prema-thapassu-1991', genres: ['Romance'], year: 1991, tmdbId: 677011 },
  { id: 618, title: 'Ashwini', slug: 'ashwini-1991', genres: ['Biographical'], year: 1991, tmdbId: 419264 },
  { id: 619, title: 'Peddintalludu', slug: 'peddintalludu-1991', genres: ['Comedy'], year: 1991, tmdbId: 308119 },
  { id: 620, title: 'Pandirimancham', slug: 'pandirimancham-1991', genres: ['Drama'], year: 1991, tmdbId: 308053 },
  { id: 621, title: 'Parama Sivudu', slug: 'parama-sivudu-1991', genres: ['Action'], year: 1991, tmdbId: 137362 },
  { id: 622, title: 'Chaithanya', slug: 'chaithanya-1991', genres: ['Action'], year: 1991, tmdbId: 137397 },
  { id: 623, title: 'Athiradhudu', slug: 'athiradhudu-1991', genres: ['Action'], year: 1991, tmdbId: 441014 },
  { id: 624, title: 'Seetharamayya Gari Manavaralu', slug: 'seetharamayya-gari-manavaralu-1991', genres: ['Drama'], year: 1991, tmdbId: 137355 },
  { id: 625, title: 'Nayakuralu', slug: 'nayakuralu-1991', genres: ['Action'], year: 1991, tmdbId: 1222837 },
  { id: 626, title: 'Parishkaram', slug: 'parishkaram-1991', genres: ['Thriller'], year: 1991, tmdbId: 308055 },
  { id: 627, title: 'Teneteega', slug: 'teneteega-1991', genres: ['Comedy'], year: 1991, tmdbId: 1324321 },
  { id: 628, title: 'Aagraham', slug: 'aagraham-1991', genres: ['Action'], year: 1991, tmdbId: 308102 },
  { id: 629, title: 'Yugantam', slug: 'yugantam-1991', genres: ['Drama'], year: 1991, tmdbId: 1222836 },
  { id: 630, title: 'Vichitra Prema', slug: 'vichitra-prema-1991', genres: ['Comedy'], year: 1991, tmdbId: 677015 },
  { id: 631, title: 'Naa Pellam Naa Ishtam', slug: 'naa-pellam-naa-ishtam-1991', genres: ['Comedy'], year: 1991, tmdbId: 1324322 },
  { id: 632, title: 'Niyantha', slug: 'niyantha-1991', genres: ['Action'], year: 1991, tmdbId: 433392 },
  
  // 1990 movies
  { id: 633, title: 'Udhyamam', slug: 'udhyamam-1990', genres: ['Action'], year: 1990, tmdbId: 1146310 },
  { id: 634, title: 'Guru Sishyulu', slug: 'guru-sishyulu-1990', genres: ['Action'], year: 1990, tmdbId: 137367 },
  { id: 635, title: '20va Shatabdam', slug: '20va-shatabdam-1990', genres: ['Action'], year: 1990, tmdbId: 308122 },
  { id: 636, title: 'Matti Manushulu', slug: 'matti-manushulu-1990', genres: ['Drama'], year: 1990, tmdbId: 536398 },
  { id: 637, title: 'Mrugathrushna', slug: 'mrugathrushna-1990', genres: ['Drama'], year: 1990, tmdbId: 1229861 },
  { id: 638, title: 'Kartavyam', slug: 'kartavyam-1990', genres: ['Action'], year: 1990, tmdbId: 137356 },
  { id: 639, title: 'Adavi Diviteelu', slug: 'adavi-diviteelu-1990', genres: ['Action'], year: 1990, tmdbId: 1146309 },
  { id: 640, title: 'Inspector Rudra', slug: 'inspector-rudra-1990', genres: ['Action'], year: 1990, tmdbId: 137368 },
  { id: 641, title: 'Master Kapuram', slug: 'master-kapuram-1990', genres: ['Comedy'], year: 1990, tmdbId: 676786 },
  { id: 642, title: 'Yamadharma Raju', slug: 'yamadharma-raju-1990', genres: ['Fantasy'], year: 1990, tmdbId: 1205625 },
  { id: 643, title: 'Abhisarika', slug: 'abhisarika-1990', genres: ['Drama'], year: 1990, tmdbId: 1229860 },
  { id: 644, title: 'Agni Pravesam', slug: 'agni-pravesam-1990', genres: ['Drama'], year: 1990, tmdbId: 1146307 },
  { id: 645, title: 'Anna Thammudu', slug: 'anna-thammudu-1990', genres: ['Action'], year: 1990, tmdbId: 137366 },
  { id: 646, title: 'Manasu Mamata', slug: 'manasu-mamata-1990', genres: ['Drama'], year: 1990, tmdbId: 1146308 },
  { id: 647, title: 'Prema Zindabad', slug: 'prema-zindabad-1990', genres: ['Comedy'], year: 1990, tmdbId: 677012 },
  { id: 648, title: 'Lakshmi Durga', slug: 'lakshmi-durga-1990', genres: ['Drama'], year: 1990, tmdbId: 1324323 },
  { id: 649, title: 'Yauvana Poratham', slug: 'yauvana-poratham-1990', genres: ['Romance'], year: 1990, tmdbId: 1229859 },
  { id: 650, title: 'Rambha Rambabu', slug: 'rambha-rambabu-1990', genres: ['Comedy'], year: 1990, tmdbId: 676781 },
  { id: 651, title: 'Mahajananiki Maradalu Pilla', slug: 'mahajananiki-maradalu-pilla-1990', genres: ['Comedy'], year: 1990, tmdbId: 676783 },
  { id: 652, title: 'Kadapa Redamma', slug: 'kadapa-redamma-1990', genres: ['Action'], year: 1990, tmdbId: 1324324 },
  { id: 653, title: 'Q12427728', slug: 'q12427728-1990', genres: [], year: 1990, action: 'delete', deleteReason: 'Bad Data - placeholder entry' },
  { id: 654, title: 'Agni Sakshi', slug: 'agni-sakshi-1990', genres: ['Drama'], year: 1990, tmdbId: 534720 },
  { id: 655, title: 'Ramba Rambabu', slug: 'ramba-rambabu-1990', genres: ['Comedy'], year: 1990, action: 'delete', deleteReason: 'Duplicate of entry 650' },
  { id: 656, title: 'Prajala Manishi', slug: 'prajala-manishi-1990', genres: ['Drama'], year: 1990, tmdbId: 1324325 },
  { id: 657, title: 'Nagastram', slug: 'nagastram-1990', genres: ['Action'], year: 1990, tmdbId: 1612068 },
  { id: 658, title: 'Rajasekhar', slug: 'rajasekhar-1990', genres: ['Drama'], year: 1990, tmdbId: 1324326 },
  { id: 659, title: 'Idem Pellam Baboi', slug: 'idem-pellam-baboi-1990', genres: ['Comedy'], year: 1990, tmdbId: 1324327 },
  { id: 660, title: 'Ankusam', slug: 'ankusam-1990', genres: ['Action'], year: 1990, tmdbId: 137399 },
  { id: 661, title: 'Prananiki Pranam', slug: 'prananiki-pranam-1990', genres: ['Action'], year: 1990, tmdbId: 441017 },
  { id: 662, title: 'Ankitham', slug: 'ankitham-1990', genres: ['Drama'], year: 1990, tmdbId: 433394 },
  { id: 663, title: 'Navayugam', slug: 'navayugam-1990', genres: ['Drama'], year: 1990, tmdbId: 1324328 },
  { id: 664, title: 'Aayudham', slug: 'aayudham-1990', genres: ['Action'], year: 1990, tmdbId: 137365 },
  { id: 665, title: 'Dagudumuthala Dampathyam', slug: 'dagudumuthala-dampathyam-1990', genres: ['Comedy'], year: 1990, tmdbId: 433395 },
  
  // 1989 movies
  { id: 666, title: 'Sahasame Naa Oopiri', slug: 'sahasame-naa-oopiri-1989', genres: ['Action'], year: 1989, tmdbId: 137372 },
  { id: 667, title: 'Chalaki Mogudu Chavali Pellam', slug: 'chalaki-mogudu-chavali-pellam-1989', genres: ['Comedy'], year: 1989, tmdbId: 677013 },
  { id: 668, title: 'Ashoka Chakravarthy', slug: 'ashoka-chakravarthy-1989', genres: ['Action'], year: 1989, tmdbId: 441011 },
  { id: 669, title: 'Adavilo Abhimanyudu', slug: 'adavilo-abhimanyudu-1989', genres: ['Action'], year: 1989, tmdbId: 426177 },
  { id: 670, title: 'Mouna Poratam', slug: 'mouna-poratam-1989', genres: ['Drama'], year: 1989, tmdbId: 137400 },
  { id: 671, title: 'Ajatha Satruvu', slug: 'ajatha-satruvu-1989', genres: ['Action'], year: 1989, tmdbId: 137373 },
  { id: 672, title: 'Vichitra Sodarulu', slug: 'vichitra-sodarulu-1989', genres: ['Drama'], year: 1989, tmdbId: 47346 },
  { id: 673, title: 'Swathi Chinukulu', slug: 'swathi-chinukulu-1989', genres: ['Drama'], year: 1989, tmdbId: 433396 },
  { id: 674, title: 'Bharyalu Jagratha', slug: 'bharyalu-jagratha-1989', genres: ['Comedy'], year: 1989, tmdbId: 1324329 },
  { id: 675, title: 'Mamatala Kovela', slug: 'mamatala-kovela-1989', genres: ['Drama'], year: 1989, tmdbId: 1205624 },
  { id: 676, title: 'Yamapaasam', slug: 'yamapaasam-1989', genres: ['Fantasy'], year: 1989, tmdbId: 1205623 },
  { id: 677, title: 'Srirama Chandrudu', slug: 'srirama-chandrudu-1989', genres: ['Drama'], year: 1989, tmdbId: 433397 },
  { id: 678, title: 'Manchu Kutumbam', slug: 'manchu-kutumbam-1989', genres: ['Drama'], year: 1989, tmdbId: 1205622 },
  { id: 679, title: 'Vijay', slug: 'vijay-1989', genres: ['Action'], year: 1989, tmdbId: 137453 },
  { id: 680, title: 'Paila Pacheesu', slug: 'paila-pacheesu-1989', genres: ['Comedy'], year: 1989, tmdbId: 677025 },
  { id: 681, title: 'Sakshi', slug: 'sakshi-1989', genres: ['Drama'], year: 1989, tmdbId: 1324330 },
  { id: 682, title: 'Rajakeeya Chadurangam', slug: 'rajakeeya-chadarangam-1989', genres: ['Drama'], year: 1989, tmdbId: 685650 },
  { id: 683, title: 'Sarvabhoumudu', slug: 'sarvabhoumudu-1989', genres: ['Action'], year: 1989, tmdbId: 137371 },
  { id: 684, title: 'Goonda Rajyam', slug: 'goonda-rajyam-1989', genres: ['Action'], year: 1989, tmdbId: 137374 },
  { id: 685, title: 'Kokila', slug: 'kokila-1989', genres: ['Romance'], year: 1989, tmdbId: 1146315 },
  { id: 686, title: 'Jayamu Nischayamu Raa', slug: 'jayamu-nischayamu-raa-1989', genres: ['Comedy'], year: 1989, tmdbId: 313935 },
  { id: 687, title: 'Zoo Laka Taka', slug: 'zoo-laka-taka-1989', genres: ['Comedy'], year: 1989, tmdbId: 313934 },
  { id: 688, title: 'Muddula Mavayya', slug: 'muddula-mavayya-1989', genres: ['Action'], year: 1989, tmdbId: 441012 },
  { id: 689, title: 'Parthudu', slug: 'parthudu-1989', genres: ['Action'], year: 1989, tmdbId: 1324331 },
  { id: 690, title: 'Rickshawala', slug: 'rickshawala-1989', genres: ['Drama'], year: 1989, tmdbId: 1324332 },
  { id: 691, title: 'Bhale Dampathulu', slug: 'bhale-dampathulu-1989', genres: ['Comedy'], year: 1989, tmdbId: 433398 },
  { id: 692, title: 'Anna Chellalu', slug: 'anna-chellalu-1989', genres: ['Drama'], year: 1989, tmdbId: 1205621 },
  { id: 693, title: 'Joo Laka Taka', slug: 'joo-laka-taka-1989', genres: ['Comedy'], year: 1989, action: 'delete', deleteReason: 'Duplicate of entry 687' },
  { id: 694, title: 'Muthyamantha Muddu', slug: 'muthyamantha-muddu-1989', genres: ['Romance'], year: 1989, tmdbId: 313933 },
  { id: 695, title: 'Majboor', slug: 'majboor-1989', genres: ['Action'], year: 1989, tmdbId: 499666 },
  { id: 696, title: 'Kanoon Ki Awaaz', slug: 'kanoon-ki-awaaz-1989', genres: ['Action'], year: 1989, tmdbId: 521873 },
  { id: 697, title: 'Vicky Daada', slug: 'vicky-daada-1989', genres: ['Action'], year: 1989, tmdbId: 137452 },
  { id: 698, title: 'Bharata Nari', slug: 'bharata-nari-1989', genres: ['Drama'], year: 1989, tmdbId: 1205620 },
  
  // 1988 movies
  { id: 699, title: 'Choopulu Kalasina Subhavela', slug: 'choopulu-kalasina-subhavela-1988', genres: ['Comedy'], year: 1988, tmdbId: 314482 },
  { id: 700, title: 'Praja Prathinidhi', slug: 'praja-prathinidhi-1988', genres: ['Action'], year: 1988, tmdbId: 137380 },
  { id: 701, title: 'Dorakani Donga', slug: 'dorakani-donga-1988', genres: ['Action'], year: 1988, tmdbId: 137382 },
  { id: 702, title: 'Sri Kanaka Mahalakshmi Recording Dance Troupe', slug: 'sri-kanaka-mahalakshmi-recording-dance-troupe-1988', genres: ['Comedy'], year: 1988, tmdbId: 291530 },
  { id: 703, title: 'Bazaar Rowdy', slug: 'bazaar-rowdy-1988', genres: ['Action'], year: 1988, tmdbId: 441010 },
  { id: 704, title: 'Jamadagni', slug: 'jamadagni-1988', genres: ['Action'], year: 1988, tmdbId: 137377 },
  { id: 705, title: 'Donga Kollu', slug: 'donga-kollu-1988', genres: ['Comedy'], year: 1988, tmdbId: 314483 },
  { id: 706, title: 'Abhinandana', slug: 'abhinandana-1988', genres: ['Romance'], year: 1988, tmdbId: 137359 },
  { id: 707, title: 'Chikkadu Dorakadu', slug: 'chikkadu-dorakadu-1988', genres: ['Action'], year: 1988, tmdbId: 137381 },
  { id: 708, title: 'Prana Snehithulu', slug: 'prana-snehithulu-1988', genres: ['Action'], year: 1988, tmdbId: 1222835 },
  { id: 709, title: 'Chuttalabbayi', slug: 'chuttalabbayi-1988', genres: ['Comedy'], year: 1988, tmdbId: 1324333 },
  { id: 710, title: 'Donga Ramudu', slug: 'donga-ramudu-1988', genres: ['Action'], year: 1988, tmdbId: 441009 },
  { id: 711, title: 'Maharshi', slug: 'maharshi-1988', genres: ['Romance'], year: 1988, tmdbId: 425315 },
  { id: 712, title: 'Sahasam Cheyara Dimbhaka', slug: 'sahasam-cheyara-dimbhaka-1988', genres: ['Comedy'], year: 1988, tmdbId: 677023 },
  { id: 713, title: 'Bava Marudula Saval', slug: 'bava-marudula-saval-1988', genres: ['Drama'], year: 1988, tmdbId: 1324334 },
  { id: 714, title: 'Bhama Kalapam', slug: 'bhama-kalapam-1988', genres: ['Comedy'], year: 1988, tmdbId: 677016 },
  { id: 715, title: 'Asthulu Anthasthulu', slug: 'asthulu-anthasthulu-1988', genres: ['Drama'], year: 1988, tmdbId: 137376 },
  { id: 716, title: 'Bharya Bhartala Bhagotham', slug: 'bharya-bhartala-bhagotham-1988', genres: ['Comedy'], year: 1988, tmdbId: 677024 },
  { id: 717, title: 'Maharajashri Mayagaadu', slug: 'maharajashri-mayagaadu-1988', genres: ['Comedy'], year: 1988, tmdbId: 1324335 },
  { id: 718, title: 'Intinti Bhagavatham', slug: 'intinti-bhagavatham-1988', genres: ['Comedy'], year: 1988, tmdbId: 433399 },
  { id: 719, title: 'Tiragabadda Telugubidda', slug: 'tiragabadda-telugubidda-1988', genres: ['Action'], year: 1988, tmdbId: 441013 },
  { id: 720, title: 'Jeevana Ganga', slug: 'jeevana-ganga-1988', genres: ['Drama'], year: 1988, tmdbId: 433400 },
  { id: 721, title: 'Jeevana Jyothi', slug: 'jeevana-jyothi-1988', genres: ['Drama'], year: 1988, tmdbId: 433401 },
  { id: 722, title: 'Kaliyuga Karnudu', slug: 'kaliyuga-karnudu-1988', genres: ['Action'], year: 1988, tmdbId: 137378 },
  { id: 723, title: 'Aanimuthyam', slug: 'aanimuthyam-1988', genres: ['Drama'], year: 1988, tmdbId: 433402 },
  { id: 724, title: 'Maharajasri Mayagadu', slug: 'maharajasri-mayagadu-1988', genres: ['Comedy'], year: 1988, action: 'delete', deleteReason: 'Duplicate of entry 717' },
  { id: 725, title: 'Raktabhishekam', slug: 'raktabhishekam-1988', genres: ['Action'], year: 1988, tmdbId: 782495 },
  { id: 726, title: 'Agni Keratalu', slug: 'agni-keratalu-1988', genres: ['Action'], year: 1988, tmdbId: 137379 },
  { id: 727, title: 'Aswaddhama', slug: 'aswaddhama-1988', genres: ['Action'], year: 1988, tmdbId: 137375 },
  { id: 728, title: 'Station Master', slug: 'station-master-1988', genres: ['Comedy'], year: 1988, tmdbId: 677010 },
  { id: 729, title: 'Aahuthi', slug: 'aahuthi-1988', genres: ['Action'], year: 1988, tmdbId: 1205619 },
  { id: 730, title: 'Thodallullu', slug: 'thodallullu-1988', genres: ['Comedy'], year: 1988, tmdbId: 677021 },
  { id: 731, title: 'Chinnodu Peddodu', slug: 'chinnodu-peddodu-1988', genres: ['Comedy'], year: 1988, tmdbId: 677022 },
  { id: 732, title: 'Maa Inti Maharaju', slug: 'maa-inti-maharaju-1988', genres: ['Drama'], year: 1988, tmdbId: 1324336 },
  { id: 733, title: 'Premayanam', slug: 'premayanam-1988', genres: ['Romance'], year: 1988, tmdbId: 1229857 },
  { id: 734, title: 'Donga Pelli', slug: 'donga-pelli-1988', genres: ['Comedy'], year: 1988, tmdbId: 1324337 },
  { id: 735, title: 'Jhansi Rani', slug: 'jhansi-rani-1988', genres: ['Drama'], year: 1988, tmdbId: 1205618 },
  { id: 736, title: 'Mardon Wali Baat', slug: 'mardon-wali-baat-1988', genres: ['Action'], year: 1988, tmdbId: 528019 },
  { id: 737, title: 'Padma Bhushan', slug: 'padma-bhushan-1988', genres: [], year: 1988, action: 'delete', deleteReason: 'Award Record - not a movie' },
  { id: 738, title: 'Dharma Teja', slug: 'dharma-teja-1988', genres: ['Action'], year: 1988, tmdbId: 137383 },
  
  // 1987 movies
  { id: 739, title: 'Relangi Narasimha Rao', slug: 'relangi-narasimha-rao-1987', genres: [], year: 1987, action: 'delete', deleteReason: 'Person Name - not a movie' },
  { id: 740, title: 'Damit Katha Adam Thirigindi', slug: 'damit-katha-adam-thirigindi-1987', genres: ['Comedy'], year: 1987, tmdbId: 1324338 },
  { id: 741, title: 'Gundamma Gari Krishnulu', slug: 'gundamma-gari-krishnulu-1987', genres: ['Comedy'], year: 1987, tmdbId: 313937 },
  { id: 742, title: 'Shankharavam', slug: 'shankharavam-1987', genres: ['Action'], year: 1987, tmdbId: 137388 },
  { id: 743, title: 'Muddayi', slug: 'muddayi-1987', genres: ['Action'], year: 1987, tmdbId: 137389 },
  { id: 744, title: 'Thandri Kodukula Challenge', slug: 'thandri-kodukula-challenge-1987', genres: ['Action'], year: 1987, tmdbId: 137386 },
  { id: 745, title: 'Sahasa Samrat', slug: 'sahasa-samrat-1987', genres: ['Action'], year: 1987, tmdbId: 441415 },
  { id: 746, title: 'Bhargava Ramudu', slug: 'bhargava-ramudu-1987', genres: ['Action'], year: 1987, tmdbId: 441008 },
  { id: 747, title: 'Makutamleni Maharaju', slug: 'makutamleni-maharaju-1987', genres: ['Action'], year: 1987, tmdbId: 137384 },
  { id: 748, title: 'Vishwanatha Nayakudu', slug: 'vishwanatha-nayakudu-1987', genres: ['Mythological'], year: 1987, tmdbId: 137385 },
  { id: 749, title: 'Vamsy', slug: 'vamsy-1987', genres: [], year: 1987, action: 'delete', deleteReason: 'Person Name - not a movie' },
  { id: 750, title: 'Thene Manasulu', slug: 'thene-manasulu-1987', genres: ['Romance'], year: 1987, tmdbId: 1607121 },
  { id: 751, title: 'Nakoo Pellam Kavali', slug: 'nakoo-pellam-kavali-1987', genres: ['Comedy'], year: 1987, tmdbId: 677020 },
  { id: 752, title: 'Maa Voori Magadu', slug: 'maa-voori-magadu-1987', genres: ['Action'], year: 1987, tmdbId: 137387 },
  { id: 753, title: 'Sardar Krishnama Naidu', slug: 'sardar-krishnama-naidu-1987', genres: ['Action'], year: 1987, tmdbId: 137390 },
  { id: 754, title: 'Muvva Gopaludu', slug: 'muvva-gopaludu-1987', genres: ['Romance'], year: 1987, tmdbId: 441007 },
  { id: 755, title: 'Pushpaka Vimanam', slug: 'pushpaka-vimanam-1987', genres: ['Comedy'], year: 1987, tmdbId: 47348 },
  { id: 756, title: 'Maharshi', slug: 'maharshi-1987', genres: ['Romance'], year: 1987, action: 'delete', deleteReason: 'Duplicate - same as 1988 entry' },
  { id: 757, title: 'Lawyer Suhasini', slug: 'lawyer-suhasini-1987', genres: ['Drama'], year: 1987, tmdbId: 1205617 },
  { id: 758, title: 'Prema Samrat', slug: 'prema-samrat-1987', genres: ['Romance'], year: 1987, tmdbId: 1229856 },
  { id: 759, title: 'Dammit Katha Addam Thirigindi', slug: 'dammit-katha-addam-thirigindi-1987', genres: ['Comedy'], year: 1987, action: 'delete', deleteReason: 'Duplicate of entry 740' },
  { id: 760, title: 'Ramu', slug: 'ramu-1987', genres: ['Drama'], year: 1987, tmdbId: 441006 },
  { id: 761, title: 'Sankharavam', slug: 'sankharavam-1987', genres: ['Action'], year: 1987, action: 'delete', deleteReason: 'Duplicate of entry 742' },
  { id: 762, title: 'Tene Manasulu', slug: 'tene-manasulu-1987', genres: ['Romance'], year: 1987, action: 'delete', deleteReason: 'Duplicate of entry 750' },
  { id: 763, title: 'Brahma Nayudu', slug: 'brahma-nayudu-1987', genres: ['Action'], year: 1987, tmdbId: 137391 },
  { id: 764, title: 'Maa Ooru', slug: 'maa-ooru-1987', genres: ['Drama'], year: 1987, tmdbId: 536397 },
  { id: 765, title: 'Muddu Bidda', slug: 'muddu-bidda-1987', genres: ['Drama'], year: 1987, tmdbId: 137392 },
  { id: 766, title: 'Dongodochhadu', slug: 'dongodochhadu-1987', genres: ['Action'], year: 1987, tmdbId: 137393 },
  { id: 767, title: 'Sardar Dharmanna', slug: 'sardar-dharmanna-1987', genres: ['Action'], year: 1987, tmdbId: 433403 },
  { id: 768, title: 'Kirai Dada', slug: 'kirai-dada-1987', genres: ['Action'], year: 1987, tmdbId: 530754 },
  { id: 769, title: 'Sankeerthana', slug: 'sankeerthana-1987', genres: ['Musical'], year: 1987, tmdbId: 260381 },
  { id: 770, title: 'Dabbevariki Chedu', slug: 'dabbevariki-chedu-1987', genres: ['Comedy'], year: 1987, tmdbId: 1596719 },
  { id: 771, title: 'Gandhinagar Rendava Veedhi', slug: 'gandhinagar-rendava-veedhi-1987', genres: ['Comedy'], year: 1987, tmdbId: 1607120 },
  
  // 1986 movies
  { id: 772, title: 'Srimathi Oka Bahumathi', slug: 'srimathi-oka-bahumathi-1986', genres: ['Drama'], year: 1986, tmdbId: 1324339 },
  { id: 773, title: 'Ravana Brahma', slug: 'ravana-brahma-1986', genres: ['Action'], year: 1986, tmdbId: 137395 },
  { id: 774, title: 'Parasuramudu', slug: 'parasuramudu-1986', genres: ['Action'], year: 1986, tmdbId: 137398 },
  { id: 775, title: 'Sakkanodu', slug: 'sakkanodu-1986', genres: ['Drama'], year: 1986, tmdbId: 137402 },
  { id: 776, title: 'Aadi Dampatulu', slug: 'aadi-dampatulu-1986', genres: ['Drama'], year: 1986, tmdbId: 433404 },
  { id: 777, title: 'Driver Babu', slug: 'driver-babu-1986', genres: ['Action'], year: 1986, tmdbId: 1229855 },
  { id: 778, title: 'Apoorva Sahodarulu', slug: 'apoorva-sahodarulu-1986', genres: ['Action'], year: 1986, tmdbId: 441005 },
  { id: 779, title: 'Nippulanti Manishi', slug: 'nippulanti-manishi-1986', genres: ['Action'], year: 1986, tmdbId: 137403 },
  { id: 780, title: 'Punyasthree', slug: 'punyasthree-1986', genres: ['Drama'], year: 1986, tmdbId: 313938 },
  { id: 781, title: 'Jailu Pakshi', slug: 'jailu-pakshi-1986', genres: ['Action'], year: 1986, tmdbId: 1324340 },
  { id: 782, title: 'Muddula Krishnaiah', slug: 'muddula-krishnaiah-1986', genres: ['Romance'], year: 1986, tmdbId: 441004 },
  { id: 783, title: 'Repati Pourulu', slug: 'repati-pourulu-1986', genres: ['Drama'], year: 1986, tmdbId: 1205616 },
  { id: 784, title: 'Santhi Nivasam', slug: 'santhi-nivasam-1986', genres: ['Drama'], year: 1986, tmdbId: 1324341 },
  { id: 785, title: 'Nireekshana', slug: 'nireekshana-1986', genres: ['Drama'], year: 1986, tmdbId: 137351 },
  { id: 786, title: 'Prathibhavanthudu', slug: 'prathibhavanthudu-1986', genres: ['Action'], year: 1986, tmdbId: 137404 },
  { id: 787, title: 'Brahma Rudrulu', slug: 'brahma-rudrulu-1986', genres: ['Action'], year: 1986, tmdbId: 137401 },
  { id: 788, title: 'Jayam Manade', slug: 'jayam-manade-1986', genres: ['Action'], year: 1986, tmdbId: 137396 },
  { id: 789, title: 'Naa Pilupe Prabahanajam', slug: 'naa-pilupe-prabahanajam-1986', genres: ['Action'], year: 1986, tmdbId: 137405 },
  { id: 790, title: 'Brahmasthram', slug: 'brahmasthram-1986', genres: ['Action'], year: 1986, tmdbId: 137406 },
  { id: 791, title: 'Ugra Narasimham', slug: 'ugra-narasimham-1986', genres: ['Action'], year: 1986, tmdbId: 137407 },
  { id: 792, title: 'Krishna Paramathma', slug: 'krishna-paramathma-1986', genres: ['Action'], year: 1986, tmdbId: 137408 },
  { id: 793, title: 'Khaidi Rudraiah', slug: 'khaidi-rudraiah-1986', genres: ['Action'], year: 1986, tmdbId: 137394 },
  { id: 794, title: 'Dasari Narayana Rao', slug: 'dasari-narayana-rao-1986', genres: [], year: 1986, action: 'delete', deleteReason: 'Person Name - not a movie' },
  { id: 795, title: 'Swathi Muthyam', slug: 'swathi-muthyam-1986', genres: ['Drama'], year: 1986, tmdbId: 47350 },
  { id: 796, title: 'Aranyakanda', slug: 'aranyakanda-1986', genres: ['Action'], year: 1986, tmdbId: 137451 },
  { id: 797, title: 'Brahmastram', slug: 'brahmastram-1986', genres: ['Action'], year: 1986, action: 'delete', deleteReason: 'Duplicate of entry 790' },
  { id: 798, title: 'Krishna Garadi', slug: 'krishna-garadi-1986', genres: ['Action'], year: 1986, tmdbId: 137409 },
  { id: 799, title: 'Kaliyuga Krishnudu', slug: 'kaliyuga-krishnudu-1986', genres: ['Action'], year: 1986, tmdbId: 441003 },
  { id: 800, title: 'Pyaar Ke Do Pal', slug: 'pyaar-ke-do-pal-1986', genres: ['Drama'], year: 1986, tmdbId: 358053 },
];

async function applyCorrections() {
  console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════════════════════╗
║         APPLY GENRE BATCH 3 CORRECTIONS (200 movies)                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`));

  let successCount = 0;
  let deleteCount = 0;
  let failCount = 0;
  const errors: string[] = [];
  const deletions: string[] = [];

  for (const correction of corrections) {
    try {
      console.log(chalk.white(`\n${correction.id.toString().padStart(3)}. ${correction.title} (${correction.year})`));
      
      // Find the movie by slug
      const { data: movie, error: fetchError } = await supabase
        .from('movies')
        .select('id, title_en, genres, tmdb_id')
        .eq('slug', correction.slug)
        .single();

      if (fetchError || !movie) {
        console.log(chalk.red(`     ✗ Not found by slug: ${correction.slug}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.title}: Not found`);
        continue;
      }

      // Handle deletions
      if (correction.action === 'delete') {
        const { error: deleteError } = await supabase
          .from('movies')
          .delete()
          .eq('id', movie.id);

        if (deleteError) {
          console.log(chalk.red(`     ✗ Delete failed: ${deleteError.message}`));
          failCount++;
          errors.push(`${correction.id}. ${correction.title}: ${deleteError.message}`);
          continue;
        }

        console.log(chalk.yellow(`     🗑  Deleted successfully`));
        console.log(chalk.gray(`       - Reason: ${correction.deleteReason}`));
        deletions.push(`${correction.id}. ${correction.title} - ${correction.deleteReason}`);
        deleteCount++;
        continue;
      }

      // Check if genres/TMDB need updating
      const currentGenres = JSON.stringify(movie.genres || []);
      const newGenres = JSON.stringify(correction.genres);
      const tmdbChanged = correction.tmdbId && movie.tmdb_id !== correction.tmdbId;

      if (currentGenres === newGenres && !tmdbChanged) {
        console.log(chalk.yellow(`     ⊘ No changes needed`));
        successCount++;
        continue;
      }

      // Update the movie
      const updateData: any = {
        genres: correction.genres,
      };
      
      if (correction.tmdbId) {
        updateData.tmdb_id = correction.tmdbId;
      }

      const { error: updateError } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movie.id);

      if (updateError) {
        console.log(chalk.red(`     ✗ Update failed: ${updateError.message}`));
        failCount++;
        errors.push(`${correction.id}. ${correction.title}: ${updateError.message}`);
        continue;
      }

      console.log(chalk.green(`     ✓ Updated successfully`));
      if (currentGenres !== newGenres) {
        console.log(chalk.gray(`       - Genres: ${currentGenres} → ${newGenres}`));
      }
      if (tmdbChanged) {
        console.log(chalk.gray(`       - TMDB: ${movie.tmdb_id || 'null'} → ${correction.tmdbId}`));
      }
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
  console.log(chalk.yellow(`  🗑  Deleted:                ${chalk.cyan(deleteCount)}`));
  console.log(chalk.red(`  ✗ Failed:                  ${chalk.cyan(failCount)}`));

  if (deletions.length > 0) {
    console.log(chalk.yellow(`\n  Deletions:\n`));
    deletions.forEach(del => console.log(chalk.yellow(`    ${del}`)));
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n  Errors:\n`));
    errors.forEach(err => console.log(chalk.red(`    ${err}`)));
  }

  console.log(chalk.green(`\n  ✅ Batch 3 corrections applied!\n`));
  console.log(chalk.cyan(`  📊 TMDB IDs added: ${corrections.filter(c => c.tmdbId).length}`));
}

applyCorrections();
