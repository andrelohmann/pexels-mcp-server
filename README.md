# Pexels MCP Server

Minimal MCP server that provides access to the Pexels API.

## Environment Variables

`PEXELS_API_KEY`
Get it from the Pexels developer portal: https://www.pexels.com/api/

## Devcontainer

1. Create a local env file:

```bash
cp .env.example .env
```

2. Add your API key:

```bash
PEXELS_API_KEY=your-pexels-api-key
```

3. Reopen the folder in the VS Code devcontainer.

The devcontainer installs dependencies automatically.

## Build and Test (Devcontainer)

```bash
npm run build
node build/index.js
```

Run a quick MCP tool call (local stdio):

```bash
npm run test:mcp
```

Run a quick MCP tool call that downloads a file:

```bash
npm run test:mcp:download
```

Optional overrides without `--` by setting env vars:

```bash
PEXELS_TEST_QUERY="mountains" PEXELS_TEST_DOWNLOAD_PATH="tmp" PEXELS_TEST_SIZE="medium" npm run test:mcp:download
```

Note: You may see a Node.js deprecation warning for `punycode`. This comes from a dependency and can be addressed during the dependency update task.

## Local Docker Build and Run

Test local image build:

```bash
docker build -t mcp-pexels:local .
```

Run the same test inside the Docker image:

```bash
npm run test:mcp:docker
```

Run the download test inside the Docker image:

```bash
npm run test:mcp:download:docker
```

Run the image locally:

```bash
docker run --rm -i \
  -v "$PWD:/workspace" \
  -w /workspace \
  -e PEXELS_API_KEY="${PEXELS_API_KEY}" \
  mcp-pexels:local
```

## Release Image (GHCR)

Push a semver tag starting with `v`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

Image name: `ghcr.io/andrelohmann/pexels-mcp-server`

## Codex config.toml

Example container entry (update image tag as needed):

```toml
[mcp_servers.pexels]
command = "docker"
args = [
  "run",
  "--rm",
  "-i",
  "--pull",
  "always",
  "-v",
  ".:/workspace",
  "-w",
  "/workspace",
  "-e",
  "PEXELS_API_KEY=${PEXELS_API_KEY}",
  "ghcr.io/andrelohmann/pexels-mcp-server:latest"
]
```

## License and Attribution

ISC License. This repository is a fork of `CaullenOmdahl/pexels-mcp-server` and retains the original license.

When using the Pexels API, you must follow their attribution requirements:

- Always show a prominent link to Pexels (e.g., "Photos provided by Pexels")
- Always credit photographers (e.g., "Photo by John Doe on Pexels")
