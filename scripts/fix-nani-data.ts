#!/usr/bin/env npx tsx
/**
 * Fix Nani filmography with reviewed data
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReviewedMovie {
  slug: string;
  cinematographer?: string;
  tmdb_id?: number;
  producer?: string;
  music_director?: string;
  heroine?: string;
  director?: string;
  editor?: string;
  writer?: string;
}

// Reviewed data from user
const reviewedData: ReviewedMovie[] = [
  { slug: "the-paradise-2026", cinematographer: "CH Sai", tmdb_id: 1376856 },
  { slug: "hit-the-third-case-2025", cinematographer: "Sanu John Varghese", tmdb_id: 1060046 },
  { slug: "saripodhaa-sanivaaram-2024", cinematographer: "G. Murali", producer: "DVV Danayya", tmdb_id: 1194915 },
  { slug: "hi-nanna-2023", cinematographer: "Sanu John Varghese", tmdb_id: 1068452 },
  { slug: "dasara-2023", cinematographer: "Sathyan Sooryan", tmdb_id: 885184 },
  { slug: "ante-sundaraniki-2022", cinematographer: "Niketh Bommireddy", tmdb_id: 834654 },
  { slug: "shyam-singha-roy-2021", cinematographer: "Sanu John Varghese", writer: "Satyadev Janga", tmdb_id: 799676 },
  { slug: "tuck-jagadish-2021", cinematographer: "Prasad Murella", tmdb_id: 784963 },
  { slug: "v-2020", cinematographer: "P. G. Vinda", tmdb_id: 683342 },
  { slug: "nanis-gang-leader-2019", cinematographer: "Miroslaw Kuba Brozek", producer: "Naveen Yerneni", tmdb_id: 612402 },
  { slug: "krishnarjuna-yuddham-2018", producer: "Sahu Garapati", tmdb_id: 493010 },
  { slug: "nenu-local-2017", cinematographer: "Nizar Shafi", writer: "Prasanna Kumar", tmdb_id: 439057 },
  { slug: "mca-2017", cinematographer: "Sameer Reddy", tmdb_id: 485869 },
  { slug: "ninnu-kori-2017", cinematographer: "Karthik Ghattamaneni", tmdb_id: 465099 },
  { slug: "gentleman-2016", cinematographer: "P. G. Vinda", music_director: "Mani Sharma", producer: "S. Krishna Prasad", tmdb_id: 400247 },
  { slug: "majnu-2016", cinematographer: "Gnana Shekar V.S.", producer: "Geetha Golla", tmdb_id: 409254 },
  { slug: "krishna-gaadi-veera-prema-gaadha-2016", cinematographer: "Yuvraj", writer: "Hanu Raghavapudi", tmdb_id: 384420 },
  { slug: "janda-pai-kapiraju-2015", cinematographer: "M. Sukumar", tmdb_id: 263995 },
  { slug: "yevade-subramanyam-2015", cinematographer: "Rakesh E", tmdb_id: 332831 },
  { slug: "paisa-2013", cinematographer: "Santosh Rai", editor: "S. Ravikanth", producer: "Ramesh Puppala", tmdb_id: 233633 },
  { slug: "yeto-vellipoyindhi-manasu-2012", cinematographer: "M. S. Prabhu", producer: "C. Kalyan", tmdb_id: 149262 },
  { slug: "pilla-zamindar-2011", cinematographer: "Sai Sriram", tmdb_id: 85818 },
  { slug: "ala-modalaindi-2011", cinematographer: "Arjun Jena", tmdb_id: 57010 },
  { slug: "bheemili-kabaddi-jattu-2010", heroine: "Saranya Mohan", writer: "Suseenthiran", tmdb_id: 200034 },
  { slug: "alasyam-amrutham-2010", director: "Chandra Mahesh", heroine: "Madalsa Sharma", writer: "Chandra Mahesh", producer: "D. Rama Naidu", tmdb_id: 241270 },
  { slug: "snehituda-2009", tmdb_id: 109369 },
  { slug: "ashta-chamma-2008", cinematographer: "P. G. Vinda", heroine: "Bhargavi", tmdb_id: 80889 },
];

async function updateAll() {
  console.log("═══════════════════════════════════════════════════════════════════════════════");
  console.log("UPDATING NANI FILMOGRAPHY - ALL REVIEWED DATA");
  console.log("═══════════════════════════════════════════════════════════════════════════════\n");

  let updated = 0;
  let errors = 0;

  for (const movie of reviewedData) {
    // Get current crew data
    const { data: current } = await supabase
      .from("movies")
      .select("crew")
      .eq("slug", movie.slug)
      .single();

    const updateData: Record<string, any> = {};
    
    if (movie.cinematographer) updateData.cinematographer = movie.cinematographer;
    if (movie.tmdb_id) updateData.tmdb_id = movie.tmdb_id;
    if (movie.producer) updateData.producer = movie.producer;
    if (movie.music_director) updateData.music_director = movie.music_director;
    if (movie.heroine) updateData.heroine = movie.heroine;
    if (movie.director) updateData.director = movie.director;
    
    // Handle crew fields (editor, writer)
    if (movie.editor || movie.writer) {
      const crew = current?.crew || {};
      if (movie.editor) crew.editor = movie.editor;
      if (movie.writer) crew.writer = movie.writer;
      updateData.crew = crew;
    }

    const { error } = await supabase
      .from("movies")
      .update(updateData)
      .eq("slug", movie.slug);

    if (error) {
      console.log(`  ✗ ${movie.slug}: ${error.message}`);
      errors++;
    } else {
      const fields = Object.keys(updateData).filter(k => k !== "crew");
      if (updateData.crew) {
        if (movie.editor) fields.push("editor");
        if (movie.writer) fields.push("writer");
      }
      console.log(`  ✓ ${movie.slug}: ${fields.join(", ")}`);
      updated++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════════════════════`);
  console.log(`SUMMARY: Updated ${updated}/${reviewedData.length} movies, ${errors} errors`);
  console.log(`═══════════════════════════════════════════════════════════════════════════════`);

  // Generate updated CSV
  console.log("\n📄 Generating updated filmography CSV...");
  
  const { data: movies } = await supabase
    .from("movies")
    .select("*")
    .ilike("hero", "%Nani%")
    .order("release_year", { ascending: false });

  if (movies) {
    const csvLines = [
      "Year,Title,Slug,Hero,Heroine,Director,Music Director,Cinematographer,Editor,Writer,Producer,TMDB ID,Genres"
    ];

    movies.forEach(m => {
      csvLines.push([
        m.release_year,
        `"${m.title_en}"`,
        m.slug,
        `"${m.hero || ""}"`,
        `"${m.heroine || ""}"`,
        `"${m.director || ""}"`,
        `"${m.music_director || ""}"`,
        `"${m.cinematographer || ""}"`,
        `"${m.crew?.editor || ""}"`,
        `"${m.crew?.writer || ""}"`,
        `"${m.producer || ""}"`,
        m.tmdb_id || "",
        `"${m.genres?.join("; ") || ""}"`
      ].join(","));
    });

    fs.writeFileSync("docs/nani-final-filmography.csv", csvLines.join("\n"));
    console.log("  ✓ Saved: docs/nani-final-filmography.csv");

    // Check for remaining missing fields
    const missing: string[] = [];
    movies.forEach(m => {
      const fields: string[] = [];
      if (!m.cinematographer) fields.push("cinematographer");
      if (!m.tmdb_id) fields.push("tmdb_id");
      if (!m.producer) fields.push("producer");
      if (fields.length > 0) {
        missing.push(`${m.title_en} (${m.release_year}): ${fields.join(", ")}`);
      }
    });

    // Update anomalies CSV
    if (missing.length === 0) {
      fs.writeFileSync("docs/nani-anomalies.csv", "Type,Movie,Year,Field,Current Value,Suggested Value,Confidence,Details,Action\n");
      console.log("  ✓ Cleared: docs/nani-anomalies.csv (no anomalies!)");
    } else {
      console.log("\n⚠️  Remaining missing fields:");
      missing.forEach(m => console.log("  " + m));
    }

    // Final stats
    const complete = movies.filter(m => 
      m.cinematographer && m.tmdb_id && m.producer && m.director && m.heroine && m.music_director
    ).length;
    
    console.log(`\n✅ NANI FILMOGRAPHY: ${movies.length} films, ${complete} complete records`);
  }
}

updateAll().catch(console.error);
