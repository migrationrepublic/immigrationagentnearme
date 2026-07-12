export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  visa_subclass?: string;
  /** The storage path of the uploaded PDF template file (in 'templates' bucket) */
  file_path?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentField {
  id: string;
  template_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'date' | 'number' | 'file' | 'select';
  is_required: boolean;
  options?: Record<string, unknown>;
  sort_order: number;
  /** The mapped AcroForm PDF field key (set via PDF Field Mapper) */
  pdf_field_name?: string;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus = "pending_review" | "approved" | "rejected";

export interface Document {
  id: string;
  client_id: string;
  template_id?: string;
  name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: DocumentStatus;
  rejection_reason?: string;
  field_values?: Record<string, string>;
  verified_by?: string;
  created_at: string;
  updated_at: string;
  templates?: DocumentTemplate | null;
}
