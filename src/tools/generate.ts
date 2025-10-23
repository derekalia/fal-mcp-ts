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
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  eta?: number;
  output_url?: string;
}

export interface QueueResult {
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
  eta?: number;
}

export interface QueueStatus {
  status: "pending" | "processing" | "completed" | "failed";
  eta?: number;
  progress?: number;
}

export interface CancelResult {
  success: boolean;
  message: string;
}

/**
 * Submit a generation request to a fal.ai model
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const { app_id, input_data, webhook_url, output_format = "json" } = options;

  // Use queue endpoint for async processing
  const url = `${FAL_QUEUE_URL}/${app_id}`;

  const payload: Record<string, any> = {
    input: input_data,
  };

  if (webhook_url) {
    payload.webhook_url = webhook_url;
  }

  if (output_format !== "json") {
    payload.output_format = output_format;
  }

  const response = await falRequest<any>(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  // Normalize response format
  if ("request_id" in response) {
    return {
      request_id: response.request_id,
      status: response.status || "pending",
      eta: response.eta,
      output_url: response.output_url,
    };
  } else {
    // Some models return results immediately
    return {
      request_id: response.id || "immediate",
      status: "completed",
      result: response,
    };
  }
}

/**
 * Get the result of a generation request
 */
export async function getResult(app_id: string, request_id: string): Promise<QueueResult> {
  const url = `${FAL_QUEUE_URL}/${app_id}/requests/${request_id}`;
  return falRequest<QueueResult>(url);
}

/**
 * Check the status of a generation request without fetching full results
 */
export async function getStatus(app_id: string, request_id: string): Promise<QueueStatus> {
  const url = `${FAL_QUEUE_URL}/${app_id}/requests/${request_id}/status`;
  return falRequest<QueueStatus>(url);
}

/**
 * Cancel a pending or processing generation request
 */
export async function cancelRequest(app_id: string, request_id: string): Promise<CancelResult> {
  const url = `${FAL_QUEUE_URL}/${app_id}/requests/${request_id}/cancel`;
  const response = await falRequest<any>(url, {
    method: "POST",
  });

  return {
    success: true,
    message: response.message || "Request cancelled successfully",
  };
}
