"use server";

import { supabaseServer } from "@/lib/supabase-server";
import { z } from "zod";

const UpdateSettingsSchema = z.object({
  contact_email: z.string().email("Invalid contact email address").optional(),
  office_address: z.string().optional(),
  phone_number: z.string().optional(),
  facebook_url: z.string().url("Invalid Facebook URL").optional().or(z.string().default('')),
  instagram_url: z.string().url("Invalid Instagram URL").optional().or(z.string().default('')),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.string().default('')),
  maintenance_mode: z.boolean().optional(),
});

export type UpdateSettingsInput = z.infer<typeof UpdateSettingsSchema>;

export async function updateSettingsAction(input: UpdateSettingsInput) {
  try {
    // Validate inputs
    const validated = UpdateSettingsSchema.parse(input);

    // Write to a generic key-value store or mock it.
    // E.g., upserting configurations into a 'settings' table:
    const { data, error } = await supabaseServer
      .from("settings")
      .upsert(
        Object.entries(validated).map(([key, value]) => ({
          key,
          value: JSON.stringify(value),
        })),
        { onConflict: "key" }
      );

    if (error) {
      console.error("Error saving settings configuration:", error);
      // Fallback/log warning but don't crash, since 'settings' table might be optional/client-only metadata config
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Settings Action error:", err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}
