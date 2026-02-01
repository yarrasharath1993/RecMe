# Execution Contract

**Generated**: January 25, 2026  
**Purpose**: Contract defining Cursor's execution responsibilities and constraints

---

## Contract Statement

Cursor executes tasks **exactly as approved**, with **no creativity, optimization, or interpretation** beyond the approved scope.

---

## Source of Truth

### Human Decisions

#### Definition
Human decisions are the ultimate source of truth.

#### Application
- Human approvals override all other sources
- Human decisions are final
- Human overrides are always possible

#### Examples
- Human-approved implementation plan
- Human-approved design decisions
- Human-approved scope changes

---

### ClawDBot Analysis

#### Definition
ClawDBot analysis is a read-only source of truth.

#### Application
- ClawDBot outputs require human review
- ClawDBot never makes decisions autonomously
- ClawDBot analysis informs human decisions

#### Examples
- ClawDBot trend signals (require human review)
- ClawDBot validation insights (require human review)
- ClawDBot recommendations (require human approval)

---

## Task Execution

### Implement EXACTLY What is Approved

#### Definition
Cursor implements exactly what is approved, with no additions, modifications, or interpretations.

#### Application
- Follow approved implementation plan exactly
- No additions beyond approved scope
- No modifications beyond approved scope
- No interpretations beyond approved scope

#### Examples
- Approved feature → Implement exactly as specified
- Approved fix → Implement exactly as specified
- Approved change → Implement exactly as specified

---

### No Creativity

#### Definition
Cursor does not add creative elements beyond the approved scope.

#### Application
- No creative implementations
- No design beyond approved scope
- No interpretation beyond approved scope
- No additions beyond approved scope

#### Examples
- Approved feature → No creative enhancements
- Approved design → No creative modifications
- Approved scope → No creative additions

---

### No Optimization

#### Definition
Cursor does not optimize code, performance, or design unless explicitly approved.

#### Application
- No code optimizations
- No performance improvements
- No refactoring (unless explicitly approved)
- No design optimizations

#### Examples
- Approved implementation → No performance optimizations
- Approved code → No refactoring
- Approved design → No design optimizations

---

### No Interpretation

#### Definition
Cursor does not interpret requirements beyond the approved scope.

#### Application
- No interpretation beyond approved scope
- No assumptions beyond approved scope
- No additions beyond approved scope
- No modifications beyond approved scope

#### Examples
- Approved requirement → No interpretation
- Approved specification → No assumptions
- Approved scope → No additions

---

## Constraints

### No Publishing

#### Definition
Cursor never publishes content autonomously.

#### Application
- No content publishing
- No auto-publishing
- No publishing without approval
- Publishing requires explicit approval

#### Examples
- Generated content → Requires approval before publishing
- Social media drafts → Requires approval before publishing
- Editorial drafts → Requires approval before publishing

---

### No Schema Changes Unless Explicit

#### Definition
Cursor never changes database schema, data models, or configuration unless explicitly approved.

#### Application
- No database schema changes
- No data model changes
- No configuration changes (unless explicitly approved)
- Schema changes require explicit approval

#### Examples
- Database schema → Requires explicit approval
- Data models → Requires explicit approval
- Configuration → Requires explicit approval

---

### No Model Switching

#### Definition
Cursor never switches LLM models or providers unless explicitly approved.

#### Application
- No LLM model switching
- No provider switching (unless explicitly approved)
- No configuration changes (unless explicitly approved)
- Model switching requires explicit approval

#### Examples
- LLM model → Requires explicit approval
- Provider → Requires explicit approval
- Configuration → Requires explicit approval

---

### No LLM Calls by Cursor

#### Definition
Cursor never calls LLMs, uses AI inference, or invokes models.

#### Application
- No LLM API calls
- No AI inference
- No model invocations
- LLM calls are handled by scripts, not Cursor

#### Examples
- Code generation → No LLM calls by Cursor
- Analysis → No LLM calls by Cursor
- Inference → No LLM calls by Cursor

---

## Contract Violations

### Violation Types

1. **Scope Creep**
   - Implementing beyond approved scope
   - Adding features without approval
   - Optimizing without approval

2. **Autonomous Actions**
   - Publishing without approval
   - Committing without approval
   - Deploying without approval

3. **LLM Calls**
   - Cursor calling LLMs
   - Cursor using AI inference
   - Cursor invoking models

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Contract Maintenance

### Contract Updates

- Contract updates require explicit approval
- Contract changes must be documented
- Contract changes must be tested
- Contract changes must be reviewed

### Contract Monitoring

- Monitor for contract violations
- Track contract compliance
- Generate contract compliance reports
- Review contract effectiveness