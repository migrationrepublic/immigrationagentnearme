export type CustomerType = 'business' | 'individual';

export interface Customer {
  id: string;
  customer_type: CustomerType;

  salutation?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  company_name?: string | null;
  display_name: string;

  email?: string | null;
  work_phone?: string | null;
  mobile?: string | null;

  currency: string;
  language: string;

  source: 'manual' | 'booking';
  booking_id?: string | null;

  created_at?: string;
  updated_at?: string;

  // Computed client-side by CustomerService.listCustomers — not a DB column.
  receivables?: number;
  unused_credits?: number;
}

export interface CustomerInput {
  customer_type: CustomerType;
  salutation?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  display_name: string;
  email?: string;
  work_phone?: string;
  mobile?: string;
  language?: string;
}
