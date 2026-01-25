# Data Quality Monitoring System

Automated monitoring and alerting for Telugu movie database quality.

## Overview

This system monitors data completeness, detects anomalies, and generates reports to ensure database health.

## Components

### 1. Quality Monitoring Script
**File:** `scripts/monitor-data-quality.ts`

Runs daily checks and generates reports:
- Completeness metrics across 8 categories
- Critical issues detection
- Warning identification
- Automated recommendations

### 2. Historical Tracking
**File:** `monitoring/quality-history.jsonl`

Append-only log of all monitoring runs in JSON Lines format:
```json
{"timestamp":"2026-01-13T06:00:00Z","total_movies":7398,"completeness":{...}}
{"timestamp":"2026-01-14T06:00:00Z","total_movies":7410,"completeness":{...}}
```

### 3. Latest Report
**File:** `monitoring/quality-report-latest.md`

Human-readable markdown report with:
- Current completeness percentages
- Critical issues and warnings
- Action recommendations
- Trend analysis

## Setup

### Local Development

Run monitoring manually:
```bash
cd /path/to/telugu-portal
npx tsx scripts/monitor-data-quality.ts
```

View latest report:
```bash
cat monitoring/quality-report-latest.md
```

### Production (Cron)

Add to crontab for daily monitoring at 6 AM:
```bash
crontab -e

# Add this line:
0 6 * * * cd /path/to/telugu-portal && npx tsx scripts/monitor-data-quality.ts >> monitoring/cron.log 2>&1
```

### CI/CD Integration

Add to GitHub Actions workflow:
```yaml
name: Data Quality Check
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run quality monitoring
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: npx tsx scripts/monitor-data-quality.ts
      
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: quality-report
          path: monitoring/quality-report-latest.md
      
      - name: Notify on failure
        if: failure()
        uses: actions/slack-notify@v1
        with:
          channel: '#data-quality'
          text: '🚨 Critical data quality issues detected!'
```

## Alerting

### Console Alerts

Script exits with code 1 if critical issues detected:
- Triggers CI/CD failure
- Can be caught by monitoring tools

### Slack Integration (Optional)

Add webhook to script for real-time alerts:
```typescript
// In monitor-data-quality.ts
if (metrics.critical_issues.length > 0) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 ${metrics.critical_issues.length} critical issues detected!`,
      blocks: [/* formatted report */]
    })
  });
}
```

### Email Alerts (Optional)

Use a service like SendGrid:
```typescript
import sgMail from '@sendgrid/mail';

if (metrics.critical_issues.length > 0) {
  await sgMail.send({
    to: 'admin@teluguportal.com',
    from: 'alerts@teluguportal.com',
    subject: 'Critical Data Quality Issues Detected',
    text: await generateReport(metrics)
  });
}
```

## Metrics Explained

### Completeness Scores

- **Hero Section** (85%+): title, poster, year present
- **Synopsis** (70%+): English synopsis present
- **Cast & Crew** (50%+): Director and hero present
- **Genres** (95%+): At least one genre assigned
- **Ratings** (80%+): Any rating present
- **Tags** (30%+): Any tag assigned
- **Editorial** (10%+): Published review exists
- **Media** (50%+): Trailer URL present

### Issue Severities

- **Critical** 🔴: Immediate action required
  - Major completeness drops
  - Data integrity issues
  - System failures

- **Warning** ⚠️: Needs attention soon
  - Minor quality degradation
  - Approaching thresholds
  - Optimization opportunities

- **Info** ℹ️: Informational only
  - Suggestions for improvement
  - Best practices

## Historical Analysis

View trends over time:
```bash
# Count entries per day
grep -o '"timestamp":"[^"]*"' monitoring/quality-history.jsonl | cut -d: -f2-3 | cut -d'"' -f2 | cut -dT -f1 | sort | uniq -c

# Extract completeness trends
cat monitoring/quality-history.jsonl | jq '.completeness.hero_section'

# Plot with gnuplot
cat monitoring/quality-history.jsonl | jq -r '"\(.timestamp) \(.completeness.hero_section)"' > /tmp/hero.dat
gnuplot -e "set term dumb; plot '/tmp/hero.dat' using 2 with lines"
```

## Maintenance

### Weekly Tasks
- Review latest report
- Address critical issues
- Track completion rates

### Monthly Tasks
- Analyze historical trends
- Update alert thresholds
- Optimize monitoring queries

### Quarterly Tasks
- Audit monitoring effectiveness
- Update metrics definitions
- Improve detection algorithms

## Troubleshooting

### Script Fails to Run

Check environment variables:
```bash
# Verify .env.local has required keys
grep SUPABASE .env.local
```

### No History File

Create directory:
```bash
mkdir -p monitoring
touch monitoring/quality-history.jsonl
```

### High False Positives

Adjust thresholds in `monitor-data-quality.ts`:
```typescript
// Example: relax hero section threshold
if (metrics.completeness.hero_section < 70) { // was 80
  // ...
}
```

## Future Enhancements

1. **Real-time Monitoring**: WebSocket-based live dashboard
2. **Predictive Alerts**: ML-based anomaly prediction
3. **Automated Remediation**: Auto-fix simple issues
4. **Interactive Dashboard**: Web UI for historical analysis
5. **Multi-database Support**: Monitor multiple environments
6. **Custom Metrics**: User-defined quality rules

---

*Last Updated: January 13, 2026*  
*Version: 1.0*
