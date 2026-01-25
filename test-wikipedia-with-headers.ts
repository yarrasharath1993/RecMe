import * as https from 'https';
import chalk from 'chalk';

async function fetchWikipedia(actorName: string): Promise<string> {
  const url = `https://en.wikipedia.org/wiki/${actorName.replace(/\s+/g, '_')}`;
  
  console.log(chalk.cyan(`\nFetching: ${url}\n`));
  
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'TeluguPortalBot/1.0 (https://teluguportal.com; contact@teluguportal.com) Node.js',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    };
    
    https.get(url, options, (res) => {
      console.log(chalk.yellow(`Status: ${res.statusCode}`));
      
      if (res.statusCode !== 200) {
        console.log(chalk.red(`Failed with status ${res.statusCode}`));
        resolve('');
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(chalk.green(`✓ Received ${data.length} bytes`));
        
        // Look for filmography section
        const filmographyIndex = data.search(/filmography/i);
        if (filmographyIndex > -1) {
          console.log(chalk.green(`✓ Found "Filmography" at position ${filmographyIndex}`));
          
          // Extract filmography section (next 5000 chars)
          const section = data.substring(filmographyIndex, filmographyIndex + 5000);
          
          // Count tables
          const tableCount = (section.match(/<table/gi) || []).length;
          console.log(chalk.cyan(`  Tables in section: ${tableCount}`));
          
          // Count rows
          const rowCount = (section.match(/<tr/gi) || []).length;
          console.log(chalk.cyan(`  Rows in section: ${rowCount}`));
          
          // Sample first table
          const firstTable = section.match(/<table[^>]*>[\s\S]*?<\/table>/i);
          if (firstTable) {
            console.log(chalk.gray('\nFirst table preview (500 chars):'));
            console.log(firstTable[0].substring(0, 500));
          }
        } else {
          console.log(chalk.yellow('⚠️  "Filmography" section not found'));
        }
        
        resolve(data);
      });
    }).on('error', (err) => {
      console.error(chalk.red(`Error: ${err.message}`));
      reject(err);
    });
  });
}

async function main() {
  const testActors = [
    'Chiranjeevi',
    'Prabhas'
  ];
  
  for (const actor of testActors) {
    await fetchWikipedia(actor);
    console.log(chalk.blue('\n' + '='.repeat(80) + '\n'));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

main();
