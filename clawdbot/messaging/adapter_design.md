# Messaging Adapter Design

**Generated**: January 25, 2026  
**Purpose**: Design for dumb, stateless, replaceable messaging adapters (NO CODE)

---

## Overview

Messaging adapters are **dumb, stateless, replaceable** components that handle platform-specific message sending. They are **not AI-powered** and have **no decision-making capabilities**.

---

## Architecture

### Messaging Flow

```
[ ClawDBot ]
     ↓ (JSON drafts only)
[ Draft Store ]
     ↓ (Human approves)
[ Cursor / Runner ]
     ↓
[ Messaging Adapter ]
     ↓
[ Telegram / WhatsApp API ]
```

### Component Responsibilities

#### ClawDBot
- **Role**: Generate drafts (JSON only)
- **Capabilities**: Draft generation, no sending

#### Draft Store
- **Role**: Store drafts, manage approval state
- **Capabilities**: Storage, retrieval, approval tracking

#### Cursor / Runner
- **Role**: Route approved drafts to adapters
- **Capabilities**: Draft routing, adapter invocation

#### Messaging Adapter
- **Role**: Send messages via platform APIs
- **Capabilities**: Platform-specific sending, no decisions

---

## Adapter Characteristics

### Dumb

#### Definition
Adapters have no intelligence or decision-making capabilities.

#### Application
- No AI/LLM integration
- No content generation
- No content modification
- No decision-making

#### Examples
- Adapter receives draft, sends as-is
- Adapter does not modify draft content
- Adapter does not generate content
- Adapter does not make decisions

---

### Stateless

#### Definition
Adapters maintain no state between invocations.

#### Application
- No persistent state
- No session state
- No connection state (except during send)
- No memory of previous sends

#### Examples
- Each send is independent
- No state shared between sends
- No state persisted
- No state restored

---

### Replaceable

#### Definition
Adapters can be easily replaced without affecting other components.

#### Application
- Simple interface
- No tight coupling
- Easy to swap implementations
- Easy to test

#### Examples
- Telegram adapter can be replaced with different implementation
- WhatsApp adapter can be replaced with different implementation
- Adapters can be swapped without code changes
- Adapters can be tested independently

---

### Not AI-Powered

#### Definition
Adapters do not use AI or LLMs.

#### Application
- No LLM calls
- No AI inference
- No content generation
- No content modification

#### Examples
- Adapter sends draft content as-is
- Adapter does not use AI to modify content
- Adapter does not use AI to generate content
- Adapter does not use AI to make decisions

---

## Adapter Interface

### Interface Definition

```typescript
interface MessagingAdapter {
  send(draft: MessagingDraft, config: AdapterConfig): Promise<SendResult>;
}
```

### Interface Methods

#### send()

#### Parameters
- `draft`: MessagingDraft (conforms to draft schema)
- `config`: AdapterConfig (platform-specific configuration)

#### Returns
- `Promise<SendResult>`: Result of send operation

#### Behavior
- Validates draft (intent, constraints)
- Sends draft via platform API
- Returns send result
- No side effects beyond sending

---

## Adapter Implementation

### Telegram Adapter

#### Responsibilities
- Send messages via Telegram Bot API
- Handle Telegram-specific formatting
- Handle Telegram rate limits
- Return send results

#### Implementation Details
- Uses Telegram Bot API
- Sends to configured chat ID
- Handles API errors
- Logs send operations

---

### WhatsApp Adapter

#### Responsibilities
- Send messages via WhatsApp API
- Handle WhatsApp-specific formatting
- Handle WhatsApp rate limits
- Return send results

#### Implementation Details
- Uses WhatsApp Business API (or similar)
- Sends to configured number
- Handles API errors
- Logs send operations

---

## Adapter Configuration

### Configuration Format

```json
{
  "adapter_type": "telegram",
  "api_key": "bot_token",
  "chat_id": "chat_id",
  "rate_limit": 30,
  "enabled": true
}
```

### Configuration Fields

- `adapter_type`: Platform type (telegram, whatsapp)
- `api_key`: Platform API key/token
- `chat_id` / `number`: Target chat/number
- `rate_limit`: Rate limit (requests per minute)
- `enabled`: Whether adapter is enabled

---

## Adapter Validation

### Draft Validation

#### Required Checks
- Draft conforms to draft schema
- `intent` is "DRAFT_ONLY"
- Constraints are satisfied
- `approved_by` is "human"

#### Validation Failure
- Reject draft
- Log validation error
- Return error result
- Do not send

---

## Adapter Error Handling

### Error Types

#### API Errors
- Rate limit errors
- Authentication errors
- Network errors
- Platform errors

#### Error Handling
- Log errors
- Return error results
- Do not retry automatically
- Require manual intervention

---

## Adapter Testing

### Test Strategy

#### Unit Tests
- Test adapter interface
- Test draft validation
- Test error handling
- Test configuration

#### Integration Tests
- Test adapter with platform APIs (mocked)
- Test adapter with draft store
- Test adapter with runner
- Test end-to-end flow

---

## Adapter Replacement

### Replacement Process

1. **Create New Adapter**
   - Implement adapter interface
   - Test adapter independently
   - Validate adapter behavior

2. **Swap Adapter**
   - Update configuration
   - Replace adapter implementation
   - Test replacement

3. **Verify Replacement**
   - Test sending functionality
   - Verify no regressions
   - Monitor adapter performance

---

## Safety Guarantees

### Dumb Guarantee
- Adapters have no intelligence
- Adapters make no decisions
- Adapters do not modify content

### Stateless Guarantee
- Adapters maintain no state
- Each send is independent
- No state persistence

### Replaceable Guarantee
- Adapters can be easily replaced
- No tight coupling
- Simple interface

### Non-AI Guarantee
- Adapters do not use AI
- Adapters do not use LLMs
- Adapters do not generate content

---

## References

- **Draft Schema**: `clawdbot/messaging/draft_schema.md`
- **Telegram Policy**: `clawdbot/messaging/telegram_policy.md`
- **WhatsApp Policy**: `clawdbot/messaging/whatsapp_policy.md`
- **No Direct Messaging Policy**: `clawdbot/policies/no_direct_messaging.md`