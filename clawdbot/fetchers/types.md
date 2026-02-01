# Fetcher Types

**Generated**: January 25, 2026  
**Purpose**: Types of external data fetchers (NO CODE)

**Reference**: Existing data sources from `.cursor/audit/ECOSYSTEM_MAP.md`

---

## Overview

Fetchers fetch data from external sources and convert it to JSON format. All fetchers are dumb, stateless, replaceable, and non-AI.

---

## Fetcher Categories

### RSS Feed Fetchers

#### Purpose
Fetch data from RSS/Atom feeds.

#### Sources
- Entertainment news RSS feeds
- Movie news RSS feeds
- Industry news RSS feeds
- Celebrity news RSS feeds

#### Output Format
```json
{
  "fetcher_id": "rss_fetcher",
  "source": "https://example.com/feed.xml",
  "data": [
    {
      "title": "Article Title",
      "description": "Article description",
      "link": "https://example.com/article",
      "pubDate": "2026-01-25T12:00:00Z",
      "author": "Author Name",
      "categories": ["movies", "trends"]
    }
  ]
}
```

---

### API Fetchers

#### Purpose
Fetch data from REST APIs.

#### Sources
- TMDB API (trends, popular movies)
- News APIs (entertainment news)
- Social Media APIs (trends, mentions)
- Google Trends API (if available)

#### Output Format
```json
{
  "fetcher_id": "api_fetcher",
  "source": "https://api.example.com/trends",
  "data": {
    "trends": [
      {
        "name": "Action-comedy",
        "score": 0.85,
        "timestamp": "2026-01-25T12:00:00Z"
      }
    ]
  }
}
```

---

### File-Based Fetchers

#### Purpose
Fetch data from JSON files.

#### Sources
- Validation report files
- Governance report files
- Trend data files
- Historical data files

#### Output Format
```json
{
  "fetcher_id": "file_fetcher",
  "source": "reports/validation-report.json",
  "data": {
    "report_id": "report-001",
    "timestamp": "2026-01-25T12:00:00Z",
    "issues": []
  }
}
```

---

### Database Query Fetchers

#### Purpose
Fetch data from database (read-only queries).

#### Sources
- Supabase database (read-only)
- Validation reports table
- Governance reports table
- Trend data table

#### Output Format
```json
{
  "fetcher_id": "database_fetcher",
  "source": "supabase://validation_reports",
  "data": {
    "reports": [
      {
        "report_id": "report-001",
        "timestamp": "2026-01-25T12:00:00Z",
        "issues": []
      }
    ]
  }
}
```

---

## Fetcher Implementation Examples

### RSS Fetcher Example

#### Implementation (Conceptual)
```typescript
class RSSFetcher implements DataFetcher {
  async fetch(source: string): Promise<FetcherResult> {
    // Fetch RSS feed
    const feed = await fetchRSSFeed(source);
    
    // Convert to JSON
    const items = feed.items.map(item => ({
      title: item.title,
      description: item.description,
      link: item.link,
      pubDate: item.pubDate
    }));
    
    return {
      fetcher_id: "rss_fetcher",
      source: source,
      timestamp: new Date().toISOString(),
      data: items,
      metadata: {
        items_count: items.length,
        success: true
      }
    };
  }
}
```

---

### API Fetcher Example

#### Implementation (Conceptual)
```typescript
class APIFetcher implements DataFetcher {
  async fetch(source: string, apiKey?: string): Promise<FetcherResult> {
    // Fetch from API
    const response = await fetch(source, {
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    
    // Parse JSON
    const data = await response.json();
    
    return {
      fetcher_id: "api_fetcher",
      source: source,
      timestamp: new Date().toISOString(),
      data: data,
      metadata: {
        success: true
      }
    };
  }
}
```

---

## Fetcher Configuration

### Configuration Format

```json
{
  "fetchers": [
    {
      "fetcher_id": "rss_fetcher",
      "type": "rss",
      "sources": [
        "https://example.com/feed.xml"
      ],
      "enabled": true
    },
    {
      "fetcher_id": "api_fetcher",
      "type": "api",
      "sources": [
        "https://api.example.com/trends"
      ],
      "api_key": "api_key_here",
      "enabled": true
    }
  ]
}
```

---

## Fetcher Selection

### Selection Logic (Runner Responsibility)

#### Process
1. Runner determines which fetcher to use based on source type
2. Runner selects appropriate fetcher
3. Runner invokes fetcher
4. Runner provides result to ClawDBot

#### Selection Rules
- RSS URLs → RSS fetcher
- API endpoints → API fetcher
- File paths → File fetcher
- Database queries → Database fetcher

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

## Fetcher Monitoring

### Monitoring Requirements

1. **Fetch Tracking**
   - Track fetch operations
   - Track fetch success/failure
   - Track fetch duration

2. **Source Monitoring**
   - Monitor source availability
   - Monitor source response times
   - Monitor source error rates

3. **Performance Monitoring**
   - Monitor fetcher performance
   - Monitor resource usage
   - Monitor error rates

---

## References

- **Fetcher Interface**: `clawdbot/fetchers/interface.md`
- **Ecosystem Map**: `.cursor/audit/ECOSYSTEM_MAP.md` (existing data sources)
- **No State Mutation Policy**: `clawdbot/policies/no_state_mutation.md`