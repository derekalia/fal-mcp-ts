# Platform APIs for Models

> Programmatic access to model metadata, pricing, usage tracking, and analytics

The **fal Platform APIs** provide programmatic access to platform management features for Model APIs, including:

* **Model metadata** - Search and discover available model endpoints with detailed information
* **Pricing information** - Retrieve real-time pricing and estimate costs
* **Usage tracking** - Access detailed usage line items with unit quantities and prices
* **Analytics** - Query time-bucketed metrics for request counts, success/error rates, and latency

## Available Operations

The Platform APIs provide the following endpoints for managing Model APIs:

<CardGroup cols={2}>
  <Card title="Model Search" icon="grid" href="/platform-apis/v1/models">
    Search and discover available model endpoints with metadata, categories, and capabilities
  </Card>

  <Card title="Model Pricing" icon="dollar-sign" href="/platform-apis/v1/models/pricing">
    Retrieve real-time pricing information for models
  </Card>

  <Card title="Estimate Cost" icon="calculator" href="/platform-apis/v1/models/pricing/estimate">
    Estimate costs for planned operations
  </Card>

  <Card title="Usage" icon="chart-bar" href="/platform-apis/v1/models/usage">
    Access detailed usage line items with unit quantities and prices
  </Card>

  <Card title="Analytics" icon="chart-line" href="/platform-apis/v1/models/analytics">
    Query time-bucketed metrics for requests, success rates, and latency
  </Card>
</CardGroup>

<Note>
  These APIs are for **platform management** of Model APIs. For executing models and generating content, see the [Model Endpoints](/model-apis/model-endpoints) documentation.
</Note>



# Model search

> 
Unified endpoint for discovering model endpoints. Supports three usage modes:

**1. List Mode** (no parameters):
Paginated list of all available model endpoints with minimal metadata.

**2. Find Mode** (`endpoint_id` parameter):
Retrieve specific model endpoint(s) by ID. Supports single or multiple IDs.

**3. Search Mode** (search parameters):
Filter models by free-text query, category, or status.

**Expansion:**
Use `expand=openapi-3.0` to include the full OpenAPI 3.0 schema inline in the 'openapi' field for each model.

**Examples of `endpoint_id` values:**
- `fal-ai/flux/dev`
- `fal-ai/wan/v2.2-a14b/text-to-video`
- `fal-ai/minimax/video-01/image-to-video`
- `fal-ai/hunyuan3d-v21`

See [fal.ai Model APIs](https://docs.fal.ai/model-apis) for more details.

**Authentication:** Optional. Providing an API key grants higher rate limits.

**Common Use Cases:**
- Browse available models for integration
- Retrieve metadata for specific endpoints
- Search for models by category or keywords
- Get OpenAPI schemas for code generation
- Build model selection interfaces
    

## OpenAPI

````yaml platform-apis/openapi/v1.json get /models
paths:
  path: /models
  method: get
  servers:
    - url: https://api.fal.ai/v1
      description: Production server
  request:
    security:
      - title: keyAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: apiKey
              description: >-
                Admin API key must be prefixed with "Key ", e.g. Authorization:
                Key YOUR_ADMIN_API_KEY
          cookie: {}
    parameters:
      path: {}
      query:
        limit:
          schema:
            - type: integer
              required: false
              description: >-
                Maximum number of items to return. Actual maximum depends on
                query type and expansion parameters.
              minimum: 1
              example: 50
        cursor:
          schema:
            - type: string
              required: false
              description: >-
                Pagination cursor from previous response. Encodes the page
                number.
              example: Mg==
        endpoint_id:
          schema:
            - type: string
              required: false
              description: >-
                Endpoint ID(s) to retrieve (e.g., 'fal-ai/flux/dev'). Can be a
                single value or multiple values (1-50 models). When combined
                with search params, narrows results to these IDs. Use array
                syntax: ?endpoint_id=model1&endpoint_id=model2
              example: &ref_0
                - fal-ai/flux/dev
                - fal-ai/flux-pro
            - type: array
              items:
                allOf:
                  - type: string
              required: false
              description: >-
                Endpoint ID(s) to retrieve (e.g., 'fal-ai/flux/dev'). Can be a
                single value or multiple values (1-50 models). When combined
                with search params, narrows results to these IDs. Use array
                syntax: ?endpoint_id=model1&endpoint_id=model2
              example: *ref_0
          style: form
          explode: true
        q:
          schema:
            - type: string
              required: false
              description: >-
                Free-text search query to filter models by name, description, or
                category
              example: text to image
        category:
          schema:
            - type: string
              required: false
              description: >-
                Filter by category (e.g., 'text-to-image', 'image-to-video',
                'training')
              example: text-to-image
        status:
          schema:
            - type: enum<string>
              enum:
                - active
                - deprecated
              required: false
              description: Filter models by status - omit to include all statuses
              example: active
        expand:
          schema:
            - type: string
              required: false
              description: >-
                Fields to expand in the response. Supported values:
                'openapi-3.0' (includes full OpenAPI 3.0 schema in 'openapi'
                field)
              example: &ref_1
                - openapi-3.0
            - type: array
              items:
                allOf:
                  - type: string
              required: false
              description: >-
                Fields to expand in the response. Supported values:
                'openapi-3.0' (includes full OpenAPI 3.0 schema in 'openapi'
                field)
              example: *ref_1
          style: form
          explode: true
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              models:
                allOf:
                  - type: array
                    items:
                      type: object
                      properties:
                        endpoint_id:
                          type: string
                          description: >-
                            Stable identifier used to call the model (e.g.,
                            'fal-ai/wan/v2.2-a14b/text-to-video',
                            'fal-ai/minimax/video-01/image-to-video',
                            'fal-ai/hunyuan3d-v21')
                        metadata:
                          type: object
                          properties:
                            display_name:
                              type: string
                              description: >-
                                Human-readable label shown on Explore/Model
                                pages
                            category:
                              type: string
                              description: >-
                                Model category (e.g., 'text-to-image',
                                'image-to-video', 'text-to-video',
                                'image-to-3d', 'training')
                            description:
                              type: string
                              description: >-
                                Brief description of the model's capabilities
                                and use cases
                            status:
                              type: string
                              enum:
                                - active
                                - deprecated
                              description: >-
                                'active' or 'deprecated'. Newest models are
                                surfaced in Explore and may be flagged as
                                'new/beta' in tags
                            tags:
                              type: array
                              items:
                                type: string
                              description: >-
                                Freeform tags such as 'new', 'beta', 'pro', or
                                'turbo' (Explore badges)
                            updated_at:
                              type: string
                              description: >-
                                ISO8601 timestamp of when the model was last
                                updated
                            is_favorited:
                              type:
                                - boolean
                                - 'null'
                              description: >-
                                Whether the model is favorited by the
                                authenticated user (null when unauthenticated)
                            thumbnail_url:
                              type: string
                              description: Main thumbnail image URL
                            thumbnail_animated_url:
                              type: string
                              description: Animated thumbnail URL (optional)
                            model_url:
                              type: string
                              description: >-
                                Full model endpoint URL (e.g.,
                                https://fal.run/...)
                            github_url:
                              type: string
                              description: License or GitHub URL (optional)
                            license_type:
                              type: string
                              enum:
                                - commercial
                                - research
                                - private
                              description: License type for the model (optional)
                            date:
                              type: string
                              description: ISO8601 timestamp of model creation
                            group:
                              type: object
                              properties:
                                key:
                                  type: string
                                  description: Group key identifier
                                label:
                                  type: string
                                  description: Human-readable group label
                              required:
                                - key
                                - label
                              description: Model group information (optional)
                            highlighted:
                              type: boolean
                              description: Whether the model is highlighted
                            kind:
                              type: string
                              enum:
                                - inference
                                - training
                              description: Model kind - inference or training (optional)
                            training_endpoint_ids:
                              type: array
                              items:
                                type: string
                              description: >-
                                Related training endpoint IDs (optional, only
                                present when non-empty, for inference models)
                            inference_endpoint_ids:
                              type: array
                              items:
                                type: string
                              description: >-
                                Related inference endpoint IDs (optional, only
                                present when non-empty, for training models)
                            stream_url:
                              type: string
                              description: Streaming endpoint URL (optional)
                            duration_estimate:
                              type: number
                              description: Estimated duration in minutes (optional)
                            pinned:
                              type: boolean
                              description: Whether the model is pinned
                          required:
                            - display_name
                            - category
                            - description
                            - status
                            - tags
                            - updated_at
                            - is_favorited
                            - thumbnail_url
                            - model_url
                            - date
                            - highlighted
                            - pinned
                          description: >-
                            Model metadata (optional - may be absent for
                            endpoints without registry entries)
                        openapi:
                          anyOf:
                            - type: object
                              properties:
                                openapi:
                                  type: string
                                  description: OpenAPI version (e.g., '3.0.4')
                              required:
                                - openapi
                              additionalProperties: {}
                              description: OpenAPI 3.0 specification for the model
                            - type: object
                              properties:
                                error:
                                  type: object
                                  properties:
                                    code:
                                      type: string
                                      description: Error code (e.g., 'expansion_failed')
                                    message:
                                      type: string
                                      description: Human-readable error message
                                  required:
                                    - code
                                    - message
                                  description: Error details for failed OpenAPI expansion
                              required:
                                - error
                              description: Error encountered while expanding OpenAPI schema
                          description: >-
                            OpenAPI 3.0 specification or error (present when
                            expand=openapi-3.0 is requested)
                      required:
                        - endpoint_id
                      description: >-
                        Model information with optional metadata and expandable
                        fields
                    description: Array of model information
              next_cursor:
                allOf:
                  - type:
                      - string
                      - 'null'
                    description: Cursor for the next page of results, null if no more pages
              has_more:
                allOf:
                  - type: boolean
                    description: >-
                      Boolean indicating if more results are available
                      (convenience field derived from next_cursor)
            description: Response containing model data with pagination support
            requiredProperties:
              - models
              - has_more
        examples:
          example:
            value:
              models:
                - endpoint_id: fal-ai/flux/dev
                  metadata:
                    display_name: FLUX.1 [dev]
                    category: text-to-image
                    description: Fast text-to-image generation
                    status: active
                    tags:
                      - fast
                      - pro
                    updated_at: '2025-01-15T12:00:00Z'
                    is_favorited: false
                    thumbnail_url: https://fal.media/files/example.jpg
                    model_url: https://fal.run/fal-ai/flux/dev
                    date: '2024-08-01T00:00:00Z'
                    highlighted: true
                    pinned: false
              next_cursor: null
              has_more: false
        description: Successfully retrieved model endpoints
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: validation_error
                message: Invalid request parameters
        description: Invalid request parameters
    '404':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: not_found
                message: Resource not found
        description: Resource not found
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: rate_limited
                message: Rate limit exceeded
        description: Rate limit exceeded
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: server_error
                message: An unexpected error occurred
        description: Internal server error
  deprecated: false
  type: path
  xMcp: &ref_2
    enabled: true
  xMint:
    href: /platform-apis/v1/models
    mcp: *ref_2
components:
  schemas: {}

````

# Pricing

> 
Returns unit pricing for requested endpoint IDs. Most models use
**output-based** pricing (e.g., per image/video with proportional
adjustments for resolution/length). Some models use **GPU-based** pricing
depending on architecture. Values are expressed per model's billing unit
in a given currency.

**Authentication:** Required. Users must provide a valid API key. 
Custom pricing or discounts may be applied based on account status.

**Common Use Cases:**
- Display pricing in user interfaces
- Compare pricing across different models
- Build cost estimation tools
- Check current billing rates

See [fal.ai pricing](https://fal.ai/pricing) for more details.
    

## OpenAPI

````yaml platform-apis/openapi/v1.json get /models/pricing
paths:
  path: /models/pricing
  method: get
  servers:
    - url: https://api.fal.ai/v1
      description: Production server
  request:
    security:
      - title: keyAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: apiKey
              description: >-
                Admin API key must be prefixed with "Key ", e.g. Authorization:
                Key YOUR_ADMIN_API_KEY
          cookie: {}
    parameters:
      path: {}
      query:
        endpoint_id:
          schema:
            - type: string
              required: true
              description: >-
                Filter by specific endpoint ID(s). Must provide at least 1
                endpoint ID (1-50 models). Supports comma-separated values:
                ?endpoint_id=model1,model2 or array syntax:
                ?endpoint_id=model1&endpoint_id=model2
              example: &ref_0
                - fal-ai/flux/dev
            - type: array
              items:
                allOf:
                  - type: string
              required: true
              description: >-
                Filter by specific endpoint ID(s). Must provide at least 1
                endpoint ID (1-50 models). Supports comma-separated values:
                ?endpoint_id=model1,model2 or array syntax:
                ?endpoint_id=model1&endpoint_id=model2
              example: *ref_0
          style: form
          explode: true
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              next_cursor:
                allOf:
                  - type:
                      - string
                      - 'null'
                    description: Cursor for the next page of results, null if no more pages
              has_more:
                allOf:
                  - type: boolean
                    description: >-
                      Boolean indicating if more results are available
                      (convenience field derived from next_cursor)
              prices:
                allOf:
                  - type: array
                    items:
                      type: object
                      properties:
                        endpoint_id:
                          type: string
                          description: >-
                            Endpoint identifier (e.g.,
                            'fal-ai/wan/v2.2-a14b/text-to-video',
                            'fal-ai/minimax/video-01/image-to-video')
                        unit_price:
                          type: number
                          minimum: 0
                          description: >-
                            Base price per billing unit (often per generated
                            output; may be per GPU-second for some models) in
                            the specified currency
                        unit:
                          type: string
                          description: >-
                            Unit of measurement for billing: 'image', 'video',
                            or provider-specific GPU/compute unit when
                            applicable. Most models use output-based pricing.
                        currency:
                          type: string
                          minLength: 3
                          maxLength: 3
                          description: >-
                            Three-letter currency code (ISO 4217, e.g., 'USD',
                            'EUR')
                      required:
                        - endpoint_id
                        - unit_price
                        - unit
                        - currency
                      description: >-
                        Pricing information for a specific model endpoint. Most
                        models use output-based pricing (e.g., per image/video
                        with proportional adjustments for resolution/length).
                        Some models use GPU-based pricing depending on
                        architecture.
                    description: Pricing information for requested endpoints
            description: Response containing pricing information for requested endpoints
            requiredProperties:
              - next_cursor
              - has_more
              - prices
        examples:
          example:
            value:
              prices:
                - endpoint_id: fal-ai/flux/dev
                  unit_price: 0.025
                  unit: image
                  currency: USD
              next_cursor: null
              has_more: false
        description: Pricing information retrieved successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: validation_error
                message: Invalid request parameters
        description: Invalid request parameters
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: authorization_error
                message: Authentication required
        description: Authentication required
    '404':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: not_found
                message: Resource not found
        description: Resource not found
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: rate_limited
                message: Rate limit exceeded
        description: Rate limit exceeded
  deprecated: false
  type: path
  xMint:
    href: /platform-apis/v1/models/pricing
components:
  schemas: {}

````

# Estimate cost

> 
Computes cost estimates using one of two methods:

**1. Historical API Price** (`historical_api_price`):
- Based on historical pricing per API call from past usage patterns
- Takes `call_quantity` (number of API calls) per endpoint
- Useful for estimating based on actual historical usage patterns
- Example: "How much will 100 calls to flux/dev cost?"

**2. Unit Price** (`unit_price`):
- Based on unit price × expected billing units from pricing service
- Takes `unit_quantity` (number of billing units like images/videos) per endpoint
- Useful when you know the expected output quantity
- Example: "How much will 50 images from flux/dev cost?"

**Authentication:** Required. Users must provide a valid API key.
Custom pricing or discounts may be applied based on account status.

**Common Use Cases:**
- Pre-calculate costs for batch operations
- Display cost estimates in user interfaces
- Budget planning and cost optimization

See [fal.ai pricing](https://fal.ai/pricing) for more details.
    

## OpenAPI

````yaml platform-apis/openapi/v1.json post /models/pricing/estimate
paths:
  path: /models/pricing/estimate
  method: post
  servers:
    - url: https://api.fal.ai/v1
      description: Production server
  request:
    security:
      - title: keyAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: apiKey
              description: >-
                Admin API key must be prefixed with "Key ", e.g. Authorization:
                Key YOUR_ADMIN_API_KEY
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              estimate_type:
                allOf:
                  - type: string
                    enum:
                      - historical_api_price
                    description: >-
                      Estimate type: historical API pricing based on past usage
                      patterns
              endpoints:
                allOf:
                  - type: object
                    additionalProperties:
                      type: object
                      properties:
                        call_quantity:
                          type: integer
                          minimum: 1
                          description: >-
                            Number of API calls to estimate (regardless of units
                            per call)
                      required:
                        - call_quantity
                    description: Map of endpoint IDs to call quantities
            description: >-
              Historical API price estimate: Calculates cost based on historical
              pricing per API call. Useful for estimating costs based on actual
              usage patterns.
            requiredProperties:
              - estimate_type
              - endpoints
            example: &ref_0
              estimate_type: historical_api_price
              endpoints:
                fal-ai/flux/dev:
                  call_quantity: 100
                fal-ai/flux/schnell:
                  call_quantity: 50
          - type: object
            properties:
              estimate_type:
                allOf:
                  - type: string
                    enum:
                      - unit_price
                    description: >-
                      Estimate type: unit price calculation based on billing
                      units
              endpoints:
                allOf:
                  - type: object
                    additionalProperties:
                      type: object
                      properties:
                        unit_quantity:
                          type: number
                          minimum: 0.000001
                          description: >-
                            Number of billing units expected (e.g., number of
                            images, videos, etc.)
                      required:
                        - unit_quantity
                    description: Map of endpoint IDs to unit quantities
            description: >-
              Unit price estimate: Calculates cost based on unit price × billing
              units. Useful for estimating costs when you know the expected
              output quantity.
            requiredProperties:
              - estimate_type
              - endpoints
            example: *ref_0
        examples:
          historical:
            summary: Historical API price estimate
            value:
              estimate_type: historical_api_price
              endpoints:
                fal-ai/flux/dev:
                  call_quantity: 100
                fal-ai/flux/schnell:
                  call_quantity: 50
          unit_price:
            summary: Unit price estimate
            value:
              estimate_type: unit_price
              endpoints:
                fal-ai/flux/dev:
                  unit_quantity: 50
                fal-ai/flux-pro:
                  unit_quantity: 25
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              estimate_type:
                allOf:
                  - type: string
                    enum:
                      - historical_api_price
                      - unit_price
                    description: The type of estimate that was performed
              total_cost:
                allOf:
                  - type: number
                    minimum: 0
                    description: Total estimated cost across all endpoints
              currency:
                allOf:
                  - type: string
                    minLength: 3
                    maxLength: 3
                    description: Three-letter currency code (ISO 4217, e.g., 'USD')
            description: Cost estimation response with total cost
            requiredProperties:
              - estimate_type
              - total_cost
              - currency
            example:
              estimate_type: historical_api_price
              total_cost: 3.75
              currency: USD
        examples:
          historical:
            summary: Historical API price estimate result
            value:
              estimate_type: historical_api_price
              total_cost: 3.75
              currency: USD
          unit_price:
            summary: Unit price estimate result
            value:
              estimate_type: unit_price
              total_cost: 1.88
              currency: USD
        description: Cost estimates calculated successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: validation_error
                message: Invalid request parameters
        description: Invalid request parameters
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: authorization_error
                message: Authentication required
        description: Authentication required
    '404':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: not_found
                message: Resource not found
        description: Resource not found
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: rate_limited
                message: Rate limit exceeded
        description: Rate limit exceeded
  deprecated: false
  type: path
  xMint:
    href: /platform-apis/v1/models/pricing/estimate
components:
  schemas: {}

````

# Usage

> 
Returns paginated usage records for your workspace with filters for endpoint,
user, date range, and auth method. Each item includes the billed unit
quantity and unit price used to compute cost.

**Key Features:**
- Usage data for single or multiple endpoints
- Flexible date range filtering
- User-specific usage tracking
- Detailed usage line items with unit quantity and price
- Paginated results for large datasets

**Common Use Cases:**
- Generate usage reports
- Track usage patterns
- Monitor endpoint usage across different auth methods
- Build usage dashboards and visualizations

See [fal.ai docs](https://docs.fal.ai/model-apis/faq) for more details.
    

## OpenAPI

````yaml platform-apis/openapi/v1.json get /models/usage
paths:
  path: /models/usage
  method: get
  servers:
    - url: https://api.fal.ai/v1
      description: Production server
  request:
    security:
      - title: keyAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: apiKey
              description: >-
                Admin API key must be prefixed with "Key ", e.g. Authorization:
                Key YOUR_ADMIN_API_KEY
          cookie: {}
    parameters:
      path: {}
      query:
        limit:
          schema:
            - type: integer
              required: false
              description: >-
                Maximum number of items to return. Actual maximum depends on
                query type and expansion parameters.
              minimum: 1
              example: 50
        cursor:
          schema:
            - type: string
              required: false
              description: >-
                Pagination cursor from previous response. Encodes the page
                number.
              example: Mg==
        start:
          schema:
            - type: string
              required: false
              description: >-
                Start date in ISO8601 format (e.g., '2025-01-01T00:00:00Z' or
                '2025-01-01'). Defaults to 24 hours ago.
              format: date-time
              example: '2025-01-01T00:00:00Z'
            - type: string
              required: false
              description: >-
                Start date in ISO8601 format (e.g., '2025-01-01T00:00:00Z' or
                '2025-01-01'). Defaults to 24 hours ago.
              example: '2025-01-01T00:00:00Z'
        end:
          schema:
            - type: string
              required: false
              description: >-
                End date in ISO8601 format (e.g., '2025-01-31T23:59:59Z' or
                '2025-01-31'). Defaults to current time.
              format: date-time
              example: '2025-01-31T23:59:59Z'
            - type: string
              required: false
              description: >-
                End date in ISO8601 format (e.g., '2025-01-31T23:59:59Z' or
                '2025-01-31'). Defaults to current time.
              example: '2025-01-31T23:59:59Z'
        timezone:
          schema:
            - type: string
              required: false
              description: >-
                Timezone for date aggregation and boundaries. All timestamps in
                responses are in UTC, but this controls how dates are bucketed.
              default: UTC
              example: UTC
        timeframe:
          schema:
            - type: enum<string>
              enum:
                - minute
                - hour
                - day
                - week
                - month
              required: false
              description: >-
                Aggregation timeframe for timeseries data (auto-detected from
                date range if not specified). Auto-detection uses: minute (<2h),
                hour (<2d), day (<64d), week (<183d), month (>=183d).
              example: day
        bound_to_timeframe:
          schema:
            - type: enum<string>
              enum:
                - 'true'
                - 'false'
              required: false
              description: >-
                Whether to adjust start/end dates to align with timeframe
                boundaries and use exclusive end. Defaults to true. When true,
                dates are aligned to the start of the timeframe period (e.g.,
                start of day) and end is made exclusive (e.g., start of next
                day). When false, uses exact dates provided.
              default: 'true'
              example: 'true'
        endpoint_id:
          schema:
            - type: string
              required: true
              description: >-
                Filter by specific endpoint ID(s). Must provide at least 1
                endpoint ID (1-50 models). Supports comma-separated values:
                ?endpoint_id=model1,model2 or array syntax:
                ?endpoint_id=model1&endpoint_id=model2
              example: &ref_0
                - fal-ai/flux/dev
            - type: array
              items:
                allOf:
                  - type: string
              required: true
              description: >-
                Filter by specific endpoint ID(s). Must provide at least 1
                endpoint ID (1-50 models). Supports comma-separated values:
                ?endpoint_id=model1,model2 or array syntax:
                ?endpoint_id=model1&endpoint_id=model2
              example: *ref_0
          style: form
          explode: true
        expand:
          schema:
            - type: string
              required: false
              description: >-
                Data to include in the response. Use 'time_series' for
                time-bucketed data, 'summary' for aggregate statistics, and
                'auth_method' to include authentication method information
                (formatted with user key aliases). At least one of 'time_series'
                or 'summary' is required.
              default: &ref_1
                - time_series
              example: &ref_2
                - time_series
                - auth_method
            - type: array
              items:
                allOf:
                  - type: string
              required: false
              description: >-
                Data to include in the response. Use 'time_series' for
                time-bucketed data, 'summary' for aggregate statistics, and
                'auth_method' to include authentication method information
                (formatted with user key aliases). At least one of 'time_series'
                or 'summary' is required.
              default: *ref_1
              example: *ref_2
          style: form
          explode: true
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              next_cursor:
                allOf:
                  - type:
                      - string
                      - 'null'
                    description: Cursor for the next page of results, null if no more pages
              has_more:
                allOf:
                  - type: boolean
                    description: >-
                      Boolean indicating if more results are available
                      (convenience field derived from next_cursor)
              time_series:
                allOf:
                  - type: array
                    items:
                      type: object
                      properties:
                        bucket:
                          type: string
                          description: >-
                            Time bucket timestamp in user's timezone with offset
                            (ISO8601 datetime)
                        results:
                          type: array
                          items:
                            type: object
                            properties:
                              endpoint_id:
                                type: string
                                description: >-
                                  Endpoint identifier that was used (e.g.,
                                  'fal-ai/flux/dev')
                              unit:
                                type: string
                                description: >-
                                  The billing unit (e.g., 'image', 'video', or a
                                  GPU/compute unit for some models)
                              quantity:
                                type: number
                                minimum: 0
                                description: >-
                                  Quantity of usage in the specified billing
                                  unit
                              unit_price:
                                type: number
                                minimum: 0
                                description: >-
                                  Unit price used to compute charges for this
                                  line item
                              auth_method:
                                type: string
                                description: >-
                                  Authentication method label (e.g., 'Key 1',
                                  'Key 2', 'User token'). Only populated when
                                  'auth_method' is included in expand parameter.
                            required:
                              - endpoint_id
                              - unit
                              - quantity
                              - unit_price
                            description: Usage line item with billing details
                          description: Usage records for this time bucket
                      required:
                        - bucket
                        - results
                      description: Time bucket with grouped usage records
                    description: >-
                      Time series usage data grouped by time bucket (when expand
                      includes 'time_series'). Each bucket contains all usage
                      records for that time period.
              summary:
                allOf:
                  - type: array
                    items:
                      type: object
                      properties:
                        endpoint_id:
                          type: string
                          description: >-
                            Endpoint identifier that was used (e.g.,
                            'fal-ai/flux/dev')
                        unit:
                          type: string
                          description: >-
                            The billing unit (e.g., 'image', 'video', or a
                            GPU/compute unit for some models)
                        quantity:
                          type: number
                          minimum: 0
                          description: Quantity of usage in the specified billing unit
                        unit_price:
                          type: number
                          minimum: 0
                          description: >-
                            Unit price used to compute charges for this line
                            item
                        auth_method:
                          type: string
                          description: >-
                            Authentication method label (e.g., 'Key 1', 'Key 2',
                            'User token'). Only populated when 'auth_method' is
                            included in expand parameter.
                      required:
                        - endpoint_id
                        - unit
                        - quantity
                        - unit_price
                      description: Aggregate usage statistics for the entire date range
                    description: Aggregate statistics (when expand includes 'summary')
            description: Response containing usage data with pagination support
            requiredProperties:
              - next_cursor
              - has_more
        examples:
          example:
            value:
              time_series:
                - bucket: '2025-01-15T00:00:00-05:00'
                  results:
                    - endpoint_id: fal-ai/flux/dev
                      unit: image
                      quantity: 4
                      unit_price: 0.1
                      auth_method: Production Key
              next_cursor: null
              has_more: false
        description: Usage data retrieved successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: validation_error
                message: Invalid request parameters
        description: Invalid request parameters
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: authorization_error
                message: Authentication required
        description: Authentication required
    '403':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: authorization_error
                message: Access denied
        description: Access denied
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: rate_limited
                message: Rate limit exceeded
        description: Rate limit exceeded
  deprecated: false
  type: path
  xMint:
    href: /platform-apis/v1/models/usage
components:
  schemas: {}

````

# Usage

> 
Returns paginated usage records for your workspace with filters for endpoint,
user, date range, and auth method. Each item includes the billed unit
quantity and unit price used to compute cost.

**Key Features:**
- Usage data for single or multiple endpoints
- Flexible date range filtering
- User-specific usage tracking
- Detailed usage line items with unit quantity and price
- Paginated results for large datasets

**Common Use Cases:**
- Generate usage reports
- Track usage patterns
- Monitor endpoint usage across different auth methods
- Build usage dashboards and visualizations

See [fal.ai docs](https://docs.fal.ai/model-apis/faq) for more details.
    

## OpenAPI

````yaml platform-apis/openapi/v1.json get /models/usage
paths:
  path: /models/usage
  method: get
  servers:
    - url: https://api.fal.ai/v1
      description: Production server
  request:
    security:
      - title: keyAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: apiKey
              description: >-
                Admin API key must be prefixed with "Key ", e.g. Authorization:
                Key YOUR_ADMIN_API_KEY
          cookie: {}
    parameters:
      path: {}
      query:
        limit:
          schema:
            - type: integer
              required: false
              description: >-
                Maximum number of items to return. Actual maximum depends on
                query type and expansion parameters.
              minimum: 1
              example: 50
        cursor:
          schema:
            - type: string
              required: false
              description: >-
                Pagination cursor from previous response. Encodes the page
                number.
              example: Mg==
        start:
          schema:
            - type: string
              required: false
              description: >-
                Start date in ISO8601 format (e.g., '2025-01-01T00:00:00Z' or
                '2025-01-01'). Defaults to 24 hours ago.
              format: date-time
              example: '2025-01-01T00:00:00Z'
            - type: string
              required: false
              description: >-
                Start date in ISO8601 format (e.g., '2025-01-01T00:00:00Z' or
                '2025-01-01'). Defaults to 24 hours ago.
              example: '2025-01-01T00:00:00Z'
        end:
          schema:
            - type: string
              required: false
              description: >-
                End date in ISO8601 format (e.g., '2025-01-31T23:59:59Z' or
                '2025-01-31'). Defaults to current time.
              format: date-time
              example: '2025-01-31T23:59:59Z'
            - type: string
              required: false
              description: >-
                End date in ISO8601 format (e.g., '2025-01-31T23:59:59Z' or
                '2025-01-31'). Defaults to current time.
              example: '2025-01-31T23:59:59Z'
        timezone:
          schema:
            - type: string
              required: false
              description: >-
                Timezone for date aggregation and boundaries. All timestamps in
                responses are in UTC, but this controls how dates are bucketed.
              default: UTC
              example: UTC
        timeframe:
          schema:
            - type: enum<string>
              enum:
                - minute
                - hour
                - day
                - week
                - month
              required: false
              description: >-
                Aggregation timeframe for timeseries data (auto-detected from
                date range if not specified). Auto-detection uses: minute (<2h),
                hour (<2d), day (<64d), week (<183d), month (>=183d).
              example: day
        bound_to_timeframe:
          schema:
            - type: enum<string>
              enum:
                - 'true'
                - 'false'
              required: false
              description: >-
                Whether to adjust start/end dates to align with timeframe
                boundaries and use exclusive end. Defaults to true. When true,
                dates are aligned to the start of the timeframe period (e.g.,
                start of day) and end is made exclusive (e.g., start of next
                day). When false, uses exact dates provided.
              default: 'true'
              example: 'true'
        endpoint_id:
          schema:
            - type: string
              required: true
              description: >-
                Filter by specific endpoint ID(s). Must provide at least 1
                endpoint ID (1-50 models). Supports comma-separated values:
                ?endpoint_id=model1,model2 or array syntax:
                ?endpoint_id=model1&endpoint_id=model2
              example: &ref_0
                - fal-ai/flux/dev
            - type: array
              items:
                allOf:
                  - type: string
              required: true
              description: >-
                Filter by specific endpoint ID(s). Must provide at least 1
                endpoint ID (1-50 models). Supports comma-separated values:
                ?endpoint_id=model1,model2 or array syntax:
                ?endpoint_id=model1&endpoint_id=model2
              example: *ref_0
          style: form
          explode: true
        expand:
          schema:
            - type: string
              required: false
              description: >-
                Data to include in the response. Use 'time_series' for
                time-bucketed data, 'summary' for aggregate statistics, and
                'auth_method' to include authentication method information
                (formatted with user key aliases). At least one of 'time_series'
                or 'summary' is required.
              default: &ref_1
                - time_series
              example: &ref_2
                - time_series
                - auth_method
            - type: array
              items:
                allOf:
                  - type: string
              required: false
              description: >-
                Data to include in the response. Use 'time_series' for
                time-bucketed data, 'summary' for aggregate statistics, and
                'auth_method' to include authentication method information
                (formatted with user key aliases). At least one of 'time_series'
                or 'summary' is required.
              default: *ref_1
              example: *ref_2
          style: form
          explode: true
      header: {}
      cookie: {}
    body: {}
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              next_cursor:
                allOf:
                  - type:
                      - string
                      - 'null'
                    description: Cursor for the next page of results, null if no more pages
              has_more:
                allOf:
                  - type: boolean
                    description: >-
                      Boolean indicating if more results are available
                      (convenience field derived from next_cursor)
              time_series:
                allOf:
                  - type: array
                    items:
                      type: object
                      properties:
                        bucket:
                          type: string
                          description: >-
                            Time bucket timestamp in user's timezone with offset
                            (ISO8601 datetime)
                        results:
                          type: array
                          items:
                            type: object
                            properties:
                              endpoint_id:
                                type: string
                                description: >-
                                  Endpoint identifier that was used (e.g.,
                                  'fal-ai/flux/dev')
                              unit:
                                type: string
                                description: >-
                                  The billing unit (e.g., 'image', 'video', or a
                                  GPU/compute unit for some models)
                              quantity:
                                type: number
                                minimum: 0
                                description: >-
                                  Quantity of usage in the specified billing
                                  unit
                              unit_price:
                                type: number
                                minimum: 0
                                description: >-
                                  Unit price used to compute charges for this
                                  line item
                              auth_method:
                                type: string
                                description: >-
                                  Authentication method label (e.g., 'Key 1',
                                  'Key 2', 'User token'). Only populated when
                                  'auth_method' is included in expand parameter.
                            required:
                              - endpoint_id
                              - unit
                              - quantity
                              - unit_price
                            description: Usage line item with billing details
                          description: Usage records for this time bucket
                      required:
                        - bucket
                        - results
                      description: Time bucket with grouped usage records
                    description: >-
                      Time series usage data grouped by time bucket (when expand
                      includes 'time_series'). Each bucket contains all usage
                      records for that time period.
              summary:
                allOf:
                  - type: array
                    items:
                      type: object
                      properties:
                        endpoint_id:
                          type: string
                          description: >-
                            Endpoint identifier that was used (e.g.,
                            'fal-ai/flux/dev')
                        unit:
                          type: string
                          description: >-
                            The billing unit (e.g., 'image', 'video', or a
                            GPU/compute unit for some models)
                        quantity:
                          type: number
                          minimum: 0
                          description: Quantity of usage in the specified billing unit
                        unit_price:
                          type: number
                          minimum: 0
                          description: >-
                            Unit price used to compute charges for this line
                            item
                        auth_method:
                          type: string
                          description: >-
                            Authentication method label (e.g., 'Key 1', 'Key 2',
                            'User token'). Only populated when 'auth_method' is
                            included in expand parameter.
                      required:
                        - endpoint_id
                        - unit
                        - quantity
                        - unit_price
                      description: Aggregate usage statistics for the entire date range
                    description: Aggregate statistics (when expand includes 'summary')
            description: Response containing usage data with pagination support
            requiredProperties:
              - next_cursor
              - has_more
        examples:
          example:
            value:
              time_series:
                - bucket: '2025-01-15T00:00:00-05:00'
                  results:
                    - endpoint_id: fal-ai/flux/dev
                      unit: image
                      quantity: 4
                      unit_price: 0.1
                      auth_method: Production Key
              next_cursor: null
              has_more: false
        description: Usage data retrieved successfully
    '400':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: validation_error
                message: Invalid request parameters
        description: Invalid request parameters
    '401':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: authorization_error
                message: Authentication required
        description: Authentication required
    '403':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: authorization_error
                message: Access denied
        description: Access denied
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: object
                    properties:
                      type:
                        type: string
                        enum:
                          - authorization_error
                          - validation_error
                          - not_found
                          - rate_limited
                          - server_error
                          - not_implemented
                        description: The category of error that occurred
                      message:
                        type: string
                        description: Human-readable error message
                      docs_url:
                        type: string
                        format: uri
                        description: Link to relevant documentation
                      request_id:
                        type: string
                        description: Unique request identifier for debugging
                    required:
                      - type
                      - message
                    description: Error details
            description: Standard error response format
            requiredProperties:
              - error
        examples:
          example:
            value:
              error:
                type: rate_limited
                message: Rate limit exceeded
        description: Rate limit exceeded
  deprecated: false
  type: path
  xMint:
    href: /platform-apis/v1/models/usage
components:
  schemas: {}

````


calls shoujld look like this const url = 'https://api.fal.ai/v1/models/analytics';
const options = {method: 'GET', headers: {Authorization: '<api-key>'}, body: undefined};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}