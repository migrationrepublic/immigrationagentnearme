"use server";

import { StorageService } from "@/lib/services/storage.service";
import { ErrorService } from "@/lib/services/error.service";
import { checkIsAdminAction } from "./admin";

/**
 * Server Action: Uploads a file sent from client as Base64 to a storage bucket.
 * Enforces admin role check for templates bucket.
 */
export async function uploadFileAction(payload: {
  bucket: string;
  path: string;
  base64Data: string;
  mimeType?: string;
}) {
  try {
    // 1. Authorization check for templates/temporary admin configs
    if (payload.bucket === "templates") {
      const adminCheck = await checkIsAdminAction();
      if (!adminCheck.isAdmin) {
        return { success: false, error: "Unauthorized upload" };
      }
    }

    // 2. Decode base64 body to a Node Buffer
    const buffer = Buffer.from(payload.base64Data, "base64");
    
    // 3. Delegate to central StorageService
    const uploadedPath = await StorageService.upload(
      payload.bucket,
      payload.path,
      buffer,
      payload.mimeType
    );

    return { success: true, path: uploadedPath };
  } catch (error) {
    return ErrorService.handle(error, "uploadFileAction");
  }
}

/**
 * Server Action: Generates a signed download URL for a file.
 */
export async function getSignedUrlAction(payload: {
  bucket: string;
  path: string;
  expiresIn?: number;
}): Promise<{ success: true; signedUrl: string } | { success: false; error: string }> {
  try {
    const url = await StorageService.signedUrl(
      payload.bucket,
      payload.path,
      payload.expiresIn
    );

    return { success: true, signedUrl: url };
  } catch (error) {
    return ErrorService.handle(error, "getSignedUrlAction");
  }
}

/**
 * Server Action: Deletes a file from a storage bucket.
 */
export async function deleteFileAction(payload: {
  bucket: string;
  path: string;
}) {
  try {
    const adminCheck = await checkIsAdminAction();
    if (!adminCheck.isAdmin) {
      return { success: false, error: "Unauthorized deletion" };
    }

    const deleted = await StorageService.delete(payload.bucket, payload.path);
    return { success: true, deleted };
  } catch (error) {
    return ErrorService.handle(error, "deleteFileAction");
  }
}
