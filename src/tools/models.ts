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
 */
export async function searchModels(
  query: string,
  page: number = 1,
  limit: number = 50
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    limit: Math.min(limit, 100).toString(),
  });

  const url = `${FAL_BASE_URL}/models/search?${params.toString()}`;
  return publicRequest<SearchResult>(url);
}

/**
 * Get the input/output schema for a specific model
 */
export async function getModelSchema(appId: string): Promise<SchemaResult> {
  // Extract owner and path from app_id
  const parts = appId.split("/");
  if (parts.length < 3) {
    throw new Error("Invalid app_id format. Expected: owner/model/version");
  }

  const [owner, model, ...versionParts] = parts;
  const version = versionParts.join("/");

  // Use the REST API endpoint for schema information
  const url = `${FAL_REST_URL}/aliases/${owner}/${model}/${version}`;
  return publicRequest<SchemaResult>(url);
}
