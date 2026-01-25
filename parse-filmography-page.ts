import * as https from 'https';
import chalk from 'chalk';

async function parseFilmography(actorName: string): Promise<void> {
  // Try the dedicated filmography page first
  const filmographyTitle = `${actorName.replace(/\s+/g, '_')}_filmography`;
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${filmographyTitle}&prop=wikitext&format=json`;
  
  console.log(chalk.cyan(`\nParsing filmography for: ${actorName}\n`));
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'TeluguPortalBot/1.0 (https://teluguportal.com) Node.js',
      }
    };
    
    https.get(apiUrl, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          if (json.error) {
            console.log(chalk.red(`Error: ${json.error.info}`));
            resolve();
            return;
          }
          
          const wikitext = json.parse?.wikitext?.['*'];
          if (!wikitext) {
            console.log(chalk.red('No wikitext found'));
            resolve();
            return;
          }
          
          console.log(chalk.green(`✓ Got filmography page (${wikitext.length} chars)`));
          
          // Parse wikitables for movies
          const tablePattern = /\{\| class="wikitable[^}]+\|\}/gs;
          const tables = wikitext.match(tablePattern);
          
          if (tables) {
            console.log(chalk.green(`✓ Found ${tables.length} wikitables`));
            
            // Sample first table
            console.log(chalk.yellow('\nFirst table sample:'));
            console.log(tables[0].substring(0, 1000));
            
            // Parse movie entries from the table
            console.log(chalk.cyan('\nParsing movies from tables...'));
            
            let movieCount = 0;
            tables.forEach(table => {
              // Each row typically starts with |-
              const rows = table.split('|-').slice(1); // Skip header
              movieCount += rows.length;
              
              // Sample first few rows
              rows.slice(0, 3).forEach((row, i) => {
                console.log(chalk.gray(`\nRow ${i + 1}:`));
                console.log(row.substring(0, 300));
              });
            });
            
            console.log(chalk.green(`\n✓ Found approximately ${movieCount} movie entries`));
            
          } else {
            console.log(chalk.yellow('No wikitables found, trying list format...'));
            
            // Try list format
            const listPattern = /\*\s*''\[\[(.*?)\]\]''/g;
            const matches = [...wikitext.matchAll(listPattern)];
            
            if (matches.length > 0) {
              console.log(chalk.green(`✓ Found ${matches.length} movies in list format`));
              console.log(chalk.yellow('\nSample movies:'));
              matches.slice(0, 10).forEach(m => {
                console.log(chalk.gray(`  - ${m[1]}`));
              });
            }
          }
          
          resolve();
        } catch (error: any) {
          console.log(chalk.red(`Parse error: ${error.message}`));
          resolve();
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  await parseFilmography('Chiranjeevi');
  console.log(chalk.blue('\n' + '='.repeat(80)));
  await new Promise(r => setTimeout(r, 2000));
  await parseFilmography('Rajinikanth');
  console.log(chalk.blue('\n' + '='.repeat(80)));
  await new Promise(r => setTimeout(r, 2000));
  await parseFilmography('Prabhas');
}

main();
