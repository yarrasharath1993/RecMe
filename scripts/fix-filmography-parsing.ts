/**
 * FIXED WIKIPEDIA FILMOGRAPHY PARSER
 * 
 * This is the corrected parsing function to replace the broken one
 * in automated-attribution-audit.ts
 */

// Improved parsing function - copy this into automated-attribution-audit.ts
export function parseFilmographyFromHtml(html: string, actorName: string): any[] {
  const movies: any[] = [];
  
  if (!html) return movies;
  
  // Look for Wikipedia filmography tables
  const tablePattern = /<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
  const tables = [...html.matchAll(tablePattern)];
  
  for (const tableMatch of tables) {
    const tableHtml = tableMatch[0];
    
    // Skip non-filmography tables
    const tableLower = tableHtml.toLowerCase();
    if (!tableLower.includes('film') && !tableLower.includes('year') && !tableLower.includes('title')) {
      continue;
    }
    
    // Extract all rows
    const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const rows = [...tableHtml.matchAll(rowPattern)];
    
    for (const rowMatch of rows) {
      const rowHtml = rowMatch[1];
      
      // Skip header rows
      if (rowHtml.includes('<th')) continue;
      
      // Extract all cells
      const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      const cells: string[] = [];
      let cellMatch;
      
      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        cells.push(cellMatch[1]);
      }
      
      if (cells.length < 2) continue;
      
      // Find year (usually in first 2-3 columns)
      let year = 0;
      let yearIndex = -1;
      
      for (let i = 0; i < Math.min(cells.length, 3); i++) {
        const cleanText = cells[i].replace(/<[^>]+>/g, '').trim();
        const yearMatch = cleanText.match(/\b(19\d{2}|20\d{2})\b/);
        if (yearMatch) {
          year = parseInt(yearMatch[1]);
          yearIndex = i;
          break;
        }
      }
      
      if (!year || year < 1900 || year > 2030) continue;
      
      // Find title (look for italic or linked text)
      let title = '';
      
      // Method 1: Find italicized title
      for (let i = 0; i < cells.length; i++) {
        if (i === yearIndex) continue;
        
        const italicMatch = cells[i].match(/<i[^>]*>([\s\S]*?)<\/i>/i);
        if (italicMatch) {
          const linkMatch = italicMatch[1].match(/<a[^>]*>([^<]+)<\/a>/i);
          title = linkMatch ? linkMatch[1] : italicMatch[1].replace(/<[^>]+>/g, '');
          break;
        }
      }
      
      // Method 2: Find any link after year
      if (!title) {
        for (let i = yearIndex + 1; i < cells.length; i++) {
          const linkMatch = cells[i].match(/<a[^>]*>([^<]+)<\/a>/i);
          if (linkMatch) {
            title = linkMatch[1];
            break;
          }
        }
      }
      
      // Method 3: Plain text after year
      if (!title && yearIndex + 1 < cells.length) {
        title = cells[yearIndex + 1].replace(/<[^>]+>/g, '').trim();
      }
      
      if (!title || title.length < 2) continue;
      
      // Clean title
      title = title
        .replace(/&#\d+;/g, '')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .trim();
      
      if (title.length > 100) continue;
      
      movies.push({ 
        title, 
        year, 
        role: 'Actor'
      });
    }
  }
  
  console.log(`Parsed ${movies.length} movies from HTML (${tables.length} tables found)`);
  return movies;
}
