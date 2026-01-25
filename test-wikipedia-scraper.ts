import * as https from 'https';
import chalk from 'chalk';

async function fetchWikipedia(actorName: string): Promise<void> {
  const url = `https://en.wikipedia.org/wiki/${actorName.replace(/\s+/g, '_')}`;
  
  console.log(chalk.cyan(`\nFetching: ${url}\n`));
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      console.log(chalk.yellow(`Status: ${res.statusCode}`));
      console.log(chalk.yellow(`Headers: ${JSON.stringify(res.headers, null, 2)}\n`));
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(chalk.green(`Received ${data.length} bytes`));
        
        // Check for filmography sections
        const patterns = [
          /filmography/gi,
          /<h2[^>]*>.*?films?.*?<\/h2>/gi,
          /<h3[^>]*>.*?films?.*?<\/h3>/gi,
          /acting.*?career/gi
        ];
        
        console.log(chalk.cyan('\nSearching for filmography sections:\n'));
        patterns.forEach((pattern, i) => {
          const matches = data.match(pattern);
          console.log(chalk.gray(`Pattern ${i+1}: ${matches ? matches.length + ' matches' : 'No matches'}`));
          if (matches && matches.length > 0) {
            console.log(chalk.green(`  Sample: ${matches[0].substring(0, 100)}`));
          }
        });
        
        // Look for table structure
        const tableMatches = data.match(/<table[^>]*>/gi);
        console.log(chalk.cyan(`\nFound ${tableMatches ? tableMatches.length : 0} tables`));
        
        // Sample the first 2000 chars after "Filmography" if found
        const filmographyIndex = data.search(/filmography/i);
        if (filmographyIndex > -1) {
          console.log(chalk.green(`\nFound "Filmography" at position ${filmographyIndex}`));
          const sample = data.substring(filmographyIndex, filmographyIndex + 2000);
          console.log(chalk.gray('\nSample content:'));
          console.log(sample.substring(0, 500));
        } else {
          console.log(chalk.red('\n"Filmography" section NOT found'));
        }
        
        resolve();
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
    'Prabhas',
    'Allu_Arjun',
    'Mahesh_Babu'
  ];
  
  for (const actor of testActors) {
    await fetchWikipedia(actor);
    console.log(chalk.blue('\n' + '='.repeat(60) + '\n'));
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main();
