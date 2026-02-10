#!/usr/bin/env node
/**
 * GlitchTip MCP Server
 * A Model Context Protocol server for GlitchTip (Sentry-compatible error tracking)
 * 
 * Environment variables:
 *   GLITCHTIP_HOST - GlitchTip server URL (e.g., http://localhost:18000)
 *   GLITCHTIP_TOKEN - API authentication token
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const GLITCHTIP_HOST = process.env.GLITCHTIP_HOST || "http://localhost:18000";
const GLITCHTIP_TOKEN = process.env.GLITCHTIP_TOKEN;

if (!GLITCHTIP_TOKEN) {
  console.error("Error: GLITCHTIP_TOKEN environment variable is required");
  process.exit(1);
}

const server = new McpServer({
  name: "GlitchTip",
  version: "1.0.0",
});

// Helper function for API calls
async function glitchtipApi(endpoint, options = {}) {
  const url = `${GLITCHTIP_HOST}/api/0${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${GLITCHTIP_TOKEN}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  
  return response.json();
}

// Tool: List organizations
server.tool(
  "list_organizations",
  "List all accessible GlitchTip organizations",
  {},
  async () => {
    try {
      const orgs = await glitchtipApi("/organizations/");
      const output = orgs.map(o => `- ${o.name} (${o.slug})`).join("\n");
      return {
        content: [{ type: "text", text: `# Organizations\n\n${output}\n\nTotal: ${orgs.length}` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Tool: List projects
server.tool(
  "list_projects",
  "List projects in an organization",
  {
    organization_slug: z.string().describe("Organization slug"),
  },
  async ({ organization_slug }) => {
    try {
      const projects = await glitchtipApi(`/organizations/${organization_slug}/projects/`);
      const output = projects.map(p => `- **${p.name}** (${p.slug}) - ID: ${p.id}`).join("\n");
      return {
        content: [{ type: "text", text: `# Projects in ${organization_slug}\n\n${output}\n\nTotal: ${projects.length}` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Tool: List issues
server.tool(
  "list_issues",
  "List issues/errors in a project",
  {
    organization_slug: z.string().describe("Organization slug"),
    project_slug: z.string().describe("Project slug"),
    limit: z.number().default(10).describe("Max issues to return"),
  },
  async ({ organization_slug, project_slug, limit }) => {
    try {
      const issues = await glitchtipApi(
        `/projects/${organization_slug}/${project_slug}/issues/?limit=${limit}`
      );
      
      if (!issues.length) {
        return { content: [{ type: "text", text: "No issues found." }] };
      }
      
      const output = issues.map(i => 
        `### ${i.title}\n` +
        `- ID: ${i.id}\n` +
        `- Count: ${i.count}\n` +
        `- First seen: ${i.firstSeen}\n` +
        `- Last seen: ${i.lastSeen}\n`
      ).join("\n");
      
      return {
        content: [{ type: "text", text: `# Issues in ${project_slug}\n\n${output}` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Tool: Get issue details
server.tool(
  "get_issue",
  "Get detailed information about a specific issue",
  {
    issue_id: z.string().describe("Issue ID"),
  },
  async ({ issue_id }) => {
    try {
      const issue = await glitchtipApi(`/issues/${issue_id}/`);
      const events = await glitchtipApi(`/issues/${issue_id}/events/?limit=3`);
      
      let output = `# Issue: ${issue.title}\n\n`;
      output += `- **ID:** ${issue.id}\n`;
      output += `- **Type:** ${issue.type}\n`;
      output += `- **Count:** ${issue.count}\n`;
      output += `- **First seen:** ${issue.firstSeen}\n`;
      output += `- **Last seen:** ${issue.lastSeen}\n`;
      output += `- **Status:** ${issue.status}\n\n`;
      
      if (events.length) {
        output += `## Recent Events\n\n`;
        for (const event of events) {
          output += `### Event ${event.eventID}\n`;
          output += `- Time: ${event.dateCreated}\n`;
          if (event.message) output += `- Message: ${event.message}\n`;
          if (event.context) output += `- Context: \`\`\`json\n${JSON.stringify(event.context, null, 2)}\n\`\`\`\n`;
          output += "\n";
        }
      }
      
      return { content: [{ type: "text", text: output }] };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Tool: Get latest events
server.tool(
  "get_latest_events",
  "Get the most recent error events across all projects",
  {
    organization_slug: z.string().describe("Organization slug"),
    limit: z.number().default(5).describe("Max events to return"),
  },
  async ({ organization_slug, limit }) => {
    try {
      // GlitchTip may have different endpoint, try common ones
      let events;
      try {
        events = await glitchtipApi(`/organizations/${organization_slug}/events/?limit=${limit}`);
      } catch {
        // Fallback: get from first project
        const projects = await glitchtipApi(`/organizations/${organization_slug}/projects/`);
        if (!projects.length) {
          return { content: [{ type: "text", text: "No projects found." }] };
        }
        events = await glitchtipApi(
          `/projects/${organization_slug}/${projects[0].slug}/events/?limit=${limit}`
        );
      }
      
      if (!events.length) {
        return { content: [{ type: "text", text: "No recent events." }] };
      }
      
      const output = events.map(e => 
        `- **${e.title || e.message || 'Unknown'}**\n  Time: ${e.dateCreated}\n  ID: ${e.eventID}`
      ).join("\n\n");
      
      return {
        content: [{ type: "text", text: `# Latest Events\n\n${output}` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Tool: List issue events
server.tool(
  "list_issue_events",
  "List all events for a specific issue",
  {
    issue_id: z.string().describe("Issue ID"),
    limit: z.number().default(10).describe("Max events to return"),
  },
  async ({ issue_id, limit }) => {
    try {
      const events = await glitchtipApi(`/issues/${issue_id}/events/?limit=${limit}`);
      
      if (!events.length) {
        return { content: [{ type: "text", text: "No events found." }] };
      }
      
      const output = events.map((e, i) => 
        `### Event ${i + 1}\n` +
        `- ID: ${e.eventID}\n` +
        `- Time: ${e.dateCreated}\n` +
        (e.message ? `- Message: ${e.message}\n` : '') +
        (e.tags ? `- Tags: ${e.tags.map(t => `${t.key}=${t.value}`).join(', ')}\n` : '')
      ).join("\n");
      
      return {
        content: [{ type: "text", text: `# Events for Issue ${issue_id}\n\n${output}` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Tool: Resolve issue
server.tool(
  "resolve_issue",
  "Mark an issue as resolved",
  {
    issue_id: z.string().describe("Issue ID"),
  },
  async ({ issue_id }) => {
    try {
      await glitchtipApi(`/issues/${issue_id}/`, {
        method: "PUT",
        body: JSON.stringify({ status: "resolved" }),
      });
      return {
        content: [{ type: "text", text: `✅ Issue ${issue_id} marked as resolved.` }],
      };
    } catch (e) {
      return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("GlitchTip MCP server running");
}

main().catch(console.error);
