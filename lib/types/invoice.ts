export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  invoice_id?: string;
  item_name: string;
  description?: string | null;
  quantity: number;
  rate: number;
  discount_percent: number;
  tax_percent: number;
  amount: number;
  sort_order?: number;
}

export interface InvoicePayment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  mode: string;
  reference_number?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;

  bill_to_name: string;
  bill_to_email: string;
  bill_to_phone?: string | null;
  bill_to_address?: string | null;

  booking_id?: string | null;

  status: InvoiceStatus;

  invoice_date: string;
  due_date: string;
  terms?: string | null;

  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  balance_due: number;

  notes?: string | null;
  stripe_session_id?: string | null;

  sent_at?: string | null;
  paid_at?: string | null;
  created_at?: string;
  updated_at?: string;

  // Joined relations (optional, populated by some queries)
  line_items?: InvoiceLineItem[];
  payments?: InvoicePayment[];
  bookings?: {
    id: string;
    date: string;
    time: string;
    plans?: { name: string } | null;
  } | null;
}

export interface InvoiceCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  default_rate: number;
  is_active?: boolean;
}

/** Input shape for creating/updating a line item from the admin UI form. */
export interface InvoiceLineItemInput {
  item_name: string;
  description?: string;
  quantity: number;
  rate: number;
  discount_percent: number;
  tax_percent: number;
}

/** Input shape for creating/updating an invoice from the admin UI form. */
export interface InvoiceInput {
  bill_to_name: string;
  bill_to_email: string;
  bill_to_phone?: string;
  bill_to_address?: string;
  booking_id?: string | null;
  status: InvoiceStatus;
  invoice_date: string;
  due_date: string;
  terms?: string;
  notes?: string;
  line_items: InvoiceLineItemInput[];
}
