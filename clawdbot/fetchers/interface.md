# Fetcher Interface

**Generated**: January 25, 2026  
**Purpose**: Interface definition for external data fetchers (NO CODE)

---

## Overview

Fetchers are **dumb, stateless, replaceable** components that fetch data from external sources (RSS, APIs, files) and convert it to JSON format for ClawDBot. Fetchers are **not AI-powered** and have **no analysis capabilities**.

---

## Fetcher Characteristics

### Dumb

#### Definition
Fetchers have no intelligence or analysis capabilities.

#### Application
- No AI/LLM integration
- No content analysis
- No content generation
- No decision-making

#### Examples
- Fetcher fetches RSS feed, returns raw data
- Fetcher fetches API data, returns raw data
- Fetcher does not analyze data
- Fetcher does not generate content

---

### Stateless

#### Definition
Fetchers maintain no state between invocations.

#### Application
- No persistent state
- No session state
- No connection state (except during fetch)
- No memory of previous fetches

#### Examples
- Each fetch is independent
- No state shared between fetches
- No state persisted
- No state restored

---

### Replaceable

#### Definition
Fetchers can be easily replaced without affecting other components.

#### Application
- Simple interface
- No tight coupling
- Easy to swap implementations
- Easy to test

#### Examples
- RSS fetcher can be replaced with different implementation
- API fetcher can be replaced with different implementation
- Fetchers can be swapped without code changes
- Fetchers can be tested independently

---

### Non-AI

#### Definition
Fetchers do not use AI or LLMs.

#### Application
- No LLM calls
- No AI inference
- No content generation
- No content analysis

#### Examples
- Fetcher returns raw data as-is
- Fetcher does not use AI to analyze data
- Fetcher does not use AI to generate content
- Fetcher does not use AI to make decisions

---

## Fetcher Interface

### Interface Definition

```typescript
interface DataFetcher {
  fetch(source: FetcherSource, options?: FetcherOptions): Promise<FetcherResult>;
}
```

### Interface Methods

#### fetch()

#### Parameters
- `source`: FetcherSource (RSS URL, API endpoint, file path)
- `options`: FetcherOptions (optional, fetcher-specific)

#### Returns
- `Promise<FetcherResult>`: Fetched data in JSON format

#### Behavior
- Fetches data from source
- Converts data to JSON format
- Returns JSON result
- No side effects beyond fetching

---

## Fetcher Result Format

### Result Schema

```json
{
  "fetcher_id": "rss_fetcher",
  "source": "https://example.com/feed.xml",
  "timestamp": "2026-01-25T12:00:00Z",
  "data": [],
  "metadata": {
    "items_count": 10,
    "fetch_duration_ms": 500,
    "success": true
  }
}
```

### Result Fields

- `fetcher_id`: Identifier of fetcher that produced this result
- `source`: Source URL/path that was fetched
- `timestamp`: When fetch occurred (ISO-8601)
- `data`: Array of fetched items (JSON objects)
- `metadata`: Fetch metadata (count, duration, success)

---

## Fetcher Types

### RSS Fetcher

#### Purpose
Fetch data from RSS feeds.

#### Input
- RSS feed URL

#### Output
- JSON array of feed items
- Each item: title, description, link, pubDate, etc.

#### Example
```json
{
  "fetcher_id": "rss_fetcher",
  "source": "https://example.com/feed.xml",
  "data": [
    {
      "title": "Article Title",
      "description": "Article description",
      "link": "https://example.com/article",
      "pubDate": "2026-01-25T12:00:00Z"
    }
  ]
}
```

---

### API Fetcher

#### Purpose
Fetch data from REST APIs.

#### Input
- API endpoint URL
- API key (if required)

#### Output
- JSON response from API

#### Example
```json
{
  "fetcher_id": "api_fetcher",
  "source": "https://api.example.com/trends",
  "data": {
    "trends": [
      {"name": "Action-comedy", "score": 0.85}
    ]
  }
}
```

---

### File Fetcher

#### Purpose
Fetch data from JSON files.

#### Input
- File path

#### Output
- JSON content from file

#### Example
```json
{
  "fetcher_id": "file_fetcher",
  "source": "reports/validation-report.json",
  "data": {
    "report_id": "report-001",
    "issues": []
  }
}
```

---

## Fetcher Integration

### Runner Integration

#### Flow
1. Runner determines which fetcher to use
2. Runner invokes fetcher with source
3. Fetcher returns JSON data
4. Runner provides JSON data to ClawDBot

#### Example
```typescript
// Runner code (conceptual)
const fetcher = getFetcher('rss_fetcher');
const result = await fetcher.fetch('https://example.com/feed.xml');
const clawdbotInput = result.data;
const output = await clawdbot.analyze(clawdbotInput);
```

---

### ClawDBot Integration

#### Flow
1. ClawDBot receives JSON inputs (from runner)
2. ClawDBot analyzes JSON inputs
3. ClawDBot produces JSON outputs
4. ClawDBot never calls fetchers directly

#### Constraint
- ClawDBot never calls fetchers directly
- All fetching handled by runner
- ClawDBot receives JSON only

---

## Fetcher Error Handling

### Error Types

#### Network Errors
- Connection failures
- Timeout errors
- DNS errors

#### API Errors
- Rate limit errors
- Authentication errors
- API errors

#### Data Errors
- Invalid data format
- Missing data
- Corrupted data

### Error Handling

#### Behavior
- Log errors
- Return error results
- Do not retry automatically
- Require manual intervention

---

## Fetcher Testing

### Test Strategy

#### Unit Tests
- Test fetcher interface
- Test data conversion
- Test error handling
- Test configuration

#### Integration Tests
- Test fetcher with real sources (mocked)
- Test fetcher with runner
- Test fetcher with ClawDBot
- Test end-to-end flow

---

## Fetcher Replacement

### Replacement Process

1. **Create New Fetcher**
   - Implement fetcher interface
   - Test fetcher independently
   - Validate fetcher behavior

2. **Swap Fetcher**
   - Update configuration
   - Replace fetcher implementation
   - Test replacement

3. **Verify Replacement**
   - Test fetching functionality
   - Verify no regressions
   - Monitor fetcher performance

---

## Safety Guarantees

### Dumb Guarantee
- Fetchers have no intelligence
- Fetchers make no decisions
- Fetchers do not analyze data

### Stateless Guarantee
- Fetchers maintain no state
- Each fetch is independent
- No state persistence

### Replaceable Guarantee
- Fetchers can be easily replaced
- No tight coupling
- Simple interface

### Non-AI Guarantee
- Fetchers do not use AI
- Fetchers do not use LLMs
- Fetchers do not generate content

---

## References

- **Fetcher Types**: `clawdbot/fetchers/types.md`
- **No State Mutation Policy**: `clawdbot/policies/no_state_mutation.md`