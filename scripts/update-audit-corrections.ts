#!/usr/bin/env npx tsx
/**
 * Apply manual review corrections to the actor audit worksheet
 */

import * as fs from 'fs';
import chalk from 'chalk';

const corrections: Record<string, { wiki: string; filmography: string; notes: string }> = {
  // Veteran Stars & Legends
  'Satyanarayana': {
    wiki: 'https://en.wikipedia.org/wiki/Kaikala_Satyanarayana',
    filmography: 'https://en.wikipedia.org/wiki/Kaikala_Satyanarayana#Filmography',
    notes: 'Kaikala Satyanarayana'
  },
  'K. Viswanath': {
    wiki: 'https://en.wikipedia.org/wiki/K._Viswanath',
    filmography: 'https://en.wikipedia.org/wiki/K._Viswanath_filmography',
    notes: 'Has standalone filmography page'
  },
  'K. Balachander': {
    wiki: 'https://en.wikipedia.org/wiki/K._Balachander',
    filmography: 'https://en.wikipedia.org/wiki/K._Balachander_filmography',
    notes: 'Director & Actor'
  },
  'Ramakrishna': {
    wiki: 'https://en.wikipedia.org/wiki/Ramakrishna_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Ramakrishna_(Telugu_actor)#Filmography',
    notes: 'Telugu actor disambiguation'
  },
  'V. Nagayya': {
    wiki: 'https://en.wikipedia.org/wiki/V._Nagayya',
    filmography: 'https://en.wikipedia.org/wiki/V._Nagayya#Filmography',
    notes: 'Filmography in main article'
  },
  'Bhanumathi': {
    wiki: 'https://en.wikipedia.org/wiki/P._Bhanumathi',
    filmography: 'https://en.wikipedia.org/wiki/P._Bhanumathi#Filmography',
    notes: 'P. Bhanumathi Ramakrishna'
  },
  
  // Modern Superstars
  'N.T. Rama Rao Jr.': {
    wiki: 'https://en.wikipedia.org/wiki/N._T._Rama_Rao_Jr.',
    filmography: 'https://en.wikipedia.org/wiki/N._T._Rama_Rao_Jr._filmography',
    notes: 'Standalone filmography'
  },
  'Pawan Kalyan': {
    wiki: 'https://en.wikipedia.org/wiki/Pawan_Kalyan',
    filmography: 'https://en.wikipedia.org/wiki/Pawan_Kalyan_filmography',
    notes: 'Standalone filmography'
  },
  'Gopichand': {
    wiki: 'https://en.wikipedia.org/wiki/Gopichand_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Gopichand_(actor)#Filmography',
    notes: 'Actor disambiguation'
  },
  'Sunil': {
    wiki: 'https://en.wikipedia.org/wiki/Sunil_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Sunil_filmography',
    notes: 'Actor disambiguation, has standalone'
  },
  'Vikram': {
    wiki: 'https://en.wikipedia.org/wiki/Vikram_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Vikram_filmography',
    notes: 'Tamil actor with standalone'
  },
  'Sumanth': {
    wiki: 'https://en.wikipedia.org/wiki/Sumanth',
    filmography: 'https://en.wikipedia.org/wiki/Sumanth#Filmography',
    notes: 'Integrated filmography'
  },
  
  // Popular Lead Actors & Actresses
  'Venu': {
    wiki: 'https://en.wikipedia.org/wiki/Venu_Thottempudi',
    filmography: 'https://en.wikipedia.org/wiki/Venu_Thottempudi#Filmography',
    notes: 'Venu Thottempudi'
  },
  'Rajasekhar': {
    wiki: 'https://en.wikipedia.org/wiki/Rajasekhar_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Rajasekhar_(actor)#Filmography',
    notes: 'Actor disambiguation'
  },
  'Simran': {
    wiki: 'https://en.wikipedia.org/wiki/Simran_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Simran_filmography',
    notes: 'Has standalone filmography'
  },
  'Raasi': {
    wiki: 'https://en.wikipedia.org/wiki/Raasi_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Raasi_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Sneha': {
    wiki: 'https://en.wikipedia.org/wiki/Sneha_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Sneha_filmography',
    notes: 'Has standalone filmography'
  },
  'Rohit': {
    wiki: 'https://en.wikipedia.org/wiki/Rohit_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Rohit_(actor)#Filmography',
    notes: 'Actor disambiguation'
  },
  'Prabhu Deva': {
    wiki: 'https://en.wikipedia.org/wiki/Prabhu_Deva',
    filmography: 'https://en.wikipedia.org/wiki/Prabhu_Deva_filmography',
    notes: 'Multi-industry star'
  },
  'Shobana': {
    wiki: 'https://en.wikipedia.org/wiki/Shobana',
    filmography: 'https://en.wikipedia.org/wiki/Shobana_filmography',
    notes: 'Has standalone filmography'
  },
  
  // Actors 21-40
  'Rambha': {
    wiki: 'https://en.wikipedia.org/wiki/Rambha_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Rambha_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Sharada': {
    wiki: 'https://en.wikipedia.org/wiki/Sharada_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Sharada_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Trisha': {
    wiki: 'https://en.wikipedia.org/wiki/Trisha_Krishnan',
    filmography: 'https://en.wikipedia.org/wiki/Trisha_Krishnan_filmography',
    notes: 'Same as Trisha Krishnan'
  },
  'Karthik': {
    wiki: 'https://en.wikipedia.org/wiki/Karthik_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Karthik_(actor)#Filmography',
    notes: 'Actor disambiguation'
  },
  'Anushka Shetty': {
    wiki: 'https://en.wikipedia.org/wiki/Anushka_Shetty',
    filmography: 'https://en.wikipedia.org/wiki/Anushka_Shetty_filmography',
    notes: 'Standalone filmography'
  },
  'Trisha Krishnan': {
    wiki: 'https://en.wikipedia.org/wiki/Trisha_Krishnan',
    filmography: 'https://en.wikipedia.org/wiki/Trisha_Krishnan_filmography',
    notes: 'Primary name'
  },
  'Bhanupriya': {
    wiki: 'https://en.wikipedia.org/wiki/Bhanupriya',
    filmography: 'https://en.wikipedia.org/wiki/Bhanupriya_filmography',
    notes: 'Standalone filmography'
  },
  'Suresh': {
    wiki: 'https://en.wikipedia.org/wiki/Suresh_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Suresh_(Telugu_actor)#Filmography',
    notes: 'Telugu actor disambiguation'
  },
  'Nani': {
    wiki: 'https://en.wikipedia.org/wiki/Nani_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Nani_filmography',
    notes: 'Actor disambiguation'
  },
  'Nayanthara': {
    wiki: 'https://en.wikipedia.org/wiki/Nayanthara',
    filmography: 'https://en.wikipedia.org/wiki/Nayanthara_filmography',
    notes: 'Multi-industry star'
  },
  'Sarath Babu': {
    wiki: 'https://en.wikipedia.org/wiki/Sarath_Babu',
    filmography: 'https://en.wikipedia.org/wiki/Sarath_Babu#Filmography',
    notes: 'Integrated filmography'
  },
  'Prakash Raj': {
    wiki: 'https://en.wikipedia.org/wiki/Prakash_Raj',
    filmography: 'https://en.wikipedia.org/wiki/Prakash_Raj_filmography',
    notes: 'Multi-industry actor'
  },
  'Rajani': {
    wiki: 'https://en.wikipedia.org/wiki/Rajani_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Rajani_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Madhavi': {
    wiki: 'https://en.wikipedia.org/wiki/Madhavi_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Madhavi_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Chandra Mohan': {
    wiki: 'https://en.wikipedia.org/wiki/Chandra_Mohan_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Chandra_Mohan_(Telugu_actor)#Filmography',
    notes: 'Telugu actor'
  },
  'Siddharth': {
    wiki: 'https://en.wikipedia.org/wiki/Siddharth_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Siddharth_filmography',
    notes: 'Multi-industry'
  },
  'Jayalalitha': {
    wiki: 'https://en.wikipedia.org/wiki/Jayalalithaa',
    filmography: 'https://en.wikipedia.org/wiki/Jayalalithaa#Filmography',
    notes: 'Former CM & actress'
  },
  'Varun Sandesh': {
    wiki: 'https://en.wikipedia.org/wiki/Varun_Sandesh',
    filmography: 'https://en.wikipedia.org/wiki/Varun_Sandesh#Filmography',
    notes: 'Integrated filmography'
  },
  'Geetha': {
    wiki: 'https://en.wikipedia.org/wiki/Geetha_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Geetha_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Kanchana': {
    wiki: 'https://en.wikipedia.org/wiki/Kanchana_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Kanchana_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  
  // Actors 41-60
  'Ajay': {
    wiki: 'https://en.wikipedia.org/wiki/Ajay_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Ajay_(Telugu_actor)#Filmography',
    notes: 'Telugu actor'
  },
  'Ramya Krishna': {
    wiki: 'https://en.wikipedia.org/wiki/Ramya_Krishna',
    filmography: 'https://en.wikipedia.org/wiki/Ramya_Krishna_filmography',
    notes: 'Has standalone'
  },
  'Priyamani': {
    wiki: 'https://en.wikipedia.org/wiki/Priyamani',
    filmography: 'https://en.wikipedia.org/wiki/Priyamani_filmography',
    notes: 'Multi-industry'
  },
  'Amala': {
    wiki: 'https://en.wikipedia.org/wiki/Amala_Akkineni',
    filmography: 'https://en.wikipedia.org/wiki/Amala_Akkineni#Filmography',
    notes: 'Amala Akkineni'
  },
  'Latha': {
    wiki: 'https://en.wikipedia.org/wiki/Latha_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Latha_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Sukumar': {
    wiki: 'https://en.wikipedia.org/wiki/Sukumar',
    filmography: 'https://en.wikipedia.org/wiki/Sukumar#Filmography',
    notes: 'Director, minor acting'
  },
  'Tarun': {
    wiki: 'https://en.wikipedia.org/wiki/Tarun_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Tarun_(actor)#Filmography',
    notes: 'Actor disambiguation'
  },
  'Devika': {
    wiki: 'https://en.wikipedia.org/wiki/Devika_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Devika_(actress)#Filmography',
    notes: 'Actress disambiguation'
  },
  'Vishnu': {
    wiki: 'https://en.wikipedia.org/wiki/Vishnu_Manchu',
    filmography: 'https://en.wikipedia.org/wiki/Vishnu_Manchu#Filmography',
    notes: 'Vishnu Manchu'
  },
  'Suhasini': {
    wiki: 'https://en.wikipedia.org/wiki/Suhasini_Maniratnam',
    filmography: 'https://en.wikipedia.org/wiki/Suhasini_Maniratnam_filmography',
    notes: 'Suhasini Maniratnam'
  },
  'Pushpavalli': {
    wiki: 'https://en.wikipedia.org/wiki/Pushpavalli',
    filmography: 'https://en.wikipedia.org/wiki/Pushpavalli#Filmography',
    notes: 'Integrated'
  },
  'Nithiin': {
    wiki: 'https://en.wikipedia.org/wiki/Nithiin',
    filmography: 'https://en.wikipedia.org/wiki/Nithiin_filmography',
    notes: 'Standalone'
  },
  'Dulquer Salmaan': {
    wiki: 'https://en.wikipedia.org/wiki/Dulquer_Salmaan',
    filmography: 'https://en.wikipedia.org/wiki/Dulquer_Salmaan_filmography',
    notes: 'Multi-industry'
  },
  'Kanta Rao': {
    wiki: 'https://en.wikipedia.org/wiki/Kanta_Rao',
    filmography: 'https://en.wikipedia.org/wiki/Kanta_Rao#Filmography',
    notes: 'Veteran'
  },
  'Jaggayya': {
    wiki: 'https://en.wikipedia.org/wiki/Kongara_Jaggayya',
    filmography: 'https://en.wikipedia.org/wiki/Kongara_Jaggayya#Filmography',
    notes: 'Kongara Jaggayya'
  },
  'Mohan Babu': {
    wiki: 'https://en.wikipedia.org/wiki/Mohan_Babu',
    filmography: 'https://en.wikipedia.org/wiki/Mohan_Babu_filmography',
    notes: 'Standalone'
  },
  'Shriya Saran': {
    wiki: 'https://en.wikipedia.org/wiki/Shriya_Saran',
    filmography: 'https://en.wikipedia.org/wiki/Shriya_Saran_filmography',
    notes: 'Multi-industry'
  },
  'Vineeth': {
    wiki: 'https://en.wikipedia.org/wiki/Vineeth',
    filmography: 'https://en.wikipedia.org/wiki/Vineeth_filmography',
    notes: 'Malayalam actor'
  },
  'Manjula': {
    wiki: 'https://en.wikipedia.org/wiki/Manjula_Vijayakumar',
    filmography: 'https://en.wikipedia.org/wiki/Manjula_Vijayakumar#Filmography',
    notes: 'Manjula Vijayakumar'
  },
  'Brahmanandam': {
    wiki: 'https://en.wikipedia.org/wiki/Brahmanandam',
    filmography: 'https://en.wikipedia.org/wiki/Brahmanandam_filmography',
    notes: 'Comedy legend'
  },
  
  // Actors 61-80
  'Suhas': {
    wiki: 'https://en.wikipedia.org/wiki/Suhas_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Suhas_(actor)#Filmography',
    notes: 'Actor disambiguation'
  },
  'Sundeep Kishan': {
    wiki: 'https://en.wikipedia.org/wiki/Sundeep_Kishan',
    filmography: 'https://en.wikipedia.org/wiki/Sundeep_Kishan_filmography',
    notes: 'Standalone'
  },
  'Sumalatha': {
    wiki: 'https://en.wikipedia.org/wiki/Sumalatha',
    filmography: 'https://en.wikipedia.org/wiki/Sumalatha_filmography',
    notes: 'Standalone'
  },
  'Sivaji': {
    wiki: 'https://en.wikipedia.org/wiki/Sivaji_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Sivaji_(Telugu_actor)#Filmography',
    notes: 'Telugu actor'
  },
  'Sharwanand': {
    wiki: 'https://en.wikipedia.org/wiki/Sharwanand',
    filmography: 'https://en.wikipedia.org/wiki/Sharwanand_filmography',
    notes: 'Standalone'
  },
  'Meena': {
    wiki: 'https://en.wikipedia.org/wiki/Meena_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Meena_filmography',
    notes: 'Multi-industry'
  },
  'Radha': {
    wiki: 'https://en.wikipedia.org/wiki/Radha_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Radha_filmography',
    notes: 'Standalone'
  },
  'Daggubati Venkatesh': {
    wiki: 'https://en.wikipedia.org/wiki/Venkatesh_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Venkatesh_filmography',
    notes: 'Venkatesh Daggubati'
  },
  'Krishna Kumari': {
    wiki: 'https://en.wikipedia.org/wiki/Krishna_Kumari',
    filmography: 'https://en.wikipedia.org/wiki/Krishna_Kumari#Filmography',
    notes: 'Veteran actress'
  },
  'Vijaya Nirmala': {
    wiki: 'https://en.wikipedia.org/wiki/Vijaya_Nirmala',
    filmography: 'https://en.wikipedia.org/wiki/Vijaya_Nirmala_filmography',
    notes: 'Actress & director'
  },
  'Kamal Haasan': {
    wiki: 'https://en.wikipedia.org/wiki/Kamal_Haasan',
    filmography: 'https://en.wikipedia.org/wiki/Kamal_Haasan_filmography',
    notes: 'Tamil legend'
  },
  'Akkineni Nagarjuna': {
    wiki: 'https://en.wikipedia.org/wiki/Nagarjuna_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Nagarjuna_(actor)#Filmography',
    notes: 'Nagarjuna Akkineni'
  },
  'Ravi Teja': {
    wiki: 'https://en.wikipedia.org/wiki/Ravi_Teja',
    filmography: 'https://en.wikipedia.org/wiki/Ravi_Teja_filmography',
    notes: 'Mass Maharaja'
  },
  'Jamuna': {
    wiki: 'https://en.wikipedia.org/wiki/Jamuna_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Jamuna_(actress)#Filmography',
    notes: 'Veteran'
  },
  'Roja': {
    wiki: 'https://en.wikipedia.org/wiki/Roja_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Roja_filmography',
    notes: 'Actress & politician'
  },
  'Rajinikanth': {
    wiki: 'https://en.wikipedia.org/wiki/Rajinikanth',
    filmography: 'https://en.wikipedia.org/wiki/Rajinikanth_filmography',
    notes: 'Superstar'
  },
  'Anjali': {
    wiki: 'https://en.wikipedia.org/wiki/Anjali_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Anjali_filmography',
    notes: 'Actress disambiguation'
  },
  'Krishnam Raju': {
    wiki: 'https://en.wikipedia.org/wiki/Krishnam_Raju',
    filmography: 'https://en.wikipedia.org/wiki/Krishnam_Raju_filmography',
    notes: 'Rebel Star'
  },
  'Sobhan Babu': {
    wiki: 'https://en.wikipedia.org/wiki/Sobhan_Babu',
    filmography: 'https://en.wikipedia.org/wiki/Sobhan_Babu_filmography',
    notes: 'Legend'
  },
  'Lakshmi': {
    wiki: 'https://en.wikipedia.org/wiki/Lakshmi_(actress)',
    filmography: 'https://en.wikipedia.org/wiki/Lakshmi_filmography',
    notes: 'Multi-industry'
  },
  
  // Actors 81-100
  'Nandamuri Balakrishna': {
    wiki: 'https://en.wikipedia.org/wiki/Nandamuri_Balakrishna',
    filmography: 'https://en.wikipedia.org/wiki/Nandamuri_Balakrishna_filmography',
    notes: 'N. Balakrishna'
  },
  'Allari Naresh': {
    wiki: 'https://en.wikipedia.org/wiki/Allari_Naresh',
    filmography: 'https://en.wikipedia.org/wiki/Allari_Naresh_filmography',
    notes: 'Comedy star'
  },
  'Naresh': {
    wiki: 'https://en.wikipedia.org/wiki/Naresh_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Naresh_(Telugu_actor)#Filmography',
    notes: 'Senior Naresh'
  },
  'Suman': {
    wiki: 'https://en.wikipedia.org/wiki/Suman_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Suman_(Telugu_actor)#Filmography',
    notes: 'Telugu actor'
  },
  'Jayasudha': {
    wiki: 'https://en.wikipedia.org/wiki/Jayasudha',
    filmography: 'https://en.wikipedia.org/wiki/Jayasudha_filmography',
    notes: 'Veteran actress'
  },
  'Chiranjeevi': {
    wiki: 'https://en.wikipedia.org/wiki/Chiranjeevi',
    filmography: 'https://en.wikipedia.org/wiki/Chiranjeevi_filmography',
    notes: 'Megastar'
  },
  'Arjun': {
    wiki: 'https://en.wikipedia.org/wiki/Arjun_Sarja',
    filmography: 'https://en.wikipedia.org/wiki/Arjun_Sarja_filmography',
    notes: 'Arjun Sarja'
  },
  'Rajendra Prasad': {
    wiki: 'https://en.wikipedia.org/wiki/Rajendra_Prasad_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Rajendra_Prasad_filmography',
    notes: 'Comedy legend'
  },
  'Srikanth': {
    wiki: 'https://en.wikipedia.org/wiki/Meka_Srikanth',
    filmography: 'https://en.wikipedia.org/wiki/Meka_Srikanth_filmography',
    notes: 'Meka Srikanth (Telugu)'
  },
  'Jaya Prada': {
    wiki: 'https://en.wikipedia.org/wiki/Jaya_Prada',
    filmography: 'https://en.wikipedia.org/wiki/Jaya_Prada_filmography',
    notes: 'Multi-industry'
  },
  'Sridevi': {
    wiki: 'https://en.wikipedia.org/wiki/Sridevi',
    filmography: 'https://en.wikipedia.org/wiki/Sridevi_filmography',
    notes: 'Legend'
  },
  'Shruti Haasan': {
    wiki: 'https://en.wikipedia.org/wiki/Shruti_Haasan',
    filmography: 'https://en.wikipedia.org/wiki/Shruti_Haasan_filmography',
    notes: 'Multi-industry'
  },
  'Raja': {
    wiki: 'https://en.wikipedia.org/wiki/Raja_Abel',
    filmography: 'https://en.wikipedia.org/wiki/Raja_Abel#Filmography',
    notes: 'Raja Abel'
  },
  'Anjali Devi': {
    wiki: 'https://en.wikipedia.org/wiki/Anjali_Devi',
    filmography: 'https://en.wikipedia.org/wiki/Anjali_Devi_filmography',
    notes: 'Veteran legend'
  },
  'Ali': {
    wiki: 'https://en.wikipedia.org/wiki/Ali_(actor)',
    filmography: 'https://en.wikipedia.org/wiki/Ali_filmography',
    notes: 'Comedy actor'
  },
  'N.T. Rama Rao': {
    wiki: 'https://en.wikipedia.org/wiki/N._T._Rama_Rao',
    filmography: 'https://en.wikipedia.org/wiki/N._T._Rama_Rao_filmography',
    notes: 'NTR Sr. Legend'
  },
  'Jagapathi Babu': {
    wiki: 'https://en.wikipedia.org/wiki/Jagapathi_Babu',
    filmography: 'https://en.wikipedia.org/wiki/Jagapathi_Babu_filmography',
    notes: 'Prolific actor'
  },
  'Akkineni Nageswara Rao': {
    wiki: 'https://en.wikipedia.org/wiki/Akkineni_Nageswara_Rao',
    filmography: 'https://en.wikipedia.org/wiki/Akkineni_Nageswara_Rao_filmography',
    notes: 'ANR Legend'
  },
  'Ram': {
    wiki: 'https://en.wikipedia.org/wiki/Ram_Pothineni',
    filmography: 'https://en.wikipedia.org/wiki/Ram_Pothineni_filmography',
    notes: 'Ram Pothineni'
  },
  'Krishna': {
    wiki: 'https://en.wikipedia.org/wiki/Krishna_(Telugu_actor)',
    filmography: 'https://en.wikipedia.org/wiki/Krishna_filmography',
    notes: 'Superstar Krishna'
  }
};

function updateWorksheet() {
  const filePath = 'ACTOR-AUDIT-WORKSHEET-2026-01-18.csv';
  let content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n');
  
  let updatedCount = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('","');
    if (parts.length < 13) continue;
    
    const actorName = parts[1].replace(/^"|"$/g, '');
    
    if (corrections[actorName]) {
      const correction = corrections[actorName];
      
      // Update Wikipedia URL (index 7)
      parts[7] = correction.wiki;
      
      // Update Filmography URL (index 8)
      parts[8] = correction.filmography;
      
      // Update Notes (index 11)
      parts[11] = correction.notes;
      
      lines[i] = parts.join('","');
      updatedCount++;
      
      console.log(chalk.green(`✓ Updated: ${actorName}`));
    }
  }
  
  fs.writeFileSync(filePath, lines.join('\n'));
  
  console.log(chalk.blue.bold(`\n═══════════════════════════════════════════════════════════════`));
  console.log(chalk.blue.bold(`  UPDATE COMPLETE`));
  console.log(chalk.blue.bold(`═══════════════════════════════════════════════════════════════\n`));
  console.log(chalk.green(`✓ Updated ${updatedCount} actor records`));
  console.log(chalk.gray(`  File: ${filePath}\n`));
}

updateWorksheet();
