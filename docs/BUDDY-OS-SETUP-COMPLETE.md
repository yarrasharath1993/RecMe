# Buddy OS + Cursor Full-Flow Setup Complete ✅

**Date:** January 18, 2026  
**Status:** Installation Complete - MCP Configuration Pending

## ✅ Completed Steps

### 1. Buddy OS Installation
- ✅ Installed with Tech Lead bundle (Staff/Principal role)
- ✅ 13 intelligent rules installed
- ✅ Location: `.cursor/buddy/`
- ✅ Configuration initialized
- ✅ Audit logging enabled

### 2. Cursor Full-Flow Installation
- ✅ Installed Complete bundle (22 commands)
- ✅ Location: `.cursor/commands/`
- ✅ All workflow commands available

### 3. Directory Structure
- ✅ `~/.cursor/` directory created
- ✅ `.git/info/exclude` updated to ignore:
  - `.env.local`
  - `.cursor/buddy/`
  - `.cursor/commands/`
  - `CursorLens/`

### 4. Template Files Created
- ✅ `.cursor/mcp-setup-guide.md` - Complete setup instructions
- ✅ `.cursor/mcp.json.template` - MCP configuration template
- ✅ `setup-mcp.sh` - Automated setup script

## ⏳ Remaining Steps (Manual)

### Step 1: Gather API Tokens

#### GitHub Token
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy token (starts with `ghp_`)

#### Jira/Confluence Token
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Create API token labeled "Cursor MCP"
3. Note your email and site (e.g., `sixt` from `sixt.atlassian.net`)

#### Slack Tokens
1. Open Slack in browser (not desktop app)
2. DevTools (F12) → Console tab → Run:
```javascript
JSON.parse(localStorage.localConfig_v2).teams[Object.keys(JSON.parse(localStorage.localConfig_v2).teams)[0]].token
```
3. Copy `xoxc-...` token
4. Find `xoxd-...` token in cookies (DevTools → Application → Cookies)
5. Get Team ID from URL: `https://app.slack.com/client/T0XXXXXXX/...`

### Step 2: Run Setup Script

```bash
./setup-mcp.sh
```

This will create:
- `.env.local` (in workspace root)
- `~/.cursor/mcp.json` (in home directory)

### Step 3: Edit Configuration Files

#### Edit `.env.local`
Replace placeholder values with your actual tokens:
- `GITHUB_USERNAME` and `GITHUB_PERSONAL_ACCESS_TOKEN`
- `ATLASSIAN_USER_EMAIL`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_SITE`
- `SLACK_TEAM_ID`, `SLACK_TOKEN`, `SLACK_COOKIE`

#### Edit `~/.cursor/mcp.json`
Replace placeholder values with your actual tokens (same as above)

### Step 4: Restart Cursor IDE

**IMPORTANT:** Restart Cursor IDE after completing configuration to activate MCP integrations!

## 🎯 Available Commands

### Buddy OS Commands
- `/buddy` - Daily snapshot with GitHub/Jira/Slack context
- `/buddy ideas` - AI-generated improvement suggestions
- `/buddy plan` - Generate task breakdown
- `/buddy review` - Code review current changes

### Cursor Full-Flow Commands
- `/full-flow RBW-1234` - Complete Jira → PR workflow (auto-resume)
- `/jira-fetch RBW-1234` - Fetch ticket with AC & comments
- `/jira-branch RBW-1234` - Create feature branch
- `/pr-review 12345` - AI-powered PR review
- `/pr-fix 12345` - Address review comments
- `/plan-and-budget` - Implementation plan with file budget
- `/churn-map` - Find high-churn files

## 📁 Files Created

| File | Location | Purpose |
|------|----------|---------|
| `.env.local` | Workspace root | API tokens (excluded from git) |
| `~/.cursor/mcp.json` | Home directory | MCP server configuration |
| `.cursor/buddy/` | Workspace | Buddy OS rules & state |
| `.cursor/commands/` | Workspace | Full-Flow workflow commands |
| `.git/info/exclude` | Workspace | Local git exclusions |

## 🔧 Maintenance Commands

```bash
npx buddy-os status         # Check Buddy OS config
npx buddy-os mcp-setup      # Reconfigure MCPs
npx cursor-full-flow status # Check Full-Flow status
npx buddy-os cleanup        # Remove installation
```

## 📚 Documentation

- **Buddy OS:** https://github.com/sharath317/buddy-os
- **Full-Flow:** https://github.com/sharath317/cursor-full-flow
- **Setup Guide:** `.cursor/mcp-setup-guide.md`

## ⚠️ Security Notes

- `.env.local` is excluded from git (won't be committed)
- `~/.cursor/mcp.json` is in your home directory (not in repo)
- Never commit API tokens to version control
- Tokens are stored locally only

---

**Next Action:** Run `./setup-mcp.sh` and follow the prompts to complete MCP configuration.
