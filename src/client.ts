/**
 * Fal.ai client wrapper for MCP server
 */

import { fal } from "@fal-ai/client";

/**
 * Configure the fal client with API key from environment
 */
export function configureFalClient(): void {
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    throw new Error("FAL_KEY environment variable is not set. Please configure your API key.");
  }

  fal.config({
    credentials: apiKey,
  });
}

/**
 * Make authenticated HTTP request to fal.ai API
 */
export async function falRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = process.env.FAL_KEY;

  if (!apiKey) {
    throw new Error("FAL_KEY environment variable is not set");
  }

  const method = (options.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Authorization": `Key ${apiKey}`,
  };

  // Copy existing headers if any
  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    });
  }

  // Only set Content-Type for methods that can have a body
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    headers["Content-Type"] = "application/json";
  }

  // Build fetch options, excluding body for GET requests
  const fetchOptions: RequestInit = {
    method,
    headers,
    signal: options.signal,
  };

  // Only include body for methods that support it
  if (method !== "GET" && method !== "HEAD" && options.body) {
    fetchOptions.body = options.body;
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Make unauthenticated HTTP request to fal.ai API
 */
export async function publicRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export { fal };
