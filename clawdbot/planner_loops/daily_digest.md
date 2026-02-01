# Daily Digest Planner Loop

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot daily digest planner loop (NO CODE)

---

## Overview

ClawDBot generates a daily summary of all analyses from all planner loops. This loop aggregates outputs from trend_scan, opportunity_detection, content_idea_planning, and contradiction_detection loops to produce a comprehensive daily digest.

---

## Loop Characteristics

### Trigger
- **Type**: Scheduled (external scheduler)
- **Frequency**: Once per day (typically at end of day)
- **Scheduler**: External cron/system scheduler (not ClawDBot's own scheduler)

### Human Gate
✅ **YES** - All digest outputs require human review

### Automation Level
🟢 **READ-ONLY** - ClawDBot only aggregates and summarizes, does not act

### Risk Level
🟢 **LOW** - Read-only aggregation, no side effects

---

## Loop Design

### Input Sources

1. **All Loop Outputs** (via runner)
   - Trend scan outputs (from trend_scan loop)
   - Opportunity detection outputs (from opportunity_detection loop)
   - Content idea planning outputs (from content_idea_planning loop)
   - Contradiction detection outputs (from contradiction_detection loop)

2. **Historical Data** (via runner)
   - Previous daily digests
   - Historical patterns
   - Trend comparisons

### Processing

1. **Output Aggregation**
   - Aggregate all loop outputs from the day
   - Group outputs by type (signals, ideas, risks, actions)
   - Identify key themes and patterns

2. **Digest Generation**
   - Generate daily summary
   - Highlight key insights
   - Identify priority items
   - Generate recommendations

3. **Trend Analysis**
   - Compare with previous days
   - Identify trends over time
   - Highlight significant changes
   - Generate trend predictions

### Outputs

**Format**: Must conform to `clawdbot/planner_loops/output_contract.md`

```json
{
  "loop": "daily_digest",
  "timestamp": "2026-01-25T23:59:59Z",
  "confidence": 0.85,
  "signals": [
    {
      "type": "summary_signal",
      "signal_id": "digest-001",
      "description": "Daily summary: 5 trend signals, 3 opportunities, 2 contradictions detected",
      "confidence": 0.85,
      "priority": "high",
      "metadata": {
        "summary_type": "daily_digest",
        "date": "2026-01-25",
        "total_signals": 5,
        "total_ideas": 8,
        "total_risks": 2,
        "total_actions": 10
      }
    }
  ],
  "ideas": [
    {
      "type": "summary_idea",
      "idea_id": "digest-idea-001",
      "title": "Daily Digest: January 25, 2026",
      "description": "Comprehensive daily summary of all ClawDBot analyses",
      "confidence": 0.85,
      "priority": "high",
      "metadata": {
        "digest_date": "2026-01-25",
        "key_themes": [
          "Action-comedy genre trending",
          "Data quality improvements needed",
          "Content opportunities identified"
        ],
        "priority_items": [
          "Review action-comedy trend signal",
          "Resolve contradiction: Action-comedy vs. comedy trend",
          "Consider editorial article about action-comedy trend"
        ]
      }
    }
  ],
  "risks": [
    {
      "type": "summary_risk",
      "risk_id": "digest-risk-001",
      "description": "High-severity contradiction detected requires urgent resolution",
      "severity": "high",
      "confidence": 0.85,
      "metadata": {
        "related_contradiction": "contradiction-001",
        "risk_impact": "May impact content planning decisions"
      }
    }
  ],
  "recommended_actions": [
    {
      "type": "summary_action",
      "action_id": "digest-action-001",
      "description": "Review daily digest and prioritize actions",
      "priority": "high",
      "confidence": 0.85,
      "metadata": {
        "action_type": "review_digest",
        "priority_items_count": 3,
        "review_deadline": "2026-01-26T09:00:00Z"
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

## Digest Components

### Key Insights

#### Definition
Most important insights from all loops

#### Examples
- Top 3 trend signals
- Top 3 opportunities
- Top 3 risks
- Top 3 recommended actions

---

### Trend Summary

#### Definition
Summary of trends detected throughout the day

#### Examples
- Trend signal count
- Trend types distribution
- Trend confidence distribution
- Trend priority distribution

---

### Opportunity Summary

#### Definition
Summary of opportunities detected throughout the day

#### Examples
- Opportunity count
- Opportunity types distribution
- Opportunity value distribution
- Opportunity feasibility distribution

---

### Risk Summary

#### Definition
Summary of risks identified throughout the day

#### Examples
- Risk count
- Risk severity distribution
- Risk type distribution
- Risk impact distribution

---

### Action Summary

#### Definition
Summary of recommended actions throughout the day

#### Examples
- Action count
- Action priority distribution
- Action type distribution
- Action status distribution

---

## Loop Constraints

### Read-Only Constraint
- ClawDBot only aggregates and summarizes
- ClawDBot does not modify data
- ClawDBot does not trigger actions
- ClawDBot does not publish content

### Deterministic Constraint
- Same inputs produce same outputs
- No randomness in digest generation
- Reproducible digest generation

### Explainable Constraint
- All digest components include explanations
- All summaries are documented
- All recommendations include reasoning

---

## Integration Points

### Input Integration
- Reads all loop outputs from files/database (via runner)
- Reads historical digests from files/database (via runner)
- Aggregates outputs from all loops

### Output Integration
- Produces JSON outputs (per output contract)
- Runner saves outputs to files
- Runner routes outputs for human review
- Human reviews daily digest

---

## Human Review Process

### Review Steps

1. **Receive Daily Digest**
   - Human receives daily digest from ClawDBot
   - Reviews digest summary and key insights
   - Assesses priority items and recommendations

2. **Evaluate Digest**
   - Evaluates digest completeness
   - Evaluates key insights relevance
   - Evaluates priority items accuracy
   - Evaluates recommendations feasibility

3. **Decide on Actions**
   - Decides on action priorities
   - Decides on action timing
   - Decides on action approach

4. **Implement Actions** (if approved)
   - Implements approved actions (via Cursor)
   - Monitors action results
   - Updates digest analysis

---

## Safety Guarantees

### Read-Only Guarantee
- ClawDBot never modifies data
- ClawDBot never triggers actions
- ClawDBot never publishes content

### Human Gate Guarantee
- All digest outputs require human review
- No autonomous action on digests
- Human approval required for all actions

### Deterministic Guarantee
- Same inputs produce same outputs
- Reproducible digest generation
- No randomness in digest generation

---

## References

- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Trend Scan Loop**: `clawdbot/planner_loops/trend_scan.md`
- **Opportunity Detection Loop**: `clawdbot/planner_loops/opportunity_detection.md`
- **Content Idea Planning Loop**: `clawdbot/planner_loops/content_idea_planning.md`
- **Contradiction Detection Loop**: `clawdbot/planner_loops/contradiction_detection.md`