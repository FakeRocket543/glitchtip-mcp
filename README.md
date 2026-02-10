# glitchtip-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [GlitchTip](https://glitchtip.com/) — the open-source error tracking platform (Sentry-compatible).

Let AI assistants directly query your production errors without copy-pasting.

## Features

- 🔍 List and search issues/errors
- 📋 Get detailed error information with stack traces
- 📊 View event history for issues
- ✅ Resolve issues directly from AI chat
- 🔗 Works with any MCP-compatible client (Claude, Cursor, Kiro, etc.)

## Installation

```bash
npm install
```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GLITCHTIP_HOST` | GlitchTip server URL | `http://localhost:8000` |
| `GLITCHTIP_TOKEN` | API authentication token | `your-api-token` |

### Get API Token

1. Login to GlitchTip UI
2. Go to **Settings → API Tokens**
3. Create a new token with read/write permissions

### MCP Client Configuration

Add to your MCP config file:

```json
{
  "mcpServers": {
    "glitchtip": {
      "command": "node",
      "args": ["/path/to/glitchtip-mcp/index.js"],
      "env": {
        "GLITCHTIP_HOST": "http://localhost:8000",
        "GLITCHTIP_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Available Tools

| Tool | Description |
|------|-------------|
| `list_organizations` | List all accessible organizations |
| `list_projects` | List projects in an organization |
| `list_issues` | List issues/errors in a project |
| `get_issue` | Get detailed info about an issue |
| `get_latest_events` | Get recent error events |
| `list_issue_events` | List all events for an issue |
| `resolve_issue` | Mark an issue as resolved |

## Example Usage

Once connected, try these prompts:

- "What errors are in GlitchTip?"
- "Show me details of issue #123"
- "List events for issue 456"
- "Mark issue 789 as resolved"

## Why?

**Before:** You see error → Open GlitchTip UI → Copy error → Paste to AI → AI analyzes

**After:** You ask "What errors?" → AI queries directly → Analyzes → Fixes

## Credits

Inspired by [Sentry MCP](https://github.com/getsentry/sentry-mcp-stdio). This is an independent implementation for GlitchTip.

### Comparison with Sentry MCP

| Feature | Sentry MCP | glitchtip-mcp |
|---------|------------|---------------|
| `list_organizations` | ✅ | ✅ |
| `list_projects` | ✅ | ✅ |
| `list_project_issues` | ✅ | ✅ |
| `get_sentry_issue` | ✅ | ✅ |
| `get_sentry_event` | ✅ | ✅ |
| `list_issue_events` | ✅ | ✅ |
| `resolve_issue` | ❌ | ✅ |
| `resolve_short_id` | ✅ | ❌ |
| `create_project` | ✅ | ❌ |
| `list_organization_replays` | ✅ | ❌ (GlitchTip N/A) |
| Language | TypeScript | JavaScript |
| Backend | Sentry.io | GlitchTip (self-hosted) |

## License

MIT
