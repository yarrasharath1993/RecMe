# ClawDBot Testing Guide

**Quick Start Guide for Testing ClawDBot**

---

## What is ClawDBot?

ClawDBot is a **read-only intelligence system** that analyzes data and generates insights, ideas, and drafts. It never modifies data, never publishes content, and never acts autonomously.

---

## Quick Test Commands

### 1. Test Validation Report Analysis

```bash
npm run clawdbot -- --validation-report=lib/clawdbot/examples/validation-report.sample.json
```

**What this does:**
- Analyzes a validation report (data quality issues)
- Identifies patterns and insights
- Generates recommendations

---

### 2. Test Governance Report Analysis

```bash
npm run clawdbot -- --governance-report=lib/clawdbot/examples/governance-report.sample.json
```

**What this does:**
- Analyzes governance decisions
- Evaluates trust scores
- Identifies patterns in approvals/rejections

---

### 3. Test Trend Analysis with Ideas & Drafts

```bash
npm run clawdbot:trends -- lib/clawdbot/examples/trend-input.sample.json
```

**What this does:**
- Analyzes trend data
- Generates editorial ideas
- Generates social media drafts

---

### 4. Analyze Actor Filmography Correction Playbook

```bash
npx tsx scripts/intel/clawdbot-analyze-correction-playbook.ts
npx tsx scripts/intel/clawdbot-analyze-correction-playbook.ts --output=reports/clawdbot-playbook-analysis.json
```

**What this does:**
- Loads the Chiranjeevi correction summary (`reports/clawdbot-chiranjeevi-correction-summary.json`)
- Runs ClawDBot governance analyzer on it
- Loads structured lessons (`lib/clawdbot/learnings/actor-filmography-lessons.json`)
- Outputs governance analysis + **recommended actions for next actor** (reuse playbook for Venkatesh, Mahesh Babu, etc.)

**Reuse for another actor:** When running ClawDBot for a different actor, use `--playbook` (default) so the summary includes the playbook path. Follow `docs/clawdbot/ACTOR_FILMOGRAPHY_CORRECTION_PLAYBOOK.md` and the checklist for that actor.

---

### 5. Test Everything Together

```bash
npm run clawdbot -- --validation-report=lib/clawdbot/examples/validation-report.sample.json --governance-report=lib/clawdbot/examples/governance-report.sample.json --trend-input=lib/clawdbot/examples/trend-input.sample.json --generate-ideas --generate-drafts
```

**What this does:**
- Runs all analyses
- Generates ideas from all analyses
- Generates drafts from all analyses

---

## Understanding the Output

### Output Format

```json
{
  "outputs": [
    {
      "type": "validation_analysis",
      "data": {
        "insights": [...],
        "recommendations": [...],
        "confidence": 0.85
      }
    },
    {
      "type": "editorial_ideas",
      "data": {
        "ideas": [...]
      }
    },
    {
      "type": "social_drafts",
      "data": {
        "drafts": [...]
      }
    }
  ]
}
```

---

## Saving Output to File

```bash
npm run clawdbot -- --validation-report=lib/clawdbot/examples/validation-report.sample.json --output=output.json
```

This saves the output to `output.json` instead of printing to console.

---

## Testing Tips

1. **Start Simple**: Test one analysis type at a time
2. **Check Output**: Verify the JSON output makes sense
3. **Try Combinations**: Mix different input types
4. **Save Results**: Use `--output` to save results for review

---

## Common Issues

### Issue: "File not found"
**Solution**: Make sure you're in the project root directory

### Issue: "Invalid JSON"
**Solution**: Check that your input JSON files are valid

### Issue: "No output"
**Solution**: Make sure you're providing at least one input file

---

## Actor Filmography Correction (Reuse for Another Actor)

1. **Analyze the Chiranjeevi summary:**  
   `npx tsx scripts/intel/clawdbot-analyze-correction-playbook.ts`
2. **Run ClawDBot for another actor (with playbook reference):**  
   `npx tsx scripts/intel/clawdbot-wrapper.ts --actor="Daggubati Venkatesh"`  
   The summary will include playbook and lessons paths.
3. **Follow the playbook:**  
   `docs/clawdbot/ACTOR_FILMOGRAPHY_CORRECTION_PLAYBOOK.md`  
   Use the same steps: export filmography → manual review → role corrections → removals → duplicates → add missing → publish.

---

## Next Steps

1. ✅ Test basic analysis commands
2. ✅ Understand output format
3. ✅ Try generating ideas and drafts
4. ✅ Analyze correction playbook and reuse for another actor
5. 📖 Read `docs/CLAWDBOT.md` for full documentation
6. 🔧 Explore Phase-1 planner loops in `clawdbot/planner_loops/`

---

## Help

Run with `--help` to see all options:

```bash
npm run clawdbot -- --help
```
