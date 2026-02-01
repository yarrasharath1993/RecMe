# WhatsApp Messaging Policy

**Generated**: January 25, 2026  
**Purpose**: Policy for WhatsApp messaging drafts and distribution (NO CODE)

---

## Policy Statement

WhatsApp messaging has a **higher trust bar**, **lower frequency**, **higher confidence threshold**, and **shorter content** requirements. All messages still require **human approval**.

---

## Policy Characteristics

### Higher Trust Bar

#### Definition
WhatsApp requires higher trust and quality standards than Telegram.

#### Application
- Higher confidence thresholds
- Higher quality content
- More careful curation
- Less experimental content

#### Trust Guidelines
- **Minimum Confidence**: 0.85 (higher than Telegram)
- **Recommended Confidence**: 0.90+
- **High Confidence**: 0.95+ (preferred)

---

### Lower Frequency

#### Definition
WhatsApp allows fewer messages than Telegram.

#### Application
- Lower frequency threshold
- More selective content
- Higher value per message

#### Frequency Guidelines
- **Recommended**: 1-2 messages per day
- **Maximum**: 5 messages per day
- **Minimum**: 0 messages per day (no minimum requirement)

---

### Higher Confidence Threshold

#### Definition
WhatsApp requires higher confidence scores than Telegram.

#### Application
- Minimum confidence: 0.85 (vs. 0.70 for Telegram)
- Higher quality standards
- More reliable content

#### Confidence Guidelines
- **Minimum Confidence**: 0.85 (required)
- **Recommended Confidence**: 0.90+
- **High Confidence**: 0.95+ (preferred)

---

### Shorter Content

#### Definition
WhatsApp messages should be shorter and more concise than Telegram.

#### Application
- Shorter message length
- More focused content
- Quick updates preferred

#### Content Length
- **Recommended**: 100-200 characters
- **Maximum**: 500 characters
- **Minimum**: 50 characters

---

### Still Human-Approved

#### Definition
All WhatsApp messages still require human approval.

#### Application
- All drafts require human review
- No autonomous sending
- Human approval required for all messages

#### Approval Process
1. ClawDBot generates draft
2. Human reviews draft
3. Human approves or rejects
4. If approved: Cursor sends via WhatsApp adapter

---

## Content Guidelines

### Content Types

#### Allowed Content Types
- High-priority trend alerts
- Critical validation insights
- Important governance findings
- Urgent updates

#### Restricted Content Types
- Experimental content (not allowed)
- Low-confidence content (not allowed)
- Long-form content (not allowed)

---

### Content Format

#### Formatting
- Plain text preferred
- Minimal formatting
- No emojis (or very sparing use)
- No hashtags (or minimal use)
- Links allowed (if necessary)

#### Examples
```
Trend Alert: Action-comedy genre gaining popularity. 
Recent hits suggest audience shift. Review recommended.
```

---

## Confidence Thresholds

### WhatsApp-Specific Thresholds

#### Medium Confidence (0.85-0.89)
- **Action**: Flag for review
- **Approval**: Standard approval required
- **Use Case**: Standard high-quality content

#### High Confidence (0.90-0.94)
- **Action**: Priority review
- **Approval**: Standard approval required (can be expedited)
- **Use Case**: High-value content

#### Very High Confidence (0.95+)
- **Action**: Expedited review
- **Approval**: Expedited approval (if high priority)
- **Use Case**: Critical high-value content

---

## Frequency Limits

### Daily Limits

#### Normal Operation
- **Limit**: 1-2 messages per day
- **Action**: Continue processing
- **Alert**: None

#### Moderate Frequency
- **Limit**: 3-5 messages per day
- **Action**: Continue with warning
- **Alert**: Log warning

#### Excessive Frequency
- **Limit**: > 5 messages per day
- **Action**: Flag for review
- **Alert**: Alert admin

---

## Approval Requirements

### Approval Levels

#### Standard Approval
- **Criteria**: All WhatsApp drafts
- **Process**: Human reviews and approves
- **Timeline**: Within 24 hours

#### Expedited Approval
- **Criteria**: Very high-confidence, critical drafts
- **Process**: Human reviews and approves quickly
- **Timeline**: Within 4 hours

---

## Policy Enforcement

### Enforcement Mechanisms

1. **Draft Schema Validation**
   - All drafts must conform to draft schema
   - `intent` must be "DRAFT_ONLY"
   - Constraints must be satisfied

2. **Confidence Thresholds**
   - Minimum confidence: 0.85 enforced
   - Low-confidence drafts rejected
   - Confidence validation required

3. **Approval Gates**
   - All drafts require approval
   - No autonomous sending
   - Human approval required

4. **Frequency Limits**
   - Daily frequency limits enforced
   - Excessive frequency flagged
   - Admin alerts on limits exceeded

---

## Policy Violations

### Violation Types

1. **Autonomous Sending**
   - Sending without approval
   - Auto-sending drafts
   - Bypassing approval gates

2. **Confidence Violations**
   - Sending low-confidence drafts (< 0.85)
   - Bypassing confidence thresholds
   - Invalid confidence scores

3. **Frequency Violations**
   - Exceeding daily limits
   - Excessive messaging
   - Spam-like behavior

4. **Content Violations**
   - Content too long (> 500 characters)
   - Invalid content types
   - Format violations

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Policy Exceptions

### No Exceptions

This policy has **no exceptions**. All WhatsApp messages require human approval and meet confidence thresholds, regardless of circumstances.

---

## Relationship to Other Policies

### Related Policies

- **no_direct_messaging.md**: WhatsApp policy enforces no direct messaging
- **no_publish.md**: WhatsApp policy enforces no autonomous publishing
- **draft_schema.md**: WhatsApp drafts must conform to draft schema
- **telegram_policy.md**: WhatsApp has stricter requirements than Telegram

### Policy Hierarchy

- **no_direct_messaging.md** (parent policy)
  - **whatsapp_policy.md** (platform-specific policy, stricter than Telegram)

---

## Policy Maintenance

### Policy Updates

- Policy updates require explicit approval
- Policy changes must be documented
- Policy changes must be tested
- Policy changes must be reviewed

### Policy Monitoring

- Monitor for policy violations
- Track policy compliance
- Generate policy compliance reports
- Review policy effectiveness