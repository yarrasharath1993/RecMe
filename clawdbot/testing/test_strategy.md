# Testing Strategy

**Generated**: January 25, 2026  
**Purpose**: Safe testing strategy for ClawDBot planner loops (NO CODE)

---

## Overview

ClawDBot is tested against **static JSON feeds** to verify determinism, no side effects, and confidence behavior. All testing is safe and does not affect production systems.

---

## Testing Principles

### Static Feed Testing

#### Definition
Test ClawDBot with static JSON input files, not live data.

#### Application
- Use pre-recorded JSON inputs
- No live API calls during testing
- No database access during testing
- Reproducible test results

#### Benefits
- Deterministic tests
- No side effects
- Fast test execution
- No external dependencies

---

### Determinism Verification

#### Definition
Verify that same inputs produce same outputs.

#### Application
- Run same inputs multiple times
- Compare outputs
- Verify outputs are identical
- Verify no randomness

#### Verification
- Same inputs → Same outputs
- No randomness in outputs
- Reproducible results
- Deterministic behavior

---

### Side Effect Verification

#### Definition
Verify that ClawDBot has no side effects.

#### Application
- Monitor for file writes
- Monitor for database writes
- Monitor for API calls
- Monitor for state changes

#### Verification
- No file writes (except via runner)
- No database writes
- No API calls
- No state mutations

---

### Confidence Behavior Verification

#### Definition
Verify that confidence scores behave sanely.

#### Application
- Test with high-quality inputs → High confidence
- Test with low-quality inputs → Low confidence
- Test with mixed inputs → Medium confidence
- Verify confidence calculations

#### Verification
- Confidence correlates with input quality
- Confidence scores are valid (0.0-1.0)
- Confidence calculations are consistent
- Confidence behavior is explainable

---

## Test Scenarios

### Scenario 1: Static Feed Test

#### Setup
- Use static JSON feed files
- Pre-recorded inputs
- No live data

#### Execution
1. Load static JSON inputs
2. Invoke ClawDBot with inputs
3. Capture outputs
4. Verify outputs

#### Verification
- Outputs conform to output contract
- Outputs are deterministic
- No side effects occurred
- Confidence scores are valid

---

### Scenario 2: Draft Approval Flow Test

#### Setup
- Generate draft from ClawDBot
- Draft stored in draft store
- Human approval simulated

#### Execution
1. ClawDBot generates draft
2. Draft stored (simulated)
3. Human approves draft (simulated)
4. Cursor sends draft (simulated)

#### Verification
- Draft conforms to draft schema
- Draft has `intent: "DRAFT_ONLY"`
- Draft has required constraints
- Approval flow works correctly

---

### Scenario 3: Audit Log Verification

#### Setup
- Enable audit logging
- Run ClawDBot operations
- Capture audit logs

#### Execution
1. Run ClawDBot operations
2. Capture audit logs
3. Verify log entries
4. Verify log completeness

#### Verification
- All operations logged
- Log entries are complete
- Log entries are accurate
- No missing log entries

---

## Test Data

### Static JSON Feeds

#### Trend Feed Example
```json
{
  "feed_type": "trend",
  "items": [
    {
      "title": "Action-comedy genre trending",
      "source": "RSS feed",
      "timestamp": "2026-01-25T12:00:00Z"
    }
  ]
}
```

#### Validation Report Example
```json
{
  "report_id": "report-001",
  "timestamp": "2026-01-25T12:00:00Z",
  "issues": [
    {
      "issue_id": "issue-001",
      "severity": "high",
      "description": "Missing director data"
    }
  ]
}
```

---

## Test Execution

### Manual Testing

#### Process
1. Prepare static JSON inputs
2. Run ClawDBot CLI with inputs
3. Review outputs
4. Verify outputs

#### Commands
```bash
# Test trend scan loop
npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json

# Test opportunity detection loop
npx tsx scripts/intel/clawdbot.ts --opportunity-input=test-data/opportunity-feed.json
```

---

### Automated Testing (Future)

#### Process
1. Automated test runner
2. Load test data
3. Invoke ClawDBot
4. Verify outputs
5. Report results

#### Test Framework
- Jest or similar test framework
- Test data fixtures
- Output validation
- Side effect detection

---

## Test Verification

### Output Verification

#### Checks
- Outputs conform to output contract
- Required fields present
- Field types correct
- Field values valid

#### Validation
- Schema validation
- Constraint validation
- Confidence validation
- Determinism validation

---

### Side Effect Verification

#### Checks
- No file writes (except via runner)
- No database writes
- No API calls
- No state mutations

#### Validation
- File system monitoring
- Database monitoring
- Network monitoring
- State monitoring

---

### Confidence Verification

#### Checks
- Confidence scores valid (0.0-1.0)
- Confidence correlates with input quality
- Confidence calculations consistent
- Confidence behavior explainable

#### Validation
- Confidence range validation
- Confidence correlation analysis
- Confidence calculation verification
- Confidence explanation verification

---

## Test Reporting

### Test Results Format

```json
{
  "test_id": "test-001",
  "test_name": "Static Feed Test",
  "timestamp": "2026-01-25T12:00:00Z",
  "status": "passed",
  "results": {
    "determinism": "passed",
    "side_effects": "passed",
    "confidence": "passed",
    "output_contract": "passed"
  }
}
```

---

## Safety Guarantees

### Test Safety

1. **No Production Impact**
   - Tests use static data
   - Tests do not affect production
   - Tests are isolated

2. **No Side Effects**
   - Tests verify no side effects
   - Tests do not create side effects
   - Tests are safe to run

3. **Reproducible**
   - Tests produce same results
   - Tests are deterministic
   - Tests can be rerun safely

---

## References

- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`
- **Test Cases**: `clawdbot/testing/test_cases.md`