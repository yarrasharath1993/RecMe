# Telegram Messaging Policy

**Generated**: January 25, 2026  
**Purpose**: Policy for Telegram messaging drafts and distribution (NO CODE)

---

## Policy Statement

Telegram messaging allows **higher frequency** and **experimental drafts**, but still requires **human approval** for all messages.

---

## Policy Characteristics

### Higher Frequency

#### Definition
Telegram allows more frequent messaging than WhatsApp.

#### Application
- More drafts can be sent to Telegram
- Lower frequency threshold for Telegram
- More experimental content allowed

#### Frequency Guidelines
- **Recommended**: 2-4 messages per day
- **Maximum**: 10 messages per day
- **Minimum**: 0 messages per day (no minimum requirement)

---

### Experimental Drafts Allowed

#### Definition
Telegram allows experimental drafts that may not meet high confidence thresholds.

#### Application
- Lower confidence thresholds for Telegram
- Experimental content allowed
- Testing drafts allowed

#### Confidence Guidelines
- **Minimum Confidence**: 0.70 (lower than WhatsApp)
- **Recommended Confidence**: 0.75+
- **High Confidence**: 0.85+ (preferred)

---

### Still Human-Approved

#### Definition
All Telegram messages still require human approval.

#### Application
- All drafts require human review
- No autonomous sending
- Human approval required for all messages

#### Approval Process
1. ClawDBot generates draft
2. Human reviews draft
3. Human approves or rejects
4. If approved: Cursor sends via Telegram adapter

---

## Content Guidelines

### Content Types

#### Allowed Content Types
- Trend alerts
- Validation insights
- Governance findings
- Quick updates
- News ideas
- Editorial previews

#### Content Length
- **Recommended**: 200-500 characters
- **Maximum**: 1000 characters (Telegram limit)
- **Minimum**: 50 characters

---

### Content Format

#### Formatting
- Plain text or HTML formatting
- Emojis allowed (use sparingly)
- Hashtags allowed
- Links allowed

#### Examples
```
📊 Trend Alert: Action-comedy genre is gaining popularity. 
Recent hit movies suggest audience preference shift. 
#TeluguCinema #Trends
```

---

## Confidence Thresholds

### Telegram-Specific Thresholds

#### Low Confidence (0.70-0.74)
- **Action**: Flag for review, experimental
- **Approval**: Standard approval required
- **Use Case**: Experimental content, testing

#### Medium Confidence (0.75-0.84)
- **Action**: Standard review
- **Approval**: Standard approval required
- **Use Case**: Standard content

#### High Confidence (0.85+)
- **Action**: Priority review
- **Approval**: Standard approval required (can be expedited)
- **Use Case**: High-value content

---

## Frequency Limits

### Daily Limits

#### Normal Operation
- **Limit**: 2-4 messages per day
- **Action**: Continue processing
- **Alert**: None

#### High Frequency
- **Limit**: 5-10 messages per day
- **Action**: Continue with warning
- **Alert**: Log warning

#### Excessive Frequency
- **Limit**: > 10 messages per day
- **Action**: Flag for review
- **Alert**: Alert admin

---

## Approval Requirements

### Approval Levels

#### Standard Approval
- **Criteria**: All Telegram drafts
- **Process**: Human reviews and approves
- **Timeline**: Within 24 hours

#### Expedited Approval
- **Criteria**: High-confidence, high-priority drafts
- **Process**: Human reviews and approves quickly
- **Timeline**: Within 4 hours

---

## Policy Enforcement

### Enforcement Mechanisms

1. **Draft Schema Validation**
   - All drafts must conform to draft schema
   - `intent` must be "DRAFT_ONLY"
   - Constraints must be satisfied

2. **Approval Gates**
   - All drafts require approval
   - No autonomous sending
   - Human approval required

3. **Frequency Limits**
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

2. **Frequency Violations**
   - Exceeding daily limits
   - Excessive messaging
   - Spam-like behavior

3. **Content Violations**
   - Invalid content types
   - Content length violations
   - Format violations

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Policy Exceptions

### No Exceptions

This policy has **no exceptions**. All Telegram messages require human approval, regardless of confidence or frequency.

---

## Relationship to Other Policies

### Related Policies

- **no_direct_messaging.md**: Telegram policy enforces no direct messaging
- **no_publish.md**: Telegram policy enforces no autonomous publishing
- **draft_schema.md**: Telegram drafts must conform to draft schema

### Policy Hierarchy

- **no_direct_messaging.md** (parent policy)
  - **telegram_policy.md** (platform-specific policy)

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