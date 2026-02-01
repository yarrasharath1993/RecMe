# Contradiction Rules

**Generated**: January 25, 2026  
**Purpose**: Conceptual design for ClawDBot contradiction detection and resolution rules (NO CODE)

---

## Overview

ClawDBot detects contradictions in its analyses, insights, and recommendations. Contradictions are resolved through human review, with ClawDBot providing explanations and recommendations.

---

## Contradiction Types

### Data Contradictions

#### Definition
Contradictions in input data from different sources

#### Examples
- Different release years for same movie
- Different directors for same movie
- Different genres for same movie
- Different ratings for same movie

#### Detection Criteria
- Multiple sources provide conflicting data
- Conflict confidence ≥ medium
- Conflict severity ≥ medium

#### Resolution
- Flag for human review
- Provide contradiction explanation
- Recommend resolution approach
- Wait for human decision

---

### Analysis Contradictions

#### Definition
Contradictions in analysis results

#### Examples
- Conflicting trend signals
- Conflicting validation insights
- Conflicting governance findings
- Conflicting recommendations

#### Detection Criteria
- Multiple analyses produce conflicting results
- Conflict confidence ≥ medium
- Conflict severity ≥ medium

#### Resolution
- Flag for human review
- Provide contradiction explanation
- Recommend resolution approach
- Wait for human decision

---

### Recommendation Contradictions

#### Definition
Contradictions in recommendations

#### Examples
- Conflicting enrichment recommendations
- Conflicting fix recommendations
- Conflicting publishing recommendations
- Conflicting action recommendations

#### Detection Criteria
- Multiple recommendations conflict
- Conflict confidence ≥ medium
- Conflict severity ≥ medium

#### Resolution
- Flag for human review
- Provide contradiction explanation
- Recommend resolution approach
- Wait for human decision

---

## Contradiction Detection

### Detection Process

1. **Identify Contradictions**
   - Compare data across sources
   - Compare analysis results
   - Compare recommendations
   - Identify conflicts

2. **Assess Contradiction Severity**
   - Assess conflict impact
   - Assess conflict confidence
   - Assess conflict urgency
   - Classify contradiction severity

3. **Generate Contradiction Reports**
   - Document contradictions
   - Explain contradictions
   - Recommend resolutions
   - Prioritize contradictions

---

## Contradiction Severity Levels

### Critical Contradictions

#### Criteria
- High impact on system
- High confidence in contradiction
- Urgent resolution needed
- Critical data affected

#### Examples
- Critical validation contradictions
- Critical governance contradictions
- Critical publishing contradictions
- Critical action contradictions

#### Resolution
- Immediate human review required
- High priority in review queue
- Strong recommendation for resolution
- Urgent action needed

---

### High Severity Contradictions

#### Criteria
- Medium-high impact on system
- Medium-high confidence in contradiction
- Standard resolution needed
- Important data affected

#### Examples
- Important validation contradictions
- Important governance contradictions
- Important publishing contradictions
- Important action contradictions

#### Resolution
- Human review required within 24 hours
- High priority in review queue
- Moderate recommendation for resolution
- Standard action needed

---

### Medium Severity Contradictions

#### Criteria
- Medium impact on system
- Medium confidence in contradiction
- Low-urgency resolution needed
- Moderate data affected

#### Examples
- Moderate validation contradictions
- Moderate governance contradictions
- Moderate publishing contradictions
- Moderate action contradictions

#### Resolution
- Human review required within 48 hours
- Medium priority in review queue
- Weak recommendation for resolution
- Low-urgency action needed

---

### Low Severity Contradictions

#### Criteria
- Low impact on system
- Low confidence in contradiction
- Optional resolution needed
- Minor data affected

#### Examples
- Minor validation contradictions
- Minor governance contradictions
- Minor publishing contradictions
- Minor action contradictions

#### Resolution
- Human review optional
- Low priority in review queue
- No strong recommendation for resolution
- Optional action needed

---

## Contradiction Resolution Strategies

### Source Priority Strategy

#### Definition
Resolve contradictions by prioritizing higher-tier sources

#### Application
- Tier-1 sources override tier-2 sources
- Tier-2 sources override tier-3 sources
- Tier-1 sources override tier-3 sources

#### Examples
- Wikipedia data overrides blog data
- Official sources override fan sites
- Verified sources override unverified sources

---

### Consensus Strategy

#### Definition
Resolve contradictions by choosing the consensus value

#### Application
- Choose value agreed upon by most sources
- Weight by source tier
- Weight by source reliability

#### Examples
- 3 sources agree on value → Use consensus value
- 2 tier-1 sources agree → Use consensus value
- Majority of sources agree → Use consensus value

---

### Recency Strategy

#### Definition
Resolve contradictions by choosing the most recent value

#### Application
- Choose value from most recent source
- Weight by data freshness
- Weight by source reliability

#### Examples
- Recent data overrides stale data
- Fresh sources override old sources
- Updated data overrides outdated data

---

### Human Review Strategy

#### Definition
Resolve contradictions through human review

#### Application
- Flag contradictions for human review
- Provide contradiction explanations
- Recommend resolution approaches
- Wait for human decision

#### Examples
- Critical contradictions → Human review
- High-confidence contradictions → Human review
- Complex contradictions → Human review

---

## Contradiction Reporting

### Contradiction Reports

#### Format
```json
{
  "contradiction_type": "data",
  "contradiction_description": "Different release years for same movie",
  "contradiction_severity": "high",
  "contradiction_confidence": 0.85,
  "contradiction_sources": [
    {"source": "TMDB", "value": "2020"},
    {"source": "Wikipedia", "value": "2021"}
  ],
  "contradiction_explanation": "TMDB and Wikipedia provide different release years",
  "resolution_recommendation": "Use TMDB value (tier-1 source, more reliable)",
  "resolution_priority": "high"
}
```

### Contradiction Summaries

#### Format
```json
{
  "total_contradictions": 10,
  "critical_contradictions": 2,
  "high_severity_contradictions": 3,
  "medium_severity_contradictions": 4,
  "low_severity_contradictions": 1,
  "contradiction_details": [...]
}
```

---

## Contradiction Handling

### Automatic Handling

#### Criteria
- Low severity contradictions
- High confidence in resolution
- Standard resolution strategy applicable
- No human review required

#### Actions
- Apply resolution strategy
- Log resolution
- Update data/analysis
- Continue processing

---

### Human Review Handling

#### Criteria
- Critical/high severity contradictions
- Low confidence in resolution
- Complex contradictions
- Human review required

#### Actions
- Flag for human review
- Generate contradiction report
- Provide resolution recommendations
- Wait for human decision

---

## Contradiction Prevention

### Prevention Strategies

1. **Source Validation**
   - Validate sources before use
   - Check source reliability
   - Verify source consistency

2. **Analysis Validation**
   - Validate analysis results
   - Check analysis consistency
   - Verify analysis accuracy

3. **Recommendation Validation**
   - Validate recommendations
   - Check recommendation consistency
   - Verify recommendation feasibility

---

## Contradiction Monitoring

### Monitoring Metrics

1. **Contradiction Frequency**: How often contradictions occur
2. **Contradiction Types**: Types of contradictions (data, analysis, recommendation)
3. **Contradiction Severity**: Severity distribution of contradictions
4. **Contradiction Resolution Time**: Time to resolve contradictions

### Reporting

1. **Daily Contradiction Report**: Daily summary of contradictions
2. **Weekly Contradiction Summary**: Weekly summary of contradictions
3. **Monthly Contradiction Analysis**: Monthly analysis of contradictions
4. **Contradiction Trends**: Trends in contradiction frequency and types