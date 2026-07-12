import { supabaseServer } from "@/lib/supabase-server";

/**
 * AuditService
 * 
 * Responsible for:
 * - Centralized security audit logging
 * - Record creation in audit_logs table
 * - Action parameters formatting
 */
export class AuditService {
  /**
   * Inserts a security audit trail record into the database.
   */
  static async log(
    userId: string | null,
    action: string,
    entityType: string,
    entityId: string | null,
    details: Record<string, unknown> = {}
  ): Promise<boolean> {
    try {
      const { error } = await supabaseServer
        .from("audit_logs")
        .insert([
          {
            user_id: userId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            details,
          },
        ]);

      if (error) {
        console.error("AuditService.log insertion failed:", error);
        return false;
      }
      return true;
    } catch (e) {
      console.error("AuditService.log error:", e);
      return false;
    }
  }
}
