export interface WebsiteLead {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  source_url?: string;
  wordpress_form_id?: string;
  wordpress_lead_id?: string;
  status: 'new' | 'in_progress' | 'contacted' | 'converted' | 'junk' | 'closed';
  notes?: string;
  created_at: string;
  updated_at: string;
}
