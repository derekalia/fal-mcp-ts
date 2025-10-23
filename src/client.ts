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

  const headers = {
    "Authorization": `Key ${apiKey}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

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
