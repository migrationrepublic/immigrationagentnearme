"use server";

import { StorageService } from "@/lib/services/storage.service";
import { ErrorService } from "@/lib/services/error.service";
import { checkIsAdminAction } from "./admin";
import { supabaseServer } from "@/lib/supabase-server";

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
        return { success: false, error: "You don't have permission to upload files. Please sign in as an admin." };
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
    return ErrorService.handle(error, "uploadFileAction", null, false, "We couldn't upload the file. Please try again.");
  }
}

/**
 * Server Action: Issues a one-time signed UPLOAD token so the browser can send
 * the file straight to Supabase Storage.
 *
 * Use this instead of `uploadFileAction` for anything that may exceed ~700KB:
 * Server Action request bodies are capped at 1MB by Next.js (and ~4.5MB by most
 * serverless hosts), and base64 inflates files by ~33%. Exceeding the cap
 * surfaces in production only as an opaque "Server Components render" 500.
 */
export async function createSignedUploadUrlAction(payload: {
  bucket: string;
  path: string;
}): Promise<
  { success: true; path: string; token: string } | { success: false; error: string }
> {
  try {
    const adminCheck = await checkIsAdminAction();
    if (!adminCheck.isAdmin) {
      return { success: false, error: "You don't have permission to upload files. Please sign in as an admin." };
    }

    const { data, error } = await supabaseServer.storage
      .from(payload.bucket)
      .createSignedUploadUrl(payload.path, { upsert: true });

    if (error || !data) {
      throw new Error(`Could not prepare upload: ${error?.message ?? "unknown error"}`);
    }

    return { success: true, path: data.path, token: data.token };
  } catch (error) {
    return ErrorService.handle(error, "createSignedUploadUrlAction", null, false, "We couldn't prepare the upload. Please try again.");
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
    return ErrorService.handle(error, "getSignedUrlAction", null, false, "We couldn't open this file. It may have been moved or deleted.");
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
      return { success: false, error: "You don't have permission to delete files." };
    }

    const deleted = await StorageService.delete(payload.bucket, payload.path);
    return { success: true, deleted };
  } catch (error) {
    return ErrorService.handle(error, "deleteFileAction", null, false, "We couldn't delete the file. Please try again.");
  }
}
