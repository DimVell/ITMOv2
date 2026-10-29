// Text search handler for MCP: search regex across text files under a whitelisted root
// Minimal dependencies, safe traversal with extension whitelist and path checks
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function repoRootFromHere() {
  // ESM-safe __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // .../.opencode/mcp/tools -> repo root 3 levels up from .opencode
  return path.resolve(__dirname, "../../../..");
}

function isSubpath(child, parent) {
  const rel = path.relative(parent, child);
  return !!rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

function* walk(dir, skipDirs) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skipDirs.has(e.name) || full.includes(`${path.sep}.git${path.sep}`)) continue;
      yield* walk(full, skipDirs);
    } else if (e.isFile()) {
      yield full;
    }
  }
}

function isAllowedExt(file, allow) {
  const ext = path.extname(file).toLowerCase();
  return allow.has(ext);
}

export async function textSearch(args) {
  const repoRoot = repoRootFromHere();
  let { root, pattern, flags = "", include_ext = [".md", ".py", ".js", ".ts", ".json", ".txt"], max_results = 100 } = args || {};

  if (typeof root !== "string" || !root) throw new Error("root is required");
  if (typeof pattern !== "string" || !pattern) throw new Error("pattern is required");
  if (typeof flags !== "string") throw new Error("flags must be string");
  if (typeof max_results !== "number" || max_results <= 0) throw new Error("max_results must be positive number");

  const absRoot = path.resolve(root);
  if (!isSubpath(absRoot, repoRoot)) {
    throw new Error("root is outside repository");
  }
  if (!fs.existsSync(absRoot) || !fs.statSync(absRoot).isDirectory()) {
    throw new Error("root is not a directory");
  }

  const allowSet = new Set(include_ext.map((e) => e.toLowerCase()));
  const skipDirs = new Set(["node_modules", ".git", ".venv", "__pycache__", ".mypy_cache", "dist", "build"]);

  let re;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    throw new Error(`invalid regex: ${e.message || e}`);
  }

  const matches = [];
  let filesScanned = 0;
  for (const file of walk(absRoot, skipDirs)) {
    if (!isAllowedExt(file, allowSet)) continue;
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue; // skip unreadable files
    }
    filesScanned++;
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (re.test(line)) {
        matches.push({ path: file, line: i + 1, text: line });
        if (matches.length >= max_results) break;
      }
      // reset lastIndex if global flag is used and line-by-line testing
      if (re.global) re.lastIndex = 0;
    }
    if (matches.length >= max_results) break;
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          root: absRoot,
          repoRoot,
          filesScanned,
          totalMatches: matches.length,
          matches
        }, null, 2)
      }
    ]
  };
}
