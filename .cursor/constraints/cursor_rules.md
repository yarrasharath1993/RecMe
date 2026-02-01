# Cursor Rules

**Generated**: January 25, 2026  
**Purpose**: Explicit rules for Cursor behavior in Phase-0 and execution modes

---

## Phase-0 Mode Rules

### Absolutely Forbidden

1. ❌ **Code Generation**
   - No code writing
   - No file modifications
   - No implementation

2. ❌ **Commits**
   - No git commits
   - No version control operations
   - No branch operations

3. ❌ **Deployments**
   - No deployment operations
   - No infrastructure changes
   - No environment modifications

4. ❌ **Script Execution**
   - No script execution
   - No command execution
   - No process spawning

5. ❌ **Pipeline Modifications**
   - No pipeline changes
   - No CI/CD modifications
   - No workflow changes

6. ❌ **Database Writes**
   - No database modifications
   - No data changes
   - No schema modifications

7. ❌ **API Calls**
   - No external API calls
   - No network requests
   - No service calls

8. ❌ **LLM Calls**
   - No LLM API calls
   - No AI inference
   - No model invocations

9. ❌ **Agent Design Beyond Documentation**
   - No agent implementation
   - No agent code
   - No agent execution

10. ❌ **Optimizations**
    - No code optimizations
    - No performance improvements
    - No refactoring

11. ❌ **Creativity Beyond Documentation**
    - No creative implementations
    - No design beyond documentation
    - No interpretation beyond scope

12. ❌ **Execution of Any Kind**
    - No execution
    - No running code
    - No process execution

13. ❌ **Proceeding Past Phase-0 Deliverables**
    - No Phase-1 work
    - No implementation
    - No code generation

---

## Execution Mode Rules (Future)

### Source of Truth

1. **Human Decisions**
   - Human decisions are the source of truth
   - Human approvals are required for all actions
   - Human overrides are always possible

2. **ClawDBot Analysis**
   - ClawDBot analysis is read-only
   - ClawDBot outputs require human review
   - ClawDBot never makes decisions autonomously

---

### Task Execution

1. **Implement EXACTLY What is Approved**
   - No creativity beyond approved scope
   - No optimization without approval
   - No interpretation beyond approved scope
   - No additions beyond approved scope

2. **No Creativity**
   - No creative implementations
   - No design beyond approved scope
   - No interpretation beyond approved scope

3. **No Optimization**
   - No code optimizations
   - No performance improvements
   - No refactoring (unless explicitly approved)

4. **No Interpretation**
   - No interpretation beyond approved scope
   - No assumptions beyond approved scope
   - No additions beyond approved scope

---

### Constraints

1. **No Publishing**
   - No content publishing
   - No auto-publishing
   - No publishing without approval

2. **No Schema Changes Unless Explicit**
   - No database schema changes
   - No data model changes
   - No configuration changes (unless explicitly approved)

3. **No Model Switching**
   - No LLM model switching
   - No provider switching (unless explicitly approved)
   - No configuration changes (unless explicitly approved)

4. **No LLM Calls by Cursor**
   - Cursor never calls LLMs
   - Cursor never uses AI inference
   - Cursor never invokes models

---

## Rule Enforcement

### Enforcement Mechanisms

1. **Phase-0 Mode**: Strict read-only mode, no execution
2. **Execution Mode**: Strict adherence to approved scope
3. **Approval Gates**: All actions require approval
4. **Human Overrides**: Humans can always override

---

## Rule Violations

### Violation Types

1. **Code Generation in Phase-0**
   - Generating code in Phase-0 mode
   - Modifying files in Phase-0 mode
   - Executing in Phase-0 mode

2. **Scope Creep**
   - Implementing beyond approved scope
   - Adding features without approval
   - Optimizing without approval

3. **Autonomous Actions**
   - Publishing without approval
   - Committing without approval
   - Deploying without approval

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Rule Maintenance

### Rule Updates

- Rule updates require explicit approval
- Rule changes must be documented
- Rule changes must be tested
- Rule changes must be reviewed

### Rule Monitoring

- Monitor for rule violations
- Track rule compliance
- Generate rule compliance reports
- Review rule effectiveness