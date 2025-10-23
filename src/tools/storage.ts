/**
 * Storage and file upload tools
 */

import { readFile } from "fs/promises";
import { basename } from "path";
import { falRequest } from "../client.js";

const FAL_BASE_URL = "https://fal.ai/api";

export interface UploadResult {
  url: string;
  content_type: string;
  size: number;
  upload_id?: string;
  [key: string]: any;
}

/**
 * Upload a file to fal.ai CDN for use with models
 */
export async function uploadFile(
  filePath: string,
  contentType?: string
): Promise<UploadResult> {
  // Read file
  const fileContent = await readFile(filePath);
  const fileName = basename(filePath);

  // Auto-detect content type if not provided
  if (!contentType) {
    // Simple MIME type detection based on extension
    const ext = filePath.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      pdf: "application/pdf",
      json: "application/json",
      txt: "text/plain",
    };
    contentType = (ext && mimeTypes[ext]) || "application/octet-stream";
  }

  // Create multipart form data
  const formData = new FormData();
  const blob = new Blob([fileContent], { type: contentType });
  formData.append("file", blob, fileName);

  // Upload to fal.ai storage endpoint
  const url = `${FAL_BASE_URL}/storage/upload`;

  const apiKey = process.env.FAL_KEY;
  if (!apiKey) {
    throw new Error("FAL_KEY environment variable is not set");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Key ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: HTTP ${response.status}: ${errorText}`);
  }

  const result = (await response.json()) as Record<string, any>;

  // Add file metadata to response
  return {
    ...result,
    size: fileContent.length,
    content_type: contentType,
  } as UploadResult;
}
