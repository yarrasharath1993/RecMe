# Cursor Handoff Integration

**Generated**: January 25, 2026  
**Purpose**: How planner loop outputs integrate with Cursor handoff format (NO CODE)

**Reference**: `.cursor/governance/handoff_format.md` (existing handoff format)

---

## Overview

Planner loop outputs are mapped to the Cursor handoff format for execution. The handoff format ensures that Cursor only acts on human-approved, constraint-satisfied outputs.

---

## Handoff Format Mapping

### Planner Loop Output → Handoff Format

#### Planner Loop Output Format
```json
{
  "loop": "trend_scan",
  "timestamp": "2026-01-25T12:00:00Z",
  "confidence": 0.85,
  "signals": [...],
  "ideas": [...],
  "risks": [...],
  "recommended_actions": [...],
  "constraints": [...]
}
```

#### Cursor Handoff Format
```json
{
  "intent": "IMPLEMENT_DRAFT",
  "approved_by": "human",
  "confidence": 0.85,
  "actions": [...],
  "constraints": [...]
}
```

---

## Mapping Rules

### Intent Mapping

#### Planner Loop → Intent

| Planner Loop | Intent | Description |
|--------------|--------|-------------|
| `trend_scan` | `REVIEW_SIGNALS` | Review trend signals |
| `opportunity_detection` | `REVIEW_OPPORTUNITIES` | Review opportunities |
| `content_idea_planning` | `IMPLEMENT_DRAFT` | Implement content ideas |
| `contradiction_detection` | `RESOLVE_CONTRADICTIONS` | Resolve contradictions |
| `daily_digest` | `REVIEW_DIGEST` | Review daily digest |

---

### Actions Mapping

#### Recommended Actions → Handoff Actions

#### Mapping Process
1. Extract `recommended_actions` from planner loop output
2. Map each action to handoff action format
3. Include action metadata
4. Validate actions

#### Example Mapping
```json
// Planner loop recommended action
{
  "type": "implementation_action",
  "action_id": "action-001",
  "description": "Consider writing editorial article about action-comedy trend",
  "priority": "high",
  "confidence": 0.80,
  "metadata": {
    "related_idea": "idea-001"
  }
}

// Mapped to handoff action
{
  "type": "implement_draft",
  "draft_id": "draft-001",
  "draft_content": "...",
  "platform": "blog",
  "priority": "high",
  "confidence": 0.80,
  "metadata": {
    "related_idea": "idea-001"
  }
}
```

---

### Constraints Mapping

#### Planner Loop Constraints → Handoff Constraints

#### Mapping Process
1. Extract `constraints` from planner loop output
2. Map to handoff constraint format
3. Include required constraints
4. Validate constraints

#### Example Mapping
```json
// Planner loop constraints
[
  "READ_ONLY",
  "NO_PUBLISH",
  "HUMAN_REVIEW_REQUIRED"
]

// Mapped to handoff constraints
[
  {
    "type": "confidence_threshold",
    "value": 0.75
  },
  {
    "type": "no_publish",
    "value": true
  },
  {
    "type": "approval_level",
    "value": "standard"
  }
]
```

---

## Handoff Generation Process

### Step 1: Planner Loop Generates Output

1. Planner loop executes
2. Planner loop produces output (per output contract)
3. Output saved to file (via runner)

---

### Step 2: Human Reviews Output

1. Human receives planner loop output
2. Human reviews signals, ideas, risks, actions
3. Human decides on implementation
4. Human approves or rejects

---

### Step 3: Generate Handoff (If Approved)

1. Map planner loop output to handoff format
2. Set `approved_by` to `"human"`
3. Map recommended actions to handoff actions
4. Map constraints to handoff constraints
5. Validate handoff

---

### Step 4: Cursor Receives Handoff

1. Cursor receives handoff JSON
2. Cursor validates handoff
3. Cursor checks `approved_by` field
4. If `approved_by = "human"`: Cursor may act (if other constraints met)
5. If `approved_by ≠ "human"`: Cursor must NOT act

---

## Handoff Examples

### Example 1: Trend Scan → Review Handoff

#### Planner Loop Output
```json
{
  "loop": "trend_scan",
  "confidence": 0.85,
  "signals": [
    {
      "type": "trend_signal",
      "signal_id": "trend-001",
      "description": "Action-comedy genre gaining popularity",
      "confidence": 0.85,
      "priority": "high"
    }
  ],
  "recommended_actions": [
    {
      "type": "review_action",
      "action_id": "action-001",
      "description": "Review emerging trend signal",
      "priority": "high",
      "confidence": 0.80
    }
  ]
}
```

#### Mapped Handoff
```json
{
  "intent": "REVIEW_SIGNALS",
  "approved_by": "human",
  "confidence": 0.85,
  "actions": [
    {
      "type": "review_signal",
      "signal_id": "trend-001",
      "description": "Review emerging trend signal for action-comedy genre",
      "priority": "high",
      "confidence": 0.80
    }
  ],
  "constraints": [
    {
      "type": "confidence_threshold",
      "value": 0.75
    },
    {
      "type": "approval_level",
      "value": "standard"
    }
  ]
}
```

---

### Example 2: Content Idea Planning → Implement Draft Handoff

#### Planner Loop Output
```json
{
  "loop": "content_idea_planning",
  "confidence": 0.80,
  "ideas": [
    {
      "type": "editorial_idea",
      "idea_id": "idea-001",
      "title": "Trend Analysis: Action-Comedy Genre",
      "description": "Write comprehensive article analyzing the emerging action-comedy trend",
      "confidence": 0.80,
      "priority": "high"
    }
  ],
  "recommended_actions": [
    {
      "type": "implementation_action",
      "action_id": "action-001",
      "description": "Consider writing editorial article about action-comedy trend",
      "priority": "high",
      "confidence": 0.80
    }
  ]
}
```

#### Mapped Handoff
```json
{
  "intent": "IMPLEMENT_DRAFT",
  "approved_by": "human",
  "confidence": 0.80,
  "actions": [
    {
      "type": "implement_draft",
      "draft_id": "draft-001",
      "draft_content": "Full editorial content...",
      "platform": "blog",
      "priority": "high",
      "confidence": 0.80,
      "metadata": {
        "related_idea": "idea-001"
      }
    }
  ],
  "constraints": [
    {
      "type": "confidence_threshold",
      "value": 0.75
    },
    {
      "type": "approval_level",
      "value": "standard"
    },
    {
      "type": "no_publish",
      "value": true
    }
  ]
}
```

---

## Handoff Validation

### Validation Rules

#### Required Checks
1. `approved_by` must be `"human"`
2. `confidence` must be valid (0.0-1.0)
3. `actions` must be valid
4. `constraints` must be satisfied

#### Validation Failure
- Reject handoff
- Log validation error
- Return error result
- Do not execute

---

## Integration Safety

### Safety Guarantees

1. **Human Approval Required**
   - All handoffs require `approved_by: "human"`
   - ClawDBot outputs are not approved
   - Human approval is explicit

2. **Constraint Enforcement**
   - All constraints must be satisfied
   - Constraint violations prevent execution
   - Constraints are validated

3. **Confidence Thresholds**
   - Confidence must meet thresholds
   - Low confidence requires enhanced approval
   - Confidence is validated

---

## References

- **Handoff Format**: `.cursor/governance/handoff_format.md`
- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Execution Contract**: `.cursor/constraints/execution_contract.md`