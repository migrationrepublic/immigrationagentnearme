import { supabaseServer } from "@/lib/supabase-server";
import { SignatureRequest } from "@/lib/types";
import { StorageService } from "./storage.service";
import { EmailService } from "./email.service";
import { PDFDocument, rgb } from "pdf-lib";
import { AuditService } from "./audit.service";
import { randomBytes } from "crypto";

/**
 * SignatureService
 *
 * Responsible for:
 * - Generating secure tokens for signing links
 * - PNG canvas signature uploads
 * - Overlaying electronic signature drawings onto PDFs
 * - PDF stamp blocks generation (IP, user agent, UTC timestamp)
 * - Sending invitation + completion emails via EmailService
 * - Audit logs recording
 */
export class SignatureService {
  /**
   * Creates a new signature request entry for a document.
   * Generates a secure random token used in the public signing link /sign/[token].
   * Sends the invitation email automatically.
   */
  static async createSignatureRequest(input: {
    document_id: string;
    signer_email: string;
    signer_name: string;
    expires_at?: string;
    fields?: any[];
    signing_order?: number;
    signing_message?: string;
    status?: string;
  }): Promise<SignatureRequest> {
    // Generate a cryptographically secure URL-safe token
    const token = randomBytes(32).toString("hex");

    // Fetch the document name for the email
    const { data: document } = await supabaseServer
      .from("documents")
      .select("name")
      .eq("id", input.document_id)
      .maybeSingle();

    const documentName = document?.name ?? "Document";

    const { data, error } = await supabaseServer
      .from("signature_requests")
      .insert([
        {
          document_id: input.document_id,
          signer_email: input.signer_email,
          signer_name: input.signer_name,
          expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
          token,
          status: input.status ?? "sent",
          fields: input.fields ?? [],
          signing_order: input.signing_order ?? 1,
          signing_message: input.signing_message ?? null,
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("SignatureService.createSignatureRequest error:", error);
      throw new Error(`Failed to create signature request: ${error.message}`);
    }

    // Send invitation email (non-blocking — failure logged but won't throw)
    if ((input.status ?? "sent") === "sent") {
      EmailService.sendSignatureInvitation(
        input.signer_email,
        input.signer_name,
        documentName,
        token
      ).catch(e => console.error("[SignatureService] Invitation email failed:", e));
    }

    // Audit log
    await AuditService.log(
      null,
      "signature_requested",
      "signature_request",
      data.id,
      { signer_email: input.signer_email, document_id: input.document_id }
    );

    return data;
  }

  /**
   * Looks up a signature request by its public token.
   * Returns the request + the related document metadata.
   * Used by the public /sign/[token] page.
   */
  static async getRequestByToken(token: string): Promise<{
    request: SignatureRequest;
    documentName: string;
    documentPath: string;
    documentBucket: string;
    isExpired: boolean;
  } | null> {
    const { data, error } = await supabaseServer
      .from("signature_requests")
      .select("*, document:documents(name, file_path, status)")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      console.error("SignatureService.getRequestByToken error:", error);
      return null;
    }

    const requestData = data as SignatureRequest;
    const doc = requestData.document;
    if (!doc) return null;

    const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;

    // Determine which bucket the file lives in
    // Signed/filled docs are in 'signed', original uploads in 'documents'
    const documentBucket = doc.status === "approved" ? "signed" : "documents";

    return {
      request: data as SignatureRequest,
      documentName: doc.name,
      documentPath: doc.file_path,
      documentBucket,
      isExpired,
    };
  }

  /**
   * Marks a signature request as signed, uploads the signature image,
   * merges the signature image onto the PDF document with an audit trail stamp,
   * uploads the signed PDF to 'signed', sends completion emails, and logs events.
   */
  static async signDocument(
    requestId: string,
    signatureImageBase64: string,
    metadata?: { ipAddress?: string; userAgent?: string },
    fieldsInput?: any[]
  ): Promise<boolean> {
    const ipAddress = metadata?.ipAddress || "Unknown IP";
    const userAgent = metadata?.userAgent || "Unknown Agent";

    // 1. Fetch signature request + document
    const { data: request, error: fetchRequestError } = await supabaseServer
      .from("signature_requests")
      .select("*, document:documents(*)")
      .eq("id", requestId)
      .single();

    if (fetchRequestError || !request) {
      console.error("SignatureService.signDocument fetch request error:", fetchRequestError);
      return false;
    }

    const typedRequest = request as SignatureRequest;
    const document = typedRequest.document;
    if (!document) {
      console.error("SignatureService.signDocument: Document not found");
      return false;
    }

    // Check expiry
    if (request.expires_at && new Date(request.expires_at) < new Date()) {
      console.error("SignatureService.signDocument: Request is expired");
      return false;
    }

    // 2. Decode Base64 signature PNG and upload to 'signatures' bucket
    const base64Data = signatureImageBase64.replace(/^data:image\/\w+;base64,/, "");
    const signatureBuffer = Buffer.from(base64Data, "base64");
    const signatureFileName = `${requestId}_sig.png`;
    await StorageService.upload("signatures", signatureFileName, signatureBuffer, "image/png");

    // 3. Download the current unsigned/approved PDF
    let originalPdfBytes: Buffer;
    try {
      originalPdfBytes = await StorageService.download("signed", document.file_path);
    } catch {
      try {
        originalPdfBytes = await StorageService.download("documents", document.file_path);
      } catch {
        // Last resort: try templates bucket (for template-based docs)
        originalPdfBytes = await StorageService.download("templates", document.file_path);
      }
    }

    // 4. Load the PDF and embed the signature image
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    const signatureImage = await pdfDoc.embedPng(signatureBuffer);
    const pages = pdfDoc.getPages();

    // Determine placements - use fieldsInput or request.fields from database if available
    const placements = fieldsInput || typedRequest.fields || [];

    if (placements && placements.length > 0) {
      // Coordinate-based signature overlay
      const helveticaFont = await pdfDoc.embedFont("Helvetica");
      const helveticaBold = await pdfDoc.embedFont("Helvetica-Bold");

      for (const field of placements) {
        // page is 1-indexed, pdf-lib is 0-indexed
        const pageIndex = (field.page ?? 1) - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width, height } = page.getSize();

        // Convert percentage coordinates (HTML) to PDF points
        // HTML top-left (x, y) to PDF bottom-left (pdfX, pdfY)
        const pdfX = ((field.x ?? 0) / 100) * width;
        const pdfW = ((field.w ?? 20) / 100) * width;
        const pdfH = ((field.h ?? 8) / 100) * height;
        const pdfY = ((100 - (field.y ?? 0) - (field.h ?? 8)) / 100) * height;

        const type = String(field.type).toLowerCase();

        if (type === "signature" || type === "initial") {
          page.drawImage(signatureImage, {
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
          });
        } else if (type === "sign_date" || type === "date") {
          const dateText = field.value || new Date().toLocaleDateString("en-AU");
          page.drawText(dateText, {
            x: pdfX + 5,
            y: pdfY + (pdfH / 2) - 4,
            size: Math.max(8, pdfH * 0.5),
            font: helveticaFont,
            color: rgb(0.05, 0.05, 0.15),
          });
        } else if (type === "full_name" || type === "name") {
          const nameText = typedRequest.signer_name;
          page.drawText(nameText, {
            x: pdfX + 5,
            y: pdfY + (pdfH / 2) - 4,
            size: Math.max(8, pdfH * 0.5),
            font: helveticaFont,
            color: rgb(0.05, 0.05, 0.15),
          });
        } else if (type === "email") {
          const emailText = typedRequest.signer_email;
          page.drawText(emailText, {
            x: pdfX + 5,
            y: pdfY + (pdfH / 2) - 4,
            size: Math.max(8, pdfH * 0.5),
            font: helveticaFont,
            color: rgb(0.05, 0.05, 0.15),
          });
        } else if (type === "checkbox") {
          const isChecked = field.value === true || field.value === "true";
          // Draw standard check box
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: Math.min(pdfW, pdfH, 16),
            height: Math.min(pdfW, pdfH, 16),
            color: rgb(1, 1, 1),
            borderColor: rgb(0.3, 0.3, 0.4),
            borderWidth: 1,
          });
          if (isChecked) {
            page.drawText("X", {
              x: pdfX + 4,
              y: pdfY + 3,
              size: 10,
              font: helveticaBold,
              color: rgb(0.05, 0.05, 0.15),
            });
          }
        } else {
          // generic text or company or job title
          const valText = String(field.value || "");
          if (valText) {
            page.drawText(valText, {
              x: pdfX + 5,
              y: pdfY + (pdfH / 2) - 4,
              size: Math.max(8, pdfH * 0.5),
              font: helveticaFont,
              color: rgb(0.05, 0.05, 0.15),
            });
          }
        }
      }
    } else {
      // Legacy fallback: Stamp on the LAST page of the document
      const lastPage = pages[pages.length - 1];
      const { width, height } = lastPage.getSize();

      // Signature block background
      lastPage.drawRectangle({
        x: 40,
        y: 35,
        width: width - 80,
        height: 115,
        color: rgb(0.97, 0.97, 0.99),
        borderColor: rgb(0.78, 0.78, 0.85),
        borderWidth: 0.5,
      });

      // Divider line
      lastPage.drawLine({
        start: { x: 50, y: 145 },
        end: { x: width - 50, y: 145 },
        thickness: 0.8,
        color: rgb(0.7, 0.7, 0.8),
      });

      // "Digitally Signed" label
      lastPage.drawText("DIGITALLY SIGNED", {
        x: 52,
        y: 132,
        size: 6.5,
        color: rgb(0.5, 0.5, 0.6),
      });

      // Draw the signature image
      const sigDims = signatureImage.scale(0.35);
      lastPage.drawImage(signatureImage, {
        x: 52,
        y: 50,
        width: Math.min(sigDims.width, 160),
        height: Math.min(sigDims.height, 65),
      });

      // Audit text block on the right
      const textX = 230;
      lastPage.drawText(`Signed by: ${typedRequest.signer_name}`, {
        x: textX, y: 127, size: 9, color: rgb(0.05, 0.05, 0.15),
      });
      lastPage.drawText(`Email: ${typedRequest.signer_email}`, {
        x: textX, y: 113, size: 8, color: rgb(0.3, 0.3, 0.4),
      });
      lastPage.drawText(`Signed At (UTC): ${new Date().toUTCString()}`, {
        x: textX, y: 99, size: 7.5, color: rgb(0.35, 0.35, 0.45),
      });
      lastPage.drawText(`IP Address: ${ipAddress}`, {
        x: textX, y: 86, size: 7, color: rgb(0.45, 0.45, 0.55),
      });
      lastPage.drawText(`Document ID: ${document.id}`, {
        x: textX, y: 73, size: 6.5, color: rgb(0.55, 0.55, 0.65),
      });
      lastPage.drawText(`Request ID: ${requestId}`, {
        x: textX, y: 61, size: 6.5, color: rgb(0.55, 0.55, 0.65),
      });
      lastPage.drawText("Verified by Migration Republic Digital Signature System", {
        x: textX, y: 48, size: 6, color: rgb(0.6, 0.6, 0.7),
      });
    }

    // 5. Save final signed PDF
    const signedPdfBytes = await pdfDoc.save();
    const signedBuffer = Buffer.from(signedPdfBytes);

    // 6. Upload signed PDF to 'signed' bucket
    const finalFilePath = `${document.client_id}/${document.id}_signed.pdf`;
    await StorageService.upload("signed", finalFilePath, signedBuffer, "application/pdf");

    // 7. Update document record
    const { error: updateDocError } = await supabaseServer
      .from("documents")
      .update({
        file_path: finalFilePath,
        file_size: signedBuffer.length,
        mime_type: "application/pdf",
        status: "approved",
      })
      .eq("id", document.id);

    if (updateDocError) {
      console.error("SignatureService.signDocument update doc error:", updateDocError);
      return false;
    }

    // 8. Update signature request status
    const requestUpdatePayload: any = {
      status: "signed",
      signature_url: signatureFileName,
      signed_at: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent,
    };
    if (placements && placements.length > 0) {
      requestUpdatePayload.fields = placements;
    }

    const { error: updateRequestError } = await supabaseServer
      .from("signature_requests")
      .update(requestUpdatePayload)
      .eq("id", requestId);


    if (updateRequestError) {
      console.error("SignatureService.signDocument update request error:", updateRequestError);
      return false;
    }

    // 9. Generate a short-lived download URL for the signed copy
    let downloadUrl = "";
    try {
      downloadUrl = await StorageService.signedUrl("signed", finalFilePath, 604800); // 7 days
    } catch (e) {
      console.warn("[SignatureService] Could not generate download URL for emails:", e);
    }

    // 10. Send completion emails (non-blocking)
    const documentName = document.name ?? "Your Document";
    Promise.allSettled([
      // Client: "Your document is signed"
      EmailService.sendSignatureCompleted(
        request.signer_email,
        request.signer_name,
        documentName,
        downloadUrl
      ),
      // Admin: "Signed copy from client"
      EmailService.sendSignatureAdminCopy(
        request.signer_name,
        documentName,
        downloadUrl
      ),
    ]).catch(e => console.error("[SignatureService] Completion emails failed:", e));

    // 11. Check sequential signature order workflow
    try {
      const { data: activeRequests } = await supabaseServer
        .from("signature_requests")
        .select("id")
        .eq("document_id", document.id)
        .neq("status", "signed")
        .neq("status", "declined")
        .eq("signing_order", typedRequest.signing_order);

      if (activeRequests && activeRequests.length === 0) {
        const { data: siblingRequests } = await supabaseServer
          .from("signature_requests")
          .select("*")
          .eq("document_id", document.id)
          .eq("status", "draft")
          .order("signing_order", { ascending: true });

        if (siblingRequests && siblingRequests.length > 0) {
          const nextOrder = siblingRequests[0].signing_order;
          const nextSigners = siblingRequests.filter(r => r.signing_order === nextOrder);

          for (const nextSigner of nextSigners) {
            await supabaseServer
              .from("signature_requests")
              .update({ status: "sent" })
              .eq("id", nextSigner.id);

            EmailService.sendSignatureInvitation(
              nextSigner.signer_email,
              nextSigner.signer_name,
              document.name ?? "Document",
              nextSigner.token ?? nextSigner.id
            ).catch(e => console.error("[SignatureService] Sequential invitation email failed:", e));
          }
        }
      }
    } catch (siblingErr) {
      console.error("[SignatureService] Sequential check failed:", siblingErr);
    }

    // 12. Audit log
    await AuditService.log(
      document.client_id,
      "signature_signed",
      "signature_request",
      requestId,
      {
        signer_email: request.signer_email,
        document_id: document.id,
        ip_address: ipAddress,
        user_agent: userAgent,
      }
    );

    return true;
  }

  /**
   * Sends a reminder email for a pending signature request.
   */
  static async sendReminder(requestId: string): Promise<boolean> {
    const { data: request, error } = await supabaseServer
      .from("signature_requests")
      .select("*, document:documents(name)")
      .eq("id", requestId)
      .single();

    if (error || !request) {
      console.error("SignatureService.sendReminder: Request not found", error);
      return false;
    }

    if (request.status !== "sent") {
      return false; // Only remind on pending requests
    }

    const doc = (request as any).document;
    const documentName = doc?.name ?? "Document";

    return EmailService.sendSignatureReminder(
      request.signer_email,
      request.signer_name,
      documentName,
      request.token ?? requestId,
      request.expires_at ?? undefined
    );
  }

  /**
   * Declines a signature request.
   */
  static async declineSignatureRequest(requestId: string): Promise<boolean> {
    const { data: request, error: fetchError } = await supabaseServer
      .from("signature_requests")
      .select("document_id, signer_email")
      .eq("id", requestId)
      .single();

    if (fetchError) {
      console.error("SignatureService.declineSignatureRequest fetch error:", fetchError);
      return false;
    }

    const { error: updateError } = await supabaseServer
      .from("signature_requests")
      .update({ status: "declined" })
      .eq("id", requestId);

    if (updateError) {
      console.error("SignatureService.declineSignatureRequest update error:", updateError);
      return false;
    }

    await AuditService.log(
      null,
      "signature_declined",
      "signature_request",
      requestId,
      { signer_email: request.signer_email, document_id: request.document_id }
    );

    return true;
  }

  /**
   * Activates draft signature requests: updates coordinates fields,
   * sets status to 'sent' for the first group of signers (based on signing_order),
   * and sends invitation emails.
   */
  static async activateRequests(
    documentId: string,
    requests: Array<{ id: string; fields: any[] }>
  ): Promise<boolean> {
    // 1. Fetch document name
    const { data: document } = await supabaseServer
      .from("documents")
      .select("name")
      .eq("id", documentId)
      .maybeSingle();

    const documentName = document?.name ?? "Document";

    // 2. Update placements
    for (const req of requests) {
      const { error: updateErr } = await supabaseServer
        .from("signature_requests")
        .update({ fields: req.fields })
        .eq("id", req.id);
      if (updateErr) {
        console.error(`Failed to update placements for ${req.id}:`, updateErr);
        throw new Error("Failed to save field placements.");
      }
    }

    // 3. Fetch full requests
    const { data: fullRequests, error: fetchErr } = await supabaseServer
      .from("signature_requests")
      .select("*")
      .eq("document_id", documentId)
      .order("signing_order", { ascending: true });

    if (fetchErr || !fullRequests || fullRequests.length === 0) {
      console.error("activateRequests fetch error:", fetchErr);
      return false;
    }

    // 4. Send emails to the first order signers
    const minOrder = fullRequests[0].signing_order;

    for (const req of fullRequests) {
      if (req.signing_order === minOrder) {
        // Send email invitation and set to 'sent'
        await supabaseServer
          .from("signature_requests")
          .update({ status: "sent" })
          .eq("id", req.id);

        EmailService.sendSignatureInvitation(
          req.signer_email,
          req.signer_name,
          documentName,
          req.token ?? req.id
        ).catch(e => console.error("[SignatureService] Email send failed:", e));
      }
    }

    // Update document status
    await supabaseServer
      .from("documents")
      .update({ status: "pending_review" })
      .eq("id", documentId);

    return true;
  }
}
