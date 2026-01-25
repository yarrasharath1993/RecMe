/**
 * Slugify Utility
 * 
 * Generates URL-friendly slugs from names for profile page URLs.
 * 
 * Examples:
 * - "Akkineni Nagarjuna" -> "akkineni-nagarjuna"
 * - "S.S. Rajamouli" -> "ss-rajamouli"
 * - "Jr. NTR" -> "jr-ntr"
 * - "Allu Arjun" -> "allu-arjun"
 */

import slugifyLib from 'slugify';

/**
 * Generate a URL-friendly slug from a name
 * @param name - The name to slugify (e.g., "Akkineni Nagarjuna")
 * @returns URL-friendly slug (e.g., "akkineni-nagarjuna")
 */
export function slugify(name: string): string {
  if (!name) return '';
  
  return slugifyLib(name, {
    lower: true,      // Convert to lowercase
    strict: true,     // Strip special characters except dashes
    trim: true,       // Trim leading/trailing whitespace
    locale: 'en',     // Use English locale for transliteration
  });
}

/**
 * Generate a slug with year suffix for movie titles
 * @param title - Movie title
 * @param year - Release year
 * @returns Slug with year (e.g., "shiva-1989")
 */
export function slugifyWithYear(title: string, year: number): string {
  if (!title) return '';
  
  const baseSlug = slugify(title);
  return year ? `${baseSlug}-${year}` : baseSlug;
}

/**
 * Generate profile URL from a name
 * @param name - Person name
 * @returns Full profile URL path (e.g., "/movies?profile=akkineni-nagarjuna")
 */
export function getProfileUrl(name: string): string {
  return `/movies?profile=${slugify(name)}`;
}

/**
 * Normalize a name for database lookup
 * Useful when searching by slug to find matching names
 * @param slug - URL slug
 * @returns Normalized search pattern
 */
export function normalizeSlugForSearch(slug: string): string {
  // Convert slug back to searchable pattern
  // "akkineni-nagarjuna" -> "%akkineni%nagarjuna%"
  return `%${slug.replace(/-/g, '%')}%`;
}

export default slugify;
