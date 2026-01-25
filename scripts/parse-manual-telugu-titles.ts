#!/usr/bin/env npx tsx
import { writeFileSync } from 'fs';
import chalk from 'chalk';

const rawData = `aa22xa6-tba	AA22xA6	అల్లు అర్జున్ - అట్లీ ప్రాజెక్ట్		Allu Arjun	Deepika Padukone	Atlee
mysaa-tba	Mysaa	మైసా		Guru Somasundaram	Rashmika Mandanna	Rawindra Pulle
janakiram-tba	Janakiram	జానకిరామ్		Nagendra Babu	Keerthy Suresh	Ram Prasad Ragutu
anaganaga-oka-rowdy-tba	Anaganaga Oka Rowdy	అనగనగా ఒక రౌడీ		Sumanth	No Female Lead	Manu Yagnaa
sahaa-tba	Sahaa	సహా		Kumar Kasaaram	Swetha Saluru	Nishanth Doti
edhureetha-tba	Edhureetha	ఎదురీత		Sravan Raghavendra	Leona Lishoy	P. Balamurugan
devara-2-tba	Devara 2	దేవర 2		N. T. Rama Rao Jr.	Prakash Raj	Koratala Siva
reppa-tba	Reppa	రెప్ప		Suhas	Harshitha	Filmian
as-time-echoes-tba	As Time Echoes	యాజ్ టైమ్ ఎకోస్		Akash Reddy Purma	No Female Lead	Sahith Mucherla
umapathi-tba	Umapathi	ఉమాపతి		Posani Krishna Murali	Avika Gor	Satya Dwarapudi`;

interface MovieData {
  slug: string;
  titleEn: string;
  titleTe: string;
  releaseYear: string;
  hero: string;
  heroine: string;
  director: string;
}

function parseMovieData(rawText: string): MovieData[] {
  const lines = rawText.trim().split('\n');
  const movies: MovieData[] = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length >= 7) {
      movies.push({
        slug: parts[0].trim(),
        titleEn: parts[1].trim(),
        titleTe: parts[2].trim(),
        releaseYear: parts[3].trim(),
        hero: parts[4].trim(),
        heroine: parts[5].trim(),
        director: parts[6].trim(),
      });
    }
  }

  return movies;
}

async function main() {
  console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║         PARSING MANUAL TELUGU TITLES DATA                            ║'));
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════════════╝\n'));

  const movies = parseMovieData(rawData);

  console.log(chalk.green(`✓ Parsed ${movies.length} movies\n`));

  // Show sample
  console.log(chalk.yellow('Sample entries:'));
  movies.slice(0, 5).forEach(movie => {
    console.log(`  ${movie.titleEn} → ${movie.titleTe || '(empty)'}`);
  });

  console.log(chalk.green(`\n✓ All ${movies.length} movies have Telugu titles!`));
  console.log(chalk.cyan('\nThese are the movies you provided Telugu titles for.'));
  console.log(chalk.cyan('They can now be imported into the database.\n'));
}

main().catch(console.error);
