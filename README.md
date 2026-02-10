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
git clone https://github.com/FakeRocket543/glitchtip-mcp.git
cd glitchtip-mcp
npm install
```

## Configuration

### 1. Get API Token

GlitchTip API tokens can be created via Django shell:

```bash
docker exec -it <glitchtip-container> python manage.py shell -c "
from django.apps import apps
from django.contrib.auth import get_user_model
import secrets

APIToken = apps.get_model('api_tokens', 'APIToken')
User = get_user_model()
user = User.objects.first()
token = APIToken(user=user, token=secrets.token_hex(32), label='MCP')
token.scopes = 0xFFFFFFFF  # all permissions
token.save()
print(f'Token: {token.token}')
"
```

### 2. Add to MCP Client

**Claude Desktop** (`~/.config/claude/claude_desktop_config.json`):

**Cursor** (Settings → MCP):

**Kiro** (`.kiro/settings/mcp.json`):

```json
{
  "mcpServers": {
    "glitchtip": {
      "command": "node",
      "args": ["/absolute/path/to/glitchtip-mcp/index.js"],
      "env": {
        "GLITCHTIP_HOST": "http://localhost:8000",
        "GLITCHTIP_TOKEN": "your-api-token"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GLITCHTIP_HOST` | GlitchTip server URL | `http://localhost:8000` |
| `GLITCHTIP_TOKEN` | API authentication token | `abc123...` |

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

## Example Prompts

- "What errors are in GlitchTip?"
- "Show me details of issue #123"
- "List events for issue 456"
- "Mark issue 789 as resolved"

## Why?

**Before:** Error occurs → Open GlitchTip UI → Copy stack trace → Paste to AI → AI analyzes

**After:** Ask "What errors?" → AI queries directly → Analyzes → Fixes

## Credits

Inspired by [Sentry MCP](https://github.com/getsentry/sentry-mcp-stdio). This is an independent implementation for GlitchTip.

### Comparison with Sentry MCP

| Feature | Sentry MCP | glitchtip-mcp |
|---------|------------|---------------|
| `list_organizations` | ✅ | ✅ |
| `list_projects` | ✅ | ✅ |
| `list_project_issues` | ✅ | ✅ |
| `get_issue` | ✅ | ✅ |
| `get_event` | ✅ | ✅ |
| `list_issue_events` | ✅ | ✅ |
| `resolve_issue` | ❌ | ✅ |
| `resolve_short_id` | ✅ | ❌ |
| `create_project` | ✅ | ❌ |
| `list_replays` | ✅ | ❌ (GlitchTip N/A) |
| Language | TypeScript | JavaScript |
| Backend | Sentry.io | GlitchTip (self-hosted) |

## License

MIT
