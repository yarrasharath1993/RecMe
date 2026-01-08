/**
 * BATCH PUBLISHER
 * 
 * Publishing workflow with validation rules engine for the content platform.
 * Handles batch creation, validation, scheduling, and publishing.
 */

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import {
  ContentSector,
  ContentType,
  VerificationStatus,
  AudienceProfile,
  ContentSensitivityLevel,
  SECTOR_DEFINITIONS,
  getSectorDefinition,
  getRequiredDisclaimerType,
  requiresFictionalLabel,
  SENSITIVITY_LEVEL_CONFIG,
} from '@/types/content-sectors';

// ============================================================
// TYPES
// ============================================================

export interface BatchPublishRules {
  minConfidenceScore: number;           // Minimum fact_confidence_score (0-100)
  requireVerifiedStatus: boolean;       // verification_status must be 'verified'
  requireSourceCount: number;           // Minimum number of sources for factual content
  fictionRequiresLabel: boolean;        // what_if_fiction must have fictional_label=true
  wellnessRequiresDisclaimer: boolean;  // pregnancy_wellness must have disclaimer
  kidsRequiresFamilySafe: boolean;      // kids_family must pass safety check
  lockedContentReadOnly: boolean;       // verification_status='locked' blocks edits
  allowDraftPublish: boolean;           // Allow publishing draft content (admin override)
}

export const DEFAULT_PUBLISH_RULES: BatchPublishRules = {
  minConfidenceScore: 50,
  requireVerifiedStatus: true,
  requireSourceCount: 1,
  fictionRequiresLabel: true,
  wellnessRequiresDisclaimer: true,
  kidsRequiresFamilySafe: true,
  lockedContentReadOnly: true,
  allowDraftPublish: false,
};

export interface PublishBatch {
  id: string;
  name: string;
  description?: string;
  scheduledAt?: string;
  publishedAt?: string;
  status: BatchStatus;
  contentCount: number;
  successCount: number;
  failureCount: number;
  validationErrors: ValidationError[];
  prePublishChecks: PrePublishChecks;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type BatchStatus = 
  | 'pending'     // Created but not scheduled
  | 'scheduled'   // Scheduled for future publish
  | 'publishing'  // Currently publishing
  | 'published'   // Successfully published
  | 'failed'      // Publishing failed
  | 'cancelled';  // Cancelled by admin

export interface ValidationError {
  postId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
  rule: string;
}

export interface PrePublishChecks {
  allContentVerified: boolean;
  allDisclaimersSet: boolean;
  allFictionalLabeled: boolean;
  noSensitiveInKids: boolean;
  minimumSourcesMet: boolean;
  confidenceThresholdMet: boolean;
}

export interface ContentItem {
  id: string;
  title: string;
  content_type: ContentType;
  content_sector: ContentSector;
  verification_status: VerificationStatus;
  fact_confidence_score: number;
  source_count: number;
  fictional_label: boolean;
  requires_disclaimer: boolean;
  disclaimer_type?: string;
  audience_profile: AudienceProfile;
  sensitivity_level: ContentSensitivityLevel;
  status: string;
}

export interface PublishResult {
  batchId: string;
  success: boolean;
  publishedCount: number;
  failedCount: number;
  errors: ValidationError[];
  publishedAt?: string;
}

// ============================================================
// BATCH PUBLISHER CLASS
// ============================================================

export class BatchPublisher {
  private supabase: ReturnType<typeof createClient>;
  private rules: BatchPublishRules;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    rules: Partial<BatchPublishRules> = {}
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.rules = { ...DEFAULT_PUBLISH_RULES, ...rules };
  }

  // ============================================================
  // BATCH MANAGEMENT
  // ============================================================

  /**
   * Create a new publish batch
   */
  async createBatch(
    name: string,
    description?: string,
    createdBy?: string
  ): Promise<PublishBatch> {
    const batch: Partial<PublishBatch> = {
      id: uuidv4(),
      name,
      description,
      status: 'pending',
      contentCount: 0,
      successCount: 0,
      failureCount: 0,
      validationErrors: [],
      prePublishChecks: {
        allContentVerified: false,
        allDisclaimersSet: false,
        allFictionalLabeled: false,
        noSensitiveInKids: false,
        minimumSourcesMet: false,
        confidenceThresholdMet: false,
      },
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('publish_batches')
      .insert(batch)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create batch: ${error.message}`);
    }

    return data as PublishBatch;
  }

  /**
   * Add content items to a batch
   */
  async addToBatch(batchId: string, postIds: string[]): Promise<number> {
    const { data, error } = await this.supabase
      .from('posts')
      .update({ publish_batch_id: batchId })
      .in('id', postIds)
      .select('id');

    if (error) {
      throw new Error(`Failed to add content to batch: ${error.message}`);
    }

    // Update batch content count
    await this.supabase
      .from('publish_batches')
      .update({ 
        content_count: postIds.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    return data?.length || 0;
  }

  /**
   * Remove content from a batch
   */
  async removeFromBatch(batchId: string, postIds: string[]): Promise<number> {
    const { data, error } = await this.supabase
      .from('posts')
      .update({ publish_batch_id: null })
      .in('id', postIds)
      .eq('publish_batch_id', batchId)
      .select('id');

    if (error) {
      throw new Error(`Failed to remove content from batch: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get batch details with content items
   */
  async getBatch(batchId: string): Promise<{
    batch: PublishBatch;
    content: ContentItem[];
  }> {
    const { data: batch, error: batchError } = await this.supabase
      .from('publish_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (batchError) {
      throw new Error(`Failed to get batch: ${batchError.message}`);
    }

    const { data: content, error: contentError } = await this.supabase
      .from('posts')
      .select(`
        id, title, content_type, content_sector, verification_status,
        fact_confidence_score, source_count, fictional_label,
        requires_disclaimer, disclaimer_type, audience_profile,
        sensitivity_level, status
      `)
      .eq('publish_batch_id', batchId);

    if (contentError) {
      throw new Error(`Failed to get batch content: ${contentError.message}`);
    }

    return {
      batch: batch as PublishBatch,
      content: (content || []) as ContentItem[],
    };
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  /**
   * Validate all content in a batch against publish rules
   */
  async validateBatch(batchId: string): Promise<{
    isValid: boolean;
    errors: ValidationError[];
    checks: PrePublishChecks;
  }> {
    const { content } = await this.getBatch(batchId);
    const errors: ValidationError[] = [];
    
    const checks: PrePublishChecks = {
      allContentVerified: true,
      allDisclaimersSet: true,
      allFictionalLabeled: true,
      noSensitiveInKids: true,
      minimumSourcesMet: true,
      confidenceThresholdMet: true,
    };

    for (const item of content) {
      const itemErrors = this.validateContentItem(item);
      errors.push(...itemErrors);

      // Update aggregate checks
      if (item.verification_status !== 'verified' && item.verification_status !== 'locked') {
        checks.allContentVerified = false;
      }
      if (this.requiresDisclaimer(item.content_sector) && !item.requires_disclaimer) {
        checks.allDisclaimersSet = false;
      }
      if (requiresFictionalLabel(item.content_sector) && !item.fictional_label) {
        checks.allFictionalLabeled = false;
      }
      if (item.content_sector === 'kids_family' && 
          (item.sensitivity_level !== 'none' && item.sensitivity_level !== 'mild')) {
        checks.noSensitiveInKids = false;
      }
      if (item.source_count < this.rules.requireSourceCount) {
        checks.minimumSourcesMet = false;
      }
      if (item.fact_confidence_score < this.rules.minConfidenceScore) {
        checks.confidenceThresholdMet = false;
      }
    }

    // Update batch with validation results
    await this.supabase
      .from('publish_batches')
      .update({
        validation_errors: errors,
        pre_publish_checks: checks,
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    const hasErrors = errors.some(e => e.severity === 'error');
    return {
      isValid: !hasErrors,
      errors,
      checks,
    };
  }

  /**
   * Validate a single content item
   */
  validateContentItem(item: ContentItem): ValidationError[] {
    const errors: ValidationError[] = [];
    const sectorDef = getSectorDefinition(item.content_sector);

    // Rule 1: Verification status
    if (this.rules.requireVerifiedStatus) {
      if (item.verification_status !== 'verified' && item.verification_status !== 'locked') {
        errors.push({
          postId: item.id,
          field: 'verification_status',
          message: `Content must be verified before publishing. Current status: ${item.verification_status}`,
          severity: 'error',
          rule: 'requireVerifiedStatus',
        });
      }
    }

    // Rule 2: Minimum confidence score
    if (item.fact_confidence_score < this.rules.minConfidenceScore) {
      errors.push({
        postId: item.id,
        field: 'fact_confidence_score',
        message: `Confidence score (${item.fact_confidence_score}) below threshold (${this.rules.minConfidenceScore})`,
        severity: 'error',
        rule: 'minConfidenceScore',
      });
    }

    // Rule 3: Source count for factual content
    if (!this.isFictionalSector(item.content_sector)) {
      if (item.source_count < this.rules.requireSourceCount) {
        errors.push({
          postId: item.id,
          field: 'source_count',
          message: `Factual content requires at least ${this.rules.requireSourceCount} source(s). Found: ${item.source_count}`,
          severity: 'error',
          rule: 'requireSourceCount',
        });
      }
    }

    // Rule 4: Fictional label for what-if content
    if (this.rules.fictionRequiresLabel) {
      if (requiresFictionalLabel(item.content_sector) && !item.fictional_label) {
        errors.push({
          postId: item.id,
          field: 'fictional_label',
          message: 'Fictional/speculative content must be labeled as such',
          severity: 'error',
          rule: 'fictionRequiresLabel',
        });
      }
    }

    // Rule 5: Disclaimer for wellness content
    if (this.rules.wellnessRequiresDisclaimer) {
      if (this.requiresDisclaimer(item.content_sector) && !item.requires_disclaimer) {
        errors.push({
          postId: item.id,
          field: 'requires_disclaimer',
          message: `${sectorDef.name} content requires a ${sectorDef.disclaimerType} disclaimer`,
          severity: 'error',
          rule: 'wellnessRequiresDisclaimer',
        });
      }
    }

    // Rule 6: Kids content safety
    if (this.rules.kidsRequiresFamilySafe) {
      if (item.content_sector === 'kids_family') {
        if (item.sensitivity_level !== 'none' && item.sensitivity_level !== 'mild') {
          errors.push({
            postId: item.id,
            field: 'sensitivity_level',
            message: 'Kids content cannot have moderate or higher sensitivity',
            severity: 'error',
            rule: 'kidsRequiresFamilySafe',
          });
        }
        if (item.audience_profile === 'adult') {
          errors.push({
            postId: item.id,
            field: 'audience_profile',
            message: 'Kids content cannot have adult audience profile',
            severity: 'error',
            rule: 'kidsRequiresFamilySafe',
          });
        }
      }
    }

    // Rule 7: Content type allowed for sector
    if (!sectorDef.allowedContentTypes.includes(item.content_type)) {
      errors.push({
        postId: item.id,
        field: 'content_type',
        message: `Content type "${item.content_type}" not allowed for sector "${item.content_sector}"`,
        severity: 'warning',
        rule: 'allowedContentTypes',
      });
    }

    return errors;
  }

  // ============================================================
  // PUBLISHING
  // ============================================================

  /**
   * Schedule a batch for future publishing
   */
  async scheduleBatch(
    batchId: string,
    scheduledAt: Date,
    approvedBy?: string
  ): Promise<PublishBatch> {
    // Validate first
    const { isValid, errors } = await this.validateBatch(batchId);
    
    if (!isValid) {
      throw new Error(`Cannot schedule batch with validation errors: ${errors.length} error(s)`);
    }

    const { data, error } = await this.supabase
      .from('publish_batches')
      .update({
        status: 'scheduled',
        scheduled_at: scheduledAt.toISOString(),
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to schedule batch: ${error.message}`);
    }

    return data as PublishBatch;
  }

  /**
   * Publish a batch immediately
   */
  async publishBatch(
    batchId: string,
    publishedBy?: string,
    force = false
  ): Promise<PublishResult> {
    // Validate unless force
    if (!force) {
      const { isValid, errors } = await this.validateBatch(batchId);
      if (!isValid) {
        return {
          batchId,
          success: false,
          publishedCount: 0,
          failedCount: errors.filter(e => e.severity === 'error').length,
          errors,
        };
      }
    }

    // Update batch status to publishing
    await this.supabase
      .from('publish_batches')
      .update({
        status: 'publishing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    try {
      // Get all content in batch
      const { content } = await this.getBatch(batchId);
      const now = new Date().toISOString();
      
      let successCount = 0;
      let failedCount = 0;
      const errors: ValidationError[] = [];

      // Publish each content item
      for (const item of content) {
        try {
          // Skip locked content
          if (item.verification_status === 'locked' && this.rules.lockedContentReadOnly) {
            continue;
          }

          // Update post status to published
          const { error: updateError } = await this.supabase
            .from('posts')
            .update({
              status: 'published',
              published_at: now,
              updated_at: now,
            })
            .eq('id', item.id);

          if (updateError) {
            failedCount++;
            errors.push({
              postId: item.id,
              field: 'status',
              message: `Failed to publish: ${updateError.message}`,
              severity: 'error',
              rule: 'publish',
            });
          } else {
            successCount++;
          }
        } catch (err) {
          failedCount++;
          errors.push({
            postId: item.id,
            field: 'status',
            message: `Unexpected error: ${err}`,
            severity: 'error',
            rule: 'publish',
          });
        }
      }

      // Update batch status
      const finalStatus: BatchStatus = failedCount === 0 ? 'published' : 'failed';
      
      await this.supabase
        .from('publish_batches')
        .update({
          status: finalStatus,
          published_at: now,
          success_count: successCount,
          failure_count: failedCount,
          validation_errors: errors,
          updated_at: now,
        })
        .eq('id', batchId);

      return {
        batchId,
        success: failedCount === 0,
        publishedCount: successCount,
        failedCount,
        errors,
        publishedAt: now,
      };
    } catch (err) {
      // Mark batch as failed
      await this.supabase
        .from('publish_batches')
        .update({
          status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', batchId);

      throw err;
    }
  }

  /**
   * Cancel a scheduled batch
   */
  async cancelBatch(batchId: string, reason?: string): Promise<void> {
    const { data: batch } = await this.supabase
      .from('publish_batches')
      .select('status')
      .eq('id', batchId)
      .single();

    if (batch?.status === 'published') {
      throw new Error('Cannot cancel a published batch');
    }

    await this.supabase
      .from('publish_batches')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', batchId);

    // Remove batch association from content
    await this.supabase
      .from('posts')
      .update({ publish_batch_id: null })
      .eq('publish_batch_id', batchId);
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private isFictionalSector(sector: ContentSector): boolean {
    return sector === 'what_if_fiction';
  }

  private requiresDisclaimer(sector: ContentSector): boolean {
    return !!getRequiredDisclaimerType(sector);
  }

  /**
   * Get pending batches for scheduled publishing
   */
  async getPendingScheduledBatches(): Promise<PublishBatch[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('publish_batches')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (error) {
      throw new Error(`Failed to get pending batches: ${error.message}`);
    }

    return (data || []) as PublishBatch[];
  }

  /**
   * Process all pending scheduled batches
   */
  async processScheduledBatches(): Promise<PublishResult[]> {
    const pending = await this.getPendingScheduledBatches();
    const results: PublishResult[] = [];

    for (const batch of pending) {
      try {
        const result = await this.publishBatch(batch.id);
        results.push(result);
      } catch (err) {
        results.push({
          batchId: batch.id,
          success: false,
          publishedCount: 0,
          failedCount: 1,
          errors: [{
            postId: '',
            field: 'batch',
            message: `Failed to process batch: ${err}`,
            severity: 'error',
            rule: 'processScheduled',
          }],
        });
      }
    }

    return results;
  }
}

// ============================================================
// FACTORY FUNCTION
// ============================================================

/**
 * Create a batch publisher instance
 */
export function createBatchPublisher(
  rules?: Partial<BatchPublishRules>
): BatchPublisher {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return new BatchPublisher(supabaseUrl, supabaseKey, rules);
}

// ============================================================
// STANDALONE VALIDATION FUNCTIONS
// ============================================================

/**
 * Validate a single post without batch context
 */
export function validatePost(
  post: ContentItem,
  rules: Partial<BatchPublishRules> = {}
): ValidationError[] {
  const fullRules = { ...DEFAULT_PUBLISH_RULES, ...rules };
  const publisher = new BatchPublisher('', '', fullRules);
  return publisher.validateContentItem(post);
}

/**
 * Check if content is ready for publishing
 */
export function isReadyToPublish(
  post: ContentItem,
  rules: Partial<BatchPublishRules> = {}
): { ready: boolean; blockers: string[] } {
  const errors = validatePost(post, rules);
  const blockers = errors
    .filter(e => e.severity === 'error')
    .map(e => e.message);

  return {
    ready: blockers.length === 0,
    blockers,
  };
}

