# MCP Setup Guide for Buddy OS + Cursor Full-Flow

## Step 1: Gather API Tokens

### GitHub Token
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy token (starts with `ghp_`)

### Jira/Confluence Token
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token labeled "Cursor MCP"
3. Note your email and site (e.g., `sixt` from `sixt.atlassian.net`)

### Slack Tokens
1. Open Slack in browser (not desktop app)
2. DevTools (F12) → Console tab → Run:
```javascript
JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token
```
3. Copy `xoxc-...` token
4. Find `xoxd-...` token in cookies (DevTools → Application → Cookies)
5. Get Team ID from URL: `https://app.slack.com/client/T0XXXXXXX/...`

## Step 2: Create .env.local

After gathering tokens, create `.env.local` in the workspace root:

```bash
# GitHub MCP
GITHUB_USERNAME=YourUsername
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx

# Jira/Confluence MCP
ATLASSIAN_USER_EMAIL=your.email@company.com
ATLASSIAN_API_TOKEN=ATATTxxxxx
ATLASSIAN_SITE=yoursite
JIRA_URL=https://yoursite.atlassian.net
CONFLUENCE_URL=https://yoursite.atlassian.net/wiki

# Slack MCP
SLACK_TEAM_ID=T0XXXXXXX
SLACK_TOKEN=xoxc-xxxxx
SLACK_COOKIE=xoxd-xxxxx
```

## Step 3: Create ~/.cursor/mcp.json

After gathering tokens, create `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxxxx"
      }
    },
    "atlassian": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-atlassian", "--confluence-url", "https://yoursite.atlassian.net/wiki", "--jira-url", "https://yoursite.atlassian.net"],
      "env": {
        "ATLASSIAN_USER_EMAIL": "your.email@company.com",
        "ATLASSIAN_API_TOKEN": "ATATTxxxxx"
      }
    },
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_TEAM_ID": "T0XXXXXXX",
        "SLACK_TOKEN": "xoxc-xxxxx",
        "SLACK_COOKIE": "xoxd-xxxxx"
      }
    }
  }
}
```

## Step 4: Update .git/info/exclude

The exclude file has been updated to ignore:
- `.env.local`
- `.cursor/buddy/`
- `.cursor/commands/`
- `CursorLens/`

## Next Steps

1. ✅ Install Buddy OS (Step 1 - Done)
2. ✅ Install Cursor Full-Flow (Step 2 - Done)
3. ⏳ Gather API tokens (You need to do this)
4. ⏳ Create `.env.local` with your tokens
5. ⏳ Create `~/.cursor/mcp.json` with your tokens
6. ⏳ Restart Cursor IDE to activate MCP integrations

## Available Commands

### Buddy OS
- `/buddy` - Daily snapshot with GitHub/Jira/Slack context
- `/buddy ideas` - AI-generated improvement suggestions
- `/buddy plan` - Generate task breakdown
- `/buddy review` - Code review current changes

### Cursor Full-Flow
- `/full-flow RBW-1234` - Complete Jira → PR workflow (auto-resume)
- `/jira-fetch RBW-1234` - Fetch ticket with AC & comments
- `/jira-branch RBW-1234` - Create feature branch
- `/pr-review 12345` - AI-powered PR review
- `/pr-fix 12345` - Address review comments
- `/plan-and-budget` - Implementation plan with file budget
- `/churn-map` - Find high-churn files

## Documentation
- Buddy OS: https://github.com/sharath317/buddy-os
- Full-Flow: https://github.com/sharath317/cursor-full-flow
