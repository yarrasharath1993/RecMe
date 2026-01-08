/**
 * ATTRIBUTION GENERATOR - Proper Source Attribution
 * 
 * Generates proper attributions for content from various sources:
 * - License-compliant attribution text
 * - HTML/Markdown formatted attributions
 * - Page-level attribution aggregation
 * - Archival source integration
 */

import type {
  ComplianceDataSource,
  LicenseType,
  Attribution,
} from './types';
import { LICENSES } from './types';
import { SOURCE_CONFIGS } from './safe-fetcher';
import { KNOWN_SOURCES, type KnownArchivalSource } from '@/lib/visual-intelligence/archival-sources';

// ============================================================
// TYPES
// ============================================================

export interface ContentAttribution {
  contentType: 'image' | 'text' | 'data' | 'video' | 'audio' | 'mixed';
  source: ComplianceDataSource | string;
  sourceName: string;
  sourceUrl: string;
  license: LicenseType;
  attribution: Attribution;
  fetchedAt: string;
  notes?: string;
}

export interface PageAttributions {
  pageTitle: string;
  pageUrl: string;
  generatedAt: string;
  attributions: ContentAttribution[];
  summary: {
    totalSources: number;
    uniqueLicenses: LicenseType[];
    requiresAttribution: boolean;
    commerciallyUsable: boolean;
  };
  footerText: string;
  footerHtml: string;
}

// ============================================================
// ATTRIBUTION GENERATOR CLASS
// ============================================================

export class AttributionGenerator {
  /**
   * Generate attribution for a single source
   */
  generateAttribution(
    source: ComplianceDataSource | string,
    contentUrl: string,
    options?: {
      contentType?: ContentAttribution['contentType'];
      customLicense?: LicenseType;
      customSourceName?: string;
      notes?: string;
    }
  ): ContentAttribution {
    // Try to get source config
    const sourceConfig = SOURCE_CONFIGS[source as ComplianceDataSource];
    
    // Try to find archival source
    const archivalSource = KNOWN_SOURCES.find(s => s.code === source);
    
    // Determine license
    let license: LicenseType = options?.customLicense || 'unknown';
    if (!options?.customLicense) {
      if (sourceConfig) {
        license = sourceConfig.defaultLicense;
      } else if (archivalSource) {
        license = archivalSource.typicalLicense as LicenseType;
      }
    }

    const licenseInfo = LICENSES[license];
    
    // Determine source name
    const sourceName = options?.customSourceName 
      || sourceConfig?.name 
      || archivalSource?.name 
      || String(source);

    // Determine source website
    const sourceWebsite = sourceConfig?.website 
      || archivalSource?.website 
      || '';

    // Build attribution text
    const attributionText = this.buildAttributionText(sourceName, license, licenseInfo.requiresAttribution);
    const attributionHtml = this.buildAttributionHtml(sourceName, contentUrl, license);
    const attributionMarkdown = this.buildAttributionMarkdown(sourceName, contentUrl, license);

    return {
      contentType: options?.contentType || 'data',
      source: source as ComplianceDataSource,
      sourceName,
      sourceUrl: contentUrl || sourceWebsite,
      license,
      attribution: {
        text: attributionText,
        html: attributionHtml,
        markdown: attributionMarkdown,
        license,
        sourceUrl: contentUrl || sourceWebsite,
        sourceName,
        requiresLink: licenseInfo.requiresAttribution,
        fetchedAt: new Date().toISOString(),
      },
      fetchedAt: new Date().toISOString(),
      notes: options?.notes,
    };
  }

  /**
   * Generate attributions for a movie page
   */
  generateMoviePageAttributions(
    movieTitle: string,
    movieUrl: string,
    sources: Array<{
      source: ComplianceDataSource | string;
      url: string;
      contentType?: ContentAttribution['contentType'];
      field?: string;
      license?: LicenseType;
    }>
  ): PageAttributions {
    const attributions: ContentAttribution[] = [];
    const uniqueLicenses = new Set<LicenseType>();
    let requiresAttribution = false;
    let commerciallyUsable = true;

    for (const src of sources) {
      const attribution = this.generateAttribution(src.source, src.url, {
        contentType: src.contentType,
        customLicense: src.license,
        notes: src.field ? `Used for: ${src.field}` : undefined,
      });

      attributions.push(attribution);
      uniqueLicenses.add(attribution.license);

      const licenseInfo = LICENSES[attribution.license];
      if (licenseInfo.requiresAttribution) {
        requiresAttribution = true;
      }
      if (!licenseInfo.allowCommercial) {
        commerciallyUsable = false;
      }
    }

    // Deduplicate attributions by source
    const uniqueAttributions = this.deduplicateAttributions(attributions);

    // Generate footer text
    const footerText = this.generateFooterText(uniqueAttributions);
    const footerHtml = this.generateFooterHtml(uniqueAttributions);

    return {
      pageTitle: movieTitle,
      pageUrl: movieUrl,
      generatedAt: new Date().toISOString(),
      attributions: uniqueAttributions,
      summary: {
        totalSources: uniqueAttributions.length,
        uniqueLicenses: Array.from(uniqueLicenses),
        requiresAttribution,
        commerciallyUsable,
      },
      footerText,
      footerHtml,
    };
  }

  /**
   * Generate attribution for archival images
   */
  generateArchivalAttribution(
    archivalCode: string,
    imageUrl: string,
    metadata?: {
      title?: string;
      year?: number;
      photographer?: string;
      collection?: string;
    }
  ): ContentAttribution {
    const archivalSource = KNOWN_SOURCES.find(s => s.code === archivalCode);
    
    if (!archivalSource) {
      // Unknown archival source
      return this.generateAttribution(archivalCode, imageUrl, {
        contentType: 'image',
        notes: metadata?.title,
      });
    }

    // Build detailed archival attribution
    let notes = '';
    if (metadata?.title) notes += metadata.title;
    if (metadata?.year) notes += ` (${metadata.year})`;
    if (metadata?.photographer) notes += ` - Photo: ${metadata.photographer}`;
    if (metadata?.collection) notes += ` - Collection: ${metadata.collection}`;

    const license = archivalSource.typicalLicense as LicenseType;
    const licenseInfo = LICENSES[license];

    // Build special archival attribution text
    let attributionText = `Image: ${archivalSource.name}`;
    if (archivalSource.typicalLicense === 'public_domain') {
      attributionText += ' (Public Domain)';
    } else if (archivalSource.typicalLicense === 'archive_license') {
      attributionText += ' - Used with permission';
    } else {
      attributionText += ` (${licenseInfo.name})`;
    }

    return {
      contentType: 'image',
      source: archivalCode as ComplianceDataSource,
      sourceName: archivalSource.name,
      sourceUrl: archivalSource.website || imageUrl,
      license,
      attribution: {
        text: attributionText,
        html: `<span class="attribution archival">Image: <a href="${archivalSource.website || imageUrl}" target="_blank" rel="noopener">${archivalSource.name}</a> (${licenseInfo.name})</span>`,
        markdown: `Image: [${archivalSource.name}](${archivalSource.website || imageUrl}) (${licenseInfo.name})`,
        license,
        sourceUrl: archivalSource.website || imageUrl,
        sourceName: archivalSource.name,
        requiresLink: licenseInfo.requiresAttribution,
        fetchedAt: new Date().toISOString(),
      },
      fetchedAt: new Date().toISOString(),
      notes: notes || undefined,
    };
  }

  /**
   * Generate TMDB attribution (required by their ToS)
   */
  generateTMDBAttribution(): ContentAttribution {
    return {
      contentType: 'data',
      source: 'tmdb',
      sourceName: 'The Movie Database (TMDB)',
      sourceUrl: 'https://www.themoviedb.org',
      license: 'api_terms',
      attribution: {
        text: 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
        html: '<span class="attribution tmdb">This product uses the <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a> API but is not endorsed or certified by TMDB.</span>',
        markdown: 'This product uses the [TMDB](https://www.themoviedb.org) API but is not endorsed or certified by TMDB.',
        license: 'api_terms',
        sourceUrl: 'https://www.themoviedb.org',
        sourceName: 'TMDB',
        requiresLink: true,
        fetchedAt: new Date().toISOString(),
      },
      fetchedAt: new Date().toISOString(),
      notes: 'Required attribution per TMDB Terms of Service',
    };
  }

  /**
   * Generate Wikipedia/Wikidata attribution (CC-BY-SA)
   */
  generateWikipediaAttribution(articleUrl: string): ContentAttribution {
    return {
      contentType: 'text',
      source: 'wikipedia',
      sourceName: 'Wikipedia',
      sourceUrl: articleUrl,
      license: 'CC-BY-SA',
      attribution: {
        text: 'Content from Wikipedia, licensed under CC BY-SA 4.0',
        html: `<span class="attribution wikipedia">Content from <a href="${articleUrl}" target="_blank" rel="noopener">Wikipedia</a>, licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a></span>`,
        markdown: `Content from [Wikipedia](${articleUrl}), licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)`,
        license: 'CC-BY-SA',
        sourceUrl: articleUrl,
        sourceName: 'Wikipedia',
        requiresLink: true,
        fetchedAt: new Date().toISOString(),
      },
      fetchedAt: new Date().toISOString(),
    };
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private buildAttributionText(sourceName: string, license: LicenseType, requiresAttribution: boolean): string {
    if (!requiresAttribution) {
      return `Source: ${sourceName}`;
    }
    
    const licenseInfo = LICENSES[license];
    return `Source: ${sourceName} (${licenseInfo.name})`;
  }

  private buildAttributionHtml(sourceName: string, url: string, license: LicenseType): string {
    const licenseInfo = LICENSES[license];
    const linkHtml = url 
      ? `<a href="${url}" target="_blank" rel="noopener">${sourceName}</a>`
      : sourceName;
    
    return `<span class="attribution">Source: ${linkHtml} (${licenseInfo.name})</span>`;
  }

  private buildAttributionMarkdown(sourceName: string, url: string, license: LicenseType): string {
    const licenseInfo = LICENSES[license];
    const link = url ? `[${sourceName}](${url})` : sourceName;
    
    return `Source: ${link} (${licenseInfo.name})`;
  }

  private deduplicateAttributions(attributions: ContentAttribution[]): ContentAttribution[] {
    const seen = new Map<string, ContentAttribution>();
    
    for (const attr of attributions) {
      const key = `${attr.source}-${attr.license}`;
      if (!seen.has(key)) {
        seen.set(key, attr);
      }
    }
    
    return Array.from(seen.values());
  }

  private generateFooterText(attributions: ContentAttribution[]): string {
    if (attributions.length === 0) {
      return '';
    }

    const sources = attributions.map(a => a.sourceName);
    const uniqueSources = [...new Set(sources)];

    if (uniqueSources.length === 1) {
      return `Data provided by ${uniqueSources[0]}`;
    }

    if (uniqueSources.length <= 3) {
      const last = uniqueSources.pop();
      return `Data provided by ${uniqueSources.join(', ')} and ${last}`;
    }

    return `Data provided by ${uniqueSources.slice(0, 2).join(', ')} and ${uniqueSources.length - 2} other sources`;
  }

  private generateFooterHtml(attributions: ContentAttribution[]): string {
    if (attributions.length === 0) {
      return '';
    }

    const sourceLinks = attributions.map(a => {
      if (a.sourceUrl) {
        return `<a href="${a.sourceUrl}" target="_blank" rel="noopener">${a.sourceName}</a>`;
      }
      return a.sourceName;
    });

    const uniqueLinks = [...new Set(sourceLinks)];

    return `<footer class="attributions">Data provided by ${uniqueLinks.join(', ')}</footer>`;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const attributionGenerator = new AttributionGenerator();

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export function generateAttribution(
  source: ComplianceDataSource | string,
  url: string,
  options?: {
    contentType?: ContentAttribution['contentType'];
    customLicense?: LicenseType;
    customSourceName?: string;
  }
): ContentAttribution {
  return attributionGenerator.generateAttribution(source, url, options);
}

export function generateMovieAttributions(
  movieTitle: string,
  movieUrl: string,
  sources: Array<{
    source: ComplianceDataSource | string;
    url: string;
    contentType?: ContentAttribution['contentType'];
    field?: string;
    license?: LicenseType;
  }>
): PageAttributions {
  return attributionGenerator.generateMoviePageAttributions(movieTitle, movieUrl, sources);
}

export function generateArchivalAttribution(
  archivalCode: string,
  imageUrl: string,
  metadata?: {
    title?: string;
    year?: number;
    photographer?: string;
    collection?: string;
  }
): ContentAttribution {
  return attributionGenerator.generateArchivalAttribution(archivalCode, imageUrl, metadata);
}

