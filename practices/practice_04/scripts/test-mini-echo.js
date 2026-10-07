#!/usr/bin/env node
import { miniEcho } from "../../../.opencode/mcp/tools/mini-echo-handler.js";

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
  } else {
    console.error("unknown mode");
    process.exit(2);
  }
}

main();
