# No Self-Trigger Policy

**Generated**: January 25, 2026  
**Purpose**: Explicit policy prohibiting ClawDBot from triggering itself (NO CODE)

---

## Policy Statement

ClawDBot **never triggers itself**. It is always invoked by an external entity (scheduler, runner, CLI, human). ClawDBot has no self-activation capabilities.

---

## Core Principles

### 1. Always Invoked Externally

#### Definition
ClawDBot is always invoked by an external entity. It never self-activates.

#### Application
- ClawDBot CLI requires manual execution
- ClawDBot Runner requires manual start
- Scheduler triggers ClawDBot (external scheduler, not ClawDBot's own scheduler)
- No scheduled execution without explicit external setup
- No autonomous triggers

#### Violations
- ClawDBot scheduling itself
- ClawDBot triggering itself
- ClawDBot creating its own triggers
- ClawDBot rescheduling itself

---

### 2. No Self-Rescheduling

#### Definition
ClawDBot never reschedules itself. Scheduling is handled externally.

#### Application
- Fixed scheduling windows (defined externally)
- No loop may reschedule itself
- No recursive scheduling
- No self-modification of schedules

#### Violations
- ClawDBot modifying its own schedule
- ClawDBot creating new scheduled tasks
- ClawDBot rescheduling loops
- ClawDBot triggering other loops

---

### 3. External Scheduler Only

#### Definition
All scheduling is handled by external schedulers (cron, system schedulers, runners).

#### Application
- External cron jobs trigger ClawDBot
- External schedulers trigger ClawDBot
- Runner handles scheduling (external to ClawDBot)
- No internal scheduling logic

#### Violations
- ClawDBot implementing scheduling logic
- ClawDBot managing its own schedule
- ClawDBot creating scheduled tasks
- ClawDBot modifying scheduler configuration

---

## Policy Enforcement

### Enforcement Mechanisms

1. **Read-Only Design**
   - ClawDBot has no scheduling capabilities
   - ClawDBot cannot modify schedules
   - ClawDBot cannot create triggers

2. **External Invocation**
   - All invocations are external
   - All triggers are external
   - All scheduling is external

3. **No Scheduling Logic**
   - ClawDBot has no scheduling code
   - ClawDBot has no trigger code
   - ClawDBot has no self-activation code

---

## Policy Violations

### Violation Types

1. **Self-Triggering**
   - ClawDBot triggers itself
   - ClawDBot creates self-triggers
   - ClawDBot activates itself

2. **Self-Rescheduling**
   - ClawDBot reschedules itself
   - ClawDBot modifies its own schedule
   - ClawDBot creates new scheduled tasks

3. **Internal Scheduling**
   - ClawDBot implements scheduling logic
   - ClawDBot manages its own schedule
   - ClawDBot creates scheduled tasks

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Policy Exceptions

### No Exceptions

This policy has **no exceptions**. ClawDBot never triggers itself, regardless of circumstances.

---

## Relationship to Other Policies

### Related Policies

- **no_autonomy.md**: No self-triggering is a subset of no autonomy
- **no_state_mutation.md**: No self-triggering prevents state mutation
- **no_recursive_planning.md**: No self-triggering prevents recursive planning

### Policy Hierarchy

- **no_autonomy.md** (parent policy)
  - **no_self_trigger.md** (specific constraint)
  - **no_state_mutation.md** (specific constraint)
  - **no_recursive_planning.md** (specific constraint)

---

## Policy Maintenance

### Policy Updates

- Policy updates require explicit approval
- Policy changes must be documented
- Policy changes must be tested
- Policy changes must be reviewed

### Policy Monitoring

- Monitor for policy violations
- Track policy compliance
- Generate policy compliance reports
- Review policy effectiveness