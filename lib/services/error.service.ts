import { AuditService } from "./audit.service";

/**
 * ErrorService
 * 
 * Responsible for:
 * - Standardizing error formatting and logging
 * - Safe console warning prints
 * - Triggering audit log trails for critical database/auth errors
 * - Returning clean, user-friendly error contracts
 */
export class ErrorService {
  /**
   * Standardized handler for all backend and service errors.
   * Logs details and optionally logs an event in the audit trail.
   */
  static handle(
    error: unknown,
    contextName: string,
    userId: string | null = null,
    triggerAudit = false
  ): { success: false; error: string } {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const logMessage = `[ERROR] In ${contextName}: ${rawMessage}`;
    
    // 1. Centralized console logging
    console.error(logMessage, error);

    // 2. Optional centralized audit trail insertion for security errors
    if (triggerAudit) {
      AuditService.log(
        userId,
        "system_error",
        "error_service",
        null,
        { context: contextName, message: rawMessage }
      ).catch(e => console.error("ErrorService failed to record audit log:", e));
    }

    // 3. User-friendly normalized response object
    return {
      success: false,
      error: `Error in ${contextName}: ${rawMessage}`,
    };
  }
}
