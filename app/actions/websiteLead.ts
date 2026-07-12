"use server";

import { WordPressService } from "@/lib/services/wordpress.service";
import { z } from "zod";

const WebsiteLeadSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().optional(),
  source_url: z.string().optional(),
  wordpress_form_id: z.string().optional(),
  wordpress_lead_id: z.string().optional(),
});

export type WebsiteLeadInput = z.infer<typeof WebsiteLeadSchema>;

export async function createWebsiteLeadAction(input: WebsiteLeadInput) {
  try {
    // Validate schema
    const validated = WebsiteLeadSchema.parse(input);

    // Call WordPress Service to process and insert lead
    const lead = await WordPressService.processWPWebhook({
      name: `${validated.first_name || ""} ${validated.last_name || ""}`.trim(),
      email: validated.email,
      phone: validated.phone,
      subject: validated.subject,
      message: validated.message,
      source_url: validated.source_url,
      form_id: validated.wordpress_form_id,
      lead_id: validated.wordpress_lead_id,
    });

    return { success: true, leadId: lead.id };
  } catch (err) {
    console.error("Lead Action error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}
