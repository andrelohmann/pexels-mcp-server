import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs";
import path from "node:path";
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
    "Usage: node scripts/test-mcp-download.mjs --query <text> [--download-path <path>] [--size <original|large2x|large|medium|small|portrait|landscape|tiny>]",
    "Example: node scripts/test-mcp-download.mjs --query \"mountains\" --download-path tmp --size medium"
  ].join("\n");
}

const apiKey = process.env.PEXELS_API_KEY;
if (!apiKey) {
  console.error("Missing PEXELS_API_KEY in environment.");
  console.error(usage());
  process.exit(1);
}

const query = getArg("--query", process.env.PEXELS_TEST_QUERY || "mountains");
const downloadPath = getArg(
  "--download-path",
  process.env.PEXELS_TEST_DOWNLOAD_PATH || "tmp"
);
const size = getArg("--size", process.env.PEXELS_TEST_SIZE || "original");

if (path.isAbsolute(downloadPath)) {
  console.error("download-path must be a relative path within the current workspace");
  process.exit(1);
}

const baseDir = process.cwd();
const targetDir = path.resolve(baseDir, downloadPath);
const baseReal = fs.realpathSync(baseDir);
if (targetDir !== baseReal && !targetDir.startsWith(`${baseReal}${path.sep}`)) {
  console.error("download-path resolves outside the current workspace");
  process.exit(1);
}

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

  const search = await client.callTool({
    name: "searchPhotos",
    arguments: { query, perPage: 1 }
  });

  let photoId;
  for (const content of search.content ?? []) {
    if (content.type === "text") {
      try {
        const data = JSON.parse(content.text);
        if (Array.isArray(data.photos) && data.photos[0]?.id) {
          photoId = data.photos[0].id;
          break;
        }
      } catch {
        // ignore non-JSON text
      }
    }
  }

  if (!photoId) {
    console.error("Could not find a photo ID from search response.");
    process.exit(1);
  }

  const download = await client.callTool({
    name: "downloadPhoto",
    arguments: { id: Number(photoId), size }
  });

  let downloadUrl;
  let suggestedFilename;
  for (const content of download.content ?? []) {
    if (content.type === "text") {
      const matchUrl = content.text.match(/Download Link \([^\)]+\):\s*(\S+)/);
      if (matchUrl) downloadUrl = matchUrl[1];
      const matchName = content.text.match(/Suggested Filename:\s*(\S+)/);
      if (matchName) suggestedFilename = matchName[1];
    }
  }

  if (!downloadUrl) {
    console.error("Could not extract download URL.");
    process.exit(1);
  }

  if (!suggestedFilename) {
    const urlPath = new URL(downloadUrl).pathname;
    suggestedFilename = path.basename(urlPath) || `pexels_${photoId}_${size}.jpg`;
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const targetReal = fs.realpathSync(targetDir);
  if (targetReal !== baseReal && !targetReal.startsWith(`${baseReal}${path.sep}`)) {
    console.error("download-path resolves outside the current workspace");
    process.exit(1);
  }

  const filePath = path.join(targetDir, suggestedFilename);
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    console.error(`Failed to download: ${response.status} ${response.statusText}`);
    process.exit(1);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  console.log(`Downloaded ${path.basename(filePath)}`);
} finally {
  await transport.close();
}
