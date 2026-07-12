"use server";

import { DocumentService } from "@/lib/services/document.service";
import { PDFService } from "@/lib/services/pdf.service";
import { StorageService } from "@/lib/services/storage.service";
import { supabaseServer } from "@/lib/supabase-server";
import { z } from "zod";

// Zod Validation Schemas
const UploadDocumentSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  template_id: z.string().uuid("Invalid template ID").optional(),
  name: z.string().min(1, "Document name is required"),
  file_path: z.string().min(1, "File path is required"),
  file_size: z.number().int().positive().optional(),
  mime_type: z.string().optional(),
  field_values: z.any().optional(),
});

const ReviewDocumentSchema = z.object({
  document_id: z.string().uuid("Invalid document ID"),
  status: z.enum(["pending_review", "approved", "rejected"]),
  rejection_reason: z.string().optional(),
  verified_by: z.string().uuid("Invalid verifier ID").optional(),
});

const MappingItemSchema = z.object({
  fieldId: z.string().uuid("Invalid field ID"),
  pdfFieldName: z.string().min(1, "PDF form field name is required"),
});

const SaveMappingsSchema = z.object({
  templateId: z.string().uuid("Invalid template ID"),
  mappings: z.array(MappingItemSchema),
});

export type UploadDocumentInput = z.infer<typeof UploadDocumentSchema>;
export type ReviewDocumentInput = z.infer<typeof ReviewDocumentSchema>;
export type SaveMappingsInput = z.infer<typeof SaveMappingsSchema>;

export async function uploadDocumentAction(input: UploadDocumentInput) {
  try {
    const validated = UploadDocumentSchema.parse(input);
    const doc = await DocumentService.createDocument(validated);
    return { success: true, documentId: doc.id };
  } catch (err) {
    console.error("Document upload action error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

export async function reviewDocumentAction(input: ReviewDocumentInput) {
  try {
    const validated = ReviewDocumentSchema.parse(input);
    const success = await DocumentService.reviewDocument(
      validated.document_id,
      validated.status,
      validated.rejection_reason,
      validated.verified_by
    );
    if (!success) {
      return { success: false, error: "Review update failed" };
    }
    return { success: true };
  } catch (err) {
    console.error("Document review action error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Downloads a template PDF form from storage and extracts fillable fields.
 */
export async function extractPdfFieldsAction(filePathInput: string) {
  try {
    const filePath = z.string().min(1, "File path is required").parse(filePathInput);

    // Download PDF from 'templates' bucket
    const pdfBuffer = await StorageService.download("templates", filePath);

    // Extract fields
    const fields = await PDFService.readAcroForm(pdfBuffer);

    return { success: true, fields };
  } catch (err) {
    console.error("extractPdfFieldsAction error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Saves mappings between database custom template fields and AcroForm fillable field keys.
 */
export async function saveFieldMappingsAction(input: SaveMappingsInput) {
  try {
    const validated = SaveMappingsSchema.parse(input);

    // Update each field record mapping key
    for (const mapping of validated.mappings) {
      const { error } = await supabaseServer
        .from("document_fields")
        .update({ pdf_field_name: mapping.pdfFieldName })
        .eq("id", mapping.fieldId)
        .eq("template_id", validated.templateId);

      if (error) {
        throw new Error(`Failed to update field ${mapping.fieldId}: ${error.message}`);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("saveFieldMappingsAction error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Generates a filled PDF preview entirely in-memory for the admin PDF Field Mapper.
 *
 * Strategy:
 *   1. Load template PDF from storage
 *   2. Fetch the saved pdf_field_name mappings for the template's fields
 *   3. Map sandbox input values (field_name → value) through the saved pdf_field_name keys
 *   4. Fill the AcroForm PDF in-memory using pdf-lib
 *   5. Return a base64 data URI — no DB writes, no temp records, no FK constraints
 *
 * @param templateIdInput - UUID of the document template
 * @param sandboxValuesInput - Record of { field_name: value } from the sandbox inputs
 */
export async function previewFillPdfAction(
  templateIdInput: string,
  sandboxValuesInput: Record<string, string>
) {
  try {
    const templateId = z.string().uuid("Invalid template ID").parse(templateIdInput);
    const sandboxValues = z.record(z.string(), z.string()).parse(sandboxValuesInput);

    // 1. Fetch the template record to get file_path
    const { data: template, error: templateError } = await supabaseServer
      .from("document_templates")
      .select("id, file_path")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateError?.message ?? "unknown error"}`);
    }

    if (!template.file_path) {
      throw new Error("This template has no PDF file uploaded. Please upload a PDF first.");
    }

    // 2. Fetch saved pdf_field_name mappings for this template's fields
    const { data: fields, error: fieldsError } = await supabaseServer
      .from("document_fields")
      .select("field_name, pdf_field_name")
      .eq("template_id", templateId)
      .not("pdf_field_name", "is", null);

    if (fieldsError) {
      throw new Error(`Failed to fetch field mappings: ${fieldsError.message}`);
    }

    // 3. Build the pdf key→value map: sandbox[field_name] → pdfFormValues[pdf_field_name]
    const pdfFormValues: Record<string, string> = {};
    for (const field of fields ?? []) {
      if (field.pdf_field_name && sandboxValues[field.field_name] !== undefined) {
        pdfFormValues[field.pdf_field_name] = String(sandboxValues[field.field_name]);
      }
    }

    // 4. Download template PDF from storage
    const templateBytes = await StorageService.download("templates", template.file_path);

    // 5. Fill the PDF in-memory using PDFService
    const filledBytes = await PDFService.fillAcroForm(templateBytes, pdfFormValues);

    // 6. Return as base64 data URI — no upload, no DB write
    const base64 = filledBytes.toString("base64");
    const dataUri = `data:application/pdf;base64,${base64}`;

    return { success: true, dataUri };
  } catch (err) {
    console.error("previewFillPdfAction error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Generates the merged document PDF, uploads it to storage, and flags the document approved.
 * Used for final document generation — NOT for admin preview (use previewFillPdfAction for that).
 */
export async function generateFilledDocumentAction(documentIdInput: string) {
  try {
    const documentId = z.string().uuid("Invalid document ID").parse(documentIdInput);

    const generatedPath = await PDFService.generateDocument(documentId);

    return { success: true, filePath: generatedPath };
  } catch (err) {
    console.error("generateFilledDocumentAction error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}

/**
 * Server Action: Merges multiple base64-encoded PDFs into a single base64-encoded PDF.
 */
export async function mergePdfsAction(pdfBase64s: string[]) {
  try {
    const buffers = pdfBase64s.map(base64 => Buffer.from(base64, "base64"));
    const mergedBuffer = await PDFService.mergePdfs(buffers);
    const mergedBase64 = mergedBuffer.toString("base64");
    return { success: true, base64Data: mergedBase64 };
  } catch (err) {
    console.error("mergePdfsAction error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}
