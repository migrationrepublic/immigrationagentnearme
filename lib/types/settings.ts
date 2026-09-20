export interface AppSettings {
  id: number;

  // Business Info & Branding
  business_name: string;
  tagline: string;
  marn_number: string;
  office_address: string;
  contact_phone: string;
  contact_email: string;
  website_url: string;
  logo_url: string;
  facebook_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  google_review_url?: string | null;

  // Invoice Defaults
  invoice_prefix: string;
  invoice_default_terms: string;
  invoice_due_days: number;
  invoice_notes: string;

  updated_at?: string;
}

export type AppSettingsInput = Omit<AppSettings, "id" | "updated_at">;
