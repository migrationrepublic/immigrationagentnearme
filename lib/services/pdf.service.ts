import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup, PDFOptionList } from "pdf-lib";
import { supabaseServer } from "@/lib/supabase-server";
import { StorageService } from "./storage.service";
import { Booking } from "@/lib/types";

export interface AcroFormFieldInfo {
  name: string;
  type: string;
}

/**
 * PDFService
 * 
 * Responsible for:
 * - AcroForm extraction and keys discovery
 * - Populating PDF form field values
 * - Target document generation using pdf-lib
 * - File uploads
 */
export class PDFService {
  /**
   * Reads fillable AcroForm fields from a PDF buffer.
   */
  static async readAcroForm(pdfBuffer: Buffer): Promise<AcroFormFieldInfo[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();

      return fields.map((field) => {
        const name = field.getName();
        let type = "Unknown";

        if (field instanceof PDFTextField) type = "Text";
        else if (field instanceof PDFCheckBox) type = "Checkbox";
        else if (field instanceof PDFDropdown) type = "Dropdown";
        else if (field instanceof PDFRadioGroup) type = "RadioGroup";
        else if (field instanceof PDFOptionList) type = "OptionList";

        return { name, type };
      });
    } catch (e: any) {
      console.error("PDFService.readAcroForm error:", e);
      throw new Error(`Failed to read PDF form fields: ${e.message}`);
    }
  }

  /**
   * Merges multiple PDF buffers into a single PDF buffer.
   */
  static async mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
    try {
      const mergedPdf = await PDFDocument.create();
      for (const buffer of pdfBuffers) {
        const pdf = await PDFDocument.load(buffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const mergedPdfBytes = await mergedPdf.save();
      return Buffer.from(mergedPdfBytes);
    } catch (e: any) {
      console.error("PDFService.mergePdfs error:", e);
      throw new Error(`Failed to merge PDF files: ${e.message}`);
    }
  }

  /**
   * Fills an AcroForm PDF buffer using standard key-value maps.
   */
  static async fillAcroForm(templatePdfBuffer: Buffer, fieldValues: Record<string, string | boolean>): Promise<Buffer> {
    try {
      const pdfDoc = await PDFDocument.load(templatePdfBuffer);
      const form = pdfDoc.getForm();

      for (const [key, value] of Object.entries(fieldValues)) {
        try {
          const field = form.getField(key);
          if (field instanceof PDFTextField) {
            field.setText(String(value));
          } else if (field instanceof PDFCheckBox) {
            const isChecked = 
              value === "true" || 
              value === "yes" || 
              value === "1" || 
              value === "checked" || 
              value === "on" ||
              value === true;
              
            if (isChecked) {
              field.check();
            } else {
              field.uncheck();
            }
          } else if (field instanceof PDFDropdown) {
            field.select(String(value));
          } else if (field instanceof PDFRadioGroup) {
            field.select(String(value));
          } else if (field instanceof PDFOptionList) {
            field.select(String(value));
          }
        } catch (fieldError) {
          // Log warn but continue processing other fields
          console.warn(`Could not fill field "${key}":`, fieldError);
        }
      }

      const filledPdfBytes = await pdfDoc.save();
      return Buffer.from(filledPdfBytes);
    } catch (e) {
      console.error("PDFService.fillAcroForm error:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to fill PDF form: ${errMsg}`);
    }
  }

  /**
   * Retrieves a client's document submission data, retrieves its matching template,
   * fills the template PDF form using the mapped fields, and uploads the generated PDF to storage.
   */
  static async generateDocument(documentId: string): Promise<string> {
    // 1. Fetch document and template info
    const { data: document, error: docError } = await supabaseServer
      .from("documents")
      .select("*, templates:document_templates(*)")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      throw new Error(`Document fetch failed: ${docError?.message || "Document not found"}`);
    }

    const template = document.templates;
    if (!template || !template.file_path) {
      throw new Error("This document template does not configure an original fillable PDF template file");
    }

    // 2. Fetch configured field mapping keys (pdf_field_name values)
    const { data: fields, error: fieldsError } = await supabaseServer
      .from("document_fields")
      .select("field_name, pdf_field_name")
      .eq("template_id", template.id);

    if (fieldsError || !fields) {
      throw new Error(`Failed to retrieve fields checklist: ${fieldsError?.message}`);
    }

    // 3. Match inputs from document.field_values into pdf field keys
    const rawValues = document.field_values || {};
    const pdfFormValues: Record<string, string> = {};

    for (const field of fields) {
      if (field.pdf_field_name) {
        const inputVal = rawValues[field.field_name];
        if (inputVal !== undefined && inputVal !== null) {
          pdfFormValues[field.pdf_field_name] = String(inputVal);
        }
      }
    }

    // 4. Download template file from storage
    const templateBytes = await StorageService.download("templates", template.file_path);

    // 5. Fill PDF form using pdf-lib
    const filledBytes = await this.fillAcroForm(templateBytes, pdfFormValues);

    // 6. Upload output file into 'signed' bucket
    const targetFilePath = `${document.client_id}/${document.id}_final.pdf`;
    await StorageService.upload("signed", targetFilePath, filledBytes, "application/pdf");

    // 7. Update document path and status in DB
    const { error: updateError } = await supabaseServer
      .from("documents")
      .update({
        file_path: targetFilePath,
        file_size: filledBytes.length,
        mime_type: "application/pdf",
        status: "approved"
      })
      .eq("id", documentId);

    if (updateError) {
      throw new Error(`Failed to update generated document record: ${updateError.message}`);
    }

    return targetFilePath;
  }

  /**
   * Generates a text-based simulated PDF buffer for a booking summary.
   */
  static async generateBookingSummaryPDF(booking: Booking): Promise<Buffer> {
    const lines = [
      "%PDF-1.4 (Simulated PDF Buffer for Migration Consultation)",
      "===========================================================",
      `BOOKING SUMMARY RECORD: ${booking.id}`,
      `Generated At: ${new Date().toISOString()}`,
      "-----------------------------------------------------------",
      `Client Name:  ${booking.name}`,
      `Client Email: ${booking.email}`,
      `Client Phone: ${booking.phone}`,
      `Selected Date: ${booking.date}`,
      `Selected Time: ${booking.time}`,
      `Status:        ${booking.status.toUpperCase()}`,
      `Stripe Ref:    ${booking.stripe_session_id || "N/A"}`,
      "-----------------------------------------------------------",
      "Notes:",
      booking.notes || "None",
      "===========================================================",
      "Office Address: 470 St Kilda Road, Melbourne, VIC 3004",
      "Migration Republic © 2026. All rights reserved.",
      "%%EOF"
    ];

    const content = lines.join("\n");
    return Buffer.from(content, "utf-8");
  }

  /**
   * Generates a text-based simulated PDF buffer for a client agreement.
   */
  static async generateAgreementPDF(clientName: string, details: {
    visaSubclass: string;
    agreedPriceAud: number;
    agentName?: string;
  }): Promise<Buffer> {
    const lines = [
      "%PDF-1.4 (Simulated Client Agreement PDF)",
      "===========================================================",
      "MIGRATION SERVICES CLIENT AGREEMENT",
      "-----------------------------------------------------------",
      `Client:                  ${clientName}`,
      `Visa Subclass Pathway:   Subclass ${details.visaSubclass}`,
      `Professional Fee:        $${(details.agreedPriceAud / 100).toFixed(2)} AUD`,
      `Registered Agent:        ${details.agentName || "Ali (Principal Agent)"}`,
      `Agreement Created:       ${new Date().toLocaleDateString("en-AU")}`,
      "-----------------------------------------------------------",
      "TERMS & CONDITIONS OF SERVICE:",
      "1. Migration Republic agrees to act on behalf of the client to submit application materials.",
      "2. Fees are non-refundable after skills assessment lodgment.",
      "3. All advice is given based on current MARA guidelines.",
      "-----------------------------------------------------------",
      "Signatures:",
      "Migration Republic: [Signed Ali]",
      `Client:            [Authorized via SignatureRequest]`,
      "===========================================================",
      "%%EOF"
    ];

    const content = lines.join("\n");
    return Buffer.from(content, "utf-8");
  }
}
