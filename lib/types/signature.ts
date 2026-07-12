import { Document } from "./document";

export type SignatureStatus = "draft" | "sent" | "signed" | "expired" | "declined";

/** Minimal shape of a placed signature field stored in the database JSON column */
export interface PlacedFieldData {
  id: string;
  type: string;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  value?: string | boolean | null;
}

export interface SignatureRequest {
  id: string;
  document_id: string;
  signer_email: string;
  signer_name: string;
  token?: string;
  status: SignatureStatus;
  signature_url?: string;
  ip_address?: string;
  user_agent?: string;
  signed_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  document?: Document | null;
  documents?: Document | null;
  fields?: PlacedFieldData[];
  signing_order?: number;
  signing_message?: string | null;
}
