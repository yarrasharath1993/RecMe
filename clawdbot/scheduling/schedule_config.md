# Schedule Configuration

**Generated**: January 25, 2026  
**Purpose**: Fixed scheduling windows for all planner loops (NO CODE)

**Reference**: `scripts/runners/clawdbot-runner.ts` (existing runner implementation)

---

## Schedule Statement

All planner loops operate on **fixed scheduling windows**. No loop may reschedule itself. Scheduling is handled externally (cron, system schedulers, runners).

---

## Fixed Windows Model

### Key Principle

**Fixed windows, not continuous loops**

- Loops run at fixed times/intervals
- No self-rescheduling
- No dynamic scheduling
- External scheduler only

---

## Loop Schedules

### Trend Scan Loop

#### Schedule
- **Frequency**: Every 2-4 hours
- **Recommended**: Every 3 hours
- **Windows**: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 UTC

#### Configuration
```json
{
  "loop": "trend_scan",
  "frequency": "3 hours",
  "windows": ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
  "timezone": "UTC",
  "enabled": true
}
```

---

### Opportunity Detection Loop

#### Schedule
- **Frequency**: Daily
- **Recommended**: Once per day at 08:00 UTC
- **Windows**: 08:00 UTC

#### Configuration
```json
{
  "loop": "opportunity_detection",
  "frequency": "daily",
  "windows": ["08:00"],
  "timezone": "UTC",
  "enabled": true
}
```

---

### Content Idea Planning Loop

#### Schedule
- **Frequency**: Daily
- **Recommended**: Once per day at 10:00 UTC
- **Windows**: 10:00 UTC

#### Configuration
```json
{
  "loop": "content_idea_planning",
  "frequency": "daily",
  "windows": ["10:00"],
  "timezone": "UTC",
  "enabled": true
}
```

---

### Contradiction Detection Loop

#### Schedule
- **Frequency**: Event-driven (on new inputs)
- **Trigger**: When new validation/governance/trend data arrives
- **Windows**: Triggered by external events

#### Configuration
```json
{
  "loop": "contradiction_detection",
  "frequency": "event-driven",
  "trigger": "on_new_inputs",
  "enabled": true
}
```

---

### Daily Digest Loop

#### Schedule
- **Frequency**: Once per day
- **Recommended**: Once per day at 23:00 UTC (end of day)
- **Windows**: 23:00 UTC

#### Configuration
```json
{
  "loop": "daily_digest",
  "frequency": "daily",
  "windows": ["23:00"],
  "timezone": "UTC",
  "enabled": true
}
```

---

## Schedule Enforcement

### No Self-Rescheduling

#### Definition
No loop may reschedule itself or modify its own schedule.

#### Application
- Loops cannot change their schedules
- Loops cannot create new scheduled tasks
- Loops cannot modify scheduling configuration
- All scheduling is external

#### Violations
- Loop modifying its own schedule
- Loop creating scheduled tasks
- Loop rescheduling itself
- Loop modifying scheduler configuration

---

### External Scheduler Only

#### Definition
All scheduling is handled by external schedulers.

#### Application
- Cron jobs trigger loops
- System schedulers trigger loops
- Runners trigger loops
- No internal scheduling logic

#### Scheduler Types
- **Cron**: System cron jobs
- **System Schedulers**: OS-level schedulers
- **Runners**: External runner scripts
- **Manual**: Manual triggers

---

## Schedule Configuration Format

### Configuration Schema

```json
{
  "loops": [
    {
      "loop_id": "trend_scan",
      "frequency": "3 hours",
      "windows": ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
      "timezone": "UTC",
      "enabled": true
    },
    {
      "loop_id": "opportunity_detection",
      "frequency": "daily",
      "windows": ["08:00"],
      "timezone": "UTC",
      "enabled": true
    }
  ],
  "scheduler_type": "cron",
  "scheduler_config": {}
}
```

---

## Cron Configuration Example

### Cron Format

```
# Trend Scan - Every 3 hours
0 */3 * * * cd /path/to/project && npx tsx scripts/runners/clawdbot-runner.ts --loop=trend_scan

# Opportunity Detection - Daily at 08:00 UTC
0 8 * * * cd /path/to/project && npx tsx scripts/runners/clawdbot-runner.ts --loop=opportunity_detection

# Content Idea Planning - Daily at 10:00 UTC
0 10 * * * cd /path/to/project && npx tsx scripts/runners/clawdbot-runner.ts --loop=content_idea_planning

# Daily Digest - Daily at 23:00 UTC
0 23 * * * cd /path/to/project && npx tsx scripts/runners/clawdbot-runner.ts --loop=daily_digest
```

---

## Schedule Monitoring

### Monitoring Requirements

1. **Schedule Execution Tracking**
   - Track when loops are executed
   - Track execution success/failure
   - Track execution duration

2. **Schedule Compliance**
   - Monitor for missed executions
   - Monitor for delayed executions
   - Monitor for schedule violations

3. **Schedule Reporting**
   - Daily schedule execution reports
   - Weekly schedule summaries
   - Monthly schedule analysis

---

## Schedule Maintenance

### Schedule Updates

#### Process
1. Update schedule configuration
2. Update cron/system scheduler
3. Test schedule changes
4. Monitor schedule execution

#### Requirements
- Schedule updates require explicit approval
- Schedule changes must be documented
- Schedule changes must be tested
- Schedule changes must be reviewed

---

## Policy Enforcement

### Enforcement Mechanisms

1. **External Scheduler**
   - All scheduling is external
   - No internal scheduling logic
   - No self-rescheduling

2. **Configuration Validation**
   - Schedule configuration validated
   - Invalid schedules rejected
   - Schedule violations logged

3. **Monitoring**
   - Monitor schedule execution
   - Monitor schedule compliance
   - Alert on schedule violations

---

## References

- **Scheduler Design**: `clawdbot/scheduling/scheduler_design.md`
- **No Self-Trigger Policy**: `clawdbot/policies/no_self_trigger.md`
- **Existing Runner**: `scripts/runners/clawdbot-runner.ts`