#!/usr/bin/env node

/**
 * fal.ai MCP Server
 *
 * A Model Context Protocol (MCP) server for interacting with fal.ai models and services.
 * Provides tools for model discovery, content generation, and file uploads.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

import { configureFalClient } from "./client.js";
import { listModels, searchModels, getModelSchema } from "./tools/models.js";
import { generate, getResult, getStatus, cancelRequest } from "./tools/generate.js";
import { uploadFile } from "./tools/storage.js";

// Server metadata
const SERVER_NAME = "fal.ai MCP Server";
const SERVER_VERSION = "1.0.0";

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "models",
    description: "List available models in the fal.ai model gallery. Supports optional filtering by category and pagination.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category to filter models (e.g., 'Animation', '3D', 'Image Generation')",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
          default: 1,
        },
        limit: {
          type: "number",
          description: "Number of models per page (default: 100, max: 100)",
          default: 100,
        },
      },
    },
  },
  {
    name: "search",
    description: "Search for models in the fal.ai gallery using keywords.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query string",
        },
        page: {
          type: "number",
          description: "Page number for pagination (default: 1)",
          default: 1,
        },
        limit: {
          type: "number",
          description: "Number of results per page (default: 50, max: 100)",
          default: 50,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "schema",
    description: "Get the input/output schema for a specific model. Returns JSON schema describing what parameters the model accepts and what it returns.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The model application ID (e.g., 'fal-ai/flux/dev')",
        },
      },
      required: ["app_id"],
    },
  },
  {
    name: "generate",
    description: "Submit a generation request to a fal.ai model. This queues the request and returns immediately with a request_id for tracking.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The model application ID (e.g., 'fal-ai/flux/dev')",
        },
        input_data: {
          type: "object",
          description: "Dictionary of input parameters for the model (model-specific)",
        },
        webhook_url: {
          type: "string",
          description: "Optional webhook URL for result notification",
        },
        output_format: {
          type: "string",
          enum: ["json", "binary"],
          description: "Output format (default: 'json')",
          default: "json",
        },
      },
      required: ["app_id", "input_data"],
    },
  },
  {
    name: "result",
    description: "Get the result of a generation request. Use the response_url from the generate() response.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The response_url returned from generate()",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "status",
    description: "Check the status of a generation request without fetching full results. Use the status_url from the generate() response.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The status_url returned from generate()",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "cancel",
    description: "Cancel a pending or processing generation request. Use the cancel_url from the generate() response.",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The cancel_url returned from generate()",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "upload",
    description: "Upload a file to fal.ai CDN for use with models. Returns a URL that can be used as input to generation requests.",
    inputSchema: {
      type: "object",
      properties: {
        file_path: {
          type: "string",
          description: "Path to the file to upload",
        },
        content_type: {
          type: "string",
          description: "Optional MIME type (auto-detected if not provided)",
        },
      },
      required: ["file_path"],
    },
  },
];

/**
 * Main server setup and execution
 */
async function main() {
  // Check for API key
  if (!process.env.FAL_KEY) {
    console.error("Error: FAL_KEY environment variable is not set.");
    console.error("Please set your fal.ai API key:");
    console.error("  export FAL_KEY='your-api-key-here'");
    console.error("\nOr configure it in your MCP client settings.");
    process.exit(1);
  }

  // Configure fal client
  try {
    configureFalClient();
  } catch (error) {
    console.error("Error configuring fal.ai client:", error);
    process.exit(1);
  }

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool list handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  // Register tool call handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      switch (name) {
        case "models": {
          const result = await listModels(
            args.category as string | undefined,
            (args.page as number) || 1,
            (args.limit as number) || 100
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "search": {
          if (!args.query) {
            throw new Error("query parameter is required");
          }
          const result = await searchModels(
            args.query as string,
            (args.page as number) || 1,
            (args.limit as number) || 50
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "schema": {
          if (!args.app_id) {
            throw new Error("app_id parameter is required");
          }
          const result = await getModelSchema(args.app_id as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "generate": {
          if (!args.app_id || !args.input_data) {
            throw new Error("app_id and input_data parameters are required");
          }
          const result = await generate({
            app_id: args.app_id as string,
            input_data: args.input_data as Record<string, any>,
            webhook_url: args.webhook_url as string | undefined,
            output_format: (args.output_format as "json" | "binary") || "json",
          });
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "result": {
          if (!args.url) {
            throw new Error("url parameter is required");
          }
          const result = await getResult(args.url as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "status": {
          if (!args.url) {
            throw new Error("url parameter is required");
          }
          const result = await getStatus(args.url as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "cancel": {
          if (!args.url) {
            throw new Error("url parameter is required");
          }
          const result = await cancelRequest(args.url as string);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "upload": {
          if (!args.file_path) {
            throw new Error("file_path parameter is required");
          }
          const result = await uploadFile(
            args.file_path as string,
            args.content_type as string | undefined
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: errorMessage }, null, 2),
          },
        ],
        isError: true,
      };
    }
  });

  // Start server with stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

// Run the server
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
