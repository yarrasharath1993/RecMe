# Token Budget

**Generated**: January 25, 2026  
**Purpose**: Token budget management and enforcement policies

---

## Budget Levels

### Per-Run Budgets

#### Level 1: Normal Operation
- **Budget**: < 10,000 tokens per run
- **Action**: Continue processing
- **Alert**: None

#### Level 2: Moderate Tokens
- **Budget**: 10,000 - 50,000 tokens per run
- **Action**: Continue with warning
- **Alert**: Log warning

#### Level 3: High Tokens
- **Budget**: 50,000 - 100,000 tokens per run
- **Action**: Flag for review
- **Alert**: Alert admin

#### Level 4: Critical Tokens
- **Budget**: > 100,000 tokens per run
- **Action**: Stop processing, require approval
- **Alert**: Immediate alert to admin

---

### Daily Budgets

#### Level 1: Normal Operation
- **Budget**: < 50,000 tokens per day
- **Action**: Continue processing
- **Alert**: None

#### Level 2: Moderate Tokens
- **Budget**: 50,000 - 200,000 tokens per day
- **Action**: Continue with warning
- **Alert**: Log warning

#### Level 3: High Tokens
- **Budget**: 200,000 - 500,000 tokens per day
- **Action**: Flag for review
- **Alert**: Alert admin

#### Level 4: Critical Tokens
- **Budget**: > 500,000 tokens per day
- **Action**: Stop all processing, require approval
- **Alert**: Immediate alert to admin

---

### Monthly Budgets

#### Level 1: Normal Operation
- **Budget**: < 1,500,000 tokens per month
- **Action**: Continue processing
- **Alert**: None

#### Level 2: Moderate Tokens
- **Budget**: 1,500,000 - 6,000,000 tokens per month
- **Action**: Continue with warning
- **Alert**: Log warning

#### Level 3: High Tokens
- **Budget**: 6,000,000 - 15,000,000 tokens per month
- **Action**: Flag for review
- **Alert**: Alert admin

#### Level 4: Critical Tokens
- **Budget**: > 15,000,000 tokens per month
- **Action**: Stop all processing, require approval
- **Alert**: Immediate alert to admin

---

## Per-Model Budgets

### Groq Models

#### llama-3.3-70b-versatile
- **Per-Run Budget**: 50,000 tokens
- **Daily Budget**: 200,000 tokens
- **Monthly Budget**: 6,000,000 tokens

#### llama-3.1-8b-instant
- **Per-Run Budget**: 20,000 tokens
- **Daily Budget**: 100,000 tokens
- **Monthly Budget**: 3,000,000 tokens

#### Other Groq Models
- **Per-Run Budget**: 30,000 tokens
- **Daily Budget**: 150,000 tokens
- **Monthly Budget**: 4,500,000 tokens

---

### OpenAI Models

#### gpt-4o-mini
- **Per-Run Budget**: 30,000 tokens
- **Daily Budget**: 150,000 tokens
- **Monthly Budget**: 4,500,000 tokens

#### gpt-4o
- **Per-Run Budget**: 20,000 tokens
- **Daily Budget**: 100,000 tokens
- **Monthly Budget**: 3,000,000 tokens

#### gpt-3.5-turbo
- **Per-Run Budget**: 40,000 tokens
- **Daily Budget**: 200,000 tokens
- **Monthly Budget**: 6,000,000 tokens

---

## Budget Enforcement

### Enforcement Mechanisms

1. **Token Tracking**
   - Track tokens per operation
   - Track tokens per model
   - Track tokens per day/month

2. **Budget Checks**
   - Check budget before operation
   - Check budget during operation
   - Check budget after operation

3. **Budget Alerts**
   - Alert on budget threshold (80%)
   - Alert on budget exceeded
   - Alert on critical budget

4. **Budget Stops**
   - Stop on budget exceeded
   - Stop on critical budget
   - Require approval for continuation

---

## Budget Escalation

### Escalation Path

1. **Normal Operation** → Continue
2. **Moderate Tokens** → Log warning, continue
3. **High Tokens** → Alert admin, flag for review
4. **Critical Tokens** → Stop processing, require approval

---

## Budget Reporting

### Daily Reports
- Token usage per model
- Token usage per operation
- Budget status (remaining, used, percentage)
- Budget alerts

### Weekly Reports
- Weekly token usage summary
- Budget trends
- Budget forecasts
- Budget recommendations

### Monthly Reports
- Monthly token usage summary
- Budget trends
- Budget forecasts
- Budget recommendations
- Cost analysis

---

## Budget Recommendations

### Immediate Actions

1. **Implement Token Tracking**
   - Track tokens per operation
   - Track tokens per model
   - Track tokens per day/month

2. **Implement Budget Checks**
   - Check budget before operations
   - Check budget during operations
   - Check budget after operations

3. **Implement Budget Alerts**
   - Alert on budget threshold (80%)
   - Alert on budget exceeded
   - Alert on critical budget

### Short-Term Actions

1. **Implement Budget Stops**
   - Stop on budget exceeded
   - Stop on critical budget
   - Require approval for continuation

2. **Implement Budget Reports**
   - Daily token usage reports
   - Weekly budget summaries
   - Monthly budget analysis

3. **Implement Budget Optimization**
   - Optimize token usage
   - Optimize model selection
   - Optimize operation efficiency

---

## Current Status

### Existing Protections

1. ✅ **Rate Limiting**: Prevents excessive API calls
2. ✅ **Model Fallback**: Prefers cheaper models
3. ✅ **Cooldown Management**: Prevents rapid successive calls

### Gaps Requiring Attention

1. ⚠️ **No Token Tracking**: No token usage tracking
2. ⚠️ **No Budget Enforcement**: No budget checks or stops
3. ⚠️ **No Budget Alerts**: No budget threshold alerts
4. ⚠️ **No Budget Reports**: No budget usage reports