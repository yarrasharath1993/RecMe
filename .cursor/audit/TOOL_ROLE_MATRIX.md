# Tool Role Matrix

**Generated**: January 25, 2026  
**Purpose**: Explicit classification of all tools, their roles, allowed actions, and forbidden actions

---

## Cursor

### Role
**READ-ONLY SYSTEM AUDITOR AND GOVERNANCE EXTRACTOR** (Phase-0 Mode)

### Allowed Actions
- Read files and directories
- Search codebase
- Generate documentation
- Extract governance primitives
- Analyze existing patterns
- Create audit reports
- Generate conceptual designs (no code)

### Forbidden Actions
- Code generation
- File modifications
- Commits
- Deployments
- Script execution
- Pipeline modifications
- Database writes
- API calls
- LLM calls
- Agent design beyond documentation
- Optimizations
- Creativity beyond documentation
- Execution of any kind
- Proceeding past Phase-0 deliverables

### Current Status
- **Mode**: Phase-0 (STRICT)
- **Scope**: Read-only audit and governance extraction
- **Output**: Documentation only

---

## ClawDBot

### Role
**READ-ONLY INTELLIGENCE SYSTEM**

### Allowed Actions
- Accept JSON inputs (validation reports, governance reports, trend data)
- Perform pure analysis (no side effects)
- Generate JSON outputs (explanations, alerts, ideas, drafts)
- Analyze validation issues
- Analyze governance decisions
- Detect trends
- Generate editorial ideas
- Generate social media drafts
- Calculate confidence scores
- Identify contradictions

### Forbidden Actions
- Execute any code
- Commit changes
- Publish content
- Trigger tools or scripts
- Modify its own policies
- Propose system changes
- Write to database
- Write to files
- Fetch external data
- Make API calls
- Send messages (Telegram/WhatsApp)
- Auto-publish
- Run autonomously
- Modify existing enrichment/validation/governance logic
- Change confidence thresholds
- Change trust formulas
- Change rules

### Current Status
- **Location**: `lib/clawdbot/`, `scripts/intel/clawdbot.ts`
- **Runner**: `scripts/runners/clawdbot-runner.ts`
- **Autonomy**: None (always invoked)
- **Side Effects**: None (pure functions)

---

## Helper Scripts

### Enrichment Scripts

#### Role
**DATA ENRICHMENT ORCHESTRATORS**

#### Allowed Actions
- Read from external APIs (TMDB, Wikipedia, etc.)
- Read from database
- Transform data
- Write to database (with validation)
- Generate confidence scores
- Apply governance rules
- Log operations

#### Forbidden Actions
- Auto-publish without approval
- Skip validation
- Bypass governance rules
- Modify confidence thresholds
- Change trust formulas
- Delete data without explicit instruction
- Commit changes
- Trigger other scripts autonomously

### Validation Scripts

#### Role
**DATA QUALITY VALIDATORS**

#### Allowed Actions
- Read from database
- Read from external sources
- Compare data across sources
- Calculate validation scores
- Generate validation reports
- Flag issues
- Suggest fixes (with confidence scores)

#### Forbidden Actions
- Auto-apply fixes without approval
- Skip confidence checks
- Modify data directly
- Bypass governance rules
- Commit changes
- Trigger other scripts autonomously

### Fix Scripts

#### Role
**DATA CORRECTION APPLIERS**

#### Allowed Actions
- Read validation reports
- Read from database
- Apply fixes (with approval)
- Log all changes
- Generate change reports

#### Forbidden Actions
- Auto-apply without explicit approval
- Skip validation
- Bypass confidence thresholds
- Delete data without explicit instruction
- Commit changes autonomously
- Trigger other scripts autonomously

### Audit Scripts

#### Role
**SYSTEM AUDITORS**

#### Allowed Actions
- Read from database
- Analyze data quality
- Generate audit reports
- Identify issues
- Calculate metrics

#### Forbidden Actions
- Modify data
- Auto-apply fixes
- Commit changes
- Trigger other scripts autonomously

---

## External Services

### TMDB API

#### Role
**MOVIE METADATA PROVIDER**

#### Allowed Actions
- Provide movie metadata
- Provide cast/crew data
- Provide poster images
- Provide ratings

#### Forbidden Actions
- Modify database
- Trigger scripts
- Auto-publish

### Groq API

#### Role
**LLM INFERENCE PROVIDER**

#### Allowed Actions
- Generate text (synopsis, taglines, translations)
- Infer genres
- Analyze patterns

#### Forbidden Actions
- Modify database
- Trigger scripts
- Auto-publish
- Generate executable code
- Make decisions autonomously

### OpenAI API

#### Role
**LLM INFERENCE PROVIDER (FALLBACK)**

#### Allowed Actions
- Generate text (when Groq unavailable)
- Infer patterns

#### Forbidden Actions
- Modify database
- Trigger scripts
- Auto-publish
- Generate executable code
- Make decisions autonomously

### Supabase Database

#### Role
**PRIMARY DATA STORE**

#### Allowed Actions
- Store data
- Query data
- Enforce schema constraints
- Provide real-time subscriptions

#### Forbidden Actions
- Auto-modify data
- Trigger scripts autonomously
- Bypass validation

### Telegram Bot API

#### Role
**NOTIFICATION PROVIDER**

#### Allowed Actions
- Send messages (with approval)
- Receive updates (future)

#### Forbidden Actions
- Auto-send without approval
- Modify database
- Trigger scripts autonomously

---

## Runner Scripts

### ClawDBot Runner

#### Role
**SCHEDULER AND I/O HANDLER**

#### Allowed Actions
- Schedule ClawDBot execution
- Read reports from files/database
- Invoke ClawDBot CLI
- Save outputs to files
- Send to Telegram (with approval checks)
- Log operations

#### Forbidden Actions
- Modify ClawDBot logic
- Auto-send drafts requiring approval
- Skip approval checks
- Trigger other scripts autonomously
- Commit changes
- Modify database directly

---

## Governance Rules

### Source of Truth
- Human decisions
- ClawDBot analysis (read-only)
- Validation reports
- Governance reports

### Task Execution
- Implement EXACTLY what is approved
- No creativity beyond approved scope
- No optimization without approval
- No interpretation beyond approved scope

### Constraints
- No publishing without approval
- No schema changes unless explicit
- No model switching without approval
- No LLM calls by Cursor
- No autonomous execution
- No recursive self-modification

---

## Approval Matrix

### Level 1: Auto-Apply (High Confidence)
- Confidence ≥ 90%
- Source consensus ≥ 3 sources
- Governance rules pass
- No conflicts detected

### Level 2: Flag for Review (Medium Confidence)
- Confidence 75-89%
- Source consensus 2 sources
- Minor conflicts detected
- Governance rules pass with warnings

### Level 3: Manual Review Required (Low Confidence)
- Confidence < 75%
- Single source or conflicts
- Governance rules fail
- High-risk operations

### Level 4: Human Approval Required (Critical)
- Schema changes
- Deletions
- Publishing
- Model switching
- System changes
- Policy modifications

---

## Safety Guarantees

### ClawDBot
- ✅ Read-only (no side effects)
- ✅ Non-autonomous (always invoked)
- ✅ Pure functions (deterministic)
- ✅ JSON-only (no executable code)
- ✅ Reviewable outputs

### Cursor (Phase-0)
- ✅ Read-only (no modifications)
- ✅ Documentation only (no code)
- ✅ Audit only (no execution)
- ✅ Governance extraction (no design)

### Scripts
- ✅ Manual triggers (no autonomous execution)
- ✅ Validation gates (no bypass)
- ✅ Governance checks (no rule violations)
- ✅ Approval requirements (no auto-publish)