# Draft Generation Loop

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot draft generation loop (NO CODE)

---

## Overview

ClawDBot generates editorial ideas and social media drafts based on trend analysis, validation insights, and governance findings. All drafts require human approval before publishing.

---

## Loop Design

### Input Sources

1. **Trend Signals**
   - Emerging trends
   - Peaking trends
   - Declining trends
   - Trend explanations

2. **Validation Insights**
   - Validation issue explanations
   - Data quality insights
   - Improvement recommendations

3. **Governance Findings**
   - Trust score insights
   - Content type insights
   - Rule violation insights

4. **Editorial Ideas**
   - Generated editorial ideas
   - Idea priorities
   - Idea explanations

### Processing

1. **Draft Generation**
   - Generate editorial drafts from ideas
   - Generate social media drafts from insights
   - Assign priority to drafts
   - Assign approval requirements

2. **Draft Quality Assessment**
   - Assess draft quality
   - Assess draft relevance
   - Assess draft accuracy
   - Assess draft completeness

3. **Draft Prioritization**
   - Prioritize drafts by importance
   - Prioritize drafts by timeliness
   - Prioritize drafts by audience relevance
   - Prioritize drafts by approval requirements

### Outputs

1. **Editorial Drafts** (JSON)
   - Draft content
   - Draft metadata (priority, platform, approval required)
   - Draft explanation
   - Draft confidence

2. **Social Media Drafts** (JSON)
   - Draft content (Telegram/WhatsApp)
   - Draft metadata (priority, platform, approval required)
   - Draft explanation
   - Draft confidence

3. **Draft Reports** (JSON)
   - Comprehensive draft analysis
   - Draft recommendations
   - Draft quality assessment

---

## Loop Characteristics

### Human Gate
✅ **YES** - All drafts require human approval before publishing

### Automation Level
🟢 **READ-ONLY** - ClawDBot only generates drafts, does not publish them

### Risk Level
🟢 **LOW** - Read-only draft generation, no publishing

### Frequency
- **Recommended**: Every 60 minutes (configurable)
- **Maximum**: Once per hour (rate limit)
- **Minimum**: Once per day (minimum useful frequency)

---

## Draft Types

### Editorial Drafts

#### Definition
Long-form editorial content drafts for blog posts, articles, or reviews

#### Examples
- Movie review drafts
- Trend analysis articles
- Data quality reports
- Governance insights articles

#### Generation Criteria
- High-priority editorial ideas
- High-confidence insights
- Editorial idea confidence ≥ medium

#### Output Format
```json
{
  "draft_type": "editorial",
  "draft_content": "Full editorial content...",
  "draft_metadata": {
    "priority": "high",
    "platform": "blog",
    "approval_required": true,
    "confidence": 0.85
  },
  "draft_explanation": "Generated from high-priority editorial idea about emerging trends",
  "draft_confidence": 0.85
}
```

---

### Social Media Drafts (Telegram)

#### Definition
Short-form social media content drafts for Telegram

#### Examples
- Trend alerts
- Validation insights
- Governance findings
- Quick updates

#### Generation Criteria
- High-priority insights
- High-confidence findings
- Social media relevance ≥ medium

#### Output Format
```json
{
  "draft_type": "social",
  "draft_content": "Short social media content...",
  "draft_metadata": {
    "priority": "high",
    "platform": "telegram",
    "approval_required": true,
    "confidence": 0.80
  },
  "draft_explanation": "Generated from high-priority trend signal",
  "draft_confidence": 0.80
}
```

---

### Social Media Drafts (WhatsApp)

#### Definition
Short-form social media content drafts for WhatsApp

#### Examples
- Trend alerts
- Validation insights
- Governance findings
- Quick updates

#### Generation Criteria
- High-priority insights
- High-confidence findings
- Social media relevance ≥ medium

#### Output Format
```json
{
  "draft_type": "social",
  "draft_content": "Short social media content...",
  "draft_metadata": {
    "priority": "high",
    "platform": "whatsapp",
    "approval_required": true,
    "confidence": 0.80
  },
  "draft_explanation": "Generated from high-priority trend signal",
  "draft_confidence": 0.80
}
```

---

## Draft Approval Requirements

### Approval Required

#### Criteria
- All drafts require approval by default
- High-priority drafts require explicit approval
- Low-confidence drafts require explicit approval
- Critical content requires explicit approval

#### Approval Process
1. Human reviews draft
2. Human approves or rejects draft
3. If approved: Draft can be published
4. If rejected: Draft is discarded or revised

### Auto-Send (Exception)

#### Criteria
- Low-priority drafts
- High-confidence drafts
- Non-critical content
- Explicitly marked as auto-send

#### Auto-Send Process
1. Draft marked as auto-send
2. Runner checks approval requirements
3. If auto-send allowed: Draft is sent automatically
4. If approval required: Draft requires approval

---

## Loop Constraints

### Read-Only Constraint
- ClawDBot only generates drafts
- ClawDBot does not publish drafts
- ClawDBot does not send drafts
- ClawDBot does not modify published content

### Deterministic Constraint
- Same inputs produce same outputs
- No randomness in draft generation
- Reproducible draft generation

### Explainable Constraint
- All drafts include explanations
- All draft priorities are documented
- All draft approval requirements are documented

---

## Integration Points

### Input Integration
- Reads trend signals from files/database (via runner)
- Reads validation insights from files/database (via runner)
- Reads governance findings from files/database (via runner)
- Reads editorial ideas from files/database (via runner)

### Output Integration
- Writes drafts to JSON files (via runner)
- Writes draft reports to JSON files (via runner)
- Sends high-priority drafts to Telegram (via runner, with approval)
- Sends high-priority drafts to WhatsApp (via runner, with approval, future)

---

## Human Review Process

### Review Steps

1. **Receive Drafts**
   - Human receives drafts from ClawDBot
   - Reviews draft content and explanations
   - Assesses draft priority and confidence

2. **Evaluate Drafts**
   - Evaluates draft quality
   - Evaluates draft relevance
   - Evaluates draft accuracy
   - Evaluates draft completeness

3. **Decide on Publishing**
   - Decides if draft should be published
   - Decides on publishing approach
   - Decides on publishing timing

4. **Publish Drafts** (if approved)
   - Publishes approved drafts
   - Monitors publishing results
   - Updates draft generation based on results

---

## Safety Guarantees

### Read-Only Guarantee
- ClawDBot never publishes drafts
- ClawDBot never sends drafts
- ClawDBot never modifies published content

### Human Gate Guarantee
- All drafts require human approval
- No autonomous publishing
- Human approval required for all publishing

### Deterministic Guarantee
- Same inputs produce same outputs
- Reproducible draft generation
- No randomness in draft generation