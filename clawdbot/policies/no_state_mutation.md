# No State Mutation Policy

**Generated**: January 25, 2026  
**Purpose**: Explicit policy prohibiting ClawDBot from modifying system state (NO CODE)

---

## Policy Statement

ClawDBot **never modifies system state**. It is strictly read-only. All state modifications are handled by external systems (runner, scripts, Cursor) after human approval.

---

## Core Principles

### 1. Read-Only Operations Only

#### Definition
ClawDBot only performs read-only operations. It never modifies state.

#### Application
- Read from files (via runner)
- Read from database (via runner)
- Read from APIs (via fetchers)
- No writes to files (except via runner for outputs)
- No writes to database
- No state modifications

#### Violations
- ClawDBot writing to database
- ClawDBot modifying files directly
- ClawDBot changing system state
- ClawDBot updating configuration

---

### 2. No Database Writes

#### Definition
ClawDBot never writes to the database. Database writes are handled externally.

#### Application
- No INSERT operations
- No UPDATE operations
- No DELETE operations
- No database modifications of any kind
- Database reads only (via runner)

#### Violations
- ClawDBot writing to database
- ClawDBot modifying database records
- ClawDBot updating database schema
- ClawDBot executing database write operations

---

### 3. No File Writes (Except Outputs via Runner)

#### Definition
ClawDBot never writes files directly. Outputs are written by the runner.

#### Application
- ClawDBot produces JSON outputs
- Runner writes outputs to files
- No direct file writes
- No file modifications
- No file creation (except via runner)

#### Violations
- ClawDBot writing files directly
- ClawDBot modifying files directly
- ClawDBot creating files directly
- ClawDBot bypassing runner for file I/O

---

### 4. No Configuration Changes

#### Definition
ClawDBot never modifies system configuration.

#### Application
- No configuration file modifications
- No environment variable changes
- No setting changes
- No parameter modifications

#### Violations
- ClawDBot modifying configuration
- ClawDBot changing settings
- ClawDBot updating parameters
- ClawDBot modifying environment

---

## Policy Enforcement

### Enforcement Mechanisms

1. **Read-Only Design**
   - ClawDBot has no write capabilities
   - ClawDBot cannot modify state
   - ClawDBot cannot change configuration

2. **Pure Functions**
   - ClawDBot functions are pure (no side effects)
   - ClawDBot functions are deterministic
   - ClawDBot functions are testable

3. **External I/O**
   - All I/O handled by runner
   - All writes handled externally
   - ClawDBot only produces outputs

---

## Policy Violations

### Violation Types

1. **Database Writes**
   - ClawDBot writing to database
   - ClawDBot modifying database records
   - ClawDBot updating database schema

2. **File Writes**
   - ClawDBot writing files directly
   - ClawDBot modifying files directly
   - ClawDBot creating files directly

3. **State Modifications**
   - ClawDBot changing system state
   - ClawDBot modifying configuration
   - ClawDBot updating settings

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## State Mutation Architecture

### Safe State Mutation Flow

```
[ ClawDBot ]
     ↓ (JSON outputs only, no state mutation)
[ Output Store ]
     ↓ (Human approval)
[ Cursor / Runner ]
     ↓
[ State Mutation ]
     ↓
[ Database / Files / Configuration ]
```

### ClawDBot's Role

- **Read Only**: ClawDBot reads data (via runner/fetchers)
- **Produce Outputs**: ClawDBot produces JSON outputs
- **No Mutation**: ClawDBot never mutates state

### External Systems' Role

- **Runner**: Handles all I/O, writes outputs
- **Cursor**: Executes approved state mutations
- **Human**: Approves state mutations

---

## Policy Exceptions

### No Exceptions

This policy has **no exceptions**. ClawDBot never modifies system state, regardless of circumstances.

---

## Relationship to Other Policies

### Related Policies

- **no_autonomy.md**: No state mutation is a subset of no autonomy
- **no_commits.md**: No state mutation prevents code commits
- **no_publish.md**: No state mutation prevents publishing

### Policy Hierarchy

- **no_autonomy.md** (parent policy)
  - **no_state_mutation.md** (specific constraint)

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