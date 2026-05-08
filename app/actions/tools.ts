"use server";

import { supabaseServer } from '@/lib/supabase-server';
import { sendToolLeadAdminAlert, sendToolResultClientEmail } from '@/lib/email';

export async function submitToolLead(formData: {
  tool_name: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  results: any;
}) {
  try {
    const { data, error } = await supabaseServer
      .from('tool_submissions')
      .insert([
        {
          tool_name: formData.tool_name,
          user_name: formData.user_name,
          user_email: formData.user_email,
          user_phone: formData.user_phone,
          results: formData.results,
        },
      ]);

    if (error) {
      console.error('Error saving tool lead:', error);
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return { success: false, error: 'Database table missing. Please run tool_leads_schema.sql in Supabase.' };
      }
      return { success: false, error: error.message };
    }

function formatResultsToHTML(obj: any): string {
  if (!obj) return 'N/A';
  if (typeof obj !== 'object') return String(obj);
  
  if (Array.isArray(obj)) {
    return `<ul style="margin: 0; padding-left: 20px;">` + 
           obj.map(item => `<li style="margin-bottom: 8px;">${formatResultsToHTML(item)}</li>`).join('') + 
           `</ul>`;
  }

  let html = `<div style="display: flex; flex-direction: column; gap: 4px;">`;
  for (const [key, value] of Object.entries(obj)) {
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
    const resultsSummary = formatResultsToHTML(formData.results);

    await sendToolLeadAdminAlert(
      formData.user_name,
      formData.user_email,
      formData.user_phone,
      formData.tool_name,
      resultsSummary
    );

    await sendToolResultClientEmail(
      formData.user_email,
      formData.user_name,
      formData.tool_name
    );

    return { success: true };
  } catch (err: any) {
    console.error('Action error:', err);
    return { success: false, error: err.message };
  }
}
