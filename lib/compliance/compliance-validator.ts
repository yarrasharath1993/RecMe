/**
 * COMPLIANCE VALIDATOR - License and Privacy Checks
 * 
 * Validates content usage rights and privacy concerns:
 * - License validation (CC, public domain, fair use)
 * - Privacy checks (PII detection)
 * - Content safety integration
 * - Usage rights verification
 */

import type {
  LicenseType,
  License,
  UsageValidation,
  PrivacyCheck,
  PrivacyFlag,
  ContentSafetyResult,
  ContentFlag,
  Attribution,
  ComplianceDataSource,
} from './types';
import { LICENSES } from './types';
import { SOURCE_CONFIGS, SafeFetcher } from './safe-fetcher';

// ============================================================
// PRIVACY DETECTION PATTERNS
// ============================================================

const PII_PATTERNS = {
  // Email addresses
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
  
  // Phone numbers (Indian format)
  phone: /(?:\+91[\s-]?)?[6-9]\d{9}|\d{10}/g,
  
  // Aadhaar numbers (12 digits)
  aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
  
  // PAN numbers (Indian)
  pan: /[A-Z]{5}\d{4}[A-Z]/g,
  
  // Credit card numbers
  creditCard: /\b(?:\d{4}[\s-]?){3}\d{4}\b/g,
  
  // Bank account numbers (generic)
  bankAccount: /\b\d{9,18}\b/g,
  
  // IP addresses
  ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
  
  // Physical addresses (India)
  address: /(?:flat|house|door|plot|no\.?)\s*[:\s#-]?\s*\d+[a-z]?[\s,]+/gi,
  
  // Pincode (India)
  pincode: /\b[1-9]\d{5}\b/g,
};

const SENSITIVE_PATTERNS = {
  // Political affiliations
  political: /(?:bjp|congress|tdp|ysrcp|trs|brs|janasena|aam aadmi|communist|rss|vhp)\b/gi,
  
  // Religious references
  religious: /(?:hindu|muslim|christian|sikh|buddhist|jain|temple|mosque|church|gurudwara)\b/gi,
  
  // Caste references
  caste: /(?:brahmin|kshatriya|dalit|scheduled caste|sc\/st|obc|bc|forward caste|backward caste)\b/gi,
  
  // Health information
  health: /(?:hiv|aids|cancer|diabetes|mental illness|depression|disability|pregnant|abortion)\b/gi,
  
  // Minor indicators
  minor: /(?:child|minor|underage|teenage|school student|kid)\s+(?:actor|actress|star)/gi,
};

// ============================================================
// COMPLIANCE VALIDATOR CLASS
// ============================================================

export class ComplianceValidator {
  /**
   * Validate if content can be used based on license
   */
  validateUsage(
    content: {
      source: ComplianceDataSource;
      url: string;
      license?: LicenseType;
      purpose?: 'display' | 'commercial' | 'modification' | 'redistribution';
    }
  ): UsageValidation {
    const sourceConfig = SOURCE_CONFIGS[content.source];
    const license = content.license || sourceConfig?.defaultLicense || 'unknown';
    const licenseInfo = LICENSES[license];
    const purpose = content.purpose || 'display';

    const warnings: string[] = [];
    const restrictions: string[] = [...licenseInfo.restrictions];
    let canUse = true;

    // Check commercial use
    if (purpose === 'commercial' && !licenseInfo.allowCommercial) {
      canUse = false;
      warnings.push(`License ${license} does not allow commercial use`);
    }

    // Check modification
    if (purpose === 'modification' && !licenseInfo.allowModification) {
      canUse = false;
      warnings.push(`License ${license} does not allow modification`);
    }

    // Check redistribution
    if (purpose === 'redistribution') {
      if (licenseInfo.shareAlike) {
        restrictions.push('Must redistribute under same license');
      }
    }

    // Unknown license = be cautious
    if (license === 'unknown') {
      warnings.push('License unknown - treating as restricted');
      restrictions.push('Verify license before commercial use');
    }

    // Fair use warnings
    if (license === 'fair_use') {
      warnings.push('Fair use applies only for commentary/education/criticism');
      restrictions.push('Keep usage minimal and transformative');
    }

    // Generate attribution
    const attribution: Attribution | null = licenseInfo.requiresAttribution
      ? {
          text: `Source: ${sourceConfig?.name || content.source} (${licenseInfo.name})`,
          html: `<span class="attribution">Source: <a href="${content.url}">${sourceConfig?.name || content.source}</a> (${licenseInfo.name})</span>`,
          markdown: `Source: [${sourceConfig?.name || content.source}](${content.url}) (${licenseInfo.name})`,
          license,
          sourceUrl: content.url,
          sourceName: sourceConfig?.name || content.source,
          requiresLink: true,
          fetchedAt: new Date().toISOString(),
        }
      : null;

    return {
      canUse,
      license,
      licenseInfo,
      attribution,
      restrictions,
      warnings,
    };
  }

  /**
   * Check for privacy concerns in data
   */
  checkPrivacy(data: Record<string, unknown>): PrivacyCheck {
    const flaggedFields: PrivacyFlag[] = [];
    const recommendations: string[] = [];

    // Recursively check all string fields
    const checkValue = (key: string, value: unknown): void => {
      if (typeof value === 'string') {
        // Check PII patterns
        for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
          const matches = value.match(pattern);
          if (matches && matches.length > 0) {
            flaggedFields.push({
              field: key,
              type: type as PrivacyFlag['type'],
              severity: type === 'aadhaar' || type === 'creditCard' ? 'critical' : 'high',
              value: matches[0].substring(0, 5) + '***',
              recommendation: `Remove or mask ${type} in field "${key}"`,
            });
          }
        }

        // Check sensitive patterns
        for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
          const matches = value.match(pattern);
          if (matches && matches.length > 0) {
            const severity = type === 'minor' ? 'critical' : 'medium';
            flaggedFields.push({
              field: key,
              type: type === 'political' ? 'political' : type === 'minor' ? 'minor' : 'pii',
              severity,
              value: matches[0],
              recommendation: `Review ${type} reference in field "${key}"`,
            });
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item, idx) => checkValue(`${key}[${idx}]`, item));
        } else {
          for (const [k, v] of Object.entries(value)) {
            checkValue(`${key}.${k}`, v);
          }
        }
      }
    };

    // Check top-level fields
    for (const [key, value] of Object.entries(data)) {
      checkValue(key, value);
    }

    // Generate recommendations
    const hasPII = flaggedFields.some(f => f.type === 'pii' || f.type === 'contact');
    const hasSensitive = flaggedFields.some(f => ['political', 'health', 'minor'].includes(f.type));
    const hasCritical = flaggedFields.some(f => f.severity === 'critical');

    if (hasPII) {
      recommendations.push('Consider masking or removing personally identifiable information');
    }
    if (hasSensitive) {
      recommendations.push('Review sensitive content for appropriateness');
    }
    if (hasCritical) {
      recommendations.push('URGENT: Critical privacy issue detected - requires immediate review');
    }

    return {
      safe: flaggedFields.length === 0,
      hasPersonalInfo: hasPII,
      hasSensitiveData: hasSensitive,
      requiresConsent: hasCritical || hasPII,
      flaggedFields,
      recommendations,
    };
  }

  /**
   * Check content safety (integrates with existing safety checker)
   */
  async checkContentSafety(
    content: {
      text?: string;
      imageUrl?: string;
      source: ComplianceDataSource;
    }
  ): Promise<ContentSafetyResult> {
    const flags: ContentFlag[] = [];
    let score = 100;

    // Text-based safety checks
    if (content.text) {
      const lowerText = content.text.toLowerCase();

      // Copyright indicators
      const copyrightPatterns = [
        /©\s*\d{4}/,
        /all rights reserved/i,
        /proprietary/i,
        /confidential/i,
        /do not copy/i,
        /copyright\s+\d{4}/i,
      ];

      for (const pattern of copyrightPatterns) {
        if (pattern.test(content.text)) {
          flags.push({
            type: 'copyright',
            severity: 'warning',
            reason: 'Copyright notice detected',
            autoResolve: false,
          });
          score -= 10;
          break;
        }
      }

      // Adult content indicators
      const adultPatterns = [
        'explicit', 'adult only', 'nsfw', '18+', 'x-rated',
        'nude', 'naked', 'xxx',
      ];

      if (adultPatterns.some(p => lowerText.includes(p))) {
        flags.push({
          type: 'adult',
          severity: 'critical',
          reason: 'Adult content indicator detected',
          autoResolve: false,
        });
        score -= 50;
      }

      // Violence indicators
      const violencePatterns = [
        'gore', 'graphic violence', 'brutal', 'blood',
        'torture', 'murder scene',
      ];

      if (violencePatterns.some(p => lowerText.includes(p))) {
        flags.push({
          type: 'violence',
          severity: 'warning',
          reason: 'Violence-related content detected',
          autoResolve: false,
        });
        score -= 15;
      }

      // Fake/misleading indicators
      const fakePatterns = [
        'fake news', 'unverified', 'rumor', 'allegedly',
        'sources say', 'breaking:',
      ];

      if (fakePatterns.some(p => lowerText.includes(p))) {
        flags.push({
          type: 'fake',
          severity: 'info',
          reason: 'Potentially unverified content',
          autoResolve: true,
        });
        score -= 5;
      }
    }

    // Determine status
    let status: ContentSafetyResult['status'] = 'approved';
    if (flags.some(f => f.severity === 'critical')) {
      status = 'blocked';
    } else if (flags.some(f => f.severity === 'warning')) {
      status = 'needs_review';
    } else if (flags.some(f => f.severity === 'info')) {
      status = 'flagged';
    }

    return {
      safe: status === 'approved',
      status,
      flags,
      score: Math.max(0, score),
    };
  }

  /**
   * Full compliance check combining all validations
   */
  async fullComplianceCheck(
    content: {
      source: ComplianceDataSource;
      url: string;
      data?: Record<string, unknown>;
      text?: string;
      license?: LicenseType;
      purpose?: 'display' | 'commercial' | 'modification' | 'redistribution';
    }
  ): Promise<{
    usage: UsageValidation;
    privacy: PrivacyCheck | null;
    safety: ContentSafetyResult;
    overallCompliant: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Usage validation
    const usage = this.validateUsage({
      source: content.source,
      url: content.url,
      license: content.license,
      purpose: content.purpose,
    });

    if (!usage.canUse) {
      issues.push(...usage.warnings);
    }

    // Privacy check
    let privacy: PrivacyCheck | null = null;
    if (content.data) {
      privacy = this.checkPrivacy(content.data);
      if (!privacy.safe) {
        issues.push(...privacy.recommendations);
      }
    }

    // Safety check
    const safety = await this.checkContentSafety({
      text: content.text,
      source: content.source,
    });

    if (!safety.safe) {
      issues.push(...safety.flags.map(f => f.reason));
    }

    return {
      usage,
      privacy,
      safety,
      overallCompliant: usage.canUse && (privacy?.safe ?? true) && safety.safe,
      issues,
    };
  }

  /**
   * Get license info
   */
  getLicenseInfo(license: LicenseType): License {
    return LICENSES[license];
  }

  /**
   * Check if license allows commercial use
   */
  isCommerciallyUsable(license: LicenseType): boolean {
    return LICENSES[license].allowCommercial;
  }

  /**
   * Check if attribution is required
   */
  requiresAttribution(license: LicenseType): boolean {
    return LICENSES[license].requiresAttribution;
  }
}

// ============================================================
// SINGLETON INSTANCE
// ============================================================

export const complianceValidator = new ComplianceValidator();

// ============================================================
// CONVENIENCE FUNCTIONS
// ============================================================

export function validateUsage(
  source: ComplianceDataSource,
  url: string,
  options?: { license?: LicenseType; purpose?: 'display' | 'commercial' | 'modification' | 'redistribution' }
): UsageValidation {
  return complianceValidator.validateUsage({
    source,
    url,
    ...options,
  });
}

export function checkPrivacy(data: Record<string, unknown>): PrivacyCheck {
  return complianceValidator.checkPrivacy(data);
}

export async function checkContentSafety(
  text: string,
  source: ComplianceDataSource
): Promise<ContentSafetyResult> {
  return complianceValidator.checkContentSafety({ text, source });
}

