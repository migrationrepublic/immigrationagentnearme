import { WordPressService } from "./wordpress.service";
import { WebsiteLead } from "@/lib/types";

/**
 * WordPressLeadService
 * 
 * Responsible for:
 * - WordPress lead sync wrapper
 * - Calling webhook processor
 * - Sync integrations
 */
export class WordPressLeadService {
  /**
   * Processes an incoming WordPress contact form submission (Elementor, CF7, etc.),
   * validates the payload with Zod, inserts it into Supabase, and returns the lead record.
   */
  static async processWPWebhook(payload: Record<string, unknown>): Promise<WebsiteLead> {
    return await WordPressService.processWPWebhook(payload);
  }
}
