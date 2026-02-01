# Runner Integration

**Generated**: January 25, 2026  
**Purpose**: How planner loops integrate with existing runner (NO CODE)

**Reference**: `scripts/runners/clawdbot-runner.ts` (existing implementation)

---

## Overview

Planner loops integrate with the existing ClawDBot runner. The runner handles I/O, scheduling, and output routing. ClawDBot planner loops produce JSON outputs only.

---

## Integration Architecture

### Current Runner Architecture

```
[ External Scheduler ]
     ↓ (triggers at fixed times)
[ ClawDBot Runner ]
     ↓ (collects inputs, invokes ClawDBot)
[ ClawDBot CLI ]
     ↓ (routes to planner loops)
[ Planner Loops ]
     ↓ (produce JSON outputs)
[ Runner ]
     ↓ (saves outputs, routes to destinations)
[ Output Store / Telegram / Logs ]
```

---

## Runner Responsibilities

### Input Collection

#### Current Implementation
- Reads validation reports from files
- Reads governance reports from files
- Reads trend data from files
- Queries Supabase for reports (future)

#### Planner Loop Integration
- Runner collects inputs for planner loops
- Runner provides inputs to planner loops via CLI
- Runner handles all I/O operations

---

### ClawDBot Invocation

#### Current Implementation
- Invokes ClawDBot CLI with collected reports
- Passes reports as CLI arguments
- Captures ClawDBot outputs

#### Planner Loop Integration
- Runner invokes ClawDBot CLI for each planner loop
- Runner passes loop-specific inputs
- Runner captures loop outputs

---

### Output Handling

#### Current Implementation
- Saves outputs to files
- Routes outputs to Telegram (if enabled)
- Logs operations

#### Planner Loop Integration
- Runner saves planner loop outputs to files
- Runner routes outputs for human review
- Runner logs all operations

---

## Planner Loop Integration Points

### Trend Scan Loop Integration

#### Runner Changes
- Runner collects trend feeds (via fetchers)
- Runner invokes ClawDBot with trend feeds
- Runner captures trend scan outputs

#### Integration Flow
1. External scheduler triggers runner
2. Runner collects trend feeds (via fetchers)
3. Runner invokes: `npx tsx scripts/intel/clawdbot.ts --loop=trend_scan --trend-feeds=...`
4. Runner captures outputs
5. Runner saves outputs to files

---

### Opportunity Detection Loop Integration

#### Runner Changes
- Runner collects trend data, validation reports, governance findings
- Runner invokes ClawDBot with collected data
- Runner captures opportunity detection outputs

#### Integration Flow
1. External scheduler triggers runner (daily)
2. Runner collects inputs (trends, validation, governance)
3. Runner invokes: `npx tsx scripts/intel/clawdbot.ts --loop=opportunity_detection --inputs=...`
4. Runner captures outputs
5. Runner saves outputs to files

---

### Content Idea Planning Loop Integration

#### Runner Changes
- Runner collects trends, opportunities, validation insights
- Runner invokes ClawDBot with collected data
- Runner captures content idea planning outputs

#### Integration Flow
1. External scheduler triggers runner (daily)
2. Runner collects inputs (trends, opportunities, insights)
3. Runner invokes: `npx tsx scripts/intel/clawdbot.ts --loop=content_idea_planning --inputs=...`
4. Runner captures outputs
5. Runner saves outputs to files

---

### Contradiction Detection Loop Integration

#### Runner Changes
- Runner collects validation reports, governance reports, trend data
- Runner invokes ClawDBot when new inputs arrive
- Runner captures contradiction detection outputs

#### Integration Flow
1. Event triggers runner (new inputs detected)
2. Runner collects inputs (validation, governance, trends)
3. Runner invokes: `npx tsx scripts/intel/clawdbot.ts --loop=contradiction_detection --inputs=...`
4. Runner captures outputs
5. Runner saves outputs to files

---

### Daily Digest Loop Integration

#### Runner Changes
- Runner collects all loop outputs from the day
- Runner invokes ClawDBot with aggregated outputs
- Runner captures daily digest outputs

#### Integration Flow
1. External scheduler triggers runner (daily, end of day)
2. Runner collects all loop outputs from the day
3. Runner invokes: `npx tsx scripts/intel/clawdbot.ts --loop=daily_digest --loop-outputs=...`
4. Runner captures outputs
5. Runner saves outputs to files

---

## Runner Configuration Updates

### Configuration Schema

```json
{
  "runner_config": {
    "schedule_interval_minutes": 60,
    "output_directory": "reports/clawdbot",
    "log_file": "logs/clawdbot-runner.log",
    "loops": [
      {
        "loop_id": "trend_scan",
        "enabled": true,
        "schedule": "0 */3 * * *"
      },
      {
        "loop_id": "opportunity_detection",
        "enabled": true,
        "schedule": "0 8 * * *"
      }
    ]
  }
}
```

---

## Runner Extension Points

### Fetcher Integration

#### Current State
- Runner reads from files
- Runner queries Supabase (future)

#### Planner Loop Extension
- Runner uses fetchers to collect external feeds
- Runner provides fetcher outputs to ClawDBot
- Runner handles fetcher errors

---

### Scheduler Integration

#### Current State
- Runner runs on schedule (configurable interval)
- Runner requires manual start

#### Planner Loop Extension
- Runner supports multiple loop schedules
- Runner triggers loops at fixed times
- Runner handles schedule management

---

### Output Routing

#### Current State
- Runner saves outputs to files
- Runner routes to Telegram (if enabled)

#### Planner Loop Extension
- Runner routes outputs for human review
- Runner routes outputs to draft store
- Runner routes outputs to admin UI (future)

---

## Integration Safety

### Safety Guarantees

1. **Runner Handles All I/O**
   - ClawDBot never accesses files directly
   - ClawDBot never accesses database directly
   - ClawDBot never makes API calls directly

2. **Runner Handles All Scheduling**
   - ClawDBot never schedules itself
   - ClawDBot never triggers itself
   - All scheduling is external

3. **Runner Handles All Output Routing**
   - ClawDBot never sends messages directly
   - ClawDBot never publishes directly
   - All output routing is external

---

## References

- **Existing Runner**: `scripts/runners/clawdbot-runner.ts`
- **Schedule Configuration**: `clawdbot/scheduling/schedule_config.md`
- **Fetcher Architecture**: `clawdbot/fetchers/interface.md`
- **Output Contract**: `clawdbot/planner_loops/output_contract.md`