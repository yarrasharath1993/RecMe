import * as https from 'https';
import chalk from 'chalk';

async function getWikipediaContent(actorName: string): Promise<void> {
  // Use Wikipedia API to get page content
  const title = actorName.replace(/\s+/g, '_');
  const apiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${title}&prop=wikitext&format=json`;
  
  console.log(chalk.cyan(`\nFetching via API: ${actorName}\n`));
  
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
          
          console.log(chalk.green(`✓ Got wikitext (${wikitext.length} chars)`));
          
          // Look for filmography section
          const filmIndex = wikitext.search(/==\s*filmography\s*==/i);
          if (filmIndex > -1) {
            console.log(chalk.green(`✓ Found filmography section at ${filmIndex}`));
            
            const section = wikitext.substring(filmIndex, filmIndex + 3000);
            console.log(chalk.yellow('\nFilmography section:'));
            console.log(section.substring(0, 1500));
          } else {
            console.log(chalk.yellow('⚠️  No "Filmography" section found'));
            
            // Look for alternative sections
            console.log(chalk.cyan('\nSearching for alternative sections:'));
            const patterns = [
              /==\s*films?\s*==/i,
              /==\s*acting\s+career\s*==/i,
              /==\s*career\s*==/i,
              /===\s*films?\s*===/i
            ];
            
            patterns.forEach((pattern, i) => {
              const match = wikitext.match(pattern);
              if (match) {
                console.log(chalk.green(`  ✓ Pattern ${i+1} matched: ${match[0]}`));
              }
            });
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
  await getWikipediaContent('Chiranjeevi');
  console.log(chalk.blue('\n' + '='.repeat(80)));
  await new Promise(r => setTimeout(r, 2000));
  await getWikipediaContent('Rajinikanth');
}

main();
