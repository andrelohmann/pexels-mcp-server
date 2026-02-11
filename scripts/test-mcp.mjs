import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import process from "node:process";

function getArg(flag, fallback) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return fallback;
  const value = process.argv[idx + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function usage() {
  return [
    "Usage: node scripts/test-mcp.mjs --query <text> [--per-page <n>] [--page <n>] [--orientation <landscape|portrait|square>] [--size <large|medium|small>] [--color <color>]",
    "Example: node scripts/test-mcp.mjs --query \"mountains\" --per-page 1"
  ].join("\n");
}

const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  console.error("Missing PEXELS_API_KEY in environment.");
  console.error(usage());
  process.exit(1);
}

const query = getArg("--query", "mountains");
const perPageRaw = getArg("--per-page", "1");
const pageRaw = getArg("--page", "");
const orientation = getArg("--orientation", "");
const size = getArg("--size", "");
const color = getArg("--color", "");

const toolArgs = { query };
if (perPageRaw) {
  const perPage = Number(perPageRaw);
  if (!Number.isFinite(perPage)) {
    console.error("Invalid --per-page value.");
    process.exit(1);
  }
  toolArgs.perPage = perPage;
}
if (pageRaw) {
  const page = Number(pageRaw);
  if (!Number.isFinite(page)) {
    console.error("Invalid --page value.");
    process.exit(1);
  }
  toolArgs.page = page;
}
if (orientation) toolArgs.orientation = orientation;
if (size) toolArgs.size = size;
if (color) toolArgs.color = color;

const client = new Client({ name: "mcp-pexels-test", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["build/index.js"],
  env: {
    ...process.env,
    PEXELS_API_KEY: apiKey
  }
});

try {
  await client.connect(transport);
  const result = await client.callTool({
    name: "searchPhotos",
    arguments: toolArgs
  });

  for (const content of result.content ?? []) {
    if (content.type === "text") {
      console.log(content.text);
    } else {
      console.log(JSON.stringify(content, null, 2));
    }
  }
} finally {
  await transport.close();
}
