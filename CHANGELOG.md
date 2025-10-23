# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-10-23

### Fixed
- Fixed search functionality to use the correct API endpoint with `keywords` parameter
- Fixed response structure to handle `items` field from fal.ai API (was incorrectly expecting `models`)
- Updated schema endpoint to use the correct OpenAPI endpoint that matches Python implementation
- Fixed TypeScript build errors related to duplicate property declarations

### Changed
- Search now uses server-side filtering via `keywords` parameter instead of client-side filtering
- All model discovery tools now properly transform API response structure

## [1.0.2] - 2025-10-23

### Changed
- Implemented client-side filtering for search (temporary solution, now fixed in 1.0.3)

## [1.0.1] - 2025-10-23

### Fixed
- Added explicit GET method to result and status endpoints
- Fixed schema endpoint to use full app_id directly
- Added default GET method to publicRequest
- Fixed undefined args parameter in tool handlers

## [1.0.0] - 2025-10-23

### Added
- Initial release of TypeScript MCP server for fal.ai
- Model discovery tools: `models`, `search`, `schema`
- Generation tools: `generate`, `result`, `status`, `cancel`
- Storage tool: `upload`
- Full TypeScript support with type definitions
- Comprehensive documentation and examples
- Support for Claude Desktop, Cursor, and other MCP clients
- Environment-based API key configuration

### Features
- List and search fal.ai model gallery
- Get detailed model schemas
- Generate content using AI models (images, videos, etc.)
- Queue management for long-running generations
- File upload to fal.ai CDN
- Proper error handling and validation

### Technical
- Built with @modelcontextprotocol/sdk
- Uses @fal-ai/client for API interactions
- ES2022 target with Node 18+ support
- TypeScript 5.7+ with strict mode
- Source maps and type declarations included
