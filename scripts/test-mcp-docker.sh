#!/usr/bin/env bash
set -euo pipefail

HOST_WORKSPACE="${HOST_WORKSPACE:-$(pwd -P)}"

docker run --rm -i --user 0:0 \
  -v "${HOST_WORKSPACE}:/workspace" \
  -w /opt/mcp \
  -e PEXELS_API_KEY="${PEXELS_API_KEY:-}" \
  mcp-pexels:local \
  node --input-type=module -e "import { Client } from '@modelcontextprotocol/sdk/client/index.js'; import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'; const client = new Client({ name: 'mcp-test', version: '1.0.0' }); const transport = new StdioClientTransport({ command: 'node', args: ['/opt/mcp/build/index.js'], cwd: '/workspace', env: { ...process.env, PEXELS_API_KEY: process.env.PEXELS_API_KEY } }); await client.connect(transport); const result = await client.callTool({ name: 'searchPhotos', arguments: { query: 'mountains', perPage: 1 } }); for (const content of result.content ?? []) { if (content.type === 'text') console.log(content.text); } await transport.close();"
