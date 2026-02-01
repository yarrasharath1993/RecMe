# Scheduler Design

**Generated**: January 25, 2026  
**Purpose**: Design for external scheduler integration (NO CODE)

**Reference**: `scripts/runners/clawdbot-runner.ts` (existing runner implementation)

---

## Overview

Scheduler is **external to ClawDBot**. ClawDBot has no scheduling logic. All scheduling is handled by external systems (cron, system schedulers, runners).

---

## Scheduler Architecture

### External Scheduler Model

```
[ External Scheduler ]
     ↓ (triggers at fixed times)
[ Runner / CLI ]
     ↓ (invokes ClawDBot)
[ ClawDBot Planner Loop ]
     ↓ (produces outputs)
[ Output Store ]
```

### Component Responsibilities

#### External Scheduler
- **Role**: Trigger loops at fixed times
- **Types**: Cron, system schedulers, manual triggers
- **Capabilities**: Time-based triggering, no ClawDBot logic

#### Runner / CLI
- **Role**: Invoke ClawDBot with appropriate inputs
- **Capabilities**: Input collection, ClawDBot invocation, output handling

#### ClawDBot Planner Loop
- **Role**: Execute planner loop logic
- **Capabilities**: Analysis, signal generation, no scheduling

---

## Scheduler Types

### Cron-Based Scheduler

#### Definition
System cron jobs trigger ClawDBot loops at fixed times.

#### Implementation
- Cron jobs configured in system crontab
- Cron jobs invoke runner/CLI
- Runner/CLI invokes ClawDBot
- ClawDBot executes loop

#### Example
```bash
# Cron job
0 */3 * * * cd /path/to/project && npx tsx scripts/runners/clawdbot-runner.ts --loop=trend_scan
```

---

### System Scheduler

#### Definition
OS-level schedulers (systemd timers, Windows Task Scheduler) trigger ClawDBot loops.

#### Implementation
- System scheduler configured
- System scheduler invokes runner/CLI
- Runner/CLI invokes ClawDBot
- ClawDBot executes loop

---

### Runner-Based Scheduler

#### Definition
Runner script handles scheduling internally (but external to ClawDBot).

#### Implementation
- Runner script runs continuously
- Runner script checks schedule
- Runner script invokes ClawDBot at scheduled times
- ClawDBot executes loop

#### Reference
- Existing runner: `scripts/runners/clawdbot-runner.ts`
- Runner can be extended for scheduling

---

### Manual Trigger

#### Definition
Human manually triggers ClawDBot loops.

#### Implementation
- Human executes CLI command
- CLI invokes ClawDBot
- ClawDBot executes loop

#### Example
```bash
npx tsx scripts/intel/clawdbot.ts --trend-input=path/to/trends.json
```

---

## Scheduler Characteristics

### External Only

#### Definition
Scheduler is external to ClawDBot. ClawDBot has no scheduling logic.

#### Application
- No scheduling code in ClawDBot
- No scheduling logic in ClawDBot
- All scheduling is external

---

### Fixed Windows

#### Definition
Scheduler uses fixed time windows, not dynamic scheduling.

#### Application
- Fixed times/intervals
- No dynamic adjustment
- No self-rescheduling
- Predictable execution

---

### No Self-Triggering

#### Definition
Scheduler does not allow ClawDBot to trigger itself.

#### Application
- ClawDBot cannot trigger itself
- ClawDBot cannot modify schedules
- ClawDBot cannot create triggers
- All triggers are external

---

## Scheduler Integration

### Runner Integration

#### Existing Runner
- **File**: `scripts/runners/clawdbot-runner.ts`
- **Capabilities**: I/O handling, ClawDBot invocation, output routing
- **Scheduling**: Can be extended for scheduling

#### Integration Points
- Runner can check schedule
- Runner can invoke ClawDBot at scheduled times
- Runner can handle outputs
- Runner can log operations

---

### CLI Integration

#### Existing CLI
- **File**: `scripts/intel/clawdbot.ts`
- **Capabilities**: Manual invocation, input routing, output display
- **Scheduling**: Manual triggers only

#### Integration Points
- CLI can be invoked by scheduler
- CLI can accept inputs from scheduler
- CLI can produce outputs for scheduler
- CLI can log operations

---

## Scheduler Configuration

### Configuration Format

```json
{
  "scheduler_type": "cron",
  "loops": [
    {
      "loop_id": "trend_scan",
      "schedule": "0 */3 * * *",
      "enabled": true
    }
  ],
  "runner_config": {
    "output_directory": "reports/clawdbot",
    "log_file": "logs/clawdbot-runner.log"
  }
}
```

---

## Scheduler Monitoring

### Monitoring Requirements

1. **Execution Tracking**
   - Track when loops are executed
   - Track execution success/failure
   - Track execution duration

2. **Schedule Compliance**
   - Monitor for missed executions
   - Monitor for delayed executions
   - Monitor for schedule violations

3. **Performance Monitoring**
   - Monitor execution performance
   - Monitor resource usage
   - Monitor error rates

---

## Scheduler Safety

### Safety Guarantees

1. **No Self-Triggering**
   - ClawDBot cannot trigger itself
   - All triggers are external
   - No autonomous scheduling

2. **Fixed Windows**
   - Predictable execution times
   - No dynamic scheduling
   - No self-rescheduling

3. **External Control**
   - Human control over scheduling
   - Easy to modify schedules
   - Easy to disable schedules

---

## References

- **Schedule Configuration**: `clawdbot/scheduling/schedule_config.md`
- **No Self-Trigger Policy**: `clawdbot/policies/no_self_trigger.md`
- **Existing Runner**: `scripts/runners/clawdbot-runner.ts`
- **Existing CLI**: `scripts/intel/clawdbot.ts`