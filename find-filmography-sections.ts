import * as https from 'https';
import chalk from 'chalk';

async function findSections(actorName: string): Promise<void> {
  const url = `https://en.wikipedia.org/wiki/${actorName.replace(/\s+/g, '_')}`;
  
  console.log(chalk.cyan(`\nSearching: ${actorName}\n`));
  
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
        // Find all section headings
        const h2Pattern = /<h2[^>]*>.*?<span[^>]*id="([^"]*)"[^>]*>(.*?)<\/span>.*?<\/h2>/gi;
        const h3Pattern = /<h3[^>]*>.*?<span[^>]*id="([^"]*)"[^>]*>(.*?)<\/span>.*?<\/h3>/gi;
        
        console.log(chalk.yellow('H2 Sections:'));
        let match;
        while ((match = h2Pattern.exec(data)) !== null) {
          const id = match[1];
          const text = match[2].replace(/<[^>]*>/g, '');
          if (text.toLowerCase().includes('film') || text.toLowerCase().includes('career') || 
              text.toLowerCase().includes('work') || text.toLowerCase().includes('acting')) {
            console.log(chalk.green(`  ✓ ${id}: ${text}`));
          } else {
            console.log(chalk.gray(`    ${id}: ${text}`));
          }
        }
        
        console.log(chalk.yellow('\nH3 Sections:'));
        while ((match = h3Pattern.exec(data)) !== null) {
          const id = match[1];
          const text = match[2].replace(/<[^>]*>/g, '');
          if (text.toLowerCase().includes('film') || text.toLowerCase().includes('career')) {
            console.log(chalk.green(`  ✓ ${id}: ${text}`));
          }
        }
        
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  await findSections('Chiranjeevi');
  console.log(chalk.blue('\n' + '='.repeat(80)));
  await new Promise(r => setTimeout(r, 2000));
  await findSections('Rajinikanth');
}

main();
