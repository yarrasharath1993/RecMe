# Rate Limits

**Generated**: January 25, 2026  
**Purpose**: Rate limit management and enforcement policies

---

## Provider Rate Limits

### Groq API

#### Default Rate Limits
- **Requests per Minute**: 30
- **Requests per Hour**: 1,800
- **Requests per Day**: 43,200

#### Model-Specific Limits
- **llama-3.3-70b-versatile**: 30 req/min
- **llama-3.1-8b-instant**: 30 req/min
- **mixtral-8x7b-32768**: 30 req/min
- **llama3-70b-8192**: 30 req/min
- **gemma2-9b-it**: 30 req/min

#### Cooldown Period
- **Default**: 60,000ms (1 minute)
- **On Rate Limit Hit**: 60,000ms (1 minute)
- **On Provider Failure**: 60,000ms (1 minute)

---

### OpenAI API

#### Default Rate Limits
- **Requests per Minute**: 60
- **Requests per Hour**: 3,600
- **Requests per Day**: 86,400

#### Model-Specific Limits
- **gpt-4o-mini**: 60 req/min
- **gpt-4o**: 60 req/min
- **gpt-3.5-turbo**: 60 req/min

#### Cooldown Period
- **Default**: 60,000ms (1 minute)
- **On Rate Limit Hit**: 60,000ms (1 minute)
- **On Provider Failure**: 60,000ms (1 minute)

---

## Planning and Adversarial Agents

Planner (`lib/ai/planner.ts`) and Antigravity (`lib/ai/tester.ts`) use the same Groq/OpenAI chain via smart-key-manager:
- **Planner**: Prefer quality (llama-3.3-70b-versatile, mixtral); 1 request per run.
- **Antigravity**: Prefer fast (llama-3.1-8b-instant); 1 request per run.

Same provider rate limits and cooldowns apply. No separate limits.

---

## Rate Limit Enforcement

### Enforcement Mechanisms

1. **Request Throttling**
   - Throttle requests to stay within limits
   - Implement exponential backoff
   - Respect cooldown periods

2. **Rate Limit Detection**
   - Detect rate limit responses (429 status)
   - Detect rate limit headers
   - Detect rate limit errors

3. **Rate Limit Handling**
   - Wait for cooldown period
   - Try next model/provider
   - Fall back to alternative providers

4. **Rate Limit Alerts**
   - Alert on rate limit approach (80%)
   - Alert on rate limit hit
   - Alert on persistent rate limits

---

## Rate Limit Escalation

### Escalation Path

1. **Normal Operation** → Continue
2. **Approaching Limit (80%)** → Slow down, log warning
3. **At Limit** → Wait for cooldown, try fallback
4. **All Providers Limited** → Stop processing, require approval

---

## Rate Limit Monitoring

### Monitoring Metrics

1. **Request Rate**: Requests per minute/hour/day
2. **Rate Limit Hits**: Number of rate limit hits
3. **Cooldown Periods**: Time spent in cooldown
4. **Fallback Usage**: Usage of fallback models/providers

### Reporting

1. **Daily Rate Limit Report**: Daily summary of rate limit usage
2. **Weekly Rate Limit Summary**: Weekly summary of rate limit usage
3. **Monthly Rate Limit Analysis**: Monthly analysis of rate limit usage
4. **Rate Limit Trends**: Trends in rate limit usage

---

## Current Implementation

### Existing Protections

1. ✅ **Rate Limiting**: Implemented in `lib/ai/smart-key-manager.ts`
2. ✅ **Cooldown Management**: Implemented in `lib/ai/smart-key-manager.ts`
3. ✅ **Model Fallback**: Implemented in `lib/ai/smart-key-manager.ts`
4. ✅ **Provider Fallback**: Implemented in `lib/ai/smart-key-manager.ts`

### Implementation Details

#### Rate Limiting
- Rate limits enforced per provider
- Rate limits enforced per model
- Cooldown periods respected

#### Fallback Chains
- Groq models: Fallback chain within Groq
- Providers: Groq → OpenAI fallback
- Automatic fallback on rate limit

---

## Recommendations

### Immediate Actions

1. **Monitor Rate Limit Usage**
   - Track request rates
   - Track rate limit hits
   - Track cooldown periods

2. **Implement Rate Limit Alerts**
   - Alert on rate limit approach (80%)
   - Alert on rate limit hit
   - Alert on persistent rate limits

### Short-Term Actions

1. **Optimize Rate Limit Usage**
   - Optimize request patterns
   - Optimize batch sizes
   - Optimize model selection

2. **Implement Rate Limit Reports**
   - Daily rate limit reports
   - Weekly rate limit summaries
   - Monthly rate limit analysis

### Long-Term Actions

1. **Implement Dynamic Rate Limiting**
   - Adjust rate limits based on usage
   - Adjust cooldown periods based on usage
   - Optimize rate limit efficiency

2. **Implement Rate Limit Prediction**
   - Predict rate limit hits
   - Prevent rate limit hits
   - Optimize rate limit usage