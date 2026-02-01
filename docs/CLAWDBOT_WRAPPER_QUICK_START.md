# ClawDBot Wrapper - Quick Start

**One command to analyze any actor with fresh database data!**

---

## The Command

```bash
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Actor Name" [OPTIONS]
```

---

## Examples

### Analyze Chiranjeevi (Fresh Data!)

```bash
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Chiranjeevi" --generate-ideas --generate-drafts
```

**What happens:**
1. ✅ Queries database → Finds 138 movies (fresh!)
2. ✅ Runs validation → Finds 45 issues
3. ✅ Converts to ClawDBot format
4. ✅ Analyzes with ClawDBot
5. ✅ Generates ideas & drafts
6. ✅ Prints results

**Result:** Always current data, not from old reports!

---

### Analyze Venkatesh

```bash
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Daggubati Venkatesh" --output=reports/venkatesh-fresh.json
```

---

### Quick Validation Only

```bash
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Mahesh Babu"
```

---

## Options

- `--actor="Name"` - **Required** - Actor name
- `--generate-ideas` - Generate editorial ideas
- `--generate-drafts` - Generate social drafts
- `--output=<path>` - Save to file
- `--verbose` - Show detailed progress
- `--help` - Show help

---

## Why Use the Wrapper?

### ❌ Old Way (Manual)
```bash
# Step 1: Generate report
npx tsx scripts/validate-actor-filmography.ts --actor="Chiranjeevi" --report-only

# Step 2: Convert manually
# ... manual work ...

# Step 3: Run ClawDBot
npx tsx scripts/intel/clawdbot.ts --validation-report=old-report.json
```
**Problem:** Report might be old, manual conversion needed

### ✅ New Way (Wrapper)
```bash
# One command - always fresh!
npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Chiranjeevi" --generate-ideas --generate-drafts
```
**Benefit:** Always fresh data, automatic conversion, one command

---

## Real Example Output

**Chiranjeevi Analysis (Fresh from DB):**
- Movies analyzed: **138** (current database count)
- Issues found: **45**
  - 40 critical (wrong attribution)
  - 5 medium (no verification)
- Health status: **Critical**
- Ideas generated: ✅
- Drafts generated: ✅

---

## See Full Guide

For detailed documentation: `docs/CLAWDBOT_WRAPPER_GUIDE.md`
