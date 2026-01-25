#!/bin/bash

# Buddy OS + Cursor Full-Flow MCP Setup Script
# This script helps you set up MCP integrations

set -e

echo "🔧 Buddy OS + Cursor Full-Flow MCP Setup"
echo ""

# Check if .env.local already exists
if [ -f ".env.local" ]; then
  echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
  cp .env.local .env.local.backup
fi

# Create .env.local from template
echo "📝 Creating .env.local from template..."
cat > .env.local << 'ENVEOF'
# GitHub MCP
# Get token from: https://github.com/settings/tokens
# Required scopes: repo, read:org, read:user
GITHUB_USERNAME=YourUsername
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx

# Jira/Confluence MCP
# Get API token from: https://id.atlassian.com/manage-profile/security/api-tokens
# Note: Use your email and site (e.g., 'sixt' from 'sixt.atlassian.net')
ATLASSIAN_USER_EMAIL=your.email@company.com
ATLASSIAN_API_TOKEN=ATATTxxxxx
ATLASSIAN_SITE=yoursite
JIRA_URL=https://yoursite.atlassian.net
CONFLUENCE_URL=https://yoursite.atlassian.net/wiki

# Slack MCP
# Get tokens from Slack browser DevTools (see .cursor/mcp-setup-guide.md)
SLACK_TEAM_ID=T0XXXXXXX
SLACK_TOKEN=xoxc-xxxxx
SLACK_COOKIE=xoxd-xxxxx
ENVEOF

echo "✅ Created .env.local"
echo ""

# Check if ~/.cursor/mcp.json already exists
if [ -f ~/.cursor/mcp.json ]; then
  echo "⚠️  ~/.cursor/mcp.json already exists. Backing up to ~/.cursor/mcp.json.backup"
  cp ~/.cursor/mcp.json ~/.cursor/mcp.json.backup
fi

# Create ~/.cursor/mcp.json from template
echo "📝 Creating ~/.cursor/mcp.json from template..."
mkdir -p ~/.cursor
cat > ~/.cursor/mcp.json << 'MCPEOF'
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
MCPEOF

echo "✅ Created ~/.cursor/mcp.json"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Template files created!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Gather API tokens (see .cursor/mcp-setup-guide.md for instructions)"
echo ""
echo "2. Edit .env.local and replace placeholder values with your tokens:"
echo "   - GITHUB_USERNAME and GITHUB_PERSONAL_ACCESS_TOKEN"
echo "   - ATLASSIAN_USER_EMAIL, ATLASSIAN_API_TOKEN, ATLASSIAN_SITE"
echo "   - SLACK_TEAM_ID, SLACK_TOKEN, SLACK_COOKIE"
echo ""
echo "3. Edit ~/.cursor/mcp.json and replace placeholder values with your tokens"
echo ""
echo "4. Restart Cursor IDE to activate MCP integrations"
echo ""
echo "✨ After restart, try:"
echo "   /buddy           - Daily snapshot"
echo "   /full-flow RBW-1234 - Complete Jira → PR workflow"
echo ""
