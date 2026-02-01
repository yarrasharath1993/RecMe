# Content Idea Planning Loop

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot content idea planning loop (NO CODE)

**Repurposed from**: `clawdbot/loops/draft_generation.md` (concepts extracted, focus on idea planning)

---

## Overview

ClawDBot generates editorial content ideas based on trends, opportunities, and validation insights. This loop focuses on **idea generation**, not draft generation. Drafts are generated separately by the messaging/draft system.

---

## Loop Characteristics

### Trigger
- **Type**: Scheduled (external scheduler)
- **Frequency**: Daily
- **Scheduler**: External cron/system scheduler (not ClawDBot's own scheduler)

### Human Gate
✅ **YES** - All content ideas require human review before implementation

### Automation Level
🟢 **READ-ONLY** - ClawDBot only generates ideas, does not create drafts or publish

### Risk Level
🟢 **LOW** - Read-only idea generation, no publishing

---

## Loop Design

### Input Sources

1. **Trend Signals** (via runner)
   - Emerging trends
   - Peaking trends
   - Declining trends
   - Trend explanations

2. **Opportunity Signals** (via runner)
   - Content opportunities
   - Improvement opportunities
   - Strategic opportunities

3. **Validation Insights** (via runner)
   - Validation issue explanations
   - Data quality insights
   - Improvement recommendations

4. **Governance Findings** (via runner)
   - Trust score insights
   - Content type insights
   - Rule violation insights

### Processing

1. **Idea Generation**
   - Generate editorial ideas from trends
   - Generate content ideas from opportunities
   - Generate article ideas from insights
   - Generate social media ideas from findings

2. **Idea Analysis**
   - Assess idea value (potential impact)
   - Assess idea feasibility (implementation difficulty)
   - Assess idea relevance (audience interest)
   - Calculate idea confidence (data quality, trend strength)

3. **Idea Prioritization**
   - Prioritize ideas by importance
   - Prioritize ideas by timeliness
   - Prioritize ideas by audience relevance
   - Prioritize ideas by confidence

### Outputs

**Format**: Must conform to `clawdbot/planner_loops/output_contract.md`

```json
{
  "loop": "content_idea_planning",
  "timestamp": "2026-01-25T12:00:00Z",
  "confidence": 0.80,
  "signals": [],
  "ideas": [
    {
      "type": "editorial_idea",
      "idea_id": "idea-001",
      "title": "Trend Analysis: Action-Comedy Genre",
      "description": "Write comprehensive article analyzing the emerging action-comedy trend, including recent hit movies, audience preferences, and future predictions",
      "confidence": 0.80,
      "priority": "high",
      "metadata": {
        "target_audience": "movie enthusiasts",
        "estimated_read_time": "8 minutes",
        "content_type": "trend_analysis",
        "related_trend": "trend-001",
        "related_opportunity": "opp-001",
        "suggested_sections": [
          "Introduction to action-comedy trend",
          "Recent hit movies analysis",
          "Audience preference shift",
          "Future predictions"
        ]
      }
    },
    {
      "type": "social_media_idea",
      "idea_id": "idea-002",
      "title": "Quick Update: Action-Comedy Trend",
      "description": "Short social media post highlighting the emerging action-comedy trend",
      "confidence": 0.75,
      "priority": "medium",
      "metadata": {
        "platform": "telegram",
        "estimated_read_time": "1 minute",
        "content_type": "trend_alert",
        "related_trend": "trend-001"
      }
    }
  ],
  "risks": [],
  "recommended_actions": [
    {
      "type": "implementation_action",
      "action_id": "action-001",
      "description": "Consider implementing editorial idea: Trend Analysis article",
      "priority": "high",
      "confidence": 0.80,
      "metadata": {
        "related_idea": "idea-001",
        "implementation_effort": "medium",
        "estimated_value": "high"
      }
    }
  ],
  "constraints": [
    "READ_ONLY",
    "NO_PUBLISH",
    "HUMAN_REVIEW_REQUIRED"
  ]
}
```

---

## Idea Types

### Editorial Ideas

#### Definition
Long-form editorial content ideas for blog posts, articles, or reviews

#### Generation Criteria
- High-value trends identified
- High-confidence insights
- Editorial idea confidence ≥ medium
- Audience interest indicators

#### Examples
- Movie review ideas
- Trend analysis article ideas
- Data quality report ideas
- Governance insights article ideas

---

### Social Media Ideas

#### Definition
Short-form social media content ideas for Telegram, WhatsApp, or other platforms

#### Generation Criteria
- High-priority insights
- High-confidence findings
- Social media relevance ≥ medium
- Platform-appropriate content

#### Examples
- Trend alert ideas
- Validation insight ideas
- Governance finding ideas
- Quick update ideas

---

## Loop Constraints

### Read-Only Constraint
- ClawDBot only generates ideas
- ClawDBot does not create drafts
- ClawDBot does not publish content
- ClawDBot does not modify published content

### Deterministic Constraint
- Same inputs produce same outputs
- No randomness in idea generation
- Reproducible idea generation

### Explainable Constraint
- All ideas include explanations
- All idea priorities are documented
- All idea recommendations include reasoning

### Idea-Only Constraint
- This loop generates ideas only
- Draft generation is handled separately (messaging system)
- Publishing is handled separately (external systems)

---

## Integration Points

### Input Integration
- Reads trend signals from trend_scan outputs (via runner)
- Reads opportunity signals from opportunity_detection outputs (via runner)
- Reads validation insights from files/database (via runner)
- Reads governance findings from files/database (via runner)

### Output Integration
- Produces JSON outputs (per output contract)
- Runner saves outputs to files
- Runner routes outputs for human review
- Human reviews content ideas

### Draft Generation Integration
- Ideas are passed to draft generation system (separate)
- Draft generation creates drafts from ideas
- Drafts require human approval before publishing

---

## Human Review Process

### Review Steps

1. **Receive Content Ideas**
   - Human receives content ideas from ClawDBot
   - Reviews idea descriptions and explanations
   - Assesses idea value and feasibility

2. **Evaluate Ideas**
   - Evaluates idea quality
   - Evaluates idea relevance
   - Evaluates idea feasibility
   - Evaluates idea timing

3. **Decide on Implementation**
   - Decides if idea should be implemented
   - Decides on implementation approach
   - Decides on implementation priority

4. **Implement Ideas** (if approved)
   - Implements approved ideas (via Cursor)
   - Creates drafts from ideas (via draft generation system)
   - Publishes drafts (after approval, via external systems)

---

## Safety Guarantees

### Read-Only Guarantee
- ClawDBot never creates drafts
- ClawDBot never publishes content
- ClawDBot never modifies published content

### Human Gate Guarantee
- All content ideas require human review
- No autonomous draft creation
- Human approval required for all implementations

### Deterministic Guarantee
- Same inputs produce same outputs
- Reproducible idea generation
- No randomness in idea generation

---

## References

- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Trend Scan Loop**: `clawdbot/planner_loops/trend_scan.md`
- **Opportunity Detection Loop**: `clawdbot/planner_loops/opportunity_detection.md`
- **Messaging Draft System**: `clawdbot/messaging/draft_schema.md`
- **Original Draft Generation**: `clawdbot/loops/draft_generation.md`