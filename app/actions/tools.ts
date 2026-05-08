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

    // Send emails
    const resultsString = JSON.stringify(formData.results, null, 2);
    const resultsSummary = resultsString.length > 500 ? resultsString.substring(0, 500) + '...' : resultsString;

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
