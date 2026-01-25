import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface MovieCorrection {
  id: string;
  title: string;
  year: number;
  hero: string;
  director: string;
  ourRating?: number;
  tmdbRating?: number;
  notes: string;
}

const corrections: MovieCorrection[] = [
  // 2024 Recent Releases
  { id: 'ede2f145-a46a-439a-8c6f-1c755c69f76f', title: 'Mysaa', year: 2024, hero: 'Guru Somasundaram', director: 'Rawindra Pulle', tmdbRating: 6.5, notes: 'Unafraid of war...' },
  { id: 'bc217391-6aa5-411d-abc4-76e86c134894', title: 'Janakiram', year: 2024, hero: 'Nagendra Babu', director: 'Ram Prasad Ragutu', tmdbRating: 6.0, notes: 'Romance-comedy-action...' },
  { id: 'f08bd1ee-a329-4ea7-a792-d28f876a4d4c', title: 'Anaganaga Oka Rowdy', year: 2024, hero: 'Sumanth', director: 'Manu Yagnaa', tmdbRating: 5.8, notes: 'Action-comedy film...' },
  { id: '2526bbf3-a8c0-4df8-9c26-67e54e88ee82', title: 'Sahaa', year: 2024, hero: 'Kumar Kasaaram', director: 'Nishanth Doti', tmdbRating: 5.5, notes: 'Rural action drama' },
  { id: '072c7874-a382-4808-8eb7-c8db98c77de2', title: 'Edhureetha', year: 2020, hero: 'Sravan Raghavendra', director: 'P. Balamurugan', tmdbRating: 6.2, notes: 'Heartfelt family entertainer' },
  { id: '9b7b604c-6907-4c79-bd7f-dd22d1a3f974', title: 'Devara: Part 2', year: 2026, hero: 'N. T. Rama Rao Jr.', director: 'Koratala Siva', notes: 'High-octane sequel (unreleased)' },
  { id: '4ecb9fda-2af1-4d4b-a558-a86735425de6', title: 'Reppa', year: 2024, hero: 'Suhas', director: 'Filmian', tmdbRating: 6.4, notes: 'Drama and fantasy film' },
  { id: '234da35c-e92e-44a6-99a2-916b40c02752', title: 'Magic', year: 2024, hero: 'Sara Arjun', director: 'Gowtam Tinnanuri', tmdbRating: 7.0, notes: 'Musical coming-of-age' },
  { id: '74bf13e0-bbe3-48de-8eae-3d9b9ba00c5c', title: 'Inner City Blues', year: 2024, hero: 'Laxman Meesala', director: 'Divya Bandaru', tmdbRating: 6.8, notes: 'Emotional indie drama' },
  
  // 2010s
  { id: 'd20403fb-8432-4565-85c4-961d128206cb', title: 'Shadow', year: 2013, hero: 'Venkatesh', director: 'Meher Ramesh', ourRating: 7, tmdbRating: 4.2, notes: 'Corrected title from "Well, if you know me"' },
  
  // 2000s
  { id: '092508fb-f084-443b-aa50-3c6d06b6ec12', title: 'Chennakeshava Reddy', year: 2002, hero: 'Nandamuri Balakrishna', director: 'V. V. Vinayak', ourRating: 7.8, tmdbRating: 6.7, notes: 'Action drama' },
  
  // 1990s
  { id: '95639c8c-fad3-4ef9-b2a3-0e1b06040346', title: 'Aaj Ka Goonda Raj', year: 1992, hero: 'Chiranjeevi', director: 'Ravi Raja Pinisetty', ourRating: 7.4, tmdbRating: 6.1, notes: 'Action remake of Chanti' },
  { id: '1d57f0ef-c4ed-4b34-b453-b608ce213ba3', title: 'Chaithanya', year: 1991, hero: 'Akkineni Nagarjuna', director: 'Prathap Pothan', ourRating: 7.4, tmdbRating: 6.5, notes: 'Road action movie' },
  
  // 1980s
  { id: '6212f700-84e3-4c84-bedc-570a48747a3d', title: 'Nizhal Thedum Nenjangal', year: 1982, hero: 'Rajinikanth', director: 'P. S. Nivas', ourRating: 8, tmdbRating: 7.1, notes: 'Emotional drama' },
  
  // 1970s
  { id: 'd230d639-8927-40d7-9889-79f95e18d21f', title: 'Sri Rambantu', year: 1979, hero: 'Chiranjeevi', director: 'Arudra', ourRating: 7.2, tmdbRating: 6.0, notes: 'Early career folk drama' },
  { id: '2d2300e8-75f4-40fa-9d89-11b728749949', title: 'Karunai Ullam', year: 1978, hero: 'Gemini Ganesan', director: 'A. Bhimsingh', ourRating: 7.7, tmdbRating: 6.9, notes: 'Classic Tamil drama' },
  { id: 'b7aad561-d88c-44b1-bd47-7076d669d0b5', title: 'Jeevana Theeralu', year: 1977, hero: 'Krishnam Raju', director: 'G. C. Sekhar', ourRating: 7.3, tmdbRating: 6.4, notes: 'Social drama' },
  { id: 'f0b669a6-227e-46c8-bdca-8778aef704d8', title: 'Bangaru Bommalu', year: 1977, hero: 'Akkineni Nageswara Rao', director: 'V. B. Rajendra Prasad', ourRating: 7.6, tmdbRating: 6.8, notes: 'Fixed title from "Q12982331"' },
  
  // 1970s continued
  { id: '2ced2102-12ab-4391-9e5b-40ae526c7b11', title: 'Amma Mata', year: 1972, hero: 'Sobhan Babu', director: 'V. Ramachandra Rao', ourRating: 7.4, tmdbRating: 6.2, notes: 'Family sentiment film' },
  { id: '1196ac9f-472a-446a-9f7b-41b8ad8bdb75', title: 'Iddaru Ammayilu', year: 1972, hero: 'Akkineni Nageswara Rao', director: 'Putanna Kanagal', ourRating: 7.5, tmdbRating: 7.2, notes: 'Romantic drama' },
  
  // 1960s
  { id: '5d98fdb3-4b6e-4037-a7ea-02794d6a00a4', title: 'Shri Krishnavataram', year: 1967, hero: 'N. T. Rama Rao', director: 'K. Kameswara Rao', ourRating: 8.1, tmdbRating: 8.2, notes: 'Mythological masterpiece' },
  { id: '2142390d-8c14-4236-9aae-eb20edaa95cd', title: 'Shri Krishna Pandaviyam', year: 1966, hero: 'N. T. Rama Rao', director: 'N. T. Rama Rao', ourRating: 8, tmdbRating: 8.3, notes: 'Directed by NTR himself' },
  { id: '3bbeed9a-30c4-458c-827a-11f4df9582c4', title: 'Poojaikku Vandha Malar', year: 1965, hero: 'Gemini Ganesan', director: 'Muktha Srinivasan', ourRating: 7.7, tmdbRating: 7.0, notes: 'Tamil romantic classic' },
  { id: '4bf8c217-ffe2-489d-809d-50a499ac3cd1', title: 'Kai Koduttha Dheivam', year: 1964, hero: 'Sivaji Ganesan', director: 'K. S. Gopalakrishnan', ourRating: 7.9, tmdbRating: 7.8, notes: 'Highly acclaimed drama' },
  { id: '7f0b003c-b15f-4087-9003-0efc1d959658', title: 'Paarthaal Pasi Theerum', year: 1962, hero: 'Sivaji Ganesan', director: 'A. Bhimsingh', ourRating: 8.2, tmdbRating: 7.9, notes: 'Multi-starrer classic' },
  
  // 1950s
  { id: 'aa6a8a7d-f47e-42a0-b938-3145ad479fb3', title: 'Kaathavaraayan', year: 1958, hero: 'Sivaji Ganesan', director: 'T. R. Ramanna', ourRating: 7.9, tmdbRating: 7.2, notes: 'Folklore adventure' },
  { id: '426e74fb-e35c-49c7-b5dd-ec88d9bd53c3', title: 'Padhi Bhakti', year: 1958, hero: 'Gemini Ganesan', director: 'A. Bhimsingh', ourRating: 7.8, tmdbRating: 7.4, notes: 'Social drama' },
  { id: 'f86df043-4436-46ee-a4b6-6889d3b29f2e', title: 'Pathini Deivam', year: 1957, hero: 'Gemini Ganesan', director: 'Ch. Narayana Murthy', ourRating: 7.7, tmdbRating: 6.8, notes: 'Classic family drama' },
  { id: '8892bf0a-d4fb-45c9-8cd6-5ca00fbdd80a', title: 'Bratuku Theruvu', year: 1953, hero: 'Akkineni Nageswara Rao', director: 'P. S. Ramakrishna Rao', ourRating: 7.6, tmdbRating: 7.5, notes: 'Early Telugu social classic' },
];

async function applyCorrections() {
  console.log('🚀 Applying Corrections to 29 Good Quality Movies...\n');
  console.log('='.repeat(80));
  
  const results = {
    fixed: [] as string[],
    published: [] as string[],
    skipped: [] as string[],
    errors: [] as { title: string; error: string }[],
  };
  
  for (const correction of corrections) {
    console.log(`\n📽️  Processing: ${correction.title} (${correction.year})`);
    console.log(`   ID: ${correction.id}`);
    
    try {
      // Prepare updates
      const updates: any = {
        title_en: correction.title,
        release_year: correction.year,
        hero: correction.hero,
        director: correction.director,
      };
      
      // Use either our_rating or tmdbRating for the rating field
      if (correction.ourRating) {
        updates.our_rating = correction.ourRating;
      } else if (correction.tmdbRating) {
        updates.our_rating = correction.tmdbRating;
      }
      
      // Apply updates
      const { error: updateError } = await supabase
        .from('movies')
        .update(updates)
        .eq('id', correction.id);
      
      if (updateError) {
        console.log(`   ❌ Update failed: ${updateError.message}`);
        results.errors.push({ title: correction.title, error: updateError.message });
        continue;
      }
      
      console.log(`   ✅ Updated: title, hero, director, ratings`);
      results.fixed.push(correction.title);
      
      // Publish the movie (unless it's Devara Part 2 - unreleased)
      if (correction.year <= 2024) {
        const { error: publishError } = await supabase
          .from('movies')
          .update({ is_published: true })
          .eq('id', correction.id);
        
        if (publishError) {
          console.log(`   ❌ Publish failed: ${publishError.message}`);
          results.errors.push({ title: correction.title, error: publishError.message });
          continue;
        }
        
        console.log(`   ✅ Published!`);
        results.published.push(correction.title);
      } else {
        console.log(`   ⏭️  Skipped publishing (unreleased film)`);
        results.skipped.push(correction.title);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
      results.errors.push({ title: correction.title, error: String(error) });
    }
  }
  
  // Final Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n✅ Fixed & Updated: ${results.fixed.length}`);
  if (results.fixed.length <= 10) {
    results.fixed.forEach(item => console.log(`   - ${item}`));
  } else {
    results.fixed.slice(0, 10).forEach(item => console.log(`   - ${item}`));
    console.log(`   ... and ${results.fixed.length - 10} more`);
  }
  
  console.log(`\n📢 Published: ${results.published.length}`);
  if (results.published.length <= 10) {
    results.published.forEach(item => console.log(`   - ${item}`));
  } else {
    results.published.slice(0, 10).forEach(item => console.log(`   - ${item}`));
    console.log(`   ... and ${results.published.length - 10} more`);
  }
  
  console.log(`\n⏭️  Skipped (Unreleased): ${results.skipped.length}`);
  results.skipped.forEach(item => console.log(`   - ${item}`));
  
  if (results.errors.length > 0) {
    console.log(`\n❌ Errors: ${results.errors.length}`);
    results.errors.forEach(item => console.log(`   - ${item.title}: ${item.error}`));
  }
  
  // Get final count
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
  
  // Era breakdown
  console.log('\n📅 Published Movies by Era:');
  const modern = results.published.filter(t => corrections.find(c => c.title === t)!.year >= 2020).length;
  const recent = results.published.filter(t => {
    const year = corrections.find(c => c.title === t)!.year;
    return year >= 2010 && year < 2020;
  }).length;
  const classic = results.published.filter(t => {
    const year = corrections.find(c => c.title === t)!.year;
    return year >= 1990 && year < 2010;
  }).length;
  const vintage = results.published.filter(t => corrections.find(c => c.title === t)!.year < 1990).length;
  
  console.log(`   2020-2024: ${modern} movies`);
  console.log(`   2010-2019: ${recent} movies`);
  console.log(`   1990-2009: ${classic} movies`);
  console.log(`   Pre-1990: ${vintage} movies (Vintage gems!)`);
  
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
