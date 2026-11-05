'use client'

import { PDFDocument } from 'pdf-lib'
import { supabase } from '@/lib/supabase'
import { createSignedUploadUrlAction } from '@/app/actions/storage'
import { UserFacingError } from '@/lib/errors'

/**
 * Uploads a file from the browser directly to Supabase Storage.
 *
 * The server only issues a signed upload token (tiny request); the file bytes
 * go browser → Supabase, so they never hit the Next.js Server Action body
 * limit (1MB by default) or the hosting platform's request size cap.
 */
export async function uploadFileDirect(
  bucket: string,
  path: string,
  file: Blob,
  contentType = 'application/pdf'
): Promise<string> {
  const signed = await createSignedUploadUrlAction({ bucket, path })
  // Server already returns a user-friendly message
  if (!signed.success) throw new UserFacingError(signed.error)

  const { data, error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType, upsert: true })

  // Raw storage error: translated to friendly text by toUserMessage() in the caller
  if (error || !data) throw new Error(`Upload failed: ${error?.message ?? 'unknown error'}`, { cause: error })
  return data.path
}

/**
 * Merges several PDFs into one, entirely in the browser.
 * `ignoreEncryption` lets owner-password-protected government forms load
 * (they're openable without a password but flagged as encrypted).
 */
export async function mergePdfFiles(files: Blob[]): Promise<Blob> {
  const merged = await PDFDocument.create()
  for (const file of files) {
    let src: PDFDocument
    try {
      src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
    } catch (err) {
      const name = file instanceof File ? `"${file.name}"` : 'One of the files'
      throw new UserFacingError(`${name} couldn't be opened. Please make sure it is a valid PDF.`, { cause: err })
    }
    const pages = await merged.copyPages(src, src.getPageIndices())
    pages.forEach(p => merged.addPage(p))
  }
  const bytes = await merged.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}
