# Adopted Primitives

**Generated**: January 25, 2026  
**Purpose**: Primitives adopted from OSS philosophy with explicit justification

---

## Adopted Primitives

### 1. PLAN ≠ EXECUTE

#### Source
Antigravity discussions, Claude OSS philosophy, Cursor official philosophy

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Ensures human control over execution
- Prevents autonomous actions
- Maintains clear boundaries between planning and execution

#### Application
- Phase-0 mode: Planning only, no execution
- Execution mode: Execute exactly what is approved
- No execution without explicit approval

---

### 2. Confidence over Certainty

#### Source
Claude OSS philosophy, existing confidence scoring system

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- More realistic than binary certainty
- Allows for probabilistic decisions
- Enables confidence-based actions
- Aligns with existing confidence scoring system

#### Application
- Confidence scores (0.0-1.0) for all decisions
- Confidence-based approval levels
- Confidence-based action thresholds

---

### 3. Event-Driven Activation (External Only)

#### Source
Claude OSS philosophy, ClawDBot design patterns

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Prevents autonomous execution
- Ensures human control
- Maintains safety
- Aligns with ClawDBot design (always invoked)

#### Application
- Scripts: Manual execution only
- ClawDBot: Always invoked by runner or CLI
- Runners: Scheduled but require manual start

---

### 4. Tool Poverty

#### Source
Claude OSS philosophy, Unix philosophy

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Reduces complexity
- Improves maintainability
- Prevents over-engineering
- Aligns with minimal viable tooling

#### Application
- Minimal tool dependencies
- Focused tool purposes
- Simple tool interfaces

---

### 5. Human Circuit Breaker

#### Source
Antigravity discussions, safety-critical systems design

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Ensures human control
- Prevents runaway processes
- Maintains safety
- Aligns with approval gates

#### Application
- Manual execution only
- Approval gates for critical operations
- Human override mechanisms
- Emergency stop capabilities (future)

---

### 6. Cost-Aware Escalation

#### Source
Cost optimization requirements, rate limiting patterns

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Prevents cost escalation
- Ensures cost visibility
- Enables cost control
- Aligns with rate limiting and cooldown management

#### Application
- Rate limiting
- Cost thresholds
- Cost escalation paths
- Cost monitoring (future)

---

### 7. Air-Gapped Execution Context

#### Source
ClawDBot architecture, separation of concerns

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Ensures determinism
- Improves testability
- Prevents side effects
- Aligns with ClawDBot design (read-only brain, I/O in runner)

#### Application
- ClawDBot: Pure functions, no external dependencies
- Runner: Handles all I/O, scheduling, external calls
- Scripts: Clear separation of logic and I/O

---

### 8. No Recursive Self-Modification

#### Source
Safety-critical systems design, governance requirements

#### Adoption Status
✅ **ADOPTED** - Core principle

#### Justification
- Ensures system stability
- Prevents system corruption
- Maintains auditability
- Aligns with governance requirements

#### Application
- No self-modifying code
- No autonomous policy changes
- No self-updating configuration
- Human approval required for all modifications

---

## Primitive Justification Summary

### Safety Primitives

1. **Human Circuit Breaker**: Ensures human control
2. **No Recursive Self-Modification**: Ensures system stability
3. **Event-Driven Activation**: Prevents autonomous execution

### Control Primitives

1. **PLAN ≠ EXECUTE**: Ensures human control over execution
2. **Human Circuit Breaker**: Ensures human override capabilities
3. **Cost-Aware Escalation**: Ensures cost control

### Determinism Primitives

1. **Air-Gapped Execution Context**: Ensures deterministic core logic
2. **Confidence over Certainty**: Enables probabilistic but deterministic decisions
3. **No Recursive Self-Modification**: Prevents non-deterministic self-modification

### Simplicity Primitives

1. **Tool Poverty**: Prefers simplicity over complexity
2. **Air-Gapped Execution Context**: Separates concerns for simplicity
3. **Event-Driven Activation**: Simple activation model

---

## Primitive Application

### Current Application

1. ✅ **Manual Execution**: Enforced (all scripts require manual trigger)
2. ✅ **Read-Only ClawDBot**: Enforced (pure functions, no side effects)
3. ✅ **Confidence Thresholds**: Enforced (confidence-based decisions)
4. ✅ **Human Gates**: Enforced (approval required for critical operations)
5. ⚠️ **Cost Monitoring**: Partial (no cost tracking, but rate limiting exists)
6. ⚠️ **Emergency Stop**: Partial (manual process termination, no centralized stop)

### Future Application

1. **Cost Monitoring**: Implement cost tracking and budgets
2. **Emergency Stop**: Implement centralized stop mechanism
3. **Token Budgets**: Implement token budget enforcement
4. **Loop Detection**: Implement automatic loop detection
5. **Approval Gates**: Standardize approval requirements