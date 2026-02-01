# Test Cases

**Generated**: January 25, 2026  
**Purpose**: Specific test cases for ClawDBot planner loops (NO CODE)

---

## Test Case Categories

### 1. Determinism Tests

#### Test Case 1.1: Same Inputs Produce Same Outputs

**Description**: Verify that running ClawDBot with the same inputs multiple times produces identical outputs.

**Setup**:
- Static JSON input file: `test-data/trend-feed.json`
- Run ClawDBot 3 times with same input

**Execution**:
1. Run 1: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
2. Run 2: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
3. Run 3: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`

**Verification**:
- Output 1 === Output 2 === Output 3
- All outputs identical
- No randomness detected

**Expected Result**: ✅ **PASS** - All outputs identical

---

#### Test Case 1.2: Output Contract Compliance

**Description**: Verify that all outputs conform to the output contract schema.

**Setup**:
- Static JSON input file: `test-data/trend-feed.json`
- Run ClawDBot with input

**Execution**:
1. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
2. Capture output
3. Validate against output contract schema

**Verification**:
- All required fields present
- Field types correct
- Field values valid
- Constraints present

**Expected Result**: ✅ **PASS** - Output conforms to contract

---

### 2. Side Effect Tests

#### Test Case 2.1: No File Writes

**Description**: Verify that ClawDBot does not write files directly.

**Setup**:
- Monitor file system
- Run ClawDBot with inputs

**Execution**:
1. Monitor file system for writes
2. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
3. Check for file writes

**Verification**:
- No file writes by ClawDBot
- Only runner writes files (if applicable)
- No direct file access

**Expected Result**: ✅ **PASS** - No file writes by ClawDBot

---

#### Test Case 2.2: No Database Writes

**Description**: Verify that ClawDBot does not write to database.

**Setup**:
- Monitor database for writes
- Run ClawDBot with inputs

**Execution**:
1. Monitor database for writes
2. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
3. Check for database writes

**Verification**:
- No database writes by ClawDBot
- No database connections by ClawDBot
- No database modifications

**Expected Result**: ✅ **PASS** - No database writes

---

#### Test Case 2.3: No API Calls

**Description**: Verify that ClawDBot does not make API calls.

**Setup**:
- Monitor network for API calls
- Run ClawDBot with inputs

**Execution**:
1. Monitor network for API calls
2. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
3. Check for API calls

**Verification**:
- No API calls by ClawDBot
- No network requests by ClawDBot
- No external service calls

**Expected Result**: ✅ **PASS** - No API calls

---

### 3. Confidence Tests

#### Test Case 3.1: High-Quality Inputs Produce High Confidence

**Description**: Verify that high-quality inputs produce high confidence scores.

**Setup**:
- High-quality JSON input: `test-data/high-quality-trend-feed.json`
- Run ClawDBot with input

**Execution**:
1. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/high-quality-trend-feed.json`
2. Capture confidence score

**Verification**:
- Confidence score ≥ 0.85
- Confidence score valid (0.0-1.0)
- Confidence calculation correct

**Expected Result**: ✅ **PASS** - High confidence (≥ 0.85)

---

#### Test Case 3.2: Low-Quality Inputs Produce Low Confidence

**Description**: Verify that low-quality inputs produce low confidence scores.

**Setup**:
- Low-quality JSON input: `test-data/low-quality-trend-feed.json`
- Run ClawDBot with input

**Execution**:
1. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/low-quality-trend-feed.json`
2. Capture confidence score

**Verification**:
- Confidence score < 0.75
- Confidence score valid (0.0-1.0)
- Confidence calculation correct

**Expected Result**: ✅ **PASS** - Low confidence (< 0.75)

---

#### Test Case 3.3: Confidence Score Validity

**Description**: Verify that all confidence scores are valid (0.0-1.0).

**Setup**:
- Multiple JSON inputs with varying quality
- Run ClawDBot with each input

**Execution**:
1. Run ClawDBot with multiple inputs
2. Capture confidence scores
3. Validate confidence scores

**Verification**:
- All confidence scores between 0.0 and 1.0
- No invalid confidence scores
- Confidence scores are numbers

**Expected Result**: ✅ **PASS** - All confidence scores valid

---

### 4. Draft Approval Flow Tests

#### Test Case 4.1: Draft Generation

**Description**: Verify that ClawDBot generates valid drafts.

**Setup**:
- Static JSON inputs
- Run ClawDBot with draft generation enabled

**Execution**:
1. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json --generate-drafts`
2. Capture drafts

**Verification**:
- Drafts conform to draft schema
- Drafts have `intent: "DRAFT_ONLY"`
- Drafts have required constraints
- Drafts are valid

**Expected Result**: ✅ **PASS** - Valid drafts generated

---

#### Test Case 4.2: Draft Approval Flow

**Description**: Verify that draft approval flow works correctly.

**Setup**:
- Generate draft from ClawDBot
- Simulate human approval
- Simulate Cursor sending

**Execution**:
1. ClawDBot generates draft
2. Draft stored (simulated)
3. Human approves draft (simulated)
4. Cursor validates draft
5. Cursor sends draft (simulated)

**Verification**:
- Draft requires approval
- Approval flow works
- Cursor validates before sending
- Draft sent only if approved

**Expected Result**: ✅ **PASS** - Approval flow works

---

#### Test Case 4.3: Draft Rejection Flow

**Description**: Verify that draft rejection flow works correctly.

**Setup**:
- Generate draft from ClawDBot
- Simulate human rejection

**Execution**:
1. ClawDBot generates draft
2. Draft stored (simulated)
3. Human rejects draft (simulated)
4. Draft not sent

**Verification**:
- Draft can be rejected
- Rejected drafts not sent
- Rejection flow works
- Draft status updated

**Expected Result**: ✅ **PASS** - Rejection flow works

---

### 5. Audit Log Tests

#### Test Case 5.1: Operation Logging

**Description**: Verify that all operations are logged.

**Setup**:
- Enable audit logging
- Run ClawDBot operations

**Execution**:
1. Run ClawDBot: `npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json`
2. Check audit logs

**Verification**:
- Operation logged
- Log entry complete
- Log entry accurate
- Timestamp present

**Expected Result**: ✅ **PASS** - Operation logged

---

#### Test Case 5.2: Log Completeness

**Description**: Verify that all operations have complete log entries.

**Setup**:
- Enable audit logging
- Run multiple ClawDBot operations

**Execution**:
1. Run multiple ClawDBot operations
2. Check audit logs
3. Verify log completeness

**Verification**:
- All operations logged
- Log entries complete
- No missing log entries
- Log entries accurate

**Expected Result**: ✅ **PASS** - All operations logged

---

## Test Data Files

### Required Test Data Files

1. `test-data/trend-feed.json` - Sample trend feed
2. `test-data/high-quality-trend-feed.json` - High-quality trend feed
3. `test-data/low-quality-trend-feed.json` - Low-quality trend feed
4. `test-data/validation-report.json` - Sample validation report
5. `test-data/governance-report.json` - Sample governance report
6. `test-data/opportunity-feed.json` - Sample opportunity feed

---

## Test Execution Commands

### Manual Test Execution

```bash
# Test determinism
npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json > output1.json
npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json > output2.json
diff output1.json output2.json  # Should be empty

# Test output contract compliance
npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json | jq '.loop, .timestamp, .confidence, .signals, .ideas, .risks, .recommended_actions, .constraints'

# Test draft generation
npx tsx scripts/intel/clawdbot.ts --trend-input=test-data/trend-feed.json --generate-drafts | jq '.drafts'
```

---

## Test Results

### Expected Test Results

#### All Tests Should Pass

- ✅ Determinism tests: PASS
- ✅ Side effect tests: PASS
- ✅ Confidence tests: PASS
- ✅ Draft approval flow tests: PASS
- ✅ Audit log tests: PASS

---

## References

- **Test Strategy**: `clawdbot/testing/test_strategy.md`
- **Output Contract**: `clawdbot/planner_loops/output_contract.md`
- **Draft Schema**: `clawdbot/messaging/draft_schema.md`
- **Confidence Model**: `clawdbot/scoring/confidence_model.md`