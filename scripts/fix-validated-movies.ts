#!/usr/bin/env npx tsx
/**
 * FIX VALIDATED MOVIES - BATCH UPDATE
 * 
 * Updates 44 movies with validated Hero and Director information
 * Based on manual review and factual corrections
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Validated movie data with correct Hero and Director (FULL UUIDs)
const VALIDATED_MOVIES = [
  { id: 'b994c347-d1e4-4edd-96f5-79f8baca9bea', title: 'Ranveer Ching Returns', year: 2016, hero: 'Ranveer Singh', director: 'Rohit Shetty' },
  { id: 'd20403fb-8432-4565-85c4-961d128206cb', title: 'Well, If You Know Me', year: 2015, hero: 'Venkatesh', director: 'Meher Ramesh' },
  { id: '8ac900ab-636a-4b62-8ea9-449341cd3539', title: 'Ramaiya Vastavaiya', year: 2013, hero: 'Girish Kumar', director: 'Prabhu Deva' },
  { id: '8182275f-e88d-4453-b855-4bb1695ef80c', title: 'Badrinath', year: 2011, hero: 'Allu Arjun', director: 'V. V. Vinayak' },
  { id: '5cd8b5da-c6cc-4acc-822a-361acc6e6803', title: 'Kalabha Mazha', year: 2011, hero: 'Sreejith Vijay', director: 'P. Bhaskaran' },
  { id: '1f339783-8a95-40dc-a318-fdb69edc331e', title: 'Marana Porali', year: 2011, hero: 'Sasikumar', director: 'Samuthirakani' },
  { id: '5e4052c0-9936-4bc9-9284-5adf79dcf4f4', title: 'Shubhapradam', year: 2010, hero: 'Allari Naresh', director: 'K. Viswanath' },
  { id: 'bb35eb63-49c4-42aa-a405-7ca08b8a813d', title: 'Betting Bangaraju', year: 2010, hero: 'Allari Naresh', director: 'E. Sattibabu' },
  { id: '6dcf4ef0-f5e9-4717-96dd-14513908ce02', title: 'Gopi – Goda Meedha Pilli', year: 2006, hero: 'Allari Naresh', director: 'Janardhana Maharshi' },
  { id: '06fbeb2c-ab89-423c-9e63-6009e3e96688', title: 'Sundaraniki Tondarekkuva', year: 2006, hero: 'Allari Naresh', director: 'Phani Prakash' },
  { id: '092508fb-f084-443b-aa50-3c6d06b6ec12', title: 'Chennakeshava Reddy', year: 2002, hero: 'Nandamuri Balakrishna', director: 'V. V. Vinayak' },
  { id: 'ff32a1f8-e0a8-41fd-9fe9-5f9ffb94b6fa', title: 'Angala Parameswari', year: 2002, hero: 'Roja', director: 'Phani Prakash' },
  { id: '5205c2dc-2f36-48c9-9807-3153e897adbd', title: 'Gunda Gardi', year: 1997, hero: 'Aditya Pancholi', director: 'V. Sai Prasad' },
  { id: 'fd10c7b5-1e25-4bcc-b82d-b4c6d1b48485', title: 'Shri Krishnarjuna Vijayam', year: 1996, hero: 'Nandamuri Balakrishna', director: 'Singeetam Srinivasa Rao' },
  { id: 'e1124ed1-4aee-40ec-a97e-f5ecd5966a8d', title: 'Maato Pettukoku', year: 1995, hero: 'Nandamuri Balakrishna', director: 'A. Kodandarami Reddy' },
  { id: '6d038721-fec0-4ba3-a90b-acbb26ef088e', title: 'Raja Muthirai', year: 1995, hero: 'Arun Pandian', director: 'R. K. Selvamani' },
  { id: '86e58157-d33f-48d1-a562-7413efddffd9', title: 'Shubha Lagnam', year: 1994, hero: 'Jagapathi Babu', director: 'S. V. Krishna Reddy' },
  { id: '32d1c1ea-abd5-44ae-980e-369ba2f6ab96', title: 'Athiradi Padai', year: 1994, hero: 'Rahman', director: 'R. K. Selvamani' },
  { id: '95639c8c-fad3-4ef9-b2a3-0e1b06040346', title: 'Aaj Ka Goonda Raj', year: 1992, hero: 'Chiranjeevi', director: 'Ravi Raja Pinisetty' },
  { id: '1d57f0ef-c4ed-4b34-b453-b608ce213ba3', title: 'Chaithanya', year: 1991, hero: 'Akkineni Nagarjuna', director: 'Prathap Pothan' },
  { id: '9fcf70da-160e-4635-af49-538749378675', title: 'Shubha Muhurtam', year: 1983, hero: 'Murali Mohan', director: 'C. P. Kolli' },
  { id: '6212f700-84e3-4c84-bedc-570a48747a3d', title: 'Nizhal Thedum Nenjangal', year: 1982, hero: 'Rajinikanth', director: 'P. S. Nivas' },
  { id: '06506eed-73d6-43dd-af5e-66030ac47b65', title: 'Paravathi Parameshwarulu', year: 1981, hero: 'Chandra Mohan', director: 'M. S. Kota Reddy' },
  { id: '0a0d8345-02a7-4343-ada9-89ea66b5f912', title: 'Agni Sanskaram', year: 1980, hero: 'Gummadi', director: 'G. V. Prabhakar' },
  { id: '90c2fb7e-6c92-45a4-81c4-a6c18b32e742', title: 'Rakta Sambandham', year: 1980, hero: 'Murali Mohan', director: 'M. Mallikarjuna Rao' },
  { id: 'bbf3b8b2-ff2a-4ded-a6c3-86e9c9f17a7e', title: 'Kothala Raayudu', year: 1979, hero: 'Chiranjeevi', director: 'K. Vasu' },
  { id: 'd230d639-8927-40d7-9889-79f95e18d21f', title: 'Sri Rambantu', year: 1979, hero: 'Chiranjeevi', director: 'Arudra' },
  { id: '1a2d75cb-f7af-44c0-b7ad-eaf4b4bcfc31', title: 'Karunamayudu', year: 1978, hero: 'Vijayachander', director: 'A. Bhimsingh' },
  { id: '2d2300e8-75f4-40fa-9d89-11b728749949', title: 'Karunai Ullam', year: 1978, hero: 'Gemini Ganesan', director: 'A. Bhimsingh' },
  { id: 'f0b669a6-227e-46c8-bdca-8778aef704d8', title: 'Bangaru Bommalu', year: 1977, hero: 'Akkineni Nageswara Rao', director: 'V. B. Rajendra Prasad' },
  { id: 'b7aad561-d88c-44b1-bd47-7076d669d0b5', title: 'Jeevana Theeralu', year: 1977, hero: 'Krishnam Raju', director: 'G. C. Sekhar' },
  { id: '1196ac9f-472a-446a-9f7b-41b8ad8bdb75', title: 'Iddaru Ammayilu', year: 1972, hero: 'Akkineni Nageswara Rao', director: 'Putanna Kanagal' },
  { id: '2ced2102-12ab-4391-9e5b-40ae526c7b11', title: 'Amma Mata', year: 1972, hero: 'Sobhan Babu', director: 'V. Ramachandra Rao' },
  { id: '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4', title: 'Shri Krishnavataram', year: 1967, hero: 'N. T. Rama Rao', director: 'Kamalakara Kameswara Rao' },
  { id: '2142390d-8c14-4236-9aae-eb20edaa95cd', title: 'Shri Krishna Pandaviyam', year: 1966, hero: 'N. T. Rama Rao', director: 'N. T. Rama Rao' },
  { id: '3bbeed9a-30c4-458c-827a-11f4df9582c4', title: 'Poojaikku Vandha Malar', year: 1965, hero: 'Gemini Ganesan', director: 'Muktha Srinivasan' },
  { id: '4bf8c217-ffe2-489d-809d-50a499ac3cd1', title: 'Kai Koduttha Dheivam', year: 1964, hero: 'Sivaji Ganesan', director: 'K. S. Gopalakrishnan' },
  { id: '7f0b003c-b15f-4087-9003-0efc1d959658', title: 'Paarthaal Pasi Theerum', year: 1962, hero: 'Sivaji Ganesan', director: 'A. Bhimsingh' },
  { id: '5d95bc5d-9490-4664-abc6-d2a9e29a05a8', title: 'Kuravanji', year: 1960, hero: 'Sivaji Ganesan', director: 'A. Kasilingam' },
  { id: '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3', title: 'Padhi Bhakti', year: 1958, hero: 'Gemini Ganesan', director: 'A. Bhimsingh' },
  { id: 'aa6a8a7d-f47e-42a0-b938-3145ad479fb3', title: 'Kaathavaraayan', year: 1958, hero: 'Sivaji Ganesan', director: 'T. R. Ramanna' },
  { id: 'f86df043-4436-46ee-a4b6-6889d3b29f2e', title: 'Pathini Deivam', year: 1957, hero: 'Gemini Ganesan', director: 'Ch. Narayana Murthy' },
  { id: '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a', title: 'Bratuku Theruvu', year: 1953, hero: 'Akkineni Nageswara Rao', director: 'P. S. Ramakrishna Rao' },
  { id: 'f6069bac-c8e0-43a6-9742-22cd0cb22ac1', title: 'Adarsham', year: 1952, hero: 'Akkineni Nageswara Rao', director: 'H. V. Babu' },
];

// Parse command line arguments
const args = process.argv.slice(2);
const hasFlag = (name: string): boolean => args.includes(`--${name}`);
const EXECUTE = hasFlag('execute');
const DRY_RUN = hasFlag('dry-run');

// Helper to convert name to slug
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log(chalk.blue.bold('\n🔧 FIX VALIDATED MOVIES - BATCH UPDATE\n'));
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('⚠️  DRY RUN MODE - No changes will be made'));
    console.log(chalk.yellow('    Use --execute to apply changes\n'));
  }
  
  const results = {
    total: VALIDATED_MOVIES.length,
    found: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
  };
  
  for (const movie of VALIDATED_MOVIES) {
    try {
      // Fetch the movie from database
      const { data: existingMovie, error: fetchError } = await supabase
        .from('movies')
        .select('id, title_en, hero, director, release_year')
        .eq('id', movie.id)
        .single();
      
      if (fetchError || !existingMovie) {
        console.log(chalk.red(`✗ [${movie.id}] ${movie.title} (${movie.year}) - NOT FOUND in database`));
        results.notFound++;
        continue;
      }
      
      results.found++;
      
      // Convert names to slugs
      const heroSlug = toSlug(movie.hero);
      const directorSlug = toSlug(movie.director);
      
      console.log(chalk.cyan(`\n[${results.found}/${results.total}] ${movie.title} (${movie.year})`));
      console.log(chalk.gray(`  ID: ${movie.id}`));
      console.log(chalk.gray(`  Current Hero: ${existingMovie.hero || 'NULL'} → ${movie.hero}`));
      console.log(chalk.gray(`  Current Director: ${existingMovie.director || 'NULL'} → ${movie.director}`));
      
      if (EXECUTE) {
        const { error: updateError } = await supabase
          .from('movies')
          .update({
            hero: movie.hero,
            director: movie.director,
            updated_at: new Date().toISOString(),
          })
          .eq('id', movie.id);
        
        if (updateError) {
          console.log(chalk.red(`  ✗ Failed to update: ${updateError.message}`));
          results.errors++;
        } else {
          console.log(chalk.green(`  ✓ Updated successfully`));
          results.updated++;
        }
      } else {
        console.log(chalk.yellow(`  ⊳ DRY RUN - Would update hero and director`));
      }
      
    } catch (error) {
      console.log(chalk.red(`✗ Error processing ${movie.title}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      results.errors++;
    }
  }
  
  // Print summary
  console.log(chalk.blue.bold('\n' + '='.repeat(60)));
  console.log(chalk.blue.bold('BATCH UPDATE SUMMARY'));
  console.log(chalk.blue.bold('='.repeat(60) + '\n'));
  
  console.log(chalk.white(`Total Movies:        ${results.total}`));
  console.log(chalk.green(`Found in DB:         ${results.found}`));
  console.log(chalk.cyan(`Updated:             ${results.updated}`));
  console.log(chalk.red(`Not Found:           ${results.notFound}`));
  console.log(chalk.red(`Errors:              ${results.errors}`));
  
  const successRate = results.found > 0 ? Math.round((results.updated / results.found) * 100) : 0;
  console.log(chalk.white(`\nSuccess Rate:        ${successRate}%`));
  
  if (results.notFound > 0) {
    console.log(chalk.yellow(`\n⚠️  ${results.notFound} movies were not found in the database`));
    console.log(chalk.yellow('   They may need to be created first or have different IDs'));
  }
  
  if (!EXECUTE && !DRY_RUN) {
    console.log(chalk.yellow('\n⚠️  DRY RUN - No changes were made to database'));
    console.log(chalk.yellow('   Run with --execute to apply changes'));
  }
  
  console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
}

main()
  .then(() => {
    console.log(chalk.green('✓ Batch update completed'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('✗ Batch update failed:'), error);
    process.exit(1);
  });
