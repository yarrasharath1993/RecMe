# Skill Admission Checklist

**Generated**: January 25, 2026  
**Purpose**: Checklist for admitting new skills to the registry

---

## Pre-Admission Checklist

### Required Items

- [ ] **Skill ID**: Unique identifier provided
- [ ] **Skill Name**: Human-readable name provided
- [ ] **Skill Description**: Clear description provided
- [ ] **Skill Purpose**: Single, well-defined purpose
- [ ] **Skill Dependencies**: Dependencies documented (if any)
- [ ] **Skill Side Effects**: Side effects documented (if any)
- [ ] **Skill Tests**: Tests provided or test plan documented
- [ ] **Skill Rollback**: Rollback plan documented
- [ ] **Skill Documentation**: Comprehensive documentation provided

---

## Admission Criteria

### Criteria 1: No Side Effects (or Explicit Approval)

- [ ] **No Side Effects**: Skill has no side effects
- [ ] **OR Explicit Approval**: Side effects are explicitly approved
- [ ] **Side Effects Documented**: All side effects are documented
- [ ] **Side Effects Justified**: Side effects are justified

#### Evaluation
- ✅ **Pass**: No side effects OR side effects explicitly approved
- ❌ **Fail**: Side effects without approval

---

### Criteria 2: Has Tests (or Test Plan)

- [ ] **Tests Provided**: Tests are provided
- [ ] **OR Test Plan**: Test plan is documented
- [ ] **Tests Cover Functionality**: Tests cover core functionality
- [ ] **Tests Cover Edge Cases**: Tests cover edge cases
- [ ] **Tests Cover Rollback**: Tests cover rollback (if applicable)

#### Evaluation
- ✅ **Pass**: Tests provided OR test plan documented
- ❌ **Fail**: No tests and no test plan

---

### Criteria 3: Easy Rollback

- [ ] **Easy Disable**: Skill can be easily disabled
- [ ] **Easy Remove**: Skill can be easily removed
- [ ] **State Restoration**: Skill does not prevent state restoration
- [ ] **No Orphaned Data**: Skill does not create orphaned data
- [ ] **Rollback Tested**: Rollback has been tested

#### Evaluation
- ✅ **Pass**: Easy rollback AND rollback tested
- ❌ **Fail**: Difficult rollback OR rollback not tested

---

### Criteria 4: Clear Purpose

- [ ] **Single Purpose**: Skill has a single, well-defined purpose
- [ ] **Purpose Documented**: Purpose is clearly documented
- [ ] **Purpose Justified**: Purpose is justified
- [ ] **No Overlap**: Purpose does not overlap with existing skills

#### Evaluation
- ✅ **Pass**: Single purpose, documented, justified, no overlap
- ❌ **Fail**: Multiple purposes OR undocumented OR overlaps

---

### Criteria 5: Comprehensive Documentation

- [ ] **Usage Documentation**: Usage is documented
- [ ] **API Documentation**: API is documented (if applicable)
- [ ] **Examples Provided**: Examples are provided
- [ ] **Troubleshooting Guide**: Troubleshooting guide provided
- [ ] **Rollback Documentation**: Rollback is documented

#### Evaluation
- ✅ **Pass**: Comprehensive documentation provided
- ❌ **Fail**: Incomplete documentation

---

## Optional Criteria

### Criteria 6: No Dependencies (Preferred)

- [ ] **No Dependencies**: Skill has no dependencies
- [ ] **OR Dependencies Documented**: Dependencies are documented
- [ ] **OR Dependencies Justified**: Dependencies are justified

#### Evaluation
- ✅ **Preferred**: No dependencies
- ⚠️ **Acceptable**: Dependencies documented and justified
- ❌ **Not Preferred**: Unjustified dependencies

---

### Criteria 7: Versioned (Preferred)

- [ ] **Versioned**: Skill is versioned
- [ ] **Version Format**: Version format is documented
- [ ] **Version History**: Version history is maintained

#### Evaluation
- ✅ **Preferred**: Versioned with history
- ⚠️ **Acceptable**: Versioned without history
- ❌ **Not Preferred**: Not versioned

---

### Criteria 8: Author Attribution (Preferred)

- [ ] **Author Provided**: Author is provided
- [ ] **Author Contact**: Author contact is provided (if applicable)
- [ ] **Author Attribution**: Author attribution is maintained

#### Evaluation
- ✅ **Preferred**: Author provided with contact
- ⚠️ **Acceptable**: Author provided without contact
- ❌ **Not Preferred**: No author attribution

---

## Admission Process

### Step 1: Pre-Admission Review

1. Review skill against checklist
2. Verify all required items
3. Evaluate against criteria
4. Document evaluation results

### Step 2: Admission Decision

1. **Approve**: All required criteria met
2. **Conditional Approval**: Required criteria met with conditions
3. **Reject**: Required criteria not met

### Step 3: Post-Admission

1. **Register Skill**: Add skill to registry
2. **Set Status**: Set skill status (disabled by default if side effects)
3. **Document Admission**: Document admission decision
4. **Monitor Usage**: Monitor skill usage

---

## Admission Examples

### Example 1: Skill with No Side Effects

#### Skill Details
- **Side Effects**: None
- **Tests**: Provided
- **Rollback**: Easy
- **Purpose**: Clear
- **Documentation**: Comprehensive

#### Evaluation
- ✅ **Criteria 1**: Pass (no side effects)
- ✅ **Criteria 2**: Pass (tests provided)
- ✅ **Criteria 3**: Pass (easy rollback)
- ✅ **Criteria 4**: Pass (clear purpose)
- ✅ **Criteria 5**: Pass (comprehensive documentation)

#### Decision
✅ **APPROVE** - All required criteria met

---

### Example 2: Skill with Side Effects

#### Skill Details
- **Side Effects**: Creates files
- **Tests**: Provided
- **Rollback**: Easy (delete files)
- **Purpose**: Clear
- **Documentation**: Comprehensive

#### Evaluation
- ⚠️ **Criteria 1**: Conditional (side effects, but approved)
- ✅ **Criteria 2**: Pass (tests provided)
- ✅ **Criteria 3**: Pass (easy rollback)
- ✅ **Criteria 4**: Pass (clear purpose)
- ✅ **Criteria 5**: Pass (comprehensive documentation)

#### Decision
✅ **CONDITIONAL APPROVAL** - Approved with side effects, disabled by default

---

### Example 3: Skill Without Tests

#### Skill Details
- **Side Effects**: None
- **Tests**: Not provided, test plan documented
- **Rollback**: Easy
- **Purpose**: Clear
- **Documentation**: Comprehensive

#### Evaluation
- ✅ **Criteria 1**: Pass (no side effects)
- ⚠️ **Criteria 2**: Conditional (test plan documented)
- ✅ **Criteria 3**: Pass (easy rollback)
- ✅ **Criteria 4**: Pass (clear purpose)
- ✅ **Criteria 5**: Pass (comprehensive documentation)

#### Decision
✅ **CONDITIONAL APPROVAL** - Approved with test plan, tests required before enable

---

## Rejection Examples

### Example 1: Skill with Unapproved Side Effects

#### Skill Details
- **Side Effects**: Modifies database (not approved)
- **Tests**: Provided
- **Rollback**: Difficult
- **Purpose**: Clear
- **Documentation**: Comprehensive

#### Evaluation
- ❌ **Criteria 1**: Fail (side effects not approved)
- ✅ **Criteria 2**: Pass (tests provided)
- ❌ **Criteria 3**: Fail (difficult rollback)
- ✅ **Criteria 4**: Pass (clear purpose)
- ✅ **Criteria 5**: Pass (comprehensive documentation)

#### Decision
❌ **REJECT** - Side effects not approved, difficult rollback

---

### Example 2: Skill Without Tests or Test Plan

#### Skill Details
- **Side Effects**: None
- **Tests**: Not provided, no test plan
- **Rollback**: Easy
- **Purpose**: Clear
- **Documentation**: Comprehensive

#### Evaluation
- ✅ **Criteria 1**: Pass (no side effects)
- ❌ **Criteria 2**: Fail (no tests, no test plan)
- ✅ **Criteria 3**: Pass (easy rollback)
- ✅ **Criteria 4**: Pass (clear purpose)
- ✅ **Criteria 5**: Pass (comprehensive documentation)

#### Decision
❌ **REJECT** - No tests and no test plan

---

## Admission Maintenance

### Regular Reviews

1. **Quarterly Reviews**: Review all skills quarterly
2. **Annual Reviews**: Comprehensive annual reviews
3. **Ad-Hoc Reviews**: Reviews triggered by issues

### Review Criteria

1. **Usage**: Is skill being used?
2. **Errors**: Are there errors with skill?
3. **Performance**: Is skill performing well?
4. **Compliance**: Is skill compliant with policies?

### Review Actions

1. **Keep**: Skill meets criteria, keep enabled
2. **Update**: Skill needs updates, update and re-review
3. **Disable**: Skill has issues, disable temporarily
4. **Deprecate**: Skill no longer needed, deprecate
5. **Remove**: Skill is deprecated, remove from registry