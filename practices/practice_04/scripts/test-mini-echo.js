#!/usr/bin/env node
import { miniEcho } from "../../../.opencode/mcp/tools/mini-echo-handler.js";
import { textSearch } from "../../../.opencode/mcp/tools/text-search.js";
import path from "path";
import { fileURLToPath } from "url";

const mode = process.argv[2] || "success";

async function main() {
  if (mode === "success") {
    const res = await miniEcho({ text: "hello" });
    console.log(JSON.stringify(res, null, 2));
  } else if (mode === "error") {
    try {
      await miniEcho({ text: "" });
    } catch (e) {
      console.log(String(e.message || e));
      process.exit(0);
    }
    process.exit(1);
  } else if (mode === "search") {
    // Example: search for 'subscribe' case-insensitive inside the demo dir
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const repoRoot = path.resolve(__dirname, "../../../");
    const root = path.join(repoRoot, "practices/practice_03/lab/demo");
    const res = await textSearch({ root, pattern: "subscribe", flags: "i", include_ext: [".py", ".md"], max_results: 50 });
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.error("unknown mode");
    process.exit(2);
  }
}

main();
