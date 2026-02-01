# LLM Usage Map

**Generated**: January 25, 2026  
**Purpose**: Complete inventory of all LLM usage, models, purposes, frequency, cost risks, and escalation paths

---

## LLM Providers

### Groq (Primary)

#### Models Used
1. **llama-3.3-70b-versatile**
   - Max Tokens: 32,768
   - Speed: Fast
   - Quality: High
   - JSON Mode: Yes
   - Purpose: Primary model for high-quality inference

2. **llama-3.1-8b-instant**
   - Max Tokens: 8,192
   - Speed: Fast
   - Quality: Medium
   - JSON Mode: Yes
   - Purpose: Fast inference, fallback model

3. **mixtral-8x7b-32768**
   - Max Tokens: 32,768
   - Speed: Medium
   - Quality: High
   - JSON Mode: Yes
   - Purpose: High-quality fallback

4. **llama3-70b-8192**
   - Max Tokens: 8,192
   - Speed: Medium
   - Quality: High
   - JSON Mode: Yes
   - Purpose: High-quality fallback

5. **gemma2-9b-it**
   - Max Tokens: 8,192
   - Speed: Fast
   - Quality: Medium
   - JSON Mode: Yes
   - Purpose: Fast fallback

#### Rate Limits
- Default: 30 requests/minute
- Cooldown: 60,000ms (1 minute)
- Fallback: Automatic model rotation

#### Cost Risk
- **Level**: Low-Medium
- **Reason**: Groq pricing is generally lower than OpenAI
- **Mitigation**: Model fallback, rate limiting, cooldown management

#### Escalation Path
1. Rate limit hit → Try next model in chain
2. All models rate limited → Wait for cooldown
3. Persistent failures → Fall back to OpenAI
4. All providers fail → Return error (no auto-retry loops)

---

### OpenAI (Fallback)

#### Models Used
1. **gpt-4o-mini**
   - Max Tokens: 16,384
   - Speed: Fast
   - Quality: High
   - JSON Mode: Yes
   - Purpose: Primary OpenAI fallback

2. **gpt-4o**
   - Max Tokens: 4,096
   - Speed: Medium
   - Quality: High
   - JSON Mode: Yes
   - Purpose: High-quality OpenAI fallback

3. **gpt-3.5-turbo**
   - Max Tokens: 4,096
   - Speed: Fast
   - Quality: Medium
   - JSON Mode: Yes
   - Purpose: Fast OpenAI fallback

#### Rate Limits
- Default: 60 requests/minute
- Cooldown: 60,000ms (1 minute)
- Fallback: Model rotation

#### Cost Risk
- **Level**: Medium-High
- **Reason**: OpenAI pricing is higher than Groq
- **Mitigation**: Used only as fallback, rate limiting, cooldown management

#### Escalation Path
1. Rate limit hit → Try next model in chain
2. All models rate limited → Wait for cooldown
3. Persistent failures → Return error (no infinite retries)

---

## LLM Usage Locations

### 1. Synopsis Generation

#### File
`scripts/enrich-synopsis-ai.ts`

#### Model
- Primary: `llama-3.3-70b-versatile`
- Fallback: Other Groq models → OpenAI

#### Purpose
Generate English and Telugu synopses for movies missing them

#### Frequency
- On-demand (manual script execution)
- Batch processing (limited by rate limits)
- Estimated: 100-500 requests per batch run

#### Cost Risk
- **Level**: Low-Medium
- **Reason**: Batch processing can generate many requests
- **Mitigation**: Rate limiting, batch delays, manual execution

#### Escalation Path
1. Rate limit → Wait and retry (with delay)
2. Persistent failures → Skip and log error
3. No infinite retries

#### Token Intent Label
- **Label**: `analysis`
- **Reason**: Analyzing movie data to generate synopsis

---

### 2. Genre Inference

#### File
`scripts/enrich-genres-ai.ts`

#### Model
- Primary: `llama-3.1-8b-instant` (fast)
- Fallback: Other Groq models → OpenAI

#### Purpose
Infer movie genres when missing from external sources

#### Frequency
- On-demand (manual script execution)
- Batch processing (limited by rate limits)
- Estimated: 50-200 requests per batch run

#### Cost Risk
- **Level**: Low
- **Reason**: Smaller batches, faster model
- **Mitigation**: Rate limiting, batch delays

#### Escalation Path
1. Rate limit → Try next model
2. All models fail → Skip and log error

#### Token Intent Label
- **Label**: `analysis`
- **Reason**: Analyzing movie data to infer genres

---

### 3. Tagline Generation

#### File
`scripts/enrich-tagline.ts`

#### Model
- Primary: `llama-3.3-70b-versatile` (preferred)
- Fallback: `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, `llama3-70b-8192`, `gemma2-9b-it`

#### Purpose
Generate movie taglines when missing

#### Frequency
- On-demand (manual script execution)
- Batch processing (limited by rate limits)
- Estimated: 50-200 requests per batch run

#### Cost Risk
- **Level**: Low
- **Reason**: Smaller batches, manual execution
- **Mitigation**: Rate limiting, model fallback

#### Escalation Path
1. Rate limit → Try next model
2. All models fail → Skip and log error

#### Token Intent Label
- **Label**: `draft`
- **Reason**: Generating creative tagline drafts

---

### 4. General AI Inference

#### File
`scripts/enrich-ai-inference.ts`

#### Model
- Primary: `llama-3.1-8b-instant`
- Fallback: Other Groq models → OpenAI

#### Purpose
Infer hero, heroine, director when missing from external sources

#### Frequency
- On-demand (manual script execution)
- Last resort in waterfall enrichment
- Estimated: 10-50 requests per run

#### Cost Risk
- **Level**: Low
- **Reason**: Last resort, small batches
- **Mitigation**: Only used when other sources fail

#### Escalation Path
1. Rate limit → Try next model
2. All models fail → Return null (no data)

#### Token Intent Label
- **Label**: `analysis`
- **Reason**: Analyzing movie data to infer missing fields

---

### 5. Translation Service

#### File
`lib/enrichment/translation-service.ts`

#### Model
- Primary: Groq models (fallback chain)
- Fallback: OpenAI → Google Translate (non-LLM)

#### Purpose
Translate text to Telugu (primarily synopses)

#### Frequency
- On-demand (during enrichment)
- Batch processing (limited by rate limits)
- Estimated: 100-500 requests per batch run

#### Cost Risk
- **Level**: Low-Medium
- **Reason**: Batch processing, but has non-LLM fallback
- **Mitigation**: Google Translate fallback, rate limiting

#### Escalation Path
1. Rate limit → Try next model
2. All LLM models fail → Fall back to Google Translate
3. Google Translate fails → Return error

#### Token Intent Label
- **Label**: `draft`
- **Reason**: Generating translated text

---

### 6. Celebrity Profile Completion

#### File
`scripts/ai-complete-all-profiles.ts`

#### Model
- Primary: Groq (model chain)
- Fallback: OpenAI

#### Purpose
Generate missing celebrity profile fields (USP, biography, etc.)

#### Frequency
- On-demand (manual script execution)
- Batch processing (limited by rate limits)
- Estimated: 100-1000 requests per batch run

#### Cost Risk
- **Level**: Medium
- **Reason**: Large batches, profile completion requires more tokens
- **Mitigation**: Rate limiting, batch delays, manual execution

#### Escalation Path
1. Rate limit → Wait and retry (with delay)
2. Persistent failures → Skip and log error

#### Token Intent Label
- **Label**: `draft`
- **Reason**: Generating profile content drafts

---

### 7. Pattern Detection

#### File
`scripts/detect-advanced-patterns.ts`

#### Model
- Primary: Groq (model chain)
- Fallback: OpenAI

#### Purpose
Detect advanced patterns in movie data

#### Frequency
- On-demand (manual script execution)
- Estimated: 10-50 requests per run

#### Cost Risk
- **Level**: Low
- **Reason**: Small batches, manual execution
- **Mitigation**: Rate limiting

#### Escalation Path
1. Rate limit → Try next model
2. All models fail → Return empty results

#### Token Intent Label
- **Label**: `analysis`
- **Reason**: Analyzing patterns in data

---

### 8. Template vs AI Comparison

#### File
`scripts/template-vs-ai-compare.ts`

#### Model
- Primary: `llama-3.1-8b-instant`
- Fallback: Other Groq models

#### Purpose
Compare template-generated content with AI-generated content

#### Frequency
- On-demand (manual script execution)
- Estimated: 10-100 requests per run

#### Cost Risk
- **Level**: Low
- **Reason**: Manual execution, small batches
- **Mitigation**: Rate limiting

#### Escalation Path
1. Rate limit → Try next model
2. All models fail → Skip AI comparison

#### Token Intent Label
- **Label**: `draft`
- **Reason**: Generating content for comparison

---

### 9. Waterfall Enrichment (Last Resort)

#### File
`scripts/enrich-waterfall.ts`

#### Model
- Primary: `llama-3.1-8b-instant`
- Fallback: Other Groq models

#### Purpose
Last resort AI inference when all external sources fail

#### Frequency
- On-demand (manual script execution)
- Last resort only
- Estimated: 5-20 requests per run

#### Cost Risk
- **Level**: Very Low
- **Reason**: Last resort, very small batches
- **Mitigation**: Only used when all other sources fail

#### Escalation Path
1. Rate limit → Try next model
2. All models fail → Return null (no data)

#### Token Intent Label
- **Label**: `analysis`
- **Reason**: Analyzing movie data as last resort

---

### 10. Smart AI Key Manager

#### File
`lib/ai/smart-key-manager.ts`

#### Model
- All Groq models (fallback chain)
- All OpenAI models (fallback chain)

#### Purpose
Centralized AI access with automatic fallback and key rotation

#### Frequency
- Used by all LLM-consuming scripts
- Aggregates all LLM usage

#### Cost Risk
- **Level**: Aggregated (see individual usage above)
- **Reason**: Centralized management
- **Mitigation**: Rate limiting, cooldown management, model fallback

#### Escalation Path
1. Provider rate limit → Try next provider
2. Model deprecation → Try next model
3. All providers/models fail → Return error

#### Token Intent Label
- **Label**: Inherited from caller (`analysis`, `draft`, `validation`)

---

## Cost Escalation Risks

### High Risk Scenarios

1. **Unlimited Batch Processing**
   - Risk: Running large batches without limits
   - Mitigation: Manual execution, batch size limits, rate limiting

2. **Automated Retry Loops**
   - Risk: Infinite retries on failures
   - Mitigation: Max retry limits, exponential backoff, error handling

3. **No Rate Limiting**
   - Risk: Exceeding API rate limits, triggering costs
   - Mitigation: Rate limiting, cooldown management, model fallback

4. **High Token Usage Models**
   - Risk: Using expensive models for simple tasks
   - Mitigation: Model selection based on task complexity, fallback chains

### Medium Risk Scenarios

1. **Frequent Scheduled Runs**
   - Risk: Scheduled scripts running too frequently
   - Mitigation: Manual scheduling, configurable intervals

2. **Large Batch Sizes**
   - Risk: Processing too many items in one batch
   - Mitigation: Batch size limits, manual execution

3. **No Cost Monitoring**
   - Risk: Unaware of cost accumulation
   - Mitigation: Manual monitoring, usage tracking (future)

### Low Risk Scenarios

1. **Manual Execution**
   - Risk: Low (human oversight)
   - Mitigation: All scripts require manual execution

2. **Small Batches**
   - Risk: Low (limited scope)
   - Mitigation: Batch size limits

3. **Fallback Chains**
   - Risk: Low (automatic cost optimization)
   - Mitigation: Model selection based on cost/quality tradeoff

---

## Escalation Policies

### Level 1: Rate Limit Hit
- **Action**: Try next model in chain
- **Wait Time**: 0ms (immediate fallback)
- **Max Retries**: Model chain length

### Level 2: All Models Rate Limited
- **Action**: Wait for cooldown period
- **Wait Time**: 60,000ms (1 minute)
- **Max Retries**: 1 (then return error)

### Level 3: Provider Failure
- **Action**: Fall back to next provider
- **Wait Time**: 0ms (immediate fallback)
- **Max Retries**: 1 (Groq → OpenAI)

### Level 4: All Providers Fail
- **Action**: Return error, log failure
- **Wait Time**: N/A
- **Max Retries**: 0 (no infinite loops)

### Level 5: Cost Threshold Exceeded (Future)
- **Action**: Stop processing, alert admin
- **Wait Time**: N/A
- **Max Retries**: 0

---

## Token Intent Labels

### `analysis`
- Purpose: Analyzing data to extract insights
- Examples: Synopsis generation, genre inference, pattern detection
- Cost Risk: Medium (can be batch processed)

### `draft`
- Purpose: Generating creative content drafts
- Examples: Tagline generation, translation, profile completion
- Cost Risk: Medium (creative content may require more tokens)

### `validation`
- Purpose: Validating data quality
- Examples: Cross-reference validation, confidence scoring
- Cost Risk: Low (validation is typically rule-based, not LLM-based)

---

## Recommendations

1. **Implement Cost Monitoring**
   - Track token usage per script
   - Set daily/monthly cost caps
   - Alert on threshold breaches

2. **Enforce Rate Limits**
   - All scripts should respect rate limits
   - Use centralized rate limiter
   - Implement cooldown periods

3. **Optimize Model Selection**
   - Use fast models for simple tasks
   - Use high-quality models only when needed
   - Prefer Groq over OpenAI (cost optimization)

4. **Batch Size Limits**
   - Set maximum batch sizes per script
   - Require explicit approval for large batches
   - Implement progress tracking

5. **Manual Execution Only**
   - No autonomous LLM calls
   - All scripts require manual trigger
   - Human oversight for all LLM usage