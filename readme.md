# fal.ai MCP Server

A Model Context Protocol (MCP) server for interacting with [fal.ai](https://fal.ai) models and services. This server enables Claude Desktop and other MCP clients to discover, search, and generate content using fal.ai's powerful AI models.

## Features

- **Model Discovery**: List and search through fal.ai's model gallery using Platform API v1
- **Advanced Search**: Free-text search with filtering by category, status, and more
- **Model Lookup**: Find specific models by endpoint ID with optional schema expansion
- **Pricing Information**: Get real-time pricing for models (output-based or GPU-based)
- **Cost Estimation**: Estimate costs using historical API pricing or unit pricing
- **Usage Tracking**: Get detailed billing usage records with time-series data
- **Analytics**: Track request counts, latency statistics, and success/error rates
- **Schema Inspection**: Get detailed input/output schemas with inline OpenAPI expansion
- **Content Generation**: Generate images, videos, and other content using AI models
- **Queue Management**: Track generation status, retrieve results, and cancel requests
- **File Upload**: Upload files to fal.ai CDN for use with models
- **Full TypeScript Support**: Type-safe API with comprehensive TypeScript definitions
- **Cursor-based Pagination**: Efficient pagination through large result sets

## Installation

### Via npm (Recommended)

```bash
npm install -g fal-ai-mcp-server
```

### From Source

```bash
git clone https://github.com/derekalia/fal-mcp-ts
cd fal-mcp-ts
npm install
npm run build
npm link
```

## Configuration

### Get Your API Key

1. Sign up at [fal.ai](https://fal.ai)
2. Navigate to your [API keys page](https://fal.ai/dashboard/keys)
3. Create a new API key

### Configure MCP Client

Add the server to your MCP client configuration. The API key should be provided via environment variables.

#### Claude Desktop

Add to your Claude Desktop config file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fal": {
      "command": "npx",
      "args": ["-y", "fal-ai-mcp-server"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
```

#### Claude Code

For project-specific configuration, create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "fal": {
      "command": "npx",
      "args": ["-y", "fal-ai-mcp-server@latest"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
```

**Using `@latest` ensures you always get the newest version automatically!**

**Security Note:** Never commit `.mcp.json` files containing API keys to version control. Add it to your `.gitignore` file.

#### Cursor

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "fal": {
      "command": "npx",
      "args": ["-y", "fal-ai-mcp-server"],
      "env": {
        "FAL_KEY": "your-fal-api-key-here"
      }
    }
  }
}
```

#### Other MCP Clients

For other MCP clients, use the command:

```bash
FAL_KEY="your-api-key" npx -y fal-ai-mcp-server
```

## Available Tools

### `models`

List available models in the fal.ai model gallery using the Platform API v1.

**Parameters:**
- `category` (optional): Filter by category (e.g., "text-to-image", "image-to-video", "training")
- `cursor` (optional): Pagination cursor from previous response
- `limit` (optional): Models per page (default: 100, max: 100)
- `status` (optional): Filter by status - "active" or "deprecated"
- `expand` (optional): Array of fields to expand. Supported: ["openapi-3.0"] to include full OpenAPI schema

**Example:**
```javascript
{
  "category": "text-to-image",
  "status": "active",
  "limit": 50,
  "expand": ["openapi-3.0"]
}
```

### `search`

Search for models using free-text query across name, description, and category.

**Parameters:**
- `query` (required): Free-text search query
- `cursor` (optional): Pagination cursor from previous response
- `limit` (optional): Results per page (default: 50, max: 100)
- `category` (optional): Filter by category
- `status` (optional): Filter by status - "active" or "deprecated"
- `expand` (optional): Array of fields to expand. Supported: ["openapi-3.0"]

**Example:**
```javascript
{
  "query": "flux image generation",
  "status": "active",
  "limit": 20
}
```

### `find`

Find specific model(s) by endpoint ID. Can retrieve single or multiple models.

**Parameters:**
- `endpoint_ids` (required): Array of endpoint IDs (1-50 models)
- `expand` (optional): Array of fields to expand. Supported: ["openapi-3.0"]

**Example:**
```javascript
{
  "endpoint_ids": ["fal-ai/flux/dev", "fal-ai/flux-pro"],
  "expand": ["openapi-3.0"]
}
```

### `schema`

Get the input/output schema for a specific model.

**Parameters:**
- `app_id` (required): Model application ID (e.g., "fal-ai/flux/dev")

**Example:**
```javascript
{
  "app_id": "fal-ai/flux/dev"
}
```

### `generate`

Submit a generation request to a fal.ai model.

**Parameters:**
- `app_id` (required): Model application ID
- `input_data` (required): Model-specific input parameters
- `webhook_url` (optional): Webhook for result notification
- `output_format` (optional): "json" or "binary" (default: "json")

**Example:**
```javascript
{
  "app_id": "fal-ai/flux/dev",
  "input_data": {
    "prompt": "A beautiful sunset over mountains",
    "image_size": "landscape_4_3",
    "num_inference_steps": 28
  }
}
```

### `result`

Get the result of a generation request.

**Parameters:**
- `app_id` (required): Model application ID
- `request_id` (required): Request ID from `generate()`

**Example:**
```javascript
{
  "app_id": "fal-ai/flux/dev",
  "request_id": "abc123-def456-ghi789"
}
```

### `status`

Check the status of a generation request without fetching full results.

**Parameters:**
- `app_id` (required): Model application ID
- `request_id` (required): Request ID to check

**Example:**
```javascript
{
  "app_id": "fal-ai/flux/dev",
  "request_id": "abc123-def456-ghi789"
}
```

### `cancel`

Cancel a pending or processing generation request.

**Parameters:**
- `app_id` (required): Model application ID
- `request_id` (required): Request ID to cancel

**Example:**
```javascript
{
  "app_id": "fal-ai/flux/dev",
  "request_id": "abc123-def456-ghi789"
}
```

### `upload`

Upload a file to fal.ai CDN for use with models.

**Parameters:**
- `file_path` (required): Path to the file to upload
- `content_type` (optional): MIME type (auto-detected if not provided)

**Example:**
```javascript
{
  "file_path": "/path/to/image.png"
}
```

### `pricing`

Get pricing information for specific model endpoint(s). Requires authentication.

**Parameters:**
- `endpoint_ids` (required): Array of endpoint IDs to get pricing for (1-50 models)
- `cursor` (optional): Pagination cursor from previous response

**Example:**
```javascript
{
  "endpoint_ids": ["fal-ai/flux/dev", "fal-ai/flux-pro"]
}
```

**Response:**
```javascript
{
  "prices": [
    {
      "endpoint_id": "fal-ai/flux/dev",
      "unit_price": 0.025,
      "unit": "image",
      "currency": "USD"
    }
  ],
  "next_cursor": null,
  "has_more": false
}
```

### `estimate_cost`

Estimate costs for model operations. Requires authentication. Useful for budget planning and cost optimization.

**Estimation Methods:**

1. **Historical API Price** (`historical_api_price`):
   - Based on historical pricing per API call from past usage patterns
   - Use when you know the number of API calls you'll make
   - Example: "How much will 100 calls to flux/dev cost?"

2. **Unit Price** (`unit_price`):
   - Based on unit price × expected billing units (images, videos, etc.)
   - Use when you know the expected output quantity
   - Example: "How much will 50 images from flux/dev cost?"

**Parameters:**
- `estimate_type` (required): Either "historical_api_price" or "unit_price"
- `endpoints` (required): Map of endpoint IDs to quantities

**Example - Historical API Price:**
```javascript
{
  "estimate_type": "historical_api_price",
  "endpoints": {
    "fal-ai/flux/dev": {
      "call_quantity": 100
    },
    "fal-ai/flux/schnell": {
      "call_quantity": 50
    }
  }
}
```

**Example - Unit Price:**
```javascript
{
  "estimate_type": "unit_price",
  "endpoints": {
    "fal-ai/flux/dev": {
      "unit_quantity": 50
    },
    "fal-ai/flux-pro": {
      "unit_quantity": 25
    }
  }
}
```

**Response:**
```javascript
{
  "estimate_type": "unit_price",
  "total_cost": 1.88,
  "currency": "USD"
}
```

### `usage`

Get usage records for your workspace with detailed billing information. Returns time-series data and/or summary statistics with unit quantities and prices. Requires authentication.

**Parameters:**
- `endpoint_ids` (required): Array of endpoint IDs to get usage for (1-50 models)
- `start` (optional): Start date in ISO8601 format (e.g., "2025-01-01" or "2025-01-01T00:00:00Z"). Defaults to 24 hours ago
- `end` (optional): End date in ISO8601 format. Defaults to current time
- `timeframe` (optional): Aggregation timeframe - "minute", "hour", "day", "week", or "month". Auto-detected if not specified
- `timezone` (optional): Timezone for date aggregation (e.g., "UTC", "America/New_York"). Defaults to "UTC"
- `bound_to_timeframe` (optional): Whether to align start/end dates to timeframe boundaries. Defaults to true
- `expand` (optional): Array of data to include - "time_series", "summary", "auth_method". Defaults to ["time_series"]
- `cursor` (optional): Pagination cursor from previous response
- `limit` (optional): Maximum number of items to return

**Example:**
```javascript
{
  "endpoint_ids": ["fal-ai/flux/dev", "fal-ai/nano-banana"],
  "start": "2025-10-01",
  "end": "2025-10-31",
  "timeframe": "day",
  "expand": ["time_series", "summary"]
}
```

**Response:**
```javascript
{
  "time_series": [
    {
      "bucket": "2025-10-23T00:00:00+00:00",
      "results": [
        {
          "endpoint_id": "fal-ai/flux/dev",
          "unit": "shared_gateway_request",
          "quantity": 8,
          "unit_price": 0.025
        }
      ]
    }
  ],
  "summary": [
    {
      "endpoint_id": "fal-ai/flux/dev",
      "unit": "shared_gateway_request",
      "quantity": 15,
      "unit_price": 0.025
    }
  ]
}
```

### `analytics`

Get analytics data for model endpoints with time-bucketed metrics. Returns request counts, latency statistics (avg, p50, p95, p99), and success/error rates. Requires authentication.

**Parameters:**
- `endpoint_ids` (required): Array of endpoint IDs to get analytics for (1-50 models)
- `start` (optional): Start date in ISO8601 format. Defaults to 24 hours ago
- `end` (optional): End date in ISO8601 format. Defaults to current time
- `timeframe` (optional): Time bucket size - "hour", "day", "week", or "month". Auto-detected if not specified
- `timezone` (optional): Timezone for date aggregation. Defaults to "UTC"
- `bound_to_timeframe` (optional): Whether to align start/end dates to timeframe boundaries. Defaults to true
- `metric` (optional): Filter to return only specific metric - "total_requests", "successful_requests", "failed_requests", or "avg_latency_ms"
- `cursor` (optional): Pagination cursor from previous response
- `limit` (optional): Maximum number of items to return

**Example:**
```javascript
{
  "endpoint_ids": ["fal-ai/flux/dev"],
  "start": "2025-10-01",
  "timeframe": "day"
}
```

**Response:**
```javascript
{
  "time_series": [
    {
      "bucket": "2025-10-23T00:00:00+00:00",
      "results": [
        {
          "endpoint_id": "fal-ai/flux/dev",
          "request_count": 19
        }
      ]
    }
  ]
}
```

## Usage Examples

### With Claude Desktop

Once configured, you can use natural language to interact with fal.ai:

**Model Discovery:**
> "Search for active flux models"

> "Find the model details for fal-ai/flux/dev"

**Pricing & Cost Management:**
> "Get pricing information for fal-ai/flux/dev and fal-ai/flux-pro"

> "Estimate the cost of generating 50 images using fal-ai/flux/dev"

> "How much would 100 API calls to flux/dev cost based on historical pricing?"

**Usage & Analytics:**
> "Show me my usage for fal-ai/nano-banana in the last 2 weeks"

> "Get analytics for fal-ai/flux/dev for the past month"

> "What's my total spending on flux/dev this month?"

**Content Generation:**
> "Generate an image of a cat wearing a hat using fal-ai/flux/dev"

> "Check the status of my last generation request"

> "Upload this image to fal.ai CDN: /path/to/image.png"

### Programmatic Usage

You can also use the server programmatically:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// ... server setup
```

## Development

### Prerequisites

- Node.js 18 or later
- npm or yarn
- fal.ai API key

### Setup

```bash
# Clone the repository
git clone https://github.com/derekalia/fal-mcp-ts
cd fal-mcp-ts

# Install dependencies
npm install

# Build
npm run build

# Run in development mode with watch
npm run watch
```

### Project Structure

```
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
```

## Troubleshooting

### "FAL_KEY environment variable is not set"

Make sure you've set the `FAL_KEY` in your MCP client configuration. The API key must be set as an environment variable.

### "HTTP 401" or "Unauthorized"

Your API key may be invalid or expired. Check your API key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys).

### Build Errors

Try removing `node_modules` and reinstalling:

```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

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
