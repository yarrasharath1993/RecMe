/**
 * CSV WRITER - Unified CSV Export Utility
 * 
 * Handles CSV file generation for all audit reports with:
 * - Proper escaping of special characters
 * - Consistent formatting
 * - Type-safe row definitions
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// CSV ESCAPING & FORMATTING
// ============================================================

/**
 * Escape a value for CSV output
 * Handles quotes, commas, newlines
 */
export function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Convert to string
  let str = String(value);

  // Remove any existing quotes and escape internal quotes
  str = str.replace(/"/g, '""');

  // Wrap in quotes if contains special characters
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = `"${str}"`;
  }

  return str;
}

/**
 * Convert a row object to CSV line
 */
export function rowToCSV(row: Record<string, any>): string {
  return Object.values(row).map(escapeCsvValue).join(',');
}

/**
 * Convert headers array to CSV line
 */
export function headersToCSV(headers: string[]): string {
  return headers.map(escapeCsvValue).join(',');
}

// ============================================================
// FILE WRITING
// ============================================================

export interface CsvWriterOptions {
  outputDir: string;
  filename: string;
  headers: string[];
  append?: boolean;
}

/**
 * Write CSV file with headers and rows
 */
export function writeCSV(
  options: CsvWriterOptions,
  rows: Record<string, any>[]
): void {
  const { outputDir, filename, headers, append = false } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, filename);

  // Generate CSV content
  const lines: string[] = [];

  // Add headers if not appending or file doesn't exist
  if (!append || !fs.existsSync(filePath)) {
    lines.push(headersToCSV(headers));
  }

  // Add rows
  for (const row of rows) {
    lines.push(rowToCSV(row));
  }

  const content = lines.join('\n') + '\n';

  // Write or append to file
  if (append && fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, content, 'utf-8');
  } else {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
}

/**
 * Write CSV with streaming for large datasets
 * Useful for processing millions of rows
 */
export class StreamingCsvWriter {
  private stream: fs.WriteStream;
  private headerWritten: boolean = false;

  constructor(
    private outputPath: string,
    private headers: string[]
  ) {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.stream = fs.createWriteStream(outputPath, { flags: 'w', encoding: 'utf-8' });
  }

  /**
   * Write a single row
   */
  writeRow(row: Record<string, any>): void {
    if (!this.headerWritten) {
      this.stream.write(headersToCSV(this.headers) + '\n');
      this.headerWritten = true;
    }

    this.stream.write(rowToCSV(row) + '\n');
  }

  /**
   * Write multiple rows
   */
  writeRows(rows: Record<string, any>[]): void {
    for (const row of rows) {
      this.writeRow(row);
    }
  }

  /**
   * Close the stream
   */
  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.stream.end(() => resolve());
      this.stream.on('error', reject);
    });
  }
}

// ============================================================
// SPECIALIZED FORMATTERS
// ============================================================

/**
 * Format movie data for CSV export
 */
export function formatMovieForCSV(movie: {
  id: string;
  title_en: string;
  title_te?: string | null;
  release_year?: number | null;
  slug?: string;
  director?: string | null;
  hero?: string | null;
  heroine?: string | null;
  [key: string]: any;
}): Record<string, any> {
  return {
    id: movie.id,
    title_en: movie.title_en || '',
    title_te: movie.title_te || '',
    year: movie.release_year || '',
    slug: movie.slug || '',
    director: movie.director || '',
    hero: movie.hero || '',
    heroine: movie.heroine || '',
  };
}

/**
 * Format array field for CSV (convert to semicolon-separated)
 */
export function formatArrayField(arr: any[] | null | undefined): string {
  if (!arr || arr.length === 0) return '';
  return arr.join(';');
}

/**
 * Format date for CSV
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Format confidence score (0-1) as percentage
 */
export function formatConfidence(confidence: number | null | undefined): string {
  if (confidence === null || confidence === undefined) return '';
  return `${(confidence * 100).toFixed(1)}%`;
}

// ============================================================
// BATCH WRITING UTILITIES
// ============================================================

export interface BatchWriteConfig {
  outputDir: string;
  batchSize?: number;
}

/**
 * Write multiple CSV files in batch
 * Useful for generating all audit reports at once
 */
export function writeBatchCSV(
  config: BatchWriteConfig,
  reports: Array<{
    filename: string;
    headers: string[];
    rows: Record<string, any>[];
  }>
): { success: number; failed: number; details: Array<{ filename: string; status: 'success' | 'error'; error?: string }> } {
  const results = {
    success: 0,
    failed: 0,
    details: [] as Array<{ filename: string; status: 'success' | 'error'; error?: string }>,
  };

  for (const report of reports) {
    try {
      writeCSV(
        {
          outputDir: config.outputDir,
          filename: report.filename,
          headers: report.headers,
        },
        report.rows
      );
      results.success++;
      results.details.push({ filename: report.filename, status: 'success' });
    } catch (error) {
      results.failed++;
      results.details.push({
        filename: report.filename,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return results;
}

/**
 * Append summary statistics to CSV file
 */
export function appendSummaryToCSV(
  filePath: string,
  summary: Record<string, any>
): void {
  const summaryLines = [
    '',
    '--- SUMMARY ---',
    ...Object.entries(summary).map(([key, value]) => `${key},${value}`),
  ];

  fs.appendFileSync(filePath, summaryLines.join('\n') + '\n', 'utf-8');
}
