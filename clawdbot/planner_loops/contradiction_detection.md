# Contradiction Detection Planner Loop

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot contradiction detection planner loop (NO CODE)

**Repurposed from**: `clawdbot/scoring/contradiction_rules.md` (repurposed as planner loop design)

---

## Overview

ClawDBot detects contradictions in validation reports, governance reports, and trend data. This loop operates as a read-only planner that produces contradiction signals for human review.

---

## Loop Characteristics

### Trigger
- **Type**: Event-driven (on new inputs)
- **Frequency**: Triggered when new validation/governance/trend data arrives
- **Scheduler**: External event trigger (not ClawDBot's own scheduler)

### Human Gate
✅ **YES** - All contradiction signals require human review before resolution

### Automation Level
🟢 **READ-ONLY** - ClawDBot only detects contradictions, does not resolve them

### Risk Level
🟢 **LOW** - Read-only contradiction detection, no resolution

---

## Loop Design

### Input Sources

1. **Validation Reports** (via runner)
   - Recent validation reports
   - Validation issue patterns
   - Cross-report comparisons

2. **Governance Reports** (via runner)
   - Trust score reports
   - Content type reports
   - Rule violation reports

3. **Trend Data** (via runner)
   - Trend signals from trend_scan loop
   - Trend analysis results
   - Historical trend data

4. **Previous Analyses** (via runner)
   - Previous contradiction detections
   - Previous resolution outcomes
   - Historical contradiction patterns

### Processing

1. **Contradiction Identification**
   - Compare data across sources
   - Compare analysis results
   - Compare recommendations
   - Identify conflicts

2. **Contradiction Analysis**
   - Assess contradiction severity (impact, confidence, urgency)
   - Assess contradiction type (data, analysis, recommendation)
   - Assess contradiction confidence (data quality, source reliability)
   - Generate contradiction explanations

3. **Resolution Recommendations**
   - Recommend resolution strategies
   - Prioritize contradictions
   - Generate resolution explanations

### Outputs

**Format**: Must conform to `clawdbot/planner_loops/output_contract.md`

```json
{
  "loop": "contradiction_detection",
  "timestamp": "2026-01-25T12:00:00Z",
  "confidence": 0.85,
  "signals": [
    {
      "type": "contradiction_signal",
      "signal_id": "contradiction-001",
      "description": "Conflicting trend signals: Action-comedy trend vs. declining comedy trend",
      "confidence": 0.85,
      "priority": "high",
      "metadata": {
        "contradiction_type": "analysis",
        "contradiction_severity": "high",
        "contradiction_sources": [
          {"source": "trend_scan", "value": "Action-comedy gaining popularity"},
          {"source": "trend_scan", "value": "Comedy genre declining"}
        ],
        "contradiction_explanation": "Trend scan detected both action-comedy gaining popularity and comedy genre declining, which may indicate a sub-genre shift rather than a true contradiction",
        "resolution_recommendation": "Review trend definitions and sub-genre classifications"
      }
    }
  ],
  "ideas": [],
  "risks": [
    {
      "type": "contradiction_risk",
      "risk_id": "risk-001",
      "description": "High-severity contradiction may impact content planning decisions",
      "severity": "high",
      "confidence": 0.85,
      "metadata": {
        "related_contradiction": "contradiction-001",
        "risk_impact": "Content planning decisions may be based on conflicting information"
      }
    }
  ],
  "recommended_actions": [
    {
      "type": "review_action",
      "action_id": "action-001",
      "description": "Review and resolve contradiction: Action-comedy vs. comedy trend",
      "priority": "high",
      "confidence": 0.85,
      "metadata": {
        "related_contradiction": "contradiction-001",
        "review_deadline": "2026-01-26T12:00:00Z"
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

## Contradiction Types

### Data Contradictions

#### Definition
Contradictions in input data from different sources

#### Detection Criteria
- Multiple sources provide conflicting data
- Conflict confidence ≥ medium
- Conflict severity ≥ medium

#### Examples
- Different release years for same movie
- Different directors for same movie
- Different genres for same movie
- Different ratings for same movie

---

### Analysis Contradictions

#### Definition
Contradictions in analysis results from different loops

#### Detection Criteria
- Multiple analyses produce conflicting results
- Conflict confidence ≥ medium
- Conflict severity ≥ medium

#### Examples
- Conflicting trend signals
- Conflicting validation insights
- Conflicting governance findings
- Conflicting recommendations

---

### Recommendation Contradictions

#### Definition
Contradictions in recommendations from different loops

#### Detection Criteria
- Multiple recommendations conflict
- Conflict confidence ≥ medium
- Conflict severity ≥ medium

#### Examples
- Conflicting content ideas
- Conflicting improvement recommendations
- Conflicting action recommendations

---

## Contradiction Severity Levels

### Critical Contradictions

#### Criteria
- High impact on system
- High confidence in contradiction
- Urgent resolution needed
- Critical data affected

#### Resolution
- Immediate human review required
- High priority in review queue
- Strong recommendation for resolution

---

### High Severity Contradictions

#### Criteria
- Medium-high impact on system
- Medium-high confidence in contradiction
- Standard resolution needed
- Important data affected

#### Resolution
- Human review required within 24 hours
- High priority in review queue
- Moderate recommendation for resolution

---

### Medium Severity Contradictions

#### Criteria
- Medium impact on system
- Medium confidence in contradiction
- Low-urgency resolution needed
- Moderate data affected

#### Resolution
- Human review required within 48 hours
- Medium priority in review queue
- Weak recommendation for resolution

---

### Low Severity Contradictions

#### Criteria
- Low impact on system
- Low confidence in contradiction
- Optional resolution needed
- Minor data affected

#### Resolution
- Human review optional
- Low priority in review queue
- No strong recommendation for resolution

---

## Resolution Strategies

### Source Priority Strategy

#### Definition
Resolve contradictions by prioritizing higher-tier sources

#### Application
- Tier-1 sources override tier-2 sources
- Tier-2 sources override tier-3 sources
- Tier-1 sources override tier-3 sources

---

### Consensus Strategy

#### Definition
Resolve contradictions by choosing the consensus value

#### Application
- Choose value agreed upon by most sources
- Weight by source tier
- Weight by source reliability

---

### Human Review Strategy

#### Definition
Resolve contradictions through human review

#### Application
- Flag contradictions for human review
- Provide contradiction explanations
- Recommend resolution approaches
- Wait for human decision

---

## Loop Constraints

### Read-Only Constraint
- ClawDBot only detects contradictions
- ClawDBot does not resolve contradictions
- ClawDBot does not modify data
- ClawDBot does not trigger actions

### Deterministic Constraint
- Same inputs produce same outputs
- No randomness in contradiction detection
- Reproducible contradiction analysis

### Explainable Constraint
- All contradiction signals include explanations
- All resolution recommendations are documented
- All contradiction analyses include reasoning

---

## Integration Points

### Input Integration
- Reads validation reports from files/database (via runner)
- Reads governance reports from files/database (via runner)
- Reads trend data from trend_scan outputs (via runner)
- Reads previous analyses from files/database (via runner)

### Output Integration
- Produces JSON outputs (per output contract)
- Runner saves outputs to files
- Runner routes outputs for human review
- Human reviews contradiction signals

---

## Human Review Process

### Review Steps

1. **Receive Contradiction Signals**
   - Human receives contradiction signals from ClawDBot
   - Reviews contradiction descriptions and explanations
   - Assesses contradiction severity and confidence

2. **Evaluate Contradictions**
   - Evaluates contradiction validity
   - Evaluates contradiction impact
   - Evaluates resolution strategies

3. **Decide on Resolution**
   - Decides on resolution approach
   - Decides on resolution priority
   - Decides on resolution timing

4. **Resolve Contradictions** (if approved)
   - Resolves contradictions (via Cursor or manual)
   - Monitors resolution results
   - Updates contradiction analysis

---

## Safety Guarantees

### Read-Only Guarantee
- ClawDBot never resolves contradictions
- ClawDBot never modifies data
- ClawDBot never triggers actions

### Human Gate Guarantee
- All contradiction signals require human review
- No autonomous contradiction resolution
- Human approval required for all resolutions

### Deterministic Guarantee
- Same inputs produce same outputs
- Reproducible contradiction detection
- No randomness in contradiction analysis

---

## References

- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Contradiction Rules**: `clawdbot/scoring/contradiction_rules.md` (scoring logic)
- **Trend Scan Loop**: `clawdbot/planner_loops/trend_scan.md`