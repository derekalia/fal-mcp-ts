/**
 * Model discovery and schema tools
 */

import { publicRequest } from "../client.js";

const FAL_BASE_URL = "https://fal.ai/api";
const FAL_REST_URL = "https://rest.alpha.fal.ai";

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
  return publicRequest<ModelsResult>(url);
}

/**
 * Search for models in the fal.ai gallery
 * Note: fal.ai doesn't have a dedicated search endpoint, so we fetch all models
 * and filter client-side
 */
export async function searchModels(
  query: string,
  page: number = 1,
  limit: number = 50
): Promise<SearchResult> {
  // Fetch models and filter client-side since there's no search API
  const allModels = await listModels(undefined, 1, 100);

  const lowerQuery = query.toLowerCase();
  const filteredModels = allModels.models.filter(model =>
    model.id?.toLowerCase().includes(lowerQuery) ||
    model.name?.toLowerCase().includes(lowerQuery) ||
    model.description?.toLowerCase().includes(lowerQuery) ||
    model.category?.toLowerCase().includes(lowerQuery)
  );

  const total = filteredModels.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedModels = filteredModels.slice(startIndex, endIndex);

  return {
    models: paginatedModels,
    total,
    page,
    totalPages,
  };
}

/**
 * Get the input/output schema for a specific model
 */
export async function getModelSchema(appId: string): Promise<SchemaResult> {
  // Use the app_id directly in the REST API endpoint
  // The API expects the full path after /aliases/
  const url = `${FAL_REST_URL}/aliases/${appId}`;
  return publicRequest<SchemaResult>(url, {
    method: "GET",
  });
}
