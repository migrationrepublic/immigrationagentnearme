import { supabaseServer } from "@/lib/supabase-server";

/**
 * StorageService
 * 
 * Responsible for:
 * - Uploads to storage buckets (templates, documents, signed, signatures)
 * - Binary downloads from Supabase
 * - Secure signed download url generation
 * - Object deletions
 */
export class StorageService {
  /**
   * Uploads a file buffer/blob/arraybuffer to a specific bucket.
   */
  static async upload(
    bucket: string,
    path: string,
    fileBody: Buffer | ArrayBuffer | Blob,
    mimeType?: string
  ): Promise<string> {
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .upload(path, fileBody, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error(`StorageService.upload error in bucket ${bucket} path ${path}:`, error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    return data.path;
  }

  /**
   * Downloads a file's binary content from a specific bucket.
   */
  static async download(bucket: string, path: string): Promise<Buffer> {
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error(`StorageService.download error in bucket ${bucket} path ${path}:`, error);
      throw new Error(`Download failed: ${error.message}`);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Deletes a file from a specific bucket.
   */
  static async delete(bucket: string, path: string): Promise<boolean> {
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error(`StorageService.delete error in bucket ${bucket} path ${path}:`, error);
      return false;
    }

    return !!(data && data.length > 0);
  }

  /**
   * Generates a temporary signed download link for a file.
   */
  static async signedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`StorageService.signedUrl error in bucket ${bucket} path ${path}:`, error);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }

    return data.signedUrl;
  }
}
