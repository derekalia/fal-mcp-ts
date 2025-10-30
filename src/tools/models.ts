/**
 * Model discovery and schema tools
 */

import { publicRequest, falRequest } from "../client.js";

const FAL_API_V1 = "https://api.fal.ai/v1";

// V1 Platform API response structures
interface ModelMetadata {
  display_name: string;
  category: string;
  description: string;
  status: "active" | "deprecated";
  tags: string[];
  updated_at: string;
  is_favorited: boolean | null;
  thumbnail_url: string;
  thumbnail_animated_url?: string;
  model_url: string;
  github_url?: string;
  license_type?: "commercial" | "research" | "private";
  date: string;
  group?: {
    key: string;
    label: string;
  };
  highlighted: boolean;
  kind?: "inference" | "training";
  training_endpoint_ids?: string[];
  inference_endpoint_ids?: string[];
  stream_url?: string;
  duration_estimate?: number;
  pinned: boolean;
}

interface OpenAPISchema {
  openapi: string;
  [key: string]: any;
}

interface OpenAPIError {
  error: {
    code: string;
    message: string;
  };
}

interface ModelEntry {
  endpoint_id: string;
  metadata?: ModelMetadata;
  openapi?: OpenAPISchema | OpenAPIError;
}

interface V1ApiResponse {
  models: ModelEntry[];
  next_cursor: string | null;
  has_more: boolean;
}

export interface ModelsResult {
  models: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    status?: string;
    tags?: string[];
    thumbnail_url?: string;
    updated_at?: string;
    [key: string]: any;
  }>;
  total: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface SearchResult {
  models: Array<{
    id: string;
    name: string;
    description?: string;
    category?: string;
    status?: string;
    tags?: string[];
    thumbnail_url?: string;
    [key: string]: any;
  }>;
  total: number;
  next_cursor: string | null;
  has_more: boolean;
}

export interface SchemaResult {
  input_schema: any;
  output_schema: any;
  app_id: string;
  description?: string;
  [key: string]: any;
}

/**
 * Transform V1 API model entry to our output format
 */
function transformModelEntry(entry: ModelEntry) {
  const metadata = entry.metadata;
  return {
    id: entry.endpoint_id,
    name: metadata?.display_name || entry.endpoint_id,
    description: metadata?.description,
    category: metadata?.category,
    status: metadata?.status,
    tags: metadata?.tags,
    thumbnail_url: metadata?.thumbnail_url,
    thumbnail_animated_url: metadata?.thumbnail_animated_url,
    model_url: metadata?.model_url,
    updated_at: metadata?.updated_at,
    license_type: metadata?.license_type,
    highlighted: metadata?.highlighted,
    pinned: metadata?.pinned,
    kind: metadata?.kind,
    openapi: entry.openapi,
  };
}

/**
 * List available models in the fal.ai model gallery
 */
export async function listModels(
  category?: string,
  cursor?: string,
  limit: number = 100,
  status?: "active" | "deprecated",
  expand?: string[]
): Promise<ModelsResult> {
  const params = new URLSearchParams({
    limit: Math.min(limit, 100).toString(),
  });

  if (cursor) {
    params.append("cursor", cursor);
  }

  if (category) {
    params.append("category", category);
  }

  if (status) {
    params.append("status", status);
  }

  if (expand) {
    expand.forEach(field => params.append("expand", field));
  }

  const url = `${FAL_API_V1}/models?${params.toString()}`;
  const response = await publicRequest<V1ApiResponse>(url);

  const models = response.models.map(transformModelEntry);

  return {
    models,
    total: models.length,
    next_cursor: response.next_cursor,
    has_more: response.has_more,
  };
}

/**
 * Search for models in the fal.ai gallery using free-text query
 */
export async function searchModels(
  query: string,
  cursor?: string,
  limit: number = 50,
  category?: string,
  status?: "active" | "deprecated",
  expand?: string[]
): Promise<SearchResult> {
  const params = new URLSearchParams({
    q: query,
    limit: Math.min(limit, 100).toString(),
  });

  if (cursor) {
    params.append("cursor", cursor);
  }

  if (category) {
    params.append("category", category);
  }

  if (status) {
    params.append("status", status);
  }

  if (expand) {
    expand.forEach(field => params.append("expand", field));
  }

  const url = `${FAL_API_V1}/models?${params.toString()}`;
  const response = await publicRequest<V1ApiResponse>(url);

  const models = response.models.map(transformModelEntry);

  return {
    models,
    total: models.length,
    next_cursor: response.next_cursor,
    has_more: response.has_more,
  };
}

/**
 * Find specific model(s) by endpoint ID
 */
export async function findModels(
  endpointIds: string[],
  expand?: string[]
): Promise<ModelsResult> {
  const params = new URLSearchParams();

  endpointIds.forEach(id => params.append("endpoint_id", id));

  if (expand) {
    expand.forEach(field => params.append("expand", field));
  }

  const url = `${FAL_API_V1}/models?${params.toString()}`;
  const response = await publicRequest<V1ApiResponse>(url);

  const models = response.models.map(transformModelEntry);

  return {
    models,
    total: models.length,
    next_cursor: response.next_cursor,
    has_more: response.has_more,
  };
}

/**
 * Get the OpenAPI schema for a specific model
 * Uses the v1 API with expand=openapi-3.0
 */
export async function getModelSchema(appId: string): Promise<SchemaResult> {
  const params = new URLSearchParams({
    endpoint_id: appId,
    expand: "openapi-3.0",
  });

  const url = `${FAL_API_V1}/models?${params.toString()}`;
  const response = await publicRequest<V1ApiResponse>(url);

  if (response.models.length === 0) {
    throw new Error(`Model not found: ${appId}`);
  }

  const model = response.models[0];

  if (model.openapi && "error" in model.openapi) {
    throw new Error(`Failed to get schema: ${model.openapi.error.message}`);
  }

  return {
    app_id: model.endpoint_id,
    description: model.metadata?.description,
    input_schema: (model.openapi as OpenAPISchema)?.components?.schemas?.Input || {},
    output_schema: (model.openapi as OpenAPISchema)?.components?.schemas?.Output || {},
    openapi: model.openapi,
  };
}

// Pricing API types and functions
export interface PriceEntry {
  endpoint_id: string;
  unit_price: number;
  unit: string;
  currency: string;
}

export interface PricingResult {
  prices: PriceEntry[];
  next_cursor: string | null;
  has_more: boolean;
}

/**
 * Get pricing information for specific model endpoint(s)
 * Requires authentication
 */
export async function getPricing(
  endpointIds: string[],
  cursor?: string
): Promise<PricingResult> {
  const params = new URLSearchParams();

  endpointIds.forEach(id => params.append("endpoint_id", id));

  if (cursor) {
    params.append("cursor", cursor);
  }

  const url = `${FAL_API_V1}/models/pricing?${params.toString()}`;

  // Pricing requires authentication
  return falRequest<PricingResult>(url, {
    method: "GET",
  });
}

// Cost estimation API types and functions
export type EstimateType = "historical_api_price" | "unit_price";

export interface HistoricalEstimateEndpoint {
  call_quantity: number;
}

export interface UnitPriceEstimateEndpoint {
  unit_quantity: number;
}

export interface HistoricalEstimateRequest {
  estimate_type: "historical_api_price";
  endpoints: Record<string, HistoricalEstimateEndpoint>;
}

export interface UnitPriceEstimateRequest {
  estimate_type: "unit_price";
  endpoints: Record<string, UnitPriceEstimateEndpoint>;
}

export type EstimateRequest = HistoricalEstimateRequest | UnitPriceEstimateRequest;

export interface EstimateResult {
  estimate_type: EstimateType;
  total_cost: number;
  currency: string;
}

/**
 * Estimate costs for model operations
 * Supports two methods:
 * 1. historical_api_price: Based on historical pricing per API call
 * 2. unit_price: Based on unit price × expected billing units
 * Requires authentication
 */
export async function estimateCost(
  request: EstimateRequest
): Promise<EstimateResult> {
  const url = `${FAL_API_V1}/models/pricing/estimate`;

  // Cost estimation requires authentication
  return falRequest<EstimateResult>(url, {
    method: "POST",
    body: JSON.stringify(request),
  });
}
