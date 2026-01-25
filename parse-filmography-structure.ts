import * as https from 'https';
import chalk from 'chalk';

async function analyzeFilmography(actorName: string): Promise<void> {
  const url = `https://en.wikipedia.org/wiki/${actorName.replace(/\s+/g, '_')}`;
  
  console.log(chalk.cyan(`\nAnalyzing: ${actorName}\n`));
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'TeluguPortalBot/1.0 (https://teluguportal.com) Node.js',
        'Accept': 'text/html',
      }
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        console.log(chalk.red(`Failed: ${res.statusCode}`));
        resolve();
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // Find filmography section
        const filmIndex = data.search(/<span[^>]*id="Filmography"[^>]*>/i);
        if (filmIndex === -1) {
          console.log(chalk.red('No filmography section found'));
          resolve();
          return;
        }
        
        console.log(chalk.green(`✓ Found filmography section at ${filmIndex}`));
        
        // Extract next 10000 chars
        const section = data.substring(filmIndex, filmIndex + 10000);
        
        // Look for different structures
        console.log(chalk.cyan('\nStructure analysis:'));
        console.log(chalk.gray(`  Lists (<ul>): ${(section.match(/<ul/gi) || []).length}`));
        console.log(chalk.gray(`  Tables (<table>): ${(section.match(/<table/gi) || []).length}`));
        console.log(chalk.gray(`  Divs (<div>): ${(section.match(/<div[^>]*class="[^"]*navbox/gi) || []).length}`));
        
        // Look for the actual filmography content (usually comes after the heading)
        const afterHeading = section.substring(section.indexOf('</span>') + 7);
        const next2000 = afterHeading.substring(0, 2000);
        
        console.log(chalk.yellow('\nContent after "Filmography" heading (first 1000 chars):'));
        console.log(next2000.substring(0, 1000));
        
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  await analyzeFilmography('Chiranjeevi');
  console.log(chalk.blue('\n' + '='.repeat(80)));
  await new Promise(r => setTimeout(r, 2000));
  await analyzeFilmography('Rajinikanth');
}

main();
