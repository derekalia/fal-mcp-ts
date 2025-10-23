# fal.ai MCP Server

A Model Context Protocol (MCP) server for interacting with [fal.ai](https://fal.ai) models and services. This server enables Claude Desktop and other MCP clients to discover, search, and generate content using fal.ai's powerful AI models.

## Features

- **Model Discovery**: List and search through fal.ai's model gallery
- **Schema Inspection**: Get detailed input/output schemas for any model
- **Content Generation**: Generate images, videos, and other content using AI models
- **Queue Management**: Track generation status, retrieve results, and cancel requests
- **File Upload**: Upload files to fal.ai CDN for use with models
- **Full TypeScript Support**: Type-safe API with comprehensive TypeScript definitions

## Installation

### Via npm (Recommended)

\`\`\`bash
npm install -g @derekalia/fal-mcp-server
\`\`\`

### From Source

\`\`\`bash
git clone https://github.com/derekalia/fal-mcp-ts
cd fal-mcp-ts
npm install
npm run build
npm link
\`\`\`

## Configuration

### Get Your API Key

1. Sign up at [fal.ai](https://fal.ai)
2. Navigate to your [API keys page](https://fal.ai/dashboard/keys)
3. Create a new API key

### Configure MCP Client

Add the server to your MCP client configuration. The API key should be provided via environment variables.

#### Claude Desktop

Add to your Claude Desktop config file:

- **macOS**: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
- **Windows**: \`%APPDATA%\\Claude\\claude_desktop_config.json\`

\`\`\`json
{
  "mcpServers": {
    "fal": {
      "command": "npx",
      "args": ["-y", "@derekalia/fal-mcp-server"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
\`\`\`

#### Cursor

Add to \`~/.cursor/mcp.json\`:

\`\`\`json
{
  "mcpServers": {
    "fal": {
      "command": "npx",
      "args": ["-y", "@derekalia/fal-mcp-server"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
\`\`\`

#### Other MCP Clients

For other MCP clients, use the command:

\`\`\`bash
FAL_KEY="your-api-key" npx -y @derekalia/fal-mcp-server
\`\`\`

## Available Tools

### \`models\`

List available models in the fal.ai model gallery.

**Parameters:**
- \`category\` (optional): Filter by category (e.g., "Animation", "3D", "Image Generation")
- \`page\` (optional): Page number for pagination (default: 1)
- \`limit\` (optional): Models per page (default: 100, max: 100)

**Example:**
\`\`\`javascript
{
  "category": "Image Generation",
  "page": 1,
  "limit": 50
}
\`\`\`

### \`search\`

Search for models by keywords.

**Parameters:**
- \`query\` (required): Search query string
- \`page\` (optional): Page number (default: 1)
- \`limit\` (optional): Results per page (default: 50, max: 100)

**Example:**
\`\`\`javascript
{
  "query": "flux image generation",
  "limit": 20
}
\`\`\`

### \`schema\`

Get the input/output schema for a specific model.

**Parameters:**
- \`app_id\` (required): Model application ID (e.g., "fal-ai/flux/dev")

**Example:**
\`\`\`javascript
{
  "app_id": "fal-ai/flux/dev"
}
\`\`\`

### \`generate\`

Submit a generation request to a fal.ai model.

**Parameters:**
- \`app_id\` (required): Model application ID
- \`input_data\` (required): Model-specific input parameters
- \`webhook_url\` (optional): Webhook for result notification
- \`output_format\` (optional): "json" or "binary" (default: "json")

**Example:**
\`\`\`javascript
{
  "app_id": "fal-ai/flux/dev",
  "input_data": {
    "prompt": "A beautiful sunset over mountains",
    "image_size": "landscape_4_3",
    "num_inference_steps": 28
  }
}
\`\`\`

### \`result\`

Get the result of a generation request.

**Parameters:**
- \`app_id\` (required): Model application ID
- \`request_id\` (required): Request ID from \`generate()\`

**Example:**
\`\`\`javascript
{
  "app_id": "fal-ai/flux/dev",
  "request_id": "abc123-def456-ghi789"
}
\`\`\`

### \`status\`

Check the status of a generation request without fetching full results.

**Parameters:**
- \`app_id\` (required): Model application ID
- \`request_id\` (required): Request ID to check

**Example:**
\`\`\`javascript
{
  "app_id": "fal-ai/flux/dev",
  "request_id": "abc123-def456-ghi789"
}
\`\`\`

### \`cancel\`

Cancel a pending or processing generation request.

**Parameters:**
- \`app_id\` (required): Model application ID
- \`request_id\` (required): Request ID to cancel

**Example:**
\`\`\`javascript
{
  "app_id": "fal-ai/flux/dev",
  "request_id": "abc123-def456-ghi789"
}
\`\`\`

### \`upload\`

Upload a file to fal.ai CDN for use with models.

**Parameters:**
- \`file_path\` (required): Path to the file to upload
- \`content_type\` (optional): MIME type (auto-detected if not provided)

**Example:**
\`\`\`javascript
{
  "file_path": "/path/to/image.png"
}
\`\`\`

## Usage Examples

### With Claude Desktop

Once configured, you can use natural language to interact with fal.ai:

> "Search for flux models"

> "Generate an image of a cat wearing a hat using fal-ai/flux/dev"

> "Check the status of my last generation request"

> "Upload this image to fal.ai CDN: /path/to/image.png"

### Programmatic Usage

You can also use the server programmatically:

\`\`\`typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// ... server setup
\`\`\`

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn
- fal.ai API key

### Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/derekalia/fal-mcp-ts
cd fal-mcp-ts

# Install dependencies
npm install

# Build
npm run build

# Run in development mode with watch
npm run watch
\`\`\`

### Project Structure

\`\`\`
fal-mcp-ts/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── client.ts          # Fal.ai client wrapper
│   └── tools/
│       ├── models.ts      # Model discovery tools
│       ├── generate.ts    # Generation and queue tools
│       └── storage.ts     # File upload tools
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## Troubleshooting

### "FAL_KEY environment variable is not set"

Make sure you've set the \`FAL_KEY\` in your MCP client configuration. The API key must be set as an environment variable.

### "HTTP 401" or "Unauthorized"

Your API key may be invalid or expired. Check your API key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys).

### Build Errors

Try removing \`node_modules\` and reinstalling:

\`\`\`bash
rm -rf node_modules package-lock.json
npm install
npm run build
\`\`\`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Credits

This project was inspired by the [Python fal MCP server](https://github.com/am0y/mcp-fal) and built using:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP TypeScript SDK
- [@fal-ai/client](https://github.com/fal-ai/fal-js) - Official fal.ai TypeScript client

## Links

- [fal.ai](https://fal.ai) - AI model platform
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP documentation
- [Claude Desktop](https://claude.ai/desktop) - Claude Desktop app
