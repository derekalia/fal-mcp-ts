/**
 * Storage and file upload tools
 */

import { readFile } from "fs/promises";
import { basename } from "path";
import { falRequest } from "../client.js";

const FAL_REST_URL = "https://rest.alpha.fal.ai";

export interface UploadResult {
  url: string;
  content_type: string;
  size: number;
  upload_id?: string;
  [key: string]: any;
}

interface InitiateUploadResponse {
  file_url: string;
  upload_url: string;
}

/**
 * Upload a file to fal.ai CDN for use with models
 * Uses the two-step upload process: initiate then upload
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

  // Step 1: Initiate upload
  const initiateUrl = `${FAL_REST_URL}/storage/upload/initiate?storage_type=fal-cdn-v3`;
  const initiateResponse = await falRequest<InitiateUploadResponse>(initiateUrl, {
    method: "POST",
    body: JSON.stringify({
      content_type: contentType,
      file_name: fileName,
    }),
  });

  const { upload_url: uploadUrl, file_url: fileUrl } = initiateResponse;

  // Step 2: Upload file content to the upload URL
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    body: fileContent,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Upload failed: HTTP ${uploadResponse.status}: ${errorText}`);
  }

  // Return the file URL and metadata
  return {
    url: fileUrl,
    size: fileContent.length,
    content_type: contentType,
  } as UploadResult;
}
