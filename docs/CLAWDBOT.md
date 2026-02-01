# ClawDBot Intelligence System

## Overview

ClawDBot is a 24/7 read-only intelligence system for audit, trend analysis, and idea generation. It is designed to be **completely non-autonomous** and **side-effect free** - it never runs on its own and never modifies data.

## Core Principles

### Read-Only & Non-Autonomous

- **ClawDBot NEVER runs on its own** - it is always invoked by a separate runner or CLI
- **ClawDBot NEVER writes to database, files, or APIs** - it only reads JSON inputs and produces JSON outputs
- **ClawDBot NEVER fetches external data** - all data must be provided as input
- **ClawDBot NEVER auto-publishes** - it only generates drafts that require human approval

### Separation of Concerns

```
Runner = scheduler + I/O (files, DB, Telegram)
ClawDBot = reasoning + drafting (pure functions)
```

The runner handles all side effects (reading files, querying DB, sending messages). ClawDBot only performs pure transformations on data.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    DATA PIPELINES                        │
│  (Existing: enrichment, validation, governance)        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    JSON REPORTS                          │
│  (validation-report, governance-report, trends)        │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              CLAWDBOT (READ-ONLY BRAIN)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Analyzers   │  │  Generators │  │   Drafters   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              INSIGHTS & DRAFTS (JSON)                    │
│  (explanations, alerts, ideas, social drafts)          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│            RUNNER (Scheduler + I/O)                     │
│  (logs, files, Telegram, Admin UI)                     │
└─────────────────────────────────────────────────────────┘
```

## Components

### Part A: ClawDBot Library (`lib/clawdbot/`)

Pure, read-only analyzers and generators:

- **validation-analyzer.ts** - Analyzes validation reports, explains issues, recommends actions
- **governance-analyzer.ts** - Analyzes governance decisions, explains trust scores
- **confidence-analyzer.ts** - Analyzes confidence deltas, identifies significant changes
- **change-summary-generator.ts** - Generates human-readable change summaries
- **trend-analyzer.ts** - Detects emerging, peaking, declining trends
- **idea-generator.ts** - Generates editorial ideas from analyses
- **social-draft-generator.ts** - Generates Telegram/WhatsApp message drafts

All functions are **pure** - they accept JSON inputs and return JSON outputs with no side effects.

### Part B: ClawDBot CLI (`scripts/intel/clawdbot.ts`)

Manual entry point that routes inputs to analyzers:

```bash
# Analyze validation report
npm run clawdbot -- --validation-report=path/to/report.json

# Analyze governance report
npm run clawdbot -- --governance-report=path/to/report.json

# Analyze trends and generate ideas/drafts
npm run clawdbot -- --trend-input=path/to/trends.json --generate-ideas --generate-drafts
```

### Part C: 24/7 Runner (`scripts/runners/clawdbot-runner.ts`)

Scheduler and I/O handler:

- Collects latest reports from files or database
- Invokes ClawDBot CLI with collected reports
- Saves outputs to files
- Routes outputs to Telegram (if enabled)
- Logs all operations

The runner handles **all** side effects - ClawDBot itself never touches files, DB, or network.

### Part D: Telegram/WhatsApp Support (`scripts/runners/telegram-sender.ts`)

Social publishing handler:

- Sends messages via Telegram Bot API
- Respects `requires_approval` flag - never auto-sends drafts that need approval
- Only sends high-priority drafts that don't require approval

**Human approval is mandatory** for all critical alerts and most social drafts.

## Usage

### Manual CLI Usage

```bash
# Analyze a validation report
npm run clawdbot -- --validation-report=reports/validation-2026-01-25.json

# Analyze governance decisions
npm run clawdbot -- --governance-report=reports/governance-2026-01-25.json

# Analyze trends and generate ideas
npm run clawdbot -- --trend-input=reports/trends.json --generate-ideas --generate-drafts

# Save output to file
npm run clawdbot -- --validation-report=report.json --output=output.json
```

### Automated Runner

```bash
# Run once
npm run clawdbot:run

# Schedule with Windows Task Scheduler or PM2
# Set environment variables:
# - CLAWDBOT_INTERVAL_MINUTES=60
# - CLAWDBOT_OUTPUT_DIR=reports/clawdbot
# - TELEGRAM_ENABLED=true
# - TELEGRAM_BOT_TOKEN=your_token
# - TELEGRAM_CHAT_ID=your_chat_id
```

## Input Formats

### Validation Report Input

```json
{
  "report_id": "validation-2026-01-25",
  "generated_at": "2026-01-25T10:00:00Z",
  "total_issues": 5,
  "issues": [
    {
      "id": "issue-1",
      "severity": "high",
      "field": "director",
      "message": "Director mismatch across sources",
      "confidence": 0.75,
      "sources": ["TMDB", "Wikipedia", "IMDb"]
    }
  ]
}
```

### Governance Report Input

```json
{
  "report_id": "governance-2026-01-25",
  "generated_at": "2026-01-25T10:00:00Z",
  "decisions": [
    {
      "entity_id": "movie-123",
      "entity_type": "movie",
      "decision": "approved",
      "rule_violations": [],
      "trust_score": 0.92,
      "trust_level": "verified"
    }
  ]
}
```

### Trend Input

```json
{
  "period_start": "2026-01-20T00:00:00Z",
  "period_end": "2026-01-25T00:00:00Z",
  "data_points": [
    {
      "timestamp": "2026-01-20T00:00:00Z",
      "category": "movie",
      "entity_id": "movie-123",
      "entity_name": "Baahubali 2",
      "metric": "views",
      "value": 1000
    }
  ]
}
```

## Output Formats

### Validation Analysis

```json
{
  "type": "validation_analysis",
  "data": {
    "total_issues": 5,
    "critical_count": 1,
    "high_count": 2,
    "medium_count": 1,
    "low_count": 1,
    "explanations": [...],
    "overall_health": "degraded",
    "summary": "..."
  }
}
```

### Editorial Ideas

```json
{
  "type": "editorial_ideas",
  "data": {
    "generated_at": "2026-01-25T10:00:00Z",
    "ideas": [
      {
        "idea_id": "idea-1",
        "title": "Emerging Trend: Baahubali 2",
        "category": "news",
        "priority": "high",
        "rationale": "...",
        "suggested_headline": "..."
      }
    ],
    "high_priority_count": 2,
    "summary": "..."
  }
}
```

### Social Drafts

```json
{
  "type": "social_drafts",
  "data": {
    "generated_at": "2026-01-25T10:00:00Z",
    "drafts": [
      {
        "draft_id": "draft-1",
        "platform": "telegram",
        "type": "trend",
        "content": "🔥 Emerging Trend Alert!...",
        "metadata": {
          "priority": "high",
          "requires_approval": false,
          "tags": ["trend", "emerging"]
        }
      }
    ],
    "summary": "..."
  }
}
```

## SOS Alert Semantics

SOS alerts are generated when critical issues are detected:

- **Critical severity**: System health is critical, immediate action required
- **High severity**: Significant issues detected, review within hour
- **Medium severity**: Issues detected, review within day

All SOS alerts have `requires_approval: true` and are never auto-sent.

## Telegram/WhatsApp Workflow

1. **ClawDBot generates drafts** - Pure function, no side effects
2. **Runner collects drafts** - Reads from ClawDBot output
3. **Runner checks approval flag** - Only sends if `requires_approval: false`
4. **Runner sends via Telegram API** - I/O handled by runner
5. **Human reviews drafts requiring approval** - Manual process

**No auto-posting under any circumstance** - all critical alerts require human approval.

## Safety Guarantees

### Zero Coupling

- ClawDBot has **zero dependencies** on existing enrichment, validation, or governance systems
- ClawDBot can be **safely deleted** without affecting any other systems
- ClawDBot **never modifies** existing code or data

### Deterministic & Pure

- All ClawDBot functions are **pure** - same input always produces same output
- No randomness, no time-dependent behavior (except timestamps in outputs)
- No side effects, no mutations

### Non-Autonomous

- ClawDBot **never runs on its own** - always invoked by runner or CLI
- ClawDBot **never schedules** - scheduling is runner's responsibility
- ClawDBot **never publishes** - publishing is runner's responsibility

## Examples

See `lib/clawdbot/examples/` for sample input files:

- `validation-report.sample.json`
- `governance-report.sample.json`
- `confidence-delta.sample.json`
- `trend-input.sample.json`

## Environment Variables

```bash
# Runner configuration
CLAWDBOT_INTERVAL_MINUTES=60
CLAWDBOT_OUTPUT_DIR=reports/clawdbot
CLAWDBOT_LOG_FILE=logs/clawdbot-runner.log

# Telegram configuration
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# WhatsApp configuration (future)
WHATSAPP_ENABLED=false
```

## Integration with Existing Systems

ClawDBot is designed to **consume outputs** from existing systems:

1. **Validation pipelines** → Generate validation reports → ClawDBot analyzes
2. **Governance engine** → Generate governance reports → ClawDBot analyzes
3. **Trend tracking** → Generate trend data → ClawDBot analyzes
4. **Change tracking** → Generate change summaries → ClawDBot analyzes

ClawDBot **never influences inputs** - it only reads what other systems produce.

## Quality Bar

- ✅ TypeScript (strict mode)
- ✅ Functional, deterministic logic
- ✅ Clear explainability
- ✅ Zero coupling with core pipelines
- ✅ Safe to delete without side effects

## Troubleshooting

### "No reports to analyze"

The runner couldn't find any reports. Check:
- Reports directory exists: `reports/latest-validation-report.json`
- Reports are being generated by existing pipelines
- File paths are correct

### "Telegram credentials not configured"

Telegram sending is disabled. Set:
- `TELEGRAM_ENABLED=true`
- `TELEGRAM_BOT_TOKEN=your_token`
- `TELEGRAM_CHAT_ID=your_chat_id`

### "ClawDBot CLI Error"

Check:
- Input JSON files are valid
- File paths are correct
- Required fields are present in input

## Future Enhancements

- WhatsApp integration
- Admin panel integration
- Real-time webhook support
- Advanced trend detection algorithms
- Machine learning-based idea generation

---

**Remember**: ClawDBot is a **read-only brain**. It thinks, it drafts, but it never acts. All actions are handled by the runner.
