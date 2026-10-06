#!/usr/bin/env node
// Minimal MCP server: one tool `mini_echo` that echoes input or errors on empty
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({ name: "mini-echo", version: "0.1.0" }, {
  tools: {
    mini_echo: {
      description: "Echo back the provided text; fails on empty input",
      inputSchema: {
        type: "object",
        properties: { text: { type: "string", description: "Text to echo" } },
        required: ["text"],
        additionalProperties: false
      },
      async handler(args) {
        const text = (args?.text ?? "").trim();
        if (!text) {
          throw new Error("empty text");
        }
        return { content: [{ type: "text", text }] };
      }
    }
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
