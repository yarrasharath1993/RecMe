# Opportunity Detection Planner Loop

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot opportunity detection planner loop (NO CODE)

**Repurposed concepts from**: `clawdbot/loops/knowledge_enrichment.md`

---

## Overview

ClawDBot detects content opportunities, improvement opportunities, and strategic opportunities based on trend data, validation reports, and governance findings. This loop operates as a read-only planner that produces opportunity signals for human review.

---

## Loop Characteristics

### Trigger
- **Type**: Scheduled (external scheduler)
- **Frequency**: Daily
- **Scheduler**: External cron/system scheduler (not ClawDBot's own scheduler)

### Human Gate
✅ **YES** - All opportunity signals require human review before action

### Automation Level
🟢 **READ-ONLY** - ClawDBot only detects opportunities, does not act on them

### Risk Level
🟢 **LOW** - Read-only analysis, no side effects

---

## Loop Design

### Input Sources

1. **Trend Data** (via runner)
   - Trend signals from trend_scan loop
   - Trend analysis results
   - Trend predictions

2. **Validation Reports** (via runner)
   - Recent validation reports
   - Validation issue patterns
   - Data quality insights

3. **Governance Findings** (via runner)
   - Trust score trends
   - Content type distributions
   - Rule violation patterns

4. **Historical Data** (via runner)
   - Past opportunity outcomes
   - Historical success patterns
   - Previous opportunity analyses

### Processing

1. **Opportunity Identification**
   - Identify content opportunities (editorial, social media)
   - Identify improvement opportunities (data quality, processes)
   - Identify strategic opportunities (features, partnerships)
   - Identify timing opportunities (trends, events)

2. **Opportunity Analysis**
   - Assess opportunity value (potential impact)
   - Assess opportunity feasibility (implementation difficulty)
   - Assess opportunity timing (urgency, relevance)
   - Calculate opportunity confidence (data quality, trend strength)

3. **Signal Generation**
   - Generate opportunity signals
   - Assign priority (high, medium, low)
   - Assign confidence (using confidence model)
   - Generate explanations and recommendations

### Outputs

**Format**: Must conform to `clawdbot/planner_loops/output_contract.md`

```json
{
  "loop": "opportunity_detection",
  "timestamp": "2026-01-25T12:00:00Z",
  "confidence": 0.80,
  "signals": [
    {
      "type": "opportunity_signal",
      "signal_id": "opp-001",
      "description": "High-value content opportunity: Action-comedy trend analysis article",
      "confidence": 0.80,
      "priority": "high",
      "metadata": {
        "opportunity_type": "content",
        "opportunity_value": 0.85,
        "opportunity_feasibility": 0.90,
        "opportunity_timing": "urgent",
        "related_trend": "trend-001",
        "estimated_impact": "high"
      }
    }
  ],
  "ideas": [
    {
      "type": "editorial_idea",
      "idea_id": "idea-001",
      "title": "Trend Analysis: Action-Comedy Genre",
      "description": "Write comprehensive article analyzing the emerging action-comedy trend",
      "confidence": 0.80,
      "priority": "high",
      "metadata": {
        "target_audience": "movie enthusiasts",
        "estimated_read_time": "8 minutes",
        "content_type": "trend_analysis"
      }
    }
  ],
  "risks": [],
  "recommended_actions": [
    {
      "type": "implementation_action",
      "action_id": "action-001",
      "description": "Consider writing editorial article about action-comedy trend",
      "priority": "high",
      "confidence": 0.80,
      "metadata": {
        "related_idea": "idea-001",
        "related_signal": "opp-001",
        "implementation_effort": "medium"
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

## Opportunity Types

### Content Opportunities

#### Definition
Opportunities to create editorial content, social media content, or other content types

#### Detection Criteria
- High-value trends identified
- Audience interest indicators
- Content gap identified
- Timing is optimal

#### Examples
- Editorial article opportunities (trend analysis, reviews)
- Social media content opportunities (quick updates, alerts)
- Video content opportunities (if applicable)
- Podcast content opportunities (if applicable)

---

### Improvement Opportunities

#### Definition
Opportunities to improve data quality, processes, or systems

#### Detection Criteria
- Data quality issues identified
- Process inefficiencies detected
- System improvements possible
- Cost optimization opportunities

#### Examples
- Data enrichment opportunities
- Validation improvement opportunities
- Process optimization opportunities
- Cost reduction opportunities

---

### Strategic Opportunities

#### Definition
Opportunities for strategic initiatives, features, or partnerships

#### Detection Criteria
- Strategic value identified
- Feasibility assessed
- Timing is optimal
- Resources available

#### Examples
- Feature development opportunities
- Partnership opportunities
- Expansion opportunities
- Innovation opportunities

---

## Loop Constraints

### Read-Only Constraint
- ClawDBot only detects opportunities
- ClawDBot does not implement opportunities
- ClawDBot does not modify data
- ClawDBot does not trigger actions

### Deterministic Constraint
- Same inputs produce same outputs
- No randomness in opportunity detection
- Reproducible opportunity analysis

### Explainable Constraint
- All opportunity signals include explanations
- All opportunity values are documented
- All recommendations include reasoning

---

## Integration Points

### Input Integration
- Reads trend data from trend_scan outputs (via runner)
- Reads validation reports from files/database (via runner)
- Reads governance findings from files/database (via runner)
- Reads historical data from files/database (via runner)

### Output Integration
- Produces JSON outputs (per output contract)
- Runner saves outputs to files
- Runner routes outputs for human review
- Human reviews opportunity signals

---

## Human Review Process

### Review Steps

1. **Receive Opportunity Signals**
   - Human receives opportunity signals from ClawDBot
   - Reviews opportunity descriptions and explanations
   - Assesses opportunity value and feasibility

2. **Evaluate Opportunities**
   - Evaluates opportunity relevance
   - Evaluates opportunity value
   - Evaluates opportunity feasibility
   - Evaluates opportunity timing

3. **Decide on Actions**
   - Decides if opportunity should be pursued
   - Decides on implementation approach
   - Decides on implementation priority

4. **Implement Opportunities** (if approved)
   - Implements approved opportunities (via Cursor)
   - Monitors implementation results
   - Updates opportunity analysis

---

## Safety Guarantees

### Read-Only Guarantee
- ClawDBot never implements opportunities
- ClawDBot never triggers actions
- ClawDBot never publishes content

### Human Gate Guarantee
- All opportunity signals require human review
- No autonomous action on opportunities
- Human approval required for all implementations

### Deterministic Guarantee
- Same inputs produce same outputs
- Reproducible opportunity detection
- No randomness in opportunity analysis

---

## References

- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Trend Scan Loop**: `clawdbot/planner_loops/trend_scan.md`
- **Scheduling Model**: `clawdbot/scheduling/schedule_config.md`