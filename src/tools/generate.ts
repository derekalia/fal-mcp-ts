/**
 * Generation and queue management tools
 */

import { falRequest } from "../client.js";

const FAL_QUEUE_URL = "https://queue.fal.run";

export interface GenerateOptions {
  app_id: string;
  input_data: Record<string, any>;
  webhook_url?: string;
  output_format?: "json" | "binary";
}

export interface GenerateResult {
  request_id: string;
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  response_url: string;
  status_url: string;
  cancel_url: string;
  queue_position?: number;
}

export interface QueueResult {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
  result?: any;
  error?: string;
  logs?: any[];
  metrics?: any;
}

export interface QueueStatus {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
  request_id: string;
  response_url: string;
  status_url: string;
  cancel_url: string;
  queue_position?: number;
  logs?: any[];
}

export interface CancelResult {
  status: string;
  [key: string]: any;
}

/**
 * Submit a generation request to a fal.ai model
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { app_id, input_data, webhook_url } = options;

  // Use queue endpoint for async processing
  const url = `${FAL_QUEUE_URL}/${app_id}`;

  // Send input_data directly as the payload - don't wrap in "input"
  const payload: Record<string, any> = { ...input_data };

  if (webhook_url) {
    payload.webhook_url = webhook_url;
  }

  const response = await falRequest<GenerateResult>(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Return the full queue response with URLs
  return response;
}

/**
 * Parse app_id to extract owner and alias
 * Examples: "fal-ai/flux/dev" -> owner: "fal-ai", alias: "flux"
 */
function parseAppId(appId: string): { owner: string; alias: string } {
  const parts = appId.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid app_id format: ${appId}. Expected format: owner/alias or owner/alias/version`);
  }
  return {
    owner: parts[0],
    alias: parts[1],
  };
}

/**
 * Get the result of a generation request
 */
export async function getResult(appId: string, requestId: string): Promise<QueueResult> {
  const { owner, alias } = parseAppId(appId);
  const url = `${FAL_QUEUE_URL}/${owner}/${alias}/requests/${requestId}`;

  return falRequest<QueueResult>(url, {
    method: "GET",
  });
}

/**
 * Check the status of a generation request
 */
export async function getStatus(appId: string, requestId: string): Promise<QueueStatus> {
  const { owner, alias } = parseAppId(appId);
  const url = `${FAL_QUEUE_URL}/${owner}/${alias}/requests/${requestId}/status`;

  return falRequest<QueueStatus>(url, {
    method: "GET",
  });
}

/**
 * Cancel a pending or processing generation request
 */
export async function cancelRequest(appId: string, requestId: string): Promise<CancelResult> {
  const { owner, alias } = parseAppId(appId);
  const url = `${FAL_QUEUE_URL}/${owner}/${alias}/requests/${requestId}/cancel`;

  return falRequest<CancelResult>(url, {
    method: "PUT",
  });
}
