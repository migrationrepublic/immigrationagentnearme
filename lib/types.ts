export * from "./types/booking";
export * from "./types/websiteLead";
export * from "./types/document";
export * from "./types/signature";
export * from "./types/toolLead";
export * from "./types/pdfjs";


export interface Plan {

  id: string;
  name: string;
  price_aud: number;
  duration_minutes: number;
  slug?: string;
  description?: string;
}


export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
  created_at: string;
}

export interface StripeEvent {
  id: string;
  created_at: string;
}
