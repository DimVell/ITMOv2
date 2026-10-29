#!/usr/bin/env node
// Minimal MCP server: one tool `mini_echo` that echoes input or errors on empty
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { miniEcho } from "./tools/mini-echo-handler.js";
import { textSearch } from "./tools/text-search.js";

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
        return miniEcho(args);
      }
    }
    ,
    text_search: {
      description: "Search text files under a given root for a regex pattern (safe, whitelisted extensions)",
      inputSchema: {
        type: "object",
        properties: {
          root: { type: "string", description: "Absolute path inside repository to search under" },
          pattern: { type: "string", description: "JavaScript regex pattern (no slashes)" },
          flags: { type: "string", description: "Regex flags, e.g. i, m, g", default: "" },
          include_ext: {
            type: "array",
            description: "List of allowed file extensions",
            items: { type: "string" },
            default: [".md", ".py", ".js", ".ts", ".json", ".txt"]
          },
          max_results: { type: "number", description: "Stop after N matches", default: 100 }
        },
        required: ["root", "pattern"],
        additionalProperties: false
      },
      async handler(args) {
        return textSearch(args);
      }
    }
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
