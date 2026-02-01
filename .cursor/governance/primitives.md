# Governance Primitives

**Generated**: January 25, 2026  
**Purpose**: Extract governance primitives from existing patterns, OSS philosophy, and system design

---

## Core Primitives (Non-Negotiable)

### 1. PLAN ≠ EXECUTE

#### Definition
Planning and execution are strictly separated. Planning produces documentation, analysis, and recommendations. Execution requires explicit approval and separate implementation.

#### Source
- Antigravity discussions (separation of concerns)
- Claude OSS philosophy (planning vs. implementation)
- Cursor official philosophy (plan mode vs. execution mode)

#### Application
- **Cursor (Phase-0)**: Plan mode produces documentation only, no execution
- **ClawDBot**: Analysis produces insights only, no execution
- **Scripts**: Execution requires explicit manual trigger

#### Violations
- Planning that includes code generation
- Analysis that triggers actions
- Documentation that modifies files

---

### 2. Confidence over Certainty

#### Definition
Systems operate on confidence scores, not binary certainty. All decisions are probabilistic, with confidence thresholds determining actions.

#### Source
- Existing confidence scoring system (`lib/confidence/confidence-calculator.ts`)
- Governance trust scoring (`lib/governance/validators.ts`)
- Multi-source consensus building (`scripts/lib/multi-source-orchestrator.ts`)

#### Application
- **Confidence Thresholds**: Auto-apply (≥90%), Flag for review (75-89%), Manual review (<75%)
- **Trust Scores**: 0-1 scale, affects content visibility
- **Source Consensus**: Weighted by source tier and agreement

#### Violations
- Binary decisions without confidence scores
- Actions without confidence thresholds
- Certainty claims without evidence

---

### 3. Event-Driven Activation (External Only)

#### Definition
Systems activate only in response to external events (manual triggers, scheduled runs, API calls). No autonomous self-activation.

#### Source
- ClawDBot design (always invoked, never autonomous)
- Script execution model (manual triggers only)
- Runner design (scheduled but requires manual start)

#### Application
- **Scripts**: Manual execution only, no autonomous triggers
- **ClawDBot**: Always invoked by runner or CLI, never self-activates
- **Runners**: Scheduled but require manual start

#### Violations
- Autonomous script execution
- Self-triggering loops
- Autonomous system activation

---

### 4. Tool Poverty

#### Definition
Systems use minimal tools, prefer simplicity, avoid unnecessary complexity. Each tool has a clear, single purpose.

#### Source
- Unix philosophy (do one thing well)
- Minimal viable tooling
- ClawDBot design (pure functions, no external dependencies)

#### Application
- **ClawDBot**: Pure functions, JSON in/out, no external tools
- **Scripts**: Focused on single tasks
- **Libraries**: Minimal dependencies

#### Violations
- Over-engineered solutions
- Unnecessary tool dependencies
- Complex tool chains

---

### 5. Human Circuit Breaker

#### Definition
All automated processes have human override mechanisms. Humans can stop, modify, or redirect any automated process.

#### Source
- Safety-critical systems design
- Human-in-the-loop AI systems
- Approval gates in existing scripts

#### Application
- **Manual Execution**: All scripts require manual trigger
- **Approval Gates**: Fixes, publishing, expensive operations require approval
- **Emergency Stop**: Ability to stop running processes (future)

#### Violations
- Processes without human override
- Autonomous decisions without approval
- No way to stop runaway processes

---

### 6. Cost-Aware Escalation

#### Definition
Systems are aware of costs (tokens, API calls, compute) and escalate to humans when costs exceed thresholds.

#### Source
- Cost optimization requirements
- Token budget management
- Rate limiting and cooldown management

#### Application
- **Rate Limiting**: Prevents excessive API calls
- **Model Fallback**: Prefers cheaper models
- **Batch Limits**: Prevents unlimited batch processing

#### Violations
- Unlimited cost accumulation
- No cost awareness
- No cost escalation

---

### 7. Air-Gapped Execution Context

#### Definition
Execution contexts are isolated. Core logic (ClawDBot) has no external dependencies. I/O (Runner) handles all external interactions.

#### Source
- ClawDBot architecture (read-only brain, I/O in runner)
- Separation of concerns
- Testability and determinism

#### Application
- **ClawDBot**: Pure functions, no DB/API/network access
- **Runner**: Handles all I/O, scheduling, external calls
- **Scripts**: Clear separation of logic and I/O

#### Violations
- Core logic with external dependencies
- I/O mixed with business logic
- Non-deterministic core functions

---

### 8. No Recursive Self-Modification

#### Definition
Systems cannot modify their own code, policies, or configuration. All modifications require explicit human approval.

#### Source
- Safety-critical systems design
- Immutable infrastructure patterns
- Governance rule enforcement

#### Application
- **ClawDBot**: Cannot modify its own policies
- **Scripts**: Cannot modify themselves
- **Governance**: Rules are immutable without explicit change

#### Violations
- Self-modifying code
- Autonomous policy changes
- Self-updating configuration

---

## Derived Primitives

### 9. Read-Only by Default

#### Definition
Systems are read-only by default. Write operations require explicit approval and are logged.

#### Source
- ClawDBot design (read-only)
- Audit requirements
- Safety-first approach

#### Application
- **ClawDBot**: Read-only, no side effects
- **Validation**: Read-only, generates reports
- **Audits**: Read-only, generates reports

---

### 10. Deterministic Outputs

#### Definition
Given the same inputs, systems produce the same outputs. No randomness, no non-deterministic behavior.

#### Source
- ClawDBot design (pure functions)
- Testability requirements
- Reproducibility requirements

#### Application
- **ClawDBot**: Pure functions, deterministic
- **Validation**: Deterministic validation rules
- **Governance**: Deterministic rule application

---

### 11. Explainable Decisions

#### Definition
All decisions are explainable. Systems provide reasoning, confidence scores, and evidence for all decisions.

#### Source
- Governance rule explanations
- Confidence score breakdowns
- Validation issue explanations

#### Application
- **ClawDBot**: Explains all analyses
- **Validation**: Explains all issues
- **Governance**: Explains all rule applications

---

### 12. Fail-Safe Defaults

#### Definition
Systems fail safely. Errors do not cause data corruption, cost escalation, or uncontrolled execution.

#### Source
- Error handling patterns
- Safety-critical systems design
- Cost control requirements

#### Application
- **Error Handling**: Graceful degradation
- **Rate Limiting**: Prevents excessive calls
- **Approval Gates**: Prevents unauthorized actions

---

## Primitives from OSS Philosophy

### 13. Transparency

#### Definition
All operations are transparent. Logs, reports, and decisions are visible and auditable.

#### Source
- Open source principles
- Audit requirements
- Governance requirements

#### Application
- **Logging**: All operations logged
- **Reports**: All decisions documented
- **Audits**: All changes tracked

---

### 14. Community-Driven Evolution

#### Definition
System evolution is driven by community needs, not autonomous optimization.

#### Source
- Open source community model
- User-driven development
- Human-centered design

#### Application
- **Feature Requests**: Human-driven
- **Improvements**: Human-driven
- **Optimizations**: Human-driven

---

### 15. Minimal Viable Governance

#### Definition
Governance is minimal but effective. Rules are necessary, not excessive.

#### Source
- Minimal viable product philosophy
- Lean governance
- Effective rule sets

#### Application
- **Governance Rules**: Focused on critical issues
- **Validation Rules**: Essential checks only
- **Approval Gates**: Critical operations only

---

## Primitives from Existing System

### 16. Multi-Source Consensus

#### Definition
Decisions are based on consensus from multiple sources, weighted by source reliability.

#### Source
- Multi-source orchestrator (`scripts/lib/multi-source-orchestrator.ts`)
- Consensus building algorithm
- Source tier hierarchy

#### Application
- **Data Enrichment**: Multi-source consensus
- **Validation**: Multi-source comparison
- **Governance**: Multi-source trust scoring

---

### 17. Confidence-Based Auto-Fix

#### Definition
Auto-fixes are applied only when confidence exceeds thresholds. Lower confidence requires manual review.

#### Source
- Confidence thresholds (`scripts/lib/confidence-config.ts`)
- Auto-fix logic
- Manual review gates

#### Application
- **Auto-Fix**: ≥90% confidence
- **Flag for Review**: 75-89% confidence
- **Manual Review**: <75% confidence

---

### 18. Source Tier Hierarchy

#### Definition
Sources are ranked by reliability (tier 1 > tier 2 > tier 3). Higher tiers override lower tiers.

#### Source
- Governance rules (`lib/governance/rules.ts`)
- Source tier definitions
- Trust score calculations

#### Application
- **Tier 1**: Wikipedia, official sources (highest trust)
- **Tier 2**: Reputable blogs, news sites (medium trust)
- **Tier 3**: Fan sites, user-generated (lower trust)

---

## Primitives Rejected

### Autonomous Optimization
- **Reason**: Violates "No Recursive Self-Modification" and "Human Circuit Breaker"
- **Status**: Rejected

### Self-Learning Systems
- **Reason**: Violates "No Recursive Self-Modification" and "Deterministic Outputs"
- **Status**: Rejected

### Autonomous Publishing
- **Reason**: Violates "Human Circuit Breaker" and "Read-Only by Default"
- **Status**: Rejected

### Autonomous Cost Optimization
- **Reason**: Violates "Cost-Aware Escalation" (requires human oversight)
- **Status**: Rejected

---

## Primitives Adoption Justification

### Why Adopted

1. **Safety**: Primitives prioritize safety and human control
2. **Transparency**: Primitives ensure transparency and auditability
3. **Control**: Primitives ensure human control over all operations
4. **Cost Control**: Primitives prevent cost escalation
5. **Determinism**: Primitives ensure predictable behavior

### Why Rejected

1. **Autonomy**: Autonomous systems violate human control
2. **Complexity**: Complex systems violate tool poverty
3. **Uncertainty**: Non-deterministic systems violate determinism
4. **Cost Risk**: Uncontrolled systems violate cost awareness

---

## Primitives Enforcement

### Current Enforcement

- ✅ **Manual Execution**: Enforced (all scripts require manual trigger)
- ✅ **Read-Only ClawDBot**: Enforced (pure functions, no side effects)
- ✅ **Confidence Thresholds**: Enforced (confidence-based decisions)
- ✅ **Human Gates**: Enforced (approval required for critical operations)
- ⚠️ **Cost Monitoring**: Partial (no cost tracking, but rate limiting exists)
- ⚠️ **Emergency Stop**: Partial (manual process termination, no centralized stop)

### Gaps Requiring Attention

1. **Cost Monitoring**: No cost tracking or budgets
2. **Emergency Stop**: No centralized stop mechanism
3. **Token Budgets**: No token budget enforcement
4. **Loop Detection**: No automatic loop detection
5. **Approval Gates**: Inconsistent approval requirements

---

## Primitives Evolution

### Future Considerations

1. **Cost Monitoring**: Implement cost tracking and budgets
2. **Emergency Stop**: Implement centralized stop mechanism
3. **Token Budgets**: Implement token budget enforcement
4. **Loop Detection**: Implement automatic loop detection
5. **Approval Gates**: Standardize approval requirements

### Primitives Maintenance

- Primitives are immutable without explicit change
- Changes require human approval
- Changes must be documented
- Changes must be tested