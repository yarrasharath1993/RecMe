# No Direct Messaging Policy

**Generated**: January 25, 2026  
**Purpose**: Explicit policy prohibiting ClawDBot from sending messages directly (NO CODE)

---

## Policy Statement

ClawDBot **never sends messages directly**. It generates message drafts only. All messaging is handled by external adapters (runner, messaging services) after human approval.

---

## Core Principles

### 1. Draft Generation Only

#### Definition
ClawDBot only generates message drafts. It never sends messages.

#### Application
- Generate Telegram message drafts
- Generate WhatsApp message drafts
- Generate email drafts (if applicable)
- No direct API calls to messaging platforms
- No direct message sending

#### Violations
- ClawDBot calling Telegram API directly
- ClawDBot calling WhatsApp API directly
- ClawDBot sending messages directly
- ClawDBot bypassing draft system

---

### 2. No Messaging API Calls

#### Definition
ClawDBot never makes API calls to messaging platforms.

#### Application
- No Telegram Bot API calls
- No WhatsApp API calls
- No email API calls
- No SMS API calls
- No messaging platform API calls of any kind

#### Violations
- ClawDBot calling messaging APIs
- ClawDBot using messaging SDKs
- ClawDBot integrating with messaging platforms
- ClawDBot sending messages programmatically

---

### 3. External Messaging Only

#### Definition
All messaging is handled by external adapters (runner, messaging services).

#### Application
- Runner handles message sending
- Messaging adapters handle platform-specific logic
- Human approval gates all messaging
- ClawDBot only produces drafts

#### Violations
- ClawDBot sending messages directly
- ClawDBot bypassing runner
- ClawDBot bypassing adapters
- ClawDBot bypassing approval gates

---

## Policy Enforcement

### Enforcement Mechanisms

1. **Read-Only Design**
   - ClawDBot has no messaging capabilities
   - ClawDBot cannot call messaging APIs
   - ClawDBot cannot send messages

2. **Draft-Only Output**
   - ClawDBot outputs drafts only
   - Drafts require human approval
   - Drafts are sent by external systems

3. **No API Access**
   - ClawDBot has no API keys for messaging platforms
   - ClawDBot has no messaging SDKs
   - ClawDBot has no network access to messaging platforms

---

## Policy Violations

### Violation Types

1. **Direct Messaging**
   - ClawDBot sending messages directly
   - ClawDBot calling messaging APIs
   - ClawDBot bypassing draft system

2. **API Integration**
   - ClawDBot integrating with messaging platforms
   - ClawDBot using messaging SDKs
   - ClawDBot accessing messaging APIs

3. **Approval Bypass**
   - ClawDBot bypassing approval gates
   - ClawDBot auto-sending messages
   - ClawDBot sending without approval

### Violation Consequences

1. **Immediate Stop**: Stop violating process immediately
2. **Log Violation**: Log all violations for audit
3. **Alert Admin**: Alert administrators of violations
4. **Review Process**: Review process to prevent future violations

---

## Messaging Architecture

### Safe Messaging Flow

```
[ ClawDBot ]
     ↓ (JSON drafts only)
[ Draft Store ]
     ↓ (Human approval)
[ Cursor / Runner ]
     ↓
[ Messaging Adapter ]
     ↓
[ Telegram / WhatsApp ]
```

### ClawDBot's Role

- **Generate Drafts**: ClawDBot generates message drafts (JSON)
- **No Sending**: ClawDBot never sends messages
- **No API Calls**: ClawDBot never calls messaging APIs

### External Systems' Role

- **Runner**: Collects drafts, routes to adapters
- **Messaging Adapter**: Sends messages via platform APIs
- **Human**: Approves drafts before sending

---

## Policy Exceptions

### No Exceptions

This policy has **no exceptions**. ClawDBot never sends messages directly, regardless of circumstances.

---

## Relationship to Other Policies

### Related Policies

- **no_publish.md**: No direct messaging is a subset of no publishing
- **no_autonomy.md**: No direct messaging prevents autonomous actions
- **no_state_mutation.md**: No direct messaging prevents state mutation

### Policy Hierarchy

- **no_publish.md** (parent policy)
  - **no_direct_messaging.md** (specific constraint for messaging)

---

## Policy Maintenance

### Policy Updates

- Policy updates require explicit approval
- Policy changes must be documented
- Policy changes must be tested
- Policy changes must be reviewed

### Policy Monitoring

- Monitor for policy violations
- Track policy compliance
- Generate policy compliance reports
- Review policy effectiveness