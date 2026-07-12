import { supabaseServer } from "@/lib/supabase-server";
import { Document, DocumentTemplate, DocumentField, DocumentStatus } from "@/lib/types";
import { AuditService } from "./audit.service";

/**
 * DocumentService
 * 
 * Responsible for:
 * - Checklist document submissions query
 * - Visa subclass templates loading
 * - Checklist inputs configurations
 * - Review status updates
 */
export class DocumentService {
  /**
   * Retrieves active document templates, optionally filtered by visa subclass.
   */
  static async getTemplates(subclass?: string): Promise<DocumentTemplate[]> {
    let query = supabaseServer
      .from("document_templates")
      .select("*")
      .eq("is_active", true);

    if (subclass) {
      query = query.eq("visa_subclass", subclass);
    }

    const { data, error } = await query;
    if (error) {
      console.error("DocumentService.getTemplates error:", error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Retrieves fields configured for a specific document template.
   */
  static async getTemplateFields(templateId: string): Promise<DocumentField[]> {
    const { data, error } = await supabaseServer
      .from("document_fields")
      .select("*")
      .eq("template_id", templateId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(`DocumentService.getTemplateFields (${templateId}) error:`, error);
      throw new Error(`Failed to fetch template fields: ${error.message}`);
    }
    return data || [];
  }

  /**
   * Registers a client document upload record.
   */
  static async createDocument(documentInput: {
    client_id: string;
    template_id?: string;
    name: string;
    file_path: string;
    file_size?: number;
    mime_type?: string;
    field_values?: any;
  }): Promise<Document> {
    const { data, error } = await supabaseServer
      .from("documents")
      .insert([
        {
          client_id: documentInput.client_id,
          template_id: documentInput.template_id,
          name: documentInput.name,
          file_path: documentInput.file_path,
          file_size: documentInput.file_size,
          mime_type: documentInput.mime_type,
          field_values: documentInput.field_values,
          status: "pending_review",
        },
      ])
      .select("*")
      .single();

    if (error) {
      console.error("DocumentService.createDocument error:", error);
      throw new Error(`Failed to insert document: ${error.message}`);
    }

    // Insert an audit log record
    await AuditService.log(
      documentInput.client_id,
      "document_uploaded",
      "document",
      data.id,
      { name: documentInput.name, file_path: documentInput.file_path }
    );

    return data;
  }

  /**
   * Updates document review status and writes audit logs.
   */
  static async reviewDocument(
    documentId: string,
    status: DocumentStatus,
    rejectionReason?: string,
    verifiedBy?: string
  ): Promise<boolean> {
    const { data: document, error: fetchError } = await supabaseServer
      .from("documents")
      .select("client_id")
      .eq("id", documentId)
      .single();

    if (fetchError) {
      console.error("DocumentService.reviewDocument fetch error:", fetchError);
      return false;
    }

    const { error: updateError } = await supabaseServer
      .from("documents")
      .update({
        status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
        verified_by: verifiedBy || null,
      })
      .eq("id", documentId);

    if (updateError) {
      console.error("DocumentService.reviewDocument update error:", updateError);
      return false;
    }

    // Insert an audit log record
    await AuditService.log(
      verifiedBy || document.client_id,
      status === "approved" ? "document_approved" : "document_rejected",
      "document",
      documentId,
      status === "rejected" ? { rejection_reason: rejectionReason } : {}
    );

    return true;
  }
}
