"use server";

import { supabaseServer } from '@/lib/supabase-server';
import { sendToolLeadAdminAlert, sendToolResultClientEmail } from '@/lib/email';
import { z } from "zod";

const ToolLeadSchema = z.object({
  tool_name: z.string().min(1, "Tool name is required"),
  user_name: z.string().min(2, "Name is required"),
  user_email: z.string().email("Invalid email address"),
  user_phone: z.string().optional(),
  results: z.record(z.string(), z.unknown()),
});

export type ToolLeadInput = z.infer<typeof ToolLeadSchema>;

export async function submitToolLead(formData: ToolLeadInput) {
  try {
    // Validate payload
    const validated = ToolLeadSchema.parse(formData);

    const { data, error } = await supabaseServer
      .from('tool_submissions')
      .insert([
        {
          tool_name: validated.tool_name,
          user_name: validated.user_name,
          user_email: validated.user_email,
          user_phone: validated.user_phone,
          results: validated.results,
        },
      ]);

    if (error) {
      console.error('Error saving tool lead:', error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { success: false, error: 'Database table missing. Please run tool_leads_schema.sql in Supabase.' };
      }
      return { success: false, error: error.message };
    }

    function formatResultsToHTML(obj: unknown): string {
      if (!obj) return 'N/A';
      if (typeof obj !== 'object') return String(obj);
      
      if (Array.isArray(obj)) {
        return `<ul style="margin: 0; padding-left: 20px;">` + 
               obj.map(item => `<li style="margin-bottom: 8px;">${formatResultsToHTML(item)}</li>`).join('') + 
               `</ul>`;
      }

      let html = `<div style="display: flex; flex-direction: column; gap: 4px;">`;
      for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        if (typeof value === 'object' && value !== null) {
          html += `<div style="margin-bottom: 8px;"><strong>${formattedKey}:</strong><div style="margin-top: 4px; padding-left: 10px; border-left: 2px solid #ccc;">${formatResultsToHTML(value)}</div></div>`;
        } else {
          html += `<div><strong>${formattedKey}:</strong> ${value}</div>`;
        }
      }
      html += `</div>`;
      return html;
    }

    // Send emails
    const resultsSummary = formatResultsToHTML(validated.results);

    await sendToolLeadAdminAlert(
      validated.user_name,
      validated.user_email,
      validated.user_phone,
      validated.tool_name,
      resultsSummary
    );

    await sendToolResultClientEmail(
      validated.user_email,
      validated.user_name,
      validated.tool_name,
      validated.user_phone
    );

    return { success: true };
  } catch (err) {
    console.error('Action error:', err);
    return { success: false, error: err instanceof Error ? err.message : "An unknown error occurred" };
  }
}
