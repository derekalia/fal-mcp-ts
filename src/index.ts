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
import { listModels, searchModels, findModels, getPricing, estimateCost, getUsage, getAnalytics } from "./tools/models.js";
import { generate, getResult, getStatus, cancelRequest } from "./tools/generate.js";
import { uploadFile } from "./tools/storage.js";

// Server metadata
const SERVER_NAME = "fal.ai MCP Server";
const SERVER_VERSION = "2.1.1";

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "models",
    description: "List available models in the fal.ai model gallery. Supports optional filtering by category, status, and cursor-based pagination. Can expand OpenAPI schemas inline with expand parameter.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Optional category to filter models (e.g., 'text-to-image', 'image-to-video', 'training')",
        },
        cursor: {
          type: "string",
          description: "Pagination cursor from previous response (for next page)",
        },
        limit: {
          type: "number",
          description: "Number of models per page (default: 100, max: 100)",
          default: 100,
        },
        status: {
          type: "string",
          enum: ["active", "deprecated"],
          description: "Filter by model status - 'active' or 'deprecated' (omit to include all)",
        },
        expand: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Fields to expand in response. Supported: 'openapi-3.0' (includes full OpenAPI schema)",
        },
      },
    },
  },
  {
    name: "search",
    description: "Search for models in the fal.ai gallery using free-text query across name, description, and category. Supports filtering and cursor-based pagination.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Free-text search query (searches name, description, category)",
        },
        cursor: {
          type: "string",
          description: "Pagination cursor from previous response (for next page)",
        },
        limit: {
          type: "number",
          description: "Number of results per page (default: 50, max: 100)",
          default: 50,
        },
        category: {
          type: "string",
          description: "Optional category to filter results (e.g., 'text-to-image', 'image-to-video')",
        },
        status: {
          type: "string",
          enum: ["active", "deprecated"],
          description: "Filter by model status - 'active' or 'deprecated' (omit to include all)",
        },
        expand: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Fields to expand in response. Supported: 'openapi-3.0' (includes full OpenAPI schema)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "find",
    description: "Find specific model(s) by endpoint ID. Can retrieve single or multiple models (1-50). Useful for looking up exact models by their stable identifiers.",
    inputSchema: {
      type: "object",
      properties: {
        endpoint_ids: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Endpoint ID(s) to retrieve (e.g., ['fal-ai/flux/dev', 'fal-ai/flux-pro']). Can specify 1-50 models.",
        },
        expand: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Fields to expand in response. Supported: 'openapi-3.0' (includes full OpenAPI schema)",
        },
      },
      required: ["endpoint_ids"],
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
    description: "Get the result of a generation request.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The model application ID used for generation",
        },
        request_id: {
          type: "string",
          description: "The request_id returned from generate()",
        },
      },
      required: ["app_id", "request_id"],
    },
  },
  {
    name: "status",
    description: "Check the status of a generation request without fetching full results.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The model application ID",
        },
        request_id: {
          type: "string",
          description: "The request_id to check",
        },
      },
      required: ["app_id", "request_id"],
    },
  },
  {
    name: "cancel",
    description: "Cancel a pending or processing generation request.",
    inputSchema: {
      type: "object",
      properties: {
        app_id: {
          type: "string",
          description: "The model application ID",
        },
        request_id: {
          type: "string",
          description: "The request_id to cancel",
        },
      },
      required: ["app_id", "request_id"],
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
  {
    name: "pricing",
    description: "Get pricing information for specific model endpoint(s). Returns unit pricing with currency. Requires authentication. Most models use output-based pricing (per image/video).",
    inputSchema: {
      type: "object",
      properties: {
        endpoint_ids: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Endpoint ID(s) to get pricing for (e.g., ['fal-ai/flux/dev']). Must provide at least 1 endpoint ID (1-50 models).",
        },
        cursor: {
          type: "string",
          description: "Pagination cursor from previous response (for next page)",
        },
      },
      required: ["endpoint_ids"],
    },
  },
  {
    name: "estimate_cost",
    description: "Estimate costs for model operations using historical API pricing or unit pricing. Requires authentication. Useful for budget planning and cost optimization.",
    inputSchema: {
      type: "object",
      properties: {
        estimate_type: {
          type: "string",
          enum: ["historical_api_price", "unit_price"],
          description: "Estimation method: 'historical_api_price' (based on API call history) or 'unit_price' (based on billing units like images/videos)",
        },
        endpoints: {
          type: "object",
          description: "Map of endpoint IDs to quantities. For 'historical_api_price': use {endpoint_id: {call_quantity: number}}. For 'unit_price': use {endpoint_id: {unit_quantity: number}}",
          additionalProperties: {
            type: "object",
          },
        },
      },
      required: ["estimate_type", "endpoints"],
    },
  },
  {
    name: "usage",
    description: "Get usage records for workspace with detailed billing information. Returns time series data and/or summary statistics with unit quantities and prices. Requires authentication.",
    inputSchema: {
      type: "object",
      properties: {
        endpoint_ids: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Endpoint ID(s) to get usage for (e.g., ['fal-ai/flux/dev']). Must provide at least 1 endpoint ID (1-50 models).",
        },
        start: {
          type: "string",
          description: "Start date in ISO8601 format (e.g., '2025-01-01T00:00:00Z' or '2025-01-01'). Defaults to 24 hours ago.",
        },
        end: {
          type: "string",
          description: "End date in ISO8601 format (e.g., '2025-01-31T23:59:59Z' or '2025-01-31'). Defaults to current time.",
        },
        timezone: {
          type: "string",
          description: "Timezone for date aggregation (e.g., 'UTC', 'America/New_York'). Defaults to 'UTC'.",
          default: "UTC",
        },
        timeframe: {
          type: "string",
          enum: ["minute", "hour", "day", "week", "month"],
          description: "Aggregation timeframe for timeseries data. Auto-detected from date range if not specified.",
        },
        bound_to_timeframe: {
          type: "boolean",
          description: "Whether to align start/end dates to timeframe boundaries. Defaults to true.",
          default: true,
        },
        expand: {
          type: "array",
          items: {
            type: "string",
            enum: ["time_series", "summary", "auth_method"],
          },
          description: "Data to include: 'time_series' for time-bucketed data, 'summary' for aggregates, 'auth_method' for auth tracking. Defaults to ['time_series'].",
        },
        cursor: {
          type: "string",
          description: "Pagination cursor from previous response.",
        },
        limit: {
          type: "number",
          description: "Maximum number of items to return.",
        },
      },
      required: ["endpoint_ids"],
    },
  },
  {
    name: "analytics",
    description: "Get analytics data for model endpoints with time-bucketed metrics. Returns request counts, latency statistics (avg, p50, p95, p99), and success/error rates. Requires authentication.",
    inputSchema: {
      type: "object",
      properties: {
        endpoint_ids: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Endpoint ID(s) to get analytics for (e.g., ['fal-ai/flux/dev']). Must provide at least 1, maximum 50 endpoint IDs.",
        },
        start: {
          type: "string",
          description: "Start date in ISO8601 format (e.g., '2025-01-01T00:00:00Z' or '2025-01-01'). Defaults to 24 hours ago.",
        },
        end: {
          type: "string",
          description: "End date in ISO8601 format (e.g., '2025-01-31T23:59:59Z' or '2025-01-31'). Defaults to current time.",
        },
        timezone: {
          type: "string",
          description: "Timezone for date aggregation (e.g., 'UTC', 'America/New_York'). Defaults to 'UTC'.",
          default: "UTC",
        },
        timeframe: {
          type: "string",
          enum: ["hour", "day", "week", "month"],
          description: "Time bucket size for aggregation. Auto-detected from date range if not specified.",
        },
        bound_to_timeframe: {
          type: "boolean",
          description: "Whether to align start/end dates to timeframe boundaries. Defaults to true.",
          default: true,
        },
        metric: {
          type: "string",
          enum: ["total_requests", "successful_requests", "failed_requests", "avg_latency_ms"],
          description: "Optional: Filter to return only specific metric in response.",
        },
        cursor: {
          type: "string",
          description: "Pagination cursor from previous response.",
        },
        limit: {
          type: "number",
          description: "Maximum number of items to return.",
        },
      },
      required: ["endpoint_ids"],
    },
  },
];

/**
 * Main server setup and execution
 */
async function main() {
  // Check for API key - warn if missing but don't fail
  // Platform API v1 works without auth (but with rate limits)
  if (!process.env.FAL_KEY) {
    console.error("Warning: FAL_KEY environment variable is not set.");
    console.error("Some features (pricing, cost estimation, generation) require authentication.");
    console.error("Model discovery and search will work with rate limits.");
    console.error("\nTo enable all features, set your fal.ai API key in your MCP client settings.");
  } else {
    // Configure fal client only if key is available
    try {
      configureFalClient();
    } catch (error) {
      console.error("Warning: Error configuring fal.ai client:", error);
      console.error("Continuing with limited functionality...");
    }
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
            args.cursor as string | undefined,
            (args.limit as number) || 100,
            args.status as "active" | "deprecated" | undefined,
            args.expand as string[] | undefined
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
            args.cursor as string | undefined,
            (args.limit as number) || 50,
            args.category as string | undefined,
            args.status as "active" | "deprecated" | undefined,
            args.expand as string[] | undefined
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

        case "find": {
          if (!args.endpoint_ids || !Array.isArray(args.endpoint_ids)) {
            throw new Error("endpoint_ids parameter is required and must be an array");
          }
          const result = await findModels(
            args.endpoint_ids as string[],
            args.expand as string[] | undefined
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
          if (!args.app_id || !args.request_id) {
            throw new Error("app_id and request_id parameters are required");
          }
          const result = await getResult(args.app_id as string, args.request_id as string);
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
          if (!args.app_id || !args.request_id) {
            throw new Error("app_id and request_id parameters are required");
          }
          const result = await getStatus(args.app_id as string, args.request_id as string);
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
          if (!args.app_id || !args.request_id) {
            throw new Error("app_id and request_id parameters are required");
          }
          const result = await cancelRequest(args.app_id as string, args.request_id as string);
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

        case "pricing": {
          if (!args.endpoint_ids || !Array.isArray(args.endpoint_ids)) {
            throw new Error("endpoint_ids parameter is required and must be an array");
          }
          const result = await getPricing(
            args.endpoint_ids as string[],
            args.cursor as string | undefined
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

        case "estimate_cost": {
          if (!args.estimate_type || !args.endpoints) {
            throw new Error("estimate_type and endpoints parameters are required");
          }

          const estimateType = args.estimate_type as string;
          if (estimateType !== "historical_api_price" && estimateType !== "unit_price") {
            throw new Error("estimate_type must be 'historical_api_price' or 'unit_price'");
          }

          const result = await estimateCost({
            estimate_type: estimateType as "historical_api_price" | "unit_price",
            endpoints: args.endpoints as Record<string, any>,
          } as any);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case "usage": {
          if (!args.endpoint_ids || !Array.isArray(args.endpoint_ids)) {
            throw new Error("endpoint_ids parameter is required and must be an array");
          }

          const result = await getUsage({
            endpoint_ids: args.endpoint_ids as string[],
            start: args.start as string | undefined,
            end: args.end as string | undefined,
            timezone: args.timezone as string | undefined,
            timeframe: args.timeframe as any,
            bound_to_timeframe: args.bound_to_timeframe as boolean | undefined,
            expand: args.expand as any[] | undefined,
            cursor: args.cursor as string | undefined,
            limit: args.limit as number | undefined,
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

        case "analytics": {
          if (!args.endpoint_ids || !Array.isArray(args.endpoint_ids)) {
            throw new Error("endpoint_ids parameter is required and must be an array");
          }

          const result = await getAnalytics({
            endpoint_ids: args.endpoint_ids as string[],
            start: args.start as string | undefined,
            end: args.end as string | undefined,
            timezone: args.timezone as string | undefined,
            timeframe: args.timeframe as any,
            bound_to_timeframe: args.bound_to_timeframe as boolean | undefined,
            metric: args.metric as any,
            cursor: args.cursor as string | undefined,
            limit: args.limit as number | undefined,
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
