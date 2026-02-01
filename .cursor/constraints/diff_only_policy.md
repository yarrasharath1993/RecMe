# Diff-Only Policy

**Generated**: January 25, 2026  
**Purpose**: Policy requiring Cursor to show diffs before making changes

---

## Policy Statement

Cursor must show **diffs of all changes** before making them, allowing humans to review and approve changes before execution.

---

## Core Principles

### 1. Diff Before Change

#### Definition
Cursor must show diffs of all changes before making them.

#### Application
- Show file diffs before modifications
- Show code diffs before changes
- Show configuration diffs before updates
- Show all diffs before execution

#### Examples
- File modification → Show diff first
- Code change → Show diff first
- Configuration update → Show diff first

---

### 2. Human Review Required

#### Definition
All diffs require human review before execution.

#### Application
- Human reviews all diffs
- Human approves or rejects changes
- Human can request modifications
- No changes without approval

#### Examples
- File diff → Human reviews and approves
- Code diff → Human reviews and approves
- Configuration diff → Human reviews and approves

---

### 3. No Silent Changes

#### Definition
Cursor never makes changes silently. All changes are shown in diffs.

#### Application
- No hidden changes
- No silent modifications
- No changes without diffs
- All changes are visible

#### Examples
- File modification → Diff shown
- Code change → Diff shown
- Configuration update → Diff shown

---

## Policy Enforcement

### Enforcement Mechanisms

1. **Diff Generation**
   - Generate diffs for all changes
   - Show diffs before execution
   - Require human approval

2. **Human Review**
   - Human reviews all diffs
   - Human approves or rejects
   - Human can request modifications

3. **No Silent Changes**
   - No changes without diffs
   - No hidden modifications
   - All changes are visible

---

## Policy Violations

### Violation Types

1. **Changes Without Diffs**
   - Making changes without showing diffs
   - Silent modifications
   - Hidden changes

2. **Changes Without Approval**
   - Making changes without approval
   - Auto-approving changes
   - Bypassing review process

3. **Incomplete Diffs**
   - Showing incomplete diffs
   - Hiding parts of changes
   - Misleading diffs

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Policy Exceptions

### No Exceptions

This policy has **no exceptions**. All changes require diffs and approval, regardless of circumstances.

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