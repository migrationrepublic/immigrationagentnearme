"use server";

import { z } from "zod";
import { SettingsService } from "@/lib/services/settings.service";
import { AppSettingsInput } from "@/lib/types";
import { checkIsAdminAction } from "./admin";

async function verifyAdmin() {
  return (await checkIsAdminAction()).isAdmin;
}

const optionalUrl = z.string().url("Invalid URL").optional().or(z.literal(""));

const AppSettingsInputSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  tagline: z.string().min(1),
  marn_number: z.string().min(1),
  office_address: z.string().min(1),
  contact_phone: z.string().min(1),
  contact_email: z.string().email("Invalid contact email address"),
  website_url: z.string().url("Invalid website URL"),
  logo_url: z.string().url("Invalid logo URL"),
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
  linkedin_url: optionalUrl,
  google_review_url: optionalUrl,
  invoice_prefix: z.string().min(1, "Invoice prefix is required"),
  invoice_default_terms: z.string().min(1),
  invoice_due_days: z.number().int().min(0).max(365),
  invoice_notes: z.string(),
});

export async function getAppSettingsAction() {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  return SettingsService.getSettings();
}

export async function updateAppSettingsAction(input: AppSettingsInput) {
  if (!(await verifyAdmin())) throw new Error("Unauthorized: You are not an admin.");
  const validated = AppSettingsInputSchema.parse(input);
  const settings = await SettingsService.updateSettings(validated);
  return { success: true, settings };
}
