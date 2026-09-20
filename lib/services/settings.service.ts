import { supabaseServer } from "@/lib/supabase-server";
import { AppSettings, AppSettingsInput } from "@/lib/types";

/** Used only if the app_settings row/table doesn't exist yet (migration not run), so nothing crashes. */
const FALLBACK_SETTINGS: AppSettings = {
  id: 1,
  business_name: "Migration Republic",
  tagline: "Registered Migration Agents",
  marn_number: "2518961",
  office_address: "470 St Kilda Road, Melbourne, VIC 3004",
  contact_phone: "+61 435 321 219",
  contact_email: "info@migrationrepublic.com.au",
  website_url: "https://migrationrepublic.com.au",
  logo_url: "https://immigrationagentnearme.com/images/logo.jpg",
  facebook_url: "https://www.facebook.com/",
  instagram_url: "https://www.instagram.com/",
  linkedin_url: "https://www.linkedin.com/",
  google_review_url: "https://g.page/r/CblNnrjAvvg5EAI/review",
  invoice_prefix: "INV-",
  invoice_default_terms: "Due on Receipt",
  invoice_due_days: 0,
  invoice_notes: "Bank Details:\nName: Migration Republic | BSB: 063-620 | ACC No.: 1123-5022",
};

/**
 * SettingsService
 *
 * Responsible for reading/writing the single app_settings row that drives
 * business info, branding, and invoice defaults across emails, invoice PDFs,
 * and the admin UI — so an admin can change these without a code change.
 */
export class SettingsService {
  static async getSettings(): Promise<AppSettings> {
    const { data, error } = await supabaseServer.from("app_settings").select("*").eq("id", 1).maybeSingle();

    if (error) {
      console.error("SettingsService.getSettings error:", error);
      return FALLBACK_SETTINGS;
    }
    return data || FALLBACK_SETTINGS;
  }

  static async updateSettings(input: AppSettingsInput): Promise<AppSettings> {
    const { data, error } = await supabaseServer
      .from("app_settings")
      .upsert({ id: 1, ...input, updated_at: new Date().toISOString() })
      .select("*")
      .single();

    if (error || !data) {
      console.error("SettingsService.updateSettings error:", error);
      throw new Error(`Failed to update settings: ${error?.message}`);
    }
    return data;
  }
}
