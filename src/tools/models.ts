/**
 * Model discovery and schema tools
 */

import { publicRequest } from "../client.js";

const FAL_BASE_URL = "https://fal.ai/api";
const FAL_REST_URL = "https://rest.alpha.fal.ai";

// API response structure from fal.ai uses "items" not "models"
interface FalApiResponse {
  items: Array<{
    id: string;
    title: string;
    shortDescription?: string;
    category?: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface ModelsResult {
  models: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    [key: string]: any;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchResult {
  models: Array<{
    id: string;
    name: string;
    description?: string;
    [key: string]: any;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export interface SchemaResult {
  input_schema: any;
  output_schema: any;
  app_id: string;
  description?: string;
  [key: string]: any;
}

/**
 * List available models in the fal.ai model gallery
 */
export async function listModels(
  category?: string,
  page: number = 1,
  limit: number = 100
): Promise<ModelsResult> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: Math.min(limit, 100).toString(),
  });

  if (category) {
    params.append("category", category);
  }

  const url = `${FAL_BASE_URL}/models?${params.toString()}`;
  const response = await publicRequest<FalApiResponse>(url);

  // Transform API response to our expected format
  const models = response.items.map(item => ({
    ...item,
    name: item.title,
    description: item.shortDescription,
  }));

  return {
    models,
    total: models.length,
    page,
    totalPages: 1,
  };
}

/**
 * Search for models in the fal.ai gallery using the keywords parameter
 */
export async function searchModels(
  query: string,
  page: number = 1,
  limit: number = 50
): Promise<SearchResult> {
  const params = new URLSearchParams({
    keywords: query,
    page: page.toString(),
    limit: Math.min(limit, 100).toString(),
  });

  const url = `${FAL_BASE_URL}/models?${params.toString()}`;
  const response = await publicRequest<FalApiResponse>(url);

  // Transform API response to our expected format
  const models = response.items.map(item => ({
    ...item,
    name: item.title,
    description: item.shortDescription,
  }));

  return {
    models,
    total: models.length,
    page,
    totalPages: 1,
  };
}

/**
 * Get the OpenAPI schema for a specific model
 */
export async function getModelSchema(appId: string): Promise<SchemaResult> {
  const url = `${FAL_BASE_URL}/openapi/queue/openapi.json?endpoint_id=${appId}`;
  return publicRequest<SchemaResult>(url, {
    method: "GET",
  });
}
