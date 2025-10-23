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

  const payload: Record<string, any> = {
    input: input_data,
  };

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
 * Get the result of a generation request using the response_url from the queue
 */
export async function getResult(url: string): Promise<QueueResult> {
  return falRequest<QueueResult>(url, {
    method: "GET",
  });
}

/**
 * Check the status of a generation request using the status_url from the queue
 */
export async function getStatus(url: string): Promise<QueueStatus> {
  return falRequest<QueueStatus>(url, {
    method: "GET",
  });
}

/**
 * Cancel a pending or processing generation request using the cancel_url from the queue
 */
export async function cancelRequest(url: string): Promise<CancelResult> {
  return falRequest<CancelResult>(url, {
    method: "PUT",
  });
}
