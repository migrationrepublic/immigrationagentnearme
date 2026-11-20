import { PDFDocument } from "@cantoo/pdf-lib";

/**
 * Opens an existing PDF for editing (stamping signatures, filling forms, merging).
 *
 * Uses @cantoo/pdf-lib, a maintained fork of pdf-lib that can DECRYPT PDFs.
 * Many government forms (e.g. Home Affairs Form 1006 saved in Adobe Reader) are
 * encrypted with only an owner password: they open in any viewer, but plain
 * pdf-lib can't read their encrypted page structure. Passing an empty user
 * password decrypts them; the saved output is an unencrypted, normal PDF.
 *
 * PDFs that need a real password to open still fail here — callers turn that
 * into a friendly "password-protected" message.
 */
export async function loadPdf(bytes: ArrayBuffer | Uint8Array): Promise<PDFDocument> {
  const doc = await PDFDocument.load(bytes, { password: "" });
  // Parse the page tree now so a broken file fails here, not halfway through stamping.
  if (doc.getPages().length === 0) throw new Error("PDF has no readable pages");
  return doc;
}
