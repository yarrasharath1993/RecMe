# Trend Scan Planner Loop

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot trend scanning planner loop (NO CODE)

**Repurposed from**: `clawdbot/loops/trend_monitoring.md`

---

## Overview

ClawDBot scans external feeds (RSS, APIs, news sources) for trends in movie data, entertainment industry, and related domains. This loop operates as a read-only planner that produces trend signals for human review.

---

## Loop Characteristics

### Trigger
- **Type**: Scheduled (external scheduler)
- **Frequency**: Every 2-4 hours
- **Scheduler**: External cron/system scheduler (not ClawDBot's own scheduler)

### Human Gate
✅ **YES** - All trend signals require human review before action

### Automation Level
🟢 **READ-ONLY** - ClawDBot only scans and analyzes trends, does not act on them

### Risk Level
🟢 **LOW** - Read-only analysis, no side effects

---

## Loop Design

### Input Sources

1. **External Feeds** (via fetchers)
   - RSS feeds (entertainment news, movie news)
   - API feeds (TMDB trends, social media trends)
   - News feeds (industry news, celebrity news)
   - Trend feeds (Google Trends, Twitter trends)

2. **Internal Data** (via runner)
   - Recent validation reports (last 7-30 days)
   - Governance reports
   - Historical trend data

3. **Fetcher Integration**
   - External fetchers fetch data (dumb, replaceable, non-AI)
   - Fetchers convert to JSON format
   - ClawDBot receives JSON inputs only

### Processing

1. **Feed Scanning**
   - Scan external feeds via fetchers
   - Parse feed data into structured format
   - Identify trend indicators
   - Extract trend metadata

2. **Trend Detection**
   - Identify emerging trends (new patterns)
   - Identify peaking trends (rapid growth)
   - Identify declining trends (rapid decline)
   - Identify stable trends (no significant change)

3. **Trend Analysis**
   - Calculate trend strength (rate of change)
   - Calculate trend confidence (data quality, source reliability)
   - Identify trend drivers (causal factors)
   - Predict trend trajectory (future direction)

4. **Signal Generation**
   - Generate trend signals (emerging, peaking, declining)
   - Assign priority (high, medium, low)
   - Assign confidence (using confidence model)
   - Generate explanations

### Outputs

**Format**: Must conform to `clawdbot/planner_loops/output_contract.md`

```json
{
  "loop": "trend_scan",
  "timestamp": "2026-01-25T12:00:00Z",
  "confidence": 0.85,
  "signals": [
    {
      "type": "trend_signal",
      "signal_id": "trend-001",
      "description": "Action-comedy genre gaining popularity",
      "confidence": 0.85,
      "priority": "high",
      "metadata": {
        "trend_strength": 0.75,
        "trend_drivers": ["Recent hit movies", "Audience preference shift"],
        "trend_trajectory": "Continuing upward trend",
        "sources": ["RSS feed: Entertainment Weekly", "API: TMDB trends"]
      }
    }
  ],
  "ideas": [],
  "risks": [],
  "recommended_actions": [
    {
      "type": "review_action",
      "action_id": "action-001",
      "description": "Review emerging trend signal for action-comedy genre",
      "priority": "high",
      "confidence": 0.80,
      "metadata": {
        "related_signal": "trend-001"
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

## Trend Types

### Emerging Trends

#### Definition
New patterns appearing in external feeds that were not present before

#### Detection Criteria
- Pattern appears in recent feeds (last 2-4 hours)
- Pattern strength increasing
- Pattern confidence ≥ medium (based on source reliability)

#### Output Signal Format
```json
{
  "type": "trend_signal",
  "signal_id": "trend-001",
  "description": "Action-comedy genre gaining popularity",
  "confidence": 0.85,
  "priority": "high",
  "metadata": {
    "trend_type": "emerging",
    "trend_strength": 0.75,
    "trend_drivers": ["Recent hit movies", "Audience preference shift"],
    "trend_trajectory": "Continuing upward trend",
    "sources": ["RSS feed: Entertainment Weekly", "API: TMDB trends"]
  }
}
```

---

### Peaking Trends

#### Definition
Trends that are rapidly growing and may be reaching their peak

#### Detection Criteria
- Pattern strength rapidly increasing
- Pattern approaching historical maximum
- Pattern confidence ≥ medium

#### Output Signal Format
```json
{
  "type": "trend_signal",
  "signal_id": "trend-002",
  "description": "Romantic comedy genre peaking",
  "confidence": 0.80,
  "priority": "medium",
  "metadata": {
    "trend_type": "peaking",
    "trend_strength": 0.90,
    "trend_drivers": ["Recent successful releases", "Audience demand"],
    "trend_trajectory": "Approaching peak, may decline soon",
    "sources": ["RSS feed: Variety", "API: Social media trends"]
  }
}
```

---

### Declining Trends

#### Definition
Trends that are rapidly declining and may be disappearing

#### Detection Criteria
- Pattern strength rapidly decreasing
- Pattern approaching historical minimum
- Pattern confidence ≥ medium

#### Output Signal Format
```json
{
  "type": "trend_signal",
  "signal_id": "trend-003",
  "description": "Horror genre declining",
  "confidence": 0.75,
  "priority": "low",
  "metadata": {
    "trend_type": "declining",
    "trend_strength": 0.25,
    "trend_drivers": ["Lack of recent releases", "Audience preference shift"],
    "trend_trajectory": "Continuing downward trend",
    "sources": ["RSS feed: The Hollywood Reporter", "API: Box office data"]
  }
}
```

---

## Loop Constraints

### Read-Only Constraint
- ClawDBot only scans and analyzes trends
- ClawDBot does not act on trends
- ClawDBot does not modify data
- ClawDBot does not trigger actions

### Deterministic Constraint
- Same inputs produce same outputs
- No randomness in trend detection
- Reproducible trend analysis

### Explainable Constraint
- All trend signals include explanations
- All trend drivers are documented
- All trend predictions include reasoning
- All sources are documented

### External Fetcher Constraint
- ClawDBot does not fetch data directly
- All data fetching via external fetchers
- Fetchers are dumb, replaceable, non-AI

---

## Integration Points

### Input Integration
- External fetchers fetch feeds (RSS, APIs)
- Fetchers convert to JSON format
- Runner provides fetcher outputs to ClawDBot
- ClawDBot receives JSON inputs only

### Output Integration
- ClawDBot produces JSON outputs (per output contract)
- Runner saves outputs to files
- Runner routes outputs for human review
- Human reviews trend signals

---

## Human Review Process

### Review Steps

1. **Receive Trend Signals**
   - Human receives trend signals from ClawDBot
   - Reviews trend descriptions and explanations
   - Assesses trend strength and confidence

2. **Evaluate Trends**
   - Evaluates trend relevance
   - Evaluates trend accuracy
   - Evaluates trend implications

3. **Decide on Actions**
   - Decides if action is needed
   - Decides on action type
   - Decides on action priority

4. **Implement Actions** (if approved)
   - Implements approved actions (via Cursor)
   - Monitors action results
   - Updates trend analysis

---

## Safety Guarantees

### Read-Only Guarantee
- ClawDBot never modifies data
- ClawDBot never triggers actions
- ClawDBot never publishes content

### Human Gate Guarantee
- All trend signals require human review
- No autonomous action on trends
- Human approval required for all actions

### Deterministic Guarantee
- Same inputs produce same outputs
- Reproducible trend analysis
- No randomness in trend detection

### External Fetcher Guarantee
- ClawDBot does not fetch data directly
- All fetching via external fetchers
- Fetchers are replaceable and non-AI

---

## References

- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Fetcher Architecture**: `clawdbot/fetchers/interface.md`
- **Scheduling Model**: `clawdbot/scheduling/schedule_config.md`
- **Original Design**: `clawdbot/loops/trend_monitoring.md`